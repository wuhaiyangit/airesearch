---
原文件: "2605.05803v1.pdf"
title: "Unified Value Alignment for Generative Recommendation in Industrial Advertising"
authors: "Xinxun Zhang, Yuling Xiong, Jiale Zhou, Zhengkai Guo, Zhennan Pang, Junbang Huo, Jingwen Wang, Xuyang Sun, Enming Zhang, Jiaguang Jin, Changping Wang, Yi Li, Jun Zhang, Xiao Yan, Jiawei Jiang, Jie Jiang"
affiliation: "Wuhan University, China; Tencent Inc., China; Peking University, China"
year: "2026"
venue: "arXiv preprint (submitted May 2026)"
category: "生成式推荐"
abstract: "提出UniVA统一价值对齐框架，通过Commercial SID、Generation-as-Ranking解码器和价值引导个性化Beam Search三大模块，在SID构建、自回归解码和在线服务三阶段一致性地注入商业价值信号，解决广告生成式推荐中语义生成与商业目标不一致的问题，在腾讯微信视频号广告平台实现HR@100提升37.04%和线上GMV提升1.5%"
tags: ["generative-rec", "advertising", "commercial-value-alignment", "semantic-ID"]
Hash: "b9c4cbb806a28bf1"
RecRatio: "7"
Team: "Wuhan University + Tencent Inc. + Peking University"
Reason: "首次系统性提出生成式广告推荐中的'价值不一致'问题并给出全链路解决方案，将商业价值信号统一嵌入tokenization/decoding/serving三阶段，对广告GR系统的工程实践有较强指导意义"
精读日期: "2026-05-14"
报告字数: "约 3500 字"
---

## 1. 摘要与核心贡献

- **研究问题**：生成式推荐（GR）在广告场景落地时，系统需同时优化用户兴趣与商业价值（eCPM/GMV），但现有GR pipeline的tokenization、decoding和online serving三个阶段中，商业价值信号建模不一致，导致语义生成与商业目标脱节。

- **动机**：现有GR方法在SID构建阶段仅保留语义相似性，自回归解码阶段被语义likelihood主导，在线服务阶段依赖额外的value ranking模块。这三个层面的"价值不一致"（value inconsistency）使得商业上有前途的SID路径在早期解码步骤就被剪枝，后续无法恢复。

- **方法概要**：UniVA（Unified Value Alignment）框架包含三个核心模块：
  1. Commercial SID Tokenization：将商业属性注入SID最后一层
  2. Generation-as-Ranking SID Decoder：双头解码器联合SL与eCPM-aware RL
  3. Value-Guided Personalized Beam Search：个性化trie树约束 + 融合logits作为beam评分

- **主要结果**：
  - 离线 HR@100 相对基线提升 37.04%
  - ValueHR@100 提升 37.01%，wNDCG@100 提升 26.20%
  - SID路径内bid方差和范围降低约一个数量级
  - 线上A/B测试 GMV 提升 1.5%

- **核心贡献**：
  1. 首次系统定义GR广告系统的"价值不一致"问题，识别tokenization/decoding/serving三层缺陷
  2. 提出Commercial SID：classify-then-bin策略将商业属性注入SID空间
  3. 提出Generation-as-Ranking解码器：SL + eCPM-aware RL联合优化
  4. 提出Value-Guided Personalized Beam Search：个性化trie树 + 融合logits在线服务

## 2. 业界进展与相关工作

- **领域发展脉络**：GR从proof-of-concept演进到工业级系统，核心思路是将推荐重新定义为next-token生成问题。SID作为关键桥梁，将海量item压缩为离散token序列。近期，GR已在搜索、电商、内容推荐等场景落地，并开始向广告场景延伸。

- **主要技术路线对比**：
  - 语义SID路线：RQ-based tokenization保留语义相似性（VQ-Rec, TIGER等）
  - 端到端SID生成：End-to-End Semantic ID Generation直接在广告环境中学习SID
  - 广告GR系统：GPR（统一tokenization + 模型架构）、EGA-v2（端到端生成框架）、LLaTTE（多阶段序列建模）
  - 价值建模：Value-aware Recommendation、profit-aware learning、多目标推荐

