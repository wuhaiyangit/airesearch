# OpenOneRec: An Open Foundation Model and Benchmark to Accelerate Generative Recommendation

> **论文来源**: Kuaishou OneRec Team, arXiv:2512.24762v1, 2025-12-31
> **关键词**: Generative Recommendation, Foundation Model, RecIF-Bench, Scaling Laws, Cross-Domain Transfer
> **模型规模**: 1.7B / 8B 参数

---

## 1. 背景与动机

### 问题定位

近年来，大语言模型 (LLM) 的突破性进展推动了**生成式推荐 (Generative Recommendation)** 范式的兴起。快手 OneRec 系列已成功将碎片化的多阶段推荐管线统一为端到端的生成框架，证明了将用户历史视为上下文、以 next-item prediction 方式进行推荐的可行性。然而，当前推荐系统与通用智能之间仍存在巨大鸿沟：

1. **数据孤岛限制**：现有生成式推荐模型受限于孤立的数据源，无法利用 LLM 所依赖的大规模数据扩展来激发涌现能力。这些系统本质上是"领域专家"——擅长协同过滤模式匹配，但缺乏世界知识、推理能力和指令遵循能力。

2. **灾难性遗忘**：LC-Rec、OneRec-Think 等方法虽然尝试将推荐 ID 与 LLM 语言空间对齐，但通常局限于有限的下游任务，任务同质性导致骨干模型的泛化能力严重退化。

3. **评估体系缺失**：现有 benchmark 局限于单一领域的闭集排序准确率评估，缺乏面向推荐基础模型的多维度综合评测框架。

### 为何重要

推荐系统正处于从"特化专家"向"通用基础模型"转变的关键节点。如何在注入推荐知识的同时保持 LLM 的通用能力（数学推理、代码生成、指令遵循等），是该领域最核心的技术挑战。OpenOneRec 的开源实践（完整训练管线 + 96M 交互数据 + 模型权重）为社区提供了可复现的研究基座。

---

## 2. 核心方法

### 2.1 总体架构

OpenOneRec 采用 **Qwen3** 作为骨干架构，通过扩展词汇表引入 Itemic Tokens，将推荐问题统一为标准的自回归生成任务。整体框架包括三个核心阶段：

```
Pre-Training → Post-Training → Evaluation (RecIF-Bench)
```

### 2.2 Items as Tokens: 模态对齐

核心创新之一是将物品视为独立模态，使用 **RQ-KMeans** 对物品的多模态语义嵌入进行层次化离散量化：

- 采用 3 层量化方案，每层 codebook 大小 8192
- 每个物品映射为层次化编码元组 $S_i = (c_1, c_2, c_3)$
- 编码格式：`<|item_begin|><item_a_5028><item_b_6733><item_c_2559><|item_end|>`
- 层次结构保证语义相近的物品共享公共前缀，类似于自然语言中的语义关系编码

统一词汇表 $V = V_{text} \cup V_{item}$，所有任务形式化为 Next-Token Prediction：

$$\mathcal{L}(\theta) = -\sum_{t=1}^{|Y|} \log P_\theta(y_t | I, C, y_{<t})$$

### 2.3 Pre-Training Pipeline

**Stage 1: Itemic-Text Alignment**
- 仅训练 Itemic Token 对应的 embedding 参数，其余参数冻结
- 学习率 peak $1 \times 10^{-3}$
- 目标：建立 itemic tokens 与 text tokens 的初步语义对齐

**Stage 2: Full-Parameter Co-Pretraining**
- 解冻全部参数，联合推荐数据与通用数据进行全量预训练
- 学习率 peak $1 \times 10^{-4}$，最大上下文长度 32K tokens
- 数据混合策略：推荐语料 + 通用语料（Coding/STEM/Medical/Reasoning）
- Standard 版本：33B tokens / 41.3M samples
- Pro 版本：130B tokens / 179.1M samples（工业级语料）

**推荐领域数据三大类型**：
1. **Itemic Dense Caption**: 物品 token → 文本描述（语义桥梁）
2. **Sequential User Behavior**: 用户行为序列的 next-item prediction（协同过滤信号）
3. **Interleaved User Persona Grounding**: 将用户属性、搜索行为、交互序列以 interleaved 形式构建用户画像

### 2.4 Post-Training Pipeline

分三阶段精调（Figure 6）：

**Stage 1: Multi-task Supervised Fine-tuning**
- 混合推荐领域任务与通用推理数据
- 使用 Qwen3 chat template 组织对话格式
- 学习率 $2 \times 10^{-5}$ → $5 \times 10^{-6}$
- 关键发现：通用数据习得的推理能力可跨域迁移至推荐任务

