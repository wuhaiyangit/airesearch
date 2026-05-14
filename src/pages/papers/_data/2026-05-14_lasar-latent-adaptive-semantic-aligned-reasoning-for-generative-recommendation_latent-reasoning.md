---
原文件: "2605.10207v1.pdf"
title: "LASAR: Latent Adaptive Semantic Aligned Reasoning for Generative Recommendation"
authors: "Yiwen Chen, Fuwei Zhang, Zehao Chen, Deqing Wang, Hehan Li, Peizhi Xu, Hanmeng Liu, Shuanglong Li, Xin Pei, Fuzhen Zhuang, Zhao Zhang"
affiliation: "School of Artificial Intelligence, Beihang University; Baidu"
year: "2026"
venue: "arXiv preprint (arXiv:2605.10207v1)"
category: "生成式推荐"
abstract: "首次在主流 decoder-only 生成式推荐中实现完整的隐状态反馈循环式潜在推理，通过两阶段 SFT 解耦、显式 CoT 语义对齐（双向 KL）和 REINFORCE 自适应步数优化，在提升推荐质量的同时将推理延迟控制在显式 CoT 的 1/20"
tags: ["latent-reasoning", "generative-rec", "SFT-then-RL", "semantic-ID"]
Hash: "ede8ecc0068862e7"
RecRatio: "7"
Team: "Beihang University + Baidu"
Reason: "首次将 Coconut 式多步隐状态反馈循环潜在推理引入生成式推荐，提出系统性解决方案（语义锚定、自适应步数），对生成式推荐的推理范式探索有重要参考价值"
精读日期: "2026-05-14"
报告字数: "约 3500 字"
---

## 1. 摘要与核心贡献

- **研究问题**：如何将潜在推理（latent reasoning）范式引入主流 decoder-only 生成式推荐，使模型在连续隐空间中完成多步推理，同时避免显式 CoT 文本生成带来的高延迟。

- **动机**：LLM 的 CoT 推理在推荐系统中展现潜力，但 token-by-token 生成带来 20 倍以上延迟开销，不适合延迟敏感的推荐场景。Coconut 等工作证明了潜在推理在 NLP 中的可行性，但直接迁移至生成式推荐面临三大挑战：(1) Semantic ID 缺乏预训练语义先验导致联合优化崩溃；(2) 缺乏推理链监督导致表征漂移；(3) 全局固定推理步数次优。

- **方法概要**：提出 LASAR（Latent Adaptive Semantic Aligned Reasoning），采用 SFT-then-RL 训练框架：Stage 1 先建立 SID 语义基础，Stage 2 引入潜在推理并通过逐步双向 KL 散度与显式 CoT 锚点对齐；RL 阶段联合优化 GRPO（生成质量）、Terminal KL（语义一致性）和 REINFORCE（自适应步数分配）。

- **主要结果**：在 Amazon 三个数据集（Beauty, Instruments, Sports）上几乎所有指标取得最优，推理延迟仅比无推理基线多 7-16%，约为显式 CoT 的 1/20。REINFORCE 将平均推理步数从约 4.2 压缩至约 2.5，同时提升推荐质量。

- **核心贡献**：
  1. 首次在主流生成式推荐中实现完整的 Coconut 式隐状态反馈循环潜在推理
  2. 提出两阶段解耦训练解决 SID 语义锚定问题，实现约 3 倍加速收敛
  3. 设计逐步双向 KL 语义对齐防止表征漂移
  4. Policy Head + REINFORCE 实现样本级自适应步数优化
  5. 系统性消融揭示潜在推理在推荐中的失败模式与解决路径

## 2. 业界进展与相关工作

- **领域发展脉络**：LLM 推荐沿两条路径发展——生成式推荐（P5 → TIGER → LC-Rec → MiniOneRec）和 LLM 推理（CoT → DeepSeek-R1/O1 → Coconut 潜在推理）。两条路径的交叉探索极为有限。

- **主要技术路线对比**：
  - **显式 CoT 推理**（GREAM 等）：生成推理文本后给出推荐，延迟高，且 RL 后训练可能损害直接推荐性能（GREAM 消融显示 SRPO 使 Instruments 下降 5.3%）
  - **判别式潜在推理**（ReaRec, LARES, ManCAR）：基于 ID-embedding + 点积范式，非 decoder-only 生成式
  - **生成式浅层探索**（LatentR3, S2GR）：前者仅做单层 attention 信息提取，后者是 token 插入而非循环迭代

