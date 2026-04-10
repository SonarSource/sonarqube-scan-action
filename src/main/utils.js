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

const platformFlavor = {
  linux: {
    x64: "linux-x64",
    arm64: "linux-aarch64",
  },
  win32: {
    x64: "windows-x64",
  },
  darwin: {
    x64: "macosx-x64",
    arm64: "macosx-aarch64",
  },
};

export function getPlatformFlavor(platform, arch) {
  const flavor = platformFlavor[platform]?.[arch];

  if (!flavor) {
    throw new Error(`Platform ${platform} ${arch} not supported`);
  }

  return flavor;
}

export function getScannerDownloadURL({
  scannerBinariesUrl,
  scannerVersion,
  flavor,
}) {
  const trimURL = scannerBinariesUrl.replace(/\/$/, "");
  return `${trimURL}/sonar-scanner-cli-${scannerVersion}-${flavor}.zip`;
}

export const scannerDirName = (version, flavor) =>
  `sonar-scanner-${version}-${flavor}`;
