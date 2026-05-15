---
原文件: "AdaSID_v1.pdf"
title: "Beyond Static Collision Handling: Adaptive Semantic ID Learning for Multimodal Recommendation at Industrial Scale"
authors: "Yongsen Pan, Yuxin Chen, Zheng Hu, Xu Yuan, Daoyuan Wang, Yuting Yin, Songhao Ni, Hongyang Wang, Jun Wang, Fuji Ren, Wenwu Ou"
affiliation: "University of Electronic Science and Technology of China (UESTC), Kuaishou Technology"
year: "2026"
venue: "ACM Conference 2026 (under review)"
category: "生成式推荐"
abstract: "提出AdaSID自适应语义ID学习框架，通过两阶段自适应重叠调控（语义自适应松弛+自适应压力分配）解决SID碰撞问题，在公开数据集和快手电商在线实验中均取得显著提升"
tags: ["语义ID学习", "生成式推荐", "多模态推荐"]
Hash: "62ee6da824d8f8e0"
RecRatio: "8"
Team: "快手+UESTC"
Reason: "首次提出自适应碰撞处理的SID学习框架，工业级验证充分，对语义ID方向有重要推动"
精读日期: "2026-05-15"
报告字数: "约 3000 字"
---

## 1. 摘要与核心贡献

- **研究问题**：如何在语义ID（Semantic ID, SID）学习中自适应地处理离散空间中的碰撞（collision）问题，使不同语义兼容度的重叠对获得差异化调控，从而提升推荐质量。

- **动机**：SID 通过将多模态物品特征映射为短离散 token 序列，为检索、排序和生成式推荐提供紧凑且语义丰富的物品接口。然而，离散化过程不可避免地引入碰撞——不同物品被分配相同或高度混淆的 SID。现有方法要么通过改进量化质量间接缓解碰撞，要么施加固定的碰撞正则化，存在两个核心缺陷：(1) 对所有重叠一视同仁，无法区分"有害歧义"与"语义兼容共享"；(2) 即使识别出有害碰撞，也采用统一强度的固定响应，不考虑局部碰撞负载和训练阶段的差异。

- **方法概要**：提出 AdaSID（Adaptive Semantic ID Learning），将碰撞调控建模为两阶段自适应过程：
  - **Stage 1——语义自适应重叠松弛（Semantic-Adaptive Overlap Relaxation）**：基于深度感知语义门控，判断重叠对是否应继续接收排斥力
  - **Stage 2——自适应压力分配（Adaptive Pressure Allocation）**：通过负载自适应碰撞增强（空间维）和进度自适应目标再平衡（时间维）调控剩余碰撞

- **主要结果**：
  - 两个公开基准（Amazon Toys、Beauty）上 Recall 和 NDCG 平均提升约 4.5%（相对最强基线）
  - 快手电商在线 A/B 测试（覆盖千万级用户）：GMV +0.98%，订单数 +0.91%，GPM +1.16%
  - 离线排序模型 AUC 也获得一致性提升（Overall CTCVR +0.05pp，冷启动 CVR +0.08pp）

- **核心贡献**：
  1. 首次将 SID 碰撞调控建模为两阶段自适应过程，突破静态碰撞处理范式
  2. 设计深度感知语义门控（depth-aware semantic gate），越深层重叠要求越高语义证据才可松弛
  3. 提出负载自适应碰撞增强，基于碰撞签名计数对拥挤区域施加更强分离压力
  4. 提出进度自适应目标再平衡，通过线性调度动态调整碰撞正则与协同对齐的优化权重
  5. 工业级验证充分，同时覆盖在线检索 A/B 和离线排序两个核心环节

## 2. 业界进展与相关工作

- **多模态物品表示**：跨模态融合、对比对齐、预训练编码器等方法已大幅提升多模态物品理解能力，但主要输出连续嵌入，无法直接支持离散索引和 token 式生成。SID 学习通过构建紧凑离散标识符弥补这一缺口。

