#!/usr/bin/env bash

set -eo pipefail

if [[ ! "${INPUT_SCANNERVERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "::error title=SonarScanner::Invalid scannerVersion format. Expected format: x.y.z.w (e.g., 7.1.0.4889)"
  exit 1
fi

if [[ -z "${SONAR_TOKEN}" ]]; then
  echo "::warning title=SonarScanner::Running this GitHub Action without SONAR_TOKEN is not recommended"
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}/pom.xml" ]]; then
  echo "::warning title=SonarScanner::Maven project detected. Sonar recommends running the 'org.sonarsource.scanner.maven:sonar-maven-plugin:sonar' goal during the build process instead of using this GitHub Action
  to get more accurate results."
fi

if [[ -f "${INPUT_PROJECTBASEDIR%/}/build.gradle"  || -f "${INPUT_PROJECTBASEDIR%/}/build.gradle.kts" ]]; then
  echo "::warning title=SonarScanner::Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action
  to get more accurate results."
fi

