import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * 文章集合：src/content/blog/ 下的每个 .md 文件就是一篇博客。
 * 想改「文章需要哪些元信息」，改这里的 schema 就行。
 */
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    /** 标题 */
    title: z.string(),
    /** 摘要，会出现在列表、搜索结果和 SEO 描述里 */
    description: z.string(),
    /** 发布日期，写成 2026-03-01 这种就行 */
    pubDate: z.coerce.date(),
    /** 修改日期，可选 */
    updatedDate: z.coerce.date().optional(),
    /** 标签，用来分类和生成标签页 */
    tags: z.array(z.string()).default([]),
    /** 一个 emoji，当作文章的封面图标 */
    emoji: z.string().default('📄'),
    /** 卡片渐变色相（0-360），随便挑一个好看的数字 */
    hue: z.number().min(0).max(360).default(255),
    /** true = 草稿，不会出现在正式构建里 */
    draft: z.boolean().default(false),
    /** true = 首页精选 */
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
