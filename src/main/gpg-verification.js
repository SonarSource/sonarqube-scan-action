/*
 * sonarqube-scan-action
 * Copyright (C) 2025 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const SONARSOURCE_KEY_FINGERPRINT = "679F1EE92B19609DE816FDE81DB198F93525EC1A";
const DEFAULT_KEYSERVER = "hkps://keyserver.ubuntu.com";
const FALLBACK_KEYSERVER = "hkps://keys.openpgp.org";

/**
 * Verifies the GPG signature of a downloaded file
 * @param {string} zipPath - Path to the downloaded ZIP file
 * @param {string} signaturePath - Path to the .asc signature file
 * @param {object} options - Verification options
 * @param {string} options.keyFingerprint - GPG key fingerprint (default: SonarSource key)
 * @param {string} options.keyserver - Primary keyserver URL (default: keyserver.ubuntu.com, with fallback to keys.openpgp.org)
 * @returns {Promise<void>}
 * @throws {Error} If GPG is unavailable or verification fails
 */
export async function verifySignature(zipPath, signaturePath, options = {}) {
  const keyFingerprint = options.keyFingerprint || SONARSOURCE_KEY_FINGERPRINT;
  const keyserver = options.keyserver || DEFAULT_KEYSERVER;

  if (!(await isGpgAvailable())) {
    throw new Error(
      "GPG is not available. Install GPG or set skipSignatureVerification: true"
    );
  }

  let gpgHome;
  try {
    gpgHome = setupGpgHome();
    core.debug(`Created temporary GPG home: ${gpgHome}`);

    await importSonarSourceKey(gpgHome, keyFingerprint, keyserver);
    core.info("✓ SonarSource public key imported successfully");

    await runGpgVerify(zipPath, signaturePath, gpgHome);
    core.info("✓ GPG signature verification passed");
  } finally {
    if (gpgHome) {
      cleanupGpgHome(gpgHome);
    }
  }
}

/**
 * Checks if GPG is available on the system
 * @returns {Promise<boolean>} True if GPG is available
 */
export async function isGpgAvailable() {
  try {
    const gpgCommand = getGpgCommand();
    await exec.exec(gpgCommand, ["--version"], {
      silent: true,
      ignoreReturnCode: false,
    });
    return true;
  } catch (error) {
    core.debug(`GPG not available: ${error.message}`);
    return false;
  }
}

/**
 * Gets the GPG command for the current platform
 * @returns {string} GPG command name
 */
export function getGpgCommand() {
  // GPG is available as 'gpg' on all GitHub-hosted runners
  return "gpg";
}

/**
 * Converts a Windows path to Unix-style path for GPG
 * GPG on Windows (from Git for Windows) expects Unix-style paths
 * @param {string} windowsPath - Windows path (e.g., C:\a\_temp\gpg-home)
 * @returns {string} Unix-style path (e.g., /c/a/_temp/gpg-home)
 */
export function convertToUnixPath(windowsPath) {
  if (process.platform !== "win32") {
    return windowsPath;
  }

  let unixPath = windowsPath.replaceAll('\\', "/");

  unixPath = unixPath.replace(/^([A-Za-z]):/, (match, drive) => {
    return `/${drive.toLowerCase()}`;
  });

  return unixPath;
}

/**
 * Creates a temporary GPG home directory
 * @returns {string} Path to the temporary GPG home directory
 */
export function setupGpgHome() {
  const tempDir = process.env.RUNNER_TEMP || os.tmpdir();
  const gpgHome = path.join(tempDir, `gpg-home-${Date.now()}-${process.pid}`);

  fs.mkdirSync(gpgHome, { recursive: true, mode: 0o700 });

  return gpgHome;
}

/**
 * Attempts to import a public key from a specific keyserver
 * @param {string} gpgHome - Path to GPG home directory
 * @param {string} keyFingerprint - Public key fingerprint
 * @param {string} keyserver - Keyserver URL
 * @returns {Promise<void>}
 * @throws {Error} If key import fails
 */
async function tryImportKey(gpgHome, keyFingerprint, keyserver) {
  const gpgCommand = getGpgCommand();
  const gpgHomePath = convertToUnixPath(gpgHome);

  await exec.exec(
    gpgCommand,
    [
      "--homedir",
      gpgHomePath,
      "--batch",
      "--keyserver",
      keyserver,
      "--recv-keys",
      keyFingerprint,
    ],
    {
      silent: false,
    }
  );
}

/**
 * Imports the SonarSource public key from a keyserver
 * @param {string} gpgHome - Path to GPG home directory
 * @param {string} keyFingerprint - Public key fingerprint
 * @param {string} keyserver - Keyserver URL
 * @returns {Promise<void>}
 * @throws {Error} If key import fails
 */
export async function importSonarSourceKey(gpgHome, keyFingerprint, keyserver) {
  let primaryError;

  try {
    core.info(`Importing SonarSource public key from ${keyserver}...`);
    await tryImportKey(gpgHome, keyFingerprint, keyserver);
    core.info(`Successfully imported key from ${keyserver}`);
    return;
  } catch (error) {
    primaryError = error;
    core.warning(
      `Failed to import key from ${keyserver}: ${error.message}`
    );
  }

  try {
    core.info(`Attempting fallback keyserver ${FALLBACK_KEYSERVER}...`);
    await tryImportKey(gpgHome, keyFingerprint, FALLBACK_KEYSERVER);
    core.info(`Successfully imported key from fallback keyserver ${FALLBACK_KEYSERVER}`);
  } catch (fallbackError) {
    throw new Error(
      `Failed to import SonarSource public key from all keyservers. ` +
      `Primary (${keyserver}): ${primaryError.message}. ` +
      `Fallback (${FALLBACK_KEYSERVER}): ${fallbackError.message}`
    );
  }
}

/**
 * Runs GPG verification on the downloaded file
 * @param {string} zipPath - Path to the ZIP file
 * @param {string} signaturePath - Path to the signature file
 * @param {string} gpgHome - Path to GPG home directory
 * @returns {Promise<void>}
 * @throws {Error} If verification fails
 */
export async function runGpgVerify(zipPath, signaturePath, gpgHome) {
  const gpgCommand = getGpgCommand();

  try {
    core.info("Verifying GPG signature...");
    await exec.exec(
      gpgCommand,
      [
        "--homedir",
        convertToUnixPath(gpgHome),
        "--batch",
        "--verify",
        convertToUnixPath(signaturePath),
        convertToUnixPath(zipPath),
      ],
      {
        silent: false,
      }
    );
  } catch (error) {
    throw new Error(
      `GPG signature verification failed - file may be corrupted or tampered: ${error.message}`
    );
  }
}

/**
 * Cleans up the temporary GPG home directory
 * @param {string} gpgHome - Path to GPG home directory
 */
export function cleanupGpgHome(gpgHome) {
  try {
    if (fs.existsSync(gpgHome)) {
      fs.rmSync(gpgHome, { recursive: true, force: true });
      core.debug(`Cleaned up temporary GPG home: ${gpgHome}`);
    }
  } catch (error) {
    core.warning(`Failed to cleanup temporary GPG home: ${error.message}`);
  }
}
