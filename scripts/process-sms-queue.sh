#!/bin/sh
set -eu

APP_DIR="${APP_DIR:-/var/www/bardasht-nextjs}"
SECRET=$(/usr/bin/sed -n 's/^SMS_QUEUE_SECRET=//p' "$APP_DIR/.env" | /usr/bin/tail -n 1)
[ -n "$SECRET" ] || exit 1

exec /usr/bin/flock -n /tmp/bardasht-sms-queue.lock \
  /usr/bin/curl -fsS --max-time 55 -X POST \
  -H "Authorization: Bearer $SECRET" \
  http://127.0.0.1:3000/api/internal/sms-queue
