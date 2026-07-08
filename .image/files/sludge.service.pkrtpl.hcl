<<EOF
[Unit]
Description=Sludge application
After=postgresql.service
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=ubuntu
Environment=HOSTNAME=https://sludge.gumbl.es
Environment=WWW_ROOT=/var/www
Environment=DB_HOSTNAME=localhost
Environment=DB_NAME=sludge
Environment=DB_USERNAME=${username}
Environment=DB_PASSWORD=${password}
Environment=DB_PORT=5432
Environment=PORT=8080
Environment=COOKIE_SECURE=true
WorkingDirectory=/var/api
ExecStart=/home/ubuntu/.local/share/fnm/fnm exec --using v20.12.2 node ./index.js

[Install]
WantedBy=multi-user.target
EOF