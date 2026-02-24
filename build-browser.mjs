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
  external: [] // Bundle all dependencies
});

console.log('✓ Browser bundle created: dist/browser/jmri-client.js');
