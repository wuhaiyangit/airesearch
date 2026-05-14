# GEM-Rec: One Model, Two Markets: Bid-Aware Generative Recommendation

> **论文信息**: Yanchen Jiang (Harvard), Zhe Feng, Christopher P. Mah, Aranyak Mehta, Di Wang (Google Research)
> **发表时间**: 2026-03-01 (arXiv:2603.22231v1)
> **关键词**: Generative Recommendation, Semantic IDs, Computational Advertising, Mechanism Design, Auctions

---

## 1. 背景与动机

### 问题背景

生成式推荐系统（如 TIGER）通过 Semantic IDs 将推荐建模为序列生成任务，已成为序列推荐的主流范式。然而，现有架构**完全面向语义检索**，未考虑工业平台最核心的商业化需求——广告变现与竞价机制的融入。

### 核心矛盾

工业推荐系统必须同时优化两个目标：
1. **有机推荐 (Organic)**：基于用户偏好的语义相关性，无价格信号
2. **商业推荐 (Sponsored)**：需同时考虑语义相关性、用户商业意图和广告竞价收入

这两类 item 运行在不同目标下。简单地将混合数据流用于训练会**混淆信号**。更关键的是，广告竞价是**实时波动**的——广告主会根据库存质量和用户相关性动态调整出价。纯粹基于历史日志训练的模型**无法捕捉这种实时反馈**，导致系统锁定在过去的估值上，无法适应新的价格机会。

### 为什么重要

这是首次系统性地解决"如何在生成式推荐框架中原生集成竞价/拍卖机制"的问题。传统做法是有机推荐和广告推荐由独立系统产出，再通过 blending layer 合并——这种架构割裂了用户行为序列的连贯性。GEM-Rec 提出用**单一生成模型**统一服务两个市场，同时保证理论上的可控性和激励兼容性。

---

## 2. 核心方法

### 2.1 统一序列构造 (Unified Sequence Construction)

GEM-Rec 在 Semantic ID 词表中引入两个 **Control Tokens**：`<ORG>`（有机）和 `<AD>`（广告）。对于时间步 $t$ 的交互，生成序列构造为：

$$\mathbf{x}_t = [f_t] \oplus [c_{t,1}, c_{t,2}, \ldots, c_{t,D}]$$

其中 $f_t = \text{<AD>}$ 若为广告展示，否则 $f_t = \text{<ORG>}$。

**设计精髓**：Control Token 作为可学习的 mode switch，**结构性地将 slot 分配决策（展示广告还是有机内容）与内容检索（生成哪个 item ID）解耦**。Transformer 的 attention 机制会根据前缀的不同，以不同方式处理后续 item 内容：
- `<ORG>` 下：Preference Mode，最大化语义匹配
- `<AD>` 下：Monetization Mode，学习历史上成功的广告展示分布（即同时满足语义相关性和经济价值的 item 子集）

### 2.2 分解式生成目标 (Factorized Generative Objective)

生成概率分解为：

$$P_\theta(\mathbf{x}_t | H_{<t}) = \underbrace{P_\theta(f_t | H_{<t})}_{\text{Ad Satisfaction Modeling}} \cdot \underbrace{\prod_{k=1}^D P_\theta(c_{t,k} | H_{<t}, f_t, c_{t,<k})}_{\text{Mode-Conditional Retrieval}}$$

- **Ad Satisfaction Modeling** $P(f)$：学习广告展示的上下文边界（如用户疲劳、叙事中断等隐性约束）
- **Mode-Conditional Retrieval** $P(c|f)$：条件于 slot 类型学习语义检索——若 $f=\text{<ORG>}$ 则优化纯有机偏好，若 $f=\text{<AD>}$ 则检索历史上同时具有高语义相关性和商业可行性的 item

### 2.3 Bid-Aware Decoding (GEM-Decoding)

训练学到的是"安全基线"（历史日志的分布），但无法编码当前市场机会的实时经济价值。GEM-Decoding 在推理时将竞价信号注入生成过程，**无需重新训练**：

#### Slot-Level Modulation（动态广告频率）

$$\tilde{z}_{\text{<AD>}} = z_{\text{<AD>}} + \lambda \cdot \log(1 + b_{max})$$

使用当前可用广告库存的最高出价 $b_{max}$ 提升广告 flag 的 logit。若高价值库存可用，则更频繁地选择 `<AD>` flag。

