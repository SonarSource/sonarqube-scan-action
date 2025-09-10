import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as os from "os";
import * as path from "path";
import { runSonarScanner } from "./run-sonar-scanner";
import {
  checkGradleProject,
  checkMavenProject,
  checkSonarToken,
  validateScannerVersion,
} from "./sanity-checks";
import {
  getPlatformFlavor,
  getScannerDownloadURL,
  scannerDirName,
} from "./utils";

const TOOLNAME = "sonar-scanner-cli";

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

function getRunnerEnv() {
  return {
    RUNNER_OS: process.env.RUNNER_OS,
    SONARCLOUD_URL: process.env.SONARCLOUD_URL,
    RUNNER_DEBUG: process.env.RUNNER_DEBUG,
    SONAR_ROOT_CERT: process.env.SONAR_ROOT_CERT,
    RUNNER_TEMP: process.env.RUNNER_TEMP,
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

async function installSonarScannerCLI({ scannerVersion, scannerBinariesUrl }) {
  const flavor = getPlatformFlavor(os.platform(), os.arch());

  // Check if tool is already cached
  let toolDir = tc.find(TOOLNAME, scannerVersion, flavor);

  if (!toolDir) {
    console.log(
      `Installing Sonar Scanner CLI ${scannerVersion} for ${flavor}...`
    );

    const downloadUrl = getScannerDownloadURL({
      scannerBinariesUrl,
      scannerVersion,
      flavor,
    });

    console.log(`Downloading from: ${downloadUrl}`);

    const downloadPath = await tc.downloadTool(downloadUrl);
    const extractedPath = await tc.extractZip(downloadPath);

    // Find the actual scanner directory inside the extracted folder
    const scannerPath = path.join(
      extractedPath,
      scannerDirName(scannerVersion, flavor)
    );

    toolDir = await tc.cacheDir(scannerPath, TOOLNAME, scannerVersion, flavor);

    console.log(`Sonar Scanner CLI cached to: ${toolDir}`);
  } else {
    console.log(`Using cached Sonar Scanner CLI from: ${toolDir}`);
  }

  // Add the bin directory to PATH
  const binDir = path.join(toolDir, "bin");
  core.addPath(binDir);

  return toolDir;
}

async function run() {
  try {
    const { args, projectBaseDir, scannerVersion, scannerBinariesUrl } =
      getInputs();

    // Run sanity checks first
    runSanityChecks({ projectBaseDir, scannerVersion });

    // Install Sonar Scanner CLI using @actions/tool-cache
    const scannerDir = await installSonarScannerCLI({
      scannerVersion,
      scannerBinariesUrl,
    });

    // Run the sonar scanner
    const runnerEnv = getRunnerEnv();
    await runSonarScanner(args, projectBaseDir, scannerDir, runnerEnv);
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    process.exit(1);
  }
}

run();
