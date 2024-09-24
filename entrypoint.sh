#!/bin/bash

set -eo pipefail

declare -a args=()

if [[ -z "${SONAR_TOKEN}" ]]; then
  echo "============================ WARNING ============================"
  echo "Running this GitHub Action without SONAR_TOKEN is not recommended"
  echo "============================ WARNING ============================"
fi

if [[ -n "${SONAR_ROOT_CERT}" ]]; then
  echo "Adding custom root certificate to the scanner truststore"
  rm -f /tmp/tmpcert.pem
  echo "${SONAR_ROOT_CERT}" > /tmp/tmpcert.pem
  # we can't use the default "sonar" password as keytool requires a password with at least 6 characters
  args+=("-Dsonar.scanner.truststorePassword=changeit")
  mkdir -p $SONAR_USER_HOME/ssl
  keytool -storetype PKCS12 -keystore $SONAR_USER_HOME/ssl/truststore.p12 -storepass changeit -noprompt -trustcacerts -importcert -alias sonarqube -file /tmp/tmpcert.pem
  # for older SQ versions < 10.6
  export SONAR_SCANNER_OPTS="${SONAR_SCANNER_OPTS:-} -Djavax.net.ssl.trustStore=$SONAR_USER_HOME/ssl/truststore.p12 -Djavax.net.ssl.trustStorePassword=changeit"
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}/pom.xml" ]]; then
  echo "WARNING! Maven project detected. Sonar recommends running the 'org.sonarsource.scanner.maven:sonar-maven-plugin:sonar' goal during the build process instead of using this GitHub Action
  to get more accurate results."
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}/build.gradle"  || -f "${INPUT_PROJECTBASEDIR%/}/build.gradle.kts" ]]; then
  echo "WARNING! Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action
  to get more accurate results."
fi


if [[ "$RUNNER_DEBUG" == '1' ]]; then
  args+=("--debug")
fi

unset JAVA_HOME

args+=("-Dsonar.projectBaseDir=${INPUT_PROJECTBASEDIR}")

sonar-scanner "${args[@]}" ${INPUT_ARGS}

