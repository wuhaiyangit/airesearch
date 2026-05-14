# GR4AD: Generative Recommendation for Large-Scale Advertising

> **论文信息**: Ben Xue*, Dan Liu*, Lixiang Wang* 等 (Kuaishou Technology)  
> **发表**: arXiv:2602.22732v3, 2026年4月  
> **关键词**: Generative Recommendation, Advertising, Semantic ID, Reinforcement Learning  
> **精读日期**: 2026-05-14

---

## 1. 背景与动机

### 1.1 研究背景

生成式推荐（Generative Recommendation）近年来在工业界引起广泛关注，其核心思想是将推荐问题转化为基于 Semantic ID 的 next-token prediction 任务，借助生成模型的 scaling 能力和更强的模型容量来提升推荐效果。代表性工作包括 TIGER、OneRec、LC-Rec、GPR 等。

然而，将生成式推荐部署到**大规模广告系统**的实时场景中，面临着传统 LLM 技术无法直接解决的独特挑战：

### 1.2 核心问题

**(1) 广告 Tokenization 的复杂性**：广告创意融合了视频属性、产品详情、B2B 广告主元数据等多模态信息。现有方法缺乏端到端微调的广告 LLM embedding，且平台暴露的业务信号（如转化类型、广告账户）无法被纯语义内容捕捉，如何联合建模多模态、多粒度特征是核心挑战。

**(2) 学习范式的局限**：广告推荐优化的是排序列表下的业务目标（如 eCPM）和列表级指标（如 NDCG），现有方法主要沿用 LLM 式训练 recipe，缺乏面向在线广告学习的 ranking-aware、list-wise 学习设计。

**(3) 实时服务的严苛约束**：系统必须在高流量和严格延迟预算下生成多个高质量候选，这与交互式 LLM 使用（单个响应可容忍较长延迟）有本质区别。面向实时多候选生成的 serving 效率在广告场景中尚未被系统性探索。

### 1.3 为什么重要

广告是互联网平台的核心商业化引擎，广告推荐系统的效率和效果直接影响平台收入和生态健康。GR4AD 在快手广告系统上实现了 +4.2% 的广告收入提升，服务超过 4 亿用户，证明了生成式推荐在工业级广告场景中的巨大潜力。这是首个系统性解决广告场景下生成式推荐的 tokenization、学习、服务三大难题的完整方案。

---

## 2. 核心方法

GR4AD 采用推荐原生的协同设计（co-design），横跨表征、架构、学习和服务四个维度。

### 2.1 UA-SID: Unified Advertisement Semantic ID

UA-SID 的设计分为两个阶段：**统一广告嵌入（UAE）** 和 **MGMR 量化**。

#### 2.1.1 Unified Advertisement Embedding (UAE)

**Instruction Tuning (IT)**：针对广告中的异构内容格式（视频、产品、广告主），采用基于指令的 MLLM 微调，设计了 6 种 prompt template 覆盖快手的广告类型。例如：
- 直播场景：分析主播档案和地理信息
- 站外广告主：聚焦产品的行业和品牌信息
- 虚拟产品：提取核心交付价值和叙事营销策略

**Co-occurrence Learning (CL)**：引入共现对比学习目标以融入协同信号。使用 Swing 方法估计 item 共现强度，以 item 三元组（Video, Product, Advertiser）构建正样本对，采用 InfoNCE 损失：

$$\mathcal{L}_{NCE}(i) = -\log \frac{\sum_{j \in \mathcal{P}_i} \exp(\mathbf{z}_i^\top \mathbf{z}_j / \tau)}{\sum_{k \neq i} \exp(\mathbf{z}_i^\top \mathbf{z}_k / \tau)}$$

其中 $\mathbf{z}$ 为 MLLM 的 last hidden states。

#### 2.1.2 MGMR RQ-Kmeans

为解决传统 RQ-Kmeans 的低利用率和高碰撞率问题，提出 Multi-Granularity-Multi-Resolution (MGMR) 方案：

