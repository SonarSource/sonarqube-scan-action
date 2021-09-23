# Scan your code with SonarQube [![QA](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa.yml/badge.svg)](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa.yml)

Using this GitHub Action, scan your code with [SonarQube](https://www.sonarqube.org/) to detects Bugs, Vulnerabilities and Code Smells in up to 27 programming languages!

<img src="./images/SonarQube-72px.png">

SonarQube is the leading product for Continuous Code Quality & Code Security. It supports most popular programming languages, including Java, JavaScript, TypeScript, C#, Python, C, C++, and many more.

## Requirements

To run an analysis on your code, you first need to set up your project on SonarQube. Your SonarQube instance must be accessible from GitHub, and you will need an access token to run the analysis (more information below under **Environment variables**).

Read more information on how to analyze your code [here](https://docs.sonarqube.org/latest/analysis/github-integration/).

## Usage

Project metadata, including the location to the sources to be analyzed, must be declared in the file `sonar-project.properties` in the base directory:

```properties
sonar.projectKey=<replace with the key generated when setting up the project on SonarQube>

# relative paths to source directories. More details and properties are described
# in https://docs.sonarqube.org/latest/project-administration/narrowing-the-focus/ 
sonar.sources=.
```

The workflow YAML file will usually look something like this:

```yaml
on:
  # Trigger analysis when pushing in master or pull requests, and when creating
  # a pull request. 
  push:
    branches:
      - master
  pull_request:
      types: [opened, synchronize, reopened]

name: Main Workflow
jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
      with:
        # Disabling shallow clone is recommended for improving relevancy of reporting
        fetch-depth: 0
    - name: SonarQube Scan
      uses: sonarsource/sonarqube-scan-action@master
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

If your source code file names contain special characters that are not covered by the locale range of `en_US.UTF-8`, you can configure your desired locale like this:

```yaml
    - name: SonarQube Scan
      uses: sonarsource/sonarqube-scan-action@master
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        LC_ALL: "ru_RU.UTF-8"
```

You can change the analysis base directory by using the optional input `projectBaseDir` like this:

```yaml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  with:
    projectBaseDir: app/src
```

In case you need to add additional analysis parameters, and you do not wish to set them in the `sonar-project.properties` file, you can use the `args` option:

```yaml
- name: SonarQube Scan
  uses: sonarsource/sonarqube-scan-action@master
  with:
    projectBaseDir: app/src
    args: >
      -Dsonar.python.coverage.reportPaths=coverage.xml
      -Dsonar.tests=tests/
      -Dsonar.verbose=true
```

More information about possible analysis parameters can be found in [the documentation](https://redirect.sonarsource.com/doc/analysis-parameters.html).

### Environment variables

- `SONAR_TOKEN` – **Required** this is the token used to authenticate access to SonarQube. You can read more about security tokens [here](https://docs.sonarqube.org/latest/user-guide/user-token/). You can set the `SONAR_TOKEN` environment variable in the "Secrets" settings page of your repository, or you can add them at the level of your GitHub organization (recommended).
- `SONAR_HOST_URL` – **Required** this tells the scanner where SonarQube is hosted. You can set the `SONAR_HOST_URL` environment variable in the "Secrets" settings page of your repository, or you can add them at the level of your GitHub organization (recommended).

## Alternatives for Java, .NET, and C/C++ projects

This GitHub Action will not work for all technologies. If you are in one of the following situations, you should use the following alternatives:

* Your code is built with Maven. Read the documentation about our [Scanner for Maven](https://redirect.sonarsource.com/doc/install-configure-scanner-maven.html).
* Your code is built with Gradle. Read the documentation about our [Scanner for Gradle](https://redirect.sonarsource.com/doc/gradle.html).
* You want to analyze a .NET solution. Read the documentation about our [Scanner for .NET](https://redirect.sonarsource.com/doc/install-configure-scanner-msbuild.html).
* You want to analyze C/C++ code. Read the documentation on [analyzing C/C++ code](https://docs.sonarqube.org/latest/analysis/languages/cfamily/).

## Have question or feedback?

To provide feedback (requesting a feature or reporting a bug) please post on the [SonarSource Community Forum](https://community.sonarsource.com/tags/c/help/sq/github-actions).

## License

The Dockerfile and associated scripts and documentation in this project are released under the LGPLv3 License.

Container images built with this project include third party materials.
