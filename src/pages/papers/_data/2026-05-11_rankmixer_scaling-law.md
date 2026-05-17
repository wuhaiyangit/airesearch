---
原文件: "rankermix.pdf"
title: "RankMixer: Scaling Up Ranking Models in Industrial Recommenders"
authors: "Jie Zhu*, Zhifang Fan*, Xiaoxie Zhu*, Yuchen Jiang*, Hangyu Wang, Xintian Han, Haoran Ding, Xinmin Wang, Wenlin Zhao, Zhen Gong, Huizhi Yang, Zheng Chai, Zhe Chen, Yuchao Zheng, Qiwei Chen, Feng Zhang, Xun Zhou, Peng Xu, Xiao Yang, Di Wu, Zuotao Liu"
affiliation: "ByteDance"
year: "2025"
venue: "arXiv:2507.15551v3 [cs.IR], accepted at ACM CIKM 2025"
category: "模型Scaling UP"
abstract: "提出 RankMixer，硬件感知的统一可扩展特征交互架构，用 multi-head token mixing 替换二次注意力，在保持推理延迟不变的前提下将模型参数扩展两个数量级，MFU 从 4.5% 提升至 45%，在线 DAU +0.3%，时长 +1.08%。"
tags: ["Scaling Law", "Ranking Model", "推荐系统", "Sparse-MoE"]
Hash: "4ce87d626d0a9945"
RecRatio: "7/9"
Team: "ByteDance 推荐系统核心团队"
Reason: "字节跳动工业级 Scaling Law 实践，解决推荐系统大模型部署核心痛点，工程价值极高"
精读日期: "2026-05-11"
报告字数: "约 3500 字"
---

## 1. 摘要与核心贡献

> 本节对论文的 Abstract 进行详细展开，确保读者不看原文也能完整理解论文要解决什么、怎么解决、效果如何。

### 研究问题

工业推荐系统面临 LLM 时代 scaling up 的两个核心障碍：其一，训练和服务必须严格遵守延迟约束和高 QPS 要求；其二，大多数人工设计的特征交叉模块继承自 CPU 时代，无法充分利用现代 GPU，导致极低的 Model Flops Utilization（MFU，单位数百分比）以及糟糕的可扩展性。

### 动机

传统推荐系统排序模型架构遵循 CPU 时代的设计原则——依赖异构的、手工设计的特征交叉模块提取特征交互，但这些核心算子大多是内存绑定（memory-bound）而非计算绑定（compute-bound），在现代 GPU 上并行度极差。更关键的是，CPU 时代模型的计算成本与参数量近似成正比，导致 scaling law 暗示的巨大 ROI 潜力在实践中难以实现。因此，研究 DLRM 的 scaling law 必须解决两个问题：（1）架构必须硬件对齐，最大化 MFU 和计算吞吐量；（2）模型设计必须利用推荐数据的特性——异构特征空间和跨数百个字段的个性化交叉特征交互。

### 方法概要

论文提出 **RankMixer**，一种硬件感知的模型设计方法，核心包含两个可扩展组件：
1. **Multi-Head Token Mixing**：通过无参数算子实现 token 间特征交叉，在性能和计算效率上均超越自注意力机制；
2. **Per-token FFN**：扩展模型容量，通过为不同特征子空间分配独立参数解决 inter-feature-space domination 问题，同时与推荐数据模式高度对齐。

进一步将 per-token FFN 扩展为 **Sparse Mixture-of-Experts (MoE)** 结构，通过动态路由策略解决专家训练不平衡问题。

### 主要结果

- 在万亿级生产数据集上验证了卓越的 scaling 能力；
- 替换原有手工设计的低 MFU 模块后，MFU 从 4.5% 提升至 45%（约 10 倍）；
- 在维持相近推理延迟的条件下，将模型参数扩展 70 倍（从 16M 到 1.1B）；
- 在线 A/B 测试（抖音 Feed 推荐 + 广告场景）验证：DAU +0.3%，App 使用时长 +1.08%。

### 核心贡献

