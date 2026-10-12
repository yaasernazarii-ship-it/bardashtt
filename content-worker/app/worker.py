import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin, urlparse

import feedparser
import httpx
import psycopg
from bs4 import BeautifulSoup
from PIL import Image

from .config import ARTICLE_API_URL, AUTO_PUBLISH, DATABASE_URL, GAPGPT_API_KEY, GAPGPT_BASE_URL, GAPGPT_MODEL, PUBLISH_SPACING_MINUTES, UPLOADS_DIR, VERIFIED_BRAND_NOTES
from .prompts import CATEGORIES, blog_prompt, news_prompt

MAX_ARTICLE_CHARS = 18000
DEFAULT_IMAGE_ALT = 'تصویر مرتبط با خدمات آموزشی و هنری خانه برداشت'


def slugify(value):
    slug = re.sub(r'[^a-z0-9آ-ی]+', '-', value.lower()).strip('-')
    if len(slug) < 3:
        raise ValueError('اسلاگ معتبر نیست.')
    return slug[:80]


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
        generated = self.generate_with_article_api(section, source.name, url, title, article, messages)
        if not isinstance(generated.get('image_alt'), str) or not generated['image_alt'].strip():
            generated['image_alt'] = DEFAULT_IMAGE_ALT
        self.validate_generated(generated, section)
        cover = self.download_image(source, image_url, digest) if image_url else None
        post_id = self.cuid()
        slug = f"{slugify(generated['slug'])}-{digest[:8]}"
        tags = generated.get('tags', []) if section == 'blog' else []
        tags = ', '.join(tag.strip() for tag in tags if isinstance(tag, str) and tag.strip())[:500]
        publish_at = None
        if AUTO_PUBLISH:
            with self.db.cursor() as cursor:
                cursor.execute('SELECT MAX("publishAt") FROM "Post" WHERE "published" = true AND "publishAt" >= NOW()')
                last_publish_at = cursor.fetchone()[0]
            publish_at = max(datetime.now(timezone.utc), last_publish_at or datetime.now(timezone.utc)) + timedelta(minutes=PUBLISH_SPACING_MINUTES)
        with self.db.cursor() as cursor:
            cursor.execute(
                'INSERT INTO "Post" ("id", "title", "slug", "section", "category", "excerpt", "metaTitle", "metaDescription", "tags", "body", "coverImage", "imageAlt", "sourceName", "sourceReferenceUrl", "faq", "published", "publishAt", "createdAt", "updatedAt") VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())',
                (post_id, generated['title'], slug, section, generated.get('category') if section == 'blog' else None, generated['excerpt'], generated['meta_title'], generated['meta_description'], tags or None, generated['body'], cover, generated['image_alt'], source.name, url, json.dumps(generated['faq'], ensure_ascii=False), AUTO_PUBLISH, publish_at),
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

    def generate_with_article_api(self, section, source_name, source_url, title, article, fallback_messages):
        payload = {
            'content_type': 'news_analysis' if section == 'news' else 'educational_guide',
            'topic': title[:150],
            'focus_keyword': title[:80],
            'verified_brand_notes': VERIFIED_BRAND_NOTES or None,
            'allowed_categories': list(CATEGORIES) if section == 'blog' else [],
        }
        if section == 'news':
            payload['news_context'] = {
                'source_name': source_name,
                'source_url': source_url,
                'raw_news_summary': article,
            }
        else:
            payload['news_context'] = None

        try:
            response = self.client.post(ARTICLE_API_URL, json=payload)
            response.raise_for_status()
            return self.adapt_article_response(response.json(), section)
        except Exception as error:
            logging.warning('سرویس مقاله در دسترس نبود؛ از موتور قبلی استفاده شد: %s', error)
            return self.generate(fallback_messages)

    @staticmethod
    def adapt_article_response(article, section):
        body = article.get('content_markdown', '').strip()
        title = article.get('title', '').strip()
        meta_description = article.get('meta_description', '').strip()
        slug = article.get('slug', '').strip()
        faq_items = article.get('faq_items', [])
        faq = [{'q': item.get('question', '').strip(), 'a': item.get('answer', '').strip()} for item in faq_items if isinstance(item, dict)]
        excerpt = re.sub(r'[#*_>`]', '', body).replace('\n', ' ').strip()[:300]
        result = {
            'title': title,
            'slug': slug,
            'meta_title': title[:40],
            'meta_description': meta_description,
            'excerpt': excerpt,
            'image_alt': DEFAULT_IMAGE_ALT,
            'body': body,
            'faq': faq,
            'tags': article.get('tags', []),
            'category': article.get('category'),
        }
        if section == 'blog' and result['category'] not in CATEGORIES:
            raise ValueError('دسته‌بندی خروجی سرویس مقاله معتبر نیست.')
        return result

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
        for key, limit in [('title', 200), ('excerpt', 300), ('body', 20000), ('slug', 100), ('meta_title', 40), ('image_alt', 160)]:
            value = item.get(key)
            if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit:
                raise ValueError(f'خروجی {key} معتبر نیست.')
            item[key] = value.strip()
        meta_description = item.get('meta_description')
        if not isinstance(meta_description, str) or not 80 <= len(meta_description.strip()) <= 200:
            raise ValueError('خروجی meta_description معتبر نیست.')
        item['meta_description'] = meta_description.strip()
        faq = item.get('faq')
        if not isinstance(faq, list) or len(faq) != 3 or any(not isinstance(entry, dict) or not isinstance(entry.get('q'), str) or not isinstance(entry.get('a'), str) or not entry['q'].strip() or not entry['a'].strip() for entry in faq):
            raise ValueError('خروجی faq معتبر نیست.')
        item['faq'] = [{'q': entry['q'].strip()[:240], 'a': entry['a'].strip()[:500]} for entry in faq]
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
