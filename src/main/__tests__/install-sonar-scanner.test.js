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

import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import nodeFsPromises from "node:fs/promises";

const SCANNER_VERSION = "6.2.0.4584";
const SCANNER_SEMVER_VERSION = "6.2.0-build.4584";
const BINARIES_URL = "https://my.artifactory.example.com/sonar-scanner-cli";
const BINARY_DOWNLOAD_URL = `${BINARIES_URL}/sonar-scanner-cli-${SCANNER_VERSION}-linux-x64.zip`;

function mockUtils(t) {
  t.mock.module("../utils.js", {
    namedExports: {
      getPlatformFlavor: mock.fn(() => "linux-x64"),
      getScannerDownloadURL: mock.fn(() => BINARY_DOWNLOAD_URL),
      scannerDirName: mock.fn(() => `sonar-scanner-${SCANNER_VERSION}-linux-x64`),
      toSemVer: mock.fn(() => SCANNER_SEMVER_VERSION),
    },
  });
}

function mockFsPromises(t) {
  t.mock.module("node:fs/promises", {
    namedExports: {
      ...nodeFsPromises,
      rename: mock.fn(async () => {}),
    },
  });
}

describe("installSonarScanner", () => {
  it("should forward scannerBinariesAuthHeader to both binary and signature downloads", async (t) => {
    const downloadCalls = [];
    const downloadToolFn = mock.fn(async (url, dest, auth) => {
      downloadCalls.push({ url, auth });
      return `/tmp/downloaded-${downloadCalls.length}`;
    });

    mockUtils(t);
    mockFsPromises(t);

    t.mock.module("@actions/tool-cache", {
      namedExports: {
        find: mock.fn(() => null),
        downloadTool: downloadToolFn,
        extractZip: mock.fn(async () => "/tmp/extracted"),
        cacheDir: mock.fn(async () => "/tmp/cached"),
      },
    });

    t.mock.module("@actions/core", {
      namedExports: {
        info: mock.fn(),
        warning: mock.fn(),
        addPath: mock.fn(),
      },
    });

    t.mock.module("../gpg-verification.js", {
      namedExports: {
        verifySignature: mock.fn(async () => {}),
      },
    });

    const { installSonarScanner } = await import(
      `../install-sonar-scanner.js?test=auth-header`
    );

    await installSonarScanner({
      scannerVersion: SCANNER_VERSION,
      scannerBinariesUrl: BINARIES_URL,
      scannerBinariesAuthHeader: "Bearer mytoken",
    });

    assert.equal(downloadCalls.length, 2, "Should download binary and signature");
    assert.equal(downloadCalls[0].auth, "Bearer mytoken", "Binary download should use auth header");
    assert.equal(downloadCalls[1].auth, "Bearer mytoken", "Signature download should use auth header");
    assert.ok(downloadCalls[1].url.endsWith(".asc"), "Second download should be the signature");
  });

  it("should not set auth header when scannerBinariesAuthHeader is not provided", async (t) => {
    const downloadCalls = [];
    const downloadToolFn = mock.fn(async (url, dest, auth) => {
      downloadCalls.push({ url, auth });
      return `/tmp/downloaded-${downloadCalls.length}`;
    });

    mockUtils(t);
    mockFsPromises(t);

    t.mock.module("@actions/tool-cache", {
      namedExports: {
        find: mock.fn(() => null),
        downloadTool: downloadToolFn,
        extractZip: mock.fn(async () => "/tmp/extracted"),
        cacheDir: mock.fn(async () => "/tmp/cached"),
      },
    });

    t.mock.module("@actions/core", {
      namedExports: {
        info: mock.fn(),
        warning: mock.fn(),
        addPath: mock.fn(),
      },
    });

    t.mock.module("../gpg-verification.js", {
      namedExports: {
        verifySignature: mock.fn(async () => {}),
      },
    });

    const { installSonarScanner } = await import(
      `../install-sonar-scanner.js?test=no-auth-header`
    );

    await installSonarScanner({
      scannerVersion: SCANNER_VERSION,
      scannerBinariesUrl: BINARIES_URL,
    });

    assert.equal(downloadCalls.length, 2);
    assert.equal(downloadCalls[0].auth, undefined, "Binary download should have no auth header");
    assert.equal(downloadCalls[1].auth, undefined, "Signature download should have no auth header");
  });

  it("should skip signature download when skipSignatureVerification is true", async (t) => {
    const downloadCalls = [];
    const downloadToolFn = mock.fn(async (url, dest, auth) => {
      downloadCalls.push({ url, auth });
      return `/tmp/downloaded-${downloadCalls.length}`;
    });

    mockUtils(t);
    mockFsPromises(t);

    t.mock.module("@actions/tool-cache", {
      namedExports: {
        find: mock.fn(() => null),
        downloadTool: downloadToolFn,
        extractZip: mock.fn(async () => "/tmp/extracted"),
        cacheDir: mock.fn(async () => "/tmp/cached"),
      },
    });

    t.mock.module("@actions/core", {
      namedExports: {
        info: mock.fn(),
        warning: mock.fn(),
        addPath: mock.fn(),
      },
    });

    const { installSonarScanner } = await import(
      `../install-sonar-scanner.js?test=skip-sig`
    );

    await installSonarScanner({
      scannerVersion: SCANNER_VERSION,
      scannerBinariesUrl: BINARIES_URL,
      scannerBinariesAuthHeader: "Bearer mytoken",
      skipSignatureVerification: true,
    });

    assert.equal(downloadCalls.length, 1, "Should only download binary, not signature");
    assert.equal(downloadCalls[0].auth, "Bearer mytoken");
  });

  it("should use semver-compatible version for tool-cache find and cacheDir", async (t) => {
    const findFn = mock.fn(() => null);
    const cacheDirFn = mock.fn(async () => "/tmp/cached");

    mockUtils(t);
    mockFsPromises(t);

    t.mock.module("@actions/tool-cache", {
      namedExports: {
        find: findFn,
        downloadTool: mock.fn(async () => "/tmp/downloaded"),
        extractZip: mock.fn(async () => "/tmp/extracted"),
        cacheDir: cacheDirFn,
      },
    });

    t.mock.module("@actions/core", {
      namedExports: {
        info: mock.fn(),
        warning: mock.fn(),
        addPath: mock.fn(),
      },
    });

    t.mock.module("../gpg-verification.js", {
      namedExports: {
        verifySignature: mock.fn(async () => {}),
      },
    });

    const { installSonarScanner } = await import(
      `../install-sonar-scanner.js?test=semver-version`
    );

    await installSonarScanner({
      scannerVersion: SCANNER_VERSION,
      scannerBinariesUrl: BINARIES_URL,
    });

    assert.equal(findFn.mock.calls[0].arguments[1], SCANNER_SEMVER_VERSION,
      "tc.find should be called with semver-compatible version");
    assert.equal(cacheDirFn.mock.calls[0].arguments[2], SCANNER_SEMVER_VERSION,
      "tc.cacheDir should be called with semver-compatible version");
  });

  it("should rename downloaded file to add .zip extension before extraction", async (t) => {
    const renameCalls = [];
    const extractZipCalls = [];

    mockUtils(t);

    t.mock.module("node:fs/promises", {
      namedExports: {
        ...nodeFsPromises,
        rename: mock.fn(async (src, dest) => {
          renameCalls.push({ src, dest });
        }),
      },
    });

    t.mock.module("@actions/tool-cache", {
      namedExports: {
        find: mock.fn(() => null),
        downloadTool: mock.fn(async () => "/tmp/downloaded-file"),
        extractZip: mock.fn(async (p) => {
          extractZipCalls.push(p);
          return "/tmp/extracted";
        }),
        cacheDir: mock.fn(async () => "/tmp/cached"),
      },
    });

    t.mock.module("@actions/core", {
      namedExports: {
        info: mock.fn(),
        warning: mock.fn(),
        addPath: mock.fn(),
      },
    });

    t.mock.module("../gpg-verification.js", {
      namedExports: {
        verifySignature: mock.fn(async () => {}),
      },
    });

    const { installSonarScanner } = await import(
      `../install-sonar-scanner.js?test=rename-zip`
    );

    await installSonarScanner({
      scannerVersion: SCANNER_VERSION,
      scannerBinariesUrl: BINARIES_URL,
      skipSignatureVerification: true,
    });

    assert.equal(renameCalls.length, 1, "Should rename downloaded file");
    assert.equal(renameCalls[0].src, "/tmp/downloaded-file");
    assert.equal(renameCalls[0].dest, "/tmp/downloaded-file.zip");
    assert.equal(extractZipCalls.length, 1, "Should call extractZip once");
    assert.equal(extractZipCalls[0], "/tmp/downloaded-file.zip", "Should extract the renamed file");
  });

  it("should not rename downloaded file when it already has .zip extension", async (t) => {
    const renameCalls = [];
    const extractZipCalls = [];

    mockUtils(t);

    t.mock.module("node:fs/promises", {
      namedExports: {
        ...nodeFsPromises,
        rename: mock.fn(async (src, dest) => {
          renameCalls.push({ src, dest });
        }),
      },
    });

    t.mock.module("@actions/tool-cache", {
      namedExports: {
        find: mock.fn(() => null),
        downloadTool: mock.fn(async () => "/tmp/downloaded-file.zip"),
        extractZip: mock.fn(async (p) => {
          extractZipCalls.push(p);
          return "/tmp/extracted";
        }),
        cacheDir: mock.fn(async () => "/tmp/cached"),
      },
    });

    t.mock.module("@actions/core", {
      namedExports: {
        info: mock.fn(),
        warning: mock.fn(),
        addPath: mock.fn(),
      },
    });

    t.mock.module("../gpg-verification.js", {
      namedExports: {
        verifySignature: mock.fn(async () => {}),
      },
    });

    const { installSonarScanner } = await import(
      `../install-sonar-scanner.js?test=no-rename-zip`
    );

    await installSonarScanner({
      scannerVersion: SCANNER_VERSION,
      scannerBinariesUrl: BINARIES_URL,
      skipSignatureVerification: true,
    });

    assert.equal(renameCalls.length, 0, "Should not rename when already .zip");
    assert.equal(extractZipCalls.length, 1, "Should call extractZip once");
    assert.equal(extractZipCalls[0], "/tmp/downloaded-file.zip", "Should extract original file");
  });

  it("should use cached tool when available and skip download", async (t) => {
    const downloadToolFn = mock.fn();

    mockUtils(t);

    t.mock.module("@actions/tool-cache", {
      namedExports: {
        find: mock.fn(() => "/tmp/cached-tool"),
        downloadTool: downloadToolFn,
        extractZip: mock.fn(),
        cacheDir: mock.fn(),
      },
    });

    t.mock.module("@actions/core", {
      namedExports: {
        info: mock.fn(),
        warning: mock.fn(),
        addPath: mock.fn(),
      },
    });

    const { installSonarScanner } = await import(
      `../install-sonar-scanner.js?test=cached`
    );

    await installSonarScanner({
      scannerVersion: SCANNER_VERSION,
      scannerBinariesUrl: BINARIES_URL,
    });

    assert.equal(downloadToolFn.mock.calls.length, 0, "Should not download when cached");
  });
});
