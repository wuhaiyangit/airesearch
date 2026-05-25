---
原文件: "GRAM.pdf"
title: "GRAM: A Generative Foundation Reward Model for Reward Generalization"
authors: "Chenglong Wang, Yang Gan, Yifu Huo, Yongyu Mu, Qiaozhi He, Murun Yang, Bei Li, Tong Xiao, Chunliang Zhang, Tongran Liu, Jingbo Zhu"
affiliation: "Northeastern University, Meituan Inc., NiuTrans Research, CAS"
year: "2025"
venue: "ICML 2025"
category: "大语言模型"
abstract: "提出GRAM生成式基础奖励模型，通过无监督预训练+有监督微调训练奖励模型，证明label smoothing等价于正则化pairwise ranking loss，统一生成式与判别式奖励模型"
tags: ["生成式奖励模型", "RLHF"]
Hash: "20d69b6d7be2bc71"
RecRatio: "7"
Team: "NEU + Meituan"
Reason: "ICML 2025论文，奖励模型的生成式视角有理论贡献，label smoothing与Bradley-Terry loss的统一很优雅"
精读日期: "2026-05-25"
---

## 1. 摘要与核心贡献

本文提出GRAM（Generative foundation Reward Model），一种利用无标注数据和有标注偏好数据联合训练的生成式基础奖励模型。核心动机在于：现有奖励模型训练完全依赖标注偏好数据，成本高且泛化能力有限。GRAM通过两阶段训练范式——先在无标注数据上预训练学习输入-响应对应关系，再在偏好数据上微调——构建可广泛适用于多种任务的基础奖励模型。

核心贡献包括：

1. **两阶段训练方法**：提出无监督预训练+有监督微调的奖励模型训练范式，利用大量无标注数据提升泛化能力
2. **Label Smoothing的理论统一**：证明在生成式奖励模型中使用label smoothing等价于优化正则化的Bradley-Terry loss，从而统一了生成式和判别式奖励模型的训练目标
3. **强泛化性能**：在RewardBench上，基于LLaMA-3.1-8B-Instruct的GRAM比vanilla判别式和生成式奖励模型分别提升11.0和5.1个百分点

## 2. 业界进展与相关工作

**奖励模型训练**：传统方法以Bradley-Terry loss训练判别式奖励模型，完全依赖标注偏好数据。近期工作包括大规模偏好数据集构建（UltraFeedback）、奖励模型集成（Coste et al., 2024）、以及LLM-as-a-Judge方法。但这些方法均忽视了大量无标注数据的潜力。

**生成式奖励模型**：Zhang et al. (2024)和Shiwen et al. (2024)将LLM直接用作奖励模型，通过预测偏好标签token实现评分。相比判别式模型，生成式模型在OOD数据上表现更优，具备更好的泛化能力。

**基础模型范式**：从BERT到GPT系列，在无标注数据上大规模预训练获得通用知识再适配下游任务的范式已被广泛验证。GRAM将这一思想首次系统性地引入奖励模型训练。

**DPO与对齐**：Rafailov et al. (2023)提出直接偏好优化，但仍需偏好数据。GRAM关注的是奖励模型本身的训练效率和泛化问题。

## 3. 详细技术方案

### 3.1 生成式奖励模型基础架构

生成式奖励模型将偏好判断建模为token预测任务。给定prompt $c$、输入 $x$、两个响应 $y_a, y_b$，模型预测下一个token $w$（'A'表示偏好$y_a$，'B'表示偏好$y_b$）。训练损失为：

$$\mathcal{L}_g = -\mathbb{E}_{(c,x,y_a,y_b)\sim D_r}[\log \pi_\phi(w=A|s)]$$

其中 $s = [c, x, y_a, y_b]$。评分时引入positional bias缓解机制：

$$r_\phi(x', y') = \frac{\pi_\phi(w=A|s') + \pi_\phi(w=B|s'_T)}{2}$$

其中 $s'_T$ 为交换响应顺序后的输入。

### 3.2 两阶段训练方法

**阶段一：无监督预训练**。训练LLM生成给定输入的响应对，学习输入-响应对应关系：

$$\mathcal{L}_{pre} = -\mathbb{E}_{(x,y_a,y_b)\sim D_u}[\log \pi_\phi([y_a, y_b]|x)]$$

此任务不需要偏好标注，可利用任意LLM生成的响应对进行训练。关键insight是：通过同时建模两个响应，模型可以获得响应比较的一般知识。

**阶段二：有监督微调**。在偏好数据上微调预训练模型，使其学会预测偏好方向。由于预训练已建立响应理解能力，微调所需数据量远少于从头训练。

### 3.3 Label Smoothing的理论统一

GRAM在微调阶段引入label smoothing，将正确标签的概率质量分散一部分给错误标签：

$$\mathcal{L}_{ls}(s) = -(1-\epsilon)\cdot\log\pi_\phi(w=A|s) - \epsilon\cdot\log\pi_\phi(w=B|s)$$

经过代数推导（利用Softmax层的logits $Z_a(s)$ 和 $Z_b(s)$），可以将其改写为：

$$\mathcal{L}_{ls}(s) = -\log\sigma(Z_a(s) - Z_b(s)) + \epsilon\cdot(Z_a(s) - Z_b(s))$$

第一项恰好是Bradley-Terry pairwise ranking loss，第二项是正则化项。这一结果优雅地统一了生成式和判别式奖励模型：两者本质上都在执行pairwise ranking，而label smoothing提供了隐式正则化防止过拟合。

