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

VERIFY_CORRECTNESS=false

help() {
  cat <<EOF
Usage: ./download [-v]
-h              Display help
-v              Verify correctness of a download with SHA256 checksum; Optional
EOF
}

parse_arguments() {
  while getopts "hv" arg; do
    case $arg in
    v)
      VERIFY_CORRECTNESS=true
      echo "Verify correctness is set to true"
      ;;
    ?)
      help
      exit 0
      ;;
    esac
  done
}

verify_download_correctness() {
  echo "${EXPECTED_SHA} ${TMP_ZIP_PATH}" | sha256sum -c -
  check_status "Checking sha256 failed"
}

download() {
  echo "Downloading '${DOWNLOAD_URL}'"
  mkdir -p "${INSTALL_PATH}"
  check_status "Failed to create ${INSTALL_PATH}"
  curl -sSLo "${TMP_ZIP_PATH}" "${DOWNLOAD_URL}"
  check_status "Failed to download '${DOWNLOAD_URL}'"
}

decompress() {
  echo "Decompressing"
  unzip -o -d "${INSTALL_PATH}" "${TMP_ZIP_PATH}"
  check_status "Failed to unzip the archive into '${INSTALL_PATH}'"
}

####################################################################################

echo "::group::Download ${DOWNLOAD_URL}"
parse_arguments $@
download
if [ "$VERIFY_CORRECTNESS" = true ]; then
  verify_download_correctness
fi
decompress
echo "::endgroup::"
