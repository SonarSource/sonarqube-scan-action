#!/bin/bash

set -e

if [[ -z "${SONAR_TOKEN}" ]]; then
  echo "============================ WARNING ============================"
  echo "Running this GitHub Action without SONAR_TOKEN is not recommended"
  echo "============================ WARNING ============================"
fi

if [[ -n "${SONAR_ROOT_CERT}" ]]; then
  echo "Adding custom root certificate to java certificate store"
  rm -f /tmp/tmpcert.pem
  echo "${SONAR_ROOT_CERT}" > /tmp/tmpcert.pem
  keytool -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt -trustcacerts -importcert -alias sonarqube -file /tmp/tmpcert.pem
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

sonar-scanner $debug_flag -Dsonar.projectBaseDir=${INPUT_PROJECTBASEDIR} ${INPUT_ARGS}

