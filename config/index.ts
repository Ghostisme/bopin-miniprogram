import { defineConfig } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig(async (merge, { command, mode }) => {
  // Keep the WeChat output stable. H5 is outside the project root so WeChat
  // DevTools cannot count its web bundles in the mini-program package.
  const outputRoot = process.env.TARO_ENV === 'h5' ? '../bopin-miniprogram-h5' : 'dist'

  const baseConfig = {
    projectName: 'bopin-miniprogram',
    date: '2026-08-18',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot,
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {}
    },
    framework: 'react',
    compiler: {
      type: 'webpack5',
      // Taro 3.6 prebundle is incompatible with Node 24's webpack filesystem.
      prebundle: { enable: false },
    },
    cache: {
      enable: false
    },
    alias: {
      '@': require('path').resolve(__dirname, '..', 'src')
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      // 所有 H5 开发预览均通过同源路径访问接口，避免浏览器阻止
      // 局域网页面直接请求 localhost 的私有网络地址。
      devServer: {
        proxy: {
          '/api/v1': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
          '/uploads': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