1. 提出硬件感知的 RankMixer 架构，设计 multi-head token mixing 和 per-token FFN 策略高效捕获异构特征交互，并使用动态路由策略提升 SparseMoE 的可扩展性；
2. 利用高 MFU 和性能优化杠杆，在不增加推理成本的前提下将模型参数扩展 70 倍（包括 MFU 提升和量化优化）；
3. 在万亿级工业推荐数据集上进行了大量离线和在线实验，验证了模型 scaling law，RankMixer 已成功部署于抖音 Feed 推荐排序全流量服务，DAU +0.3%，时长 +1.08%。

---

## 2. 业界进展与相关工作

### 领域发展脉络

现代推荐系统基于 Deep Learning Recommendation Models（DLRM），特征交互建模是 DLRM 的关键因素。发展历程：
- **Wide&Deep（2016）**：结合 LR（wide 部分）和 DNN（deep 部分）捕获低阶和高阶特征交互；
- **DeepFM（2017）**：融合 FM 和 DNN；
- **DeepCross（2016）**：残差网络扩展，自动学习隐式特征交互；
- **DCN/DCNv2**：显式高阶特征交叉；
- **xDeepFM、FiGNN、AutoInt、Hiformer** 等进一步探索。

在 Scaling Law 方面，自 LLM 时代开始，研究者开始探索 DLRM 的 scaling 策略：
- 早期研究只是简单拓宽或堆叠特征交互层，收益有限甚至为负；
- **DHEN** 和 **Wukong** 聚焦设计创新 DNN 结构以提升 scaling 性能；
- **HSTU** 增强了生成式推荐器的 scaling 效应；
- **RankMixer** 则从硬件对齐角度出发。

### 主要技术路线对比

| 技术路线 | 代表工作 | 核心思想 | 局限性 |
|---|---|---|---|
| 显式交叉（DCN/xDeepFM 等） | DCNv2, AutoInt | 设计特定算子显式捕获高阶特征交互 | 模型小，延迟和内存消耗高 |
| 注意力机制 | HiFormer, AutoInt | 用注意力机制学习复杂交互 | 在异构特征空间上相似度计算困难，计算代价高 |
| 异构集成（DHEN） | DHEN | 组合多种交互算子 | 模型尺寸仍偏小 |
| TokenMixer 系列 | RankMixer, Wukong | 用规则化 token 混合替代注意力 | 参数共享，缺乏可学习性 |
| Scaling 导向 | Wukong, HSTU | 堆叠 FM/注意力块探索 scaling law | 架构本身与硬件对齐不足 |

### 最相关的前序工作

1. **DHEN（arXiv 2022）**：组合多种异构特征交叉块（DCN/self-attention/FM/LR）堆叠多层，是 RankMixer 的直接前序，但 DHEN 的 cross structure 可扩展性有限，MFU 仍然较低；
2. **Wukong（ICML 2024）**：堆叠 FM Block 和 Linear Compress Block 探索特征交互的 scaling law，但计算成本随参数量增长过快；
3. **HiFormer / AutoInt**：使用注意力机制进行特征交互，但在异构语义空间中，内积相似度计算本身就是一个难点；
4. **HSTU**：增强生成式推荐器的序列 scaling，但主要聚焦在序列建模而非特征交互。

### 本文定位

RankMixer 填补了"硬件感知模型设计与推荐系统 scaling"的空白——不仅提出新的可学习特征交互架构（multi-head token mixing + per-token FFN），更重要的是将 MFU 优化作为核心设计原则，实现了参数量与计算成本、延迟的解耦，是工业场景下真正可部署的 scaling 方案。

---

## 3. 详细技术方案

### 3.1 整体框架

RankMixer 由 L 个连续的 RankMixer Block 组成，每个 Block 包含两个主要组件：
1. **Multi-Head Token Mixing Layer**
2. **Per-token Feed-Forward Network (PFFN) Layer**

整体流程（见原文 Figure 1）：

输入向量 $e_{input}$ 被 token 化（Tokenization）为 T 个特征 token $x_1, x_2, ..., x_T$，每个 token 代表一个内聚的特征向量。L 层 RankMixer Block 迭代精炼 token 表示：

$$S_{n-1} = LN(TokenMixing(X_{n-1}) + X_{n-1})$$

$$X_n = LN(PFFN(S_{n-1}) + S_{n-1})$$

