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

function mockDependencies(t, { getInputFn, setSecretFn }) {
  t.mock.module("@actions/core", {
    namedExports: {
      getInput: getInputFn,
      getBooleanInput: mock.fn(() => false),
      setSecret: setSecretFn,
      setFailed: mock.fn(),
      info: mock.fn(),
      warning: mock.fn(),
    },
  });
  t.mock.module("../install-sonar-scanner.js", {
    namedExports: { installSonarScanner: mock.fn(async () => "/scanner") },
  });
  t.mock.module("../run-sonar-scanner.js", {
    namedExports: { runSonarScanner: mock.fn(async () => {}) },
  });
  t.mock.module("../sanity-checks.js", {
    namedExports: {
      validateScannerVersion: mock.fn(),
      checkSonarToken: mock.fn(),
      checkMavenProject: mock.fn(),
      checkGradleProject: mock.fn(),
    },
  });
}

describe("SONARCLOUD_URL deprecation", () => {
  it("should warn when SONARCLOUD_URL is set", async (t) => {
    const warningFn = mock.fn();
    const getInputFn = mock.fn(() => "");

    t.mock.module("@actions/core", {
      namedExports: {
        getInput: getInputFn,
        getBooleanInput: mock.fn(() => false),
        setSecret: mock.fn(),
        setFailed: mock.fn(),
        info: mock.fn(),
        warning: warningFn,
      },
    });
    t.mock.module("../install-sonar-scanner.js", {
      namedExports: { installSonarScanner: mock.fn(async () => "/scanner") },
    });
    t.mock.module("../run-sonar-scanner.js", {
      namedExports: { runSonarScanner: mock.fn(async () => {}) },
    });
    t.mock.module("../sanity-checks.js", {
      namedExports: {
        validateScannerVersion: mock.fn(),
        checkSonarToken: mock.fn(),
        checkMavenProject: mock.fn(),
        checkGradleProject: mock.fn(),
      },
    });

    process.env.SONARCLOUD_URL = "mirror.sonarcloud.io";
    t.after(() => delete process.env.SONARCLOUD_URL);

    await import("../index.js?test=deprecation-warning");

    assert.equal(warningFn.mock.calls.length, 1);
    assert.match(
      warningFn.mock.calls[0].arguments[0],
      /SONARCLOUD_URL.*deprecated/
    );
  });

  it("should not warn when SONARCLOUD_URL is not set", async (t) => {
    const warningFn = mock.fn();
    const getInputFn = mock.fn(() => "");

    t.mock.module("@actions/core", {
      namedExports: {
        getInput: getInputFn,
        getBooleanInput: mock.fn(() => false),
        setSecret: mock.fn(),
        setFailed: mock.fn(),
        info: mock.fn(),
        warning: warningFn,
      },
    });
    t.mock.module("../install-sonar-scanner.js", {
      namedExports: { installSonarScanner: mock.fn(async () => "/scanner") },
    });
    t.mock.module("../run-sonar-scanner.js", {
      namedExports: { runSonarScanner: mock.fn(async () => {}) },
    });
    t.mock.module("../sanity-checks.js", {
      namedExports: {
        validateScannerVersion: mock.fn(),
        checkSonarToken: mock.fn(),
        checkMavenProject: mock.fn(),
        checkGradleProject: mock.fn(),
      },
    });

    delete process.env.SONARCLOUD_URL;

    await import("../index.js?test=no-deprecation-warning");

    assert.equal(warningFn.mock.calls.length, 0);
  });
});

describe("getInputs", () => {
  it("should mask scannerBinariesAuthHeader using setSecret when provided", async (t) => {
    const setSecretFn = mock.fn();
    const getInputFn = mock.fn((name) => name === "scannerBinariesAuthHeader" ? "Bearer mytoken" : "");

    mockDependencies(t, { getInputFn, setSecretFn });

    await import("../index.js?test=set-secret");

    assert.equal(setSecretFn.mock.calls.length, 1);
    assert.equal(setSecretFn.mock.calls[0].arguments[0], "Bearer mytoken");
  });

  it("should not call setSecret when scannerBinariesAuthHeader is not provided", async (t) => {
    const setSecretFn = mock.fn();
    const getInputFn = mock.fn(() => "");

    mockDependencies(t, { getInputFn, setSecretFn });

    await import("../index.js?test=no-set-secret");

    assert.equal(setSecretFn.mock.calls.length, 0);
  });
});
