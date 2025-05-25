/**
 * Configuration module for Honey Benchmark Swarm
 * Centralizes all configuration settings and provides environment-specific overrides
 */

import { LogLevel } from './logging.ts';

// Default configuration
const defaultConfig = {
  // General settings
  appName: 'Honey Benchmark Swarm',
  version: '1.0.0',

  // Logging
  logLevel: LogLevel.INFO,

  // Runners
  runners: {
    docker: {
      enabled: true,
      timeout: 60000, // 60 seconds
      image: 'denoland/deno:alpine',
      maxRetries: 2,
      securityOpts: ['no-new-privileges'],
      resourceLimits: {
        memory: '256m',
        cpus: '1',
      },
    },
    firecracker: {
      enabled: true,
      timeout: 60000, // 60 seconds
      socketPath: '/tmp/firecracker.socket',
      kernelPath: '/path/to/vmlinux',
      rootfsPath: '/path/to/rootfs.ext4',
      maxRetries: 2,
      resourceLimits: {
        memory: '128MB',
        vcpus: 1,
      },
    },
    wasm: {
      enabled: true,
      timeout: 30000, // 30 seconds
      maxRetries: 2,
      memory: {
        initial: 10, // pages
        maximum: 100, // pages
      },
    },
  },

  // Locations
  locations: {
    local: {
      enabled: true,
    },
    cloud: {
      enabled: true,
      endpoint: 'https://api.example.com/honey',
    },
  },

  // Metrics
  metrics: {
    enabled: true,
    mongodb: {
      enabled: false,
      uri: 'mongodb://localhost:27017',
      database: 'honey_metrics',
    },
    pinecone: {
      enabled: false,
      apiKey: '',
      environment: 'us-west1-gcp',
      index: 'honey-benchmarks',
    },
  },

  // Security
  security: {
    validateInputs: true,
    sanitizeOutputs: true,
    timeouts: {
      default: 60000, // 60 seconds
      docker: 60000,
      firecracker: 60000,
      wasm: 30000,
    },
  },
};

// Environment-specific configuration overrides
const environments: Record<string, Partial<typeof defaultConfig>> = {
  development: {
    logLevel: LogLevel.DEBUG,
  },
  test: {
    metrics: {
      enabled: false,
    },
  },
  production: {
    logLevel: LogLevel.INFO,
    security: {
      validateInputs: true,
      sanitizeOutputs: true,
    },
  },
};

// Determine current environment
const currentEnv = Deno.env.get('HONEY_ENV') || 'development';

// Deep merge function for configurations
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): T {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key as keyof typeof source];
      const targetValue = target[key as keyof typeof target];

      if (isObject(sourceValue)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: sourceValue });
        } else {
          (output as Record<string, unknown>)[key] = deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>,
          );
        }
      } else {
        Object.assign(output, { [key]: sourceValue });
      }
    });
  }

  return output;
}

// Helper function to check if value is an object
function isObject(item: unknown): item is Record<string, unknown> {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

// Load environment variables
function loadEnvVars(config: typeof defaultConfig): typeof defaultConfig {
  const newConfig = { ...config };

  // Docker settings
  if (Deno.env.get('HONEY_DOCKER_ENABLED') !== undefined) {
    newConfig.runners.docker.enabled =
      Deno.env.get('HONEY_DOCKER_ENABLED') === 'true';
  }

  if (Deno.env.get('HONEY_DOCKER_TIMEOUT')) {
    newConfig.runners.docker.timeout = parseInt(
      Deno.env.get('HONEY_DOCKER_TIMEOUT') || '60000',
      10,
    );
  }

  if (Deno.env.get('HONEY_DOCKER_IMAGE')) {
    newConfig.runners.docker.image = Deno.env.get('HONEY_DOCKER_IMAGE') ||
      'denoland/deno:alpine';
  }

  // Firecracker settings
  if (Deno.env.get('HONEY_FIRECRACKER_ENABLED') !== undefined) {
    newConfig.runners.firecracker.enabled =
      Deno.env.get('HONEY_FIRECRACKER_ENABLED') === 'true';
  }

  if (Deno.env.get('HONEY_FIRECRACKER_SOCKET_PATH')) {
    newConfig.runners.firecracker.socketPath =
      Deno.env.get('HONEY_FIRECRACKER_SOCKET_PATH') ||
      '/tmp/firecracker.socket';
  }

  // WASM settings
  if (Deno.env.get('HONEY_WASM_ENABLED') !== undefined) {
    newConfig.runners.wasm.enabled =
      Deno.env.get('HONEY_WASM_ENABLED') === 'true';
  }

  // Metrics settings
  if (Deno.env.get('HONEY_METRICS_ENABLED') !== undefined) {
    newConfig.metrics.enabled =
      Deno.env.get('HONEY_METRICS_ENABLED') === 'true';
  }

  if (Deno.env.get('HONEY_MONGODB_URI')) {
    newConfig.metrics.mongodb.uri = Deno.env.get('HONEY_MONGODB_URI') ||
      'mongodb://localhost:27017';
    newConfig.metrics.mongodb.enabled = true;
  }

  if (Deno.env.get('HONEY_PINECONE_API_KEY')) {
    newConfig.metrics.pinecone.apiKey =
      Deno.env.get('HONEY_PINECONE_API_KEY') || '';
    newConfig.metrics.pinecone.enabled = true;
  }

  // Log level
  if (Deno.env.get('HONEY_LOG_LEVEL')) {
    const logLevelStr = Deno.env.get('HONEY_LOG_LEVEL') || 'INFO';
    switch (logLevelStr.toUpperCase()) {
      case 'DEBUG':
        newConfig.logLevel = LogLevel.DEBUG;
        break;
      case 'INFO':
        newConfig.logLevel = LogLevel.INFO;
        break;
      case 'WARN':
        newConfig.logLevel = LogLevel.WARN;
        break;
      case 'ERROR':
        newConfig.logLevel = LogLevel.ERROR;
        break;
      case 'NONE':
        newConfig.logLevel = LogLevel.NONE;
        break;
    }
  }

  return newConfig;
}

// Merge configurations
let config = deepMerge(defaultConfig, environments[currentEnv] || {});

// Override with environment variables
config = loadEnvVars(config);

export default config;
