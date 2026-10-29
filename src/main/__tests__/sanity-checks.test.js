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
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, mock } from "node:test";
import {
  checkGradleProject,
  checkMavenProject,
  checkSonarToken,
  validateScannerVersion,
} from "../sanity-checks.js";
import { mockCore } from "./mocks.js";

function createProject(t, files = []) {
  const projectDir = mkdtempSync(join(tmpdir(), "sonarqube-scan-action-"));
  t.after(() => rmSync(projectDir, { recursive: true, force: true }));
  for (const file of files) {
    writeFileSync(join(projectDir, file), "");
  }
  return projectDir;
}

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
  it("calls core.warning when pom.xml exists", (t) => {
    const projectDir = createProject(t, ["pom.xml"]);
    const warning = mock.fn();

    checkMavenProject({ warning }, projectDir);

    assert.equal(warning.mock.calls.length, 1);
    assert.equal(
      warning.mock.calls[0].arguments[0],
      "Maven project detected. Sonar recommends running the 'org.sonarsource.scanner.maven:sonar-maven-plugin:sonar' goal during the build process instead of using this GitHub Action to get more accurate results."
    );
  });

  it("does not call core.warning when pom.xml does not exist", (t) => {
    const projectDir = createProject(t);
    const warning = mock.fn();

    checkMavenProject(mockCore({ warning }), projectDir);

    assert.equal(warning.mock.calls.length, 0);
  });

  it("handles project base dir with trailing slash", (t) => {
    const projectDir = createProject(t, ["pom.xml"]);
    const warning = mock.fn();

    checkMavenProject(mockCore({ warning }), `${projectDir}/`);
    assert.equal(warning.mock.calls.length, 1);
  });
});

describe("checkGradleProject", () => {
  it("calls core.warning when build.gradle exists", (t) => {
    const projectDir = createProject(t, ["build.gradle"]);

    const warning = mock.fn();

    checkGradleProject(mockCore({ warning }), projectDir);

    assert.equal(warning.mock.calls.length, 1);
    assert.equal(
      warning.mock.calls[0].arguments[0],
      "Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action to get more accurate results."
    );
  });

  it("calls core.warning when build.gradle.kts exists", (t) => {
    const projectDir = createProject(t, ["build.gradle.kts"]);

    const warning = mock.fn();

    checkGradleProject(mockCore({ warning }), projectDir);

    assert.equal(warning.mock.calls.length, 1);
    assert.equal(
      warning.mock.calls[0].arguments[0],
      "Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action to get more accurate results."
    );
  });

  it("does not call core.warning when neither gradle file exists", (t) => {
    const projectDir = createProject(t);

    const warning = mock.fn();

    checkGradleProject(mockCore({ warning }), projectDir);

    assert.equal(warning.mock.calls.length, 0);
  });

  it("handles project base dir with trailing slash", (t) => {
    const projectDir = createProject(t, ["build.gradle"]);
    const warning = mock.fn();

    checkGradleProject(mockCore({ warning }), `${projectDir}/`);

    assert.equal(warning.mock.calls.length, 1);
  });
});
