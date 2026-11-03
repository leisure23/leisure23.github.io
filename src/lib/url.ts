/**
 * 拼接站内链接的小工具。
 *
 * 为什么不能直接写 "/blog/"？
 * 因为 GitHub Pages 有两种仓库：your-name.github.io（根路径）
 * 和随便命名的仓库（部署在 /仓库名/ 子路径下）。用 withBase()
 * 拼接，两种仓库都能跑，不用改代码。
 */
const base = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

/** 把站内路径补上 base，输入 'blog/' 输出 '/blog/' 或 '/repo/blog/' */
export function withBase(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return `${base}${clean}`;
}

/** 文章的最终链接 */
export function postUrl(id: string): string {
  return withBase(`blog/${id}/`);
}