#### Item-Level Modulation（收入最大化）

利用 Semantic IDs 的层级结构，预计算 Prefix-Aware Bid Aggregation 查找表 $B(c_k | c_{<k})$——存储该语义前缀下所有有效 item 的最高出价：

$$\tilde{z}_c = z_c + \lambda \cdot \log(1 + B(c))$$

这确保在语义可行的 token 中，decoder 偏向包含高出价 item 的分支，**在序列生成的早期阶段就引导到高价值路径**。

#### 层级解码策略 (Hierarchical Decoding Strategy)

1. **Flag Sampling**：首先采样 `<ORG>` 或 `<AD>` flag（hard commitment），避免标准 beam search 因有机序列天然更高的先验似然而剪枝掉广告假设
2. **Content Beam Search**：条件于采样的 flag，在调制后的 logits 上运行 beam search 生成 Semantic ID tokens

### 2.4 机制设计属性

#### Proposition 1: Allocative Monotonicity（分配单调性）

对于任意上下文 $H$ 和固定对手出价 $b_{-i}$，广告 item $i$ 的曝光概率 $x_i(b_i, b_{-i})$ 关于 $b_i$ 是**非递减**的。即：**提高出价不会减少展示概率**。

证明思路：分配规则 $x_i(b) = P_\lambda(\text{<AD>} | H, b) \cdot \mathbb{I}[D_K(H,b) = i]$，其中 Slot 概率通过 softmax 关于 $b_{max}$ 单调递增；Beam Search 输出通过逐步论证 target hypothesis 的 score gap 关于 $b_i$ 非递减来保证。

#### Proposition 2: Structural Consistency

1. **Safe Fallback**：当 $\lambda=0$ 时退化为标准 TIGER
2. **Organic Integrity**：logit 调制严格限定在 `<AD>` flag 下，有机 item 的相对排名关于 $\lambda$ 不变
3. **Generalization**：若训练语料只含有机交互，$P(\text{<AD>}) \to 0$

### 2.5 定价机制

实验采用 First-Price Payment（赢家支付出价），与当前数字广告生态的行业趋势一致（Google、Amazon、Microsoft 等均已转向一价拍卖）。关于 DSIC（占优策略激励兼容）的实现留作 future work。

---

## 3. 实验设计

### 数据集

由于标准 benchmark 缺少竞价日志和统一交互历史，论文构造了**合成市场环境**：
- **基础数据集**：Steam、Amazon Beauty、Amazon Sports、Amazon Toys（均为标准序列推荐 benchmark）
- **广告模拟**：随机选取 20% item 作为 Sponsored Inventory，分配 Log-Normal 分布出价

### 数据生成策略 (Two-Stage Policy)

1. **Stage 1 - Semantic Relevance Filter**：广告候选必须与用户有机意图共享足够深的语义前缀（prefix match depth $\geq 2$）
2. **Stage 2 - Probabilistic Auction**：在相关候选中，基于出价的 softmax 采样选择赢家（温度 $\tau=0.1$）
3. **Frequency Capping**：线性恢复的展示间隔约束，模拟用户疲劳

### 评估维度

1. **Strict Policy Fit (Total NDCG)**：模型是否准确复现训练策略（同时预测正确的 slot type 和 Item ID）
2. **Organic Integrity (Conditional Organic NDCG)**：有机 slot 中的排名质量
3. **Economic Value & Steerability**：
   - Ad Rate：广告展示比例
   - Revenue：累计中标价格
   - Ad Relevance：生成广告相对用户意图的 NDCG

### Baseline

TIGER（Rajput et al., 2023）——无广告机制的纯语义生成推荐模型

### 实现细节

- T5 Encoder-Decoder（6层 encoder + 6层 decoder，$d_{model}=128$，6 heads）
- RQ-VAE：codebook size 256，depth 3
- 训练 100,000 steps，batch size 256，单卡 A100
- $\lambda \in [0.0, 10.0]$ 扫描完整 Pareto 前沿

---

## 4. 关键结论

### 4.1 可控性验证

- $\lambda=0$ 时模型**精确复现**训练日志中约 3-6% 的基线广告密度
- Ad Rate 随 $\lambda$ **平滑单调递增**，无突变或饱和
- 所有设置下广告生成的有效率为 **100%**（无 hallucination）

### 4.2 Pareto 前沿

