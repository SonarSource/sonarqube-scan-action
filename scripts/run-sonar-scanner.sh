#!/usr/bin/env bash
set -euo pipefail

# run the sonar scanner cli
cmd=(${GITHUB_ACTION_PATH}/scripts/run-sonar-scanner-cli.sh "${INPUT_ARGS}")
"${cmd[@]}"
