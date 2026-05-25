# GenRec: A Preference-Oriented Generative Framework for Large-Scale Recommendation

## 1. 元信息

| 字段 | 内容 |
|------|------|
| **标题** | GenRec: A Preference-Oriented Generative Framework for Large-Scale Recommendation |
| **作者** | Yanyan Zou, Junbo Qi, Lunsong Huang, Yu Li, Kewei Xu, Jiahao Gao, Binglei Zhao, Xuanhua Yang, Sulong Xu, Shengjie Li |
| **机构** | JD.com, Waseda University |
| **会议** | SIGIR 2026 (Melbourne, Australia) |
| **关键词** | Generative Retrieval, Large-scale Recommender System, Supervised Fine-tuning, Preference Alignment, Semantic ID, GRPO |
| **一句话总结** | JD.com 提出 GenRec——面向工业级推荐的偏好导向生成框架，通过 Page-wise NTP（解决一对多歧义）、Token Merger（2x 序列压缩）和 GRPO-SR 混合奖励 RL（防止 reward hacking），在京东首页信息流推荐线上 A/B 测试中实现点击量 +9.5%、成交量 +8.7% 的显著提升。 |

## 2. 背景与动机

### 2.1 领域现状

现代推荐系统通常采用"检索-排序"多阶段架构。近年来，生成式检索（Generative Retrieval, GR）范式展现了将检索任务统一为条件序列生成问题的潜力——给定用户历史行为序列，模型通过 Next-Token Prediction (NTP) 直接从全语料中生成目标 item。TIGER、LC-Rec、OneRec 等工作已初步验证了该范式的有效性。

### 2.2 未解决的关键问题

将 GR 部署到大规模工业推荐系统时面临三大核心挑战：

1. **分页请求下的一对多歧义**：工业系统通过分页机制处理高并发，同一请求内用户可能与多个 item 产生正向交互（点击、下单）。传统 point-wise NTP 将相同输入配对不同正样本，导致模型拟合均匀混合分布，梯度方差增大，top-K 精度下降。

2. **多 token Semantic ID 的长序列编码成本**：基于 RQ-VAE 的 Semantic ID 将每个 item 映射为多 token 元组（如 3 个 token），使输入序列长度膨胀 3 倍，推理延迟严重超标。

3. **偏好对齐中的 Reward Hacking**：朴素的 RL 对齐容易被模型利用，生成语法上合法但语义无关的 SID 组合以获取高奖励。

### 2.3 本文目标

设计一个统一的 decoder-only 生成推荐框架 GenRec，在单一架构内同时解决上述三个挑战：训练时用 page-wise 监督提供更密集梯度信号，推理时用 Token Merger 压缩序列长度，并通过 GRPO-SR + 混合奖励实现稳定的偏好对齐。

## 3. 核心方法

### 3.1 Semantic ID 构建

采用多模态模型 Qwen2.5-VL 联合编码 item 的视觉外观与文本描述，再通过领域协同对（collaborative pairs）微调 embedding 模型，最后用 RQ K-means 量化为层次化离散 ID：

$$\text{SID}(v_i) = \{s_i^1, s_i^2, s_i^3\}$$

### 3.2 Page-Wise NTP (PW-NTP) SFT

**输入构造**：将用户历史行为序列的 SID 按时序拼接：

$$S_u = [\text{SID}(v) : v \in H]_\succ$$

**Page-wise 监督目标**：目标序列为当前页面内用户交互的 item 列表，按交互强度排序（下单 > 点击 > 曝光）：

$$Y_{\text{page}} = [\text{SID}(v) : v \in O \cup C \cup E]_\succ$$

**训练损失**：标准自回归 SFT loss：

$$\mathcal{L}_{\text{SFT}} = -\sum_{t=1}^{|Y_{\text{page}}|} \log P_\theta(y_t | S_u, y_{<t})$$

**推理时**：仍使用 point-wise beam search，与生产 pipeline 兼容。这种训练-推理不对称设计使模型获得更丰富的梯度信号，同时保持线上 serving 的简洁性。

### 3.3 Token Merger

SID 三元组来自同一 item，因此在 prefilling 阶段通过线性投影将三个 embedding 合并为一个：

$$\mathbf{h}_{v_i} = \text{Linear}(\text{Concat}(\mathbf{e}(s_i^1), \mathbf{e}(s_i^2), \mathbf{e}(s_i^3)))$$

