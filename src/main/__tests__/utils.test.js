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

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPlatformFlavor,
  getScannerDownloadURL,
  scannerDirName,
  toSemVer,
} from "../utils.js";

describe("getPlatformFlavor", () => {
  const supportedPlatforms = [
    { platform: "linux", arch: "x64", expected: "linux-x64" },
    { platform: "linux", arch: "arm64", expected: "linux-aarch64" },
    { platform: "win32", arch: "x64", expected: "windows-x64" },
    { platform: "darwin", arch: "x64", expected: "macosx-x64" },
    { platform: "darwin", arch: "arm64", expected: "macosx-aarch64" },
  ];

  const unsupportedPlatforms = [
    { platform: "linux", arch: "arm" },
    { platform: "openbsd", arch: "x64" },
    { platform: undefined, arch: "x64" },
    { platform: "linux", arch: undefined },
    { platform: null, arch: "x64" },
    { platform: "linux", arch: null },
  ];

  supportedPlatforms.forEach(({ platform, arch, expected }) => {
    it(`returns ${expected} for ${platform} ${arch}`, () => {
      assert.equal(getPlatformFlavor(platform, arch), expected);
    });
  });

  unsupportedPlatforms.forEach(({ platform, arch }) => {
    it(`throws for unsupported platform ${platform} ${arch}`, () => {
      assert.throws(
        () => getPlatformFlavor(platform, arch),
        {
          message: `Platform ${platform} ${arch} not supported`,
        },
        `should have thrown for ${platform} ${arch}`
      );
    });
  });
});

describe("getScannerDownloadURL", () => {
  it("generates correct URL without trailing slash", () => {
    const result = getScannerDownloadURL({
      scannerBinariesUrl:
        "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli",
      scannerVersion: "7.2.0.5079",
      flavor: "linux-x64",
    });
    assert.equal(
      result,
      "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-7.2.0.5079-linux-x64.zip"
    );
  });

  it("generates correct URL with trailing slash", () => {
    const result = getScannerDownloadURL({
      scannerBinariesUrl:
        "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/",
      scannerVersion: "7.2.0.5079",
      flavor: "linux-x64",
    });
    assert.equal(
      result,
      "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-7.2.0.5079-linux-x64.zip"
    );
  });
});

describe("scannerDirName", () => {
  it("handles special characters", () => {
    assert.equal(
      scannerDirName("7.2.0-SNAPSHOT", "linux_x64"),
      "sonar-scanner-7.2.0-SNAPSHOT-linux_x64"
    );
  });
});

describe("toSemVer", () => {
  it("converts 4-part version to semver pre-release format", () => {
    assert.equal(toSemVer("8.0.1.6346"), "8.0.1-build.6346");
  });

  it("leaves 3-part semver version unchanged", () => {
    assert.equal(toSemVer("8.0.1"), "8.0.1");
  });

  it("leaves version with pre-release identifier unchanged", () => {
    assert.equal(toSemVer("7.2.0-SNAPSHOT"), "7.2.0-SNAPSHOT");
  });

  it("converts different 4-part versions correctly", () => {
    assert.equal(toSemVer("6.2.0.4584"), "6.2.0-build.4584");
    assert.equal(toSemVer("8.1.0.6389"), "8.1.0-build.6389");
  });
});
