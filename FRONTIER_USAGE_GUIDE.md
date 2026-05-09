# 学术最前沿栏目使用指南

## 目录结构
```
src/pages/frontier/
├── index.astro          # 主页面，自动读取articles目录
├── articles/            # Markdown文章目录
│   ├── deepseek-r2-launch.md
│   ├── meta-hstu-v2.md
│   └── google-gemini-2.5.md
└── (未来新增的markdown文件)
```

## 如何使用

### 1. 新增文章
只需在 `src/pages/frontier/articles/` 目录下创建一个新的markdown文件：

```bash
# 示例：创建新文章
touch src/pages/frontier/articles/2026-05-09-anthropic-agent.md
```

### 2. 文章格式
每个markdown文件需要包含frontmatter头部信息：

```markdown
---
date: 2026-05-09          # 发布日期
category: AI Agent        # 分类（LLM、推荐系统、多模态、AI Agent、开源等）
source: Anthropic         # 来源
title: "文章标题"
summary: "简短摘要"
tags: ["标签1", "标签2"]   # 标签列表
---

# 文章内容
...
```

### 3. 支持的分类
当前支持的分类（会自动从文章中提取）：
- LLM
- 推荐系统  
- 多模态
- AI Agent
- 开源

可以随时新增其他分类，系统会自动识别。

### 4. 自动功能
- **自动排序**: 文章按日期倒序排列
- **分类筛选**: 页面顶部有分类筛选按钮
- **标签显示**: 每篇文章显示相关标签
- **响应式设计**: 适配桌面和移动设备

## 示例文件

### 示例1: AI新闻
```markdown
---
date: 2026-05-10
category: LLM
source: OpenAI
title: "GPT-5 预览版发布，支持多模态推理"
summary: "新一代模型在复杂推理任务上表现突出。"
tags: ["多模态", "推理"]
---
```

### 示例2: 开源项目
```markdown
---
date: 2026-05-11  
category: 开源
source: HuggingFace
title: "Transformers v5.0 发布，支持新架构"
summary: "新增对Mamba、RWKV等架构的支持。"
tags: ["开源", "Transformer"]
---
```

### 示例3: 研究进展
```markdown
---
date: 2026-05-12
category: 推荐系统  
source: 阿里巴巴
title: "端到端生成式推荐在淘宝落地"
summary: "OneRec架构在电商场景取得显著效果提升。"
tags: ["生成式推荐", "电商"]
---
```

## 开发说明

### 技术实现
- 使用 `Astro.glob('./articles/*.md')` 动态读取文章
- 自动解析frontmatter元数据
- 支持实时热重载，修改后立即生效

### 自定义扩展
如需添加新功能（如搜索、分页等），可修改 `src/pages/frontier/index.astro`

## 部署说明

GitHub Actions会自动构建部署，新增文章后：
1. 推送代码到main分支
2. 等待约2分钟构建完成
3. 访问 https://wuhaiyangit.github.io/airesearch/frontier/ 查看效果