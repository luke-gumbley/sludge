SELECT 'DROP DATABASE ' || quote_ident(datname) || ';' FROM pg_database
	inner join pg_user on pg_database.datdba = pg_user.usesysid
	where usename = 'sludge_test'

\gexec
