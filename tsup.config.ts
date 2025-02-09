import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'dist/core/index': './packages/core/lib/index.ts',
  },
  splitting: true,
  sourcemap: true,
  clean: false,
  minify: true,
  dts: true,

  outDir: 'packages',
  format: ['esm', 'cjs'],
  tsconfig: 'tsconfig.prod.json',
});
