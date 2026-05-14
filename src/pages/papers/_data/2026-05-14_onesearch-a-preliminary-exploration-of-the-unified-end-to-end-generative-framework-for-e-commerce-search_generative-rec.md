---
原文件: "OneSearch.pdf"
title: "OneSearch: A Preliminary Exploration of the Unified End-to-End Generative Framework for E-commerce Search"
authors: "Ben Chen, Xian Guo, Siyuan Wang, Zihan Liang, Yue Lv, Yufei Ma, Xinlong Xiao, Bowen Xue, Xuxin Zhang, Ying Yang, Huangyu Dai, Xing Xu, Tong Zhao, Mingcan Peng, Xiaoyang Zheng, Chao Wang, Qihang Zhao, Zhixin Zhai, Yang Zhao, Bochao Liu, Jingshan Lv, Xiao Liang, Yuqing Ding, Jing Chen, Chenyi Lei, Wenwu Ou, Han Li, Kun Gai"
affiliation: "Kuaishou Technology, Beijing, China"
year: "2025"
venue: "arXiv preprint"
category: "生成式推荐"
abstract: "提出快手电商搜索端到端生成式框架OneSearch，通过KHQE模块、多视角行为序列注入和偏好感知奖励系统，解决多阶段级联架构的算力碎片化和目标冲突问题，并在工业级真实场景取得显著业务增长。"
tags: ["生成式推荐", "生成式搜索", "端到端系统"]
Hash: "c5aa16f4b864f5d0"
RecRatio: "8"
Team: "快手搜索团队"
Reason: "工业界极具代表性的端到端生成式电商搜索架构落地，打破传统漏斗式推荐局限的里程碑工作。"
精读日期: "2026-05-14"
报告字数: "约 2500 字"
---

## 1. 摘要与核心贡献

- **研究问题**：本文主要解决传统电商搜索系统长期采用的"多阶段级联架构（MCA，即召回-粗排-精排）"所固有的两个核心痛点：一是跨阶段的算力碎片化（计算资源大量消耗在通信和存储上），二是各阶段优化目标冲突（前排漏斗可能丢弃后续真正需要的目标商品），导致搜索系统性能的天花板受限。
- **动机**：尽管近年来基于大语言模型的生成式检索（GR）在推荐系统（如基于Semantic IDs的检索）中取得初步进展，但在电商搜索场景下，强Query-Item相关性要求以及海量无关冗余信息的干扰，使得单纯的生成式模型往往表现不佳，亟待建立一套统一且能兼顾相关性与商业转化目标的生成式搜索架构。
- **方法概要**：本文提出OneSearch框架，是首个在工业界真实落地并部署的电商搜索端到端生成式框架，摒弃传统多阶段漏斗，通过查询-物品的联合量化、用户历史行为的多视角建模以及自适应的强化奖励学习直接输出目标商品。
- **主要结果**：离线评估在真实日志上大幅超越传统在线MCA模型，在线A/B测试中取得曝光商品点击率 $+1.67\%$、转化率 $+3.14\%$、买家数 $+2.40\%$、订单量 $+3.22\%$ 的显著提升，且将操作支出（OPEX）降低了 $75.40\%$，模型算力利用率（MFU）从 $3.26\%$ 提升至 $27.32\%$。
- **核心贡献**：
  - 提出了关键字增强的层级量化编码（KHQE），保留层次语义与商品独有属性，强化了查询与商品的相关性约束。
  - 引入多视角用户行为序列注入策略，结合长短期隐式与显式行为，全方位建模用户个性化偏好。
  - 提出了偏好感知奖励系统（PARS），利用多阶段监督微调和基于真实反馈的自适应奖励加权进行List-wise对齐。
  - 在快手商城实现了端到端生成式搜索的全面工业落地验证。

## 2. 业界进展与相关工作

