# Scan your code with SonarQube [![QA](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa.yml/badge.svg)](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa.yml)

This SonarSource project, available as a GitHub Action, scans your projects with SonarQube [Server](https://www.sonarsource.com/products/sonarqube/) or [Cloud](https://www.sonarsource.com/products/sonarcloud/).

![Logo](./images/SQ_Logo_Server_Cloud_Dark_Backgrounds.png#gh-dark-mode-only)
![Logo](./images/SQ_Logo_Server_Cloud_Light_Backgrounds.png#gh-light-mode-only)

SonarQube [Server](https://www.sonarsource.com/products/sonarqube/) and [Cloud](https://www.sonarsource.com/products/sonarcloud/) (formerly SonarQube and SonarCloud) is a widely used static analysis solution for continuous code quality and security inspection.

It helps developers detect coding issues in 30+ languages, frameworks, and IaC platforms, including Java, JavaScript, TypeScript, C#, Python, C, C++, and [many more](https://www.sonarsource.com/knowledge/languages/).

The solution also provides fix recommendations leveraging AI with Sonar's AI CodeFix capability.

> [!NOTE]  
> This action now supports and is the official entrypoint for scanning C, C++, Objective-C and Dart projects via GitHub actions.

## Requirements

### Server

To run an analysis on your code, you first need to set up your project on SonarQube Server. Your SonarQube Server instance must be accessible from GitHub, and you will need an access token to run the analysis (more information below under **Environment variables**).

Read more information on how to analyze your code [here](https://docs.sonarsource.com/sonarqube-server/latest/devops-platform-integration/github-integration/introduction/).

### Cloud

* Create your account on SonarQube Cloud. [Sign up for free](https://www.sonarsource.com/products/sonarcloud/signup/?utm_medium=referral&utm_source=github&utm_campaign=sc-signup&utm_content=signup-sonarcloud-listing-x-x&utm_term=ww-psp-x) now if it's not already the case!
* The repository to analyze is set up on SonarQube Cloud. [Set it up](https://sonarcloud.io/projects/create) in just one click.

## Usage

Project metadata, including the location of the sources to be analyzed, must be declared in the file `sonar-project.properties` in the base directory:

### Server

```properties
sonar.projectKey=<replace with the key generated when setting up the project on SonarQube Server>

# relative paths to source directories. More details and properties are described
# at https://docs.sonarsource.com/sonarqube-server/latest/project-administration/analysis-scope/ 
sonar.sources=.
```

The workflow, usually declared under `.github/workflows`, looks like the following:
- for projects **not** written in C, C++, and Objective-C
- and for projects written in C, C++, and Objective-C and using [AutoConfig](https://docs.sonarsource.com/sonarqube-server/latest/analyzing-source-code/languages/c-family/analysis-modes/#choosing-the-right-analysis-mode)

```yaml
on:
  # Trigger analysis when pushing to your main branches, and when creating a pull request.
  push:
    branches:
      - main
      - master
      - develop
      - 'releases/**'
  pull_request:
      types: [opened, synchronize, reopened]

name: Main Workflow
jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        # Disabling shallow clones is recommended for improving the relevancy of reporting
        fetch-depth: 0
    - name: SonarQube Scan
      uses: sonarsource/sonarqube-scan-action@<action version> # Ex: v4.1.0, See the latest version at https://github.com/marketplace/actions/official-sonarqube-scan
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }}
```

For C, C++ and Objective-C projects not using AutoConfig, the workflow requires additional steps to download the Build Wrapper and invoking it:

```yaml
# Trigger analysis when pushing to your main branches, and when creating a pull request.
  push:
    branches:
      - main
      - master
      - develop
      - 'releases/**'
  pull_request:
      types: [opened, synchronize, reopened]

name: Main Workflow
jobs:
  sonarqube:
    runs-on: ubuntu-latest
    env:
      BUILD_WRAPPER_OUT_DIR: build_wrapper_output_directory # Directory where build-wrapper output will be placed
    steps:
    - uses: actions/checkout@v4
      with:
        # Disabling shallow clone is recommended for improving relevancy of reporting
        fetch-depth: 0
    - name: Install Build Wrapper
      uses: sonarsource/sonarqube-scan-action/install-build-wrapper@<action version>
      env:
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
    - name: Run Build Wrapper
      run: |
        # here goes your compilation wrapped with build-wrapper; See https://docs.sonarsource.com/sonarqube/latest/ analyzing-source-code/languages/c-family/#using-build-wrapper for more information
        # build-preparation steps
        # build-wrapper-linux-x86-64 --out-dir ${{ env.BUILD_WRAPPER_OUT_DIR }} build-command
    - name: SonarQube Scan
      uses: sonarsource/sonarqube-scan-action@<action version>
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        SONAR_ROOT_CERT: ${{ secrets.SONAR_ROOT_CERT }}
      with:  
        args: |
          --define sonar.cfamily.compile-commands="${{ env.BUILD_WRAPPER_OUT_DIR }}/compile_commands.json" 
          #Consult https://docs.sonarsource.com/sonarqube/latest/analyzing-source-code/scanners/sonarscanner/ for more information and options
```

If you are using SonarQube Server 10.5 or earlier, use `sonar.cfamily.build-wrapper-output` instead of `sonar.cfamily.compile-commands` in the `run` property of the last step, as Build Wrapper does not generate a compile_commands.json file before SonarQube Server 10.6, like this:
```yaml
with:  
  args: |
    --define sonar.cfamily.build-wrapper-output="${{ env.BUILD_WRAPPER_OUT_DIR }}"
```

See also [example configurations of C++ projects for SonarQube Server](https://github.com/search?q=org%3Asonarsource-cfamily-examples+gh-actions-sq&type=repositories).

### Cloud

```properties
sonar.organization=<replace with your SonarQube Cloud organization key>
sonar.projectKey=<replace with the key generated when setting up the project on SonarQube Cloud>

# relative paths to source directories. More details and properties are described
# at https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/analysis-scope/
sonar.sources=.
```

The workflow, usually declared under `.github/workflows`, looks like:

```yaml
on:
  # Trigger analysis when pushing to your main branches, and when creating a pull request.
  push:
    branches:
      - main
      - master
      - develop
      - 'releases/**'
  pull_request:
      types: [opened, synchronize, reopened]

name: Main Workflow
jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        # Disabling shallow clones is recommended for improving the relevancy of reporting
        fetch-depth: 0
    - name: SonarQube Scan
      uses: sonarsource/sonarqube-scan-action@<action version> # Ex: v4.1.0, See the latest version at https://github.com/marketplace/actions/official-sonarqube-scan
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

For C, C++ and Objective-C projects not using AutoConfig, the workflow requires additional steps to download the Build Wrapper and invoking it:

```yaml
# Trigger analysis when pushing to your main branches, and when creating a pull request.
  push:
    branches:
      - main
      - master
      - develop
      - 'releases/**'
  pull_request:
      types: [opened, synchronize, reopened]

name: Main Workflow
jobs:
  sonarqube:
    runs-on: ubuntu-latest
    env:
      BUILD_WRAPPER_OUT_DIR: build_wrapper_output_directory # Directory where build-wrapper output will be placed
    steps:
    - uses: actions/checkout@v4
      with:
        # Disabling shallow clone is recommended for improving relevancy of reporting
        fetch-depth: 0
    - name: Install Build Wrapper
      uses: sonarsource/sonarqube-scan-action/install-build-wrapper@<action version>
      env:
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
    - name: Run Build Wrapper
      run: |
        # here goes your compilation wrapped with build-wrapper; See https://docs.sonarsource.com/sonarqube/latest/ analyzing-source-code/languages/c-family/#using-build-wrapper for more information
        # build-preparation steps
        # build-wrapper-linux-x86-64 --out-dir ${{ env.BUILD_WRAPPER_OUT_DIR }} build-command
    - name: SonarQube Scan
      uses: sonarsource/sonarqube-scan-action@<action version>
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        SONAR_ROOT_CERT: ${{ secrets.SONAR_ROOT_CERT }}
      with:  
        args: |
          --define sonar.cfamily.compile-commands="${{ env.BUILD_WRAPPER_OUT_DIR }}/compile_commands.json" 
          #Consult https://docs.sonarsource.com/sonarqube/latest/analyzing-source-code/scanners/sonarscanner/ for more information and options
```

See also [example configurations of C++ projects for SonarQube Cloud](https://github.com/search?q=org%3Asonarsource-cfamily-examples+gh-actions-sc&type=repositories).

## Action parameters

You can change the analysis base directory by using the optional input `projectBaseDir` like this:

```yaml
- uses: sonarsource/sonarqube-scan-action@<action version>
  with:
    projectBaseDir: app/src
```

In case you need to specify the version of the Sonar Scanner, you can use the `scannerVersion` option:

```yaml
- uses: sonarsource/sonarqube-scan-action@<action version>
  with:
    scannerVersion: 6.2.0.4584
```

In case you need to add additional analysis parameters, and you do not wish to set them in the `sonar-project.properties` file, you can use the `args` option:

```yaml
- uses: sonarsource/sonarqube-scan-action@<action version>
  with:
    projectBaseDir: app/src
    args: >
      -Dsonar.organization=my-organization # For SonarQube Cloud only
      -Dsonar.projectKey=my-projectkey
      -Dsonar.python.coverage.reportPaths=coverage.xml
      -Dsonar.sources=lib/
      -Dsonar.tests=tests/
      -Dsonar.test.exclusions=tests/**
      -Dsonar.verbose=true
```

You can also specify the URL where to retrieve the SonarScanner CLI from.
The specified URL overrides the default address: `https://binaries.sonarsource.com/Distribution/sonar-scanner-cli`.
This can be useful when the runner executing the action is self-hosted and has regulated or no access to the Internet:

```yaml
- uses: sonarsource/sonarqube-scan-action@<action version>
  with:
    scannerBinariesUrl: https://my.custom.binaries.url.com/Distribution/sonar-scanner-cli/
```

More information about possible analysis parameters can be found:
* in the [Analysis parameters page](https://docs.sonarsource.com/sonarqube-server/latest/analyzing-source-code/analysis-parameters/) of the SonarQube Server documentation
* in the [Analysis parameters page](https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/analysis-parameters/) of the SonarQube Cloud documentation

### Environment variables

- `SONAR_TOKEN` – **Required** this is the token used to authenticate access to SonarQube. You can read more about security tokens in the documentation of SonarQube [Server](https://docs.sonarsource.com/sonarqube-server/latest/user-guide/managing-tokens/) and [Cloud](https://docs.sonarsource.com/sonarqube-cloud/managing-your-account/managing-tokens/). You can set the `SONAR_TOKEN` environment variable in the "Secrets" settings page of your repository, or you can add them at the level of your GitHub organization (recommended).
- *`GITHUB_TOKEN` – Provided by Github (see [Authenticating with the GITHUB_TOKEN](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token)).*
- `SONAR_HOST_URL` – this tells the scanner where SonarQube Server is hosted. You can set the `SONAR_HOST_URL` environment variable in the "Variables" settings page of your repository, or you can add them at the level of your GitHub organization (recommended). Not needed for SonarQube Cloud.
- `SONAR_ROOT_CERT` – Holds an additional certificate (in PEM format) that is used to validate the certificate of SonarQube Server or of a secured proxy to SonarQube (Server or Cloud). You can set the `SONAR_ROOT_CERT` environment variable in the "Secrets" settings page of your repository, or you can add them at the level of your GitHub organization (recommended).

Here is an example of how you can pass a certificate (in PEM format) to the Scanner truststore:

```yaml
- uses: sonarsource/sonarqube-scan-action@<action version>
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }}
    SONAR_ROOT_CERT: ${{ secrets.SONAR_ROOT_CERT }}
```

If your source code file names contain special characters that are not covered by the locale range of `en_US.UTF-8`, you can configure your desired locale like this:

```yaml
- uses: sonarsource/sonarqube-scan-action@<action version>
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }} # or https://sonarcloud.io
    LC_ALL: "ru_RU.UTF-8"
```

## Alternatives for Java, .NET, and C/C++ projects

This GitHub Action will not work for all technologies. If you are in one of the following situations, you should use the following alternatives:

* Your code is built with Maven. Read the documentation about our SonarScanner for Maven in SonarQube [Server](https://docs.sonarsource.com/sonarqube-server/latest/analyzing-source-code/scanners/sonarscanner-for-maven/) and [Cloud](https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/ci-based-analysis/sonarscanner-for-maven/).
* Your code is built with Gradle. Read the documentation about our SonarScanner for Gradle in SonarQube [Server](https://docs.sonarsource.com/sonarqube-server/latest/analyzing-source-code/scanners/sonarscanner-for-gradle/) and [Cloud](https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/ci-based-analysis/sonarscanner-for-gradle/).
* You want to analyze a .NET solution. Read the documentation about our SonarScanner for .NET in SonarQube [Server](https://docs.sonarsource.com/sonarqube-server/latest/analyzing-source-code/scanners/dotnet/introduction/) and [Cloud](https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/ci-based-analysis/sonarscanner-for-dotnet/introduction/).

## Do not use this GitHub action if you are in the following situations

* You want to run the action on C, C++, or Objective-C projects on a 32-bits system - build wrappers support only 64-bits OS.

## Have questions or feedback?

To provide feedback (requesting a feature or reporting a bug) please post on the SonarSource Community Forum page for SonarQube [Server](https://community.sonarsource.com/tags/c/help/sq/github-actions) or [Cloud](https://community.sonarsource.com/tags/c/help/sc/9/github-actions).

## License

Container images built with this project include third-party materials.
