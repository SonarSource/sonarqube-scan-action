#!/usr/bin/env bash

source "$(dirname -- "$0")/utils.sh"

SONAR_SCANNER_VERSION=$(curl -sSL -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/SonarSource/sonar-scanner-cli/releases/latest | jq -r '.tag_name')
check_status "Failed to fetch latest sonar-scanner version from GitHub API"

echo "sonar-scanner-version=${SONAR_SCANNER_VERSION}"

for OS in windows linux macosx; do
  if [[ "$OS" == "windows" ]]; then
    ARCHS=("x64")
  else
    ARCHS=("x64" "aarch64")
  fi
  for ARCH in "${ARCHS[@]}"; do
    SONAR_SCANNER_URL="https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_SCANNER_VERSION}-${OS}-${ARCH}.zip"
    SONAR_SCANNER_SHA=$(curl -sSL "${SONAR_SCANNER_URL}.sha256")
    check_status "Failed to download ${OS} ${ARCH} sonar-scanner checksum from '${SONAR_SCANNER_URL}'"

    echo "sonar-scanner-url-${OS}-${ARCH}=${SONAR_SCANNER_URL}"
    echo "sonar-scanner-sha-${OS}-${ARCH}=${SONAR_SCANNER_SHA}"
  done
done
