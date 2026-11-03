/**
 * 浏览器端用的路径工具。
 * 客户端拿不到 Astro.url，但能拿到构建时注入的 BASE_URL。
 */
const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export function withBaseUrl(path = ''): string {
  return `${base}${path.replace(/^\/+/, '')}`;
}