### 3.4 应用场景

GRAM支持三种应用模式：(1) 响应排序（pair-wise和list-wise）；(2) 基于奖励的RLHF微调（PPO）；(3) 任务适配（少量数据微调GRAM）。对于list-wise排序，采用线性搜索或分治算法找到最优响应。

## 4. 实验设计与结果分析

### 4.1 实验设置

- 基座模型：LLaMA-3.1-8B-Instruct 和 LLaMA-3.2-3B-Instruct
- 预训练数据：Unified-Feedback 400k样本（不使用偏好标签）
- 微调数据：Unified-Feedback 400k样本（使用偏好标签）
- Label smoothing参数：$\epsilon = 0.1$
- 学习率：预训练阶段2e-5，微调阶段1e-5

### 4.2 Pair-wise响应排序结果

| 方法 | UNIFEED | RewardBench Avg. | HHH Avg. |
|------|---------|-----------------|-----------|
| Discriminative RM (8B) | 69.3 | 74.1 | 76.0 |
| Generative RM (8B) | 66.8 | 80.0 | 80.3 |
| GRAM (8B) | 70.4 | **85.1** | **85.4** |
| Discriminative RM (3B) | 68.3 | 72.8 | 76.1 |
| Generative RM (3B) | 65.3 | 78.8 | 77.2 |
| GRAM (3B) | **70.6** | **83.6** | **81.9** |

GRAM在OOD测试集上大幅领先，同时在ID测试集上也保持竞争力。

### 4.3 Best-of-N采样结果

在AlpacaEval2上进行BoN采样评估：判别式模型在proxy score上表现强但oracle score下降（over-optimization），而GRAM在两者上均表现最优，且有效缓解了KL散度超过3后的over-optimization问题。

### 4.4 任务适配与Scaling分析

任务适配实验显示，GRAM仅需3k标注数据即可达到接近92k全量数据训练的Oracle RM性能（75.6 vs. 77.8）。Scaling实验证明无标注数据量从0增加到600k，性能持续提升，尤其从0到200k阶段提升最显著。

| 无标注数据量 | RewardBench Acc (8B, 400k标注) |
|-------------|-------------------------------|
| 0k | ~80% |
| 200k | ~85% |
| 400k | ~87% |
| 600k | ~88% |

## 5. 关键结论与 Takeaway

1. **生成式模型天然更泛化**：判别式模型在ID数据上更强，但生成式模型在OOD数据上系统性胜出，因为建模两个响应的序列引入了更多noise/diversity
2. **Label smoothing在奖励模型中极其有效**：虽然在标准LLM训练中效果不显著甚至有害，但在奖励模型中是关键技术，本质上提供了正则化
3. **无标注数据的巨大价值**：无需偏好标注即可大幅提升奖励模型泛化能力，体现了基础模型范式在奖励建模中的有效性
4. **GRAM是实用的基础模型**：3k适配数据即可达到接近full-data Oracle的性能，大幅降低了奖励模型的应用门槛

## 6. 局限性与开放问题

1. **预训练数据域的影响**：实验显示域内预训练数据效果最好（GRAM w/ Domain: 74.7 vs. w/o Domain: 67.4），在实际应用中如何高效获取域相关无标注数据是开放问题
2. **计算开销**：生成式奖励模型需要建模完整的输入-响应对序列，推理开销大于判别式模型
3. **Scaling上限**：600k无标注数据后性能增长趋于平缓，更大规模数据的边际收益有待验证
4. **与reasoning RM的关系**：本文未探索与chain-of-thought reasoning reward model的结合
5. **多轮对话场景**：实验主要在单轮任务上进行，多轮场景的效果未验证

## 7. 应用价值分析

**对推荐系统的启示**：

1. **奖励模型在推荐中的潜力**：推荐系统中的排序学习本质上也是pairwise ranking，GRAM的label smoothing正则化思想可以迁移
2. **无监督预训练思路**：推荐场景中用户交互数据远多于标注数据，类似的"先学习item关系再学习偏好"的两阶段范式值得借鉴
3. **基础排序模型**：构建一个通用的"排序基础模型"，再在具体业务场景少量微调，有望降低推荐系统中奖励/排序模型的开发成本

**工程实践意义**：

- Label smoothing作为正则化手段简单有效，可直接应用于各类pairwise ranking loss
- 生成式模型的positional bias问题及其解决方案（交换顺序取平均）值得注意
- 3k数据即可适配新任务的特性，极大降低了新业务上线奖励模型的冷启动成本

## 8. 关键引用与延伸阅读

1. **Bradley & Terry (1952)** - Pairwise ranking的理论基础，GRAM证明label smoothing与之的等价性
2. **Rafailov et al. (2023)** - DPO，直接偏好优化的代表工作
3. **Zhang et al. (2024)** - 生成式奖励模型的先驱工作，验证了LLM做奖励模型的泛化优势
4. **Lambert et al. (2024)** - RewardBench评测基准
5. **Stiennon et al. (2020)** - Learning to summarize，RLHF的经典工作
6. **Cui et al. (2023)** - UltraFeedback大规模偏好数据集
7. **Chen et al. (2025)** - RM-R1，reasoning reward model
8. **Guo et al. (2025)** - DeepSeek-R1，大规模RL训练

延伸方向：
- 结合chain-of-thought的reasoning reward model（RM-R1）
- 多模态奖励模型
- 奖励模型在推荐系统RLHF中的应用