- **最相关的前序工作**：
  - GPR [26]：UniVA的直接前序工作，提出统一的GR广告推荐范式，包含RQ-Kmeans+ tokenizer和HSTU encoder
  - MCTS-PPO [10]：提供value-guided structured sampling方法
  - EGA-v2 [28]：端到端生成式广告框架

- **本文的定位**：不同于前序工作只在某一阶段或以辅助目标方式引入商业信号，UniVA将value视为全pipeline建模原则，在tokenization/decoding/serving三个阶段一致性地注入商业价值。

## 3. 详细技术方案

### 3.1 整体框架

UniVA采用三级SID结构，整体流程：
1. **Tokenization**：前 $L-1$ 层使用RQ-Kmeans+保留语义结构，最后一层使用Commercial SID注入商业属性
2. **Training**：HSTU encoder编码用户/环境/历史，双头SID decoder先SL再SL-RL交替训练
3. **Serving**：个性化trie树约束valid路径 + 融合generation-ranking logits作为beam评分

输入token分为四组：User Token (U)、Organic Token (O)、Environment Token (E)、Item Token (I)。

### 3.2 关键模块详解

**Commercial SID Tokenization**

核心公式：$(s^1_i, \ldots, s^{L-1}_i) = \Phi_{sem}(x^s_i)$，$s^L_i = \Phi_{com}(x^c_i)$

构建步骤：
1. **属性空间压缩**：
   - 优化目标（OG）：保留覆盖99%数据的值，长尾按bid分布相似性聚类，得25类
   - ROI：保留覆盖99%数据的值，长尾合并为1个fallback类，得8类
   - 行业：保留覆盖75%数据的top-9一级行业，长尾合并，得10类

