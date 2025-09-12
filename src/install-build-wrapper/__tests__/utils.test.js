import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBuildWrapperInfo } from "../utils.js";

describe("getBuildWrapperInfo", () => {
  const supportedPlatforms = [
    {
      platform: "Linux",
      arch: "X64",
      expectedSuffix: "linux-x86",
      expectedName: "build-wrapper-linux-x86-64",
    },
    {
      platform: "Linux",
      arch: "ARM64",
      expectedSuffix: "linux-aarch64",
      expectedName: "build-wrapper-linux-aarch64",
    },
    {
      platform: "Windows",
      arch: "X64",
      expectedSuffix: "win-x86",
      expectedName: "build-wrapper-win-x86-64.exe",
    },
    {
      platform: "macOS",
      arch: "X64",
      expectedSuffix: "macosx-x86",
      expectedName: "build-wrapper-macosx-x86",
    },
    {
      platform: "macOS",
      arch: "ARM64",
      expectedSuffix: "macosx-x86",
      expectedName: "build-wrapper-macosx-x86",
    },
  ];

  const unsupportedPlatforms = [
    { platform: "linux", arch: "arm" },
    { platform: "openbsd", arch: "X64" },
    { platform: undefined, arch: "X64" },
    { platform: "Linux", arch: undefined },
    { platform: null, arch: "X64" },
    { platform: "Linux", arch: null },
  ];

  supportedPlatforms.forEach(
    ({ platform, arch, expectedSuffix, expectedName }) => {
      it(`returns ${expectedName} for ${platform} ${arch}`, () => {
        const result = getBuildWrapperInfo({
          runnerOS: platform,
          runnerArch: arch,
          runnerTemp: "/tmp",
          sonarHostUrl: "https://sonarcloud.io"
        });
        assert.equal(result.buildWrapperUrl, `https://sonarcloud.io/static/cpp/build-wrapper-${expectedSuffix}.zip`);
        assert.equal(result.buildWrapperDir, `/tmp/build-wrapper-${expectedSuffix}`);
        assert.equal(result.buildWrapperBin, `/tmp/build-wrapper-${expectedSuffix}/${expectedName}`);
      });
    }
  );

  unsupportedPlatforms.forEach(({ platform, arch }) => {
    it(`throws for unsupported platform ${platform} ${arch}`, () => {
      assert.throws(
        () => getBuildWrapperInfo({
          runnerOS: platform,
          runnerArch: arch,
          runnerTemp: "/tmp",
          sonarHostUrl: "https://sonarcloud.io"
        }),
        (error) => {
          return error.message.includes('unsupported') || error.message.includes('Unsupported');
        },
        `should have thrown for ${platform} ${arch}`
      );
    });
  });
});
