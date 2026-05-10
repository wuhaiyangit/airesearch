---
title: "Scaling Laws for Large Language Models"
authors: "OpenAI Research"
year: "2024"
category: "模型Scaling UP"
abstract: "系统性地研究了语言模型规模扩展的规律，发现模型性能与参数量、数据量、计算量之间存在幂律关系，为模型设计提供了理论指导。"
tags: ["Scaling Laws", "大语言模型", "训练优化", "OpenAI"]
---

## 核心发现

这篇论文是LLM领域最重要的基础性工作之一，揭示了语言模型性能与规模之间的定量关系。

### 幂律关系

研究发现，模型的测试损失 $L$ 与以下因素呈幂律关系：

$$L(N) \propto N^{-\alpha_N}$$
$$L(D) \propto D^{-\alpha_D}$$
$$L(C) \propto C^{-\alpha_C}$$

其中：
- $N$：模型参数量
- $D$：训练数据量（token数）
- $C$：总计算量（FLOPs）

实验测得的幂律指数约为：$\alpha_N \approx 0.076$，$\alpha_D \approx 0.095$，$\alpha_C \approx 0.050$

## 最优计算分配

给定固定的计算预算 $C$，如何在模型大小 $N$ 和数据量 $D$ 之间分配？

### Chinchilla法则

后续的Chinchilla论文（DeepMind, 2022）修正了原始Scaling Laws的结论：

> **最优分配**：参数量 $N$ 和训练token数 $D$ 应该等比例增长，即 $D \approx 20N$

这意味着：
- GPT-3（175B参数）应该在约3.5T tokens上训练
- 而实际上GPT-3只在300B tokens上训练，属于"训练不足"

## 对模型设计的指导意义

### 计算最优训练

| 模型 | 参数量 | 训练Tokens | 是否计算最优 |
|------|--------|-----------|------------|
| GPT-3 | 175B | 300B | ❌ 训练不足 |
| Chinchilla | 70B | 1.4T | ✅ 计算最优 |
| LLaMA-2 | 70B | 2T | ✅ 超计算最优 |

### 推理效率考量

Scaling Laws主要关注训练效率，但实际部署中推理成本同样重要。更小但训练更充分的模型（如Chinchilla）在推理时更具优势。

## 局限性

1. **任务特异性**：Scaling Laws在不同任务上的适用性存在差异
2. **数据质量**：仅考虑了数据量，未考虑数据质量的影响
3. **架构依赖**：不同架构的Scaling Laws可能不同
4. **涌现能力**：某些能力（如思维链推理）在特定规模阈值后才出现，不符合平滑幂律

## 后续影响

Scaling Laws的发现直接推动了：
- GPT-4、Claude、Gemini等超大规模模型的研发
- 数据工程的重视（高质量数据 > 大量低质量数据）
- 计算最优训练策略的广泛采用
