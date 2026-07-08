#!/bin/bash

: *.sql
previous_backup=$_

printf -v new_backup 'db_%(%Y-%m-%d_%H.%M.%S)T' -1

pg_dump --restrict-key=staticrestrictkey -d postgres://$sludge_db_app_username:$sludge_db_app_password@localhost/sludge -f "$new_backup.sql"

if cmp -s "$previous_backup" "$new_backup.sql"
then
    echo "no changes!"
    rm "$new_backup.sql"
else
    echo "DB changed, uploading..."
    rm "$previous_backup"
    tar -cJf "$new_backup.tar.xz" "$new_backup.sql"
    aws s3 cp "$new_backup.tar.xz" s3://$sludge_s3_bucket/
    rm "$new_backup.tar.xz"
fi