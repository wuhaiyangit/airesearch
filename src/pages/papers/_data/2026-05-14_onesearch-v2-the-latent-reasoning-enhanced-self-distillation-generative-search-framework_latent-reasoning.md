---
原文件: "OneSearchV2.pdf"
title: "OneSearch-V2: The Latent Reasoning Enhanced Self-distillation Generative Search Framework"
authors: "Ben Chen, Siyuan Wang, Yufei Ma, Zihan Liang, Xuxin Zhang, Yue Lv, Ying Yang, Huangyu Dai, Lingtao Mao, Tong Zhao, Zhipeng Qian, Xinyu Sun, Zhixin Zhai, Yang Zhao, Bochao Liu, Jingshan Lv, Xiao Liang, Hui Kong, Jing Chen, Han Li, Chenyi Lei, Wenwu Ou, Kun Gai"
affiliation: "Kuaishou Technology, Beijing, China"
year: "2026"
venue: "arXiv preprint"
category: "生成式推荐"
abstract: "快手推出OneSearch-V2，通过思维增强的复杂查询理解、潜推理自蒸馏管道与基于用户真实行为反馈的偏好对齐，解决了一代生成式搜索面临的意图理解不足和奖励劫持问题，并取得显著线上收益。"
tags: ["生成式推荐", "潜推理", "自蒸馏", "生成式搜索"]
Hash: "230ef4a9f4ca16a7"
RecRatio: "9"
Team: "快手搜索团队"
Reason: "生成式搜索落地后的前沿演进方案，将潜推理与真实奖励机制融合，解决了长尾/复杂查询理解的关键问题，具有极高参考价值。"
精读日期: "2026-05-14"
报告字数: "约 2600 字"
---

## 1. 摘要与核心贡献

- **研究问题**：尽管第一代端到端生成式搜索系统（如OneSearch-V1）取得了巨大成功，但其仍面临三个核心局限：对复杂长尾查询理解不足、对用户潜在深层意图挖掘不深、以及容易对狭窄的历史偏好产生过拟合（Reward Hacking）。
- **动机**：显式的 Chain-of-Thought (CoT) 虽能增强推理，但过长的 Token 生成会导致线上延迟过高；另外，传统通过单独训练的 Reward Model 进行排序学习容易导致分布偏差，限制了长尾性能。
- **方法概要**：提出 OneSearch-V2，一种潜推理增强的自蒸馏生成式搜索框架。它包含三个核心创新：(1) 思维增强的复杂查询理解模块，将 CoT 浓缩为基于关键词的信息；(2) 推理内化的自蒸馏训练管道，利用隐式上下文学习将推理能力注入模型参数；(3) 行为偏好对齐优化系统，通过位置感知的奖励设计直接对齐真实用户反馈。
- **主要结果**：在线 A/B 测试中表现出卓越的商业有效性：Item CTR $+3.98\%$、PV CTR $+1.17\%$、买家转化率 $+2.90\%$，订单量 $+2.11\%$，甚至 GMV 提升 $+3.45\%$。且无需增加线上推理成本。
- **核心贡献**：
  - 提出提取 Keyword-based CoTs 的机制，解决查询意图的多样化与模糊性。
  - 首创应用于生成式推荐的 Reasoning-internalized Self-distillation（自蒸馏）范式，在不增加模型架构和 Token 的前提下使小模型获得大模型的潜推理能力。
  - 提出了基于前缀门控和层次优势机制的 TPMA-GRPO 强化学习算法，精细分配 Semantic ID (SID) 序列的生成优势。

## 2. 业界进展与相关工作

- **领域发展脉络**：从基于多阶段双塔的排序向端到端基于 SID 的生成式检索（GR）演进，近年来业内致力于将大模型的推理能力结合到推荐与搜索中。
- **主要技术路线对比**：
  - **显式 CoT 增强**：直接利用 LLM 的语言能力输出推理步骤，然后输出 Item。面临严重的时延痛点。
  - **Latent Reasoning（潜推理）**：例如 Coconut、CODI 等工作，通过连续思维向量或者添加隐藏态 Token 来模拟思考过程，但改变了原有的模型结构，增加部署难度。
  - **Information-Asymmetric Self-Distillation**：利用教师和学生接受信息不对称进行知识蒸馏（如 SDFT）。OneSearch-V2 扩展了这一范式到生成式检索场景。
- **最相关的前序工作**：
  - **OneSearch-V1 (Kuaishou)**：本文的前置版本，构建了基于 KHQE 量化、Mu-Seq 和 Reward Model 的基础生成式电商搜索。V2 突破了 V1 仅基于历史共现匹配的缺陷。
  - **OneRec-V2 (Kuaishou)**：推荐场景中利用 Gradient-Bounded Policy Optimization (GBPO) 缓解 Reward Model 偏差。V2 搜索版在此基础上设计了更复杂的基于层级位置梯度的 TPMA-GRPO。
