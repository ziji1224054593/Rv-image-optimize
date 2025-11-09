import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  // 开发模式：应用模式
  if (command === 'serve') {
    return {
      plugins: [react()],
      root: '.',
      server: {
        port: 3000,
        open: true,
      },
    };
  }
  
  // 静态文件构建模式（可部署的示例应用）
  if (mode === 'static') {
    return {
      plugins: [react()],
      root: '.',
      build: {
        outDir: 'dist-static',
        emptyOutDir: true,
        rollupOptions: {
          input: resolve(__dirname, 'index.html'),
          output: {
            // JS 文件输出到 JS 文件夹
            entryFileNames: 'JS/[name]-[hash].js',
            chunkFileNames: 'JS/[name]-[hash].js',
            // 资源文件根据类型分类
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              const ext = info[info.length - 1];
              // CSS 文件输出到 CSS 文件夹
              if (/css/i.test(ext)) {
                return 'CSS/[name]-[hash][extname]';
              }
              // 其他静态资源（图片等）输出到 assets 文件夹
              return 'assets/[name]-[hash][extname]';
            },
          },
        },
        sourcemap: false,
        minify: 'esbuild', // 使用 esbuild 压缩，更快
      },
      base: './', // 使用相对路径，方便部署到任意路径
    };
  }
  
  // 构建模式：库模式（npm 包）
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.js'),
        name: 'ImageOptimize',
        formats: ['es', 'cjs', 'umd'],
        fileName: (format) => `image-optimize.${format}.js`,
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
  };
});