**Stage 2: On-policy Distillation for General Capability**
- 以原始 Qwen3 (同参数量) 为 teacher model
- 使用 per-token reverse KL divergence 作为 reward
- 通过 policy gradient 优化，配合 reward clipping 保证稳定性
- 特殊处理词汇表差异：对 general-domain prompt 中出现的 itemic token 施加惩罚 + 截断
- 采用高温采样增强探索，200K general-domain 问题
- 支持 /think、/no_think 模式切换

**Stage 3: Reinforcement Learning for Recommendation (Rec-RL)**
- 使用 **GRPO (Group Relative Policy Optimization)** 框架
- Rule-based reward：命中目标 itemic token 得 +1.0，否则 0.0
- 直接优化离散排序指标 (Recall/NDCG)
- KL penalty 约束确保不牺牲通用能力

### 2.5 RecIF-Bench: 综合评测体系

4 层能力层次、8 个任务：

| Layer | Task | 评测重点 |
|-------|------|---------|
| L0: Alignment | Item Understanding | 物品语义对齐 |
| L1: Fundamental | Video/Ad/Product Rec, Label Pred | 核心推荐能力 |
| L2: Instruction Following | Interactive Rec, Label-Cond. Rec | 指令遵循 |
| L3: Reasoning | Rec. Explanation | 推理与解释 |

数据规模：~120M interactions / 200K users / 3 domains（短视频、广告、电商）

### 2.6 Scaling Laws

推荐领域的 Scaling Laws 遵循可预测的幂律关系，但与通用文本存在显著差异：

$$N_{opt} \propto C^{0.44}, \quad D_{opt} \propto C^{0.56}$$

关键洞察：
- **Data-Hungry Scaling** ($b > a$)：推荐领域需要更激进地扩展数据量
- **Warm-Starting 效应**：$A=502.32$ vs $B=7.02$，迁移学习大幅降低数据分布熵
- **低固有熵** ($E=0.42$ vs 通用文本 $E \approx 1.69$)：推荐任务更确定性

---

## 3. 实验设计

### 3.1 数据集

**RecIF-Bench 数据统计**：

| Domain | Users | Items | Interactions | Avg. Hist. |
|--------|-------|-------|-------------|-----------|
| Short Video | 195K | 13.1M | 94.4M | 458.1 |
| Ad | 151K | 178K | 5.3M | 29.9 |
| Product | 144K | 2.1M | 20.1M | 132.5 |
| **Total** | **202K** | **15.3M** | **119.9M** | **574.9** |

**Amazon Benchmark**：10 个领域数据集（Baby, Beauty, Cell Phones, Grocery, Health, Home, Pet, Sports, Tools, Toys），leave-one-out 划分策略。

### 3.2 评估指标

- 推荐任务 (L1 & L2)：Pass@1, Pass@32, Recall@32
- 文本生成 (L0 & L3)：LLM-as-Judge（Gemini-2.5-Flash-Lite）
- Label Prediction：AUC
- Amazon：Recall@K, NDCG@K ($K \in \{5, 10\}$)

### 3.3 Baselines

**判别式模型**：BERT4Rec, GRU4Rec, SASRec, HSTU, ReaRec
**生成式模型**：TIGER, LC-Rec-8B（基于 Qwen3-8B 实现）

### 3.4 通用能力评测

7 个 General LLM Benchmarks：MATH-500, GSM8K, AIME'24, MMLU-Pro, GPQA-Diamond, IFEVAL, LiveCodeBench v5

### 3.5 模型变体

- OneRec-1.7B / OneRec-8B（Standard, 开源数据训练）
- OneRec-1.7B-Pro / OneRec-8B-Pro（工业级百亿 token 语料）

---

## 4. 关键结论

### 4.1 RecIF-Bench SOTA

- OneRec-8B-Pro 在绝大多数任务上取得最优，以 Short Video Rec 为例：Pass@32 达 0.2122，超 LC-Rec-8B 的 0.1306 约 62.5%
- Interactive Rec 上 OneRec-8B-Pro 的 Recall@32 达 0.3458，远超 LC-Rec-8B 的 0.2394
- 两个维度的 Scaling 得到验证：数据量扩展（Pro > Standard）+ 模型规模扩展（8B > 1.7B）

### 4.2 通用能力保持

