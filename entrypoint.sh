#!/bin/bash

set -e

if [[ -z "${SONAR_TOKEN}" ]]; then
  echo "============================ WARNING ============================"
  echo "Running this GitHub Action without SONAR_TOKEN is not recommended"
  echo "============================ WARNING ============================"
fi

trust_store_pass_param=''
if [[ -n "${SONAR_ROOT_CERT}" ]]; then
  echo "Adding custom certificate"

  trust_store_pass="changeit"
  trust_store_pass_param="-Dsonar.scanner.truststorePassword=${trust_store_pass}"

  rm -f /tmp/tmpcert.pem
  echo "${SONAR_ROOT_CERT}" > /tmp/tmpcert.pem

  rm -f /opt/sonar-scanner/.sonar/ssl/truststore.p12
  mkdir -p /opt/sonar-scanner/.sonar/ssl
  openssl pkcs12 -export -nokeys -in /tmp/tmpcert.pem -out /opt/sonar-scanner/.sonar/ssl/truststore.p12 --passout pass:${trust_store_pass}
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}/pom.xml" ]]; then
  echo "WARNING! Maven project detected. Sonar recommends running the 'org.sonarsource.scanner.maven:sonar-maven-plugin:sonar' goal during the build process instead of using this GitHub Action
  to get more accurate results."
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}/build.gradle"  || -f "${INPUT_PROJECTBASEDIR%/}/build.gradle.kts" ]]; then
  echo "WARNING! Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action
  to get more accurate results."
fi

debug_flag=''
if [[ "$RUNNER_DEBUG" == '1' ]]; then
  debug_flag='--debug'
fi

unset JAVA_HOME

sonar-scanner $debug_flag $trust_store_pass_param -Dsonar.projectBaseDir=${INPUT_PROJECTBASEDIR} ${INPUT_ARGS}

