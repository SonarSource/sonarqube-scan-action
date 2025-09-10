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

  return { args, projectBaseDir, scannerBinariesUrl, scannerVersion };
}

/**
 * These RUNNER env variables come from GitHub by default.
 * See https://docs.github.com/en/actions/reference/workflows-and-actions/variables#default-environment-variables
 *
 * The others are optional env variables provided by the user of the action
 */
function getEnvVariables() {
  return {
    RUNNER_DEBUG: process.env.RUNNER_DEBUG,
    RUNNER_OS: process.env.RUNNER_OS,
    RUNNER_TEMP: process.env.RUNNER_TEMP,
    SONAR_ROOT_CERT: process.env.SONAR_ROOT_CERT,
    SONARCLOUD_URL: process.env.SONARCLOUD_URL,
    SONAR_TOKEN: process.env.SONAR_TOKEN,
  };
}

function runSanityChecks(inputs) {
  try {
    const { projectBaseDir, scannerVersion } = inputs;

    validateScannerVersion(scannerVersion);
    checkSonarToken(core);
    checkMavenProject(core, projectBaseDir);
    checkGradleProject(core, projectBaseDir);
  } catch (error) {
    core.setFailed(`Sanity checks failed: ${error.message}`);
    process.exit(1);
  }
}

async function run() {
  try {
    const { args, projectBaseDir, scannerVersion, scannerBinariesUrl } =
      getInputs();
    const runnerEnv = getEnvVariables();
    const { sonarToken } = runnerEnv;

    runSanityChecks({ projectBaseDir, scannerVersion, sonarToken });

    const scannerDir = await installSonarScanner({
      scannerVersion,
      scannerBinariesUrl,
    });

    await runSonarScanner(args, projectBaseDir, scannerDir, runnerEnv);
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    process.exit(1);
  }
}

run();
