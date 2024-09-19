#!/bin/bash

set -eo pipefail

if [[ "$RUNNER_OS" == "Windows" ]]; then
  SCANNER_BIN="sonar-scanner.bat"
else
  SCANNER_BIN="sonar-scanner"
fi

scanner_args=()
if [[ "$RUNNER_DEBUG" == '1' ]]; then
  scanner_args+=('--debug')
fi

if [[ -n "${INPUT_PROJECTBASEDIR}" ]]; then
  scanner_args+=("-Dsonar.projectBaseDir=${INPUT_PROJECTBASEDIR}")
fi

if [[ -n "${SONAR_ROOT_CERT}" ]]; then
  echo "Adding SSL certificate to the Scanner truststore"
  rm -f $RUNNER_TEMP/tmpcert.pem
  echo "${SONAR_ROOT_CERT}" > $RUNNER_TEMP/tmpcert.pem
  # Use keytool for now, as SonarQube 11.6 won't support openssl generated keystores
  # keytool require a password > 6 characters, so we wan't use the default password 'sonar'
  store_pass=changeit
  mkdir -p ~/.sonar/ssl
  keytool -storetype PKCS12 -keystore ~/.sonar/ssl/truststore.p12 -storepass $store_pass -noprompt -trustcacerts -importcert -alias sonar -file $RUNNER_TEMP/tmpcert.pem
  scanner_args+=("-Dsonar.scanner.truststorePassword=$store_pass")
fi

scanner_args+=("$@")

set -ux

$SCANNER_BIN "${scanner_args[@]}"

