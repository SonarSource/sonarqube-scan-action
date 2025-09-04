#!/usr/bin/env bash

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
