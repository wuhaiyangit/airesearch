---
原文件: "GR4AD_v1.pdf"
title: "Generative Recommendation for Large-Scale Advertising"
authors: "Ben Xue, Dan Liu, Lixiang Wang, Mingjie Sun, Peng Wang, Pengfei Zhang, Shaoyun Shi, Tianyu Xu, Yunhao Sha, Zhiqiang Liu, et al."
affiliation: "Kuaishou Technology"
year: "2026"
venue: "arXiv:2602.22732v3"
category: "生成式推荐"
abstract: "提出GR4AD面向大规模广告的生产级生成式推荐系统，协同设计UA-SID统一广告语义ID、LazyAR惰性自回归解码器、VSL+RSPO价值感知学习框架，在快手4亿+用户广告系统全量部署，广告收入提升4.2%"
tags: ["生成式推荐", "计算广告", "工业部署"]
Hash: "4bc6292ac9e165c2"
RecRatio: "9"
Team: "快手"
Reason: "首个全面披露的工业级广告生成式推荐系统，覆盖tokenization-learning-serving全链路，极具工程参考价值"
精读日期: "2026-05-15"
报告字数: "约 3500 字"
---

# GR4AD: Generative Recommendation for Large-Scale Advertising 精读报告

## 1. 摘要与核心贡献

GR4AD（Generative Recommendation for Advertising）是快手技术团队提出的面向大规模广告系统的生产级生成式推荐框架。该工作首次系统性地将生成式推荐范式应用于工业级计算广告场景，并在快手4亿+日活用户广告平台上实现全量部署。

**核心问题**：传统广告推荐系统基于 DLRM（Deep Learning Recommendation Model）架构，采用"召回-粗排-精排-重排"多级级联结构，各阶段之间存在信息损失，且难以端到端优化广告价值目标（如 eCPM）。生成式推荐通过将推荐建模为序列生成问题，有望实现端到端的统一优化，但面临三大核心挑战：(1) 如何为广告构建高质量的语义化离散表示；(2) 如何在保持生成质量的同时满足在线延迟约束；(3) 如何使生成目标与广告价值目标对齐。

**四大核心贡献**：

1. **UA-SID（Unified Advertisement Semantic ID）**：基于指令微调 MLLM 提取多模态广告语义，结合共现学习进行协同优化，通过 MGMR（Multi-Granularity-Multi-Resolution）RQ-KMeans 量化为层次化离散 ID，实现广告的统一语义表征。

2. **LazyAR 解码器**：放松层间自回归依赖，前 $K$ 层对所有 token 位置并行计算，仅在第 $K+1$ 层起引入因果注意力依赖，大幅降低推理延迟同时保持生成质量。

3. **VSL + RSPO 价值感知学习**：VSL（Value-Aware Supervised Learning）将广告价值信号融入监督学习阶段；RSPO（Ranking-Guided Softmax Preference Optimization）通过 List-wise 排序学习进行偏好优化，实现生成目标与广告收入目标的对齐。

4. **Dynamic Beam Serving**：面向在线推理的动态束搜索方案，根据实时流量和候选质量自适应调整 beam width，在延迟约束下最大化召回质量。

**核心成果**：线上 A/B 实验中广告收入提升最高达 4.2%，推理延迟 <100ms，单卡 L20 达到 500+ QPS。

## 2. 业界进展与相关工作

### 生成式推荐的演进

生成式推荐的核心思想是将推荐问题转化为序列到序列（Seq2Seq）的生成问题。早期工作如 DSI（Differentiable Search Index）首先在信息检索领域验证了生成式范式的可行性。随后 TIGER 提出了用 RQ-VAE 构建 item 语义 ID 并结合 Transformer 解码器进行生成式推荐。后续 LETTER、EAGER 等工作在 ID 构建和训练范式上进行了改进。

### 与现有工作的差异

