#!/bin/bash

# Helper functions for coloring output.
info() { echo -e "\\e[36m$*\\e[0m"; }
error() { echo -e "\\e[31m✗ $*\\e[0m"; }
success() { echo -e "\\e[32m✔ $*\\e[0m"; }

# Helper function to check if SonarQube is up and running.
check_sq_is_up() {
  local statusCall="$(curl --silent --user admin:admin http://127.0.0.1:9000/api/system/status)"
  local status="$(jq -r '.status' <<< "$statusCall")"
  if [[ ! $? -eq 0 ]]; then
    error "Failed to check if SonarQube is up and running."
    exit 1
  fi
  echo $status;
}

_current_perm=$(stat -c "%u:%g" $(pwd))

info "Build scanner action..."
docker build --no-cache -t sonarsource/sonarqube-scan-action .
if [[ ! $? -eq 0 ]]; then
  error "Failed to build the scanner action."
  exit 1
fi
success "Scanner action built."

info "Find the network SonarQube is running on..."
network=$(docker network ls -f 'name=github_network' --format "{{.Name}}")
if [[ $network != "github_network_"* ]]; then
  error "Failed to find the local Docker network."
  exit 1
fi
success "Found the network ($network)."

info "Wait until SonarQube is up..."
sleep 10
isUp=$(check_sq_is_up)
until [[ "$isUp" == "UP" ]]; do
  sleep 1
  isUp=$(check_sq_is_up)
done
success "SonarQube is up and running."

info "Generate a new token..."
tokenCall=$(curl --silent --user admin:admin -d "name=token" http://127.0.0.1:9000/api/user_tokens/generate)
token="$(jq -r '.token' <<< "$tokenCall")"
if [[ -z "$token" ]]; then
  error "Failed to generate a new token."
  exit 1
fi
success "New token generated."

info "Test fail-fast if SONAR_TOKEN is omitted..."
docker run -v `pwd`:/github/workspace/ --workdir /github/workspace --network $network sonarsource/sonarqube-scan-action
if [[ $? -eq 0 ]]; then
  error "Should have failed fast."
  exit 1
fi
success "Correctly failed fast."

info "Test fail-fast if SONAR_HOST_URL is omitted..."
docker run -v `pwd`:/github/workspace/ --workdir /github/workspace --network $network --env SONAR_TOKEN=$token sonarsource/sonarqube-scan-action
if [[ $? -eq 0 ]]; then
  error "Should have failed fast."
  exit 1
fi
success "Correctly failed fast."

info "Test fail-fast on Gradle project..."
pushd test/gradle-project/
docker run -v `pwd`:/github/workspace/ --workdir /github/workspace --network $network --env SONAR_TOKEN=$token --env SONAR_HOST_URL='http://sonarqube:9000' sonarsource/sonarqube-scan-action
if [[ $? -eq 0 ]]; then
  error "Should have failed fast."
  exit 1
fi
popd
success "Correctly failed fast."

info "Test fail-fast on Maven project..."
pushd test/maven-project/
docker run -v `pwd`:/github/workspace/ --workdir /github/workspace --network $network --env SONAR_TOKEN=$token --env SONAR_HOST_URL='http://sonarqube:9000' sonarsource/sonarqube-scan-action
if [[ $? -eq 0 ]]; then
  error "Should have failed fast."
  exit 1
fi
popd
success "Correctly failed fast."

info "Analyze project..."
cd test/example-project/
docker run -v `pwd`:/github/workspace/ --workdir /github/workspace --network $network --env INPUT_PROJECTBASEDIR=/github/workspace --env SONAR_TOKEN=$token --env SONAR_HOST_URL='http://sonarqube:9000' sonarsource/sonarqube-scan-action
if [[ ! $? -eq 0 ]]; then
  error "Couldn't run the analysis."
  exit 1
elif [[ ! -f ".scannerwork/report-task.txt" ]]; then
  error "Couldn't find the report task file. Analysis failed."
  exit 1
elif [ ! "$(stat -c "%u:%g" ".scannerwork/report-task.txt")" == "$_current_perm" ]; then
  error "File permissions differ from desired once"
  error "desired: $_current_perm"
  error "actual: $(stat -c "%u:%g" ".scannerwork/report-task.txt")"
  exit 1
fi
success "Analysis successful."

echo "" # new line
echo "============================"
echo "" # new line
success "QA successful!"
