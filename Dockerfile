FROM sonarsource/sonar-scanner-cli:5.0.1

LABEL version="2.0.1" \
      repository="https://github.com/sonarsource/sonarqube-scan-action" \
      homepage="https://github.com/sonarsource/sonarqube-scan-action" \
      maintainer="SonarSource" \
      com.github.actions.name="SonarQube Scan" \
      com.github.actions.description="Scan your code with SonarQube to detect Bugs, Vulnerabilities and Code Smells in up to 27 programming languages!" \
      com.github.actions.icon="check" \
      com.github.actions.color="green"

COPY --chmod=755 entrypoint.sh /entrypoint.sh
COPY --chmod=755 cleanup.sh /cleanup.sh
ENTRYPOINT ["/entrypoint.sh"]