| 维度 | 已有工作(TIGER/LETTER等) | GR4AD |
|------|--------------------------|-------|
| 应用场景 | 学术数据集/有机推荐 | 工业级广告系统 |
| ID构建 | 单模态/RQ-VAE | 多模态指令微调+共现学习+MGMR |
| 解码架构 | 标准AR/NAR | LazyAR混合架构 |
| 优化目标 | CTR/相关性 | 广告价值(eCPM) |
| RL对齐 | 无/Point-wise | List-wise RSPO |
| 部署验证 | 无 | 4亿+用户全量部署 |

### 计算广告中的技术栈

传统 DLRM 架构（如 Facebook 的 DLRM、Google 的 DCN-V2）通过多级级联管线工作：召回层（数千候选）→ 粗排（数百）→ 精排（数十）→ 重排。每个阶段独立优化，存在信息级联损失。GR4AD 尝试用统一的生成模型替代前端召回和粗排阶段，直接从用户行为序列生成高价值广告候选集。

## 3. 详细技术方案

### 3.1 UA-SID：统一广告语义ID

UA-SID 的构建分为三个阶段：

**阶段一：指令微调 MLLM 嵌入提取**

利用多模态大语言模型（如 InternVL 系列），通过精心设计的指令模板对广告素材进行语义编码。指令模板包含广告的标题、描述、类目、创意图片等多模态信息，引导 MLLM 生成融合了视觉和文本语义的广告表征向量 $\mathbf{e}_{\text{sem}} \in \mathbb{R}^d$。

**阶段二：共现学习（Co-occurrence Learning）**

纯语义嵌入缺乏协同过滤信号，因此引入共现学习目标：

$$\mathcal{L}_{\text{co}} = -\sum_{(i,j) \in \mathcal{P}} \log \sigma(\mathbf{e}_i^\top \mathbf{e}_j) - \sum_{(i,k) \in \mathcal{N}} \log \sigma(-\mathbf{e}_i^\top \mathbf{e}_k)$$

其中 $\mathcal{P}$ 为用户行为中的共现正样本对，$\mathcal{N}$ 为负样本对。最终嵌入融合语义和协同信号：$\mathbf{e}_{\text{final}} = \alpha \cdot \mathbf{e}_{\text{sem}} + (1-\alpha) \cdot \mathbf{e}_{\text{co}}$。

**阶段三：MGMR RQ-KMeans 量化**

采用多粒度多分辨率的残差量化。对于 $L$ 层量化，每层码本大小可以不同：

$$\text{SID}(a) = [c_1, c_2, \ldots, c_L], \quad c_l \in \{1, \ldots, V_l\}$$

其中第 $l$ 层的量化过程为：

$$c_l = \arg\min_{k \in [V_l]} \| \mathbf{r}_{l-1} - \mathbf{m}_l^{(k)} \|^2, \quad \mathbf{r}_l = \mathbf{r}_{l-1} - \mathbf{m}_l^{(c_l)}$$

MGMR 的关键创新在于允许不同层使用不同的码本大小 $V_l$ 和不同的嵌入维度进行量化，浅层使用较小码本捕获粗粒度类目信息，深层使用较大码本捕获细粒度广告特征。

### 3.2 LazyAR 解码器

标准 Transformer 自回归解码需要逐 token 生成，对于 $L$ 层 SID 需要 $L$ 次串行前向传播。LazyAR 的核心思想是：前 $K$ 层 Transformer block 不引入 token 间的因果依赖，仅在第 $K+1$ 层起注入前序 token 信息。

**架构设计**：设 Transformer 共有 $N$ 层，分为两部分：
- **并行层**（Layer 1 到 Layer $K$）：所有 SID token 位置共享相同的计算，无因果 mask
- **自回归层**（Layer $K+1$ 到 Layer $N$）：通过门控融合算子注入前序 token 的隐状态

**门控融合算子（Gated Fusion Operator）**：

在第 $K+1$ 层，对于位置 $t$ 的 token，其隐状态更新为：

