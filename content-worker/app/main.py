import logging
from datetime import datetime, timezone

from apscheduler.schedulers.blocking import BlockingScheduler

from .config import BLOG_INTERVAL_HOURS, BLOG_SOURCES, NEWS_INTERVAL_HOURS, NEWS_SOURCES
from .worker import ContentWorker

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')


def run_pipeline(section, sources):
    if not sources:
        logging.info('%s source is not configured; skipped.', section)
        return
    worker = ContentWorker()
    try:
        for source in sources:
            worker.run_source(source, section)
    finally:
        worker.close()


def main():
    scheduler = BlockingScheduler(timezone='Asia/Tehran')
    scheduler.add_job(run_pipeline, 'interval', args=('news', NEWS_SOURCES), hours=NEWS_INTERVAL_HOURS, id='news', max_instances=1, coalesce=True)
    scheduler.add_job(run_pipeline, 'interval', args=('blog', BLOG_SOURCES), hours=BLOG_INTERVAL_HOURS, id='blog', max_instances=1, coalesce=True)
    run_pipeline('news', NEWS_SOURCES)
    run_pipeline('blog', BLOG_SOURCES)
    scheduler.start()


if __name__ == '__main__':
    main()