- 数学推理几乎无退化：OneRec-8B 在 MATH-500 达 0.946（Qwen3-8B 为 0.952）
- GSM8K 甚至略有提升：0.9575 vs 0.9568
- 在 MMLU-Pro、IFEVAL 等知识密集型任务上存在一定退化（约 15-20%），表明通用知识保持仍需进一步优化

### 4.3 跨域迁移（Amazon）

- 10 个数据集上 Recall@10 平均提升 **26.8%**（最高 36.3% in Pet Supplies）
- Few-shot (10% 数据) 场景下优势更加显著：超 TIGER **219.7%**
- OneRec 在 10% 数据下保持 45.2% 的全量性能，TIGER 仅保持 23.0%

### 4.4 Multi-Domain Joint Training

- OneRec 在联合训练下性能提升 2.3%，而 TIGER 反而下降 10.6%
- 验证了基础模型从多域数据中提取通用推荐模式的能力

### 4.5 Text-Augmented Itemic Tokens 策略

- 三种迁移策略中，Text-Augmented Itemic Tokens（collision rate 0.47%）效果最佳
- 保留预训练协同过滤信号的同时利用语义消歧

### 4.6 Post-Training 阶段演进

- On-policy Distillation 有效恢复通用能力（AIME'24 从 SFT 后的 0.5104 恢复到 0.7125）
- Rec-RL 精准提升推荐指标，且推理解释任务也受益（LLM-Judge Score 从 3.9479 提升到 4.0381）

---

## 5. 局限性与讨论

### 已识别的局限性

1. **Tokenizer 可迁移性受限**：预训练 tokenizer 在窄垂直领域（如 Amazon）的 collision rate 较高（>30%），需要额外的适配策略。建立更通用的 item indexing 机制是关键方向。

2. **通用数据混合效率**：维持通用智能需要大量通用文本混合训练，最优混合比例和数据利用效率的研究仍不充分。在 MMLU-Pro、IFEVAL 等任务上 15-20% 的性能下降提示需要更精细的数据策略。

3. **Chain-of-Thought 推理收益有限**：目前 CoT 仅在有限场景下带来改进，test-time scaling 策略在推荐场景的系统性探索尚待进行。

4. **评测局限**：L3 层 (Reasoning) 的 ground truth 由 Gemini-2.5-Pro 生成，存在评测偏差风险；LLM-as-Judge 的可靠性有待更多验证。

### 适用场景

- 大规模工业推荐系统的统一基础模型
- 冷启动/少样本推荐场景（Few-shot 优势极为突出）
- 跨域推荐与多任务联合建模
- 需要推荐解释能力的场景（对话式推荐、可解释推荐）

---

## 6. 对工作的启发

### 6.1 对生成式推荐研究的核心启示

1. **Foundation Model 范式的可行性验证**：OpenOneRec 证明了在推荐领域构建大规模基础模型的路径可行——通过 Itemic Token 实现模态对齐、通过数据混合缓解灾难性遗忘、通过三阶段 post-training 平衡多维能力。这为生成式推荐的工业落地提供了完整技术蓝图。

2. **Scaling Laws 的领域特异性**：推荐领域 $D_{opt} \propto C^{0.56}$（data-hungry）的特性提示我们，在资源有限时应优先扩展数据而非模型参数。这与通用 NLP 的等比例扩展策略形成对比，对资源规划有重要指导意义。

3. **On-policy Distillation 的创新设计**：解决 teacher 模型不识别 itemic tokens 的问题方式颇具启发——通过 prompt selection + token penalty + truncation + 高温探索的组合策略，优雅地处理了异构词汇表下的知识蒸馏。

### 6.2 技术洞察

- **Itemic Token 层次化量化**是连接推荐 ID 空间与语言空间的有效桥梁，3 层 × 8192 codebook 的配置值得作为默认基线
- **GRPO + Rule-based Reward** 为推荐场景的 RL 提供了简洁高效的范式——避免了复杂 reward model 的训练
- **Text-Augmented Itemic Tokens** 策略（原始 itemic tokens + keywords）是当前最佳的迁移学习范式
- Interleaved User Persona 的构建方式为用户建模提供了新思路

### 6.3 未来方向

- 更通用的 item tokenizer 设计（跨平台/跨领域可迁移）
- Test-time scaling / CoT 在推荐任务中的系统性研究
- 多模态信息（视频帧、图片）的更深度融合
- 推荐领域 RL 的进一步探索（更细粒度的 reward 设计）

---

## 7. 方法细节补充

### 7.1 数据处理细节

