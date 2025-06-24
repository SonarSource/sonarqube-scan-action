#!/usr/bin/env bash

source "$(dirname -- "$0")/utils.sh"

echo "Installation path is '${INSTALL_PATH}'"

test ! -z "${INSTALL_PATH}"
check_status "Empty installation path specified"

if [[ ! -e "${INSTALL_PATH}" ]]; then
  mkdir -p "${INSTALL_PATH}"
  check_status "Failed to create non-existing installation path '${INSTALL_PATH}'"
fi  

ABSOLUTE_INSTALL_PATH=$(realpath "${INSTALL_PATH}")
echo "Absolute installation path is '${ABSOLUTE_INSTALL_PATH}'"

test -d "${INSTALL_PATH}"
check_status "Installation path '${INSTALL_PATH}' is not a directory (absolute path is '${ABSOLUTE_INSTALL_PATH}')"

test -r "${INSTALL_PATH}"
check_status "Installation path '${INSTALL_PATH}' is not readable (absolute path is '${ABSOLUTE_INSTALL_PATH}')"

test -w "${INSTALL_PATH}"
check_status "Installation path '${INSTALL_PATH}' is not writeable (absolute path is '${ABSOLUTE_INSTALL_PATH}')"

