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
import * as tc from "@actions/tool-cache";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  getPlatformFlavor,
  getScannerDownloadURL,
  scannerDirName,
  toSemVer,
} from "./utils.js";
import { verifySignature } from "./gpg-verification.js";

const TOOLNAME = "sonar-scanner-cli";

async function ensureZipExtension(filePath) {
  if (filePath.endsWith(".zip")) {
    return filePath;
  }
  const zipPath = `${filePath}.zip`;
  await fs.rename(filePath, zipPath);
  return zipPath;
}

/**
 * Download the Sonar Scanner CLI for the current environment and cache it.
 */
export async function installSonarScanner({
  scannerVersion,
  scannerBinariesUrl,
  scannerBinariesAuthHeader,
  skipSignatureVerification = false,
}) {
  const flavor = getPlatformFlavor(os.platform(), os.arch());
  const semVerVersion = toSemVer(scannerVersion);

  // Check if tool is already cached
  let toolDir = tc.find(TOOLNAME, semVerVersion, flavor);

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

    const downloadPath = await tc.downloadTool(downloadUrl, undefined, scannerBinariesAuthHeader);

    if (skipSignatureVerification) {
      core.warning("⚠ Skipping GPG signature verification (not recommended)");
    } else {
      const signatureUrl = `${downloadUrl}.asc`;
      core.info(`Downloading signature from: ${signatureUrl}`);

      let signaturePath;
      try {
        signaturePath = await tc.downloadTool(signatureUrl, undefined, scannerBinariesAuthHeader);
      } catch (error) {
        throw new Error(
          `Failed to download signature file from ${signatureUrl}: ${error.message}`
        );
      }

      await verifySignature(downloadPath, signaturePath);
    }

    // PowerShell 5.1 (used on some Windows agents) requires the .zip extension for Expand-Archive
    const extractInput = await ensureZipExtension(downloadPath);
    const extractedPath = await tc.extractZip(extractInput);

    // Find the actual scanner directory inside the extracted folder
    const scannerPath = path.join(
      extractedPath,
      scannerDirName(scannerVersion, flavor)
    );

    toolDir = await tc.cacheDir(scannerPath, TOOLNAME, semVerVersion, flavor);

    core.info(`Sonar Scanner CLI cached to: ${toolDir}`);
  } else {
    core.info(`Using cached Sonar Scanner CLI from: ${toolDir}`);
  }

  // Add the bin directory to PATH
  const binDir = path.join(toolDir, "bin");
  core.addPath(binDir);

  return toolDir;
}
