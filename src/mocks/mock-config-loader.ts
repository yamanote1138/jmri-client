import { MockConfig, DEFAULT_MOCK_CONFIG } from './mock-config.js';

export interface MockConfigOptions {
  /** Path to a YAML config file. Node.js only — ignored in browser environments. */
  configPath?: string;
  /** Inline config object. Merged over DEFAULT_MOCK_CONFIG. Works in any environment. */
  config?: Partial<MockConfig>;
}

/**
 * Loads and merges mock configuration.
 *
 * Priority (highest to lowest):
 *   configPath YAML file  >  inline config object  >  DEFAULT_MOCK_CONFIG
 *
 * Arrays (roster, lights, turnouts) replace entirely — they are never merged.
 */
export async function loadMockConfig(options: MockConfigOptions = {}): Promise<MockConfig> {
  let userConfig: Partial<MockConfig> = {};

  if (options.configPath) {
    try {
      const { readFileSync } = await import('node:fs');
      const { load } = await import('js-yaml');
      const raw = readFileSync(options.configPath, 'utf8');
      userConfig = load(raw) as Partial<MockConfig>;
    } catch (err: any) {
      throw new Error(`Failed to load mock config from "${options.configPath}": ${err.message}`);
    }
  } else if (options.config) {
    userConfig = options.config;
  }

  return mergeConfig(DEFAULT_MOCK_CONFIG, userConfig);
}

function mergeConfig(base: MockConfig, override: Partial<MockConfig>): MockConfig {
  return {
    server: override.server ? { ...base.server, ...override.server } : { ...base.server },
    power: override.power ? { ...base.power, ...override.power } : { ...base.power },
    // Arrays replace entirely — the user defines exactly what their layout has
    roster: override.roster ?? base.roster,
    lights: override.lights ?? base.lights,
    turnouts: override.turnouts ?? base.turnouts,
    timing: override.timing ? { ...base.timing, ...override.timing } : { ...base.timing }
  };
}
