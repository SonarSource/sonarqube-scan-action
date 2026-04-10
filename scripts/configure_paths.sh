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

if [[ ${ARCH} != "X64" && ! (${ARCH} == "ARM64" && (${OS} == "macOS" || ${OS} == "Linux")) ]]; then
  echo "::error::Architecture '${ARCH}' is unsupported by build-wrapper"
  exit 1
fi

case ${OS} in
  Windows)
    SONAR_SCANNER_SUFFIX="windows-x64"
    BUILD_WRAPPER_SUFFIX="win-x86"
    SONAR_SCANNER_NAME="sonar-scanner.bat"
    BUILD_WRAPPER_NAME="build-wrapper-win-x86-64.exe"
    SONAR_SCANNER_URL="${SONAR_SCANNER_URL_WINDOWS_X64}"
    SONAR_SCANNER_SHA="${SONAR_SCANNER_SHA_WINDOWS_X64}"
    ;;
  Linux)  
    case ${ARCH} in
      X64)
        SONAR_SCANNER_SUFFIX="linux-x64"
        BUILD_WRAPPER_SUFFIX="linux-x86"
        BUILD_WRAPPER_NAME="build-wrapper-linux-x86-64"
        SONAR_SCANNER_URL="${SONAR_SCANNER_URL_LINUX_X64}"
        SONAR_SCANNER_SHA="${SONAR_SCANNER_SHA_LINUX_X64}"
        ;;
      ARM64)
        SONAR_SCANNER_SUFFIX="linux-aarch64"
        BUILD_WRAPPER_SUFFIX="linux-aarch64"
        BUILD_WRAPPER_NAME="build-wrapper-linux-aarch64"
        SONAR_SCANNER_URL="${SONAR_SCANNER_URL_LINUX_AARCH64}"
        SONAR_SCANNER_SHA="${SONAR_SCANNER_SHA_LINUX_AARCH64}"
        ;;
    esac
    SONAR_SCANNER_NAME="sonar-scanner"
    ;;
  macOS)
    case ${ARCH} in
      X64)
        SONAR_SCANNER_SUFFIX="macosx-x64"
        SONAR_SCANNER_URL="${SONAR_SCANNER_URL_MACOSX_X64}"
        SONAR_SCANNER_SHA="${SONAR_SCANNER_SHA_MACOSX_X64}"
        ;;
      ARM64)
        SONAR_SCANNER_SUFFIX="macosx-aarch64"
        SONAR_SCANNER_URL="${SONAR_SCANNER_URL_MACOSX_AARCH64}"
        SONAR_SCANNER_SHA="${SONAR_SCANNER_SHA_MACOSX_AARCH64}"
        ;;
    esac
    BUILD_WRAPPER_SUFFIX="macosx-x86"
    SONAR_SCANNER_NAME="sonar-scanner"
    BUILD_WRAPPER_NAME="build-wrapper-macosx-x86"
    ;;
  *)
    echo "::error::Unsupported runner OS '${OS}'"
    exit 1
    ;;
esac


echo "sonar-scanner-url=${SONAR_SCANNER_URL}"
echo "sonar-scanner-sha=${SONAR_SCANNER_SHA}"

SONAR_SCANNER_DIR="${INSTALL_PATH}/sonar-scanner-${SONAR_SCANNER_VERSION}-${SONAR_SCANNER_SUFFIX}"
echo "sonar-scanner-dir=${SONAR_SCANNER_DIR}"
echo "sonar-scanner-bin=${SONAR_SCANNER_DIR}/bin/${SONAR_SCANNER_NAME}"

BUILD_WRAPPER_DIR="${INSTALL_PATH}/build-wrapper-${BUILD_WRAPPER_SUFFIX}"
echo "build-wrapper-url=${SONAR_HOST_URL%/}/static/cpp/build-wrapper-${BUILD_WRAPPER_SUFFIX}.zip"
echo "build-wrapper-dir=${BUILD_WRAPPER_DIR}"
echo "build-wrapper-bin=${BUILD_WRAPPER_DIR}/${BUILD_WRAPPER_NAME}"