- **领域发展脉络**：电商搜索系统过去十年主要由多阶段级联架构（MCA）主导。近年来，随着Transformer和LLM的发展，生成式检索（Generative Retrieval, GR）逐渐兴起，模型通过生成商品ID取代传统的双塔向量召回与排序，比如早期的 DSI、Tiger 等将推荐建模为序列生成任务。
- **主要技术路线对比**：
  - **传统级联架构（MCA）**：依次执行召回（如EBR）、粗排（如DCN）和精排（如DIN）。虽然效率高，但会发生级联错误，前置阶段一旦过滤掉相关商品，后续排序再精准也无力回天。
  - **基于大语言模型的推荐**：通过生成描述文本进行匹配（如LC-REC），或单纯生成 Semantic ID（如 OneRec）。在推荐域有效，但在具备强语义相关性要求的搜索场景泛化不足。
- **最相关的前序工作**：
  - **Tiger (NeurIPS 2023)**：首次在推荐系统引入生成式检索，使用VQ-VAE构建Semantic IDs。OneSearch在此基础上针对搜索的强相关性约束改进了量化方法（引入RQ-OPQ与核心关键词）。
  - **OneRec (2025)**：快手团队前置工作，将生成式推荐在短视频场景中落地。OneSearch则是将其延伸至更具挑战性的电商搜索系统，面临文本噪声大、Query-Item约束更强的问题。
  - **OneSug (2025)**：提出生成式Query推荐，解决了搜索意图补全问题，但未能解决直接搜索返回Item的端到端生成。
- **本文的定位**：本文填补了端到端生成式检索在"电商搜索（E-commerce Search）"场景中的空白，解决了强文本相关性、长尾用户理解与工业级在线部署效率三大核心痛点。

## 3. 详细技术方案

### 3.1 整体框架

OneSearch 采用经典的 Encoder-Decoder Transformer 架构（如 BART/mT5），统一了查询理解、召回和排序的整个生命周期。
其输入包含用户的独立特征、当前 Query 及对应的 Semantic ID (SID)、短期显式行为序列（搜索和点击历史）以及长期隐式行为序列表征。Decoder 利用 Beam Search 直接自回归生成符合用户意图和商业价值的商品 SIDs 序列，通过映射还原为真实展示商品。

### 3.2 关键模块详解

#### 3.2.1 关键字增强层级量化编码（KHQE）
- **作用**：解决商品文本信息冗余、无序且容易在单一RQ-VAE量化中丢失核心独立属性的问题，从而保障 Query 和 Item 强相关性。
- **技术细节**：
  - **对齐表示学习**：基于真实点击/订单构建正负样本，用BGE提取内容Embedding，并通过四种对比学习损失（$L_{q2q}$, $L_{i2i}$, $L_{q2i}$, $L_{rank}$, $L_{rel}$）实现协同和语义的初步对齐。
  - **核心关键词增强**：利用 NER 提取18种核心属性（如品牌、材质），并通过 Qwen-VL 等提取关键词表示，融入商品特征，使编码过程受核心关键词主导，得到 $e_q^o$ 与 $e_i^o$。
  - **RQ-OPQ量化**：传统 RQ-Kmeans（如 $4096-1024-512$）能捕捉层次聚类语义，但会截断残差导致商品独特特征丢失。本文叠加 OPQ（Optimized Product Quantization），即前 3 层使用 RQ-Kmeans，最后 2 层使用 OPQ 量化残差。这极大提升了码本利用率（CUR）和独立编码率（ICR）。
- **设计动机**：RQ 保证粗粒度语义（防类目漂移），OPQ 保留商品的差异化特征（防相似度碰撞）。

