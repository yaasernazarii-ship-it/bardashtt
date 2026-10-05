#!/bin/bash
# بکاپ روزانه دیتابیس آموزشگاه تک برداشت
# نسخه‌های قدیمی‌تر از KEEP_DAYS روز خودکار پاک می‌شوند.
set -euo pipefail

ENV_FILE="/var/www/bardasht-nextjs/.env"
OUT_DIR="/home/ubuntu/db-backups"
KEEP_DAYS=14

mkdir -p "$OUT_DIR"

URL="$(grep -oP '(?<=^DATABASE_URL=")[^"]+' "$ENV_FILE")"
DB_USER="$(printf '%s' "$URL" | sed -E 's|^postgresql://([^:]+):.*|\1|')"
DB_PASS="$(printf '%s' "$URL" | sed -E 's|^postgresql://[^:]+:([^@]*)@.*|\1|')"
DB_HOST="$(printf '%s' "$URL" | sed -E 's|^postgresql://[^@]+@([^:/]+).*|\1|')"
DB_PORT="$(printf '%s' "$URL" | sed -E 's|^postgresql://[^@]+@[^:/]+:([0-9]+).*|\1|')"
DB_NAME="$(printf '%s' "$URL" | sed -E 's|^[^?]*/([^/?]+).*$|\1|')"

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/bardasht-$STAMP.sql.gz"

PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-acl \
  | gzip -9 > "$FILE.tmp"

# سلامت فایل فشرده را قبل از قبول کردن بررسی کن
gzip -t "$FILE.tmp"
mv "$FILE.tmp" "$FILE"

find "$OUT_DIR" -name 'bardasht-*.sql.gz' -type f -mtime "+$KEEP_DAYS" -delete
find "$OUT_DIR" -name 'bardasht-*.sql.gz.tmp' -type f -mmin +120 -delete

echo "$(date -Is) OK  $FILE  ($(du -h "$FILE" | cut -f1))  |  نسخه‌های موجود: $(find "$OUT_DIR" -name 'bardasht-*.sql.gz' | wc -l)"
