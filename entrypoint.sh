#!/bin/bash

set -e

if [[ -z "${SONAR_TOKEN}" ]]; then
  echo "============================ WARNING ============================"
  echo "Running this GitHub Action without SONAR_TOKEN is not recommended"
  echo "============================ WARNING ============================"
fi

if [[ -z "${SONAR_HOST_URL}" ]]; then
  echo "This GitHub Action requires the SONAR_HOST_URL env variable."
  exit 1
fi

if [[ -n "${SONAR_ROOT_CERT}" ]]; then
  echo "Adding custom root certificate to java certificate store"
  rm -f /tmp/tmpcert.pem
  echo "${SONAR_ROOT_CERT}" > /tmp/tmpcert.pem
  keytool -keystore /etc/ssl/certs/java/cacerts -storepass changeit -noprompt -trustcacerts -importcert -alias sonarqube -file /tmp/tmpcert.pem
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}pom.xml" ]]; then
  echo "Maven project detected. You should run the goal 'org.sonarsource.scanner.maven:sonar' during build rather than using this GitHub Action."
  exit 1
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}build.gradle" ]]; then
  echo "Gradle project detected. You should use the SonarQube plugin for Gradle during build rather than using this GitHub Action."
  exit 1
fi

unset JAVA_HOME

sonar-scanner -Dsonar.projectBaseDir="${INPUT_PROJECTBASEDIR}" ${INPUT_ARGS}

