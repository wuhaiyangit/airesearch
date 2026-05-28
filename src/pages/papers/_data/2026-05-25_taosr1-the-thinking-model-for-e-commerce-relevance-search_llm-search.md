---
title: "TaoSR1: The Thinking Model for E-commerce Relevance Search"
authors: "Chenhe Dong, Shaowei Yao, Pengkun Jiao, Jianhui Yang, Yiming Jin, Zerui Huang, Xiaojiang Zhou, Dan Ou, Haihong Tang, Bo Zheng"
affiliation: "Alibaba (Taobao & Tmall Group), Fudan University, Tsinghua University"
year: "2026"
venue: "arXiv preprint"
category: "生成式推荐"
abstract: "淘宝搜索团队提出 TaoSR1——首个直接在工业搜索系统中在线部署 LLM 的相关性判断框架，通过 SFT+CoT → Pass@N-DPO → Difficulty-based GRPO >    三阶段优化，配合 先回答后推理(post-CoT) 范式和累积概率分层 (CumPT)，在复杂长尾查询上 Macro-F1 相对 baseline 提升 4.9 个百分点，线上人工评测 GSB 最高     +34.43%。"
tags: ["大规模GR"]
RecRatio: "9"
Team: "alibaba"
精读日期: "2026-05-25"
---

## 1. 背景与动机

### 1.1 领域现状

电商搜索相关性预测是搜索引擎的基础技术，负责确保返回商品与用户查询的语义匹配。现有方法主要依赖 BERT-based 模型，其编码器架构和双向注意力机制在文本匹配任务上表现优异，可满足 80-90% 的搜索需求。然而，剩余 10%+ 的长尾复杂查询（否定查询、平替需求、问答类查询、知识推理类查询）对模型的语义理解和推理能力提出了更高要求。

### 1.2 未解决的关键问题

将 LLM 直接部署到工业搜索的相关性判断面临三大挑战：

1. **部署延迟**：CoT 推理虽能提升上限，但输出 token 数量线性增加响应延迟。单次请求需计算数百个 query-item 对的相关性，实时生成计算量不可接受。

2. **CoT 错误累积**：长推理链中任一步骤的幻觉或推理错误会逐级传播，导致最终分类结果错误。

3. **判别幻觉 (Discriminative Hallucination)**：即使推理链正确，模型仍可能输出错误的最终答案——推理过程与分类结论不一致。

### 1.3 本文目标

设计一个可直接在线部署的 LLM 相关性优化框架 TaoSR1，通过多阶段训练策略解决上述三大挑战，使 LLM 首次在工业电商搜索系统中直接服务。

## 2. 核心方法

### 2.1 任务定义

电商搜索相关性为四分类问题：4-Excellent、3-Related、2-Mismatch、1-Irrelevant。线上按 Good/Mid/Bad 三层分层排序。

### 2.2 阶段一：SFT with CoT

**生成式训练范式**：不同于判别式训练（MSE/CE loss），采用生成式目标直接生成标签文本：

$$\mathcal{L}_{lm}(\pi) = \mathbb{E}_{(x,y)\sim D}\left[-\sum_{t=1}^{|y|-1}\log \pi(y_{t+1}|x_1,\ldots,y_t)\right]$$

在线推理时，提取第一个生成 token 的概率分布作为连续分数：

$$P(y_1=c|x) = \frac{\exp(\pi(x)_{\text{id}(c)})}{\sum_{j=1}^{4}\exp(\pi(x)_{\text{id}(c_j)})}$$

**RAG-based CoT 生成**：将复杂业务规则分解为"原子规则"建立结构化知识库，通过 RAG pipeline 动态检索相关规则，用 DeepSeek-R1 合成高质量 CoT 训练数据。CoT 结构包含 5 步：查询理解 → 商品理解 → 品类匹配 → 属性匹配 → 相关性判定。

**Post-CoT 范式**：对比"先思后答" (<CoT, label>) 和"先答后思" (<label, CoT>) 两种范式。发现"先思后答"因 CoT 错误累积反而低于判别式 baseline；"先答后思"避免错误传播，性能显著恢复。

### 2.3 阶段二：Pass@N-based DPO

通过离线多次采样发现模型 pass@N 准确率远高于单次解码（pass@5=81.73% vs pass@1=67.38%），表明 RL 优化空间巨大。构建偏好数据集：

- **自纠正（pass@N > 0）**：从模型自身采样中选取正确响应为 chosen，错误为 rejected
- **Oracle 指导（pass@N = 0）**：对模型一致失败的困难样本，用 DeepSeek-R1 生成 chosen 响应

