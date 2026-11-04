import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages 上的地址。本地开发用不到，构建时会写进 RSS / sitemap / og 标签。
// 部署时由 .github/workflows/deploy.yml 通过环境变量注入，你不用手改。
const site = process.env.SITE_URL ?? 'https://leisure23.github.io';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  compressHTML: true,
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // 全站只有一个浅色设计，但代码块固定是黑底，
      // 所以这里必须用「深色主题」，否则浅色配色压在黑底上会看不清。
      theme: 'github-dark',
      wrap: false,
    },
  },
  build: {
    format: 'directory',
  },
  vite: {
    server: {
      watch: {
        // 开发服务器默认监视整个项目目录。.cache 里可能有构建缓存、日志、
        // 甚至浏览器配置，被监视会导致 Windows 上 EBUSY 崩溃，也让热更新变慢。
        ignored: ['**/.cache/**', '**/dist/**', '**/.astro/**'],
      },
    },
  },
});