- **Multi-Resolution (MR)**：低层使用大 codebook 捕获主导因素（如 16384），高层建模低熵残差使用小 codebook（如 1024）。每层应用 Balanced K-means 提升利用率。
- **Multi-Granularity (MG)**：在最终层用 hash-based numeric mapping 替代向量量化，利用非语义业务特征（item/account IDs、转化类型），显著降低碰撞率。

最终每个 item 映射为离散 UA-SID 序列：$\mathbf{y} = (s_1, s_2, \ldots, s_T)$，$s_t \in \mathcal{V}_t$。

**效果**：配置 (16384, 4096, 1024*) 相比标准 RQ-Kmeans (4096, 4096, 4096)，压缩比从 3.54 降至 1.07，碰撞率从 85.44% 降至 18.26%，利用率从 0.10‰ 提升至 0.34‰。

### 2.2 LazyAR: Lazy Autoregressive Decoder

#### 2.2.1 动机

观察到第一层 UA-SID ($s_1$) 通常 loss 最大、最难学习，但对 beam search 成本贡献最小（从 BOS 开始，有效 beam 为 1）。大部分解码计算花费在后续层（$t \gg 1$），但这些层经验上更容易。这种**学习难度与推理成本的错配**激发了 LazyAR 的设计。

#### 2.2.2 核心设计

给定选定的 $K$（$1 \leq K < L$），LazyAR 将解码过程分为两阶段：

**并行阶段（前 K 层）**：不依赖 $s_{t-1}$，所有 level 可并行计算：
$$\mathbf{m}_t^{(0)} = \mathbf{p}_t$$
$$\mathbf{m}_t^{(\ell)} = \text{Dec}^{(\ell)}(\mathbf{m}_t^{(\ell-1)}, \mathbf{X}), \quad \ell = 1, \ldots, K$$

**自回归阶段（后 L-K 层）**：在第 K 层注入前一级 UA-SID embedding：
$$\tilde{\mathbf{m}}_t^{(K)} = \text{Fuse}(\mathbf{m}_t^{(K)}, \mathbf{s}_{t-1})$$
$$\mathbf{h}_t^{(\ell)} = \text{Dec}^{(\ell)}(\mathbf{h}_t^{(\ell-1)}, \mathbf{X}), \quad \ell = K+1, \ldots, L$$

**Fuse 操作**为轻量级 gated projection：
$$\text{Fuse}(\mathbf{m}, \mathbf{s}) = \mathbf{W}_f[\mathbf{m} \odot (\mathbf{W}_g \mathbf{s}); \mathbf{s}]$$

#### 2.2.3 为什么快

前 K 层 $\{\mathbf{m}_t^{(K)}\}_{t=1}^T$ 不依赖 $s_{t-1}$，可以**一次性并行计算并跨 beam 复用**。只有后 $L-K$ 层需要自回归依赖，大幅减少了 beam search 中的顺序计算。

#### 2.2.4 为什么不损失效果

1. 第一层 UA-SID 的解码过程完全不变（仍通过完整 L 层）
2. 前 K 层的中间状态可在 latent space 中推理，编码关于 level $t$ 合理候选的有用信号
3. 引入 MTP-style 辅助损失鼓励前 K 层学习更丰富的潜在表征
4. $K$ 是可调超参数，$K=1$ 退化为标准 AR；实验中 $K = \frac{2}{3}L$（L=9, K=6）保持推荐质量同时 QPS 翻倍

#### 2.2.5 与 DeepSeek MTP 的区别

DeepSeek MTP 为后续 token 添加额外浅层 decoder，引入额外参数且阻止早期层直接参与后续推理。LazyAR 不增加参数，共享前 K 层，且经验上性能更好。

### 2.3 Value-Aware Supervised Learning (VSL)

VSL 的训练目标融合了多个组件：

**SID Token Prediction Loss**：
$$\mathcal{L}_{SID} = -\sum_{t=1}^T \log p(s_t | s_{<t}, \mathbf{X})$$

**eCPM-Aware Token Prediction**：将连续 eCPM 值离散化为等概率桶，追加 eCPM token 作为额外预测步：
$$\mathcal{L}_{eCPM} = -\log p(v | \mathbf{y}, \mathbf{X})$$
$$\mathcal{L}_{NTP} = \mathcal{L}_{SID} + \lambda_e \mathcal{L}_{eCPM}$$

