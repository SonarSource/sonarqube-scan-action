#!/bin/bash


# Helper functions for coloring output.
blue="\\e[36m"
red="\\e[31m"
green="\\e[32m"
reset="\\e[0m"
info() { echo -e "${blue}$*${reset}"; }
error() { echo -e "${red}✗ $*${reset}"; }
success() { echo -e "${green}✔ $*${reset}"; }

# Helper function to check if SonarQube is up and running.
isUp=""
check_sq_is_up() {
  status="$(curl --silent --user admin:admin http://127.0.0.1:9000/api/system/status)"
  isUp="$(jq -r '.status' <<< "$status")"
}

# Helper function for tearing down in case of an error.
teardown() {
  docker rm -f sonarqube
}

info "Build scanner action..."
docker build --no-cache -t sonarsource/sonarqube-scan-action .
success "Scanner image built!"

info "Start local SonarQube..."
docker run -d -p 9000:9000 --name sonarqube sonarqube:8.9-community
if [[ ! $? -eq 0 ]]; then
  error "Couldn't start a local SonarQube instance!"
  teardown
  exit 1
fi

# Wait until SonarQube is up.
sleep 10
check_sq_is_up
until [[ "$isUp" == "UP" ]]; do
  printf '.'
  sleep 1
  check_sq_is_up
done
echo "" # new line
success "SonarQube is up and running!"

info "Generate a new token..."
tokenCall=$(curl --silent --user admin:admin -d "name=token" http://127.0.0.1:9000/api/user_tokens/generate)
token="$(jq -r '.token' <<< "$tokenCall")"
if [[ -z "$token" ]]; then
  error "Failed to generate a new token!"
  teardown
  exit 1
else
  success "New token generated!"
fi


info "Analyze project..."
cd it/example-project/
docker run -v `pwd`:/github/workspace/ --workdir /github/workspace --env SONAR_TOKEN=$token --env SONAR_HOST_URL='http://host.docker.internal:9000' sonarsource/sonarqube-scan-action
if [[ ! $? -eq 0 ]]; then
  error "Couldn't run the analysis!"
  teardown
  exit 1
fi

if [[ ! -f ".scannerwork/report-task.txt" ]]; then
  error "Couldn't find the report task file. Analysis failed."
  teardown
  exit 1
fi
success "Analysis successful!"
echo $taskUrl

info "Cleaning up..."
teardown
success "Everything's green!"
