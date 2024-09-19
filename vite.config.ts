// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';
// import { resolve } from 'path';

// export default defineConfig({
//   base: './',
//   plugins: [vue()],
//   build: {
//     rollupOptions: {
//       input: resolve(__dirname, 'src/components/index.ts'), // 确保路径正确
//       treeshake: false, // 已禁用 Tree Shaking
//       external: ['vue'], // 外部化 Vue，避免打包 Vue
//       output: {
//         dir: 'dist', // 输出到 dist 目录
//         format: 'es', // ES module 格式
//       },
//     },
//     sourcemap: true, // 生成 sourcemap 以便调试
//   },
// });


// 打包一个ts库文件
// import { defineConfig } from 'vite'
// import { resolve } from 'path'

// export default defineConfig({
//   base: './',
//   build: {
//     lib: {
//       entry: resolve(__dirname, 'src/components/index.ts'), // 指定库的入口文件
//       name: 'MyLib', // 库的全局变量名称（对于 UMD/IIFE 格式）
//       fileName: 'my-lib', // 输出的文件名
//       formats: ['es', 'cjs'], // 指定输出格式，可以是 'es'、'cjs'、'umd'、'iife'
//     },
//     rollupOptions: {
//       // 外部化依赖项，防止将它们打包到库中
//       external: [], // 如果有外部依赖（如 'vue'），可以在此处添加
//       output: {
//         // 在 UMD 或 IIFE 构建模式下，为这些外部化的依赖提供全局变量
//         globals: {
//           // vue: 'Vue',
//         },
//       },
//     },
//     minify: false, // 禁用代码压缩，方便查看打包后的代码
//   },
// });

// 打包一个vue组件库
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
      // entry: resolve(__dirname, 'src/components/index.ts'),
      entry: resolve(__dirname, 'packages/Gantt/index.ts'),
      name: 'Gantt',
      fileName: (format) => `gantt.${format}.js`,
      formats: ['es', 'cjs'],
    },
    cssCodeSplit: false, // 内联 CSS 到 JS 中
    rollupOptions: {
      external: ['vue'],
      // output: {
      //   globals: {
      //     vue: 'Vue',
      //   },
      // },
    },
    minify: false,
    sourcemap: true,
  },
})


