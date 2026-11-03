import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';
import { postUrl } from '../lib/url';

/** 把 Markdown 粗略洗成纯文本，用于全文搜索 */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[\s>#*+\-\d.]+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 构建时生成一份搜索索引：/search.json
 * 浏览器端按需 fetch，纯静态、无后端。
 */
export const GET: APIRoute = async () => {
  const posts = await getPosts();

  const index = posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    url: postUrl(post.id),
    tags: post.data.tags,
    date: post.data.pubDate.toISOString().slice(0, 10),
    text: toPlainText(post.body ?? '').slice(0, 2000),
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
