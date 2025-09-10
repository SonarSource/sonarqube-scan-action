import * as exec from "@actions/exec";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseArgsStringToArgv } from "string-argv";

export async function runSonarScanner(
  inputArgs,
  projectBaseDir,
  scannerDir,
  runnerEnv = {}
) {
  const {
    RUNNER_DEBUG,
    RUNNER_OS,
    RUNNER_TEMP,
    SONAR_ROOT_CERT,
    SONARCLOUD_URL,
  } = runnerEnv;

  const scannerBin =
    RUNNER_OS === "Windows" ? "sonar-scanner.bat" : "sonar-scanner";

  const scannerArgs = [];

  if (SONARCLOUD_URL) {
    scannerArgs.push(`-Dsonar.scanner.sonarcloudUrl=${SONARCLOUD_URL}`);
  }

  if (RUNNER_DEBUG === "1") {
    scannerArgs.push("--debug");
  }

  if (projectBaseDir) {
    scannerArgs.push(`-Dsonar.projectBaseDir=${projectBaseDir}`);
  }

  // The SSL folder may exist on an uncleaned self-hosted runner
  const sslFolder = path.join(os.homedir(), ".sonar", "ssl");
  /**
   * Use keytool for now, as SonarQube 10.6 and below doesn't support openssl generated keystores
   * keytool requires a password > 6 characters,  so we won't use the default password 'sonar'
   */
  const keytoolMainClass = "sun.security.tools.keytool.Main";
  const truststoreFile = path.join(sslFolder, "truststore.p12");
  const truststorePassword = "changeit";

  if (fs.existsSync(truststoreFile)) {
    let aliasSonarIsPresent = true;

    try {
      await exec.exec(
        `${scannerDir}/jre/bin/java`,
        [
          keytoolMainClass,
          "-storetype",
          "PKCS12",
          "-keystore",
          truststoreFile,
          "-storepass",
          truststorePassword,
          "-noprompt",
          "-trustcacerts",
          "-list",
          "-v",
          "-alias",
          "sonar",
        ],
        { silent: true }
      );
    } catch (_) {
      aliasSonarIsPresent = false;
      console.log(
        `Existing Scanner truststore ${truststoreFile} does not contain 'sonar' alias`
      );
    }

    if (aliasSonarIsPresent) {
      console.log(
        `Removing 'sonar' alias from already existing Scanner truststore: ${truststoreFile}`
      );
      await exec.exec(`${scannerDir}/jre/bin/java`, [
        keytoolMainClass,
        "-storetype",
        "PKCS12",
        "-keystore",
        truststoreFile,
        "-storepass",
        truststorePassword,
        "-noprompt",
        "-trustcacerts",
        "-delete",
        "-alias",
        "sonar",
      ]);
    }
  }

  if (SONAR_ROOT_CERT) {
    console.log("Adding SSL certificate to the Scanner truststore");
    const tempCertPath = path.join(RUNNER_TEMP, "tmpcert.pem");

    try {
      fs.unlinkSync(tempCertPath);
    } catch (_) {
      // File doesn't exist, ignore
    }

    fs.writeFileSync(tempCertPath, SONAR_ROOT_CERT);
    fs.mkdirSync(sslFolder, { recursive: true });

    await exec.exec(`${scannerDir}/jre/bin/java`, [
      keytoolMainClass,
      "-storetype",
      "PKCS12",
      "-keystore",
      truststoreFile,
      "-storepass",
      truststorePassword,
      "-noprompt",
      "-trustcacerts",
      "-importcert",
      "-alias",
      "sonar",
      "-file",
      tempCertPath,
    ]);

    scannerArgs.push(
      `-Dsonar.scanner.truststorePassword=${truststorePassword}`
    );
  }

  if (inputArgs) {
    const args = parseArgsStringToArgv(inputArgs);
    scannerArgs.push(...args);
  }

  await exec.exec(scannerBin, scannerArgs);
}
