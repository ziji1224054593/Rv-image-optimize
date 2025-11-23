// 构建工具函数专用版本的脚本
import { build } from 'vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

const config = defineConfig({
  build: {
    lib: {
      entry: resolve(process.cwd(), 'src/utils-only.js'),
      name: 'ImageOptimize',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `image-optimize-utils.${format}.js`,
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
  },
});

build(config).then(() => {
  console.log('✅ 工具函数版本构建完成');
}).catch((error) => {
  console.error('❌ 工具函数版本构建失败:', error);
  process.exit(1);
});

