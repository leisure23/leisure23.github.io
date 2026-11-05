/**
 * 全站配置。改这一个文件就够了。
 */

export const SITE = {
  title: 'Leisure',
  /** 用于 <title> 后缀 */
  subTitle: '笔记与代码',
  description: '一个知识仓库。把课堂上的、书里的、踩坑踩出来的东西，写成能回看的笔记。',
  author: 'Leisure',
  url: 'https://leisure23.github.io',
  lang: 'zh-CN',
  /** 页眉右侧的期号信息 */
  issue: 'ISSUE 01 / NOV 2026 / ONLINE',
  socials: [
    { label: 'GitHub', href: 'https://github.com/leisure23', icon: 'github' },
  ],
  about: `
    <p>你好，我是 <strong>Leisure</strong>，欢迎来到我的博客</p>
    <p>希望这里的内容能帮到你</p>
    <p>感谢您的到来</p>
  `,
} as const;

/**
 * 首屏那几行大字。
 * style 三选一：solid（实心黑）/ outline（描边空心）/ accent（朱红）
 * 想换行就在数组里切一条，想加一行就多写一条。
 */
export const HERO = {
  kicker: 'Notes on Code & Theory',
  lines: [
    { text: '还没想好', style: 'solid' },
    { text: '这里', style: 'outline' },
    { text: '写什么。', style: 'accent' },
  ] as { text: string; style: 'solid' | 'outline' | 'accent' }[],
  /** 右侧竖排小字 */
  vertical: '从「知道」往「为什么」再挖一层',
  /** 背景幽灵年份 */
  ghostYear: '2026',
} as const;

/**
 * 专栏（黑条上的模块）。
 * tags 决定这个专栏收录哪些标签的文章，篇数是自动统计的。
 * 想加一个就在数组里加一条，黑条会自动多一格。
 */
export const COLUMNS = [
  { slug: 'web', name: 'web', tags: ['web'] },
  { slug: 'algo', name: '算法', tags: ['算法'] },
  { slug: 'data-structure', name: '数据结构', tags: ['数据结构'] },
  { slug: 'os', name: '操作系统', tags: ['操作系统'] },
  { slug: 'pitfalls', name: '踩坑记录', tags: ['建站'] },
  { slug: 'why', name: '原理追问', tags: ['复杂度'] },
  { slug: 'eggs', name: '彩蛋', tags: ['彩蛋'] },
] as const;

/**
 * 公告 / 通知列表。最新的一条显示在首页，全部显示在 /notice/ 页面。
 * 想发新公告就在数组最前面加一条，支持 <b> 做荧光笔标记。
 */
export const NOTICES = [
  {
    /** 发布时间，精确到分钟：2026-11-05T00:14 */
    publishedAt: '2026-11-05T00:14',
    html: '<b>正在努力更新中...</b>',
  },
] as const;

/** 首页展示的那一条 */
export const NOTICE = NOTICES[0];
