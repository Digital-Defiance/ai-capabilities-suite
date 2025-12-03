/**
 * @fileoverview Unit tests for Docker publisher
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const {
  publish,
  build,
  tag,
  push,
  verify,
  checkCredentials,
  execCommand,
} = require("../publishers/docker-publisher");

// Mock child_process
jest.mock("child_process");

describe("docker-publisher", () => {
  // Store original fs functions
  const originalExistsSync = fs.existsSync;

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original fs functions
    fs.existsSync = originalExistsSync;
  });

  describe("execCommand", () => {
    it("should execute command successfully and return output", () => {
      execSync.mockReturnValue("Command output\n");

      const result = execCommand("docker info");

      expect(result).toBe("Command output");
      expect(execSync).toHaveBeenCalledWith("docker info", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should pass custom options to execSync", () => {
      execSync.mockReturnValue("Success\n");

      const result = execCommand("docker build", { cwd: "/custom/path" });

      expect(result).toBe("Success");
      expect(execSync).toHaveBeenCalledWith("docker build", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
        cwd: "/custom/path",
      });
    });

    it("should throw error with output when command fails", () => {
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "Some output";
      mockError.stderr = "Error message";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      expect(() => execCommand("docker build")).toThrow(
        "Command failed: docker build"
      );

      try {
        execCommand("docker build");
      } catch (error) {
        expect(error.output).toContain("Some output");
        expect(error.output).toContain("Error message");
        expect(error.exitCode).toBe(1);
      }
    });
  });

  describe("checkCredentials", () => {
    it("should return true when docker info succeeds", () => {
      execSync.mockReturnValue("Docker info output\n");

      const result = checkCredentials();

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith("docker info", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    });

    it("should return false when docker info fails", () => {
      const mockError = new Error("Command failed");
      mockError.status = 1;
      mockError.stdout = "";
      mockError.stderr = "Cannot connect to Docker daemon";
      execSync.mockImplementation(() => {
        throw mockError;
      });

      const result = checkCredentials();

      expect(result).toBe(false);
    });
  });

  describe("build", () => {
    const mockConfig = {
      packageName: "test-package",
      dockerImageName: "testorg/test-package",
      packageDir: "packages/test-package",
    };

    beforeEach(() => {
      fs.existsSync = jest.fn().mockReturnValue(true);
    });

    it("should build Docker image successfully", async () => {
      execSync.mockReturnValue("Successfully built abc123\n");

      const result = await build(mockConfig, "1.0.0");

      expect(result.success).toBe(true);
      expect(result.output).toBe("Successfully built abc123");
      expect(result.error).toBeUndefined();

      expect(execSync).toHaveBeenCalledWith(
        "docker build -t testorg/test-package:1.0.0 .",
        expect.objectContaining({
          cwd: expect.stringContaining("packages/test-package"),
        })
      );
    });

    it("should fail when package directory does not exist", async () => {
      fs.existsSync = jest.fn().mockImplementation((path) => {
        // Return false for package directory, true for Dockerfile
        return (
          !path.includes("packages/test-package") || path.includes("Dockerfile")
        );
      });

      const result = await build(mockConfig, "1.0.0");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Package directory not found");
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("docker build"),
        expect.any(Object)
      );
    });

    it("should fail when Dockerfile does not exist", async () => {
      fs.existsSync = jest.fn().mockImplementation((path) => {
        // Return true for package directory, false for Dockerfile
        return !path.includes("Dockerfile");
      });

      const result = await build(mockConfig, "1.0.0");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Dockerfile not found");
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("docker build"),
        expect.any(Object)
      );
    });

    it("should handle build errors", async () => {
      execSync.mockImplementation(() => {
        const error = new Error("Command failed");
        error.status = 1;
        error.stdout = "";
        error.stderr = "Error building image";
        throw error;
      });

      const result = await build(mockConfig, "1.0.0");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
      expect(result.output).toContain("Error building image");
    });
  });

  describe("tag", () => {
    it("should tag image with multiple tags successfully", async () => {
      execSync.mockReturnValue("");

      const result = await tag("testorg/test-package", "1.0.0", [
        "v1.0.0",
        "latest",
      ]);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      expect(execSync).toHaveBeenCalledWith(
        "docker tag testorg/test-package:1.0.0 testorg/test-package:v1.0.0",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "docker tag testorg/test-package:1.0.0 testorg/test-package:latest",
        expect.any(Object)
      );
    });

    it("should handle tagging errors", async () => {
      execSync.mockImplementation(() => {
        const error = new Error("Command failed");
        error.status = 1;
        error.stdout = "";
        error.stderr = "Error tagging image";
        throw error;
      });

      const result = await tag("testorg/test-package", "1.0.0", ["latest"]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
      expect(result.output).toContain("Error tagging image");
    });

    it("should handle empty tag list", async () => {
      execSync.mockReturnValue("");

      const result = await tag("testorg/test-package", "1.0.0", []);

      expect(result.success).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
    });
  });

  describe("push", () => {
    it("should push multiple tags successfully", async () => {
      execSync.mockReturnValue("The push refers to repository\n");

      const result = await push("testorg/test-package", [
        "1.0.0",
        "v1.0.0",
        "latest",
      ]);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      expect(execSync).toHaveBeenCalledWith(
        "docker push testorg/test-package:1.0.0",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "docker push testorg/test-package:v1.0.0",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "docker push testorg/test-package:latest",
        expect.any(Object)
      );
    });

    it("should handle authentication errors", async () => {
      execSync.mockImplementation(() => {
        const error = new Error("Command failed");
        error.status = 1;
        error.stdout = "";
        error.stderr = "unauthorized: authentication required";
        throw error;
      });

      const result = await push("testorg/test-package", ["1.0.0"]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Docker authentication failed");
      expect(result.error).toContain("docker login");
    });

    it("should handle denied errors", async () => {
      execSync.mockImplementation(() => {
        const error = new Error("Command failed");
        error.status = 1;
        error.stdout = "";
        error.stderr = "denied: requested access to the resource is denied";
        throw error;
      });

      const result = await push("testorg/test-package", ["1.0.0"]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Docker authentication failed");
    });

    it("should handle not logged in errors", async () => {
      execSync.mockImplementation(() => {
        const error = new Error("Command failed");
        error.status = 1;
        error.stdout = "";
        error.stderr = "You are not logged in to Docker Hub";
        throw error;
      });

      const result = await push("testorg/test-package", ["1.0.0"]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Docker authentication failed");
    });

    it("should handle generic push errors", async () => {
      execSync.mockImplementation(() => {
        const error = new Error("Command failed");
        error.status = 1;
        error.stdout = "";
        error.stderr = "Network error";
        throw error;
      });

      const result = await push("testorg/test-package", ["1.0.0"]);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");
      expect(result.output).toContain("Network error");
    });

    it("should handle empty tag list", async () => {
      execSync.mockReturnValue("");

      const result = await push("testorg/test-package", []);

      expect(result.success).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
    });
  });

  describe("publish", () => {
    const mockConfig = {
      packageName: "test-package",
      dockerImageName: "testorg/test-package",
      packageDir: "packages/test-package",
    };

    beforeEach(() => {
      fs.existsSync = jest.fn().mockReturnValue(true);
    });

    it("should publish Docker image with all tags successfully", async () => {
      execSync.mockReturnValue("Success\n");

      const result = await publish(mockConfig, "1.0.0", false);

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://hub.docker.com/r/testorg/test-package");
      expect(result.error).toBeUndefined();

      // Should build the image
      expect(execSync).toHaveBeenCalledWith(
        "docker build -t testorg/test-package:1.0.0 .",
        expect.any(Object)
      );

      // Should tag with v-prefix and latest
      expect(execSync).toHaveBeenCalledWith(
        "docker tag testorg/test-package:1.0.0 testorg/test-package:v1.0.0",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "docker tag testorg/test-package:1.0.0 testorg/test-package:latest",
        expect.any(Object)
      );

      // Should check credentials
      expect(execSync).toHaveBeenCalledWith("docker info", expect.any(Object));

      // Should push all tags
      expect(execSync).toHaveBeenCalledWith(
        "docker push testorg/test-package:1.0.0",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "docker push testorg/test-package:v1.0.0",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "docker push testorg/test-package:latest",
        expect.any(Object)
      );
    });

    it("should skip pushing in dry-run mode", async () => {
      execSync.mockReturnValue("Success\n");

      const result = await publish(mockConfig, "1.0.0", true);

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://hub.docker.com/r/testorg/test-package");

      // Should build and tag
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("docker build"),
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("docker tag"),
        expect.any(Object)
      );

      // Should NOT check credentials or push in dry-run mode
      expect(execSync).not.toHaveBeenCalledWith(
        "docker info",
        expect.any(Object)
      );
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("docker push"),
        expect.any(Object)
      );
    });

    it("should fail when build fails", async () => {
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await publish(mockConfig, "1.0.0", false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Package directory not found");

      // Should not attempt to tag or push
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("docker tag"),
        expect.any(Object)
      );
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("docker push"),
        expect.any(Object)
      );
    });

    it("should fail when tagging fails", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes("docker build")) {
          return "Successfully built abc123\n";
        }
        if (cmd.includes("docker tag")) {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "Error tagging image";
          throw error;
        }
        return "Success\n";
      });

      const result = await publish(mockConfig, "1.0.0", false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Command failed");

      // Should not attempt to push
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("docker push"),
        expect.any(Object)
      );
    });

    it("should fail when credentials are not configured", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes("docker build")) {
          return "Successfully built abc123\n";
        }
        if (cmd.includes("docker tag")) {
          return "";
        }
        if (cmd === "docker info") {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "Cannot connect to Docker daemon";
          throw error;
        }
        return "Success\n";
      });

      const result = await publish(mockConfig, "1.0.0", false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Docker authentication required");
      expect(result.error).toContain("docker login");

      // Should not attempt to push
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining("docker push"),
        expect.any(Object)
      );
    });

    it("should fail when push fails", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes("docker build")) {
          return "Successfully built abc123\n";
        }
        if (cmd.includes("docker tag")) {
          return "";
        }
        if (cmd === "docker info") {
          return "Docker info output\n";
        }
        if (cmd.includes("docker push")) {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "unauthorized: authentication required";
          throw error;
        }
        return "Success\n";
      });

      const result = await publish(mockConfig, "1.0.0", false);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Docker authentication failed");
    });
  });

  describe("verify", () => {
    it("should return true when image exists using manifest inspect", async () => {
      execSync.mockReturnValue("manifest data\n");

      const result = await verify("testorg/test-package", "1.0.0");

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        "docker manifest inspect testorg/test-package:1.0.0",
        expect.any(Object)
      );
    });

    it("should fallback to docker pull when manifest inspect fails", async () => {
      execSync.mockImplementation((cmd) => {
        if (cmd.includes("manifest inspect")) {
          const error = new Error("Command failed");
          error.status = 1;
          error.stdout = "";
          error.stderr = "manifest unknown";
          throw error;
        }
        if (cmd.includes("docker pull")) {
          return "Pull complete\n";
        }
        return "";
      });

      const result = await verify("testorg/test-package", "1.0.0");

      expect(result).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        "docker manifest inspect testorg/test-package:1.0.0",
        expect.any(Object)
      );
      expect(execSync).toHaveBeenCalledWith(
        "docker pull testorg/test-package:1.0.0 --quiet",
        expect.any(Object)
      );
    });

    it("should return false when image does not exist", async () => {
      execSync.mockImplementation(() => {
        const error = new Error("Command failed");
        error.status = 1;
        error.stdout = "";
        error.stderr = "manifest unknown: manifest unknown";
        throw error;
      });

      const result = await verify("testorg/test-package", "1.0.0");

      expect(result).toBe(false);
    });

    it("should return false when both manifest and pull fail", async () => {
      execSync.mockImplementation(() => {
        const error = new Error("Command failed");
        error.status = 1;
        error.stdout = "";
        error.stderr = "Error: image not found";
        throw error;
      });

      const result = await verify("testorg/test-package", "1.0.0");

      expect(result).toBe(false);
    });
  });
});
