# Disclaimer
This is a Zendesk maintained repository cloned from [SonarSource/sonarqube-scan-action](https://github.com/SonarSource/sonarqube-scan-action). This repository is not updated from upstreame master breanch, instead it is updated from the latest tag from the SonarSource/sonarqube-scan-action.

# Recommended Use within Zendesk
It is exepected that the Zendesk teams to use `sonarqube-scan-action` like below:
```
 - name: SonarQube Scan
        uses: zendesk/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONARQUBE_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONARQUBE_HOST }}
```

For details check upstream [README.md](https://github.com/SonarSource/sonarqube-scan-action/blob/master/README.md)