- **本文的定位**：探索如何在严格的时延限制下，为大规模在线生成式推荐/搜索模型注入深度的个性化逻辑推理能力，并且用真实业务指标作为直接反馈。

## 3. 详细技术方案

### 3.1 整体框架

OneSearch-V2 在 V1 的 Encoder-Decoder 结构基础上没有增加任何推理侧结构，而是通过训练侧的重构实现进化。它首先探讨了 Tokenization 策略，证明了**单模态（提取文本特征和核心词）比多模态（融合视觉特征等）在强相关性约束的搜索场景更为有效和鲁棒**。

### 3.2 关键模块详解

#### 3.2.1 思维增强的复杂查询理解 (Thought-Augmented Query Understanding)
- **作用**：通过大模型显式的推理提取高密度关键词，辅助模型理解如"情人节给女友送什么"这类模糊查询。
- **技术细节**：
  - **Keyword-based CoT 提取**：离线利用大模型执行 3 步 Pipeline：1) Query分析（识别品类、意图、属性）；2) 关键字提取（清洗同义词并按流行度排序）；3) 偏好校验（注入用户画像和近期行为）。
  - **离线增强与 RAG**：将提取的 `keywords` 作为增强信息放入 Encoder，形成完整的 $\langle query, user, CoT \rangle$ 语料。

#### 3.2.2 推理内化的自蒸馏管道 (Reasoning-Internalized Self-Distillation)
- **作用**：在不增加在线时延的前提下，让模型拥有类似于看到了 `keywords` 后才能做出的准确推理能力。
- **技术细节**：
  - **信息不对称蒸馏**：教师模型和学生模型共享相同参数（共用一套权重，节约显存），但教师输入的上下文包含提取的 Keyword-based CoTs，而学生输入不包含。
    $$
    x^{(T)} = (\text{uid}, q, \text{SID}_q, \text{Seq}_q, \text{Seq}_{\text{short}}, \text{Seq}_{\text{long}}, \text{kw})
    $$
    $$
    x^{(S)} = (\text{uid}, q, \text{SID}_q, \text{Seq}_q, \text{Seq}_{\text{short}}, \text{Seq}_{\text{long}})
    $$
  - 学生试图最小化输出分布与教师输出分布的 KL 散度（$\mathcal{L}_{KL}$）。
  - **缓解表示不稳定性 (R-Drop & FGM)**：由于学生缺乏关键词指引，面对模糊 Query 时内部表示极易产生扰动。
    - 引入 **R-Drop**，让学生模型同个输入两次 Dropout 输出做一致性约束；
    - 引入 **FGM** (Fast Gradient Method) 对 Embedding 空间添加对抗扰动，防止决策边界过窄。

#### 3.2.3 行为偏好对齐优化系统 (Behavior Feedback Preference Alignment)
- **作用**：摒弃单独训练、存在采样偏差的 Reward Model，直接利用真实用户反馈驱动 GRPO 强化学习。
- **技术细节**：
  - **复合奖励 (Composite Reward)**：整合相关性奖励 ($R_{\text{Rel}}$)、平滑处理的转化率 ($R_{\text{CTR}}$) 以及点击/订单直接奖励 ($R_{\text{C\&O}}$)。
  - **Token-Position Marginal Advantage (TPMA-GRPO)**：标准 GRPO 给序列中每个 Token 赋予同样的 Advantage。但 SID 是层级结构的（前面代表大类，后面代表具体商品），一旦前面错了后面再对也没用。
    - **位置边缘收益**：在层级生成的第 $l$ 个 Token 处，比较其与真实 Target 的匹配程度，分配独有的 Advantage $\hat{A}_{i, l}$。
    - **前缀门控 (Prefix Gate)**：若序列前面的 Token 完全错误，则前缀门控 $g_{i, l}$ 将置为 $0$，截断其梯度流；若前面匹配，则开放后续细粒度 Token 的梯度。这构建了一种自然的分层 Curriculum 学习机制。

## 4. 实验设计与结果分析

### 4.1 实验设置
- **数据集**：快手平台真实的点击/订单日志。
- **基线方法**：OneSearch-V1、不同规模的对比（是否含 RAG、是否含直接 CoT 等）。

### 4.2 主实验结果
实验证明，在包含头部与长尾的各类查询上，通过自蒸馏和增强训练的 OneSearch-V2 在离线召回（HR@10）和排序（MRR@10）指标上均大幅领先于 V1。特别是当强制要求模型在线输出完整 CoT 时，由于长度增加和结构异构，模型表现急剧崩塌（HR 从 $0.2231$ 降至 $0.1013$），证明了潜推理（自蒸馏）路线在此场景下的唯一可行性。

