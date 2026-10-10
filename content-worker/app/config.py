import json
import os
from dataclasses import dataclass
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Source:
    name: str
    url: str
    allowed_hosts: tuple[str, ...]

    def permits(self, url: str) -> bool:
        host = (urlparse(url).hostname or '').lower()
        return bool(host) and any(host == allowed or host.endswith(f'.{allowed}') for allowed in self.allowed_hosts)


def sources(name: str) -> tuple[Source, ...]:
    raw = os.getenv(name, '[]')
    try:
        entries = json.loads(raw)
    except json.JSONDecodeError as error:
        raise RuntimeError(f'{name} باید JSON معتبر باشد.') from error
    result = []
    for item in entries:
        source = Source(item['name'], item['url'], tuple(host.lower() for host in item['allowed_hosts']))
        if not source.url.startswith(('https://', 'http://')) or not source.allowed_hosts:
            raise RuntimeError(f'تنظیم منبع {source.name} معتبر نیست.')
        result.append(source)
    return tuple(result)


DATABASE_URL = os.environ['DATABASE_URL']
GAPGPT_BASE_URL = (os.getenv('GAPGPT_BASE_URL') or os.getenv('AI_BASE_URL') or 'https://api.gapgpt.app/v1').rstrip('/')
GAPGPT_API_KEY = os.getenv('GAPGPT_API_KEY') or os.environ['AI_API_KEY']
GAPGPT_MODEL = os.getenv('GAPGPT_MODEL') or os.getenv('AI_CHAT_MODEL') or 'gpt-4o-mini'
AUTO_PUBLISH = os.getenv('AUTO_PUBLISH', 'false').lower() == 'true'
NEWS_INTERVAL_HOURS = int(os.getenv('NEWS_INTERVAL_HOURS', '2'))
BLOG_INTERVAL_HOURS = int(os.getenv('BLOG_INTERVAL_HOURS', '12'))
NEWS_SOURCES = sources('NEWS_FEEDS_JSON')
BLOG_SOURCES = sources('BLOG_FEEDS_JSON')
UPLOADS_DIR = os.getenv('UPLOADS_DIR', '/app/site-uploads')