- **SID 学习路线**：
  - **量化方法**：Product Quantization (VQ-Rec)、Residual Quantization (RQ-VAE, QARM)、层次/树结构 tokenization (TIGER)
  - **利用率增强**：GRVQ（组残差 VQ）、Rotation Trick（向量旋转重构）、Improved VQGAN（EMA + cosine 相似度匹配）、SimRQ（线性层解决表征坍缩）、RQ-KMeans
  - **碰撞感知方法**：QuaSID 引入显式碰撞正则化，HiD-VAE 通过层次解耦缓解碰撞
  - **端到端方法**：ETEGRec 通过下游监督端到端学习 SID

- **现有方法的核心局限**：所有碰撞处理方法对重叠的判定标准固定（fixed judgment），对碰撞的响应模式也固定（fixed treatment），缺乏对语义兼容性和训练动态的自适应能力。

- **本文的定位**：首次将 SID 碰撞调控从静态规则升级为自适应过程，同时在"判定何为有害碰撞"和"如何差异化处理碰撞"两个维度引入自适应机制。

## 3. 详细技术方案

### 3.1 整体框架

AdaSID 基于共享编码器 + L 层残差向量量化器（RVQ）+ 解码器的标准 SID 学习管线。输入为由预训练多模态模型提取的物品特征 $x \in \mathbb{R}^d$，经共享编码器 $f_\theta(\cdot)$ 映射为连续表示 $z = f_\theta(x)$，再通过 L 层残差量化得到离散 SID $s = [s^{(1)}, s^{(2)}, \ldots, s^{(L)}]$。训练数据为基于 Swing 等协同信号构造的物品对 $\mathcal{D} = \{(x_i^{\text{tr}}, x_i^{\text{ta}})\}_{i=1}^N$。

前向过程：

$$z_i^{\text{tr}} = f_\theta(x_i^{\text{tr}}), \quad (\hat{z}_i^{\text{tr}}, s_i^{\text{tr}}) = Q(z_i^{\text{tr}}), \quad \tilde{x}_i^{\text{tr}} = h_\phi(\hat{z}_i^{\text{tr}})$$

其中 $Q(\cdot)$ 为 L 层残差量化过程，使用 STE（Straight-Through Estimator）传递梯度。

自适应重叠调控作用于小批量内所有 SID 重叠对：

$$\mathcal{P} = \{(i,j) \mid i \neq j, \, o_{ij} > 0\}$$

其中重叠深度 $o_{ij} = \sum_{l=1}^L \mathbb{I}[s_i^{(l)} = s_j^{(l)}]$。

### 3.2 Stage 1：语义自适应重叠松弛

核心思想：重叠深度越深，松弛所需的语义证据越强。

**语义相似度计算**：

$$\text{sim}_{ij} = \frac{z_i^\top z_j}{\|z_i\|_2 \|z_j\|_2}$$

**深度感知阈值向量**：

$$\boldsymbol{\eta} = [\eta_1, \eta_2, \ldots, \eta_L], \quad \eta_1 \leq \eta_2 \leq \cdots \leq \eta_L$$

浅层重叠仅需较低语义相似度即可松弛，深层重叠需要更高相似度才能被保留。

**松弛门控**：

$$g_{ij} = \mathbb{I}\left(\text{sim}_{ij} \geq \eta_{o_{ij}}\right)$$

当 $g_{ij} = 1$ 时，该重叠对被判定为语义兼容共享，免除碰撞排斥力；当 $g_{ij} = 0$ 时，该重叠被保留为需要调控的有害碰撞，进入第二阶段。

### 3.3 Stage 2：自适应压力分配

#### 3.3.1 负载自适应碰撞增强（空间维）

**碰撞签名**：定义 pair $(i,j)$ 的逐层重叠模式：

$$\kappa_{ij} = [\mathbb{I}[s_i^{(1)} = s_j^{(1)}], \mathbb{I}[s_i^{(2)} = s_j^{(2)}], \ldots, \mathbb{I}[s_i^{(L)} = s_j^{(L)}]]$$

**局部碰撞负载**：统计小批量内共享相同碰撞签名的 pair 数量：

$$c_{ij} = \sum_{(u,v) \in \mathcal{P}} \mathbb{I}(\kappa_{uv} = \kappa_{ij})$$

$c_{ij}$ 越大，表示该离散邻域越拥挤，区分性越弱。

**负载自适应系数**：