#### 3.2.2 多视角用户行为序列注入（Mu-Seq）
- **作用**：让生成式模型在给定 Query 的同时，深度理解用户的短期意图和长期画像。
- **技术细节**：
  - **基于行为的 User ID**：摈弃随机 Hash，直接利用用户最近点击的商品 $s_i$ 构建带有时间衰减权重的 User ID：
    $$
    SID_{\text{short}} = \lceil \sum_{i=1}^{m} \lambda_i \cdot SID_{s_i} \rceil, \quad \lambda_i = \frac{\exp(\sqrt{i})}{\sum \exp(\sqrt{i})}
    $$
  - **显式短期序列**：将最近搜索过的 Query SID 和点击的 Item SID 作为 Prompt 的一部分直接拼接。
  - **隐式长期序列**：长期行为（点击、订单、RSU）太长无法塞进 Prompt，因此对长期序列的每一项查询其 RQ 聚类中心向量，并聚合后输入 Q-Former：
    $$
    Q = \text{QFormer}(M_{\text{click}}, M_{\text{order}}, M_{\text{RSU}})
    $$
    这里的 $Q \in \mathbb{R}^{NM \times d_{\text{model}}}$ 最终作为特征融入 Encoder。

### 3.3 训练策略与优化 (PARS)

- **多阶段监督微调 (SFT)**：
  - *Phase 1 (Semantic Alignment)*：用 Query 文本生成对应 SID，用 SID 还原文本或预测类别，使得模型对 SID 具备文本层面的理解能力。
  - *Phase 2 (Co-occurrence Synchronization)*：根据历史共现日志，不带用户特征地做 Query 预测 Item SID 的任务，注入协同信号。
  - *Phase 3 (User Personalization)*：加入用户多视角特征（短期、长期序列）做个性化的端到端预测，配合 Sliding Window Data Augmentation，使模型适应变长的行为序列。
- **自适应奖励系统 (Adaptive Reward System)**：
  - 构建6级层级行为打分（订单=2.0，推荐订单=1.5，点击=1.0，展示未点=0.5等），并考虑 CTR/CVR 平滑对 Reward 进一步修正。
  - 训练一个多目标 Reward Model（预测 CTR、CVR、CTCVR 和相关性 $S_{Rel}$）。
  - **List-wise DPO 对齐**：结合 SFT 模型的 Log-likelihood 与 Reward Model 算出的偏好差异 $r_{w\Delta}$，进行 List-wise 的 DPO 强化学习：
    $$
    L = -\mathbb{E}\left[\log \sigma \left( \log \sum_{i_l \in I_l} \exp \left( \frac{r_{w\Delta}}{\max(0, \hat{r}_\theta(x_u, i_w) - \hat{r}_\theta(x_u, i_l) - \delta)} \right) + \alpha \log \pi_\theta(i_w \mid x_u) \right) \right]
    $$

### 3.4 推理/部署策略

- 线上部署时采用 Encoder-Decoder (BART) 架构，利用 512 的 Beam Search 并行解码，输出多条 SIDs，并通过 Trie 树强约束生成的 SID 是合法的商品。
- 系统极大地降低了链路复杂度，从传统几十个模型缩减为一个端到端生成模型。

## 4. 实验设计与结果分析

### 4.1 实验设置
- **数据集**：快手商城搜索2025年5月到8月的真实用户搜索与点击订单日志（约 1B PVs），前90天训练，最后1天测试。
- **基线方法**：真实的线上多阶段系统 (Online MCA)。
- **评估指标**：主要考察 HR@350 和 MRR@350。

### 4.2 主实验结果
| Method | Order HR@350 | Order MRR@350 | Click HR@350 | Click MRR@350 |
|---|---|---|---|---|
| Online MCA | 51.74% | 19.26% | 64.40% | 16.89% |
| OneSearch (RQ-OPQ + RS) | **66.46%** | **18.38%** | **71.06%** | **16.33%** |

- **结果分析**：在 HR@350（召回率）上，OneSearch 大幅领先传统 MCA 架构，体现出克服漏斗过滤效应的巨大优势。在 MRR@350（排序精度）上，OneSearch 能够逼近乃至部分超越集成了上千个特征的复杂 MCA 精排模型。

### 4.3 消融实验
- **多视角序列**：去掉显式短期序列会导致 HR 下降 3.43%，MRR 下降 1.53%，说明短期历史对猜测搜索意图极为关键。去掉隐式长序列，HR 下降 2.26%。
- **量化策略 (RQ-OPQ)**：单独使用 RQ-Kmeans ($4096-1024-512$) 在 ICR（独立编码率）上仅有 43.32%，而加入了残差 OPQ 补充后，ICR 飙升至 91.91%，极大地缓解了哈希碰撞。如果 OPQ 层数加多到 4 组以上，由于序列过长，反而导致解码性能崩溃。

