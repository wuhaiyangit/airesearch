---
layout: ../../../../layouts/BookLayout.astro
chapter: 02
section: 04
title: "基于 LLM 的标记增强"
drafted_at: "2026-05-18"
planner_notes: "research-notes/chapter-02/section-2.4.md"
refs: [REF-011, REF-012, REF-013, REF-014, REF-084, REF-085, REF-086, REF-087, REF-088]
word_count: 5207
status: REVIEWED
reviewed_at: "2026-05-18"
human_quality_requirements: "无"
review_notes:
  - "六维全 PASS（DRAFT → PASS 一次过，本章第六次一次过）。事实抽查 5 篇前沿 REF 全字面命中。"
  - "REF-013 LC-Rec abstract 8 项关键短语全 PASS（large semantic gap / learning-based VQ uniform semantic mapping / meaningful and non-conflicting IDs / a series of specially designed tuning tasks / deeply integrate language and collaborative semantics / directly generate items from the entire item set / outperform competitive baselines / ICDE 2024）。"
  - "REF-085 TCA4Rec WWW 2026 abstract 7 项 PASS（fundamental mismatch / Collaborative Tokenizer projects item-level CF logits to token-level distributions / Soft Label Alignment / soft NTP objective / model-agnostic and plug-and-play / consistently improves / explicit mechanism to balance behavioral alignment and semantic fluency）。"
  - "REF-086 SIGMA SIGIR 2026 Industry abstract 7 项 PASS。Writer 主动对 +2.80%/+3.84%/+7.84% 数字标注「据技术博客报告，而非论文 abstract 直接归因」——§1.1/§1.4/§2.3 三次同型 REVISE 沉淀的「abstract 未直接支撑加限定语」规则首次主动落实，PASS。"
  - "REF-087 SINGER ICLR 2026 投稿 OpenReview abstract 6 项 PASS。Writer 严格使用「据 Kong 等报告」「Submitted to ICLR 2026」稳妥措辞。"
  - "REF-088 Scaling View ICLR 2026 投稿 abstract 3 项 PASS（SID-based GR shows significant bottlenecks while scaling up / limited capacity of SIDs to encode item semantic information / up to 20% improvement）。"
  - "字数 5207 vs front-matter 原 5505 偏差 -5.4%（PASS 模式同步校正至 5207）；落在 writing-queue 建议 5000-6000 内。"
  - "公式 (2.11)(2.12) 承接 §2.3 (2.10)；图 2-6 + 图 2-7 + 表 2-5 体例正确。"
  - "章节衔接：实读 02-reviewed/chapter-02-section-03.md 末段「§2.4 将探讨一条更激进的路线——直接用 LLM 的世界知识来增强标记过程」与 §2.4.1 开篇字面承接 PASS；§2.4.6 末段 §2.5 过渡句逐字落地。"
  - "前沿性：5 条 2026 年 REF 齐全；scaling 理论根据 [REF-088] 为本节立论提供实证支撑。"
---

## 2.4.1　从语义鸿沟到 SID 信息瓶颈：本节定位

§2.3 走完了一条"让物品标识符说人话"的路径——从 P5 [REF-011] 的原子 ID 到 IDGenRec [REF-012] 的文本 ID，再到 TransRec 的多 facet 集成与 LETTER [REF-014] 的三组分损失。但 §2.3 末段也指出了两个悬而未决的难题：第一，即便 ID 已经落到 LLM 词表内部，**LLM 对这些符号的理解仍停留在表面记忆层面**——它能读懂"无线鼠标"这四个字，却不一定理解"购买鼠标的用户也常买鼠标垫"这一行为关联；第二，**协同行为信号无法在 token 生成的层面直接参与解码**——SFT 训练只能从 one-hot 目标里隐式拾取协同模式，无法在生成概率空间里被显式注入。

本节探讨的正是这一鸿沟的弥合：**如何让 LLM 不再仅是"标记的消费者"，而成为"标记体系的共建者"。** 与 §2.2、§2.3 把 tokenizer 视为推荐链路前置的、独立的预处理模块不同，本节关注的方法都试图把 LLM 的能力**前置到标记环节本身**——或在 ID 学习阶段就让 LLM 参与对齐（路线 A：LC-Rec [REF-013]），或在生成阶段把外部协同信号软化为 LLM token 分布的调制（路线 B：TCA4Rec [REF-085]），或干脆把 grounding 与 tokenization 内置进推荐 LLM 自身（路线 C：SIGMA [REF-086]）。