DPO 损失：

$$\mathcal{L}_{\text{DPO}}(\pi_\theta;\pi_{\text{ref}}) = -\mathbb{E}_{(x,y_w,y_l)\sim D}\left[\log\sigma\left(\beta\log\frac{\pi_\theta(y^+|x)}{\pi_{\text{ref}}(y^+|x)} - \beta\log\frac{\pi_\theta(y^-|x)}{\pi_{\text{ref}}(y^-|x)}\right)\right]$$

### 2.4 阶段三：GRPO with Difficulty-based Sampling

受 DAPO 启发，提出难度感知动态采样策略：

$$\mathcal{L}_{\text{GRPO}}(\theta) = \mathbb{E}\left[\frac{1}{G}\sum_{i=1}^{G}\frac{1}{|o_i|}\sum_{t=1}^{|o_i|}\min\left(r_{i,t}(\theta)\hat{A}_t, \text{clip}(r_{i,t}(\theta),1-\epsilon,1+\epsilon)\hat{A}_t\right) - \beta D_{KL}(\pi_\theta\|\pi_{\text{ref}})\right]$$

约束条件：$0 < |\{o_i|\text{isequivalent}(y,o_i)\}| < \gamma$

**关键发现**：训练数据标签分布的变异系数(CV)与最终性能强负相关。采用类别均衡下采样 + 最小拒绝采样（仅丢弃全对/全错批次），以更少数据实现更优性能。判别幻觉相比 DPO 降低 30%。

### 2.5 Cumulative Probability Tiering (CumPT)

将传统多阈值分层（需 4+ 超参数）简化为单一超参数 $\beta_{\text{cum}}$：

按类别概率从高到低累积：若 $P(4) \geq \beta_{\text{cum}}$ → Good；若 $P(4)+P(3) \geq \beta_{\text{cum}}$ → Good；若 $P(4)+P(3)+P(2) \geq \beta_{\text{cum}}$ → Mid；否则 → Bad。

CumPT 使 Online Macro F1 与 Offline Macro F1 几乎一致（67.17 vs 67.12），消除了传统方法中繁琐的超参搜索。

### 2.6 在线部署优化

基础模型为 Tbstar-42B（MoE 架构，3.5B 激活参数）。工程优化包括：
- 按序列长度动态分批，均衡计算负载
- 跨机房代理调度，消除跨数据中心瓶颈
- FP8 量化 + KV Cache 前缀共享

优化后平均 RT 从 800ms 降至 286ms，MFU 达 46.2%。Post-CoT 范式仅需优化 prefill 延迟，无需额外 decoding 开销。

## 3. 实验设计

### 3.1 数据集

- 来自淘宝在线搜索日志，约 70,000 条人工标注 query-item 对
- 查询分布聚焦四类困难场景：否定查询、平替查询、QA 查询、知识推理查询
- 标签分布：L4(50%), L3(5%), L2(36%), L1(9%)

### 3.2 基线方法

| 模型 | 说明 |
|------|------|
| BERT | 24层，自训预训练（通用+电商语料），CE loss 微调 |
| Qwen3-0.6B | 开源稠密模型，SFT |
| Qwen3-30B-A3B | 开源 MoE，30B total / 3B active |
| LLM base | Tbstar-42B (3.5B active) SFT，最强 baseline |

### 3.3 评价指标

- **离线**: Macro-F1, 各类 F1, Accuracy
- **线上**: GSB (Good/Same/Bad 人工对比), Query Goodrate, Item Goodrate

## 4. 关键结果

### 4.1 离线评测

| Models | Class-1 F1 | Class-2 F1 | Class-3 F1 | Class-4 F1 | Macro F1 | Accuracy |
|--------|-----------|-----------|-----------|-----------|----------|----------|
| BERT | 65.74 | 69.63 | 33.87 | 76.06 | 61.33 | 69.36 |
| Qwen3-0.6B | 42.02 | 68.13 | 23.50 | 78.14 | 52.95 | 70.29 |
| Qwen3-30B-A3B | 65.09 | 68.80 | 32.47 | 81.68 | 62.01 | 74.42 |
| LLM base | 65.19 | 68.86 | 32.91 | 81.90 | 62.22 | 75.04 |
| TaoSR1(CoT) | 43.30 | 67.54 | 19.68 | 75.62 | 51.54 | 68.22 |
| TaoSR1(CoT&DPO) | 62.90 | 71.20 | 37.96 | 82.25 | 63.58 | 75.54 |
| **TaoSR1(full)postCoT** | **67.34** | **73.15** | **44.94** | **83.06** | **67.12** | **76.86** |

