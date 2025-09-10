import mockfs from "mock-fs";
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import {
  checkGradleProject,
  checkMavenProject,
  checkSonarToken,
  validateScannerVersion,
} from "../sanity-checks.js";
import { mockCore } from "./mocks.js";

describe("validateScannerVersion", () => {
  const expected =
    "Invalid scannerVersion format. Expected format: x.y.z.w (e.g., 7.1.0.4889)";

  const validVersions = [undefined, "", "7.1.0.4889", "1.2.3.4"];

  const invalidVersions = [
    "wrong",
    "4.2.",
    "7.1.0",
    "7.1.0.abc",
    "7.1.0.4889.5",
    "7.1",
    "7",
    "7.1.0.",
    ".7.1.0.4889",
    "7..1.0.4889",
    "7.1..0.4889",
    "7.1.0..4889",
    "a.b.c.d",
    "7.1.0.4889-SNAPSHOT",
    "v7.1.0.4889",
    "7.1.0.4889.0.0",
    "-7.1.0.4889",
    "7.-1.0.4889",
    "7.1.-0.4889",
    "7.1.0.-4889",
    "7.1.0.4889 ",
    " 7.1.0.4889",
    "7.1.0.4889\n",
    "7,1,0,4889",
  ];

  validVersions.forEach((version) => {
    it(`accepts ${version}`, () => {
      assert.equal(validateScannerVersion(version), undefined);
    });
  });

  invalidVersions.forEach((version) =>
    it(`throws for ${version}`, () => {
      assert.throws(
        () => validateScannerVersion(version),
        {
          message: expected,
        },
        `should have thrown for ${version}`
      );
    })
  );
});

describe("checkSonarToken", () => {
  it("calls core.warning when SONAR_TOKEN is not set", () => {
    const warning = mock.fn();

    checkSonarToken(mockCore({ warning }));

    assert.equal(warning.mock.calls.length, 1);
    assert.equal(
      warning.mock.calls[0].arguments[0],
      "Running this GitHub Action without SONAR_TOKEN is not recommended"
    );
  });

  it("does not call core.warning when SONAR_TOKEN is set", () => {
    const warning = mock.fn();

    checkSonarToken(mockCore({ warning }), "test-token");

    assert.equal(warning.mock.calls.length, 0);
  });
});

describe("checkMavenProject", () => {
  it("calls core.warning when pom.xml exists", async () => {
    mockfs({ "/test/project/": { "pom.xml": "" } });
    const warning = mock.fn();

    checkMavenProject({ warning }, "/test/project");

    assert.equal(warning.mock.calls.length, 1);
    assert.equal(
      warning.mock.calls[0].arguments[0],
      "Maven project detected. Sonar recommends running the 'org.sonarsource.scanner.maven:sonar-maven-plugin:sonar' goal during the build process instead of using this GitHub Action to get more accurate results."
    );

    mockfs.restore();
  });

  it("does not call core.warning when pom.xml does not exist", async () => {
    mockfs({ "/test/project/": {} });
    const warning = mock.fn();

    checkMavenProject(mockCore({ warning }), "/test/project");

    assert.equal(warning.mock.calls.length, 0);

    mockfs.restore();
  });

  it("handles project base dir with trailing slash", async () => {
    mockfs({ "/test/project/": { "pom.xml": "" } });
    const warning = mock.fn();

    checkMavenProject(mockCore({ warning }), "/test/project/");
    assert.equal(warning.mock.calls.length, 1);

    mockfs.restore();
  });
});

describe("checkGradleProject", () => {
  it("calls core.warning when build.gradle exists", async () => {
    mockfs({ "/test/project/": { "build.gradle": "" } });

    const warning = mock.fn();

    checkGradleProject(mockCore({ warning }), "/test/project");

    assert.equal(warning.mock.calls.length, 1);
    assert.equal(
      warning.mock.calls[0].arguments[0],
      "Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action to get more accurate results."
    );

    mockfs.restore();
  });

  it("calls core.warning when build.gradle.kts exists", async () => {
    mockfs({ "/test/project/": { "build.gradle.kts": "" } });

    const warning = mock.fn();

    checkGradleProject(mockCore({ warning }), "/test/project");

    assert.equal(warning.mock.calls.length, 1);
    assert.equal(
      warning.mock.calls[0].arguments[0],
      "Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action to get more accurate results."
    );

    mockfs.restore();
  });

  it("does not call core.warning when neither gradle file exists", async () => {
    mockfs({ "/test/project/": {} });

    const warning = mock.fn();

    checkGradleProject(mockCore({ warning }), "/test/project");

    assert.equal(warning.mock.calls.length, 0);

    mockfs.restore();
  });

  it("handles project base dir with trailing slash", async () => {
    mockfs({ "/test/project/": { "build.gradle": "" } });
    const warning = mock.fn();

    checkGradleProject(mockCore({ warning }), "/test/project/");

    assert.equal(warning.mock.calls.length, 1);
  });
});