这一动机不仅来自工程直觉，也有 scaling 实证支撑。2026 年一项面向生成式推荐 scaling 行为的系统研究 [REF-088]（投稿 ICLR 2026）揭示了一个值得警觉的现象：**SID-based GR 范式在模型规模扩张时存在显著饱和瓶颈**。该工作系统评测了 SID-based GR 的三类组件（模态编码器、量化 tokenizer、推荐主模型）在 44M 至 14B 参数区间的 scaling 行为，据 OpenReview 原文报告——"SID-based GR shows significant bottlenecks while scaling up"，其根本原因被归结为"limited capacity of SIDs to encode item semantic information"；与此对应，**LLM-as-RS** 范式（让 LLM 直接以自然语言操作物品而非通过外挂 SID）则展现出更优的 scaling 属性，最高可"achieves up to 20% improvement than the best achievable performance of SID-based GR through scaling"。

这一实证结果为本节给出了清晰的理论根据：当模型容量持续扩大时，SID 的**有限离散信道**会成为性能天花板——任何"先量化、再喂给 LLM"的两阶段范式都将受其制约。让 LLM 的世界知识直接参与标记过程，是突破这一瓶颈的合理方向。

> **本节路线图。** §2.4.2 详解 **LC-Rec** 的"学习量化 + 多任务对齐"路线；§2.4.3 详解 **TCA4Rec** 在优化层面打通 CF 与 LLM 的尝试；§2.4.4 详解 **SIGMA** 在 AliExpress 工业部署中的语义 grounding + 混合 tokenization；§2.4.5 转向训练范式视角，剖析 **SINGER** [REF-087] 揭示的 SFT-then-RL 缺陷与 SID-Navigated RL 的修复方案；§2.4.6 给出三条路线的横向对比（图 2-6 + 表 2-5）、本节小结以及与 §2.5 的衔接。

## 2.4.2　路线 A：学习量化 + 多任务对齐 — LC-Rec 详解

第一条路线把"LLM 增强标记"理解为一个**对齐问题**——既然问题的本质是 LLM 词表外的 item ID 与 LLM 已掌握的语言语义之间存在割裂，那么解法就应该是**学一套兼容 LLM 的 item indexing 方案，并通过对齐微调让 LLM 真正理解这套索引**。2024 年 ICDE 的 **LC-Rec** [REF-013]（Zheng 等，人民大学）是这条路线的代表性工作，也是 §2.4 在时间线上的"开端"。

**动机。** [REF-013] abstract 在开篇直接点明问题："there exists a large semantic gap between LLMs and recommender systems, since items to be recommended are often indexed by discrete identifiers (item ID) out of the LLM's vocabulary"——LLM 捕获语言语义（language semantics），推荐系统蕴含协同语义（collaborative semantics），两者存在不可忽视的鸿沟。而直接使用原始 item ID 会**超出 LLM 词表**，导致 LLM 的世界知识无法被充分调动；反过来若仅用文本标题作 ID 又面临 §2.3 已分析的冲突问题。LC-Rec 的核心立论是：**应当用一种"学习量化"的方式构造 item indices，再通过系统化的对齐微调任务让 LLM 内化这套索引体系。**

**方法：两大模块。** LC-Rec 的设计可拆为两块，分别对应"如何构造 ID"与"如何让 LLM 读懂 ID"。

第一块是 **item indexing 的 learning-based VQ + uniform semantic mapping**。LC-Rec 沿用 §2.2.1—§2.2.2 介绍的向量量化框架，但在标准 VQ-VAE 重建损失之外引入一项**均匀语义映射正则**——其作用是约束语义空间内邻近的物品对应到结构相近的 index，并强制码本使用率均匀分布。这一思路可用如下形式化表达（沿用 §2.2 (2.3) 的符号约定，$e$ 为编码器输出向量、$z_q$ 为码本中最近邻码字、$\text{sg}[\cdot]$ 为停止梯度算子）：

$$
\mathcal{L}_{\text{VQ}}^{\text{LC}} \;=\; \|e-\text{sg}[z_q]\|_2^2 \;+\; \beta\,\|\text{sg}[e]-z_q\|_2^2 \;+\; \lambda\,\mathcal{L}_{\text{uniform}} \tag{2.11}
$$

公式 (2.11) 的物理意义：前两项延续 §2.2 (2.3) 标准 VQ 的码字更新（codebook loss）与编码器承诺（commitment loss）；新增的第三项 $\mathcal{L}_{\text{uniform}}$ 显式惩罚码字使用频率的偏斜分布，作为对码本坍缩根因（参见 §2.2.5 的根因 (1)/(2)）的"源头治理"。其结果是——**学习到的 item index 既保留几何语义结构，又避免出现少数码字垄断的情形**——按 [REF-013] abstract 原文，这套机制能为每个物品"assign meaningful and non-conflicting IDs (called item indices)"。