- **最相关的前序工作**：
  - Coconut：NLP 领域潜在推理开创性工作，隐状态反馈循环
  - ReaRec：推荐领域潜在推理，但基于 SASRec 判别式架构，固定步数
  - GREAM：生成式推荐中的显式 CoT，RL 后训练
  - CODI：自蒸馏将 CoT 压缩至连续空间，但仅做单 token 对齐

- **本文的定位**：填补 "Coconut 式完整潜在推理 + 主流 decoder-only 生成式推荐" 的空白，系统解决迁移过程中的三大挑战。

## 3. 详细技术方案

### 3.1 整体框架

LASAR 基于 backbone LLM（Qwen3-0.6B/1.7B），在 prompt 与 answer 之间插入潜在推理区域 `[Prompt] <s> <t>×N <e> [Answer]`，通过隐状态反馈循环进行多步推理。训练遵循 SFT-then-RL 范式：

- **SFT Phase**：两阶段解耦 + CoT 语义对齐
- **RL Phase**：GRPO + Terminal KL + REINFORCE

每个 item 通过残差量化 K-Means 编码为 $M=4$ 个 SID token，集成入 LLM 词表。推荐任务建模为条件序列生成：$p(Y \mid X; \Theta) = \prod_{k=1}^{M} p(y_k \mid X, y_1, \ldots, y_{k-1}; \Theta)$。

### 3.2 关键模块详解

**隐状态反馈循环（Recurrent Latent Loop）**：

$$h_0 = f_\Theta(X), \quad h_t = f_\Theta(\tilde{E}_t), \quad t = 1, \ldots, N$$

其中 $\tilde{E}_t = [E_X, h_0, h_1, \ldots, h_{t-1}]$ 是增强输入嵌入序列。每一步用前一步的隐状态替代标准 token embedding 作为输入，N 步后从 $h_N$ 开始自回归生成答案，复用累积的 KV cache。

**Policy Head（自适应步数预测）**：

两层 MLP，从 prompt 最终隐状态 $h_0$ 预测步数分布：$\pi_\phi(\cdot \mid h_0) = \text{Softmax}(W_2 \cdot \tanh(W_1 \cdot h_0 + b_1) + b_2)$，输出维度为 $N_{\max}=8$。关键优势：预测 N 在潜在循环之前完成，同一 prompt 所有 beam 共享相同 N，简化 batch beam search。

**变长 N 的 Batch 处理**：设计 padding-and-masking 方案，短 N 样本用 masked pad token 填充，循环统一运行 $\max(N)$ 次，零分支，保持完整 GPU 并行性。

**CoT 语义对齐**：

- 大模型（GPT-5）生成每个训练样本的 CoT 推理文本（仅用于对齐监督，推理时不需要）
- 使用 bge-small-en-v1.5 对 CoT 文本进行语义分段
- 同一 backbone 编码各分段，提取最后 token 的最终层隐状态作为预计算锚点
- SFT 阶段采用逐步双向 KL 对齐：

$$L_{\text{align}} = \frac{1}{N} \sum_{t=1}^{N} D_{\text{KL}}^{\text{bidir}}(h_t, h_t^{\text{cot}})$$

其中 $D_{\text{KL}}^{\text{bidir}}(a, b) = \frac{1}{2}[D_{\text{KL}}(\text{Softmax}(a) \| \text{Softmax}(b)) + D_{\text{KL}}(\text{Softmax}(b) \| \text{Softmax}(a))]$

### 3.3 训练策略与优化

**SFT 阶段（两阶段解耦）**：

- **Stage 1（SID 对齐）**：无潜在循环，仅学习生成推荐 item 的 SID（交叉熵损失），建立 SID-to-item 语义映射。lr=$5 \times 10^{-4}$，约 10 epochs。
- **Stage 2（潜在推理）**：引入隐状态反馈循环 + CoT 语义对齐。lr=$5 \times 10^{-5}$，约 4 epochs 即可收敛。总 SFT 损失：$L_{\text{SFT}} = L_{\text{CE}} + \alpha_{\text{align}} \cdot L_{\text{align}} + \beta_{\text{policy}} \cdot L_{\text{policy}}$

混合训练初始 eval loss 高达 3.5-3.9 且收敛极慢（20+ 小时），两阶段解耦从 1.79 起始，总训练约 6 小时。

**RL 阶段（联合优化）**：

