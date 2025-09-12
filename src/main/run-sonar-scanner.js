import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseArgsStringToArgv } from "string-argv";

const KEYTOOL_MAIN_CLASS = "sun.security.tools.keytool.Main";
const TRUSTSTORE_PASSWORD = "changeit"; // default password of the Java truststore!

export async function runSonarScanner(
  inputArgs,
  projectBaseDir,
  scannerDir,
  runnerEnv = {}
) {
  const { runnerDebug, runnerOs, runnerTemp, sonarRootCert, sonarcloudUrl } =
    runnerEnv;

  const scannerBin =
    runnerOs === "Windows" ? "sonar-scanner.bat" : "sonar-scanner";

  const scannerArgs = [];

  /**
   * Not sanitization is needed when populating scannerArgs.
   * @actions/exec will take care of sanitizing the args it receives.
   */

  if (sonarcloudUrl) {
    scannerArgs.push(`-Dsonar.scanner.sonarcloudUrl=${sonarcloudUrl}`);
  }

  if (runnerDebug === "1") {
    scannerArgs.push("--debug");
  }

  if (projectBaseDir) {
    scannerArgs.push(`-Dsonar.projectBaseDir=${projectBaseDir}`);
  }

  // The SSL folder may exist on an uncleaned self-hosted runner
  const sslFolder = path.join(os.homedir(), ".sonar", "ssl");
  const truststoreFile = path.join(sslFolder, "truststore.p12");

  const keytoolParams = {
    scannerDir,
    truststoreFile,
  };

  if (fs.existsSync(truststoreFile)) {
    let aliasSonarIsPresent = true;

    try {
      await checkSonarAliasInTruststore(keytoolParams);
    } catch (_) {
      aliasSonarIsPresent = false;
      core.info(
        `Existing Scanner truststore ${truststoreFile} does not contain 'sonar' alias`
      );
    }

    if (aliasSonarIsPresent) {
      core.info(
        `Removing 'sonar' alias from already existing Scanner truststore: ${truststoreFile}`
      );
      await deleteSonarAliasFromTruststore(keytoolParams);
    }
  }

  if (sonarRootCert) {
    core.info("Adding SSL certificate to the Scanner truststore");
    const tempCertPath = path.join(runnerTemp, "tmpcert.pem");

    try {
      fs.unlinkSync(tempCertPath);
    } catch (_) {
      // File doesn't exist, ignore
    }

    fs.writeFileSync(tempCertPath, sonarRootCert);
    fs.mkdirSync(sslFolder, { recursive: true });

    await importCertificateToTruststore(keytoolParams, tempCertPath);

    scannerArgs.push(
      `-Dsonar.scanner.truststorePassword=${TRUSTSTORE_PASSWORD}`
    );
  }

  if (inputArgs) {
    /**
     * No sanitization, but it is parsing a string into an array of arguments in a safe way (= no command execution),
     * and with good enough support of quotes to support arguments containing spaces.
     */
    const args = parseArgsStringToArgv(inputArgs);
    scannerArgs.push(...args);
  }

  /**
   * Arguments are sanitized by `exec`
   */
  await exec.exec(scannerBin, scannerArgs);
}

/**
 * Use keytool for now, as SonarQube 10.6 and below doesn't support openssl generated keystores
 * keytool requires a password > 6 characters,  so we won't use the default password 'sonar'
 */
function executeKeytoolCommand({
  scannerDir,
  truststoreFile,
  extraArgs,
  options = {},
}) {
  const baseArgs = [
    KEYTOOL_MAIN_CLASS,
    "-storetype",
    "PKCS12",
    "-keystore",
    truststoreFile,
    "-storepass",
    TRUSTSTORE_PASSWORD,
    "-noprompt",
    "-trustcacerts",
    ...extraArgs,
  ];

  return exec.exec(`${scannerDir}/jre/bin/java`, baseArgs, options);
}

function importCertificateToTruststore(keytoolParams, certPath) {
  return executeKeytoolCommand({
    ...keytoolParams,
    extraArgs: ["-importcert", "-alias", "sonar", "-file", certPath],
  });
}

function checkSonarAliasInTruststore(keytoolParams) {
  return executeKeytoolCommand({
    ...keytoolParams,
    extraArgs: ["-list", "-v", "-alias", "sonar"],
    options: { silent: true },
  });
}

function deleteSonarAliasFromTruststore(keytoolParams) {
  return executeKeytoolCommand({
    ...keytoolParams,
    extraArgs: ["-delete", "-alias", "sonar"],
  });
}
