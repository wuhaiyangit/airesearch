---
title: "Transformer架构的演进与优化"
author: "AI技术专家"
date: "2026-05-10"
column: "LLM技术专栏"
summary: "从原始Transformer到现代变体的技术演进路径分析，梳理注意力机制、位置编码、归一化策略等核心组件的改进历程。"
tags: ["Transformer", "架构优化", "注意力机制"]
---

## 引言

自2017年"Attention is All You Need"论文发表以来，Transformer架构已成为NLP乃至整个AI领域的基础设施。本文梳理Transformer从诞生到现代大模型的演进脉络。

## 原始Transformer（2017）

原始Transformer的核心组件：

- **多头自注意力**（Multi-Head Self-Attention）
- **前馈网络**（Feed-Forward Network）
- **残差连接 + Layer Normalization**
- **正弦位置编码**

计算复杂度：$O(n^2 \cdot d)$，其中 $n$ 为序列长度，$d$ 为模型维度。

## BERT时代（2018-2019）

BERT将Transformer用于双向语言模型预训练，引入了：

- **MLM（Masked Language Modeling）**：随机遮盖15%的token进行预测
- **NSP（Next Sentence Prediction）**：判断两个句子是否相邻

BERT的成功证明了大规模预训练 + 微调范式的有效性。

## GPT系列演进

| 版本 | 参数量 | 关键创新 |
|------|--------|---------|
| GPT-1 | 117M | 单向预训练 |
| GPT-2 | 1.5B | 零样本学习 |
| GPT-3 | 175B | 少样本学习（In-Context Learning） |
| GPT-4 | ~1T | 多模态、RLHF对齐 |

## 现代LLM的架构改进

### Pre-Norm vs Post-Norm

原始Transformer使用Post-Norm（残差后归一化），现代LLM普遍改用Pre-Norm：

```
Post-Norm: x = LayerNorm(x + Sublayer(x))
Pre-Norm:  x = x + Sublayer(LayerNorm(x))
```

Pre-Norm训练更稳定，但表达能力略弱。

### RoPE位置编码

旋转位置编码（Rotary Position Embedding）通过旋转矩阵将位置信息注入注意力计算：

$$q_m \cdot k_n = \text{Re}[(W_q x_m) \odot e^{im\theta}] \cdot \text{Re}[(W_k x_n) \odot e^{in\theta}]$$

优势：支持外推到训练时未见过的序列长度。

### GQA（分组查询注意力）

为降低KV Cache显存占用，将多个Query头共享同一组Key-Value头：

- **MHA**：每个头独立的Q、K、V
- **MQA**：所有头共享一组K、V
- **GQA**：G组头共享一组K、V（折中方案）

LLaMA-2、Mistral等现代模型均采用GQA。

## 未来方向

1. **线性注意力**：将复杂度从 $O(n^2)$ 降至 $O(n)$
2. **稀疏注意力**：只计算局部或重要的注意力权重
3. **状态空间模型**（SSM）：Mamba等架构挑战Transformer的主导地位
