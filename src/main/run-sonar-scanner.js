// SonarQube Scan Action
// Copyright (C) SonarSource Sàrl
// mailto:contact AT sonarsource DOT com
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program; if not, write to the Free Software Foundation,
// Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
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