$$a_{ij} = g(c_{ij}; f_{\min}, f_{\max}, d_{\max}, \alpha)$$

其中 $g(\cdot)$ 为有界单调递增缩放函数，$f_{\max}$ 控制最大增强倍数，$d_{\max}$ 控制饱和前的有效负载范围，$\alpha$ 控制增长锐度。

#### 3.3.2 进度自适应目标再平衡（时间维）

定义归一化训练进度：

$$\tau = \text{clip}\left(\frac{t - T_{\text{start}}}{T_{\text{end}} - T_{\text{start}}}, 0, 1\right)$$

碰撞权重与协同对齐权重随训练进度动态调整：

$$\lambda_{\text{col}}(\tau) = 1 - (1 - \lambda_{\text{col}}^{\min})\tau, \quad \lambda_{\text{cf}}(\tau) = \lambda_{\text{cf}}^{\max} \cdot \tau$$

设计动机：训练早期 SID 空间不稳定，需要强碰撞正则防止坍缩；训练后期离散结构趋于稳定，应逐步加大推荐对齐的优化权重。

### 3.4 整体训练目标

将各模块整合为统一的自适应碰撞项：

$$\mathcal{L}_{\text{col}}^{\text{ada}} = \sum_{(i,j) \in \mathcal{P}} a_{ij} \cdot (1 - g_{ij}) \cdot \ell_{ij}^{\text{col}}$$

其中基础碰撞惩罚为 margin-based 排斥：

$$\ell_{ij}^{\text{col}} = \max(0, m_{ij} - d_{ij}^c), \quad d_{ij}^c = 1 - \frac{z_i^\top z_j}{\|z_i\|_2 \|z_j\|_2}$$

整体训练目标：

$$\mathcal{L} = \mathcal{L}_{\text{rec}} + \mathcal{L}_{\text{rq}} + \lambda_{\text{col}}(\tau) \cdot \mathcal{L}_{\text{col}}^{\text{ada}} + \lambda_{\text{cf}}(\tau) \cdot \mathcal{L}_{\text{cf}}$$

其中 $\mathcal{L}_{\text{rec}}$ 为重建损失，$\mathcal{L}_{\text{rq}}$ 为标准 RVQ 目标（commitment + codebook loss），$\mathcal{L}_{\text{cf}}$ 为 InfoNCE 式协同对齐损失。推理时 AdaSID 使用标准 SID 管线生成 SID，自适应机制仅作用于训练阶段，不引入额外在线开销。

## 4. 实验设计与结果分析

### 4.1 实验设置

- **离线数据集**：Amazon 2018 Review 数据集中的 Toys & Games（19,412 users, 11,924 items, 905K interactions）和 Beauty（22,363 users, 12,101 items, 1,048K interactions），均采用 5-core 过滤 + leave-one-out 划分
- **特征提取**：Sentence-T5-XXL 提取 768 维文本嵌入
- **下游骨干**：统一使用 TIGER 生成式推荐模型
- **SID 配置**：L=3 层 codebook，每层 K=256 个码字，码字嵌入维度 32
- **评估指标**：Recall@{3,5}、NDCG@{3,5}，以及 SID 空间质量（SID Entropy、Average/Minimum Perplexity、Mean Top-1 Load Ratio）

### 4.2 主实验结果

| Tokenizer | Toys R@3 | Toys N@3 | Toys R@5 | Toys N@5 | Beauty R@3 | Beauty N@3 | Beauty R@5 | Beauty N@5 |
|-----------|----------|----------|----------|----------|------------|------------|------------|------------|
| RQ-VAE | 0.0164 | 0.0142 | 0.0197 | 0.0161 | 0.0161 | 0.0131 | 0.0206 | 0.0149 |
| RQ-OPQ | 0.0176 | 0.0152 | 0.0215 | 0.0178 | 0.0181 | 0.0152 | 0.0225 | 0.0170 |
| Improved VQGAN | 0.0191 | 0.0164 | 0.0224 | 0.0177 | 0.0178 | 0.0146 | 0.0231 | 0.0167 |
| GRVQ | 0.0170 | 0.0147 | 0.0192 | 0.0166 | 0.0189 | 0.0151 | 0.0246 | 0.0179 |
| Rotation Trick | 0.0182 | 0.0157 | 0.0221 | 0.0183 | 0.0193 | 0.0155 | 0.0245 | 0.0180 |
| SimRQ | 0.0191 | 0.0160 | 0.0216 | 0.0175 | 0.0182 | 0.0147 | 0.0236 | 0.0169 |
| RQ-KMeans | 0.0193 | 0.0160 | 0.0271 | 0.0187 | 0.0199 | 0.0151 | 0.0271 | 0.0184 |
| QuaSID | 0.0195 | 0.0157 | 0.0273 | 0.0191 | 0.0201 | 0.0155 | 0.0268 | 0.0186 |
| **AdaSID** | **0.0214** | **0.0175** | **0.0281** | **0.0202** | **0.0205** | **0.0164** | **0.0275** | **0.0190** |

