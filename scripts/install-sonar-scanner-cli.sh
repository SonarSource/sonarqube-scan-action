#!/usr/bin/env bash

set -eou pipefail

# See https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables
#
# Script-specific variables required:
# - INPUT_SCANNERVERSION: e.g. 6.2.1.4610
# - INPUT_SCANNERBINARIESURL: e.g. https://github.com/me/my-repo/raw/refs/heads/main/binaries

if [[ "$RUNNER_OS" == "Linux" && "$RUNNER_ARCH" == "X64" ]]; then
     FLAVOR="linux-x64"
elif [[ "$RUNNER_OS" == "Linux" && "$RUNNER_ARCH" == "ARM64" ]]; then
     FLAVOR="linux-aarch64"
elif [[ "$RUNNER_OS" == "Windows" && "$RUNNER_ARCH" == "X64" ]]; then
     FLAVOR="windows-x64"
elif [[ "$RUNNER_OS" == "macOS" && "$RUNNER_ARCH" == "X64" ]]; then
     FLAVOR="macosx-x64"
elif [[ "$RUNNER_OS" == "macOS" && "$RUNNER_ARCH" == "ARM64" ]]; then
     FLAVOR="macosx-aarch64"
else
     echo "::error title=SonarScanner::$RUNNER_OS $RUNNER_ARCH not supported"
     exit 1
fi

set -x

mkdir -p $RUNNER_TEMP/sonarscanner
cd $RUNNER_TEMP/sonarscanner

SCANNER_FILE_NAME="sonar-scanner-cli-$INPUT_SCANNERVERSION-$FLAVOR.zip"
SCANNER_URI="${INPUT_SCANNERBINARIESURL%/}/$SCANNER_FILE_NAME"

if command -v wget &> /dev/null; then
    wget --no-verbose --user-agent=sonarqube-scan-action "$SCANNER_URI"
elif command -v curl &> /dev/null; then
    curl --fail --silent --show-error --user-agent sonarqube-scan-action \
         --location --output "$SCANNER_FILE_NAME" "$SCANNER_URI"
elif [ "$RUNNER_OS" == "Windows" ] && [ -t "C:\\msys64\\usr\\bin\\wget.exe" ]; then
    "C:\\msys64\\usr\\bin\\wget.exe" --no-verbose --user-agent=sonarqube-scan-action "$SCANNER_URI"
elif [ "$RUNNER_OS" == "Windows" ] && [ -t "C:\\msys64\\usr\\bin\\curl.exe" ]; then
    "C:\\msys64\\usr\\bin\\curl.exe" --fail --silent --show-error --user-agent sonarqube-scan-action \
         --location --output "$SCANNER_FILE_NAME" "$SCANNER_URI"
else
    echo "::error title=SonarScanner::Neither wget nor curl found on the machine"
    exit 1
fi

unzip -q -o $SCANNER_FILE_NAME

SCANNER_UNZIP_FOLDER="sonar-scanner-$INPUT_SCANNERVERSION-$FLAVOR"
# Folder name should correspond to the directory cached by the actions/cache
SCANNER_LOCAL_FOLDER="$RUNNER_TEMP/sonar-scanner-cli-$INPUT_SCANNERVERSION-$RUNNER_OS-$RUNNER_ARCH"

if [ -d "$SCANNER_LOCAL_FOLDER" ]; then
     echo "::warning title=SonarScanner::Cleaning existing scanner folder: $SCANNER_LOCAL_FOLDER"
     rm -rf "$SCANNER_LOCAL_FOLDER"
fi

mv -f "$SCANNER_UNZIP_FOLDER" "$SCANNER_LOCAL_FOLDER"
