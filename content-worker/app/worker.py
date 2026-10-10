import hashlib
import json
import re
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin, urlparse

import feedparser
import httpx
import psycopg
from bs4 import BeautifulSoup
from PIL import Image

from .config import AUTO_PUBLISH, DATABASE_URL, GAPGPT_API_KEY, GAPGPT_BASE_URL, GAPGPT_MODEL, UPLOADS_DIR
from .prompts import CATEGORIES, blog_prompt, news_prompt

MAX_ARTICLE_CHARS = 18000


def is_article_url(source, section, url):
    parsed = urlparse(url)
    host = (parsed.hostname or '').lower()
    path = parsed.path.rstrip('/')
    if section == 'news':
        return path.startswith('/news/')
    if host.endswith('backstage.com'):
        return path.startswith('/magazine/article/')
    if host.endswith('studiobinder.com'):
        return path.startswith('/blog/')
    return False


class ContentWorker:
    def __init__(self):
        self.client = httpx.Client(timeout=30, follow_redirects=True, headers={'User-Agent': 'BardashtContentWorker/1.0'})
        self.db = psycopg.connect(DATABASE_URL)

    def close(self):
        self.client.close()
        self.db.close()

    def run_source(self, source, section):
        response = self.client.get(source.url)
        response.raise_for_status()
        if not source.permits(str(response.url)):
            raise ValueError('نشانی فهرست منبع خارج از دامنهٔ مجاز است.')
        feed = feedparser.parse(response.content)
        entries = [(entry.get('link', ''), entry.get('title', '')) for entry in feed.entries]
        if not entries:
            soup = BeautifulSoup(response.text, 'html.parser')
            entries = []
            for link in soup.find_all('a', href=True):
                url = urljoin(str(response.url), link['href'])
                title = link.get_text(' ', strip=True)
                if (
                    source.permits(url)
                    and is_article_url(source, section, url)
                    and url != str(response.url)
                    and len(title) >= 15
                    and '?' not in url
                    and '#' not in url
                ):
                    entries.append((url, title))
        for url, title in entries[:20]:
            if not source.permits(url) or not is_article_url(source, section, url):
                continue
            try:
                self.import_entry(source, section, url, title)
            except Exception as error:
                self.record_failure(source.name, section, url, str(error))

    def import_entry(self, source, section, url, fallback_title):
        digest = hashlib.sha256(url.encode()).hexdigest()
        with self.db.cursor() as cursor:
            cursor.execute('SELECT "status" FROM "ContentAutomationItem" WHERE "sourceHash" = %s', (digest,))
            existing = cursor.fetchone()
            if existing and existing[0] != 'failed':
                return
            if existing:
                cursor.execute('UPDATE "ContentAutomationItem" SET "status" = %s, "error" = NULL, "updatedAt" = NOW() WHERE "sourceHash" = %s', ('processing', digest))
            else:
                cursor.execute('INSERT INTO "ContentAutomationItem" ("id", "sourceHash", "sourceName", "sourceUrl", "section", "status", "createdAt", "updatedAt") VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())', (self.cuid(), digest, source.name, url, section, 'processing'))
            self.db.commit()

        title, article, image_url = self.fetch_article(source, url, fallback_title)
        messages = news_prompt(source.name, article) if section == 'news' else blog_prompt(source.name, article)
        generated = self.generate(messages)
        self.validate_generated(generated, section)
        cover = self.download_image(source, image_url, digest) if image_url else None
        post_id = self.cuid()
        slug = f'{section}-{digest[:16]}'
        tags = generated.get('tags', []) if section == 'blog' else []
        tags = ', '.join(tag.strip() for tag in tags if isinstance(tag, str) and tag.strip())[:500]
        with self.db.cursor() as cursor:
            cursor.execute(
                'INSERT INTO "Post" ("id", "title", "slug", "section", "category", "excerpt", "metaDescription", "tags", "body", "coverImage", "published", "createdAt", "updatedAt") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())',
                (post_id, generated['title'], slug, section, generated.get('category') if section == 'blog' else None, generated['excerpt'], generated['excerpt'], tags or None, generated['body'], cover, AUTO_PUBLISH),
            )
            cursor.execute('UPDATE "ContentAutomationItem" SET "postId" = %s, "status" = %s, "updatedAt" = NOW() WHERE "sourceHash" = %s', (post_id, 'published' if AUTO_PUBLISH else 'draft', digest))
        self.db.commit()

    def fetch_article(self, source, url, fallback_title):
        response = self.client.get(url)
        response.raise_for_status()
        if not source.permits(str(response.url)):
            raise ValueError('آدرس نهایی خارج از دامنهٔ مجاز منبع است.')
        soup = BeautifulSoup(response.text, 'html.parser')
        for element in soup(['script', 'style', 'nav', 'footer', 'aside', 'form']):
            element.decompose()
        title = (soup.find('meta', property='og:title') or {}).get('content') or soup.title.string if soup.title else fallback_title
        image = (soup.find('meta', property='og:image') or {}).get('content')
        body = soup.find('article') or soup.find('main') or soup.body
        paragraphs = [node.get_text(' ', strip=True) for node in body.find_all(['p', 'h2', 'h3', 'li'])]
        text = '\n'.join(part for part in paragraphs if len(part) > 30)[:MAX_ARTICLE_CHARS]
        if len(text) < 300:
            raise ValueError('متن کافی از منبع استخراج نشد.')
        return title.strip(), text, urljoin(url, image) if image else None

    def generate(self, messages):
        response = self.client.post(
            f'{GAPGPT_BASE_URL}/chat/completions',
            headers={'Authorization': f'Bearer {GAPGPT_API_KEY}'},
            json={'model': GAPGPT_MODEL, 'messages': messages, 'temperature': 0.4, 'response_format': {'type': 'json_object'}},
        )
        response.raise_for_status()
        try:
            return json.loads(response.json()['choices'][0]['message']['content'])
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
            raise ValueError('پاسخ مدل JSON معتبر نیست.') from error

    def validate_generated(self, item, section):
        for key, limit in [('title', 200), ('excerpt', 300), ('body', 20000)]:
            value = item.get(key)
            if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit:
                raise ValueError(f'خروجی {key} معتبر نیست.')
            item[key] = value.strip()
        if section == 'blog' and item.get('category') not in CATEGORIES:
            raise ValueError('دسته‌بندی مقاله معتبر نیست.')

    def download_image(self, source, url, digest):
        response = self.client.get(url)
        response.raise_for_status()
        if not source.permits(str(response.url)) or not response.headers.get('content-type', '').startswith('image/'):
            return None
        image = Image.open(BytesIO(response.content)).convert('RGB')
        image.thumbnail((1800, 1800))
        name = f'automation-{digest[:20]}.webp'
        path = Path(UPLOADS_DIR) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, 'WEBP', quality=85, method=6)
        return f'/media/{name}'

    def record_failure(self, source_name, section, url, error):
        digest = hashlib.sha256(url.encode()).hexdigest()
        with self.db.cursor() as cursor:
            cursor.execute('INSERT INTO "ContentAutomationItem" ("id", "sourceHash", "sourceName", "sourceUrl", "section", "status", "error", "createdAt", "updatedAt") VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW()) ON CONFLICT ("sourceHash") DO UPDATE SET "status" = EXCLUDED."status", "error" = EXCLUDED."error", "updatedAt" = NOW()', (self.cuid(), digest, source_name, url, section, 'failed', error[:1000]))
        self.db.commit()

    @staticmethod
    def cuid():
        return f'c{uuid.uuid4().hex}'