这将 prompt 长度压缩约 2x，特殊分隔 token 保持不压缩。**仅在 prefilling 阶段压缩**，decoding 阶段仍生成完整 SID token 序列以保证检索精度。

### 3.4 GRPO-SR 偏好对齐

#### 奖励公式

使用 SIM-based 模型估计连续偏好分数 $r_i^{\text{pref}} \in [0,1]$，通过 gate 机制抑制 reward hacking：

$$G_i = \mathbb{I}(s_i > \tau)$$
$$r_i = G_i \cdot r_i^{\text{pref}}$$

对 rollout 组内真实正样本进行奖励校准，锚定到组内最大值：

$$\tilde{r}_i = (1 - \mathbb{I}(o_i \in D^+)) \cdot r_i + \mathbb{I}(o_i \in D^+) \cdot r_{\max}$$

#### GRPO-SR 目标函数

$$\mathcal{L}_{\text{GRPO-SR}}(\theta) = -\mathbb{E}\left[\frac{1}{G}\sum_{i=1}^{G}\frac{1}{|o_i|}\sum_{t=1}^{|o_i|}\frac{\pi_\theta(o_{i,t}|S_u, o_{i,<t})}{\text{sg}(\pi_\theta(o_{i,t}|S_u, o_{i,<t}))}\hat{A}_{i,t}\right] - \alpha \cdot \mathbb{E}_{v \sim D^+}\left[\sum_{t=1}^{|v|}\log \pi_\theta(v_t|S_u, v_{<t})\right]$$

第一项为 importance sampling 形式的策略优化；第二项为 NLL 正则化，显式锚定策略到真实用户行为，替代标准 KL 散度惩罚，避免过度优化。

## 4. 实验设计

### 4.1 数据集

来自 JD.com 大规模推荐平台，覆盖约 5.6 亿用户交互序列（一个月数据），最后一天为测试集，其余为训练集。

### 4.2 基线方法

| 类别 | 方法 |
|------|------|
| 传统方法 | BERT4Rec, SASRec |
| 生成方法 | TIGER (NeurIPS 2023), LC-Rec (ICDE 2024) |

### 4.3 评价指标

- HitRate@K (HR@K)
- NDCG@K (N@K)
- Hallucination Rate (HaR): 生成无效 SID 的比例
- Reward Metric (R@K): RL 阶段的 SIM 奖励分数

### 4.4 实验设置

- 骨干模型: Qwen2.5 (1.5B / 3B / 7B)
- 训练: 8× NVIDIA H100 GPU，AdamW 优化器，1% warm-up + cosine decay

## 5. 关键结果

### 5.1 主实验结果

| Model | HR@1 | HR@10 | N@10 | HR@50 | N@50 | HaR↓ |
|-------|------|-------|------|-------|------|------|
| BERT4Rec | 0.0315 | 0.0968 | 0.0412 | 0.1832 | 0.0689 | - |
| SASRec | 0.0383 | 0.1048 | 0.0492 | 0.1976 | 0.0776 | - |
| TIGER | 0.0518 | 0.1660 | 0.0803 | 0.3556 | 0.1409 | 15.46% |
| LC-Rec | 0.0947 | 0.3669 | 0.2146 | 0.6226 | 0.2717 | 7.80% |
| **GenRec** | **0.1189** | **0.4456** | **0.2635** | **0.7192** | **0.3247** | **4.96%** |
| GenRec w/o TM | 0.1193 | 0.4467 | 0.2653 | 0.7201 | 0.3276 | 4.89% |

GenRec 相比 LC-Rec 在 HR@50 上提升 15.5%，HaR 下降 36.4%。Token Merger 去除后性能几乎不变，证明压缩不损失精度。

### 5.2 Scaling Law

| Model Size | HR@1 | HR@10 | N@10 | HR@50 | N@50 | HaR↓ |
|-----------|------|-------|------|-------|------|------|
| 1.5B | 0.1077 | 0.4103 | 0.2484 | 0.6527 | 0.1885 | 5.34% |
| 3B | 0.1189 | 0.4456 | 0.2635 | 0.7192 | 0.3247 | 4.96% |
| 7B | 0.1221 | 0.4483 | 0.2649 | 0.7216 | 0.3269 | 5.42% |

3B→7B 的增益边际递减，作者认为 3B 模型更深更窄（36 layers, 2048 hidden）比 7B（28 layers, 3584 hidden）更适合推荐任务，验证了"capacity density"假说。

