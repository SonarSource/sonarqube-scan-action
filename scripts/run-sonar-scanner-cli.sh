#!/usr/bin/env bash

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
# Use keytool for now, as SonarQube 10.6 and below doesn't support openssl generated keystores
# keytool requires a password > 6 characters, so we won't use the default password 'sonar'
KEYTOOL_MAIN_CLASS=sun.security.tools.keytool.Main
SONAR_SSL_TRUSTSTORE_FILE="$SONAR_SSL_FOLDER/truststore.p12"
SONAR_SSL_TRUSTSTORE_PASSWORD=changeit

if [ -f "$SONAR_SSL_TRUSTSTORE_FILE" ]; then
  ALIAS_SONAR_IS_PRESENT=true

  "$SONAR_SCANNER_JRE/bin/java" "$KEYTOOL_MAIN_CLASS" \
    -storetype PKCS12 \
    -keystore "$SONAR_SSL_TRUSTSTORE_FILE" \
    -storepass "$SONAR_SSL_TRUSTSTORE_PASSWORD" \
    -noprompt \
    -trustcacerts \
    -list -v -alias sonar > /dev/null 2>&1 || {
      ALIAS_SONAR_IS_PRESENT=false
      echo "Existing Scanner truststore $SONAR_SSL_TRUSTSTORE_FILE does not contain 'sonar' alias"
    }

  if [[ $ALIAS_SONAR_IS_PRESENT == "true" ]]; then
    echo "Removing 'sonar' alias from already existing Scanner truststore: $SONAR_SSL_TRUSTSTORE_FILE"
    "$SONAR_SCANNER_JRE/bin/java" "$KEYTOOL_MAIN_CLASS" \
      -storetype PKCS12 \
      -keystore "$SONAR_SSL_TRUSTSTORE_FILE" \
      -storepass "$SONAR_SSL_TRUSTSTORE_PASSWORD" \
      -noprompt \
      -trustcacerts \
      -delete \
      -alias sonar
  fi
fi

if [[ -n "${SONAR_ROOT_CERT}" ]]; then
  echo "Adding SSL certificate to the Scanner truststore"
  rm -f $RUNNER_TEMP/tmpcert.pem
  echo "${SONAR_ROOT_CERT}" > $RUNNER_TEMP/tmpcert.pem
  mkdir -p "$SONAR_SSL_FOLDER"
  "$SONAR_SCANNER_JRE/bin/java" "$KEYTOOL_MAIN_CLASS" \
    -storetype PKCS12 \
    -keystore "$SONAR_SSL_TRUSTSTORE_FILE" \
    -storepass "$SONAR_SSL_TRUSTSTORE_PASSWORD" \
    -noprompt \
    -trustcacerts \
    -importcert \
    -alias sonar \
    -file "$RUNNER_TEMP/tmpcert.pem"
  scanner_args+=("-Dsonar.scanner.truststorePassword=$SONAR_SSL_TRUSTSTORE_PASSWORD")
fi

# split input args correctly (passed through INPUT_ARGS env var to avoid execution of injected command)
args=()
if [[ -n "${INPUT_ARGS}" ]]; then
#  the regex recognizes args with values in single or double quotes (without character escaping), and args without quotes as well
#  more specifically, the following patterns: -Darg="value", -Darg='value', -Darg=value, "-Darg=value" and '-Darg=value'
  IFS=$'\n'; args=($(echo ${INPUT_ARGS} | egrep -o '[^" '\'']+="[^"]*"|[^" '\'']+='\''[^'\'']*'\''|[^" '\'']+|"[^"]+"|'\''[^'\'']+'\'''))
fi

for arg in "${args[@]}"; do
  scanner_args+=("$arg")
done

set -ux

$SCANNER_BIN ${scanner_args[@]+"${scanner_args[@]}"}

