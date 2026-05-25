#!/usr/bin/env node
/**
 * Build all distribution targets via esbuild.
 * tsc handles type declarations separately (see build:types in package.json).
 */

import * as esbuild from 'esbuild';

// Runtime deps stay external for Node.js builds — consumers install them
const nodeExternal = ['ws', 'eventemitter3'];

const builds = [
  {
    label: 'CJS (Node.js)',
    options: {
      entryPoints: ['src/index.ts'],
      bundle: true,
      format: 'cjs',
      platform: 'node',
      target: ['node22'],
      external: nodeExternal,
      outfile: 'dist/cjs/index.js',
    },
  },
  {
    label: 'ESM (Node.js)',
    options: {
      entryPoints: ['src/index.ts'],
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: ['node22'],
      external: nodeExternal,
      outfile: 'dist/esm/index.js',
    },
  },
  {
    label: 'Browser bundle',
    options: {
      entryPoints: ['src/index.ts'],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: ['es2020'],
      external: [],
      outfile: 'dist/browser/jmri-client.js',
    },
  },
];

for (const { label, options } of builds) {
  await esbuild.build(options);
  console.log(`✓ ${label}: ${options.outfile}`);
}
