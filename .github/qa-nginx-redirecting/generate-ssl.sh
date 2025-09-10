#!/bin/bash

# Generate self-signed SSL certificate for localhost with 1-day expiry
openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
  -keyout nginx.key \
  -out nginx.crt \
  -subj "/C=US/ST=CA/L=Local/O=Test/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "SSL certificates generated with 1-day expiry: nginx.crt and nginx.key"