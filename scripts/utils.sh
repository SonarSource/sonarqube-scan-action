#!/usr/bin/env bash

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