$$\mathbf{h}_t^{(K+1)} = \mathbf{h}_t^{(K)} + g_t \cdot \text{Attn}(\mathbf{h}_t^{(K)}, \mathbf{h}_{<t}^{(K)}, \mathbf{h}_{<t}^{(K)})$$

其中门控系数 $g_t = \sigma(\mathbf{W}_g [\mathbf{h}_t^{(K)}; \text{Attn}(\cdot)])$ 为学习得到的标量门控值，控制因果信息的注入强度。

**推理加速**：前 $K$ 层可以对所有 $L$ 个 token 位置一次性并行计算，仅后 $N-K$ 层需要自回归展开，推理 FLOPs 从 $O(N \cdot L)$ 降至 $O(K + (N-K) \cdot L)$。实践中取 $K = \frac{2}{3}N$，推理加速约 2-3 倍。

### 3.3 VSL + RSPO 价值感知学习

**VSL（Value-Aware Supervised Learning）**：

标准生成式推荐使用交叉熵损失对正样本进行监督学习。VSL 引入广告价值权重：

$$\mathcal{L}_{\text{VSL}} = -\sum_{t=1}^{L} w(a) \cdot \log P(c_t | c_{<t}, \mathbf{u})$$

其中 $w(a) = f(\text{eCPM}(a))$ 为广告 $a$ 的价值权重函数，$f(\cdot)$ 为单调递增的归一化映射（如 log 变换 + 分位数归一化），使得高 eCPM 广告获得更高的学习权重。

**RSPO（Ranking-Guided Softmax Preference Optimization）**：

RSPO 是一种 List-wise 的偏好优化方法，对给定 query 的一组候选广告 $\{a_1, \ldots, a_M\}$，按 eCPM 排序后构建偏好信号：

$$\mathcal{L}_{\text{RSPO}} = -\sum_{i=1}^{M} \frac{\exp(v_i / \tau)}{\sum_{j=1}^{M} \exp(v_j / \tau)} \cdot \log P_\theta(a_i | \mathbf{u})$$

其中 $v_i = \text{rank\_score}(a_i)$ 为基于 eCPM 排名的分数，$\tau$ 为温度参数。与标准 DPO 不同，RSPO：(1) 无需参考策略模型；(2) 支持 List-wise 多候选优化而非仅 Pair-wise；(3) 通过 softmax 归一化实现软偏好学习。

**两阶段训练流程**：
1. 第一阶段：VSL 预训练，在全量曝光日志上学习广告生成能力
2. 第二阶段：RSPO 微调，在高价值样本上进行偏好对齐

### 3.4 Dynamic Beam Serving

在线推理采用束搜索（Beam Search）生成广告候选集。Dynamic Beam Serving 的核心创新：

- **自适应 Beam Width**：根据请求的实时 QPS 和系统负载动态调整 beam width $B \in [B_{\min}, B_{\max}]$
- **Early Termination**：当前 beam 中最优候选的置信度超过阈值时提前终止
- **Prefix Caching**：利用 LazyAR 前 $K$ 层的位置无关特性，缓存公共前缀的中间表示

实际部署配置：$B_{\min}=10, B_{\max}=50$，平均 beam width 约 25，单次推理延迟 <100ms（NVIDIA L20 GPU），支持 500+ QPS。

## 4. 实验设计与结果分析

### 4.1 离线实验设置

数据集：快手广告平台连续30天的曝光/点击/转化日志，约数十亿条样本。广告池规模约百万级活跃广告。评估指标包括 Recall@K、NDCG@K（衡量召回质量）以及离线 eCPM 模拟值。

### 4.2 UA-SID 消融实验

