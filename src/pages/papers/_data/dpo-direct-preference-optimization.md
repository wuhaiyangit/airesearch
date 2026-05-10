---
title: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model"
slug: "dpo-direct-preference-optimization"
authors: "Rafael Rafailov, Archit Sharma, et al. (Stanford)"
year: 2023
venue: "NeurIPS 2023 (Outstanding Paper)"
category: "大语言模型"
abstract: "DPO 提出一种无需显式 Reward Model 和 PPO 的偏好对齐方法，直接用偏好数据优化语言模型参数。简单、稳定、效果不输 RLHF，迅速成为 LLM 对齐的事实标准。"
tags: ["DPO", "RLHF", "Alignment", "Stanford", "NeurIPS"]
---

## 研究动机

传统 RLHF 流程复杂：

```
1. SFT 微调 → 2. 训练 Reward Model → 3. PPO 强化学习
                                        ↑
                                   不稳定、超参敏感
                                   显存占用大（需要4个模型同时存活）
```

PPO 训练时需要：
- **Policy Model**（被优化的 LLM）
- **Reference Model**（冻结的初始 LLM，用于 KL 约束）
- **Reward Model**（偏好打分器）
- **Value Model**（估计价值函数）

四个模型同时占显存，且 PPO 本身对超参极其敏感，工程实践极为痛苦。

## DPO 核心洞察

**关键观察**：在 RLHF 的最优解处，最优策略 π* 与 reward 函数 r 之间存在闭式关系：

$$r(x, y) = \beta \log \frac{\pi^*(y|x)}{\pi_{\text{ref}}(y|x)} + \beta \log Z(x)$$

**这意味着什么？** 我们可以把"reward"用"策略概率比"来表达，**直接跳过显式 reward model**。

## DPO 损失函数

把上式代入 Bradley-Terry 偏好模型，得到 DPO 的极简损失：

$$\mathcal{L}_{\text{DPO}} = -\mathbb{E}\left[\log \sigma\left(\beta \log \frac{\pi_\theta(y_w|x)}{\pi_{\text{ref}}(y_w|x)} - \beta \log \frac{\pi_\theta(y_l|x)}{\pi_{\text{ref}}(y_l|x)}\right)\right]$$

其中：
- $y_w$ = 偏好的（winner）回复
- $y_l$ = 不偏好的（loser）回复
- $\beta$ = 温度系数（通常 0.1-0.5）

**直观理解**：让模型对 $y_w$ 的概率相对 reference 上升，对 $y_l$ 下降。

## 实现简单到惊人

PPO 的训练循环动辄上千行代码，DPO 只需要几行：

```python
# 一次前向 + 反向，无需采样、无需价值估计
chosen_logps = model.log_prob(chosen)
rejected_logps = model.log_prob(rejected)
ref_chosen_logps = ref_model.log_prob(chosen)  # 冻结
ref_rejected_logps = ref_model.log_prob(rejected)

logits = beta * ((chosen_logps - ref_chosen_logps) -
                 (rejected_logps - ref_rejected_logps))
loss = -F.logsigmoid(logits).mean()
loss.backward()
```

## 实验结果

### 摘要任务（Reddit TL;DR）

| 方法 | Win Rate vs SFT |
|------|-----------------|
| SFT | 50% |
| PPO | 64% |
| **DPO** | **66%** |

### 对话任务（Anthropic HH）

DPO 在 Helpful + Harmless 综合评分上**追平甚至超过** PPO。

### 训练效率

- 显存占用 **降低 50%**（无需 Value Model + Reward Model）
- 训练速度 **提升 3-5×**
- 超参鲁棒性大幅改善

## 后续影响

DPO 改变了 LLM 对齐的工程范式：

- **LLaMA 3** 全程使用 DPO，不再训 PPO
- **Mistral**、**Qwen**、**DeepSeek** 等开源模型纷纷转向 DPO
- 衍生出 **IPO**、**KTO**、**SimPO**、**ORPO** 等改进版

## 局限性

- 对**离线偏好数据**质量要求高
- 在某些任务上仍略弱于精心调优的 PPO
- 容易出现"过度优化"（policy 偏离 reference 过远）

## 实践建议

1. **β 取值**：通常 0.1-0.3，越小越激进
2. **数据质量** > 数据数量：5K 高质量偏好对 > 50K 噪声对
3. **结合 SFT**：先 SFT 再 DPO，效果稳定
4. **多轮迭代**：DPO 可与拒绝采样结合，反复迭代提升效果

## 论文链接

- arXiv: [2305.18290](https://arxiv.org/abs/2305.18290)
- 代码: [TRL 库已集成](https://github.com/huggingface/trl)