- **GRPO**：G=8 候选，reward = exact match + ranking NDCG，clipped objective + KL penalty
- **Terminal KL**：仅对齐最后一步潜在隐状态与 CoT 最终分段隐状态：$L_{\text{Terminal KL}} = D_{\text{KL}}^{\text{bidir}}(h_N, h_{\text{final}}^{\text{cot}})$
- **REINFORCE**：优化 Policy Head 步数分配，损失为 $L_{\text{REINFORCE}} = -\mathbb{E}_{N \sim \pi_\phi}[(R_{\text{group}} - b_{\text{EMA}} - \lambda N) \cdot \log \pi_\phi(N \mid h_0)] - \eta \cdot H(\pi_\phi)$
- 总 RL 损失：$L_{\text{total}} = L_{\text{GRPO}} + \gamma_{\text{KL}} \cdot L_{\text{Terminal KL}} + \gamma_{\text{RF}} \cdot L_{\text{REINFORCE}}$

### 3.4 推理/部署策略

推理流程：Policy Head 预测 N → 插入 latent tokens → batch 对齐 → 编码 prompt → latent loop（max(N) 步）→ 更新 KV cache → Trie 约束 beam search 生成 top-K 推荐。

推理无需 CoT 文本，latent loop 仅增加毫秒级延迟，整体约 0.29-0.32s/sample vs. 显式 CoT 的 6.5-7.0s/sample（beam width=50, 8×L40）。

## 4. 实验设计与结果分析

### 4.1 实验设置

- **数据集**：Amazon Beauty (22K users, 12K items, 176K interactions), Instruments (25K users, 10K items, 74K interactions), Sports (36K users, 18K items, 107K interactions)。5-core 过滤，leave-one-out 评估。
- **基线**：SASRec, GRU4Rec（传统），LC-Rec, MiniOneRec（生成式），ReaRec（潜在推理），Explicit CoT_GREAM（显式 CoT）
- **指标**：NDCG@{5,10,20}, HR@{5,10,20}，beam search width=50
- **模型**：Qwen3-0.6B（主实验），Qwen3-1.7B LoRA（scaling 实验）

### 4.2 主实验结果

LASAR 在几乎所有指标-数据集组合上取得最优（唯一例外：Beauty HR@20 Explicit CoT 微幅领先）。

关键趋势：
- **稀疏数据集增益最大**：Sports 最稀疏，LASAR 相对 MiniOneRec 优势最明显（N@5: 0.0121 vs 0.0099, +22%；HR@20: 0.0425 vs 0.0339, +25%）
- **一致超越显式 CoT**：潜在推理避免了离散推理文本解码与协同过滤目标之间的表征干扰
- **统计显著性**：Bootstrap test Sports/Instruments p<0.05，Beauty p<0.1

### 4.3 消融实验

**SFT 阶段消融（对齐方法）**：
- 无对齐的 latent reasoning 仅提升 NDCG@10 +0.4%（几乎无效）
- KL 对齐 +2.9%，是唯一正向改进的方法
- Cosine 对齐 0%，MSE 对齐 -11.6%——对齐方法选择关键

**RL 阶段消融**：
- Naive latent reasoning：N@10 下降 2.7%（不是免费午餐）
- + Terminal KL：恢复漂移，N@10 +2.4%，但 Mean N 从 3.59 升至 4.20
- + REINFORCE（完整 LASAR）：N@10 再 +3.1%，Mean N 压缩至 2.47

结论：Terminal KL 和 REINFORCE 提供独立且互补的增益；步数压缩与质量提升同步发生。

### 4.4 其他分析

**自适应步数 vs 固定步数**：自适应采样（HR@10=2.80%）超越所有固定配置；Fixed N=4 表现最差（1.93%），Fixed N=1 反而更好（保留表征不受干扰）。

**REINFORCE 动态分析**：训练早期 Mean N 从 3.4 急降至 1.9 并稳定，Reward 持续上升。Policy Head 学到选择性分配策略：大部分样本浅层推理（N≤4），最难样本深度推理（N≥7）。Force N=4 全局 1.93% vs Policy Head 选择性分配给 N=4 的样本 3.38%。

**推理效率**：LASAR 每样本 0.29-0.32s，MiniOneRec 0.25-0.30s（增加 7-16%），Explicit CoT 6.5-7.0s（慢 20 倍以上）。

**模型 Scaling**：0.6B→1.7B LoRA，LASAR 持续最优。HR@10 提升幅度大于 MiniOneRec，表明潜在推理从额外容量中获益更多。显式 CoT 在 scaling 中收益最小。

## 5. 关键结论与 Takeaway

- **论文自身宣称的贡献**：首次在主流生成式推荐中实现完整 Coconut 式潜在推理 + 自适应步数控制；通过两阶段 SFT、CoT 语义对齐、REINFORCE 系统解决三大挑战。