其中 $LN(\cdot)$ 是 LayerNorm，$X_n \in \mathbb{R}^{T \times D}$ 是第 n 个 Block 的输出，$D$ 是隐藏维度。最终输出 $o_{output}$ 由最终层表示的均值池化得到，用于计算不同任务预测。

### 3.2 关键模块详解

#### 3.2.1 输入层与特征 Token 化

特征包括：User Profile（用户ID等）、Video Features（视频ID等）、Sequence Features（行为序列）、Cross Features（交叉特征）。所有特征转换为不同维度的 embeddings。

为解决"数百个特征→token 数量"的两难困境，论文提出**基于语义的 token 化方法**：将特征按语义聚类成若干内聚组，每组内的特征按序拼接为一个 embedding 向量，再按固定维度切分为适当数量的 token。每个特征 token $x_i \in \mathbb{R}^D$ 代表一组具有相似语义方面的特征 embedding：

$$x_i = Proj(e_{input}[d \cdot (i-1) : d \cdot i]), \quad i = 1, ..., T$$

#### 3.2.2 Multi-Head Token Mixing

每个 token 均分为 H 个头，第 t 个 token 的第 h 个头为 $x_t^{(h)}$：

$$x_t^{(1)} \| x_t^{(2)} \| ... \| x_t^{(H)} = SplitHead(x_t)$$

每个头对应一个特征子空间（推荐任务需要从不同角度考虑），Token Mixing 用于融合这些子空间的向量实现全局特征交互。Token Mixing 后第 h 个头的输出 $s_h$：

$$s_h = Concat[x_1^{(h)}, x_2^{(h)}, ..., x_T^{(h)}]$$

输出 $S \in \mathbb{R}^{H \times \frac{TD}{H}}$，文中设置 $H = T$ 以保持 Token Mixing 后 token 数量不变便于残差连接。

**与自注意力的关键差异**：自注意力在 NLP 中表现优异，但在推荐系统中是次优的。核心问题在于：NLP 中所有 token 共享统一的 embedding 空间，而推荐任务的特征空间本质上是异构的。在异构语义空间之间计算内积相似度本身就是难题——特别是在推荐系统中，用户侧和 item 侧的 ID 空间可能包含数亿级别元素。因此，自注意力在异构输入上并没有比无参数的 multi-head token mixing 更好，且消耗更多计算和内存。

#### 3.2.3 Per-token FFN

传统 DLRM 和 DHEN 模型倾向于在单一交互模块中混合来自许多不同语义空间的特征，这会导致高频字段主导、淹没低频或长尾信号。RankMixer 引入**参数隔离的 FFN 架构 per-token FFN**。

在传统设计中，所有 token 共享 FFN 参数；而 per-token FFN 为每个 token 分配独立的变换：

$$v_t = f_{pffn,2}^{t}(Gelu(f_{pffn,1}^{t}(s_t)))$$

其中 $f_{pffn,i}^{t}(x) = x W_{pffn,i}^{t} + b_{pffn,i}^{t}$，$W_{pffn,1}^{t} \in \mathbb{R}^{D \times kD}$，$W_{pffn,2}^{t} \in \mathbb{R}^{kD \times D}$，k 是调整 per-token FFN 隐藏维度的超参数。

**关键特性**：
- Per-token FFN 在保持计算复杂度不变的同时，通过引入更多参数增强了建模能力；
- Per-token FFN 与 MMoE 的区别：MMoE 中所有 experts 共享同一个输入，而 Per-token FFN 每个 token 有独立的输入；同时切分了输入和参数，有助于学习不同特征子空间中的多样性。

### 3.3 Sparse MoE in RankMixer

为进一步提升 scaling ROI，将每个 per-token FFN 替换为 Sparse MoE 块，使模型容量增长而计算成本基本保持不变。

**Vanilla Sparse-MoE 在 RankMixer 中退化的两个原因**：
1. **均匀 k-expert 路由**：Top-k 选择对所有特征 token 一视同仁，对低信息量 token 浪费预算，高信息量 token 得不到足够服务；
2. **专家训练不足**：Per-token FFN 已经用 #tokens 倍增了参数数量；再加上非共享 experts，expert 总数爆炸，导致路由极度不平衡、expert 训练不足。

**两个互补的训练策略**：

