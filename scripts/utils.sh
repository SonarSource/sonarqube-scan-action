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

check_status() {
  exit_status=$?
  if [ $exit_status -ne 0 ]; then
    echo "::error::$1"
    exit $exit_status
  fi
}

realpath() {
  case ${RUNNER_OS} in
    Windows)
      cygpath --absolute --windows "$1"
    ;;
    Linux)
      readlink -f "$1"
    ;;
    macOS)
      # installed by coreutils package
      greadlink -f "$1"
    ;;
  esac
}