在 Steam 数据集上观察到近线性 Pareto 前沿：
- 低 $\lambda$ 区间可获得显著收入而几乎不偏离市场策略
- 如 $\lambda=1.0$ 时 Steam 收入 1,173 vs $\lambda=0$ 的 535，NDCG 仅从 0.1411 降至 0.1381

### 4.3 Organic Integrity 实证

**核心发现**：Conditional Organic NDCG 随 $\lambda$ 增加保持**基本恒定**。
- Steam: O.NDCG@10 从 0.1468 ($\lambda=0$) 到 0.1467 ($\lambda=1.0$) 几乎无变化
- Beauty: O.NDCG@10 从 0.0318 ($\lambda=0$) 到 0.0320 ($\lambda=1.0$) 甚至微升

### 4.4 市场波动适应性

模拟 Bid Shock（5% 库存出价 ×10）的结果令人印象深刻：
- $\lambda=0$: Ad Rate 2.4%, High-Value Share 仅 21.8%（模型"看不到"实时变化）
- $\lambda=0.5$: Ad Rate 7.1%, High-Value Share 跃升至 81.5%，**收入提升 9×**
- $\lambda=1.0$: High-Value Share 97.4%，收入提升 28.2×

系统不仅增加广告量，更**主动替换低价值广告为高价值广告**。

### 4.5 跨数据集一致性

四个数据集（Steam、Beauty、Sports、Toys）均展现一致的行为模式，验证了方法的鲁棒性。

---

## 5. 局限性与讨论

### 局限性

1. **合成数据验证**：虽然构造了合理的市场模拟，但未在真实工业系统上验证。真实场景中竞价策略、用户行为远比模拟复杂。

2. **DSIC 未实现**：当前采用 First-Price 支付规则，未提供占优策略激励兼容性保证。论文讨论了实现 DSIC 的技术难度——需要对 counterfactual decoding outcomes 进行推理，计算开销大。

3. **单一 $\lambda$ 控制**：Slot-Level 和 Item-Level 共享同一个 $\lambda$ 参数，论文建议未来引入独立的 $\lambda_{slot}$ 和 $\lambda_{item}$ 以获得更精细控制。

4. **广告相关性下降**：随 $\lambda$ 增加，生成广告的语义相关性不可避免地下降——这是收入与相关性之间的固有张力。

5. **静态出价假设**：出价在推理时是固定输入，未考虑广告主的策略性响应（bid shading 等）。

### 适用场景

- 生成式推荐系统的商业化落地
- 需要统一有机和广告推荐的平台（如信息流、电商搜索）
- 对广告频率有精细调控需求的场景
- 需要快速响应市场波动而无需重新训练的场景

---

## 6. 对工作的启发

### 对生成式推荐书籍/研究的启发

1. **Control Token 设计范式**：通过在词表中添加控制 token 来实现功能解耦，是一种极为优雅且通用的设计。这种 "prefix as mode switch" 思路可以推广到其他多目标推荐场景（如新品曝光、多样性控制、探索/利用平衡）。

2. **推理时调制 vs 训练时优化**：GEM-Rec 的核心洞察是将"学习什么是合理的"（训练时）与"选择当前最优的"（推理时）解耦。这为生成式系统的部署提供了极具实操性的思路——模型可以较少频率更新，而业务策略通过推理时参数即时调整。

3. **Semantic ID 层级结构的新用途**：Prefix-Aware Bid Aggregation 展示了 RQ-VAE 生成的层级编码不仅用于粗到细检索，还可以作为**预算/价值信号的聚合结构**。这启发我们思考 Semantic ID 在其他信号（如新鲜度、库存量）聚合上的潜力。

4. **机制设计与深度学习的结合**：论文严格证明了分配单调性，这为生成式推荐系统的可信部署（避免广告主被"惩罚"提高出价）提供了理论基础。未来的工作可以在此基础上探索更复杂的拍卖机制。

### 技术洞察

- **Log-Transform Bid Injection**：使用 $\log(1+b)$ 而非直接 $b$ 进行 logit 调制，避免了极端出价导致的分布坍塌
- **Factorized Decision**：先决定 slot type 再生成 content 的层级策略，是对标准 beam search 的重要改进——否则有机序列的高先验会系统性剪枝广告假设
- **Validity without Prefix-Trie**：模型纯靠学习就能保证 100% 生成有效性，无需计算昂贵的 prefix-trie 约束

