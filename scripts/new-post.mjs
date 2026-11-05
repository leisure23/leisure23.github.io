#!/usr/bin/env node
/**
 * 新建一篇文章。
 *
 *   npm run post "二分查找的边界问题" binary-search-boundaries
 *   npm run post "红黑树"            → 自动取 red-black-tree 之类的英文名
 *
 * 会在 src/content/blog/ 下生成一个带好 frontmatter 的 .md 文件。
 */
import { access, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'src', 'content', 'blog');

const argv = process.argv.slice(2);
const title = argv[0];

if (!title) {
  console.error('\n用法：npm run post "文章标题" [英文文件名]\n');
  console.error('例子：npm run post "红黑树入门" red-black-tree\n');
  process.exit(1);
}

/** 把任意字符串压成 ASCII slug（中文会被丢掉，所以要传第二个参数） */
function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"《》「」]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

let slug = argv[1] ? slugify(argv[1]) : slugify(title);

if (!slug) {
  // 标题里没有可用作文件名的英文字符时，用日期兜底
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  slug = `post-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}`;
  console.log('');
  console.log(`提示：标题里没有英文，文件名先用了 ${slug}.md`);
  console.log('     建议以后手动改成英文名，这样文章 URL 更好看、也更好分享。');
}

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
// 带上具体时间（精确到分钟）：同一天发多篇文章时，首页才能按"谁后发谁在上"排。
// 页面上只显示年月日（2026-11-05），时分不露出。
const stamp = `${today}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

const filePath = path.join(contentDir, `${slug}.md`);

try {
  await access(filePath);
  console.error(`\n文件已存在：src/content/blog/${slug}.md\n`);
  process.exit(1);
} catch {
  // 不存在，继续
}

const template = `---
title: ${JSON.stringify(title)}
description: 一句话说清这篇文章讲了什么，会出现在列表页和搜索结果里。
pubDate: ${stamp}
tags: [待分类]
emoji: "📝"
hue: 255
featured: false
draft: true
---

> 写之前先想清楚：这篇文章想让「过去的自己」看懂什么？

## 为什么写这个

这里写你遇到的问题、卡住的点。

## 正文

正文用 Markdown 写就行：

\`\`\`cpp
// 代码块会自动高亮、自动加复制按钮
int main() {
    return 0;
}
\`\`\`

## 小结

- 一句话总结要点。
`;

await mkdir(contentDir, { recursive: true });
await writeFile(filePath, template, 'utf8');

console.log('');
console.log('✅ 已创建：src/content/blog/' + slug + '.md');
console.log('');
console.log('接下来：');
console.log('  1. 打开文件写内容（写完把 draft: true 改成 false 才会发布）');
console.log('  2. npm run dev   本地预览 http://localhost:4321');
console.log('  3. git add . && git commit -m "新文章" && git push   自动上线');
console.log('');