**Value-Aware Sample Weighting**：每个样本权重 $w = w_{user} \cdot w_{behavior}$，$w_{user}$ 捕捉用户长期广告价值，$w_{behavior}$ 反映交互深度（购买 > 点击）。

**Auxiliary MTP Loss**：通过设置 $\mathbf{h}_t^{(K)} \triangleq \mathbf{m}_t^{(K)}$，要求 trunk 直接预测目标 token，训练时使用。

最终 VSL 目标：
$$\mathcal{L}_{VSL} = \mathbb{E}_{\mathcal{D}}[w \cdot \mathcal{L}_{NTP} + \lambda_{mtp} \mathcal{L}_{MTP}]$$

### 2.4 RSPO: Ranking-Guided Softmax Preference Optimization

#### 2.4.1 算法设计

RSPO 是面向广告推荐的 list-wise RL 方法。给定候选列表 $Y = \{y_1, \ldots, y_n\}$ 及其 reward $v_i$（eCPM），受 Lambda 框架和 SDPO 启发，直接对齐 NDCG 排名目标：

$$\mathcal{L}_{RSPO} = -\mathbb{E}_{(X, y_i, E_i) \sim \mathcal{D}} \left[ \log_2 \sigma \left( -\log \sum_{y_j \in E_i} M_{ij} \exp(\beta \log \frac{p_\theta(y_j|X)}{p_{ref}(y_j|X)^{C_{ij}}} - \beta \log \frac{p_\theta(y_i|X)}{p_{ref}(y_i|X)^{C_{ij}}}) \right) \right]$$

其中：
- $E_i = \{y_j | v_j < v_i\}$ 为排在 $y_i$ 下面的候选集
- $M_{ij} = (\frac{1}{D_{|i-j|}} - \frac{1}{D_{|i-j|+1}}) |G_i - G_j|$ 为 Lambda 系数
- $C_{ij}$ 为 reference 可用性的二值门控（当模型预测与 $p_{ref}$ 偏差过大时置零）

**理论保证**：论文证明 $\mathcal{L}_{RSPO}$ 是 $\text{NDCG}_{cost}$ 的上界（利用 LambdaLoss 框架 + Jensen 不等式）。

#### 2.4.2 Reference 可靠性门控

$$C_{ij} = \begin{cases} 1 & \text{if } \frac{1}{|E_i \cup \{y_i\}|} \sum_{y_t} \log \frac{p_\theta(y_t|X)}{p_{ref}(y_t|X)} < \delta \\ 0 & \text{otherwise} \end{cases}$$

处理异构数据来源（部分来自 GR4AD 有 $p_{ref}$，部分来自其他 pipeline 无可靠 $p_{ref}$）和分布漂移问题。

#### 2.4.3 VSL 与 RSPO 的统一学习

引入 sample-level alignment score 动态平衡模仿与探索：

$$A^{(i)} = \frac{|r_p^{(i)} - r_v^{(i)}|}{n-1}$$

其中 $r_p^{(i)}$ 和 $r_v^{(i)}$ 分别为模型似然和 reward 排名。

- $A^{(i)}$ 大 → 模型排名偏离 reward → 增加 VSL 权重
- $A^{(i)}$ 小 → 模型已基本对齐 → 增加 RSPO 权重

权重分配：
$$w_{VSL}^{(i)} = w_0 \cdot \exp(A^{(i)} \cdot \log(1 + v_i))$$
$$w_{RL}^{(i)} = w_0 \cdot Z_{max}(1 - A^{(i)})$$

最终统一目标：
$$\mathcal{L} = \mathbb{E}_{i \sim \mathcal{D}} [w_{VSL}^{(i)} \mathcal{L}_{VSL}^{(i)} + w_{RL}^{(i)} \mathcal{L}_{RSPO}^{(i)}]$$

---

## 3. 实验设计

### 3.1 数据集与规模

