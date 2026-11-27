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

/*
 * Reproducer for SQSCANGHA-207: setupGpgHome() must never return a GPG home
 * in which gpg-agent is unable to create its sockets.
 *
 * Unlike the other GPG tests, this one runs the real gpg binary, because the limit that matters
 * is the one enforced by libassuan on the current platform, not the one hard-coded in the action.
 */

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { setupGpgHome } from "../gpg-verification.js";

// Generated on the fly: any valid key works, its only purpose is to make gpg talk to gpg-agent.
const THROWAWAY_TEST_KEY_USER_ID = "Throwaway Test Key <throwaway-test-key@example.invalid>";
// Upper bound only used to stop the search if setupGpgHome() never rejects RUNNER_TEMP.
const MAX_RUNNER_TEMP_PADDING = 200;

function runGpgTool(command, args) {
  return spawnSync(command, args, { encoding: "utf8" });
}

function isGpgAvailable() {
  const result = runGpgTool("gpg", ["--version"]);
  return result.error === undefined && result.status === 0;
}

function socketDirectoryOf(gpgHome) {
  return runGpgTool("gpgconf", ["--homedir", gpgHome, "--list-dirs", "socketdir"]).stdout.trim();
}

/**
 * Generates a small throwaway key in the GPG home. Key generation needs gpg-agent, which holds
 * the private key, so it fails when gpg-agent cannot create its sockets in that home.
 * @param {string} gpgHome - Path to the GPG home directory
 * @returns {object} The spawnSync result of the gpg command
 */
function generateThrowawayKey(gpgHome) {
  return runGpgTool("gpg", [
    "--homedir", gpgHome,
    "--batch",
    "--passphrase", "",
    "--quick-gen-key", THROWAWAY_TEST_KEY_USER_ID, "ed25519", "sign", "never",
  ]);
}

function stopGpgDaemonsAndRemove(gpgHome) {
  runGpgTool("gpgconf", ["--homedir", gpgHome, "--kill", "all"]);
  fs.rmSync(gpgHome, { recursive: true, force: true });
}

/**
 * Grows RUNNER_TEMP one character at a time and returns the GPG home created under the longest
 * RUNNER_TEMP that setupGpgHome() still accepts, i.e. the riskiest path the action can produce.
 * @param {string} runnerTempRoot - Existing short directory used as the RUNNER_TEMP prefix
 * @returns {string} The GPG home created at the acceptance boundary
 */
function createGpgHomeAtAcceptanceBoundary(runnerTempRoot) {
  let boundaryGpgHome;
  for (let padding = 1; padding <= MAX_RUNNER_TEMP_PADDING; padding++) {
    const runnerTemp = path.join(runnerTempRoot, "x".repeat(padding));
    process.env.RUNNER_TEMP = runnerTemp;
    const gpgHome = setupGpgHome();
    if (path.dirname(gpgHome) !== runnerTemp) {
      fs.rmSync(gpgHome, { recursive: true, force: true });
      return boundaryGpgHome;
    }
    if (boundaryGpgHome) {
      fs.rmSync(boundaryGpgHome, { recursive: true, force: true });
    }
    boundaryGpgHome = gpgHome;
  }
  throw new Error(`setupGpgHome() accepted every RUNNER_TEMP up to ${MAX_RUNNER_TEMP_PADDING} extra characters`);
}

describe("GPG socket path limit (real gpg)", () => {
  let originalRunnerTemp;
  let runnerTempRoot;
  let gpgHome;

  beforeEach(() => {
    originalRunnerTemp = process.env.RUNNER_TEMP;
    // "/tmp" keeps the prefix short so the boundary is reachable on every platform.
    runnerTempRoot = fs.mkdtempSync(path.join(process.platform === "win32" ? os.tmpdir() : "/tmp", "r"));
  });

  afterEach(() => {
    if (gpgHome) {
      stopGpgDaemonsAndRemove(gpgHome);
      gpgHome = undefined;
    }
    fs.rmSync(runnerTempRoot, { recursive: true, force: true });
    if (originalRunnerTemp === undefined) {
      delete process.env.RUNNER_TEMP;
    } else {
      process.env.RUNNER_TEMP = originalRunnerTemp;
    }
  });

  it("should let gpg-agent start in the longest GPG home accepted by setupGpgHome", (t) => {
    if (process.platform === "win32") {
      t.skip("Unix domain socket limits do not apply to Gpg4win / Git for Windows sockets");
      return;
    }
    if (!isGpgAvailable()) {
      t.skip("gpg is not installed on this machine");
      return;
    }

    gpgHome = createGpgHomeAtAcceptanceBoundary(runnerTempRoot);

    if (socketDirectoryOf(gpgHome) !== gpgHome) {
      t.skip("gpg places its sockets under /run/user/<uid>, so the GPG home length is irrelevant here");
      return;
    }

    const socketPathLength = path.join(gpgHome, "S.gpg-agent.browser").length;
    const generationResult = generateThrowawayKey(gpgHome);

    assert.equal(
      generationResult.status,
      0,
      `gpg --quick-gen-key exited with ${generationResult.status} for a GPG home accepted by setupGpgHome() ` +
        `(socket path length ${socketPathLength} on ${process.platform}).\n${generationResult.stderr}`
    );
  });
});
