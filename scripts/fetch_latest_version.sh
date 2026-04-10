#!/usr/bin/env bash

# SonarQube Scan Action
# Copyright (C) SonarSource Sàrl
# mailto:contact AT sonarsource DOT com
#
# This program is free software; you can redistribute it and/or
# modify it under the terms of the GNU Lesser General Public
# License as published by the Free Software Foundation; either
# version 3 of the License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with this program; if not, write to the Free Software Foundation,
# Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

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
