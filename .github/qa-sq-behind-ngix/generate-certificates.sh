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

echo Generating client certificate...

# Generate Certificate Authority key
openssl genrsa \
    -passout pass:test42 \
    -des3 \
    -out ca.key 4096 \

# Generate Certificate Authority certificate
openssl req \
    -passin pass:test42 \
    -new \
    -x509 \
    -days 365 \
    -key ca.key \
    -out ca.crt \
    -subj "/C=CH/ST=Geneva/L=Geneva/O=CertificateAuthority/OU=ExpertDepartment"

# Generating Client certificate key
openssl genrsa \
    -passout pass:test42 \
    -des3 \
    -out user.key 4096

# Generating Client certificate certificate
openssl req \
    -passin pass:test42 \
    -new \
    -key user.key \
    -out user.csr \
    -subj "/C=CH/ST=Geneva/L=Geneva/O=UserOrg/OU=UserDepartment"

# Sign the certificate
openssl x509 \
    -passin pass:test42 \
    -req \
    -days 365 \
    -in user.csr \
    -CA ca.crt \
    -CAkey ca.key \
    -set_serial 01 \
    -out user.crt

# Generate a PKCS12 format certificate
openssl pkcs12 \
    -passin pass:test42 \
    -passout pass:test42 \
    -export \
    -out user.p12 \
    -inkey user.key \
    -in user.crt \
    -certfile ca.crt
