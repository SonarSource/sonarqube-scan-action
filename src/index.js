import * as core from "@actions/core";
import {
  checkGradleProject,
  checkMavenProject,
  checkSonarToken,
  validateScannerVersion,
} from "./sanity-checks";

function getInputs() {
  //FIXME: should not rely on ENV vars
  const scannerVersion = process.env.INPUT_SCANNERVERSION; // core.getInput("scannerVersion");
  const projectBaseDir = process.env.INPUT_PROJECTBASEDIR; // core.getInput("projectBaseDir") || ".";

  console.log("scannerVersion: ", scannerVersion);

  return { scannerVersion, projectBaseDir };
}

function runSanityChecks(inputs) {
  try {
    const { scannerVersion, projectBaseDir } = inputs;

    validateScannerVersion(scannerVersion);
    checkSonarToken(core);
    checkMavenProject(core, projectBaseDir);
    checkGradleProject(core, projectBaseDir);
  } catch (error) {
    core.setFailed(`Sanity checks failed: ${error.message}`);
    process.exit(1);
  }
}

function run() {
  const inputs = getInputs();

  runSanityChecks(inputs);
}

run();
