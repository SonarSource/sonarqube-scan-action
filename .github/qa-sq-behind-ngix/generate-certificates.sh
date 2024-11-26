#!/bin/sh

set -eux

echo Generating server certificate...

openssl req \
    -newkey rsa:4096 \
    -x509 \
    -sha256 \
    -addext "subjectAltName = DNS:localhost" \
    -days 3650 \
    -nodes \
    -out server.crt \
    -subj "/C=CH/ST=Geneva/L=Geneva/O=Server/OU=Dept" \
    -keyout server.key

echo Generating CA certificate...

# Generate Certificate Authority key
openssl genrsa \
    -passout pass:test42 \
    -des3 \
    -out ca.key 4096 \