### 未来方向

1. 独立 $\lambda_{slot}$ 和 $\lambda_{item}$ 的多维控制
2. 结合 DSIC 的可信赖竞价机制
3. 将框架扩展到多 slot 推荐列表生成
4. 探索在真实大规模系统中的部署效果

---

## 7. 方法细节补充

### Semantic IDs (RQ-VAE)

采用 Residual Quantized VAE 将 item 映射为层级离散编码 $s_i = (c_1, \ldots, c_D)$，其中 $D=3$，codebook size 256。第一层 code 捕捉粗粒度语义类别，后续层捕捉细粒度细节。共享前缀的 item 具有相似内容嵌入。

### 分配规则的形式化定义

$$x_i(b) = \underbrace{P_\lambda(f=\text{<AD>} | H, b)}_{\text{Stochastic Slot}} \cdot \underbrace{\mathbb{I}[D_K(H,b) = i]}_{\text{Deterministic Item}}$$

Slot 决策是随机的（采样），Item 选择是确定的（beam search 输出）。这种混合策略是保证单调性证明成立的关键假设。

### 数据生成中的频率控制

展示概率 $P(\text{Display}) = p \cdot \min(1.0, \Delta t \times r)$

主实验 $p=0.4, r=0.05$（20步完全恢复）；高密度消融实验 $p=1.0, r=0.5$（2步完全恢复），模拟不同平台的广告密度策略。

### 与相关工作的关键区别

| 方法 | 特点 | 与 GEM-Rec 的区别 |
|------|------|-------------------|
| RARE/EGRM | 搜索广告的生成式检索 | 基于 query 的广告生成，非序列推荐 |
| GPR | 端到端广告推荐 | 生成目标只有广告，非混合有机/广告列表 |
| RL-based Insertion | 强化学习广告插入 | 非生成式检索，无 Semantic ID decoder |
| OneRec | 偏好对齐的生成推荐 | 缺乏处理经济约束和实时竞价的架构机制 |

### Bid Shock 实验设计

随机选取 5% 库存，将其出价乘以 10×，评估模型能否在推理时快速适应市场变化——核心验证了 GEM-Decoding 的 inference-time plasticity。

---

## 8. 总结评价

### 评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 创新性 | 9/9 | 首次系统性地将拍卖/竞价机制原生融入生成式推荐架构，Control Token + Bid-Aware Decoding 的设计极为精巧 |
| 工程价值 | 9/9 | $\lambda$ 参数提供即时可调的收入-相关性权衡，无需重训练；对工业落地有直接指导意义 |
| 理论深度 | 9/9 | 严格证明了 Allocative Monotonicity 和 Structural Consistency，将机制设计的核心概念引入生成式推荐 |
| 实验完整度 | 9/9 | 4 数据集 × 多 $\lambda$ 设置 × 多评估维度 × 消融实验 × 波动性测试，极为全面 |
| 写作质量 | 9/9 | 论文结构清晰，动机阐述充分，图表信息量大，附录详尽（31页完整论文） |
| 综合评分 | 9/9 | 开创性工作，定义了"生成式推荐 × 计算广告"这一新方向 |

### 总结

GEM-Rec 是一篇**定义新方向**的论文。它优雅地解决了生成式推荐系统从学术走向工业落地的核心阻碍——如何在保持推荐质量的同时实现商业化。Control Token 的引入将"是否展示广告"的决策显式化，Bid-Aware Decoding 则将"展示哪个广告"的经济信号注入推理过程。理论保证（单调性）确保系统对广告主是"公平"的——出价越高展示越多。

论文的关键贡献在于**范式层面的创新**：不是在已有推荐系统上"打补丁"加广告，而是从序列构造、训练目标、推理策略三个层面进行一体化设计。这种 "one model, two markets" 的思路，本质上是对推荐系统架构的重新定义——从"推荐 + 广告 = 两套系统 + blending"变为"推荐 = 统一生成过程中的多目标控制"。

对于生成式推荐的未来发展，GEM-Rec 提供了重要的 building block：它证明了 Semantic ID 框架完全可以承载经济信号，且推理时调制是可行且可控的。这为后续在此基础上构建更复杂的多方博弈系统（如多广告主竞争、预算约束、长期用户价值优化）奠定了坚实基础。
