import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/lib/index.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  dts: true,
  outDir: 'dist',
  format: ['esm', 'cjs'],
  tsconfig: 'tsconfig.prod.json',
});
