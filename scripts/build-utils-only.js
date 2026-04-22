// 构建工具函数专用版本，并生成稳定的组件子入口包装文件
import { build } from 'vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'node:fs/promises';

const config = defineConfig({
  build: {
    lib: {
      entry: resolve(process.cwd(), 'src/utils-only.js'),
      name: 'ImageOptimize',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'cjs' ? 'image-optimize-utils.cjs' : 'image-optimize-utils.es.js'),
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: 'style.css',
      },
    },
    cssCodeSplit: false,
    emptyOutDir: false, // 不清空输出目录，保留主版本文件
  },
});

async function writeComponentWrappers() {
  const distDir = resolve(process.cwd(), 'dist');
  const files = new Map([
    ['lazy-image.es.js', "export { LazyImage, LazyImage as default } from './image-optimize.es.js';\n"],
    ['progressive-image.es.js', "export { ProgressiveImage, ProgressiveImage as default } from './image-optimize.es.js';\n"],
    ['lazy-image.cjs', "const mod = require('./image-optimize.cjs');\nconst component = mod.LazyImage || mod.default;\nmodule.exports = component;\nmodule.exports.default = component;\nmodule.exports.LazyImage = component;\n"],
    ['progressive-image.cjs', "const mod = require('./image-optimize.cjs');\nconst component = mod.ProgressiveImage;\nmodule.exports = component;\nmodule.exports.default = component;\nmodule.exports.ProgressiveImage = component;\n"],
  ]);

  await Promise.all(
    [...files.entries()].map(([fileName, content]) => (
      fs.writeFile(resolve(distDir, fileName), content, 'utf8')
    ))
  );
}

build(config).then(async () => {
  await writeComponentWrappers();
  console.log('✅ 工具函数版本和组件子入口构建完成');
}).catch((error) => {
  console.error('❌ 工具函数版本构建失败:', error);
  process.exit(1);
});

