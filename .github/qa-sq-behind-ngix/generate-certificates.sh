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

# Generate Certificate Authority certificate
openssl req \
    -passin pass:test42 \
    -new \
    -x509 \
    -days 365 \
    -key ca.key \
    -out ca.crt \
    -subj "/C=CH/ST=Geneva/L=Geneva/O=CertificateAuthority/OU=ExpertDepartment"