**ReLU Routing**：将通用的 Top-k + softmax 替换为 ReLU gate + 自适应 $\ell_1$ 惩罚，赋予 token 灵活的 expert 数量并保持可微性：

$$G_{i,j} = ReLU(h(s_i))_{j}, \quad v_i = \frac{1}{N_e} \sum_{j=1}^{N_e} G_{i,j} e_{i,j}(s_i)$$

稀疏性由 $L_{reg}$ 控制（系数 $\lambda$）保持平均 active-expert 比率接近预算。

**Dense-training / Sparse-inference (DTSI-MoE)**：借鉴 [21]，采用两个路由器 $h_{train}$ 和 $h_{infer}$，$L_{reg}$ 仅应用于 $h_{infer}$。训练期间两者同时更新，推理时仅用 $h_{infer}$。DS-MoE 使 experts 不会因训练不足而性能退化，同时降低推理成本。

### 3.4 Scaling Up 方向

RankMixer 是高度并行和可扩展的架构，参数量和计算成本可沿四个正交轴扩展：Token 数量 T、模型宽度 D、层数 L 和专家数量 E。

对于全 dense 版本，单样本参数量和前向 FLOPs：

$$\#Param \approx 2 k L T D^2, \quad FLOPs \approx 4 k L T D^2$$

