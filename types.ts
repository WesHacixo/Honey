/**
 * Type definitions for Honey Benchmark Swarm
 */

import type { LogLevel } from './layers/logging.ts';

export interface DockerConfig {
  enabled: boolean;
  timeout: number;
  image: string;
  maxRetries: number;
  securityOpts: string[];
  resourceLimits: {
    memory: string;
    cpus: string;
  };
}

export interface FirecrackerConfig {
  enabled: boolean;
  timeout: number;
  socketPath: string;
  kernelPath: string;
  rootfsPath: string;
  maxRetries: number;
  resourceLimits: {
    memory: string;
    vcpus: number;
  };
}

export interface WasmConfig {
  enabled: boolean;
  timeout: number;
  maxRetries: number;
  memory: {
    initial: number;
    maximum: number;
  };
}

export interface LocalConfig {
  enabled: boolean;
}

export interface CloudConfig {
  enabled: boolean;
  endpoint: string;
}

export interface MetricsConfig {
  enabled: boolean;
  mongodb: {
    enabled: boolean;
    uri: string;
    database: string;
  };
  pinecone: {
    enabled: boolean;
    apiKey: string;
    environment: string;
    index: string;
  };
}

export interface SecurityConfig {
  validateInputs: boolean;
  sanitizeOutputs: boolean;
  timeouts: {
    default: number;
    docker: number;
    firecracker: number;
    wasm: number;
  };
}

export interface Config {
  appName: string;
  version: string;
  logLevel: LogLevel;
  runners: {
    docker: DockerConfig;
    firecracker: FirecrackerConfig;
    wasm: WasmConfig;
  };
  locations: {
    local: LocalConfig;
    cloud: CloudConfig;
  };
  metrics: MetricsConfig;
  security: SecurityConfig;
}

export interface FirecrackerDriveConfig {
  drive_id: string;
  path_on_host: string;
  is_root_device: boolean;
  is_read_only: boolean;
}

export interface FirecrackerNetworkConfig {
  iface_id: string;
  guest_mac: string;
  host_dev_name: string;
}

export interface FirecrackerVmConfig {
  boot_source: {
    kernel_image_path: string;
    boot_args: string;
  };
  machine_config: {
    vcpu_count: number;
    mem_size_mib: number;
    ht_enabled: boolean;
  };
  drives: FirecrackerDriveConfig[];
  network_interfaces: FirecrackerNetworkConfig[];
}
