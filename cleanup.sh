#!/bin/bash

set -e

# Reset all files permissions to the default Runner user and group to allow the follow up steps (mainly cache) to access all files.

# Assume that the first (non-hidden) file in the project directory is one from the project, and not one written by the scanner
_tmp_file=$(ls "${INPUT_PROJECTBASEDIR%/}/" | head -1)
echo "Reading permissions from $_tmp_file"
PERM=$(stat -c "%u:%g" "${INPUT_PROJECTBASEDIR%/}/$_tmp_file")

echo "Applying permissions $PERM to all files in the project base directory"
chown -R $PERM "${INPUT_PROJECTBASEDIR%/}/"