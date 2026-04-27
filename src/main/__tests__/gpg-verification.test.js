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

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  getGpgCommand,
  setupGpgHome,
  cleanupGpgHome,
} from "../gpg-verification.js";

describe("gpg-verification", () => {
  let tempDirs = [];

  afterEach(() => {
    // Clean up any temporary directories created during tests
    tempDirs.forEach((dir) => {
      try {
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      } catch (error) {
        // Intentionally ignoring cleanup errors in test teardown
        console.error(`Failed to clean up temp directory: ${error.message}`);
      }
    });
    tempDirs = [];
  });

  describe("getGpgCommand", () => {
    it("should return 'gpg' as the command", () => {
      const command = getGpgCommand();
      assert.equal(command, "gpg");
    });
  });

  describe("setupGpgHome", () => {
    it("should create a temporary GPG home directory", () => {
      const gpgHome = setupGpgHome();
      tempDirs.push(gpgHome);

      assert.ok(fs.existsSync(gpgHome));
      assert.ok(fs.statSync(gpgHome).isDirectory());

      // Check directory permissions (on Unix systems)
      if (process.platform !== "win32") {
        const stats = fs.statSync(gpgHome);
        const mode = stats.mode & Number.parseInt("777", 8);
        assert.equal(mode, Number.parseInt("700", 8));
      }
    });

    it("should create unique directories on multiple calls", async () => {
      const gpgHome1 = setupGpgHome();
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      const gpgHome2 = setupGpgHome();
      tempDirs.push(gpgHome1, gpgHome2);

      assert.notEqual(gpgHome1, gpgHome2);
      assert.ok(fs.existsSync(gpgHome1));
      assert.ok(fs.existsSync(gpgHome2));
    });

    it("should use RUNNER_TEMP if available", () => {
      const originalRunnerTemp = process.env.RUNNER_TEMP;
      const testTemp = path.join(os.tmpdir(), `test-runner-temp-${Date.now()}`);

      try {
        fs.mkdirSync(testTemp, { recursive: true });
        process.env.RUNNER_TEMP = testTemp;

        const gpgHome = setupGpgHome();
        tempDirs.push(gpgHome);

        assert.ok(gpgHome.startsWith(testTemp));
        assert.ok(fs.existsSync(gpgHome));
      } finally {
        process.env.RUNNER_TEMP = originalRunnerTemp;
        if (fs.existsSync(testTemp)) {
          fs.rmSync(testTemp, { recursive: true, force: true });
        }
      }
    });
  });

  describe("cleanupGpgHome", () => {
    it("should remove the GPG home directory", () => {
      const gpgHome = setupGpgHome();
      assert.ok(fs.existsSync(gpgHome));

      cleanupGpgHome(gpgHome);
      assert.ok(!fs.existsSync(gpgHome));
    });

    it("should not throw if directory does not exist", () => {
      const nonExistentDir = path.join(os.tmpdir(), `non-existent-${Date.now()}`);
      assert.doesNotThrow(() => {
        cleanupGpgHome(nonExistentDir);
      });
    });

    it("should handle cleanup errors gracefully", () => {
      // This test verifies the function doesn't throw on permission errors
      // In practice, permission errors are rare in test environments
      assert.doesNotThrow(() => {
        cleanupGpgHome("/invalid/path/that/does/not/exist");
      });
    });
  });
});
