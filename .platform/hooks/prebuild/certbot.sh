#!/bin/bash

# Install certbot if not present
# (https://aws.amazon.com/blogs/compute/extending-amazon-linux-2-with-epel-and-lets-encrypt/)
if ! [ -x "$(command -v certbot)" ]; then
	amazon-linux-extras install -y epel
	yum install -y certbot.noarch
fi

# Add 12-hourly check for cert expiry, renew if old and reload nginx when successfully renewed
# (https://certbot.eff.org/lets-encrypt/pip-nginx)
if ! grep -q "certbot" /etc/crontab; then
	echo "0 0,12 * * * root node -e 'setTimeout(() => {}, Math.random() * 3600000)' && certbot renew -q --deploy-hook \"systemctl reload nginx.service\"" | tee -a /etc/crontab > /dev/null
fi

# Initial certbot call, only takes action if the cert is either expired or not present.
# (https://piratefache.ch/lets-encrypt-with-amazon-elastic-beanstalk/)
certbot certonly --standalone --debug --non-interactive --email luke.gumbley@gmail.com --agree-tos \
    -d sludge.gumbl.es --expand --renew-with-new-domains --deploy-hook "systemctl reload nginx.service"
