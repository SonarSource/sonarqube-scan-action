<!-- Sonar Marketing hosts these approved brand assets on its Kentico Kontent CDN (assets-eu-01.kc-usercontent.com). Shared URLs are intentional; consult Marketing before replacing them. -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets-eu-01.kc-usercontent.com/ef593040-b591-0198-9506-ed88b30bc023/a23fc7ba-23f0-489a-829d-ed88c0748521/Sonar_Logo_Dark%20Backgrounds.svg">
    <img src="https://assets-eu-01.kc-usercontent.com/ef593040-b591-0198-9506-ed88b30bc023/82c13eba-d95c-4bb8-8007-7ce77c14e043/Sonar_Logo_Light%20Backgrounds.svg" alt="Sonar logo" width="400">
  </picture>
</p>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./images/SQ_Logo_Server_Cloud_Dark_Backgrounds.png">
  <img alt="SonarQube logo for Server and Cloud" src="./images/SQ_Logo_Server_Cloud_Light_Backgrounds.png">
</picture>

[![QA Main](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa-main.yml/badge.svg)](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa-main.yml) [![QA Install Build Wrapper](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa-install-build-wrapper.yml/badge.svg)](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa-install-build-wrapper.yml) [![QA Scripts](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa-scripts.yml/badge.svg)](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa-scripts.yml) [![QA Deprecated C and C++ Action](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa-deprecated-c-cpp.yml/badge.svg)](https://github.com/SonarSource/sonarqube-scan-action/actions/workflows/qa-deprecated-c-cpp.yml)

<!-- sonar-marketing:start -->
<!-- Marketing maintains this section. For wording changes, consult the relevant Product Marketing Manager (PMM). Repository CODEOWNERS review accuracy and merge changes. -->

# Scan your code with SonarQube

This GitHub Action runs SonarQube analysis in a GitHub Actions workflow and sends the results to SonarQube Server or SonarQube Cloud. It is the official GitHub Action for scanning projects in most languages supported by SonarQube. For projects built with Maven or Gradle, use the corresponding SonarScanner for Maven or SonarScanner for Gradle instead.

Continue to the [quick start](#quick-start), or learn more about [SonarQube Server](https://www.sonarsource.com/products/sonarqube/server/) and [SonarQube Cloud](https://www.sonarsource.com/products/sonarqube/cloud/).

<!-- sonar-marketing:end -->

## Quick start

### 1. Prerequisites

You must already have a project set up on SonarQube Cloud or SonarQube Server. The action performs the analysis, but the project must exist on the platform to receive the results.

For more information, see [Key requirements](#key-requirements).

### 2. Required variables

The action needs two variables to connect to SonarQube and run the analysis. Store them as GitHub secrets or variables.

- `SONAR_TOKEN`: The authentication token for accessing SonarQube. This secret is required for all use cases.
- `SONAR_HOST_URL`: The URL of your SonarQube Server instance. This variable is required for SonarQube Server and not needed for SonarQube Cloud.

For more information, see [Configuration](#configuration).

### 3. Quick start workflow example (SonarQube Cloud)

Create or update your CI pipeline to run the scan action:

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
    - uses: actions/checkout@v7
      with:
        # Disabling shallow clones is recommended for improving the relevancy of reporting
        fetch-depth: 0
    - name: SonarQube Scan
      uses: SonarSource/sonarqube-scan-action@<action version or sha1> # Ex: v8.3.0 or sha1, See the latest version at https://github.com/marketplace/actions/official-sonarqube-scan
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

Create a file named `sonar-project.properties` in the root directory of your project:

```properties
sonar.organization=<replace with your SonarQube Cloud organization key>
sonar.projectKey=<replace with the key generated when setting up the project on SonarQube Cloud>

# relative paths to source directories. More details and properties are described
# at https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/project-analysis/setting-analysis-scope/setting-initial-scope/
sonar.sources=src
```

For other workflows, see [Workflow examples](#workflow-examples).

## Special cases and alternatives

This GitHub Action does not work for all technologies. In the following situations, use the alternative scanner:

* **Your code is built with Maven.** Use SonarScanner for Maven. See the documentation for SonarQube [Server](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/scanners/sonarscanner-for-maven/) and [Cloud](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/scanners/sonarscanner-for-maven/).
* **Your code is built with Gradle.** Use SonarScanner for Gradle. See the documentation for SonarQube [Server](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/scanners/sonarscanner-for-gradle/) and [Cloud](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/scanners/sonarscanner-for-gradle/).
* **You want to analyze a .NET solution.** Use SonarScanner for .NET. See the documentation for SonarQube [Server](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/scanners/dotnet/introduction/) and [Cloud](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/scanners/sonarscanner-for-dotnet/introduction/).

**Do not use this GitHub Action if:**

* You want to run the action on C, C++, or Objective-C projects on a 32-bit system. Build Wrapper supports only 64-bit operating systems.

**If you want to use Software Composition Analysis (SCA)**

Dependency scanning with SonarQube Advanced Security SCA may not work correctly if scanning requires on-the-fly manifest file generation. See the SCA analysis environment requirements for [Cloud](https://docs.sonarsource.com/sonarqube-cloud/advanced-security/analyzing-projects-for-dependencies-sca#appropriate-environment) or [Server](https://docs.sonarsource.com/sonarqube-server/advanced-security/analyzing-projects-for-dependencies#appropriate-environment).

## Key requirements

To use this GitHub Action, you must meet the following prerequisites for your chosen SonarQube platform.

### For SonarQube Cloud

* Create a SonarQube Cloud account. If you do not have one, [sign up for free](https://www.sonarsource.com/products/sonarqube/cloud/signup/?utm_medium=referral&utm_source=github&utm_campaign=sc-signup&utm_content=signup-sonarcloud-listing-x-x&utm_term=ww-psp-x).
* [Set up a repository for analysis](https://sonarcloud.io/projects/create) in one click.

### For SonarQube Server

* Make sure your SonarQube Server instance is accessible from GitHub.
* Create an access token to run the analysis. See [Environment variables](#environment-variables).
* Set up your project on SonarQube Server before you run an analysis.

For more information, see the SonarQube Server [GitHub integration documentation](https://docs.sonarsource.com/sonarqube-server/devops-platform-integration/github-integration/introduction/).

## Configuration

### Action parameters

#### `projectBaseDir`

You can change the analysis base directory by using the optional input `projectBaseDir` like this:

```yaml
- uses: SonarSource/sonarqube-scan-action@<action version or sha1>
  with:
    projectBaseDir: app/src
```

#### `scannerVersion`

To specify the version of SonarScanner CLI, use the `scannerVersion` option:

```yaml
- uses: SonarSource/sonarqube-scan-action@<action version or sha1>
  with:
    scannerVersion: 8.2.0.6438
```

#### `args`

To add analysis parameters without setting them in the `sonar-project.properties` file, use the `args` option:

```yaml
- uses: SonarSource/sonarqube-scan-action@<action version>
  with:
    projectBaseDir: app/src
    args: >
      -Dsonar.organization=my-organization # For SonarQube Cloud only
      "-Dsonar.projectName=My Project"
      -Dsonar.projectKey=my-projectkey
      -Dsonar.python.coverage.reportPaths=coverage.xml
      -Dsonar.sources=lib/
      -Dsonar.tests=tests/
      -Dsonar.test.exclusions=tests/**
      -Dsonar.verbose=true
```

> [!NOTE]  
> In version 6, the action changed how it handles the `args` option to prevent command injection.
> As a result, the action no longer supports the full Bash syntax, and quoting and escaping are more restricted than in older versions.
> Example:
> ```yaml
> with:
>   args: >
>     -testing test 
>     -valid=true 
>     --quotes "test quotes" "nested \'quotes\'" 
>     -Dsonar.property="some value"
>     "-Dsonar.property=some value"  
> ```
> will be parsed as the following array of strings:
> ```
> [
>   '-testing',
>   'test',
>   '-valid=true',
>   '--quotes',
>   'test quotes', # Surrounding quotes are removed
>   'nested \'quotes\'',
>   '-Dsonar.property="some value"', # Internal quotes are NOT removed, contrary to the bash syntax
>   '-Dsonar.property=some value', # This is the proper way to pass scanner arguments with spaces
> ]
> ```

#### `scannerBinariesUrl`

To download SonarScanner CLI from a different location, specify the URL with the `scannerBinariesUrl` option.
The URL overrides the default address: `https://binaries.sonarsource.com/Distribution/sonar-scanner-cli`.
This is useful when the runner is self-hosted and has restricted or no internet access:

```yaml
- uses: SonarSource/sonarqube-scan-action@<action version>
  with:
    scannerBinariesUrl: https://my.custom.binaries.url.com/Distribution/sonar-scanner-cli/
```

#### `scannerBinariesAuthHeader`

If the server specified by `scannerBinariesUrl` requires authentication, use the `scannerBinariesAuthHeader` option to provide an `Authorization` header value.
The action passes the value directly as the `Authorization` HTTP header, so you must include the scheme (for example, `Bearer` or `Basic`):

```yaml
- uses: SonarSource/sonarqube-scan-action@<action version>
  with:
    scannerBinariesUrl: https://my.custom.binaries.url.com/Distribution/sonar-scanner-cli/
    scannerBinariesAuthHeader: ${{ secrets.BINARIES_AUTH_HEADER }}
```

Store the full header value (for example, `Bearer mytoken`) in a GitHub secret to avoid exposing credentials.

#### `skipSignatureVerification`

By default, the action verifies the OpenPGP signature of the SonarScanner CLI binary before executing it. To disable this verification, set the `skipSignatureVerification` option to `true`:

```yaml
- uses: SonarSource/sonarqube-scan-action@<action version>
  with:
    skipSignatureVerification: true
```

> [!NOTE]
> Signature verification requires `gpg` and `dirmngr` to be installed on the runner. GitHub-hosted runners include both, but some self-hosted runners or containers may not.
>
> If your runner accesses the internet through a proxy, the action automatically picks up the `HTTPS_PROXY` or `https_proxy` environment variable when fetching the public key from the keyserver. `HTTP_PROXY` is intentionally not used as a fallback, since keyservers are accessed over TLS (`hkps://`).
>
> **Version history:**
> - Introduced in **v7.2** with a default value of `true` to avoid breaking existing workflows on runners without `dirmngr`.
> - Changed to `false` by default in **v8** (breaking change). If your runner does not have `gpg` or `dirmngr` installed, set this option to `true` explicitly.

For more information about analysis parameters, see the Analysis parameters page in the documentation for:
* [SonarQube Server](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/analysis-parameters/)
* [SonarQube Cloud](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/analysis-parameters/)

### Environment variables

- `SONAR_TOKEN` – **Required.** The token used to authenticate access to SonarQube. For more information about tokens, see the documentation for SonarQube [Server](https://docs.sonarsource.com/sonarqube-server/user-guide/managing-tokens/) and [Cloud](https://docs.sonarsource.com/sonarqube-cloud/managing-your-account/managing-tokens/). Set `SONAR_TOKEN` as a secret on the "Secrets" settings page of your repository, or at the level of your GitHub organization (recommended).
- `SONAR_HOST_URL` – The URL of your SonarQube Server instance. This tells the scanner where SonarQube Server is hosted. Set `SONAR_HOST_URL` as a variable on the "Variables" settings page of your repository, or at the level of your GitHub organization (recommended). Not needed for SonarQube Cloud.
- `SONAR_ROOT_CERT` – An additional certificate (in PEM format) used to validate the certificate of SonarQube Server or of a secured proxy to SonarQube (Server or Cloud). Set `SONAR_ROOT_CERT` as a secret on the "Secrets" settings page of your repository, or at the level of your GitHub organization (recommended).

The following example passes a certificate (in PEM format) to the scanner truststore:

```yaml
- uses: SonarSource/sonarqube-scan-action@<action version>
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }}
    SONAR_ROOT_CERT: ${{ secrets.SONAR_ROOT_CERT }}
```

If your source file names contain special characters outside the `en_US.UTF-8` locale range, set the locale you need:

```yaml
- uses: SonarSource/sonarqube-scan-action@<action version>
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }} # or https://sonarcloud.io
    LC_ALL: "ru_RU.UTF-8"
```

## Workflow examples

### For SonarQube Cloud

You must declare project metadata, including the location of the sources to analyze, in the `sonar-project.properties` file in the base directory:

```properties
sonar.organization=<replace with your SonarQube Cloud organization key>
sonar.projectKey=<replace with the key generated when setting up the project on SonarQube Cloud>

# relative paths to source directories. More details and properties are described
# at https://docs.sonarsource.com/sonarqube-cloud/managing-your-projects/project-analysis/setting-analysis-scope/setting-initial-scope/
sonar.sources=src
```

#### Standard projects

Use this workflow for projects that either do not contain C, C++, or Objective-C, or contain them but do not use [Build Wrapper](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/languages/c-family/prerequisites/#generating-a-compilation-database). The workflow is usually declared in `.github/workflows/build.yml`:

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
    - uses: actions/checkout@v7
      with:
        # Disabling shallow clones is recommended for improving the relevancy of reporting
        fetch-depth: 0
    - name: SonarQube Scan
      uses: SonarSource/sonarqube-scan-action@<action version or sha1> # Ex: v8.3.0 or sha1, See the latest version at https://github.com/marketplace/actions/official-sonarqube-scan
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### C/C++/Objective-C with Build Wrapper

For C, C++, and Objective-C projects that rely on [Build Wrapper](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/languages/c-family/prerequisites/#generating-a-compilation-database) to generate the compilation database, add steps to download and run Build Wrapper:

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
    - uses: actions/checkout@v7
      with:
        # Disabling shallow clone is recommended for improving relevancy of reporting
        fetch-depth: 0
    - name: Install Build Wrapper
      uses: SonarSource/sonarqube-scan-action/install-build-wrapper@<action version>
    - name: Run Build Wrapper
      run: |
        # Here goes your compilation wrapped with Build Wrapper
        # For more information, see https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/languages/c-family/prerequisites/#generating-a-compilation-database
        # build-preparation steps
        # build-wrapper-linux-x86-64 --out-dir ${{ env.BUILD_WRAPPER_OUT_DIR }} build-command
    - name: SonarQube Scan
      uses: SonarSource/sonarqube-scan-action@<action version or sha1>
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_ROOT_CERT: ${{ secrets.SONAR_ROOT_CERT }}
      with:
        # Consult https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/scanners/sonarscanner-cli/ for more information and options
        args: >
          --define "sonar.cfamily.compile-commands=${{ env.BUILD_WRAPPER_OUT_DIR }}/compile_commands.json"
```

See also [example configurations of C++ projects for SonarQube Cloud](https://github.com/search?q=org%3Asonarsource-cfamily-examples+gh-actions-sc&type=repositories).

### For SonarQube Server

You can declare project metadata, including the location of the sources to analyze, in the `sonar-project.properties` file in the base directory:

```properties
sonar.projectKey=<replace with the key generated when setting up the project on SonarQube Server>

# relative paths to source directories. More details and properties are described
# at https://docs.sonarsource.com/sonarqube-server/project-administration/analysis-scope/ 
sonar.sources=src
```

#### Standard projects

Use this workflow for projects that either do not contain C, C++, or Objective-C, or contain them but do not use [Build Wrapper](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/languages/c-family/prerequisites/#generating-a-compilation-database). The workflow is usually declared in `.github/workflows/build.yml`:

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
    - uses: actions/checkout@v7
      with:
        # Disabling shallow clones is recommended for improving the relevancy of reporting
        fetch-depth: 0
    - name: SonarQube Scan
      uses: SonarSource/sonarqube-scan-action@<action version or sha1> # Ex: v8.3.0, or sha1, See the latest version at https://github.com/marketplace/actions/official-sonarqube-scan
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }}
```

#### C/C++/Objective-C with Build Wrapper

For C, C++, and Objective-C projects that rely on [Build Wrapper](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/languages/c-family/prerequisites/#generating-a-compilation-database) to generate the compilation database, add steps to download and run Build Wrapper:

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
    - uses: actions/checkout@v7
      with:
        # Disabling shallow clone is recommended for improving relevancy of reporting
        fetch-depth: 0
    - name: Install Build Wrapper
      uses: SonarSource/sonarqube-scan-action/install-build-wrapper@<action version>
      env:
        SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }}
    - name: Run Build Wrapper
      run: |
        # Here goes your compilation wrapped with Build Wrapper
        # For more information, see https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/languages/c-family/prerequisites/#generating-a-compilation-database
        # build-preparation steps
        # build-wrapper-linux-x86-64 --out-dir ${{ env.BUILD_WRAPPER_OUT_DIR }} build-command
    - name: SonarQube Scan
      uses: SonarSource/sonarqube-scan-action@<action version or sha1>
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }}
        SONAR_ROOT_CERT: ${{ secrets.SONAR_ROOT_CERT }}
      with:
        # Consult https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/scanners/sonarscanner/ for more information and options
        args: >
          --define sonar.cfamily.compile-commands="${{ env.BUILD_WRAPPER_OUT_DIR }}/compile_commands.json" 
```

If you use SonarQube Server 10.5 or earlier, use `sonar.cfamily.build-wrapper-output` instead of `sonar.cfamily.compile-commands` in the `args` property of the last step. Build Wrapper does not generate a `compile_commands.json` file before SonarQube Server 10.6.

For example:

```yaml
with:  
  args: >
    --define "sonar.cfamily.build-wrapper-output=${{ env.BUILD_WRAPPER_OUT_DIR }}"
```

See also [example configurations of C++ projects for SonarQube Server](https://github.com/search?q=org%3Asonarsource-cfamily-examples+gh-actions-sq&type=repositories).

## Advanced settings

### Self-hosted runner or container

When you run the action in a self-hosted runner or container, make sure the following programs are installed:

* **gpg**
* **dirmngr**

> [!NOTE]
> `gpg` and `dirmngr` are required only for GPG signature verification, which is enabled by default. You can omit them if you set `skipSignatureVerification: true`.

### Additional information

The `sonarqube-scan-action/install-build-wrapper` action installs `coreutils` when it runs on macOS.

## Support and Community

To request a feature or report a bug, post on the SonarSource Community Forum for [SonarQube Server](https://community.sonarsource.com/tags/c/sq/10/github-actions) or [SonarQube Cloud](https://community.sonarsource.com/tags/c/sc/9/github-actions).

## License

Container images built with this project include third-party materials.
