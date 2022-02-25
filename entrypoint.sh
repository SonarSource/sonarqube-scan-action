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

if [[ -f "${INPUT_PROJECTBASEDIR%/}pom.xml" ]]; then
  echo "Maven project detected. You should run the goal 'org.sonarsource.scanner.maven:sonar' during build rather than using this GitHub Action."
  exit 1
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}build.gradle" ]]; then
  echo "Gradle project detected. You should use the SonarQube plugin for Gradle during build rather than using this GitHub Action."
  exit 1
fi

unset JAVA_HOME

sonar-scanner -Dsonar.projectBaseDir=${INPUT_PROJECTBASEDIR} ${INPUT_ARGS}

_tmp_file=$(ls "${INPUT_PROJECTBASEDIR}/" | head -1)
PERM=$(stat -c "%u:%g" "${INPUT_PROJECTBASEDIR}/$_tmp_file")

chown -R $PERM "${INPUT_PROJECTBASEDIR}/"
