export interface ServiceStatus {
  installed: boolean;
  running: boolean;
  pid?: number;
  port?: number;
  uptime?: string;
  logDir?: string;
}

export interface ServiceManager {
  install(): Promise<void>;
  uninstall(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<ServiceStatus>;
}

export interface ServicePaths {
  homeDir: string;
  tokengateDir: string;
  logsDir: string;
  serverDir: string;
  runtime: string;
  serverEntry: string;
}

export const SERVICE_NAME = "com.tokengate.server";
export const SERVICE_LABEL = "TokenGateServer";
export const DEFAULT_PORT = 3847;