- 用户侧元数据包括：人口属性、内容创作史、搜索行为、关注类型、观看偏好、评论、直播观看、购买记录、购物车、本地服务优惠、广告曝光、商业意图信号
- 物品侧：4096-dim 文本嵌入 + 5 帧视觉嵌入（每帧 1152-dim），约 13M 视频的 dense captions
- 交互侧：多标签行为信号（like, follow, comment, effective view, dislike）
- 严格的基于用户的 split：20% 用户为测试集，零数据泄露
- 通用数据去重：MinHash 模糊去重，过滤与评估 benchmark 高相似度的样本

### 7.2 训练超参数

| 参数 | Stage 1 (Alignment) | Stage 2 (Co-Pretrain) | SFT | RL |
|------|---------------------|----------------------|-----|-----|
| Optimizer | AdamW | AdamW | AdamW | GRPO |
| $\beta_1, \beta_2$ | 0.9, 0.95 | 0.9, 0.95 | 0.9, 0.95 | - |
| Weight Decay | 0.1 | 0.1 | 0.1 | - |
| Peak LR | $1 \times 10^{-3}$ | $1 \times 10^{-4}$ | $2 \times 10^{-5}$ | - |
| Min LR | $1 \times 10^{-4}$ | $2 \times 10^{-5}$ | $5 \times 10^{-6}$ | - |
| Warmup | 10% steps | 10% steps | - | - |
| Max Context | 32K | 32K | - | - |

### 7.3 Itemic Token 初始化

- 从现有 embedding 的均值和协方差构建多元正态分布进行初始化
- Qwen3 小模型（0.6B/1.7B/4B）使用 tied embedding（输入/输出共享）
- 大模型（8B+）有独立 output projection，itemic tokens 对应参数也可训练

### 7.4 评估协议补充

- Item Understanding 使用 Weighted Information Points (WIP) 提取 + 语义匹配 + Double-Weighted F1 Score
- Match Quality 由 BERTScore (bert-base-chinese) 计算
- Rec. Explanation ground truth 由 Gemini-2.5-Pro 生成（全量元数据访问）
- 判断由 Gemini-2.5-Flash-Lite 执行

### 7.5 Amazon 迁移策略详解

| Strategy | Collision Rate | 特点 |
|----------|---------------|------|
| Extended Residual Quantization | 3.05% | 增加第 4 层 FSQ 编码 |
| Text-Only Adaptation | 4.27% | 每个物品用 5 关键词表示 |
| Text-Augmented Itemic Tokens | 0.47% | 原始 3 层 itemic tokens + keywords |

---

## 8. 总结评价

### 评分

| 维度 | 评分 (1-10) | 说明 |
|------|-------------|------|
| **创新性** | 8/10 | Itemic Token + LLM 统一范式并非首创（OneRec 系列延续），但 RecIF-Bench 的设计、Scaling Laws 的验证、On-policy Distillation 的词汇表适配方案具有显著创新 |
| **工程价值** | 9/10 | 完整开源训练管线 + 96M 交互数据 + 模型权重，可复现性极强，对工业实践有直接指导意义 |
| **理论深度** | 7/10 | Scaling Laws 分析严谨但实验规模有限，On-policy Distillation 理论推导清晰但无深层收敛分析 |
| **实验充分度** | 9/10 | 多维评测（RecIF-Bench 8 任务 + 7 通用 Benchmark + 10 Amazon 数据集）+ 充分消融实验 |
| **写作质量** | 8/10 | 结构清晰，技术细节完整，图表丰富，但 36 页篇幅略显冗长 |
| **综合评价** | **8.5/10** | 推荐领域基础模型的里程碑式工作，完整的"数据-训练-评测"闭环开源，对行业影响深远 |

### 总结

OpenOneRec 是推荐系统领域从"特化模型"走向"基础模型"的标志性工作。其核心贡献在于：(1) 提出首个涵盖 8 种任务的推荐指令遵循 benchmark (RecIF-Bench)；(2) 验证了推荐领域的 Scaling Laws 并揭示了 data-hungry 的领域特性；(3) 设计了三阶段 post-training 策略有效平衡推荐能力与通用智能。在实验层面，模型在推荐任务上全面 SOTA 的同时保持了 LLM 的数学推理能力，跨域迁移上 Recall@10 平均提升 26.8%。

对于推荐系统研究者和从业者，这篇工作的价值不仅在于其技术方案，更在于其开源的完整训练管线和大规模数据集。它为生成式推荐的后续研究建立了可复现的强基线，降低了该领域的研究门槛。其 Scaling Laws 分析和 post-training 策略设计对我们的生成式推荐相关工作有直接的方法论指导意义。