- **平台**：快手广告系统，服务 4 亿+ 用户
- **模型规模**：0.03B, 0.08B, 0.16B, 0.32B（部署版本为 0.16B）
- **评估方式**：大规模线上 A/B 测试
- **UA-SID 深度**：T=3（三层 SID）
- **Decoder 配置**：L=9 层，K=6（前 6 层并行，后 3 层自回归）

### 3.2 Baseline

- **DLRM (Base)**：快手广告平台既有的 DLRM-based 系统
- **OneRec-V2 (GR-Base)**：当时最先进的生成式推荐模型

### 3.3 评估指标

- **核心业务指标**：广告收入（Revenue）变化百分比
- **服务效率**：QPS（相对于 GR-Base 的变化）
- **UA-SID 质量**：R@1/R@5/R@10（photo-to-photo recall）、压缩比（Cpr）、碰撞率（Col）、利用率（Util）
- **补充业务指标**：中小广告主投放量、广告转化率、低活用户转化率

### 3.4 Ablation 设计

逐步累加各组件评估贡献：
1. Tokenization: UA-SID
2. Learning: VSL → VSL+DPO → VSL+GRPO → VSL+RSPO → Unified VSL&RSPO
3. Serving: DBS → DeepSeek-MTP → LazyAR

### 3.5 Scaling Law 实验

- **Model Scaling**：固定 beam width=512，对比 0.03B-0.32B
- **Inference Scaling**：固定 model size=0.16B，对比 beam width 128-1024

---

## 4. 关键结论

### 4.1 核心定量结果

| 配置 | ΔRevenue vs. Base | ΔQPS vs. GR-Base |
|------|-------------------|------------------|
| DLRM (Base) | – | – |
| OneRec-V2 (GR-Base) | +1.68% | – |
| + UA-SID | +1.92% | 0% |
| + VSL | +2.80% | -25% |
| + VSL + RSPO | +3.86% | -25% |
| + Unified VSL & RSPO | +4.01% | -25% |
| + UVR + DBS | +4.32% | +20% |
| **GR4AD (+ UVR + DBS + LazyAR)** | **+4.28%** | **+117%** |

### 4.2 关键发现

1. **RSPO 是最显著的单项提升**：相比 DPO (+3.16%) 和 GRPO (+3.21%)，RSPO (+3.86%) 的 list-wise 设计更能捕捉用户兴趣和偏好。

2. **LazyAR 实现近乎无损的 2x 加速**：仅损失 0.04% revenue（4.32% → 4.28%），但 QPS 从 +20% 提升至 +117%。

3. **Scaling Law 成立**：
   - Model scaling: 0.03B → 0.32B，revenue 从 +2.13% 到 +4.43%
   - Inference scaling: beam 128 → 1024，revenue 从 +2.33% 到 +4.21%

4. **补充业务指标**：
   - 中小广告主投放量 +17.5%
   - 广告转化率 +10.17%
   - 低活用户转化率 +7.28%

5. **服务性能**：<100ms 延迟，500+ QPS per L20 GPU。

6. **效率优化贡献**：Beam-shared KV Cache (+212.5% QPS), TopK Pre-Cut (+184.8%), Low-Precision (+50.3%), Reco Cache (+27.8%)。

### 4.3 UA-SID 质量

UAE（Qwen3-VL-7B + IT + CL）R@1 达到 0.896，远超 QARM (0.541) 和原始 Qwen3-VL-7B (0.769)，验证了端到端广告嵌入微调的重要性。

---

## 5. 局限性与讨论

### 5.1 局限性

1. **LazyAR 的领域特异性**：作者明确指出该设计是 recommendation-specific 的，不适用于标准 LLM 解码。在典型 LLM serving 中，beam search 通常不使用（或使用小 beam），且后续 token 的预测难度不一定递减，因此延迟自回归依赖可能收益有限。

2. **模型规模限制**：部署版本仅 0.16B 参数，虽然 0.32B 表现更好（+4.43%），但受限于实时服务的计算预算。生成式推荐模型如何在更大规模下高效服务仍待探索。

3. **Reward System 的依赖**：RSPO 依赖 reward model 提供 eCPM 估计，reward model 本身的质量和偏差可能传递到策略优化中。

