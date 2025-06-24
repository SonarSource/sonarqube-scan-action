#!/usr/bin/env bash

if [[ -n "${SONAR_ROOT_CERT}" ]]; then
  echo "Adding custom root certificate to java certificate store"
  rm -f /tmp/tmpcert.pem
  echo "${SONAR_ROOT_CERT}" > /tmp/tmpcert.pem
  keytool -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt -trustcacerts -importcert -alias sonarqube -file /tmp/tmpcert.pem
fi
