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
import { installSonarScanner } from "./install-sonar-scanner";
import { runSonarScanner } from "./run-sonar-scanner";
import {
  checkGradleProject,
  checkMavenProject,
  checkSonarToken,
  validateScannerVersion,
} from "./sanity-checks";

/**
 * Inputs are defined in action.yml
 */
function getInputs() {
  const args = core.getInput("args");
  const projectBaseDir = core.getInput("projectBaseDir");
  const scannerBinariesUrl = core.getInput("scannerBinariesUrl");
  const scannerVersion = core.getInput("scannerVersion");
  const skipSignatureVerification = core.getBooleanInput("skipSignatureVerification");

  return { args, projectBaseDir, scannerBinariesUrl, scannerVersion, skipSignatureVerification };
}

/**
 * These RUNNER env variables come from GitHub by default.
 * See https://docs.github.com/en/actions/reference/workflows-and-actions/variables#default-environment-variables
 *
 * The others are optional env variables provided by the user of the action
 */
function getEnvVariables() {
  return {
    runnerDebug: process.env.RUNNER_DEBUG,
    runnerOs: process.env.RUNNER_OS,
    runnerTemp: process.env.RUNNER_TEMP,
    sonarRootCert: process.env.SONAR_ROOT_CERT,
    sonarcloudUrl: process.env.SONARCLOUD_URL,
    sonarToken: process.env.SONAR_TOKEN,
  };
}

function runSanityChecks(inputs) {
  try {
    const { projectBaseDir, scannerVersion, sonarToken } = inputs;

    validateScannerVersion(scannerVersion);
    checkSonarToken(core, sonarToken);
    checkMavenProject(core, projectBaseDir);
    checkGradleProject(core, projectBaseDir);
  } catch (error) {
    core.setFailed(`Sanity checks failed: ${error.message}`);
    process.exit(1);
  }
}

async function run() {
  try {
    const { args, projectBaseDir, scannerVersion, scannerBinariesUrl, skipSignatureVerification } =
      getInputs();
    const runnerEnv = getEnvVariables();
    const { sonarToken } = runnerEnv;

    runSanityChecks({ projectBaseDir, scannerVersion, sonarToken });

    const scannerDir = await installSonarScanner({
      scannerVersion,
      scannerBinariesUrl,
      skipSignatureVerification,
    });

    await runSonarScanner(args, projectBaseDir, scannerDir, runnerEnv);
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    process.exit(1);
  }
}

run();