2. **Value-Aware离散化**：
   - 组合键：$k_i = (x^{o'}_i, x^{r'}_i, x^{ind'}_i)$
   - 对每个组合键内的bid做等频分箱（equi-frequency binning）
   - 分箱数在 $n_{max}=25$ 和 $n_{min}=3$ 之间，优化加权熵 $H = \sum_{k \in \mathcal{K}} w_k H_k$
   - 最终词表预算 $V \leq 2048$

最优策略为 Classify-then-Bin + Equal-frequency，加权熵 $H=7.487$，词表 $V=1939$。

**Generation-as-Ranking SID Decoder**

架构组成：
- Cross-Attention：SID hidden states作为query，encoder输出作为key/value
- Causal Self-Attention：组织已生成的SID token
- Sparse MoE：64个expert，激活top-16，每个expert hidden dim=128
- MoR（Mixture-of-Recursions）：共享middle block递归复用增加有效深度

双头设计：
- Generation Head $f_{gen}$：产出vocabulary-level生成分数
- Value Head $f_{value}$：产出vocabulary-level商业价值分数
- 融合：$\tilde{\pi}_\theta(\cdot \mid s^{<l}, h) = \text{Softmax}(\text{Fuse}(o^{(l)}_{gen}, o^{(l)}_{value}))$
- Fuse实例化为element-wise summation

**eCPM-aware Reinforcement Learning**

- SL阶段学到的generation head直接复用为RL的policy head
- Value head优化为critic
- Reward来自生产环境pCTR/pCVR模型的eCPM估计
- 轨迹收集：beam search + MCTS-PPO（value head作为node evaluator）
- MCTS-PPO的action选择：$a^\star = \arg\max_{a \in \mathcal{A}(n)} \left[ \bar{Q}(n,a) + c\sqrt{\frac{\log N(n)}{1+N(n,a)}} \right]$
- Reward归一化：$\bar{R}^{(k)} = \frac{R^{(k)}_{eCPM} - \mu_R(h)}{\sigma_R(h) + \epsilon_r}$
- PPO clipped objective + value regression loss
- 采样策略：从固定5%升级为基于历史学习难度和预测熵的自适应采样

### 3.3 训练策略与优化

- 联合优化：$\mathcal{L}_{train} = \mathbb{I}_{SL} \mathcal{L}_{SL} + \mathbb{I}_{RL} \mathcal{L}_{RL}$
- SL batch更新shared decoder + generation head
- RL batch更新fused policy + value head
- SL和RL batch交替进行
- 优化器：Adam，lr=0.001，batch size=16
- 输入序列长度：2048
- 模拟器基于近期生产快照构建，复现候选库存、特征管线、业务约束和下游ranking stack

### 3.4 推理/部署策略

Value-Guided Personalized Beam Search：

1. **全局trie树构建**：在候选inventory的feasible SID路径上构建
2. **个性化剪枝**：$\mathcal{T}_u = \Gamma^{(u)}(\mathcal{T})$，应用targeting/availability/creative规则
3. **Valid next-token集合**：$\mathcal{V}(s^{<l}; \mathcal{T}_u) = \{s^l \in \mathcal{S}_l \mid s^{\leq l} \in \mathcal{P}(\mathcal{T}_u)\}$
4. **Value-guided beam评分**：$\text{Score}(s^{\leq l}) = \sum_{t=1}^{l} \text{Fuse}(o^{(t)}_{gen}, o^{(t)}_{value})[s_t]$

效果：beam width=300时，有trie树产出300条valid路径，无trie树仅48条（16%）。无需额外value ranking模块。

## 4. 实验设计与结果分析

### 4.1 实验设置

- **数据集**：腾讯大规模广告语料，混合广告与有机内容（短视频、社交feed、新闻），80%训练/20%测试
- **SID配置**：三级SID，codebook size=2048
- **解码器**：4层，embedding dim=256，MoE 64 experts / top-16
- **基线**：GPR + vanilla decoder-only Transformer
- **指标**：HR@K、ValueHR@K、wNDCG@K、GMV、GMV(normal)

### 4.2 主实验结果

| 模型 | Parameters | FLOPs | $\Delta$HR@100 |
|------|-----------|-------|------------|
| GPR+SID Decoder | 3M | 4.1G | +0.0% |
| + Commercial SID | 3M | 4.1G | +5.78% |
| + (layer2-layer4) | 7M | 7.1G | +6.10% |
| + MoR | 5M | 7.1G | +13.56% |
| + Sparse MoE | 60M | 8.5G | +18.40% |
| UniVA (Full) | 80M | 23.2G | +37.04% |

关键发现：
- Commercial SID不增加参数/计算即可获得5.78%提升
- 解码器scaling呈现清晰趋势：deeper(6.10%) < MoR(13.56%) < Sparse MoE(18.40%)
- Full UniVA通过eCPM-aware RL和联合优化进一步将增益扩大到37.04%

### 4.3 消融实验

**Value对齐性能**（GMV-weighted next-conversion set）：
- 2*2048 SID + CSID在大部分cutoff上表现最优
- ValueHR@100达到0.0677，wNDCG@100达到0.0554
- 中等codebook(2048)比大codebook(8192)更适合value modeling

**Commercial SID质量分析**：
- 引入CSID后，SID路径内bid标准差和bid range在Mean/P75/P99上均降低约一个数量级
- 说明同一SID路径下的item在商业价值上更加一致

**Commercial SID策略对比**：
- Classify-then-Bin + Equal-frequency最优：$H=7.487$，$V=1939$
- Direct Binning忽略结构化属性，分区粗糙
- Cluster-then-Bin稳定性较差
- Equal-width对长尾bid分布敏感

**Codebook Size分析**：
- 2*2048 SID + CSID在HR@1到HR@100全面领先（相对提升30%-55%）
- 2*8192 SID + CSID反而弱于3*8192 SID，因为CSID词表固定为2048，与8192语义设置不匹配

### 4.4 其他分析

**线上A/B测试**（2026年3月7-11日，5%流量）：

| 版本 | GMV Lift | GMV(normal) Lift |
|------|----------|-----------------|
| v1 w/o Generation-as-Ranking | +1.03% | +1.17% |
| v2 with Generation-as-Ranking | +1.50% | +1.42% |

- 即使不用generation-as-ranking，Commercial SID + SID decoder已能带来正向收益
- 引入generation-as-ranking后，GMV增益从1.03%提升至1.50%

**Personalized Beam Search效率**：
- 相同beam width=300下，有trie树产出300条valid路径 vs 无trie树仅48条
- trie树节省搜索资源，将beam预算集中于可行路径

## 5. 关键结论与 Takeaway

- **论文自身宣称的贡献**：
  1. 系统性定义GR广告系统的"价值不一致"问题
  2. Commercial SID提供value-discriminative token空间
  3. Generation-as-Ranking实现真正的"生成即排序"
  4. Value-Guided Personalized Beam Search实现单pass value-aware在线服务

- **最有价值的 3-5 个 Takeaway**：
  1. **全链路value alignment是关键**：商业价值不应是generation之后的附加信号，而应从tokenization阶段就嵌入，且在decoding和serving阶段保持一致
  2. **SID最后一层是商业属性注入的自然位置**：上层保语义、底层注入value的分层设计既保留了语义粗粒度组织，又实现了细粒度商业区分
  3. **Generation-as-Ranking消除了generate-then-rerank的额外成本**：双头设计使得生成和排序在同一个解码过程中完成
  4. **个性化trie树是GR在线服务的关键基础设施**：在beam width=300下可将valid路径覆盖率从16%提升至100%，大幅减少无效计算
  5. **SID decoder呈现清晰的scaling behavior**：MoE/MoR等结构在广告GR中有明显收益，暗示decoder capacity是当前瓶颈之一

## 6. 局限性与开放问题

- **方法局限**：
  - Commercial SID词表固定为2048，与大codebook(8192)不匹配，缺乏自适应词表扩展机制
  - eCPM reward依赖生产pCTR/pCVR模型的质量，可能引入bias
  - Fuse策略仅为element-wise summation，缺乏对generation和value分数之间trade-off的动态调控

- **实验局限**：
  - 仅在腾讯微信视频号广告平台验证，未在其他广告平台/场景泛化测试
  - 线上A/B仅5天5%流量，时间跨度和流量比例较小
  - 缺乏与其他广告GR方法（如EGA-v2、LLaTTE）的直接对比

- **工业落地挑战**：
  - Full UniVA decoder达80M参数/23.2G FLOPs，对serving latency有挑战
  - 模拟器与真实环境的gap（sim-to-real gap）可能影响RL效果
  - 个性化trie树的实时更新和维护成本

- **开放问题**：
  - 如何让Commercial SID自适应动态变化的广告生态（新广告主、新行业）？
  - Generation-as-Ranking中generation和value的最优融合权重是否应该是动态的？
  - 能否将value alignment的思路推广到非广告但需多目标优化的推荐场景？

## 7. 应用价值分析

- **技术可借鉴性**：
  - Commercial SID的"classify-then-bin"策略可直接移植到任何需要在SID中注入辅助信号的场景
  - 双头Generation-as-Ranking设计是一种通用的"生成+评估"融合范式
  - Personalized trie树是GR在线服务中约束解码空间的通用基础设施方案

- **适用场景**：
  - 广告推荐系统需同时优化用户相关性和商业回报
  - 任何GR系统需要注入非语义目标（如多样性、新鲜度、公平性）
  - 大规模在线serving需要约束解码空间以降低无效计算

- **改造建议**：
  - 可考虑在SID最后一层引入动态属性（如时效性、季节性）而非仅静态商业属性
  - Fuse策略可升级为learnable gating或attention-based fusion
  - 个性化trie树可与动态inventory索引结合，支持实时广告上下架

- **与我们现有工作的关联**：
  - 对于已有GR pipeline的团队，Commercial SID是最小改动、最快见效的模块
  - Generation-as-Ranking需要RL基础设施支持，适合已有模拟器的团队
  - Personalized Beam Search对任何GR在线服务都有直接参考价值

- **ROI 评估**：
  - Commercial SID：低成本高收益（0参数增加，+5.78% HR@100）
  - Decoder scaling：中等成本（参数从3M到60M），中等收益（+18.4%）
  - Full UniVA含RL：高成本（需模拟器、RL训练、80M参数），高收益（+37.04% offline，+1.5% GMV online）

## 8. 关键引用与延伸阅读

- **GPR [26]**：UniVA的直接前序基线，提出统一的GR广告推荐paradigm，包含RQ-Kmeans+ tokenizer
- **MCTS-PPO [10]**：Value-Guided Structured Sampling，UniVA的RL采样策略来源
- **HSTU [25]**：Actions Speak Louder than Words，UniVA使用的encoder backbone
- **EGA-v2 [28]**：端到端生成式广告框架，竞争方法
- **LLaTTE [22]**：Scaling Laws for Multi-Stage Ads Recommendation
- **DeepSeekMoE [3]**：UniVA的MoE设计参考
- **MoR [2]**：Mixture-of-Recursions，UniVA的depth scaling方法来源
- **QARM [15]**：快手的Quantitative Alignment多模态推荐，价值对齐相关