| ID构建方法 | Recall@100 | Recall@500 | NDCG@100 |
|-----------|-----------|-----------|----------|
| Random Hash ID | 12.3% | 28.7% | 8.1% |
| Content-based RQ-VAE | 18.6% | 39.2% | 13.4% |
| MLLM Embedding + RQ-KMeans | 21.2% | 43.8% | 15.7% |
| + Co-occurrence Learning | 23.5% | 47.1% | 17.2% |
| + MGMR (UA-SID full) | **24.8%** | **49.3%** | **18.6%** |

关键发现：(1) 指令微调 MLLM 嵌入相比传统 RQ-VAE 带来 +2.6% Recall@100 提升，多模态语义对广告理解至关重要；(2) 共现学习带来 +2.3% 增量，验证了协同过滤信号的互补性；(3) MGMR 多粒度量化进一步提升 +1.3%，层次化码本结构更好地捕获广告的类目-品牌-创意层次。

### 4.3 LazyAR 与训练策略消融

| 模型配置 | Recall@100 | 推理延迟(ms) | 加速比 |
|---------|-----------|-------------|--------|
| Full AR (baseline) | 24.8% | 245 | 1.0× |
| NAR (fully parallel) | 20.1% | 42 | 5.8× |
| LazyAR (K=1/3·N) | 23.9% | 78 | 3.1× |
| LazyAR (K=1/2·N) | 24.3% | 92 | 2.7× |
| LazyAR (K=2/3·N) | **24.6%** | 98 | 2.5× |

| 训练策略 | 离线eCPM提升 | 线上收入提升 |
|---------|-------------|------------|
| CE Loss (标准SL) | baseline | baseline |
| + VSL | +3.8% | +1.9% |
| + RSPO | +6.2% | +3.1% |
| VSL + RSPO | +8.5% | +4.2% |

关键发现：(1) LazyAR 在 $K=2/3 \cdot N$ 时仅损失 0.2% Recall 但加速 2.5 倍，实现了质量-效率的帕累托最优；(2) 完全非自回归（NAR）质量下降严重（-4.7%），证明 token 间的依赖关系对 SID 生成是必要的；(3) VSL+RSPO 联合训练带来 +4.2% 线上收入提升，List-wise 偏好优化显著优于仅加权的 VSL。

### 4.4 线上 A/B 实验与部署效果

线上实验在快手广告平台进行，实验组覆盖约 10% 流量（数千万日活用户），持续 14 天。

| 指标 | 相对提升 | 统计显著性 |
|-----|---------|-----------|
| 广告收入（GMV） | +4.2% | p < 0.001 |
| 广告点击率（CTR） | +2.8% | p < 0.001 |
| 千次展示收入（RPM） | +3.5% | p < 0.001 |
| 广告多样性（覆盖品类数） | +15.3% | p < 0.01 |
| 用户体验（长期留存） | 持平 | - |

部署性能：
- 推理延迟：P50 < 60ms，P99 < 100ms（NVIDIA L20）
- 吞吐：单卡 500+ QPS
- 模型规模：约 1B 参数
- 广告池：百万级活跃广告，SID 层数 $L=4$，总码本空间 $\prod_{l=1}^4 V_l$ 覆盖全量广告

## 5. 关键结论与 Takeaway

1. **生成式推荐在广告场景具备工业级可行性**：GR4AD 首次证明生成式范式可以在大规模广告系统中稳定部署，并带来显著的业务增益（+4.2% 收入），打破了"生成式推荐仅限学术场景"的认知。

2. **语义ID质量是核心瓶颈**：UA-SID 的消融实验清晰表明，高质量的广告语义表征是整个系统的基石。多模态 MLLM 嵌入 + 共现协同学习 + 多粒度量化三者缺一不可。

3. **LazyAR 是延迟-质量的帕累托解**：通过延迟因果注入（delayed causal injection），LazyAR 在几乎不损失生成质量的前提下实现了 2.5 倍推理加速，这一架构设计对所有需要多步生成的序列模型都具有参考意义。

4. **List-wise RL 对齐广告价值至关重要**：RSPO 相比 Point-wise 的 VSL 带来额外 +2.3% 的线上收入提升，证明在广告场景中需要显式的排序级偏好优化来对齐商业目标。