第二块是**对齐微调（Alignment Tuning）**。给定上一步学到的 item indices，LC-Rec 设计了一组**多任务微调指令**，把 LLM 对这套索引的理解从单一的"给历史预测下一个 index"扩展为多视角的双向映射。据 [REF-013] abstract 原文：作者"propose a series of specially designed tuning tasks to enhance the integration of collaborative semantics in LLMs"，使 LLM "deeply integrate language and collaborative semantics (characterized by the learned item indices)"。这一系列任务可以分为两个方向：

- **结构对齐方向**：以 item 与 index 之间的双向映射为主，让 LLM 学会"看到 index 能联想到 item 内容、看到 item 描述能预测对应 index"——这是任何后续推荐生成任务的底层语义基础。
- **行为对齐方向**：把 item index 嵌入到不同形式的推荐任务里——从基础的序列推荐（fusion seqrec）到搜索式查询匹配（item search）再到用户偏好建模（preference obtain）——通过多任务训练让 LLM 把语言语义与协同语义"绑定"到同一套 index 表示上。

> **图 2-6（节选 路线 A）：LC-Rec 训练流程的两阶段示意。**

```text
┌──────────── 阶段一：Item Indexing（learning-based VQ） ────────────┐
│                                                                    │
│  Item description / metadata                                       │
│         │                                                          │
│         ▼                                                          │
│   Text encoder（冻结） ──→ e ∈ R^d                                 │
│         │                                                          │
│         ▼     ┌────────────────────────────────┐                   │
│   VQ 量化  ←──│ Codebook + uniform mapping reg │ → 公式 (2.11)     │
│         │     └────────────────────────────────┘                   │
│         ▼                                                          │
│   item index = (c_1, c_2, ..., c_L)  ◀── 冻结后用于阶段二          │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
┌──────────── 阶段二：Alignment Tuning（LLaMA-7B 上微调） ─────────┐
│                                                                    │
│  任务族：                                                          │
│    • item2index  / index2item        ──→  结构对齐                 │
│    • fusion seqrec                   ──→  行为对齐（序列推荐）     │
│    • item search                     ──→  行为对齐（搜索）         │
│    • preference obtain               ──→  行为对齐（偏好建模）     │
│                                                                    │
│  统一以 LLaMA-7B 为 backbone，多任务监督微调（SFT）                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**关键结果。** [REF-013] abstract 给出两个层面的结论。在能力层面，LC-Rec 可"directly generate items from the entire item set for recommendation, without relying on candidate items"——这是迄今为止把生成式范式真正用于**全库召回**而非候选重排的代表性证据。在效果层面，作者报告"our approach can outperform a number of competitive baselines including traditional recommenders and existing LLM-based recommenders"。需要说明的是，[REF-013] abstract 未给出具体 Recall/NDCG 数值，本书亦不附会具体数字。

**局限性。** (1) **两阶段流水线**——阶段一的 VQ 训练完成后即冻结，下游 LLM 微调无法回传梯度修正 ID 结构；(2) **对齐任务设计的人工依赖**——五类微调任务的选择源于作者经验，缺乏系统的"对齐充分性"理论；(3) **协同信号注入仍属间接**——所谓"协同语义"主要通过任务设计而非直接接入 CF 模型获得，因此在 CF 信号丰富的场景下存在改进空间，这正是 §2.4.3 TCA4Rec 要解决的核心问题。

## 2.4.3　路线 B：Token 级协同对齐 — TCA4Rec 详解

如果说 LC-Rec 是从"item indexing 端"做对齐，那么第二条路线则从"优化目标端"着手——直接把 CF 模型的协同信号注入 LLM 的 next-token prediction 概率空间。2026 年 WWW 的 **TCA4Rec**（Token-level Collaborative Alignment for Recommendation）[REF-085]（Lin 等，蚂蚁/中科大）就是这一思路的代表。

**动机。** [REF-085] abstract 抓住了一个被前人忽略的根本错配："a fundamental mismatch between item-level preference modeling in CF and token-level next-token prediction (NTP) optimization in LLMs"——CF 模型预测的是 item-level 偏好（即对每个候选物品打一个分数），而 LLM 的优化目标是 token-level NTP（对词表中每个 token 估计下一个出现的概率）。即便把 CF 的 item id 映射到 SID token 序列，**这两个空间的概率分布也不在同一层面**，无法直接拼接。先前方法或将 CF 作为上下文提示（in-context CF）、或将 CF 视为表示偏差（representation bias），都未能让 CF 在生成步上**显式调控** LLM 的输出分布。

**方法：两个组件。** TCA4Rec 把"打通"问题拆成两步——先**将 item-level CF 分布翻译到 token 空间**，再**用一个软目标函数把它和原始 NTP 监督融合**。

第一步是 **Collaborative Tokenizer**。给定历史交互序列与候选集，外部 CF 模型（可以是 SASRec、BERT4Rec 等任何序列推荐模型）会输出一个 item-level logits 向量 $\mathbf{l}_{\text{CF}}\in \mathbb{R}^{|\mathcal{I}|}$；Collaborative Tokenizer 则把这一向量经一个可学习投影器**映射到 LLM token 空间的分布** $q_{\text{CF}}\in \Delta^{|V|}$——其中 $|V|$ 为 LLM 词表大小，$\Delta^{|V|}$ 表示概率单纯形。按 [REF-085] abstract 原文，这一步把"raw item-level CF logits"投射为"token-level distributions aligned with the LLM token space"。

第二步是 **Soft Label Alignment**。LLM 原本的 NTP 目标使用 one-hot 监督：在每个生成步上，只让目标 token 的概率最大化、其它 token 概率最小化。Soft Label Alignment 引入 CF-informed 分布作为"软标签"，把原始 CE 目标与 KL 对齐项加权融合（沿用 §2.2 与本节符号约定，$p_\theta$ 表示 LLM 在当前位置输出的 token 分布、$y_{\text{one-hot}}$ 表示真实目标 token 的 one-hot 监督向量）：

$$
\mathcal{L}_{\text{soft}} \;=\; (1-\alpha)\,\underbrace{\text{CE}\bigl(p_\theta,\,y_{\text{one-hot}}\bigr)}_{\text{标准 NTP}} \;+\; \alpha\,\underbrace{\text{KL}\bigl(p_\theta\,\|\,q_{\text{CF}}\bigr)}_{\text{协同对齐}} \tag{2.12}
$$

公式 (2.12) 的物理意义：第一项保留了 LLM 生成的"语义流畅性"目标（即跟随训练语料中观察到的真实 token 序列）；第二项强制 LLM 的输出分布在每个生成步上**与 CF 提供的协同分布保持一致**。$\alpha\in[0,1]$ 是一个权衡超参——按 [REF-085] abstract 原文，TCA4Rec "provides an explicit mechanism to balance behavioral alignment and semantic fluency"。当 $\alpha\to 0$ 时退化为原始 NTP（无 CF），当 $\alpha\to 1$ 时模型几乎完全跟随 CF（损失生成语义）。

**为什么 (2.12) 比 LC-Rec 的对齐任务更"近"协同信号**：LC-Rec 通过设计微调任务把协同语义**间接**注入 LLM——任务里出现的物品对、用户序列在统计上反映了 CF 关系，但模型从中提取这一关系需要绕过若干步语义抽象。TCA4Rec 则把 CF 直接接到了生成损失上——每一步生成的概率分布都在被 CF 软标签拉动，相当于**把协同对齐从"任务级"压到了"梯度级"**。

**关键结果。** [REF-085] abstract 强调了三个特性：(a) **model-agnostic and plug-and-play**——可与任意传统 CF 模型搭配；(b) **跨架构通用性**——兼容广谱 decoder-based LLM 推荐器（如 TallRec、LLaRA、CoLLM 等）；(c) **效果**——"consistently improves recommendation performance across a broad spectrum of CF models and LLM-based recommender systems"。需要注意，abstract 未给出具体数字提升幅度，本书亦不附会具体值。

**局限性。** (1) **依赖外部 CF 模型**——CF 模型自身的训练成本与冷启动偏差会被传递到 LLM 生成端；(2) **推理管线变重**——每次生成都需 CF 模型一次前向计算外加投影变换，工业部署需折中考虑延迟；(3) **$\alpha$ 调节经验性**——CE 与 KL 的权重在不同业务场景下并不一致，需逐场景 A/B 调优。

## 2.4.4　路线 C：语义 Grounding + 混合 Tokenization — SIGMA 详解

LC-Rec 把对齐推到 fine-tuning 阶段，TCA4Rec 把对齐推到优化目标，**第三条路线则更激进——直接在工业系统中把 grounding 与 tokenization 内置到推荐 LLM 自身**，使 LLM 成为兼具理解、表示与生成能力的"一体化引擎"。2026 年 SIGIR Industry Track 的 **SIGMA**（Semantic-Grounded Instruction-Driven Generative Multi-Task Recommender）[REF-086]（Yu 等，阿里 AliExpress）是这一路线的工业代表。

**动机。** [REF-086] abstract 明确指出现有生成式推荐的两大局限："most existing methods remain confined to the interaction-driven next-item prediction paradigm, struggling to keep pace with the latest evolving trends or address the diverse recommendation tasks along with business-specific requirements in real-world scenarios"——其一是被困于交互驱动的 next-item prediction 单一范式；其二是无法同时胜任工业系统中**多任务、多场景**的复杂需求（精确推荐、相关性扩散、跨域召回、商品搜索协同等）。SIGMA 的设计目标就是兼顾这两点。

**方法：四个核心组件。**

**(1) Multi-view 语义 grounding：统一潜在空间。** SIGMA 首先构造一个**统一潜在空间**（unified latent space），同时捕获两类信号——一般语义关系（标题/描述/属性/类目/图像等多模态视角）与协同信号（共现、行为序列）。据 [REF-086] abstract 原文，它"ground item entities in a unified latent space capturing both general semantics and collaborative signals"。这一步可类比为"把物品先送进一个能听懂多语种的翻译器"——下游所有任务都基于这套统一表示运行。

**(2) Hybrid Item Tokenization：SID 前缀 + 唯一 ID。** SIGMA 的标记方案不是单一 SID 也不是单一 textual ID，而是**两者的混合**——每个物品由若干位"SID 前缀"加一段"唯一 item ID"组成：前缀承担语义结构功能（决定语义聚类，使解码可被 SID 树形约束剪枝），唯一 ID 承担唯一定位功能（保证生成结果可无歧义回溯到 catalog 中的实体）。这一设计直接呼应了 §2.3 末段提到的两个待解问题——单纯 SID 易冲突、单纯 textual ID 缺结构，混合方案恰恰兼顾结构与唯一。

**(3) 多任务指令微调（Instruction-tuning）。** SIGMA 不再针对单一 next-item prediction 训练，而是构造**大规模多任务 SFT 数据集**，把不同业务场景下的推荐任务（个性化推荐、品类导购、相关商品扩散、搜索召回、跨域跳转等）统一为指令格式，由 LLM 通过 instruction-following 模式响应。这意味着同一个模型可以**按指令切换任务**，而非为每个任务单独训练。

**(4) 三步生成 + Adaptive Probabilistic Fusion。** SIGMA 的解码并非朴素自回归。据 [REF-086] abstract 原文，作者"design a three-step item generation procedure integrated with an adaptive probabilistic fusion mechanism to calibrate the output distributions based on task-specific requirements for recommendation accuracy and diversity"——大致流程是：先在 SID 前缀空间内做粗粒度生成，再在 SID 子空间内做细粒度生成，最后在唯一 ID 段做精确定位；每步之间通过自适应概率融合机制根据任务对"精度 vs 多样性"的需求重新校准输出分布。

> **图 2-6（节选 路线 C）：SIGMA 的语义 grounding + hybrid tokenization 架构。**

```text
┌────────────────────────────────────────────────────────────────┐
│  ① Multi-view Semantic Grounding                               │
│    Item title / attrs / image / co-purchase                    │
│              │                                                 │
│              ▼                                                 │
│      Unified Latent Space（语义 + 协同 双信号）                │
│              │                                                 │
│              ▼                                                 │
│  ② Hybrid Item Tokenization                                    │
│      ┌─────────────────────────┬──────────────────┐            │
│      │ SID prefix (语义结构)   │ unique ID (定位) │            │
│      └─────────────────────────┴──────────────────┘            │
│              │                                                 │
│              ▼                                                 │
│  ③ Instruction-tuned Generative LLM                            │
│      • 多任务 SFT 数据 (推荐 / 搜索 / 扩散 / 跨域)              │
│              │                                                 │
│              ▼                                                 │
│  ④ Three-Step Generation + Adaptive Probabilistic Fusion       │
│      step-1: 生成 SID prefix（语义级粗筛）                     │
│      step-2: 生成 SID 子空间内细粒度 token                     │
│      step-3: 生成 unique ID（精确落地）                        │
│      + 自适应融合（按任务调精度/多样性）                       │
└────────────────────────────────────────────────────────────────┘
```

**关键结果。** [REF-086] abstract 给出的结论是定性的："Extensive offline experiments and online A/B tests demonstrate the effectiveness of SIGMA across various real-world recommendation tasks"——离线与线上 A/B 均验证有效。一些技术博客与公开信源进一步报告了具体 A/B 数字：**据技术博客报告，SIGMA 在 AliExpress 线上的订单量提升约 +2.80%、转化率提升约 +3.84%、GMV 提升约 +7.84%**。这些具体数字不在 abstract 字面之内，引用时需注明信源出自外部博客报告，而非论文 abstract 直接归因。

**局限性。** (1) **词表与解码复杂度**——hybrid tokenization 使解码状态机变复杂，工程实现成本高；(2) **多任务 SFT 数据构建成本**——大规模 instruction 语料需投入大量人工或弱监督生成；(3) **跨域迁移依赖统一 grounding**——若新场景的语义视角与原训练分布差距大，统一潜在空间的语义"通用性"会被削弱。

## 2.4.5　训练范式深化：SINGER 的 Full-Process SID Alignment

前三小节聚焦于"如何构造与对齐 ID"，但 SINGER [REF-087]（Kong 等，中科大/蚂蚁/新国大；据 OpenReview，投稿 ICLR 2026）把视角拉回**训练范式本身**——即在已经有 SID 体系的前提下，**LLM 究竟是怎样学习这套 SID 空间的？现行 SFT-then-RL 流水线存在哪些根本缺陷？**

**动机。** [REF-087] abstract 给出了一个尖锐的观察：尽管 SFT-then-RL 已成为生成式 LLM 推荐的主流范式，它在两个层面"fails to model the SID space adequately"——

1. **Superficial SID understanding（表层 SID 理解）**：据 Kong 等报告，"SFT often ends up memorising a closed SID vocabulary instead of learning its semantics"——SFT 训练让 LLM 记住"哪几位 SID 序列对应哪个物品"，而非真正理解 SID 各层所编码的语义。这意味着模型在新物品冷启动、长尾物品上的表现会迅速劣化。
2. **Coarse-grained rewards（粗粒度奖励）**：传统基于规则的 RL "treats all incorrect SIDs equally"——把"生成的 SID 与目标在第一位即不同"和"前 N-1 位都对、最后一位差"视作同样错误，**忽视了 SID 层级结构所蕴含的难度差异**。这导致 RL 阶段的训练信号噪声大、收敛慢。

**方法：两大组件。**

**(1) Full-Process SID Alignment。** SINGER 把 SID 对齐目标**同时嵌入到 SFT 与 RL 两个阶段**，而非只在 SFT 阶段做一次性的指令对齐。具体而言，SFT 阶段在标准 NTP 目标外加入针对 SID 层次结构的辅助对齐损失，让模型学习"第 $k$ 层 SID 对应的语义子类是什么"；RL 阶段则继续维持这一对齐压力，使其在策略优化过程中不被即时奖励"稀释"。

**(2) SID-Navigated Reinforcement Learning。** RL 阶段的核心创新是**层级感知奖励 + 前缀课程采样**：

- **SID-level rewards（层级奖励）**：据 Kong 等报告，"SID-level rewards grade each trajectory by the deepest correctly matched SID layer"——按照模型生成的 SID 序列与目标序列**最深正确匹配层**给奖励，能让 RL 区分"几乎对了（前 N-1 位都对）"与"完全错（第一位就错）"。
- **SID-prefix curriculum sampling（前缀课程采样）**：据 Kong 等报告，"SID-prefix curriculum sampling supplies partial prefixes as intermediate guidance for hard cases"——对模型当前难以独立预测的样本，先把目标 SID 的前若干位作为前缀提示喂入，再要求模型续写剩余位。这是一种**渐进引导**式的训练课程，随训练推进逐步缩短前缀长度，让模型在"半监督"到"完全自主"之间平滑过渡。

> **图 2-7　SINGER 的 Full-Process SID Alignment 训练流程**

```text
┌─────────────────────────────────────────────────────────────────┐
│                   阶段 1：SFT + SID 对齐                        │
│                                                                 │
│   User history → LLM → 预测 SID 序列                            │
│                       │                                         │
│                       ├──→ 标准 NTP 损失                        │
│                       │                                         │
│                       └──→ SID 层次对齐辅助损失（新增）         │
│                            （让模型学习每层 SID 的语义子类）    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   阶段 2：SID-Navigated RL                      │
│                                                                 │
│   采样策略：                                                    │
│     • Easy 样本：从空前缀开始生成                               │
│     • Hard 样本：给定 SID 前 k 位前缀 → 续写（课程采样）        │
│                       │                                         │
│                       ▼                                         │
│   生成轨迹 τ → 奖励计算                                         │
│                       │                                         │
│                       ├──→ SID-level reward                     │
│                       │    （按最深正确匹配层打分）             │
│                       │                                         │
│                       └──→ 对齐目标继续生效（与阶段 1 一致）    │
│                                                                 │
│   课程：训练推进 → 前缀长度逐步缩短 → 完全自主生成              │
└─────────────────────────────────────────────────────────────────┘
```

**关键结果。** 据 [REF-087] OpenReview abstract 原文，SINGER "consistently outperforms strong sequential, generative, and recent LLM-based baselines across standard metrics, confirming the value of combining hierarchical SID signals with the world knowledge of pretrained LLMs"。需要说明：该工作目前的状态是 Submitted to ICLR 2026，尚未最终接收，正文采用"据 Kong 等报告"的稳妥表述。

**局限性。** (1) **课程超参敏感性**——前缀长度衰减策略、衰减速度等需要逐数据集调整；(2) **依赖 SID 树形结构**——层级奖励的设计隐含了"SID 各层语义按层递进"的假设，对扁平/非严格层级的码本（如某些 product quantization 方案）适用性有限。

> **训练范式视角的补充：SIDReasoner [REF-084]。** §2.3.6 已介绍过 SIDReasoner 的两阶段框架。从 §2.4 视角再看一次会发现：其第一阶段"SID-language alignment via multi-task training on enriched SID-centered corpus"本质上也是一种**Full-Process Alignment 的变体**——不改变 SID 本身，而是通过在大规模 SID 中心化语料上的多任务训练，让 LLM 把 SID 锚定到丰富的语义与行为上下文。它与 SINGER 的差别在于：SINGER 关心 SID **层次结构**的理解，SIDReasoner 关心 SID **跨样本语义关系**的推理化。两者在工程上是正交且可组合的。

## 2.4.6　三条路线对比、本节小结与下一节衔接

**横向对比。** §2.4 走过的三条路线——LC-Rec / TCA4Rec / SIGMA——虽然都在做"LLM 增强标记"，但在 LLM 介入位置、协同信号来源、端到端程度上各有不同。下表汇总了本节代表方法的关键差异。

**表 2-5　基于 LLM 的标记增强方法横向对比**

| 方法 | 年份 / 出处 | LLM 基座 | 主 ID 类型 | 协同信号来源 | LLM 介入位置 | 端到端程度 | 工业部署 |
|---|---|---|---|---|---|---|---|
| **LC-Rec** [REF-013] | 2024 / ICDE | LLaMA-7B | learning-based VQ（uniform mapping）| 多任务对齐微调间接注入 | 微调阶段（fine-tuning） | 两阶段（VQ 冻结 → SFT） | 学术验证 |
| **TCA4Rec** [REF-085] | 2026 / WWW | decoder-based（兼容广谱）| 沿用上游 SID | 外部 CF 模型 logits → Collaborative Tokenizer | 优化目标（loss-level） | 两阶段（CF 模型预训练 + LLM 微调）| 学术验证（plug-and-play） |
| **SIGMA** [REF-086] | 2026 / SIGIR Industry | 内置生成式 LLM | hybrid（SID 前缀 + 唯一 ID） | 统一潜在空间联合捕获 | 表示层 + 词表层 + 生成层 | 近端到端（grounding + tokenization 联合）| **AliExpress 全量线上** |
| **SINGER** [REF-087] | 2026 / ICLR 投稿 | 通用预训练 LLM | 沿用上游 SID（要求层级结构） | 通过 SID 对齐间接获取 | 训练范式（SFT + RL 全程） | SFT + RL 双阶段，对齐目标贯穿 | 学术验证 |
| **SIDReasoner** [REF-084] | 2026 / arXiv | 通用预训练 LLM | 沿用上游 SID | SID-中心化语料 + RL | 训练范式（多任务 + 强化）| 两阶段（对齐 + 强化）| 学术验证 |

> **表 2-5 注释。** 列「LLM 介入位置」是本节核心区分维度——它直观刻画了 LLM 究竟在标记链路的哪一层发挥作用：LC-Rec 介入在微调任务设计、TCA4Rec 介入在损失函数、SIGMA 介入在整个表示-词表-生成链路、SINGER/SIDReasoner 介入在整体训练流程。这一维度也对应于学界对"LLM 在生成式推荐中扮演什么角色"的逐渐演化——从被动消费 ID 的下游模型，到主动参与 ID 设计与对齐的共建者。

> **图 2-6（汇总 三条路线架构对比）**

```text
        ┌─────── 路线 A：LC-Rec ───────┐
        │  外部 learning-based VQ      │
        │   ↓（冻结）                  │
        │  LLM 多任务对齐微调          │  ← 微调阶段介入
        └──────────────────────────────┘

        ┌─────── 路线 B：TCA4Rec ──────┐
        │  外部 CF 模型                │
        │   ↓ Collaborative Tokenizer  │
        │  LLM (Soft NTP 目标)         │  ← 优化目标介入
        │   ↑ KL 对齐 q_CF             │
        └──────────────────────────────┘

        ┌─────── 路线 C：SIGMA ────────┐
        │  统一 Grounding 潜在空间     │
        │   ↓ Hybrid Tokenization      │  ← 表示 + 词表层介入
        │  LLM 指令微调 + 三步生成     │
        │   + Adaptive Fusion          │
        └──────────────────────────────┘