最终模型相比 LLM base：Macro-F1 +4.9pt，Class-3(最难类) F1 +12.03pt。

### 4.2 Pass@N 验证

| Pass@N | 1 | 2 | 3 | 4 | 5 |
|--------|---|---|---|---|---|
| Accuracy | 67.38 | 74.26 | 77.68 | 80.18 | 81.73 |

### 4.3 Difficulty Ratio 消融

标签均衡采样（CV=0）在使用最少数据的情况下达到最优 Macro-F1=67.12。

### 4.4 线上人工评测

| Query Type | GSB | Query Goodrate | Item Goodrate |
|-----------|-----|---------------|--------------|
| Q&A | +16.62% | +6.53pt | +5.66pt |
| Alternative | +34.43% | +13.11pt | +10.69pt |
| Negative | +10.92% | +3.80pt | +3.74pt |
| Knowledge | +18.45% | +6.85pt | +4.44pt |

线上 A/B 测试：UV +0.22%, IPV +2.43%, Transaction +0.82%。

## 5. 优势与局限

### 优势

1. **首次在工业搜索中直接部署 LLM**：不走蒸馏到 BERT 的老路，证明 LLM 可直接服务
2. **Post-CoT 范式创新**：将"先答后思"应用于分类任务，优雅解决 CoT 错误累积
3. **三阶段渐进优化**：SFT 赋能 → DPO 校正 → GRPO 强化，每阶段有明确作用
4. **CumPT 部署简化**：单一超参数替代传统 4+ 超参，Online/Offline F1 几乎无损
5. **系统工程闭环**：从模型训练到在线部署（FP8/KV Cache/调度）全链路优化

### 局限

1. **评测集偏向困难查询**：70K 测试集聚焦长尾困难场景，未全面评估简单查询的性能
2. **Post-CoT 推理能力受限**：作者在 Atomic Capability Evaluation 中发现 post-CoT 并不提升推理能力，收益来自规则遵循
3. **基座模型闭源**：Tbstar-42B 为淘宝内部模型，可复现性有限
4. **GMV 微降 -0.29%**：优化相关性可能牺牲了部分商业化指标
5. **未讨论多语言/跨域迁移**：仅在淘宝中文搜索场景验证

## 6. 对工作的启发

1. **分类任务的 RL 范式**：TaoSR1 系统验证了 RL（DPO+GRPO）在生成式分类任务中的有效性，为《生成式推荐》书中"强化学习对齐"章节提供了从推荐到搜索的延伸案例

2. **Post-CoT vs Pre-CoT 的选择逻辑**：对于需要低延迟部署的分类任务，post-CoT 是更优选择；对于需要真正推理能力的生成任务，pre-CoT 仍不可或缺。这一对比对书籍中讨论 Thinking Model 在推荐中的应用方式有直接指导意义

3. **Difficulty-based Sampling 的数据工程洞察**：标签分布 CV 与性能的强负相关发现，揭示了 RL 训练中数据均衡的重要性，对推荐场景中的 GRPO 应用有参考价值

4. **RAG+CoT 的知识注入路径**：将领域规则原子化 → RAG 检索 → LLM 合成 CoT 的 pipeline，可推广到推荐系统中复杂业务逻辑（如品类适配规则、个性化策略）的知识注入

5. **工业部署的工程范式**：FP8 + 前缀共享 + 跨机房调度的组合优化方案，为大模型推荐系统的线上 serving 提供了实用参考

## 7. 参考文献精选

| 文献 | 与本文关系 |
|------|-----------|
| DeepSeek-R1 (Guo et al., 2025) | Oracle 模型来源，为困难样本生成 chosen 响应；RL 增强推理的范式参考 |
| DAPO (Yu et al., 2025) | GRPO 中 difficulty-based sampling 的灵感来源，本文改进了其对同质批次的处理 |
| DPO (Rafailov et al., NeurIPS 2023) | 偏好优化算法基础，本文三阶段中第二阶段的核心方法 |
| GRPO/DeepSeekMath (Shao et al., 2024) | 组相对策略优化算法来源，本文将其适配到分类任务 |
| GenCLS++ (He et al., 2025) | 生成式分类任务中 RL 效果的系统研究，与本文互为补充 |
| LREF (Tang et al., WWW 2025) | 电商搜索 LLM 相关性框架，本文的直接竞争/相关工作 |
| RankLLaMA (Ma et al., SIGIR 2024) | LLM 微调用于检索排序的基线方法 |
| ReprBERT (Yao et al., KDD 2022) | 淘宝搜索团队前序工作，BERT 蒸馏范式的代表 |