关键发现：
- AdaSID 在所有指标上取得最优，Toys 平均相对提升 6.2%，Beauty 平均相对提升 2.9%
- 相较最强碰撞感知基线 QuaSID，Toys 平均提升 7.4%，Beauty 平均提升 3.1%
- 在 top-3 位置（Recall@3/NDCG@3）的提升尤为显著，表明 AdaSID 对精细粒度区分性提升最大

### 4.3 工业验证

| 评估场景 | 指标 | 提升幅度 |
|----------|------|----------|
| 在线检索 A/B（4天，千万级用户） | GMV | +0.98% |
| 在线检索 A/B | Orders | +0.91% |
| 在线检索 A/B | GPM | +1.16% |
| 离线排序 | Overall CTCVR AUC | +0.05 pp |
| 离线排序 | Scenario-A CVR AUC | +0.05 pp |
| 离线排序 | Cold-start CVR AUC | +0.08 pp |

工业设置：快手电商短视频检索模型，物品特征从图片、文本、关键帧、音频转录等异构信号提取。冷启动 CVR 提升最为显著（+0.08pp），验证了 SID 对长尾/新物品的语义泛化价值。

### 4.4 消融实验与超参数分析

| 数据集 | 变体 | R@3 | N@3 | R@5 | N@5 |
|--------|------|-----|-----|-----|-----|
| Toys | AdaSID (Full) | 0.0214 | 0.0175 | 0.0281 | 0.0202 |
| Toys | w/o SeAR | 0.0192 | 0.0153 | 0.0246 | 0.0175 |
| Toys | w/o PAR | 0.0204 | 0.0169 | 0.0252 | 0.0189 |
| Toys | w/o LAS | 0.0205 | 0.0161 | 0.0271 | 0.0188 |
| Beauty | AdaSID (Full) | 0.0205 | 0.0164 | 0.0275 | 0.0190 |
| Beauty | w/o SeAR | 0.0184 | 0.0149 | 0.0263 | 0.0181 |
| Beauty | w/o PAR | 0.0182 | 0.0147 | 0.0236 | 0.0169 |
| Beauty | w/o LAS | 0.0201 | 0.0161 | 0.0269 | 0.0188 |

消融分析：
- **SeAR（语义松弛）**：在 Toys 上最关键，移除后所有指标降至最低，表明统一碰撞抑制不充分
- **PAR（进度再平衡）**：在 Beauty 上最关键，移除后 Beauty 所有指标为最弱消融变体
- **LAS（负载增强）**：一致但相对温和的贡献，是稳定的"精修"模块
- 三个组件协同配合产生最优效果，验证了两阶段设计的必要性

超参数敏感性：进度自适应再平衡产生最大性能变化幅度，负载自适应增强和语义松弛在较宽参数范围内保持稳定，最优点通常在 moderate-to-strong 区域。

## 5. 关键结论与 Takeaway

1. **碰撞并非全是"噪声"**：语义兼容的重叠是 SID 空间的有益结构，盲目分离反而有害。深度感知门控的成功证明了"分级判定"的价值。

2. **空间+时间双维自适应是有效范式**：仅有空间维度的碰撞增强不够（LAS 消融降幅最小），需要结合训练进度动态调整优化重心。