4. **reference 分布的挑战**：来自异构数据源的训练样本部分无 $p_{ref}$，$C_{ij}$ 的门控虽然缓解了问题但本质上是一种妥协方案。

5. **冷启动的边界**：虽然 content-based SID 和 real-time index 改善了冷启动，但对于完全无内容信息的新广告仍有局限。

### 5.2 适用场景

- 大规模广告推荐系统（多候选生成、严格延迟约束）
- 需要对齐商业价值的推荐场景（eCPM 优化）
- 多模态广告内容理解与表征
- 实时在线学习的非平稳环境

### 5.3 不太适用的场景

- 纯兴趣推荐（无明确商业 value 信号）
- 长序列生成（LazyAR 针对短 SID 序列设计）
- 小规模系统（系统复杂度高，ROI 不明显）

---

## 6. 对工作的启发

### 6.1 对生成式推荐方向的核心启发

1. **生成式推荐的工业化范式已经成熟**：GR4AD 展示了从 tokenization → learning → serving 的完整工业化路径，证明生成式推荐可以在大规模广告系统中全链路落地并取得显著收益。这对于构建 generative recommendation 技术体系具有重要参考价值。

2. **"推荐原生"设计优于直接复用 LLM 技术**：论文反复强调不能简单套用 LLM 式的训练和服务配方。推荐场景的独特性（短序列、多候选、列表级优化、实时约束）需要针对性设计，这一理念值得贯穿于整个 generative recommendation 研究中。

3. **Tokenization 是基座**：UA-SID 的设计理念——融合语义（MLLM embedding）与非语义（business features via hash）、融合内容信号与协同信号——为广告/商品等复杂 item 的 semantic ID 设计提供了范本。

### 6.2 技术洞察

4. **LazyAR 的"难度-成本错配"洞察**：第一层最难学但推理最便宜，后续层容易学但推理最贵。这种观察可以推广到其他结构化生成任务中——对"容易但计算密集"的部分进行并行化。

5. **RSPO 的 list-wise RL 范式**：将推荐 RL 从 pair-wise (DPO) 扩展到 list-wise，利用 Lambda 框架建立与 NDCG 的理论联系。这为推荐场景下的偏好优化提供了更自然的formulation。

6. **VSL-RSPO 统一框架的工程智慧**：通过 alignment score 动态调节两个目标的权重，避免了多阶段训练的复杂性，适合 online learning 的流式场景。

### 6.3 未来方向

7. **LazyAR 的 latent reasoning 扩展**：论文提到前 K 层可以扩展为执行更多推理步骤（latent reasoning），这与当前 reasoning model 的趋势一致，值得深入探索。

8. **Inference-time scaling 在推荐中的潜力**：beam width 从 128 到 1024 带来 +2% 的持续收益，暗示在推荐场景中 test-time compute 同样有效，为 cost-aware inference control 提供了研究空间。

9. **跨场景迁移**：GR4AD 的框架是否可以迁移到搜索广告、信息流推荐、电商搜索等场景，以及不同场景下各组件的相对重要性如何变化。

---

## 7. 方法细节补充

### 7.1 系统架构

GR4AD 采用闭环架构，包含四个核心组件：
- **Realtime Serving**：处理用户请求，调用推理服务返回排序广告列表
- **Realtime Index**：基于 UA-SID ↔ Item ID 的双向索引，新 item 到达时秒级更新（优于 DLRM 的分钟级 embedding index 重建）
- **Online Learning**：持续 mini-batch 训练 VSL 和 RL，实时推送参数
- **Reward System**：放松延迟约束，使用更大 beam 生成候选并用 reward model 打分

### 7.2 Dynamic Beam Serving (DBS)

**Dynamic Beam Width (DBW)**：采用渐进式增加的 beam 调度（如 128-256-512 替代 512-512-512），减少中间计算同时保持最终候选质量。实验显示 progressive increasing 策略仅损失 0.15% revenue 但获得 +45% QPS。