5. **端到端优化打破级联损失**：生成式范式将召回-粗排统一为一个模型，消除了传统多级管线间的信息损失，这是业务增益的根本来源。

## 6. 局限性与开放问题

1. **冷启动问题**：新广告缺乏共现信号，UA-SID 中协同学习部分的收益受限。论文提到可依赖 MLLM 语义作为冷启动兜底，但未给出详细的冷启动性能数据。

2. **SID 更新的时效性**：广告素材频繁更新（创意换新、落地页变化），SID 的重新量化需要离线重建码本，更新频率与实时性之间存在权衡。

3. **与精排的协作机制**：GR4AD 定位为替代召回+粗排阶段，其输出仍需进入精排模型进行最终排序。生成模型与精排模型之间的协同优化空间尚未充分探索。

4. **多目标平衡**：当前 RSPO 主要优化 eCPM，但广告系统通常需要平衡多个目标（用户体验、广告主ROI、平台收入）。多目标偏好优化的 Pareto 解值得深入研究。

5. **可扩展性极限**：论文在百万级广告池上验证了系统效果，但对于更大规模（千万级/亿级）的 item 空间，SID 码本容量和生成准确率的关系尚不明确。

6. **因果关系验证**：线上 A/B 实验虽然显著，但生成式推荐引入的多样性增益与收入提升之间的因果链路缺乏更细致的分析。

## 7. 应用价值分析

### 对广告推荐系统的直接价值

- **架构简化**：用单一生成模型替代召回+粗排两个阶段，减少系统复杂度和维护成本
- **增量收入**：+4.2% 的广告收入在快手体量下意味着数亿级别的年化增量
- **延迟可控**：<100ms 的推理延迟完全满足广告实时竞价需求

### 对生成式推荐领域的方法论贡献

- **LazyAR 架构**：为所有基于自回归生成的推荐/检索系统提供了通用的加速方案，可直接迁移至有机推荐、搜索等场景
- **MGMR 量化**：多粒度码本设计为 item 语义表征的层次化建模提供了新思路
- **RSPO 框架**：List-wise 偏好优化范式可推广至任何需要排序对齐的生成任务

### 工程落地参考

- **部署规格参考**：L20 GPU 单卡 500+ QPS 的部署数据为其他团队提供了硬件选型和成本估算的基线
- **Dynamic Beam Serving**：自适应束搜索的工程方案可直接复用于其他生成式推理服务
- **训练流水线**：两阶段训练（VSL 预训练 + RSPO 对齐）的范式为工业实践提供了清晰的落地路径

## 8. 关键引用与延伸阅读

1. **TIGER** (Rajput et al., 2024) - "Recommender Systems with Generative Retrieval"：生成式推荐的开创性工作，提出 RQ-VAE + Transformer 生成范式
2. **LETTER** (2024) - 改进 TIGER 的 ID 构建方法，引入多任务学习
3. **EAGER** (2024) - 端到端训练 item tokenizer 与推荐生成器
4. **DSI** (Tay et al., 2022) - "Transformer Memory as a Differentiable Search Index"：将检索建模为生成问题的先驱工作
5. **DLRM** (Naumov et al., 2019) - Facebook 深度学习推荐模型，工业级推荐的经典基线
6. **RQ-VAE** (Lee et al., 2022) - 残差量化变分自编码器，语义ID量化的基础方法
7. **DPO** (Rafailov et al., 2023) - "Direct Preference Optimization"：RSPO 的理论基础之一
8. **InternVL** (Chen et al., 2024) - 多模态大模型，UA-SID 嵌入提取的骨干模型

**延伸方向**：
- 生成式推荐与大语言模型的结合（LLM4Rec）
- 多模态广告理解与创意生成的联合建模
- 在线持续学习下的 SID 动态更新机制
- 多目标生成式推荐的 Pareto 优化
