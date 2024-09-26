import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      less: {
        // 可配置 Less 选项
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'packages/Gantt/index.ts'),
      name: 'Gantt',
      fileName: 'index', // (format) => `gantt.${format}.js`,
      formats: ['es'], // , 'cjs'
    },
    cssCodeSplit: false, // 内联 CSS 到 JS 中
    rollupOptions: {
      external: ['vue'],
    },
    minify: true, // 是否压缩，false 不会压缩
    // sourcemap: true,
  },
})