- **最有价值的 Takeaway**：
  1. **潜在推理不是免费午餐**：直接迁移 Coconut 到推荐会降低性能，必须解决 SID 缺乏语义先验的根本问题——两阶段解耦是关键
  2. **对齐方法极度敏感**：KL 散度是唯一有效的对齐方式，Cosine/MSE 均失效甚至有害，因为 KL 保留分布形状信息
  3. **自适应优于所有固定配置**：Policy Head + REINFORCE 不仅压缩步数（4.2→2.5），还同时提升质量——因为它学会了"哪些样本需要深度推理"
  4. **稀疏场景增益最大**：潜在推理的语义理解能力可以补偿稀疏协同信号的不足
  5. **SFT-then-RL 范式的系统性设计**：SFT 阶段 warm-start Policy Head + 逐步对齐，RL 阶段切换 Terminal-only 对齐以适配变长推理，设计环环相扣

## 6. 局限性与开放问题

- **方法局限**：
  - 隐状态反馈循环无法 teacher forcing，必须顺序前向传播，是潜在推理范式的系统性瓶颈
  - 依赖 GPT-5 生成 teacher CoT 作为对齐监督，数据生成成本高
  - Policy Head 的最大步数 $N_{\max}=8$ 是预设超参数，未探索更大搜索空间

- **实验局限**：
  - 仅在 Amazon 三个公开数据集评估，规模较小（万级 user/item），未在工业级数据验证
  - 基线比较中 ReaRec 基于判别式架构，不完全公平
  - Beauty HR@20 未超越 Explicit CoT，高召回位表现有限

- **工业落地挑战**：
  - latent loop 的顺序执行在大规模在线 serving 中可能成为瓶颈
  - CoT 对齐锚点的质量依赖 teacher 模型，需要持续维护
  - SID 编码方案（RQ-KMeans）对 item 更新频繁的场景需要重建

- **开放问题**：
  - 潜在推理能否扩展到对话式推荐、跨域推荐等更复杂场景？
  - 是否存在不依赖显式 CoT 对齐的自监督潜在推理方案？
  - 如何并行化 latent loop 以适应超大规模部署？

## 7. 应用价值分析

- **技术可借鉴性**：
  - 两阶段解耦思想通用性强：任何需要联合学习新符号系统 + 连续空间推理的场景都可参考
  - Policy Head + REINFORCE 的自适应计算分配是 test-time compute scaling 在推荐中的具体实践
  - Terminal KL 对齐策略解决了变长推理链的对齐难题，可推广至其他动态步数场景

- **适用场景**：
  - 数据稀疏的冷启动/长尾推荐（论文证明稀疏场景增益最大）
  - 需要推理能力但对延迟敏感的在线推荐（20 倍加速相对显式 CoT）
  - 基于 Semantic ID 的生成式检索/推荐系统

- **改造建议**：
  - 若已有 SID 编码体系，可直接在 Stage 1 复用已有 SID SFT 模型，仅做 Stage 2 + RL
  - Teacher CoT 可用开源模型（如 DeepSeek-R1）替代 GPT-5 降低成本
  - Policy Head 可扩展为考虑 serving latency budget 的约束优化

- **与我们现有工作的关联**：对于已有生成式推荐 pipeline 的团队，LASAR 提供了一种低成本引入推理能力的路径——仅增加 7-16% 推理延迟，不改变 SID 体系和 prompt 格式，可增量部署。

- **ROI 评估**：中高。核心收益是在几乎不增加推理延迟的前提下提升推荐质量（Sports NDCG@5 +22%），但需要 GPT-5 生成 CoT 数据的前期投入，且工业级规模验证尚缺。适合作为下一代生成式推荐架构的探索方向。

## 8. 关键引用与延伸阅读

- **Coconut** [Hao et al., 2024]：潜在推理范式开创工作，隐状态反馈循环，arXiv:2412.06769
- **MiniOneRec** [Kong et al., 2025]：开源生成式推荐框架，LASAR 的直接基础，arXiv:2510.24431
- **GREAM** [Hong et al., 2025]：显式 CoT + RL 用于生成式推荐，arXiv:2510.20815
- **ReaRec** [Tang et al., 2025]：推荐领域潜在推理，SASRec 架构 + 固定步数，arXiv:2503.22675
- **CODI** [Shen et al., 2025]：CoT 自蒸馏压缩至连续空间，EMNLP 2025
- **LARES** [Liu et al., 2025]：深度循环潜在推理框架，自监督预训练 + RL，arXiv:2505.16865
- **DeepSeek-R1** [DeepSeek-AI, 2025]：RL 驱动显式推理极致化，arXiv:2501.12948
- **TIGER** [Rajput et al., 2023]：Semantic ID 生成式检索开创工作，NeurIPS 2023
- **ManCAR** [Yang et al., 2026]：流形约束潜在推理防止表征漂移，arXiv:2602.20093