### 4.4 其他分析
- **在线A/B测试**：在快手商城线上进行 A/B 测试。对比无精排模块的降级 MCA，买家数提升 28.78%；而对比全量上线 MCA，最优版 OneSearch ($OneSearch_{RM}^2$) 的 Item CTR 提升 1.67%，PV CVR 提升 1.78%，订单量提升 3.22%。人工评估显示相关性和页面好评率均提升 $1\%$ 左右。
- **硬件效率**：模型算力利用率 (MFU) 由 $3.26\%$ 提升到 $27.32\%$；得益于无需维护巨大的多层级通信特征库，操作开销（OPEX）降低了 $75.40\%$。

## 5. 关键结论与 Takeaway

- **自述贡献简评**：论文提出的 KHQE 量化方案与端到端 DPO 框架解决了电商强相关性的痛点，成功打破了 MCA 天花板，其线上数据的跃升证实了生成式搜索走向业务核心的可行性。
- **Takeaways**:
  1. **单纯的 RQ-VAE/RQ-Kmeans 无法胜任商品精细化检索**：由于容易丢失长尾细粒度特征，必须结合 OPQ 进行残差量化，才能保证同类商品不会被编码为完全相同的 SID（高可信）。
  2. **端到端生成式推荐的排序能力可通过 DPO 补齐**：传统认为 GR 模型排序弱，但引入真实互动反馈（如曝光未点、点击未买、订单）构建的 List-wise DPO，能让 GR 模型内化精排能力（高可信）。
  3. **长短期行为的异构注入法**：长序列用向量聚类隐式注入 Transformer，短序列直接作为显式 Token 输入，这种解耦能在受限窗口内最大化用户兴趣特征利用率。

## 6. 局限性与开放问题

- **方法局限**：模型严重依赖预定义的 Codebook。随着每日百万级的新增商品，静态 Codebook 的覆盖能力会衰退。虽然本文称 RQ-OPQ 对新物品有一定容忍度，但在线实时 SID 编码仍未完全解决。
- **工业落地挑战**：512 的 Beam Search 虽然提升了召回，但在高并发场景下的生成时延对基础设施提出了极大考验。
- **开放问题**：如何引入包含视觉和视频的模态信息进入 SID？如何在线动态扩展 Codebook 避免定期全量重构？

## 7. 应用价值分析

- **技术可借鉴性**：RQ-OPQ 的串联编码思路非常值得采纳；基于真实展现/点击/订单的三级 Label 进行 Reward 打分和 List-wise DPO，可无缝移植到任何生成式排序或推荐系统中。
- **适用场景**：具备千万级 Item 规模、强调强语义约束且当前多阶段漏斗存在严重 Gap 的业务场景（如垂类搜索、广告匹配）。
- **改造建议**：落地需配套高性能的近似检索库与 Beam Search 解码器，并设计稳定每日滚动的 Tokenizer 更新流水线。
- **ROI 评估**：**高**。端到端架构虽然模型本身消耗 GPU 算力增大，但在大厂基础架构下，省去的百 TB 级特征流转通信开销足以抹平硬件成本（降本 $75\%$）。

## 8. 关键引用与延伸阅读

- *Recommender Systems with Generative Retrieval (Tiger)*, Rajput et al., 2023. (NeurIPS) 
  - 奠基之作，提出了Semantic ID生成式推荐的原型。
- *OneRec: Unifying Retrieve and Rank with Generative Recommender and Iterative Preference Alignment*, Deng et al., 2025.
  - 本文的前置工作，快手在短视频推荐领域落地的生成式框架。
- *OneSug: The Unified End-to-End Generative Framework for E-commerce Query Suggestion*, Guo et al., 2025.
  - 快手另一并行工作，解决了生成式Query推荐的问题。
