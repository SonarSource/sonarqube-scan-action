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

import { readFileSync } from "node:fs";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

// Ensures CRLF line endings from a Windows checkout don't leak into the
// bundle or the source map's sourcesContent, so the build is reproducible
// across operating systems. Uses `load` rather than `transform` so the
// normalized text is also what Rollup embeds in sourcesContent.
const normalizeLineEndings = {
  name: "normalize-line-endings",
  load(id) {
    if (id.startsWith("\0") || id.includes("?")) return null;
    const code = readFileSync(id, "utf8");
    return code.includes("\r") ? code.replaceAll("\r\n", "\n") : null;
  },
};

const config = {
  input: [
    "src/main/index.js",
    "src/install-build-wrapper/install-build-wrapper.js",
  ],
  output: {
    esModule: true,
    dir: "dist",
    format: "es",
    sourcemap: true,
  },
  plugins: [normalizeLineEndings, commonjs(), nodeResolve({ preferBuiltins: true })],
};

export default config;