### 5.3 RL 对齐结果

| Model | HR@50 | R@1 | R@10 | R@50 | HaR↓ |
|-------|-------|-----|------|------|------|
| GenRec (Base SFT) | 0.7192 | 0.1027 | 0.1519 | 0.1776 | 4.96% |
| GRPO | 0.7248 | 0.1177 | 0.1650 | 0.1861 | 6.03% |
| **GRPO-SR** | **0.7438** | **0.1212** | **0.1679** | **0.1892** | **2.68%** |
| GRPO w/o G | 0.6975 | 0.1045 | 0.1608 | 0.1797 | 1.75% |

GRPO-SR 在 R@1 上相对 SFT 提升 18.01%，同时 HaR 降至 2.68%。去除 Gate 导致 HR@50 下降 + reward 提升 = 典型 reward hacking。

### 5.4 线上 A/B 测试

| Setting | Exposure Rate | Click Count | Transaction Count |
|---------|--------------|-------------|-------------------|
| GenRec (Base SFT) | 48.7% | +8.5% | +7.3% |
| + GRPO-SR | 57.3% | **+9.5%** | **+8.7%** |

长尾 item 表现更佳：曝光率 +10%，点击量 +16%，成交量 +13%。GenRec with GRPO-SR 已全量上线。

## 6. 优势与局限

### 优势

1. **端到端统一架构**：在单一 decoder-only 模型中完成用户意图理解与 item 检索，消除多阶段 pipeline 的信息损失
2. **PW-NTP 创新**：优雅解决分页机制下的一对多歧义，HaR 降低超 50%
3. **Token Merger 实用性**：零精度损失下压缩 2x 序列，显著降低推理成本
4. **GRPO-SR 稳定对齐**：NLL 正则 + Gate 机制双重防护 reward hacking
5. **大规模工业验证**：5.6 亿用户数据训练，一个月线上 A/B 测试，已全量部署

### 局限

1. **论文篇幅限制**（6 页 short paper），缺少对 PW-NTP 中不同交互类型权重的深入分析
2. **Scaling Law 分析**仅限于 1.5B-7B 范围，未探索更大规模（如 14B+）
3. **SID 构建依赖 Qwen2.5-VL**，对无图文模态的场景适用性未讨论
4. **RL 阶段的计算成本**（rollout 数量、训练时长）未详细报告
5. **未讨论新 item 冷启动**时 SID 的更新策略

## 7. 对工作的启发

1. **PW-NTP 范式创新**：为《生成式推荐》书中"训练目标设计"章节提供了从 point-wise 到 page-wise 的演进路径，揭示了工业分页机制对生成式推荐的独特约束
2. **Token Merger 的通用性**：压缩多 token SID 的思路可推广到所有使用 RQ-based 编码的生成式推荐系统，是效率优化的关键技术
3. **GRPO-SR 的工业对齐方案**：NLL 正则替代 KL 散度锚定真实行为的思路，对推荐系统中的偏好对齐具有广泛参考价值
4. **Scaling Law 的"capacity density"发现**：对推荐场景下模型选型提供了反直觉的经验——更深更窄可能优于更宽更浅
5. **Reward Hacking 防护机制**：Gate + 正样本校准的组合方案，是 RL-for-Rec 的重要工程实践

## 8. 参考文献精选

| 文献 | 与本文关系 |
|------|-----------|
| TIGER (Rajput et al., NeurIPS 2023) | 生成式推荐基础工作，本文基线之一，提出 RQ-VAE 编码 SID |
| LC-Rec (Zheng et al., ICDE 2024) | 协同语义融合的 SID 方法，本文核心基线 |
| OneRec (Zhou et al., 2025) | JD 同组工作，迭代式 RQ K-means 构建高效 SID |
| DeepSeekMath GRPO (Shao et al., 2024) | GRPO 算法来源，本文将其适配到推荐场景 |
| HSTU (Zhai et al., 2024) | Meta 生成式推荐的效率优化方案，用 gated linear recurrence 替代 attention |
| MTGR (Han et al., CIKM 2025) | 美团工业级生成推荐框架，与 GenRec 属同期工业实践 |
| LETTER (Wang et al., 2025) | 端到端优化 codebook 的 SID 学习方法 |
| Densing Law (Xiao et al., 2025) | "capacity density"假说来源，支撑本文 scaling 分析 |
