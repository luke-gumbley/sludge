#!/bin/bash

# basis for this script:
# https://alexanderzeitler.com/articles/Fixing-Chrome-missing_subjectAltName-selfsigned-cert-openssl/

# hat tip here also:
# https://www.jamescoyle.net/how-to/1073-bash-script-to-create-an-ssl-certificate-key-and-request-csr

# more detailed reference:
# https://stackoverflow.com/questions/21297139/how-do-you-sign-a-certificate-signing-request-with-your-certification-authority/21340898#21340898

country=NZ
state=Wellington
locality=Kilbirnie
organization=Sludge
organizationalunit=Test
commonname=Sludge
email=luke@gumbl.es

node -e "console.log(crypto.randomBytes(33).toString('base64'));" > passphrase

openssl genrsa -des3 -out rootCA.key -passout file:passphrase 2048
openssl req -x509 -new -nodes -key rootCA.key -passin file:passphrase -sha256 -days 1024 -out rootCA.pem -subj "/C=$country/ST=$state/L=$locality/O=$organization/OU=$organizationalunit/CN=$commonname/emailAddress=$email"
openssl req -new -sha256 -nodes -out server.csr -newkey rsa:2048 -keyout server.key -config <( cat server.csr.cnf )
openssl x509 -req -in server.csr -CA rootCA.pem -CAkey rootCA.key -passin file:passphrase -CAcreateserial -out server.crt -days 500 -sha256 -extfile v3.ext
