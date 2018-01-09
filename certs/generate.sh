#!/bin/bash

#https://alexanderzeitler.com/articles/Fixing-Chrome-missing_subjectAltName-selfsigned-cert-openssl/

node -e "console.log(crypto.randomBytes(33).toString('base64'));" > passphrase

openssl genrsa -des3 -out ca.key -passout file:passphrase 1024
openssl req -new -key ca.key -out ca.csr -passin file:passphrase \
    -config <( cat ./server.csr.cnf )
openssl x509 -req -days 365 -in ca.csr -out ca.crt -signkey ca.key -extfile v3.ext -passin file:passphrase

openssl genrsa -des3 -out server.key -passout file:passphrase 1024
openssl req -new -key server.key -out server.csr -passin file:passphrase \
    -config <( cat ./server.csr.cnf )
openssl rsa -in server.key -out server.key -passin file:passphrase
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt -extfile v3.ext
