---
title: "LLaMA 3: Open Foundation Models"
slug: "llama-3-foundation"
authors: "Meta AI Team"
year: 2024
venue: "Meta"
category: "大语言模型"
abstract: "Meta 开源的 LLaMA 3 系列（8B / 70B / 405B），在训练数据、架构细节、对齐流程等方面全面升级，405B 版本在多项 benchmark 上接近 GPT-4 水平，成为开源 LLM 的新标杆。"
tags: ["LLaMA 3", "开源大模型", "Meta", "Foundation Model"]
---

## 论文背景

LLaMA 系列是 Meta 主导的开源大语言模型项目，目标是让学术界和工业界都能用上 SOTA 级别的开源模型。LLaMA 3 是该系列的第三代，于 2024 年发布。

## 模型规模

| 版本 | 参数量 | 上下文长度 | 训练 Tokens |
|------|--------|----------|------------|
| LLaMA 3 8B | 8B | 8K → 128K | 15T |
| LLaMA 3 70B | 70B | 8K → 128K | 15T |
| LLaMA 3.1 405B | 405B | 128K | 15.6T |

405B 版本是迄今为止最大的开源稠密模型。

## 关键技术点

### 数据规模与质量

- 训练数据从 LLaMA 2 的 2T tokens 扩大到 **15T tokens**
- 引入大量**合成数据**，用 LLaMA 2 自动生成代码、数学等领域的高质量样本
- 严格的**数据清洗 pipeline**：去重、毒性过滤、PII 移除

### 架构改进

- 沿用**纯 Decoder Transformer**架构
- 升级到 **GQA（Grouped Query Attention）**，所有规格统一使用
- Tokenizer 词表从 32K 扩大到 **128K**，提升多语言效率
- 长上下文：通过持续预训练扩展到 128K

### 对齐流程

```
预训练 → SFT → DPO → 拒绝采样 → 多轮迭代
                ↑                    ↓
                └────── 数据闭环 ─────┘
```

抛弃了复杂的 PPO，全程使用 **DPO**，配合**拒绝采样**反复迭代，简单而有效。

### 推理优化

- 405B 版本支持 **FP8 推理**，单机 8×H100 即可运行
- 使用 **PagedAttention + Continuous Batching** 服务
- 量化版（GGUF/AWQ）可在消费级 GPU 运行

## Benchmark 表现

LLaMA 3.1 405B vs 闭源模型：

| 数据集 | LLaMA 3.1 405B | GPT-4o | Claude 3.5 Sonnet |
|--------|---------------|--------|-------------------|
| MMLU | 87.3 | 88.7 | 88.3 |
| HumanEval | 89.0 | 90.2 | 92.0 |
| MATH | 73.8 | 76.6 | 71.1 |
| GSM8K | 96.8 | 96.1 | 96.4 |

**核心结论**：405B 版本在多数任务上**追平甚至超过 GPT-4 级别闭源模型**。

## 开源生态影响

- 累计下载量超 **3 亿次**（截至 2024 年底）
- 衍生模型超过 **30000 个**（HuggingFace 上）
- 推动了 RAG、Agent、垂直领域微调等下游应用的繁荣

## 局限与挑战

- 405B 推理成本仍然高，难以普及到端侧
- 多模态能力相对落后（需要 LLaMA 3.2 才补齐）
- 对齐策略相对保守，部分场景下"过于谨慎"

## 论文链接

- 技术报告: [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)
- 模型权重: [Hugging Face](https://huggingface.co/meta-llama)
