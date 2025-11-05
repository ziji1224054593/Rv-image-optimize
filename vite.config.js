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
  
  // 构建模式：库模式
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
        },
      },
      cssCodeSplit: false,
    },
  };
});