### 4.3 消融实验
- **单模态 vs 多模态 Tokenization**：在同样的 SID 量化机制下，仅输入商品 Text Title 及其核心关键词构建的 Unimodal 方案（如 bge-base + kw），在 HR@10 上达到 $0.2542$，远高于使用多模态大模型（如 Qwen3-VL 提取视觉特征）的 $0.2389$。这证实了针对搜索相关性，单模态去噪优于多模态杂糅。
- **RAG 与自蒸馏对比**：如果离线推理时加入 RAG（Keyword），HR@10 达到最高；而利用自蒸馏（无 RAG 输入但要求模型匹配 RAG 的输出概率），可以在无 RAG 延迟开销的情况下，极大地逼近上限效果。

### 4.4 其他分析
- **线上A/B测试**：完全替换后，Item CTR $+3.98\%$，买家转化率 $+2.90\%$，订单 $+2.11\%$，GMV $+3.45\%$。
- **用户体验评估**：人工介入进行盲测评分，页面优质率提升 $1.65\%$，Query-Item 相关性提升 $1.37\%$。且长尾词的收益远高于头部词，缓解了搜索领域常见的信息茧房效应。

## 5. 关键结论与 Takeaway

- **论文自身宣称的贡献**：通过提出自蒸馏潜推理架构和直接奖励 GRPO 机制，成功将大模型的高维推理能力以参数内化的形式注入轻量级检索模型中，效果与宣称的创新高度契合。
- **最有价值的 3–5 个 Takeaway**：
  1. **多模态不一定在搜索中好用**：由于视觉特征中存在无关冗余（衣服背景、扣子位置），多模态表示反而会冲淡品类、品牌等核心维度的注意力，单模态纯文本加关键词提取对电商生成式检索更鲁棒（高可信）。
  2. **信息不对称蒸馏（Information-Asymmetric Self-Distillation）**：这是一种极具潜力的范式，允许同一网络在"教师可见答案线索，学生盲猜"的情况下，通过分布 KL 对齐，强行逼迫学生模型"学会推理"，值得在一切时延敏感场景应用（高可信）。
  3. **分层序列应采用位置感知 Advantage**：在处理具备树状层级结构的 Token（如 RQ-VAE 生成的 SID）时，标准 RL (PPO/GRPO) 的序列级 Reward 会导致学不准。使用 Prefix Gate 截断梯度是优化层级生成的关键技巧（极高可信）。

## 6. 局限性与开放问题

- **方法局限**：自蒸馏严重依赖大模型（LLM）离线抽取的 Keyword-based CoT 质量。若离线 LLM 对某些冷门垂类的领域知识出现幻觉，这些错误将被硬性蒸馏进主模型。
- **工业落地挑战**：虽然推理未增加时延，但在训练期间需要同时维护拥有不同输入上下文的 Teacher 和 Student Forward Pass，不仅显存翻倍（如果梯度不完全复用），还增加了大量 KL 散度和对抗样本计算，这极大地拖慢了流式训练的迭代速度。
- **开放问题**：如何针对冷启动新商品建立更快速的在线推理绑定？如何在不大幅增加训练成本的前提下，利用在线实时反馈进行教师知识的在线进化？

## 7. 应用价值分析

- **技术可借鉴性**：本文的 TPMA-GRPO（带前缀截断梯度的层级 GRPO）非常具备实战价值，任何涉及分层或固定结构输出的生成任务（不仅是推荐，包括生成结构化代码或 JSON）都可参考该 RL 策略。
- **适用场景**：对在线时延要求极度苛刻、且离线算力资源充沛的大型搜索推荐系统。
- **改造建议**：引入自蒸馏训练前，需先搭建稳定可靠的离线 LLM 标注流水线，确保抽取的 Keyword 噪声极小；上线前需通过 R-Drop 确保 Embedding 空间的平滑性。
- **ROI 评估**：**高**。核心贡献在于"0 在线额外成本"换取能力升维，对工程团队而言，在不更改推理引擎的情况下拿到 $3\%$ 以上 GMV 提升，具有致命的吸引力。

## 8. 关键引用与延伸阅读

- *Coconut: Training Large Language Models to Reason in a Continuous Latent Space*, 2024.
  - 启发了隐式推理（Latent Reasoning）方向的重磅前序工作。
- *DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (OPSD)*, 2024.
  - 提供了 Information-Asymmetric Self-Distillation 在数学领域的理论和实践基础。
- *OneSearch: A Preliminary Exploration of the Unified End-to-End Generative Framework for E-commerce Search*, Chen et al., 2025.
  - 本文的前置系统，介绍了 KHQE 编码与基本的生成式搜索架构。
