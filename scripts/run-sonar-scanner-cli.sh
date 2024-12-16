#!/bin/bash

set -eo pipefail

if [[ "$RUNNER_OS" == "Windows" ]]; then
  SCANNER_BIN="sonar-scanner.bat"
else
  SCANNER_BIN="sonar-scanner"
fi

scanner_args=()
if [[ ${SONARCLOUD_URL} ]]; then
  scanner_args+=("-Dsonar.scanner.sonarcloudUrl=${SONARCLOUD_URL}")
fi

if [[ "$RUNNER_DEBUG" == '1' ]]; then
  scanner_args+=('--debug')
fi

if [[ -n "${INPUT_PROJECTBASEDIR}" ]]; then
  scanner_args+=("-Dsonar.projectBaseDir=${INPUT_PROJECTBASEDIR}")
fi

# The SSL folder may exist on an uncleaned self-hosted runner
SONAR_SSL_FOLDER=~/.sonar/ssl
if [ -d "$SONAR_SSL_FOLDER" ]; then
  echo "::warning title=SonarScanner::Cleaning existing SSL folder: $SONAR_SSL_FOLDER"
  rm -rf "$SONAR_SSL_FOLDER"
fi

if [[ -n "${SONAR_ROOT_CERT}" ]]; then
  echo "Adding SSL certificate to the Scanner truststore"
  rm -f $RUNNER_TEMP/tmpcert.pem
  echo "${SONAR_ROOT_CERT}" > $RUNNER_TEMP/tmpcert.pem
  # Use keytool for now, as SonarQube 10.6 and below doesn't support openssl generated keystores
  # keytool require a password > 6 characters, so we wan't use the default password 'sonar'
  store_pass=changeit
  mkdir -p "$SONAR_SSL_FOLDER"
  $SONAR_SCANNER_JRE/bin/java sun.security.tools.keytool.Main -storetype PKCS12 -keystore $SONAR_SSL_FOLDER/truststore.p12 -storepass $store_pass -noprompt -trustcacerts -importcert -alias sonar -file $RUNNER_TEMP/tmpcert.pem
  scanner_args+=("-Dsonar.scanner.truststorePassword=$store_pass")
fi

scanner_args+=("$@")

set -ux

$SCANNER_BIN "${scanner_args[@]}"

