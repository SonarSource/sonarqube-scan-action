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