3. **SID 质量直接影响下游推荐**：在 TIGER 骨干完全固定的前提下，仅改变 tokenizer 即可获得 4.5% 的平均推荐提升，凸显 SID 学习的瓶颈地位。

4. **工业验证的可迁移性**：离线公开数据集的提升可以稳定迁移至工业在线环境（GMV +0.98%），打消了"实验室有效、线上无效"的担忧。

5. **推理无额外开销**：所有自适应机制仅作用于训练阶段，推理时与标准 SID 管线完全一致。

## 6. 局限性与开放问题

1. **门控阈值静态设定**：深度感知阈值向量 $\boldsymbol{\eta}$ 为超参数手工调优，未来可探索可学习的自适应阈值。

2. **仅覆盖物品侧**：AdaSID 仅学习物品 SID，未涉及用户侧离散建模，联合用户-物品 SID 学习是自然扩展。

3. **与生成式推荐器的耦合度有限**：当前为两阶段（SID 预训练 → 下游训练），端到端联合优化可能释放更大潜力。

4. **SID 长度和 codebook 规模未充分探索**：实验仅使用 L=3、K=256 的紧凑配置，更长 SID 和更大 codebook 下的表现未知。

5. **碰撞签名计数的 batch 依赖**：$c_{ij}$ 统计局限于当前 mini-batch，无法捕捉全局碰撞负载分布，可能引入估计噪声。

6. **线性调度的假设**：进度自适应采用线性衰减/增长，实际最优调度曲线可能非线性。

## 7. 应用价值分析

- **直接应用场景**：短视频/电商推荐系统中的物品 SID 预训练。AdaSID 可作为即插即用的 SID tokenizer 提升任何使用 SID 的下游推荐模型（检索、排序、生成式推荐）。

- **对我们工作的启发**：
  - "碰撞不一定有害"的洞察可推广至更广泛的离散表征学习场景
  - 深度感知分级调控的设计理念适用于多粒度 tokenization
  - 进度自适应再平衡策略可迁移至其他多目标联合训练场景
  - 碰撞签名（collision signature）概念提供了分析离散空间拥挤度的新工具

- **工业部署考量**：
  - 训练额外开销来自 batch 内重叠对检测和碰撞签名统计，规模可控
  - 推理零开销，对线上延迟无影响
  - 已在快手电商短视频检索和排序两个核心模块验证

- **推荐评分**：8/10。方法创新明确且系统，工业验证充分，对 SID 学习方向有重要推动。扣分点在于离线数据集规模较小且方法仅覆盖物品侧。

## 8. 关键引用与延伸阅读

- **QuaSID** [12]: Hu et al., 2026. "Stop Treating Collisions Equally: Qualification-Aware Semantic ID Learning for Recommendation at Industrial Scale." — AdaSID 的前序工作和最强基线，引入碰撞资格感知正则化
- **TIGER** [24]: Rajput et al., 2023. "Recommender Systems with Generative Retrieval." NeurIPS 2023 — 生成式推荐代表性骨干，本文统一使用的下游模型
- **RQ-VAE** [15]: Lee et al., 2022. "Autoregressive Image Generation using Residual Quantization." CVPR 2022 — 残差向量量化的基础方法
- **QARM** [20]: Luo et al., 2025. "Quantitative Alignment Multi-Modal Recommendation at Kuaishou." CIKM 2025 — 快手多模态推荐 + RQ-KMeans
- **ETEGRec** [17]: Liu et al., 2025. "Generative Recommender with End-to-End Learnable Item Tokenization." SIGIR 2025 — 端到端 SID 学习
- **Improved VQGAN** [36]: Yu et al., 2022. ICLR 2022 — 码本利用率增强的代表方法
- **Rotation Trick** [7]: Fifty et al., 2025. ICLR 2025 — 向量量化旋转重构最新工作
- **SimRQ** [43]: Zhu et al., 2025. "Addressing Representation Collapse in Vector Quantized Models with One Linear Layer." ICCV 2025

**延伸方向**：
- 联合用户-物品离散建模（User-Item Semantic Codebook）
- 端到端 SID 学习与生成式推荐联合优化
- 更长 SID + 更大 codebook 的可扩展性研究
- 自适应碰撞调控在语音/图像离散 tokenization 中的迁移
