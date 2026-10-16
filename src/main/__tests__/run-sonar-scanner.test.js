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
import { it, mock } from "node:test";

it("preserves documented scanner argument quoting without evaluating shell syntax", async (t) => {
  const execFn = mock.fn(async () => 0);
  t.mock.module("@actions/core", { namedExports: { info: mock.fn() } });
  t.mock.module("@actions/exec", { namedExports: { exec: execFn } });
  t.mock.module("node:fs", { namedExports: { existsSync: () => false } });

  const { runSonarScanner } = await import("../run-sonar-scanner.js");

  await runSonarScanner(
    `-Dsonar.property="some value" "-Dsonar.projectName=My Project" -Dsonar.literal='$(whoami)'`,
    "",
    "/scanner",
    { runnerOs: "Linux" }
  );

  assert.equal(execFn.mock.calls.length, 1);
  assert.deepEqual(execFn.mock.calls[0].arguments, [
    "sonar-scanner",
    [
      '-Dsonar.property="some value"',
      "-Dsonar.projectName=My Project",
      "-Dsonar.literal='$(whoami)'",
    ],
  ]);
});
