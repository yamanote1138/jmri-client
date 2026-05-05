#!/usr/bin/env node
/**
 * Build browser bundle with all dependencies included
 */

import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: 'dist/browser/jmri-client.js',
  sourcemap: false,
  target: ['es2020'],
  // js-yaml and node:fs are only needed for YAML file loading (Node.js configPath option).
  // They are not available in browsers; users pass `config` objects directly instead.
  external: ['js-yaml', 'node:fs']
});

console.log('✓ Browser bundle created: dist/browser/jmri-client.js');