```

**本节小结。** §2.4 用三条路线 + 一条训练范式视角共同回答了一个问题：**如何让 LLM 从"标记的消费者"转变为"标记体系的共建者"。**

第一，**LC-Rec 给出了路线 A 的范式**——以 learning-based VQ + uniform semantic mapping 解决 item indexing，以多任务对齐微调把语言与协同语义"绑定"到学到的 index 上；这是 LLM 增强标记的"第一推动力"。

第二，**TCA4Rec 把对齐推到优化层**——用 Collaborative Tokenizer 把 CF 的 item-level logits 投射到 LLM token 空间，再用 Soft Label Alignment 把 CF 软标签融入 NTP 目标，**实现协同信号与生成损失的梯度级直连**；其 plug-and-play 的设计使它能复用于已有的多种 LLM 推荐框架。

第三，**SIGMA 把全链路打通在一个工业级系统里**——统一潜在空间承担 grounding、hybrid tokenization 承担词表结构、多任务指令微调承担任务通用性、三步生成 + 自适应融合承担解码灵活性；在 AliExpress 大规模线上验证了"内置 LLM 标记体系"的工程可行性。

第四，**SINGER 给出了训练范式视角的修正**——SFT-then-RL 流水线本身存在缺陷，需要 Full-Process SID Alignment 解决表层记忆问题、SID-Navigated RL 解决粗粒度奖励问题；这一视角与 §2.4.2—§2.4.4 三条路线**正交**——任意一条路线只要使用 SFT+RL，就可受益于 SINGER 提出的训练范式改进。

> **最新进展（2024—2026）。** 综合 §2.4.2—§2.4.5 的工作，可以观察到三条值得关注的趋势：① **从两阶段走向端到端**——LC-Rec 仍是 VQ 冻结 + LLM 微调的两阶段范式，SIGMA 已把 grounding 与 tokenization 联合优化；这与 §2.3 PIT 在动态 tokenization 上的"端到端协同进化"形成呼应，表明**端到端是 2026 年这一领域的共同方向**。② **协同信号注入从"任务级"到"梯度级"**——LC-Rec 仍依赖对齐任务设计，TCA4Rec 已把 CF 信号直接进入损失函数；与 §2.5 即将展开的 SETRec 等"协同信号嵌入 ID 表示本身"的路线一起，构成"协同对齐"在不同位置的完整谱系。③ **训练范式逐渐被审视**——SINGER 与 SIDReasoner [REF-084] 共同提示：**单纯增加数据或模型参数无法替代对训练流程本身的精细化设计**——这正是 [REF-088] scaling 实证所揭示瓶颈的工程对应。

**与 §2.5 的衔接。** 本节展示了 LLM 如何在多个位置增强标记过程，但一个更根本的问题尚未系统解答——**纯语义编码的 SID 如何在标记体系内部、而非外挂 CF 信号或对齐任务，结构性地融入用户行为的协同信号？** TCA4Rec 已经在优化端给出了"软对齐"的解法，但它依赖外部 CF 模型；SIGMA 在 grounding 阶段把协同与语义并置，但内部机制并未完全公开。§2.5「协同信号注入语义 ID」将沿着这条线索继续向前——从 LETTER [REF-014] 的三组分损失到 SETRec 的序列编码，系统探讨协同信号在 ID 构造、表示与生成各环节的注入路径，为本章最终交代"基础设施层（Data）"如何为后续的模型层（Model）与任务层（Task）准备好可用的物品离散表示。
