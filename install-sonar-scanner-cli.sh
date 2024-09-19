#!/bin/bash

set -eou pipefail

#See https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables

WGET=wget
if [[ "$RUNNER_OS" == "Linux" &&  "$RUNNER_ARCH" == "X64" ]]; then
     FLAVOR="linux-x64"
elif [[ "$RUNNER_OS" == "Linux" &&  "$RUNNER_ARCH" == "ARM64" ]]; then
     FLAVOR="linux-aarch64"
elif [[ "$RUNNER_OS" == "Windows" &&  "$RUNNER_ARCH" == "X64" ]]; then
     FLAVOR="windows-x64"
     WGET="C:\\msys64\\usr\\bin\\wget.exe"
elif [[ "$RUNNER_OS" == "macOS" &&  "$RUNNER_ARCH" == "X64" ]]; then
     FLAVOR="macosx-x64"
elif [[ "$RUNNER_OS" == "macOS" &&  "$RUNNER_ARCH" == "ARM64" ]]; then
     FLAVOR="macosx-aarch64"
else
     echo "$RUNNER_OS $RUNNER_ARCH not supported"
     exit 1
fi

set -x

mkdir -p $RUNNER_TEMP/sonarscanner
cd $RUNNER_TEMP/sonarscanner

$WGET --no-verbose --user-agent="sonarqube-scan-action" https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-$INPUT_SCANNERVERSION-$FLAVOR.zip

unzip -q sonar-scanner-cli-$INPUT_SCANNERVERSION-$FLAVOR.zip

# Folder name should correspond to the directory cached by the actions/cache
mv sonar-scanner-$INPUT_SCANNERVERSION-$FLAVOR $RUNNER_TEMP/sonar-scanner-cli-$INPUT_SCANNERVERSION-$RUNNER_OS-$RUNNER_ARCH