对于 Sparse-MoE 版本，有效参数量和每 token 计算量由稀疏比 $s = \frac{\#Activated\_Param}{\#Total\_Param}$ 进一步缩放。

实验发现：模型质量主要与总参数量相关，不同 scaling 方向（depth L, width D, tokens T）几乎产生相同性能。从计算效率看，较大的 hidden-dim 产生更大的矩阵乘法形状，因此比堆叠更多层能达到更高的 MFU。最终 100M 和 1B 配置分别设为 ($D=768, T=16, L=2$) 和 ($D=1536, T=32, L=2$)。

### 3.5 训练策略与优化

- 优化器：Dense 部分使用 RMSProp（learning rate = 0.01），Sparse 部分使用 Adagrad；
- 分布式训练：数百 GPU 混合分布式训练框架，sparse 部分异步更新，dense 部分同步更新；
- 损失函数包含任务损失 + 稀疏性正则项 $L = L_{task} + \lambda L_{reg}$。

### 3.6 推理/部署策略

- 使用 Half-precision（fp16）推理，使 GPU 理论峰值 FLOPs 提升 2 倍；
- RankMixer 中的大矩阵乘法非常适合半精度推理；
- 工程优化：融合并行的 per-token FFNs 为单一 kernel，减少内存带宽开销和 overhead；
- 通过 FLOPs/Param 比率降低 3.6× + MFU 提升 10× + fp16 2×，实现参数增加 70× 但延迟保持不变。

---

## 4. 实验设计与结果分析

### 4.1 实验设置

**数据集与环境**：使用抖音推荐系统的训练数据（在线日志和用户反馈标签）。训练数据集包含超过 300 个特征（数值特征、ID特征、交叉特征、序列特征），涵盖数十亿用户 ID 和数亿视频 ID，全部转换为 embeddings。每日覆盖万亿条记录，实验采用两周数据。

**评估指标**：
- **AUC / UAUC**（主要性能指标）：Finish/Skip 标签的 AUC 和 UAUC；
- **Dense-Param**：不含稀疏 embedding 的 dense 部分参数量；
- **Training Flops/Batch**：单批次 512 样本前向计算量；
- **MFU**：Model FLOPs Utilization，衡量 GPU 浮点运算有效利用率。

**Baseline 方法**：DLRM-MLP、DCNv2、RDCN、MoE、AutoInt、DHEN、HiFormer、Wukong。

### 4.2 主实验结果

**表 1：~100M 参数推荐模型性能与效率对比（最佳值加粗）**

| Model | Finish AUC↑ | Skip AUC↑ | Params | FLOPs/Batch |
|---|---|---|---|---|
| DLRM-MLP (base) | 0.8554 | 0.8124 | 8.7M | 52G |
| DLRM-MLP-100M | +0.15% | +0.15% | 95M | 185G |
| DCNv2 | +0.13% | +0.15% | 22M | 170G |
| RDCN | +0.09% | +0.10% | 22.6M | 172G |
| MoE | +0.09% | +0.08% | 47.6M | 158G |
| AutoInt | +0.10% | +0.12% | 19.2M | 307G |
| DHEN | +0.18% | +0.36% | 22M | 158G |
| HiFormer | +0.48% | — | 116M | 326G |
| Wukong | +0.29% | +0.49% | 122M | 442G |
| **RankMixer-100M** | **+0.64%** | **+0.86%** | **107M** | **233G** |
| **RankMixer-1B** | **+0.95%** | **+1.25%** | **1.1B** | **2.1T** |

**结果分析**：
- 简单将 DLRM 扩展到 100M 参数收益有限，凸显了为推荐数据特性量身设计模型以获得更好 scaling 性能的重要性；
- DCN、RDCN、AutoInt、DHEN 等经典 cross-structure 设计存在参数量和计算成本之间的不平衡——参数量小但 FLOPs 已很大；
- RankMixer 在 FLOPs 适中的情况下实现了最佳性能，在类似参数设置下，不仅性能更优，计算需求也更低；
- HiFormer 和 Wukong 的 scaling-up 模型对比中，RankMixer 以更低的计算成本实现了更好的性能。

### 4.3 Scaling Laws 分析

Figure 2 展示了不同模型的 scaling law 曲线（参数 vs FLOPs）：
- **RankMixer** 在参数量和 FLOPs 两个维度上都呈现最陡峭的 scaling law；
- Wukong 虽然参数量曲线较陡，但计算成本增长更快，在 AUC vs FLOPs 曲线上的差距更大；
- HiFormer 性能略逊于 RankMixer，反映出其在特征级 token 分段和对注意力依赖上的效率问题；
- DHEN 的 scaling 表现不理想，cross structure 的可扩展性受限；
- MoE 通过增加 experts 的 scaling 策略带来了维护 expert 平衡的挑战，scaling 表现次优。

### 4.4 消融实验

**表 2：RankMixer-100M 组件消融**

| Setting | ΔAUC |
|---|---|
| w/o skip connections | −0.07% |
| w/o multi-head token mixing | −0.50% |
| w/o layer normalization | −0.05% |
| Per-token FFN → shared FFN | −0.31% |

移除 Multi-Head Token Mixing 导致最大性能下降（−0.50%），说明没有 token 间的全局交互，每个 FFN 仅建模部分特征。移除残差连接和 LayerNorm 也使性能恶化，训练稳定性下降，梯度爆炸或消失问题更易发生。

**表 3：Token 到 FFN 的路由策略对比**

| Routing strategy | ΔAUC | ΔParams | ΔFLOPs |
|---|---|---|---|
| All-Concat-MLP | −0.18% | 0.0% | 0.0% |
| All-Share | −0.25% | 0.0% | 0.0% |
| Self-Attention | −0.03% | +16% | +71.8% |

- All-Share 性能大幅下降，说明特征子空间分割和独立建模的重要性；
- Self-Attention 性能略逊于 Multi-Head Token Mixing，且计算成本高（参数量+16%，FLOPs+71.8%），反映了在数百个不同特征子空间之间学习相似度的困难。

### 4.5 Sparse-MoE 可扩展性与专家平衡

**图 3 分析**：将 Dense-Training-Sparse-Inference 与 ReLU routing 相结合，是在激进稀疏下保持精度的关键，使 RankMixer 参数量能力（和内存占用）扩展超过 8 倍，同时几乎不损失 AUC，且推理吞吐量提升 50% 以上。Vanilla SMoE 随 expert 减少性能单调下降，说明 expert 不平衡和训练不足问题。添加负载均衡损失虽有缓解但仍不及 DTSI+ReLU 版本，因为问题主要在于 expert 训练而非路由器。

**图 4 分析**：DTSI + ReLU routing 有效解决了专家不平衡问题：Dense-training 保证大多数 expert 获得充分的梯度更新，防止 expert 饥饿；ReLU routing 使激活比率在 token 之间动态变化——激活比例根据信息内容自适应调整，与推荐数据的高度动态分布高度对齐。

### 4.6 在线服务与部署成本

**表 6：在线模型部署与成本指标**

| Metric | OnlineBase-16M | RankMixer-1B | Change |
|---|---|---|---|
| #Param | 15.8M | 1.1B | ↑ 70× |
| FLOPs | 107G | 2106G | ↑ 20.7× |
| Flops/Param(G/M) | 6.8 | 1.9 | ↓ 3.6× |
| MFU | 4.47% | 44.57% | ↑ 10× |
| Hardware FLOPs | fp32 | fp16 | ↑ 2× |
| Latency | 14.5ms | 14.3ms | — |

延迟公式分解：$Latency = \frac{\#Param \times FLOPs/Param}{MFU \times Theoretical Hardware FLOPs}$。参数量增加两个数量级，被三个因素逐步抵消：FLOPs/Param 比率降低 3.6×、MFU 提升 10×、fp16 推理硬件 FLOPs 提升 2×。

### 4.7 在线性能

**表 4：抖音 Feed 推荐场景在线 A/B 测试**（长期反向 A/B 测试持续观察 8 个月，收益尚未收敛，结果仍在持续提升）：

| 分组 | Active Day↑ | Duration↑ | Like↑ | Finish↑ | Comment↑ |
|---|---|---|---|---|---|
| 总体 | +0.2908% | +1.0836% | +2.3852% | +1.9874% | +0.7886% |
| 低活跃用户 | +1.7412% | +3.6434% | +8.1641% | +4.5393% | +2.9368% |
| 中活跃用户 | +0.7081% | +1.5269% | +2.5823% | +2.5062% | +1.2266% |
| 高活跃用户 | +0.1445% | +0.6259% | +1.828% | +1.4939% | +0.4151% |

**表 5：广告场景在线提升**：ΔAUC +0.73%，ADVV +3.90%。

**关键发现**：低活跃用户的改善幅度最大（DA +1.74%, Duration +3.64%），表明 RankMixer 具有强大的泛化能力。RankMixer 作为统一 backbone 可靠地泛化到不同应用场景。

---

## 5. 关键结论与 Takeaway

### 论文自身宣称的贡献

1. ✅ **硬件感知的模型设计方法**：multi-head token mixing + per-token FFN + 动态路由 SparseMoE，设计合理且有充分 ablation 支持；
2. ✅ **70× 参数扩展且不增加推理成本**：通过 FLOPs/Param↓3.6× + MFU↑10× + fp16 2× 的组合实现，名副其实；
3. ✅ **在线 A/B 显著提升**：DAU +0.3%, Duration +1.08%，且 8 个月观察收益未收敛，实证可信度高。

### 最有价值的 Takeaway

1. **MFU 优化是工业推荐系统 scaling 的核心杠杆**：将 MFU 从 4.5% 提升到 45% 比单纯增大模型参数量更重要，内存绑定→计算绑定的范式转换是关键；
2. **Per-token FFN 是捕获异构特征子空间多样性的有效手段**：每个 token 有独立参数避免了高频字段主导问题，与推荐数据的高度动态分布天然对齐；
3. **参数 scaling 与计算成本解耦的工程路径**（D=768→1536, T=16→32）：增加 hidden dimension 比堆叠层数在 MFU 上更高效；
4. **ReLU Routing + DTSI 是 SparseMoE 在推荐系统落地的必要组合**：解决了 expert 训练不足和路由不平衡两个核心问题；
5. **Multi-head Token Mixing > Self-Attention for 推荐**：在异构语义空间中，无参数规则交叉反而优于可学习的内积相似度，说明推荐系统的特征交互需要不同的 inductive bias。

---

## 6. 局限性与开放问题

### 方法局限

1. Multi-head Token Mixing 作为规则化操作，仍然缺乏全局可学习性——UniMixer（快手）在这方向上进行了参数化改进；
2. Per-token FFN 参数量随 token 数量线性增长，对于 T 很大的场景（如超长用户行为序列）内存压力仍然存在；
3. 实验仅覆盖推荐和广告两大场景，电商、内容平台等场景的泛化性有待验证。

### 实验局限

1. 仅在抖音平台数据上验证，在其他公司的推荐系统上效果可能不同；
2. 在线 A/B 测试仅报告了 8 个月结果，长期（>1年）的模型衰减和效果稳定性未分析；
3. 推理延迟的比较基准（14.5ms vs 14.3ms）差距极小，测量噪声可能导致误判。

### 工业落地挑战

1. Per-token FFN 的独立参数量管理在分布式训练中需要额外工程支持（张量分区、gradient sync 等）；
2. DTSI-MoE 方案需要维护两套路由器，部署复杂度提升；
3. 在极低延迟场景（如 <5ms）下，MFU 优化的收益可能被工程瓶颈（如序列化开销、网络延迟）抵消。

### 开放问题

1. 如何将 RankMixer 与序列建模（如 HSTU、LONGER）结合，形成统一的生成式推荐 backbone？
2. Per-token FFN 的参数独立性与 embedding 共享之间的最优平衡点在哪里？
3. Scaling law 在推荐系统中是否具有与 NLP 相似的"能力跃迁"现象？

---

## 7. 应用价值分析

### 技术可借鉴性

1. **MFU 优先的模型设计理念**：在设计任何工业推荐模型时，应将算子是否计算绑定作为首要评估标准，memory-bound 的算子（如低效的注意力）应尽早替换；
2. **Per-token FFN 设计**：对于多业务线或多场景的模型，可以通过 Per-token FFN 实现场景间的参数隔离，减少干扰；
3. **DTSI-MoE 训练策略**：在训练大规模 MoE 模型时，dense-train + sparse-inference 的两阶段策略可直接复用。

### 适用场景

- **高延迟约束（10-20ms）的工业排序场景**：RankMixer 是当前最优方案之一；
- **特征维度极高（>100 个）且异构的推荐系统**：Multi-head Token Mixing 天然适配；
- **需要将模型从 10M 级扩展到 100M+ 级的场景**：SparseMoE + DTSI 组合提供了清晰的路径。

### 改造建议

如要在我们的推荐系统中落地 RankMixer：
1. **特征 Token 化设计**：需要按语义分组特征，设计合适的 T（H），这需要离线分析特征共现模式和重要性；
2. **Per-token FFN 的分布式实现**：需要重新设计参数服务器或使用 ZeRO 类优化策略；
3. **离线验证 MFU 提升**：使用 profiler 验证 GPU 利用率是否达标。

### 与现有工作的关联

- **search-ad-qa-react-agent**：RankMixer 的 token 化思路可启发 query-item 的语义 token 表示方式；
- **生成式推荐书**：可作为第 4 章（推荐系统 Scaling）或第 5 章（排序模型架构）的高价值案例，补充工业级 scaling 实操内容；
- **OneSearch/V2 研究**：多 token 交互的思路可借鉴到生成式召回的语义 token 交互设计中。

### ROI 评估

**高 ROI**：RankMixer 的核心价值在于提供了工业级、可部署的 scaling 路径，MFU 优化思路具有普适性，即使不直接部署 RankMixer 架构，其设计哲学（硬件对齐、参数解耦）对所有推荐系统模型设计都有指导意义。

---

## 8. 关键引用与延伸阅读

1. **Wukong（ICML 2024）**：Towards a Scaling Law for Large-Scale Recommendation. Buyun Zhang et al. — RankMixer 的直接对标工作，探索 FM-style 交互的 scaling law，适合对比阅读
2. **TokenMixer-Large（arXiv 2026）**：Scaling up to 13B configurations，探讨辅助残差连接和定制损失函数，适合进一步探索 TokenMixer 的 scaling 上限
3. **DHEN（arXiv 2022）**：Deep and Hierarchical Ensemble Network for large-scale CTR prediction — RankMixer 的前序工作，理解异构交互模块的设计演进
4. **HSTU（ICML 2024）**：Trillion-parameter Sequential Transducers for Generative Recommendations — 生成式推荐器的 scaling 研究，与 RankMixer 的特征交互 scaling 形成互补
5. **LONGER（arXiv 2025）**：Scaling Up Long Sequence Modeling in Industrial Recommenders — 抖音团队长序列建模工作，可与 RankMixer 结合形成完整推荐 backbone
6. **ReMoE（arXiv 2024）**：Fully Differentiable Mixture-of-Experts with ReLU Routing — RankMixer SparseMoE 的理论基础，ReLU routing 的原创工作