**Traffic-Aware Adaptive Beam Search (TABS)**：根据实时流量调整 beam 规模：
$$B_t = B_{base} \cdot f(Q_t, C_{avail})$$
低峰期增加 beam width 60% 以利用空闲计算资源提升收入，高峰期保持不变控制延迟。

### 7.3 其他效率优化

| 优化方法 | QPS 提升 |
|---------|---------|
| Beam-shared KV Cache | +212.5% |
| TopK Pre-Cut | +184.8% |
| FP8 Low-Precision | +50.3% |
| Reco Result Cache | +27.8% |

- **Beam-shared KV Cache**：将 beam 沿 sequence 维度组织，多个 beam 共享单一 encoder KV cache，消除冗余内存访问，per-step KV read 复杂度从 O(B·L) 降至 O(L)。
- **TopK Pre-Cut**：先在每个 beam 内并行选 k 个候选，再全局 top-k，减少搜索空间。
- **Reco Result Cache**：短 TTL（1 分钟）缓存，27.8% 请求命中缓存。

### 7.4 Context Processor

对结构化特征和用户交互序列，采用轻量级 linear context processor（沿用 LazyDecoder [40]），输出 $\mathbf{X} = (x_1, \ldots, x_S)$，$x_i \in \mathbb{R}^d$。

### 7.5 RSPO 理论证明概要

证明 $\mathcal{L}_{RSPO}$ 是 $\text{NDCG}_{cost}$ 上界的关键步骤：
1. 利用 LambdaLoss 不等式：$\mathbb{I}_{g_i < g_j} \leq -\log_2 \sigma(g_i - g_j)$
2. 对每个样本 $i$，通过 Jensen 不等式（log 函数的凹性）证明 pair-wise 上界可进一步放缩为 softmax 形式的 RSPO loss
3. 关键条件：$\sum M_{ij} < 1$（由 Lambda 系数定义保证）

---

## 8. 总结评价

### 评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 创新性 | 9/9 | UA-SID（融合语义+非语义+协同信号）、LazyAR（延迟注入的并行-AR混合解码）、RSPO（list-wise RL + Lambda NDCG对齐）均为原创性强的设计，且各自有清晰的理论或经验动机 |
| 工程价值 | 9/9 | 完整的工业级系统设计，闭环架构，覆盖 tokenization → learning → serving 全链路，已在 4 亿用户规模全量部署，各项工程优化实用性极强 |
| 理论深度 | 9/9 | RSPO 与 NDCG_cost 的上界证明严谨（Jensen 不等式 + LambdaLoss 框架），VSL-RSPO 统一框架有清晰的 alignment score 动机，LazyAR 的效率分析完整 |
| 实验充分性 | 9/9 | 大规模线上 A/B（非离线模拟），完整的逐项 ablation，Scaling Law 验证，UA-SID 多维度离线评估，业务指标全面（收入、中小广告主、转化率、低活用户） |
| 写作质量 | 9/9 | 结构清晰，问题-方案对应明确，公式推导完整，图表信息密度高，related work 定位精准，系统图和架构图直观 |
| **综合** | **9/9** | 这是一篇顶尖的工业论文，展示了生成式推荐在大规模广告系统中从原型到全面部署的完整路径。创新不是单点突破而是系统性的协同设计，每个组件都有扎实的动机、优雅的解决方案和充分的验证。 |

### 总结

GR4AD 是快手广告团队交出的一份高质量工业论文答卷。它不仅展示了生成式推荐在广告场景下的巨大商业价值（+4.2% revenue），更重要的是提供了一套可复制的方法论：如何为复杂业务 item 设计 Semantic ID（UA-SID），如何在不牺牲效果的前提下大幅提升解码效率（LazyAR），如何将业务目标（eCPM/NDCG）与生成式模型的优化目标对齐（RSPO），以及如何在实时在线学习环境中统一监督学习和强化学习（Unified VSL & RSPO）。

论文的每一个设计选择都有清晰的 motivation，每一个 claim 都有充分的实验支撑，这使得它不仅是一篇好的研究论文，更是一份有价值的工程参考手册。对于任何正在探索生成式推荐工业化落地的团队，GR4AD 都是必读之作。
