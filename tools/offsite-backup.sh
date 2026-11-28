#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/bardasht-nextjs}
DB_BACKUP_DIR=${DB_BACKUP_DIR:-/home/ubuntu/db-backups}
CONFIG_FILE=${OFFSITE_BACKUP_CONFIG:-/home/ubuntu/.config/bardasht/offsite-backup.env}
LOCK_FILE=${OFFSITE_BACKUP_LOCK:-/home/ubuntu/.cache/bardasht-offsite-backup.lock}
MAX_DB_BACKUP_AGE=${MAX_DB_BACKUP_AGE:-93600}

umask 077
mkdir -p "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
flock -n 9 || { echo "An off-site backup is already running." >&2; exit 1; }

if [[ ! -r "$CONFIG_FILE" ]]; then
  echo "Missing backup configuration: $CONFIG_FILE" >&2
  exit 1
fi
# This mode-600 file contains only restic/S3 settings.
# shellcheck disable=SC1090
set -a
source "$CONFIG_FILE"
set +a
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD_FILE:?RESTIC_PASSWORD_FILE is required}"
if [[ "$RESTIC_REPOSITORY" == s3:* ]]; then
  : "${AWS_ACCESS_KEY_ID:?AWS_ACCESS_KEY_ID is required}"
  : "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"
fi

command -v restic >/dev/null
command -v gzip >/dev/null

latest_db=$(printf '%s\n' "$DB_BACKUP_DIR"/bardasht-*.sql.gz | sort | tail -n 1)
if [[ ! -f "$latest_db" ]]; then
  echo "No database backup found in $DB_BACKUP_DIR" >&2
  exit 1
fi
gzip -t "$latest_db"

now=$(date +%s)
mtime=$(stat -c %Y "$latest_db")
if (( now - mtime > MAX_DB_BACKUP_AGE )); then
  echo "Latest database backup is too old: $latest_db" >&2
  exit 1
fi

restic backup \
  --tag bardasht \
  --tag scheduled \
  "$latest_db" \
  "$APP_DIR/uploads" \
  "$APP_DIR/private_uploads"

restic forget \
  --tag bardasht \
  --keep-daily 30 \
  --keep-monthly 12 \
  --prune

restic check --read-data-subset=2%
echo "$(date --iso-8601=seconds) off-site backup completed"
