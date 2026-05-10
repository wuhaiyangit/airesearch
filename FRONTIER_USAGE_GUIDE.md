# 学术最前沿栏目使用指南

## 目录结构总览
```
src/pages/frontier/
├── index.astro              # 主页面 - 三个部分的导航
├── news/                    # 业界最新动态
│   ├── index.astro          # 动态列表页面
│   └── daily/               # 每日新闻目录（未来扩展）
├── papers/                  # 论文精读
│   ├── index.astro          # 论文分类页面
│   ├── generative-recall/   # 生成式召回论文
│   ├── generative-search/   # 生成式搜索论文
│   └── model-scaling/       # 模型Scaling UP论文
└── columns/                 # 技术专栏
    ├── index.astro          # 专栏导航页面
    ├── llm/                 # LLM技术专栏
    └── multimodal/          # 多模态技术专栏
```

## 1. 业界最新动态（news）

### 功能特点
- 分页显示，每页显示7天内容
- 每天约5条新闻动态
- 支持标题、链接、来源、时间信息
- 自动按日期倒序排列

### 新增内容方式
目前采用静态数据方式，未来可扩展为动态读取markdown文件：

```javascript
// 在 src/pages/frontier/news/index.astro 中新增数据
const newsData = [
  {
    date: '2026-05-11',
    items: [
      {
        title: '最新AI新闻标题',
        link: 'https://example.com/news',
        source: '来源名称',
        time: '09:00'
      }
    ]
  }
];
```

### 未来扩展计划
- 创建 `daily/` 目录，按日期存放markdown文件
- 每个markdown文件包含当天的多条新闻
- 支持自动读取和渲染

## 2. 论文精读（papers）

### 功能特点
- 按技术领域分类（生成式召回、生成式搜索、模型Scaling UP等）
- 每篇论文包含标题、作者、年份、摘要
- 支持分类导航和快速跳转

### 新增内容方式
在 `src/pages/frontier/papers/index.astro` 中修改 `paperCategories` 数组：

```javascript
const paperCategories = [
  {
    id: 'new-category',           // 新分类ID
    name: '新分类名称',            // 分类显示名称
    description: '分类描述',       // 分类详细描述
    papers: [                     // 论文列表
      {
        title: '论文标题',
        authors: '作者列表',
        link: '/frontier/papers/new-category/paper-slug',
        year: '2026',
        abstract: '论文摘要内容'
      }
    ]
  }
];
```

### 新增论文详细页面
为每篇论文创建对应的markdown文件：

```bash
# 在对应分类目录下创建论文文件
touch src/pages/frontier/papers/generative-recall/new-paper.md
```

论文markdown文件格式：
```markdown
---
title: "论文标题"
authors: "作者列表"
date: "2026-05-11"
abstract: "论文摘要"
tags: ["标签1", "标签2"]
---

# 论文标题

## 摘要
论文详细内容...
```

## 3. 技术专栏（columns）

### 功能特点
- 按技术领域分类（LLM、多模态等）
- 每篇文章包含标题、作者、日期、摘要、标签
- 支持技术标签和分类筛选

### 新增内容方式
在 `src/pages/frontier/columns/index.astro` 中修改 `techColumns` 数组：

```javascript
const techColumns = [
  {
    id: 'new-domain',           // 新领域ID
    name: '新领域专栏',          // 专栏名称
    description: '专栏描述',     // 专栏详细描述
    articles: [                  // 文章列表
      {
        title: '文章标题',
        author: '作者姓名',
        date: '2026-05-11',
        link: '/frontier/columns/new-domain/article-slug',
        summary: '文章摘要',
        tags: ['标签1', '标签2']
      }
    ]
  }
];
```

### 新增专栏文章详细页面
为每篇文章创建对应的markdown文件：

```bash
# 在对应领域目录下创建文章文件
touch src/pages/frontier/columns/llm/new-article.md
```

文章markdown文件格式：
```markdown
---
title: "文章标题"
author: "作者姓名"
date: "2026-05-11"
summary: "文章摘要"
tags: ["技术标签1", "技术标签2"]
---

# 文章标题

文章详细内容...
```

## 访问路径

- **主页面**: https://wuhaiyangit.github.io/airesearch/frontier/
- **业界动态**: https://wuhaiyangit.github.io/airesearch/frontier/news/
- **论文精读**: https://wuhaiyangit.github.io/airesearch/frontier/papers/
- **技术专栏**: https://wuhaiyangit.github.io/airesearch/frontier/columns/

## 部署流程

1. 新增内容后，提交代码到main分支
2. GitHub Actions会自动构建和部署
3. 等待约2分钟构建完成
4. 访问对应页面查看效果

## 样式规范

### 颜色变量
- 主色调: `var(--color-primary)`
- 文字颜色: `var(--text)`
- 次要文字: `var(--text-muted)`
- 背景色: `var(--bg-elevated)`

### 布局规范
- 容器宽度: `max-width: 1200px`
- 内边距: `padding: 1.5rem`
- 圆角: `var(--radius-lg)`
- 阴影: `var(--shadow-md)`

## 响应式设计
所有页面都支持移动端和桌面端自适应：
- 桌面端: 多列网格布局
- 移动端: 单列垂直布局
- 断点: `768px`

## 扩展建议

### 短期优化
1. 为news部分实现动态markdown文件读取
2. 添加搜索功能
3. 增加RSS订阅支持

### 长期规划
1. 实现用户评论系统
2. 添加文章收藏功能
3. 支持文章分享统计
4. 集成第三方API自动获取新闻

## 技术架构

- **框架**: Astro + Tailwind CSS
- **部署**: GitHub Pages
- **构建**: GitHub Actions
- **样式**: CSS变量 + 响应式设计

这个架构确保了内容的可维护性和扩展性，新增内容只需修改对应的数据数组或添加markdown文件即可。