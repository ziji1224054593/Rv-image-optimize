import { build, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { rollup } from 'rollup';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const distDir = resolve(projectRoot, 'dist');

const browserEsEntries = {
  'image-optimize': resolve(projectRoot, 'src/index.js'),
  'image-optimize-utils': resolve(projectRoot, 'src/utils-only.js'),
  'lazy-image': resolve(projectRoot, 'src/LazyImage.jsx'),
  'progressive-image': resolve(projectRoot, 'src/ProgressiveImage.jsx'),
  'lossless': resolve(projectRoot, 'src/entries/lossless.js'),
  'upload-core': resolve(projectRoot, 'src/entries/upload-core.js'),
  'upload': resolve(projectRoot, 'src/entries/upload.js'),
  'cache': resolve(projectRoot, 'src/entries/cache.js'),
};

const browserCjsEntries = {
  'image-optimize': resolve(projectRoot, 'src/index.js'),
  'image-optimize-utils': resolve(projectRoot, 'src/utils-only.js'),
};

const nodeEsEntries = {
  'node-compress': resolve(projectRoot, 'lib/nodeCompress.js'),
  'vite-plugin': resolve(projectRoot, 'lib/vitePlugin.js'),
  'webpack-plugin': resolve(projectRoot, 'lib/webpackPlugin.js'),
};

const nodeCjsEntries = {
  'node-compress': resolve(projectRoot, 'lib/nodeCompress.js'),
  'webpack-plugin': resolve(projectRoot, 'lib/webpackPlugin.js'),
};

const browserExternalPackages = new Set([
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
]);

const nodeExternalPredicates = [
  /^node:/,
  /^webpack(?:\/|$)/,
  /^vite(?:\/|$)/,
];

const nodeExternalPackages = new Set([
  'sharp',
  'vite',
  'webpack',
]);

function isBrowserExternal(id) {
  return browserExternalPackages.has(id);
}

function isNodeExternal(id) {
  if (nodeExternalPackages.has(id)) {
    return true;
  }

  return nodeExternalPredicates.some((pattern) => pattern.test(id));
}

function createBrowserConfig(entries, format, emptyOutDir) {
  const extension = format === 'cjs' ? 'cjs' : 'js';

  return defineConfig({
    plugins: [react()],
    build: {
      lib: {
        entry: entries,
        formats: [format],
        fileName: (_targetFormat, entryName) => (
          `${entryName}.${format === 'cjs' ? 'cjs' : 'es.js'}`
        ),
      },
      outDir: distDir,
      emptyOutDir,
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: false,
      rollupOptions: {
        external: isBrowserExternal,
        output: {
          dir: distDir,
          exports: 'auto',
          chunkFileNames: `chunks/[name]-[hash].${extension}`,
          assetFileNames: (assetInfo) => (
            assetInfo.name === 'style.css'
              ? 'style.css'
              : 'assets/[name]-[hash][extname]'
          ),
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
    },
  });
}

async function buildNodeEntries(entries, format) {
  const extension = format === 'cjs' ? 'cjs' : 'js';
  const bundle = await rollup({
    input: entries,
    external: isNodeExternal,
    onwarn(warning, defaultHandler) {
      if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && warning.source === 'react') {
        return;
      }
      defaultHandler(warning);
    },
  });

  await bundle.write({
    dir: distDir,
    format,
    exports: 'auto',
    entryFileNames: `[name].${format === 'cjs' ? 'cjs' : 'es.js'}`,
    chunkFileNames: `chunks/[name]-[hash].${extension}`,
  });
  await bundle.close();
}

async function buildPackage() {
  await build(createBrowserConfig(browserEsEntries, 'es', true));
  await build(createBrowserConfig(browserCjsEntries, 'cjs', false));
  await buildNodeEntries(nodeEsEntries, 'es');
  await buildNodeEntries(nodeCjsEntries, 'cjs');
  console.log('✅ npm 包多入口构建完成');
}

buildPackage().catch((error) => {
  console.error('❌ npm 包构建失败:', error);
  process.exit(1);
});
