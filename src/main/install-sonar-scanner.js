import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import {
  getPlatformFlavor,
  getScannerDownloadURL,
  scannerDirName,
} from "./utils";

const TOOLNAME = "sonar-scanner-cli";

/** 
 * Download the sonar-scanner-cli from a internal url along with authorization token
 */
async function downloadWithFetch(url, outputPath, authToken) {
  core.info(`Downloading sonar-scanner-cli from: ${url}`);

  //create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  //prepare headers
  const headers = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
    core.info("Using auth token for download");
  }
  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `Failed to download sonar-scanner-cli from ${url}: ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(outputPath, buffer);
    core.info(`Successfully Downloaded sonar-scanner-cli to: ${outputPath}`);

    return outputPath;
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

/**
 * Download the Sonar Scanner CLI for the current environment and cache it.
 */
export async function installSonarScanner({
  scannerVersion,
  scannerBinariesUrl,
  scannerBinariesAuth,
}) {
  const flavor = getPlatformFlavor(os.platform(), os.arch());

  // Check if tool is already cached
  let toolDir = tc.find(TOOLNAME, scannerVersion, flavor);

  if (!toolDir) {
    core.info(
      `Installing Sonar Scanner CLI ${scannerVersion} for ${flavor}...`
    );

    const downloadUrl = getScannerDownloadURL({
      scannerBinariesUrl,
      scannerVersion,
      flavor,
    });

    core.info(`Downloading from: ${downloadUrl}`);

    let downloadPath;

    if (scannerBinariesAuth) {
      // If auth token is provided
      const tempDir = process.env.RUNNER_TEMP || os.tmpdir();
      const fileName = path.basename(downloadUrl);
      const tempFile = path.join(tempDir, fileName);

      downloadPath = await downloadWithFetch(downloadUrl, tempFile, scannerBinariesAuth);
    } else {
      // use tool-cache without auth token
      core.info("Using tool-cache to run sonar-scanner-cli");
      downloadPath = await tc.downloadTool(downloadUrl);
    }

    const extractPath = await tc.extractZip(downloadPath);

    // Find the actual scanner directory inside the extracted folder
    const scannerPath = path.join(extractPath, scannerDirName(scannerVersion, flavor));
    
    toolDir = await tc.cacheDir(scannerPath, TOOLNAME, scannerVersion, flavor);

    core.info(`Sonar Scanner CLI cached to: ${toolDir}`);
  } else {
    core.info(`Using Sonar Scanner CLI from cache: ${toolDir}`);
  }

  // Add the tool to the path
  const binDir = path.join(toolDir, "bin");
  core.addPath(binDir);

  return toolDir;
  }