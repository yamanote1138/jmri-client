import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { loadMockConfig } from '../../../src/mocks/mock-config-loader';
import { DEFAULT_MOCK_CONFIG } from '../../../src/mocks/mock-config';

describe('loadMockConfig', () => {
  describe('with no options', () => {
    it('returns DEFAULT_MOCK_CONFIG when called with no arguments', async () => {
      const config = await loadMockConfig();
      expect(config.server?.railroad).toBe(DEFAULT_MOCK_CONFIG.server?.railroad);
      expect(config.roster?.length).toBe(DEFAULT_MOCK_CONFIG.roster?.length);
      expect(config.lights?.length).toBe(DEFAULT_MOCK_CONFIG.lights?.length);
      expect(config.turnouts?.length).toBe(DEFAULT_MOCK_CONFIG.turnouts?.length);
    });

    it('returns default timing values', async () => {
      const config = await loadMockConfig();
      expect(config.timing?.responseDelay).toBe(50);
      expect(config.timing?.connectionDelay).toBe(10);
    });
  });

  describe('with inline config object', () => {
    it('merges server fields over defaults', async () => {
      const config = await loadMockConfig({
        config: { server: { railroad: 'My Test Layout' } }
      });
      expect(config.server?.railroad).toBe('My Test Layout');
      // Unspecified server fields keep defaults
      expect(config.server?.jmri).toBe(DEFAULT_MOCK_CONFIG.server?.jmri);
      expect(config.server?.heartbeat).toBe(DEFAULT_MOCK_CONFIG.server?.heartbeat);
    });

    it('replaces roster entirely when provided', async () => {
      const config = await loadMockConfig({
        config: {
          roster: [{ name: 'LOCO1', address: '1' }]
        }
      });
      expect(config.roster).toHaveLength(1);
      expect(config.roster?.[0].name).toBe('LOCO1');
    });

    it('replaces lights entirely when provided', async () => {
      const config = await loadMockConfig({
        config: {
          lights: [{ name: 'IL99', state: 'ON' }]
        }
      });
      expect(config.lights).toHaveLength(1);
      expect(config.lights?.[0].name).toBe('IL99');
    });

    it('replaces turnouts entirely when provided', async () => {
      const config = await loadMockConfig({
        config: {
          turnouts: [{ name: 'LT99', state: 'THROWN' }]
        }
      });
      expect(config.turnouts).toHaveLength(1);
      expect(config.turnouts?.[0].name).toBe('LT99');
    });

    it('keeps default arrays when not specified in config', async () => {
      const config = await loadMockConfig({
        config: { server: { railroad: 'Override Only' } }
      });
      expect(config.roster).toHaveLength(DEFAULT_MOCK_CONFIG.roster!.length);
      expect(config.lights).toHaveLength(DEFAULT_MOCK_CONFIG.lights!.length);
      expect(config.turnouts).toHaveLength(DEFAULT_MOCK_CONFIG.turnouts!.length);
    });

    it('merges timing fields over defaults', async () => {
      const config = await loadMockConfig({
        config: { timing: { responseDelay: 200 } }
      });
      expect(config.timing?.responseDelay).toBe(200);
      expect(config.timing?.connectionDelay).toBe(10); // default preserved
    });

    it('merges power initialState', async () => {
      const config = await loadMockConfig({
        config: { power: { initialState: 'ON' } }
      });
      expect(config.power?.initialState).toBe('ON');
    });
  });

  describe('with configPath (YAML file)', () => {
    let tmpFile: string;

    afterEach(() => {
      if (tmpFile && fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    });

    function writeTmpYaml(content: string): string {
      tmpFile = path.join(os.tmpdir(), `jmri-mock-test-${Date.now()}.yaml`);
      fs.writeFileSync(tmpFile, content, 'utf8');
      return tmpFile;
    }

    it('loads and parses a YAML file', async () => {
      const filePath = writeTmpYaml(`
server:
  railroad: "YAML Test Layout"
  jmri: "5.0.0"
`);
      const config = await loadMockConfig({ configPath: filePath });
      expect(config.server?.railroad).toBe('YAML Test Layout');
      expect(config.server?.jmri).toBe('5.0.0');
    });

    it('merges YAML server config over defaults', async () => {
      const filePath = writeTmpYaml(`
server:
  railroad: "Partial Override"
`);
      const config = await loadMockConfig({ configPath: filePath });
      expect(config.server?.railroad).toBe('Partial Override');
      expect(config.server?.heartbeat).toBe(DEFAULT_MOCK_CONFIG.server?.heartbeat);
    });

    it('loads roster from YAML and replaces defaults', async () => {
      const filePath = writeTmpYaml(`
roster:
  - name: "MY-LOCO"
    address: "42"
    model: "Test Engine"
`);
      const config = await loadMockConfig({ configPath: filePath });
      expect(config.roster).toHaveLength(1);
      expect(config.roster?.[0].name).toBe('MY-LOCO');
      expect(config.roster?.[0].address).toBe('42');
    });

    it('loads light states from YAML', async () => {
      const filePath = writeTmpYaml(`
lights:
  - name: IL1
    userName: "Test Light"
    state: ON
  - name: IL2
    state: OFF
`);
      const config = await loadMockConfig({ configPath: filePath });
      expect(config.lights).toHaveLength(2);
      expect(config.lights?.[0].state).toBe('ON');
      expect(config.lights?.[1].state).toBe('OFF');
    });

    it('loads timing from YAML', async () => {
      const filePath = writeTmpYaml(`
timing:
  responseDelay: 123
  connectionDelay: 5
`);
      const config = await loadMockConfig({ configPath: filePath });
      expect(config.timing?.responseDelay).toBe(123);
      expect(config.timing?.connectionDelay).toBe(5);
    });

    it('throws a helpful error for a missing file', async () => {
      await expect(
        loadMockConfig({ configPath: '/nonexistent/path/to/config.yaml' })
      ).rejects.toThrow('Failed to load mock config from "/nonexistent/path/to/config.yaml"');
    });

    it('throws a helpful error for invalid YAML', async () => {
      const filePath = writeTmpYaml('{ this is: [invalid yaml');
      await expect(
        loadMockConfig({ configPath: filePath })
      ).rejects.toThrow('Failed to load mock config');
    });
  });
});
