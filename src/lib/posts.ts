import { getCollection, type CollectionEntry } from 'astro:content';
import { COLUMNS } from '../consts';

export type Post = CollectionEntry<'blog'>;

/** 所有要展示的文章（正式构建时过滤草稿），按发布时间倒序：新的在前 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true,
  );
  return posts.sort(
    (a, b) =>
      // 主键：发布时间，越晚越靠前（pubDate 现在精确到秒）
      b.data.pubDate.getTime() - a.data.pubDate.getTime() ||
      // 兜底：时间完全相同时按文件名倒序，保证每次构建顺序一致、不会乱跳
      b.id.localeCompare(a.id),
  );
}

/** 中文按字、英文按词，混合统计 */
export function countWords(text: string): number {
  const cjk = text.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const words = text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_'-]+/g)?.length ?? 0;
  return cjk + words;
}

/** 估算阅读时长（中文 350 字/分，代码按更慢的速率） */
export function readingTime(body: string): { minutes: number; words: number } {
  const codeBlocks = body.match(/```[\s\S]*?```/g) ?? [];
  const codeChars = codeBlocks.reduce((sum, block) => sum + countWords(block), 0);
  const prose = body.replace(/```[\s\S]*?```/g, '');
  const words = countWords(prose) + codeChars;
  const minutes = Math.max(1, Math.round(countWords(prose) / 350 + codeChars / 500));
  return { minutes, words };
}

/** 日期统一格式：2026-11-05 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 日期 + 时间（精确到分钟）：2026-11-05 14:30 */
export function formatDateTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(date)} ${hh}:${mm}`;
}

/** 2026 年 11 月 5 日 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** 相对时间 */
export function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const day = 86_400_000;
  if (diff < day) return '今天';
  if (diff < day * 2) return '昨天';
  if (diff < day * 30) return `${Math.floor(diff / day)} 天前`;
  if (diff < day * 365) return `${Math.floor(diff / (day * 30))} 个月前`;
  return `${Math.floor(diff / (day * 365))} 年前`;
}

/** 所有标签及出现次数 */
export function collectTags(posts: Post[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) map.set(tag, (map.get(tag) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
}

/** 按年份分组 */
export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
  const map = new Map<number, Post[]>();
  for (const post of posts) {
    const year = post.data.pubDate.getFullYear();
    const list = map.get(year) ?? [];
    list.push(post);
    map.set(year, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, list]) => ({ year, posts: list }));
}

/** 上一篇 / 下一篇 */
export function neighbours(all: Post[], current: Post) {
  const asc = [...all].sort((a, b) => a.data.pubDate.getTime() - b.data.pubDate.getTime());
  const index = asc.findIndex((p) => p.id === current.id);
  return {
    prev: index > 0 ? asc[index - 1] : undefined,
    next: index >= 0 && index < asc.length - 1 ? asc[index + 1] : undefined,
  };
}

/** 该文章属于哪个专栏（按标签匹配，取第一个命中的） */
export function columnOf(post: Post) {
  return COLUMNS.find((column) =>
    post.data.tags.some((tag) => (column.tags as readonly string[]).includes(tag)),
  );
}

/** 专栏 + 该专栏的文章 + 篇数，给黑条和专栏页用 */
export function collectColumns(posts: Post[]) {
  return COLUMNS.map((column) => {
    const list = posts.filter((post) =>
      post.data.tags.some((tag) => (column.tags as readonly string[]).includes(tag)),
    );
    return { ...column, posts: list, count: list.length };
  });
}

/** 文章的主分类（第一个标签） */
export function primaryTag(post: Post): string {
  return post.data.tags[0] ?? '未分类';
}
