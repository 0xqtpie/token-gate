import { platform } from "node:os";
import type { ServiceManager } from "./types.js";
import { MacOSServiceManager } from "./macos.js";
import { LinuxServiceManager } from "./linux.js";
import { WindowsServiceManager } from "./windows.js";

export function getServiceManager(): ServiceManager {
  const os = platform();

  switch (os) {
    case "darwin":
      return new MacOSServiceManager();
    case "linux":
      return new LinuxServiceManager();
    case "win32":
      return new WindowsServiceManager();
    default:
      throw new Error(`Unsupported platform: ${os}`);
  }
}

export * from "./types.js";
