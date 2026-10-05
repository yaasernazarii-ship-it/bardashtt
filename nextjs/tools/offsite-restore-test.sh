#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE=${OFFSITE_BACKUP_CONFIG:-/home/ubuntu/.config/bardasht/offsite-backup.env}
WORK_DIR=$(mktemp -d /tmp/bardasht-restore-test.XXXXXX)
DB_NAME="bardasht_restore_test_$(date +%Y%m%d_%H%M%S)"
KEEP_TEST_DB=${KEEP_TEST_DB:-0}

cleanup() {
  if [[ "$KEEP_TEST_DB" != "1" ]]; then
    sudo -n -u postgres dropdb --if-exists "$DB_NAME" >/dev/null 2>&1 || true
  fi
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

umask 077
if [[ ! -r "$CONFIG_FILE" ]]; then
  echo "Missing backup configuration: $CONFIG_FILE" >&2
  exit 1
fi
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

restic restore latest --tag bardasht --target "$WORK_DIR"
latest_db=$(printf '%s\n' "$WORK_DIR"/home/ubuntu/db-backups/bardasht-*.sql.gz | sort | tail -n 1)
if [[ ! -f "$latest_db" ]]; then
  echo "No database dump exists in the restored snapshot." >&2
  exit 1
fi
gzip -t "$latest_db"

sudo -n -u postgres createdb "$DB_NAME"
gzip -dc "$latest_db" | sudo -n -u postgres psql --set ON_ERROR_STOP=1 --quiet --dbname "$DB_NAME"

table_count=$(sudo -n -u postgres psql --dbname "$DB_NAME" --tuples-only --no-align --command \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [[ ! "$table_count" =~ ^[0-9]+$ ]] || (( table_count < 1 )); then
  echo "Restore validation failed: no public tables found." >&2
  exit 1
fi

shopt -s nullglob globstar
upload_files=("$WORK_DIR/var/www/bardasht-nextjs/uploads"/**)
private_files=("$WORK_DIR/var/www/bardasht-nextjs/private_uploads"/**)
upload_count=0
private_count=0
for item in "${upload_files[@]}"; do [[ -f "$item" ]] && ((upload_count += 1)); done
for item in "${private_files[@]}"; do [[ -f "$item" ]] && ((private_count += 1)); done
printf 'Restore verified: database=%s tables=%s uploads=%s private_uploads=%s\n' \
  "$DB_NAME" "$table_count" "$upload_count" "$private_count"
