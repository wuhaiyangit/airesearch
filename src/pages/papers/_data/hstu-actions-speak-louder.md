---
title: "Actions Speak Louder than Words: Trillion-Parameter Sequential Transducers for Generative Recommendations"
slug: "hstu-actions-speak-louder"
authors: "Jiaqi Zhai, Lucy Liao, Xing Liu, Yueming Wang, et al. (Meta)"
year: 2024
venue: "Meta / arXiv:2402.17152"
category: "生成式推荐"
abstract: "Meta提出HSTU（Hierarchical Sequential Transduction Units），将推荐系统重构为生成式序列转导问题，首次将推荐模型规模化到万亿参数，并在Instagram、Facebook等大规模线上场景取得显著业务提升。"
tags: ["HSTU", "生成式推荐", "Trillion-Parameter", "Meta", "Sequential Transducer"]
---

## 论文背景

传统推荐系统的"特征工程 + DLRM"范式在过去十年取得了巨大成功，但面临三大瓶颈：

1. **特征爆炸**：手工特征工程难以扩展，特征数量增长带来维护成本
2. **架构碎片化**：召回、粗排、精排各自独立，难以共享表征
3. **Scaling 失效**：DLRM 加大模型规模后效果迅速饱和，无法享受大模型时代的"Scaling Law 红利"

Meta 在 2024 年提出 HSTU，借鉴 LLM 的成功经验，将推荐重构为**生成式序列转导**问题，让推荐模型也能像 LLM 一样"越大越强"。

## 核心思想

### 把推荐当作序列建模

将用户的所有行为（点击、点赞、收藏、停留等）按时间顺序排列为一个统一的 token 序列：

```
[u, a₁, t₁, i₁, a₂, t₂, i₂, ..., aₙ, tₙ, iₙ]
```

其中：
- `u`：用户 token
- `aᵢ`：动作类型（点击/点赞/...）
- `tᵢ`：时间间隔
- `iᵢ`：物品 token

模型在该序列上进行自回归建模，预测下一个 `(action, item)`。

### HSTU 模块设计

HSTU 是对 Transformer 的针对性改进，核心创新：

| 组件 | 改进点 |
|------|-------|
| Attention | 用**逐点 SiLU** 替代 Softmax，避免数值不稳定，保留稀疏性 |
| 位置编码 | 引入**相对时间编码**（RAB），显式建模行为间的时间间隔 |
| 归一化 | 简化为 **LayerNorm-Free** 设计，提升训练效率 |
| 输出头 | 多目标共享 backbone，每个目标独立 head |

### 训练目标

联合优化两类目标：
- **Generative**：预测下一个 item（自回归）
- **Discriminative**：在多个候选中选择真实点击物品（对比）

## 实验结果

### Scaling Law

HSTU 首次在推荐系统上验证了 Scaling Law：

| 参数量 | 训练 FLOPs | NDCG@10 提升 |
|--------|-----------|-------------|
| 100M | 1× | baseline |
| 1B | 10× | +4.2% |
| 10B | 100× | +9.8% |
| 100B | 1000× | +14.5% |
| **1T** | **10000×** | **+20.1%** |

**结论**：模型规模每提升 10 倍，效果稳定提升约 4-5%，无饱和迹象。

### 线上效果

在 Meta 内部多个产品线 A/B 测试：

- **Instagram Reels**：Watch Time +12.4%，互动率 +8.2%
- **Facebook Feed**：CTR +6.5%，停留时长 +5.1%
- **Threads 推荐**：新用户留存 +4.7%

### 计算效率

- 相比传统 DLRM，HSTU 在相同效果下推理 **FLOPs 降低 65%**
- 借助稀疏 attention 和 KV Cache，端到端 P99 延迟 < 35ms

## 工程落地的关键

1. **统一序列表示**：废弃所有手工特征，所有信号都通过 token 序列表达
2. **行为级生成**：不仅生成下一个 item，还生成下一个 action，支持多任务复用
3. **超大批训练**：使用 8K-32K 全局 batch size，配合分布式训练框架
4. **物品 ID 编码**：层次化语义 ID（Semantic ID）替代离散 ID，支持冷启动

## 影响与意义

HSTU 是推荐系统进入 **Foundation Model 时代** 的标志性工作：

- 证明了"推荐 = 序列建模"范式的可行性和优越性
- 为后续 OneRec、TIGER、Generative Retrieval 等工作奠定基础
- 推动了"统一推荐基座模型"的研究热潮

> 这篇论文的真正价值不在于具体技术细节，而在于范式的转变——从"特征工程"到"端到端序列生成"。

## 相关工作

- **TIGER**（Google, NeurIPS 2023）：生成式检索 + Semantic ID
- **OneRec**（Alibaba, 2025）：召回-排序-重排统一生成式建模
- **GenRec**（早期工作）：基于 GPT 的简单推荐生成

## 论文链接

- arXiv: [2402.17152](https://arxiv.org/abs/2402.17152)
- 官方博客: [Meta AI Research](https://ai.meta.com/research/)
