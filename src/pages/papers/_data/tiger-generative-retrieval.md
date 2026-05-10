---
title: "TIGER: Generative Retrieval Meets Recommender Systems"
slug: "tiger-generative-retrieval"
authors: "Shashank Rajput, Nikhil Mehta, Anima Singh, et al. (Google Research)"
year: 2023
venue: "NeurIPS 2023"
category: "生成式推荐"
abstract: "TIGER 首次将生成式检索（Generative Retrieval）引入推荐系统，提出 Semantic ID 概念，让推荐模型直接生成目标物品的语义编码，统一了召回与生成的范式。"
tags: ["TIGER", "Semantic ID", "Generative Retrieval", "Google", "NeurIPS"]
---

## 核心问题

传统推荐召回的痛点：

- 物品 ID 是**完全离散**的整数，没有语义信息，新物品难以泛化
- 双塔模型需要维护 ANN 索引，更新成本高
- 召回阶段无法利用 LLM 的生成能力

TIGER 提出：**能不能让模型像 LLM 生成 token 一样，直接生成物品 ID？**

## Semantic ID：核心创新

### 离散 ID 的问题

物品 ID `12345` 与 `12346` 在数值上接近，但语义可能完全不同。这种"无语义"编码导致：
- 模型必须为每个物品独立学习 embedding
- 长尾物品训练样本少，效果差
- 新物品无 embedding，无法被检索

### Semantic ID 设计

TIGER 用 **RQ-VAE（Residual Quantized VAE）** 把每个物品编码为 4 个层次化 codebook 索引：

```
Item embedding (768-dim)
    ↓ RQ-VAE 第1层量化
[c₁ (256选1)]
    ↓ 残差 → 第2层量化
[c₁, c₂ (256选1)]
    ↓ 残差 → 第3层量化
[c₁, c₂, c₃, c₄]  ← 最终 Semantic ID
```

每个物品被表示为 4 个 token 的序列，**前缀共享 = 语义相近**：

| Item ID | Semantic ID |
|---------|-------------|
| iPhone 15 | (12, 45, 89, 7) |
| iPhone 15 Pro | (12, 45, 89, 23) |
| Galaxy S24 | (12, 45, 102, 11) |
| 一本小说 | (203, 88, 17, 91) |

前两个 token 相同的物品语义接近——这就是 Semantic ID 的魔力。

## TIGER 整体架构

### 训练阶段

1. **物品编码**：用 BERT/T5 把每个物品的文本特征编码为 dense embedding
2. **RQ-VAE 训练**：在所有物品 embedding 上训练 RQ-VAE，得到 Semantic ID
3. **序列模型训练**：把用户历史序列 [item₁, item₂, ..., itemₙ] 转为 Semantic ID 序列，用 Transformer 自回归预测下一个 4-token

### 推理阶段

```
用户行为序列 → Semantic ID 序列 → Transformer 解码
                                      ↓ (Beam Search)
                              Top-K 个 4-token 序列
                                      ↓ (查表)
                                 Top-K 推荐物品
```

## 实验结果

在 Amazon Beauty / Sports / Toys 三个数据集上：

| 模型 | Recall@5 | NDCG@5 |
|------|---------|--------|
| SASRec | 0.0387 | 0.0249 |
| BERT4Rec | 0.0364 | 0.0233 |
| S³-Rec | 0.0387 | 0.0244 |
| **TIGER** | **0.0454** | **0.0321** |

**关键收益**：
- 平均 Recall 提升 **17%**
- 在长尾/新物品上提升尤其显著（**+30%+**）
- 模型大小相比双塔 **减少 60%**

## 解决了什么

| 传统问题 | TIGER 方案 |
|---------|-----------|
| 物品 ID 无语义 | Semantic ID 携带层次化语义 |
| 新物品冷启动 | 共享前缀的 codebook 实现零样本泛化 |
| ANN 索引维护 | 直接生成，无需索引 |
| 召回-排序割裂 | 生成式范式天然统一 |

## 局限与后续工作

**局限**：
- RQ-VAE 训练依赖高质量物品 embedding
- 解码延迟随 codebook 数量增加
- 对超大物品库（数十亿）的扩展性仍待验证

**后续影响**：
- 启发了 HSTU、OneRec 等生成式推荐工作
- Semantic ID 已成为生成式推荐的标准组件
- Google 内部多个产品已基于 TIGER 思路落地

## 论文链接

- arXiv: [2305.05065](https://arxiv.org/abs/2305.05065)
- NeurIPS 2023: [proceedings](https://papers.nips.cc/)
