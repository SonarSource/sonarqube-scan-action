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
import * as os from "node:os";
import * as path from "node:path";
import {
  getGpgCommand,
  setupGpgHome,
  cleanupGpgHome,
  convertToUnixPath,
} from "../gpg-verification.js";

/**
 * Helper function to temporarily mock process.platform for a test.
 * Automatically restores the original platform value after the test.
 * @param {string} platform - The platform to mock (e.g., "win32", "linux")
 * @param {Function} testFn - The test function to run with the mocked platform
 */
function withMockedPlatform(platform, testFn) {
  const originalPlatform = process.platform;
  Object.defineProperty(process, "platform", {
    value: platform,
    writable: true,
    configurable: true,
  });

  try {
    testFn();
  } finally {
    Object.defineProperty(process, "platform", {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  }
}

/**
 * Helper function to create a GPG home directory and track it for cleanup.
 * @param {Array} tempDirs - Array to track temporary directories for cleanup
 * @returns {string} The path to the created GPG home directory
 */
function createTrackedGpgHome(tempDirs) {
  const gpgHome = setupGpgHome();
  tempDirs.push(gpgHome);
  assert.ok(fs.existsSync(gpgHome));
  return gpgHome;
}

/**
 * Helper function to temporarily mock environment variables for a test.
 * Automatically restores or deletes environment variables after the test.
 * @param {Object} envVars - Object with environment variable names as keys and values as values
 * @param {Function} testFn - The async test function to run with the mocked environment
 */
async function withMockedEnv(envVars, testFn) {
  const originalValues = {};

  // Save original values and set new ones
  for (const [key, value] of Object.entries(envVars)) {
    originalValues[key] = process.env[key];
    process.env[key] = value;
  }

  try {
    await testFn();
  } finally {
    // Restore or delete environment variables
    for (const [key, originalValue] of Object.entries(originalValues)) {
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  }
}

/**
 * Helper function to create a temporary directory.
 * @returns {string} The path to the created temporary directory
 */
function createTempDir() {
  const tempDir = path.join(os.tmpdir(), `test-runner-temp-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

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
        // Ignore cleanup errors
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

  describe("convertToUnixPath", () => {
    it("should convert Windows path with drive letter to Unix path", () => {
      withMockedPlatform("win32", () => {
        assert.equal(
            convertToUnixPath(String.raw`C:\a\_temp\gpg-home`),
          "/c/a/_temp/gpg-home"
        );
        assert.equal(
            convertToUnixPath(String.raw`D:\Users\test\file.txt`),
          "/d/Users/test/file.txt"
        );
      });
    });

    it("should handle mixed slashes on Windows", () => {
      withMockedPlatform("win32", () => {
        assert.equal(
            convertToUnixPath(String.raw`C:\a/_temp\gpg-home`),
          "/c/a/_temp/gpg-home"
        );
      });
    });

    it("should return path unchanged on non-Windows platforms", () => {
      withMockedPlatform("linux", () => {
        assert.equal(
          convertToUnixPath("/tmp/gpg-home"),
          "/tmp/gpg-home"
        );
      });
    });
  });

  describe("setupGpgHome", () => {
    it("should create a temporary GPG home directory", () => {
      const gpgHome = createTrackedGpgHome(tempDirs);

      assert.ok(fs.statSync(gpgHome).isDirectory());

      // Check directory permissions (on Unix systems)
      if (process.platform !== "win32") {
        const stats = fs.statSync(gpgHome);
        const mode = stats.mode & Number.parseInt("777", 8);
        assert.equal(mode, Number.parseInt("700", 8));
      }
    });

    it("should create unique directories on multiple calls", async () => {
      const gpgHome1 = createTrackedGpgHome(tempDirs);
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      const gpgHome2 = createTrackedGpgHome(tempDirs);

      assert.notEqual(gpgHome1, gpgHome2);
    });

    it("should use RUNNER_TEMP if available", async () => {
      const testTemp = createTempDir();

      await withMockedEnv({ RUNNER_TEMP: testTemp }, async () => {
        const gpgHome = createTrackedGpgHome(tempDirs);
        assert.ok(gpgHome.startsWith(testTemp));
      });

      if (fs.existsSync(testTemp)) {
        fs.rmSync(testTemp, { recursive: true, force: true });
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
