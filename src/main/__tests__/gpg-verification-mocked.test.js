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
import * as fs from "node:fs";
import { afterEach, describe, it, mock } from "node:test";
import { getProxyFromEnv, setupGpgHome, } from "../gpg-verification.js";

/**
 * Helper function to create a temporary GPG home directory for testing.
 * @param {Array} tempDirs - Array to track temp directories for cleanup
 * @returns {string} Path to the created GPG home directory
 */
function createTrackedGpgHome(tempDirs) {
  const gpgHome = setupGpgHome();
  tempDirs.push(gpgHome);
  assert.ok(fs.existsSync(gpgHome));
  return gpgHome;
}

describe("gpg-verification with mocked exec", () => {
  let tempDirs = [];

  afterEach(() => {
    // Clean up temporary directories
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

  describe("isGpgAvailable", () => {
    it("should return true when GPG is available", async (t) => {
      const execFn = mock.fn(async () => 0);

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { isGpgAvailable } = await import("../gpg-verification.js?test=gpg-available");

      const result = await isGpgAvailable();

      assert.equal(result, true);
      assert.equal(execFn.mock.calls.length, 1);
      assert.equal(execFn.mock.calls[0].arguments[0], "gpg");
      assert.deepEqual(execFn.mock.calls[0].arguments[1], ["--version"]);
    });

    it("should return false when GPG is not available", async (t) => {
      const execFn = mock.fn(async () => {
        throw new Error("GPG not found");
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { isGpgAvailable } = await import("../gpg-verification.js?test=gpg-unavailable");

      const result = await isGpgAvailable();

      assert.equal(result, false);
    });
  });

  describe("runGpgVerify", () => {
    it("should successfully verify valid signature", async (t) => {
      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { runGpgVerify } = await import("../gpg-verification.js?test=verify-success");

      const gpgHome = createTrackedGpgHome(tempDirs);
      const zipPath = "/tmp/scanner.zip";
      const signaturePath = "/tmp/scanner.zip.asc";

      await runGpgVerify(zipPath, signaturePath, gpgHome);

      assert.equal(execCalls.length, 1);
      assert.equal(execCalls[0].command, "gpg");
      assert.ok(execCalls[0].args.includes("--verify"));
      assert.ok(execCalls[0].args.includes(signaturePath));
      assert.ok(execCalls[0].args.includes(zipPath));
    });

    it("should throw error when signature verification fails", async (t) => {
      const execFn = mock.fn(async () => {
        throw new Error("BAD signature");
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { runGpgVerify } = await import("../gpg-verification.js?test=verify-fail");

      const gpgHome = createTrackedGpgHome(tempDirs);
      const zipPath = "/tmp/scanner.zip";
      const signaturePath = "/tmp/scanner.zip.asc";

      await assert.rejects(
        () => runGpgVerify(zipPath, signaturePath, gpgHome),
        {
          message: /GPG signature verification failed - file may be corrupted or tampered/
        }
      );
    });

    it("should convert Windows paths for GPG", async (t) => {
      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { runGpgVerify } = await import("../gpg-verification.js?test=verify-windows");

      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", {
        value: "win32",
        writable: true,
        configurable: true,
      });

      try {
        const gpgHome = createTrackedGpgHome(tempDirs);
        const zipPath = String.raw`C:\temp\scanner.zip`;
        const signaturePath = String.raw`C:\temp\scanner.zip.asc`;

        await runGpgVerify(zipPath, signaturePath, gpgHome);

        // Verify paths were converted to Unix format
        const args = execCalls[0].args;
        const homeDirIndex = args.indexOf("--homedir");
        const zipIndex = args.indexOf("--verify") + 1;

        // Check that Windows paths are converted (should start with /c/ instead of C:\)
        assert.ok(!args[homeDirIndex + 1].includes("\\"));
        assert.ok(!args[zipIndex].includes("\\"));
        assert.ok(!args[zipIndex + 1].includes("\\"));
      } finally {
        Object.defineProperty(process, "platform", {
          value: originalPlatform,
          writable: true,
          configurable: true,
        });
      }
    });
  });

  describe("verifySignature", () => {
    it("should successfully verify signature with GPG available", async (t) => {
      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { verifySignature } = await import("../gpg-verification.js?test=full-verify-success");

      const zipPath = "/tmp/scanner.zip";
      const signaturePath = "/tmp/scanner.zip.asc";

      await verifySignature(zipPath, signaturePath);

      assert.equal(execCalls.length, 3);
      assert.deepEqual(execCalls[0].args, ["--version"]);
      assert.ok(execCalls[1].args.includes("--recv-keys"));
      assert.ok(execCalls[2].args.includes("--verify"));
    });

    it("should throw error when GPG is not available", async (t) => {
      const execFn = mock.fn(async (command, args) => {
        if (args.includes("--version")) {
          throw new Error("GPG not found");
        }
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { verifySignature } = await import("../gpg-verification.js?test=no-gpg");

      const zipPath = "/tmp/scanner.zip";
      const signaturePath = "/tmp/scanner.zip.asc";

      await assert.rejects(
        () => verifySignature(zipPath, signaturePath),
        {
          message: /GPG is not available/
        }
      );
    });

    it("should throw error when signature verification fails", async (t) => {
      let callCount = 0;
      const execFn = mock.fn(async () => {
        callCount++;
        // First call: gpg --version (success)
        if (callCount === 1) {
          return 0;
        }
        // Second call: recv-keys (success)
        if (callCount === 2) {
          return 0;
        }
        // Third call: verify (failure - bad signature)
        throw new Error("BAD signature from 679F1EE92B19609DE816FDE81DB198F93525EC1A");
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { verifySignature } = await import("../gpg-verification.js?test=bad-signature");

      const zipPath = "/tmp/scanner.zip";
      const signaturePath = "/tmp/scanner.zip.asc";

      await assert.rejects(
        () => verifySignature(zipPath, signaturePath),
        {
          message: /GPG signature verification failed - file may be corrupted or tampered/
        }
      );
    });

    it("should cleanup GPG home directory even on failure", async (t) => {
      let createdGpgHome;
      let callCount = 0;

      const execFn = mock.fn(async (command, args) => {
        callCount++;
        // First call: gpg --version (success)
        if (callCount === 1) {
          return 0;
        }
        // Second call: recv-keys (success)
        if (callCount === 2) {
          // Capture the GPG home directory from the args
          const homeDirIndex = args.indexOf("--homedir");
          if (homeDirIndex !== -1) {
            createdGpgHome = args[homeDirIndex + 1];
          }
          return 0;
        }
        // Third call: verify (failure)
        throw new Error("BAD signature");
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { verifySignature } = await import("../gpg-verification.js?test=cleanup-on-fail");

      const zipPath = "/tmp/scanner.zip";
      const signaturePath = "/tmp/scanner.zip.asc";

      await assert.rejects(
        () => verifySignature(zipPath, signaturePath),
        {
          message: /GPG signature verification failed/
        }
      );

      assert.ok(!fs.existsSync(createdGpgHome), "GPG home should have been deleted after failure");
    });

    it("should use custom keyserver and fingerprint when provided", async (t) => {
      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { verifySignature } = await import("../gpg-verification.js?test=custom-options");

      const zipPath = "/tmp/scanner.zip";
      const signaturePath = "/tmp/scanner.zip.asc";
      const customKeyserver = "hkps://custom.keyserver.example.com";
      const customFingerprint = "ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234";

      await verifySignature(zipPath, signaturePath, {
        keyserver: customKeyserver,
        keyFingerprint: customFingerprint,
      });

      const recvKeysCall = execCalls.find(call => call.args.includes("--recv-keys"));
      assert.ok(recvKeysCall, "Should have recv-keys call");
      assert.ok(recvKeysCall.args.includes(customKeyserver));
      assert.ok(recvKeysCall.args.includes(customFingerprint));
    });

    it("should use default keyserver and fingerprint when not provided", async (t) => {
      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { verifySignature } = await import("../gpg-verification.js?test=default-options");

      const zipPath = "/tmp/scanner.zip";
      const signaturePath = "/tmp/scanner.zip.asc";

      await verifySignature(zipPath, signaturePath);

      const recvKeysCall = execCalls.find(call => call.args.includes("--recv-keys"));
      assert.ok(recvKeysCall, "Should have recv-keys call");
      assert.ok(recvKeysCall.args.includes("hkps://keyserver.ubuntu.com"));
      assert.ok(recvKeysCall.args.includes("679F1EE92B19609DE816FDE81DB198F93525EC1A"));
    });
  });

  describe("importSonarSourceKey", () => {
    it("should use fallback keyserver when primary fails", async (t) => {
      const execCalls = [];

      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });

        const argsString = args.join(" ");
        if (argsString.includes("invalid.keyserver.that.does.not.exist.example.com")) {
          throw new Error("Failed to import key from invalid keyserver");
        }
        if (argsString.includes("keys.openpgp.org")) {
          return 0;
        }

        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=fallback");

      const gpgHome = createTrackedGpgHome(tempDirs);
      const invalidKeyserver = "hkps://invalid.keyserver.that.does.not.exist.example.com";
      const keyFingerprint = "679F1EE92B19609DE816FDE81DB198F93525EC1A";

      await importSonarSourceKey(gpgHome, keyFingerprint, invalidKeyserver);

      assert.equal(execCalls.length, 2, "Should attempt two keyservers");

      // Verify primary keyserver call
      assert.equal(execCalls[0].command, "gpg");
      assert.ok(execCalls[0].args.includes(invalidKeyserver));
      assert.ok(execCalls[0].args.includes(keyFingerprint));

      // Verify fallback keyserver call
      assert.equal(execCalls[1].command, "gpg");
      assert.ok(execCalls[1].args.includes("hkps://keys.openpgp.org"));
      assert.ok(execCalls[1].args.includes(keyFingerprint));
    });

    it("should succeed with valid keyserver", async (t) => {
      const execCalls = [];

      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=valid");

      const gpgHome = createTrackedGpgHome(tempDirs);
      const keyserver = "hkps://keyserver.ubuntu.com";
      const keyFingerprint = "679F1EE92B19609DE816FDE81DB198F93525EC1A";

      await importSonarSourceKey(gpgHome, keyFingerprint, keyserver);

      assert.equal(execCalls.length, 1);
      assert.equal(execCalls[0].command, "gpg");
      assert.ok(execCalls[0].args.includes(keyserver));
      assert.ok(execCalls[0].args.includes(keyFingerprint));
      assert.ok(execCalls[0].args.includes("--recv-keys"));
    });

    it("should throw error when both keyservers fail", async (t) => {
      const execFn = mock.fn(async () => {
        throw new Error("Connection failed");
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=both-fail");

      const gpgHome = createTrackedGpgHome(tempDirs);
      const keyserver = "hkps://keyserver.ubuntu.com";
      const keyFingerprint = "679F1EE92B19609DE816FDE81DB198F93525EC1A";

      await assert.rejects(
        () => importSonarSourceKey(gpgHome, keyFingerprint, keyserver),
        {
          message: /Failed to import SonarSource public key from all keyservers/
        }
      );
    });
  });

  describe("getProxyFromEnv", () => {
    const proxyVars = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"];

    function clearProxyEnv() {
      for (const v of proxyVars) {
        delete process.env[v];
      }
    }

    afterEach(() => {
      clearProxyEnv();
    });

    it("should return undefined when no proxy is set", () => {
      clearProxyEnv();
      assert.equal(getProxyFromEnv(), undefined);
    });

    it("should prefer HTTPS_PROXY over https_proxy", () => {
      clearProxyEnv();
      process.env.HTTPS_PROXY = "http://proxy-https:8080";
      process.env.https_proxy = "http://proxy-lower:8080";
      assert.equal(getProxyFromEnv(), "http://proxy-https:8080");
    });

    it("should use https_proxy (lowercase)", () => {
      clearProxyEnv();
      process.env.https_proxy = "http://proxy-lower:8080";
      assert.equal(getProxyFromEnv(), "http://proxy-lower:8080");
    });

    it("should not fall back to HTTP_PROXY", () => {
      clearProxyEnv();
      process.env.HTTP_PROXY = "http://proxy-http:3128";
      assert.equal(getProxyFromEnv(), undefined);
    });

    it("should not fall back to http_proxy (lowercase)", () => {
      clearProxyEnv();
      process.env.http_proxy = "http://proxy-lower-http:3128";
      assert.equal(getProxyFromEnv(), undefined);
    });

    it("should ignore HTTP_PROXY when only HTTP proxy is configured", () => {
      clearProxyEnv();
      process.env.HTTP_PROXY = "http://http-only-proxy:3128";
      process.env.http_proxy = "http://http-only-proxy:3128";
      assert.equal(getProxyFromEnv(), undefined);
    });
  });

  describe("tryImportKey with proxy", () => {
    const proxyVars = ["HTTPS_PROXY", "https_proxy", "HTTP_PROXY", "http_proxy"];

    function clearProxyEnv() {
      for (const v of proxyVars) {
        delete process.env[v];
      }
    }

    afterEach(() => {
      clearProxyEnv();
    });

    it("should not pass --keyserver-options when no proxy env is set", async (t) => {
      clearProxyEnv();

      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=no-proxy");

      const gpgHome = createTrackedGpgHome(tempDirs);
      const keyserver = "hkps://keyserver.ubuntu.com";
      const keyFingerprint = "679F1EE92B19609DE816FDE81DB198F93525EC1A";

      await importSonarSourceKey(gpgHome, keyFingerprint, keyserver);

      assert.equal(execCalls.length, 1);
      const args = execCalls[0].args;
      assert.ok(!args.includes("--keyserver-options"), "Should NOT include --keyserver-options");
    });

    it("should use HTTPS_PROXY when set", async (t) => {
      clearProxyEnv();
      process.env.HTTPS_PROXY = "http://corporate-proxy:8080";

      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=proxy-https-upper");

      const gpgHome = createTrackedGpgHome(tempDirs);
      await importSonarSourceKey(gpgHome, "ABCD1234", "hkps://keyserver.ubuntu.com");

      const args = execCalls[0].args;
      const optIdx = args.indexOf("--keyserver-options");
      assert.ok(optIdx !== -1, "Should include --keyserver-options");
      assert.equal(args[optIdx + 1], "http-proxy=http://corporate-proxy:8080");
    });

    it("should use https_proxy (lowercase) when set", async (t) => {
      clearProxyEnv();
      process.env.https_proxy = "http://lowercase-proxy:3128";

      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=proxy-https-lower");

      const gpgHome = createTrackedGpgHome(tempDirs);
      await importSonarSourceKey(gpgHome, "ABCD1234", "hkps://keyserver.ubuntu.com");

      const args = execCalls[0].args;
      const optIdx = args.indexOf("--keyserver-options");
      assert.ok(optIdx !== -1);
      assert.equal(args[optIdx + 1], "http-proxy=http://lowercase-proxy:3128");
    });

    it("should not use proxy when only HTTP_PROXY is set", async (t) => {
      clearProxyEnv();
      process.env.HTTP_PROXY = "http://http-only-proxy:9090";

      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=proxy-http-upper");

      const gpgHome = createTrackedGpgHome(tempDirs);
      await importSonarSourceKey(gpgHome, "ABCD1234", "hkps://keyserver.ubuntu.com");

      const args = execCalls[0].args;
      assert.ok(!args.includes("--keyserver-options"), "Should NOT include --keyserver-options when only HTTP_PROXY is set");
    });

    it("should not use proxy when only http_proxy (lowercase) is set", async (t) => {
      clearProxyEnv();
      process.env.http_proxy = "http://last-resort-proxy:1080";

      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=proxy-http-lower");

      const gpgHome = createTrackedGpgHome(tempDirs);
      await importSonarSourceKey(gpgHome, "ABCD1234", "hkps://keyserver.ubuntu.com");

      const args = execCalls[0].args;
      assert.ok(!args.includes("--keyserver-options"), "Should NOT include --keyserver-options when only http_proxy is set");
    });

    it("should prefer HTTPS_PROXY over https_proxy and ignore HTTP variants", async (t) => {
      clearProxyEnv();
      process.env.HTTPS_PROXY = "http://preferred:8080";
      process.env.https_proxy = "http://not-this-one:8080";
      process.env.HTTP_PROXY = "http://also-not:3128";
      process.env.http_proxy = "http://nope:1080";

      const execCalls = [];
      const execFn = mock.fn(async (command, args) => {
        execCalls.push({ command, args });
        return 0;
      });

      t.mock.module("@actions/exec", {
        namedExports: {
          exec: execFn,
        },
      });

      const { importSonarSourceKey } = await import("../gpg-verification.js?test=proxy-precedence");

      const gpgHome = createTrackedGpgHome(tempDirs);
      await importSonarSourceKey(gpgHome, "ABCD1234", "hkps://keyserver.ubuntu.com");

      const args = execCalls[0].args;
      const optIdx = args.indexOf("--keyserver-options");
      assert.ok(optIdx !== -1);
      assert.equal(args[optIdx + 1], "http-proxy=http://preferred:8080");
    });
  });
});
