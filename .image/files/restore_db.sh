#!/bin/bash

IFS=$'\n'
backups=( $(aws s3 ls s3://$sludge_s3_bucket/ | sed -En "s/.+(db_.+)\.tar\.xz$/\1/p" | sort -r) )
latest_backup="${backups[0]}"
aws s3 cp "s3://$sludge_s3_bucket/$latest_backup.tar.xz" .
tar -xJf "$latest_backup.tar.xz"
rm "$latest_backup.tar.xz"
psql postgresql://$sludge_db_master_username:$sludge_db_master_password@localhost/postgres -c "drop database sludge"
psql postgresql://$sludge_db_master_username:$sludge_db_master_password@localhost/postgres -c "create database sludge"
psql postgresql://$sludge_db_master_username:$sludge_db_master_password@localhost/sludge -f "$latest_backup.sql"