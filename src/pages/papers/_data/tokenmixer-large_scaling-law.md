---
原文件: "TokenMixer-Large.pdf"
title: "TokenMixer-Large: Scaling Up Large Ranking Models in Industrial Recommenders"
authors: "Yuchen Jiang, Jie Zhu, Xintian Han, Hui Lu, Kunmin Bai, Mingyu Yang, Shikang Wu, Ruihao Zhang, Wenlin Zhao, Shipeng Bai, Sijin Zhou, Huizhi Yang, Tianyi Liu, Wenda Liu, Ziyan Gong, Haoran Ding, Zheng Chai, Deping Xie, Zhe Chen, Yuchao Zheng, Peng Xu 等 (ByteDance AML)"
affiliation: "ByteDance AML (ByteDance 推荐系统机器学习团队)"
year: "2026"
venue: "ACM Conference (arXiv preprint arXiv:2602.06563v2)"
category: "模型Scaling UP"
abstract: "字节跳动提出 TokenMixer-Large，通过系统设计解决深层 TokenMixer 的梯度消失和稀疏化难题，通过混合-恢复操作、层间残差和辅助损失确保深层稳定梯度传播，集成 Sparse Per-token MoE 实现「稀疏训练、稀疏服务」范式，在抖音广告、电商和直播三大场景实现产品级部署，参数扩展到 70 亿（在线）和 150 亿（离线），电商订单提升 +1.66%、广告 ADSS 提升 +2.0%、直播收入提升 +1.4%。"
tags: ["scaling-law", "ranking-model", "token-mixer", "sparse-moe", "industrial-rec"]
Hash: "62b61c910ab7b34b"
RecRatio: "8 / 9"
Team: "ByteDance AML"
Reason: "字节跳动 RankMixer 续作，系统解决深层 TokenMixer 的梯度/稀疏化瓶颈，工程价值极高"
精读日期: "2026-05-13"
报告字数: "约 3500 字"
---

## 1. 摘要与核心贡献

### 研究问题

随着推荐系统模型 Scaling Laws 研究的发展，现有架构（如 Wukong、HiFormer、DHEN）在工业场景中面临两个核心瓶颈：其一，次优的架构设计导致硬件利用率不足，限制了实际可扩展性；其二，字节跳动前期提出的 TokenMixer 架构（RankMixer 论文）在深层配置下遇到关键困难——包括次优残差路径、梯度消失、不完整的 MoE 稀疏化，以及受限的可扩展性。这些问题导致 TokenMixer 通常只能配置为浅层（RankMixer 仅 2 层），无法有效利用深度带来的表征能力。

### 动机

当前工业级 SOTA 模型结构是 TokenMixer——一种高度简化的 Transformer 变体，通过将自注意力替换为轻量级 token 混合操作显著降低计算复杂度。RankMixer 将其作为骨干网络，验证了该结构在排序模型中的有效性，并通过硬件感知协同设计大幅提升 Model FLOPs Utilization（MFU）。然而，TokenMixer 在深层配置时存在四大设计缺陷：次优残差设计（token 混合后维度不匹配导致语义错位）、不纯净的模型架构（大量碎片化算子导致内存访问瓶颈）、深层模型梯度更新不足、以及稀疏 MoE 采用"Dense 训练、Sparse 推理"范式导致训练成本未降低。

### 方法概要

本文提出 TokenMixer-Large，一个为极致规模推荐系统设计的系统性演进架构。核心设计包括：（1）混合-恢复（Mixing & Reverting）操作，通过双层 TokenMixer 结构（第一层混合原始 token 信息，第二层恢复维度）解决维度不匹配问题；（2）层间残差（Inter-layer Residual）和辅助损失机制，确保深层稳定梯度传播；（3）Sparse Per-token MoE，升级为"稀疏训练、稀疏服务"范式，结合 FP8 量化和 Token Parallel 优化实现高效扩展。

### 主要结果

TokenMixer-Large 成功将模型扩展到在线流量 70 亿参数和离线实验 150 亿参数。在抖音电商、广告和直播三大场景的全量部署中，电商订单提升 +1.66%、每用户预览支付 GMV 提升 +2.98%、广告 ADSS 提升 +2.0%、直播收入提升 +1.4%，服务数亿用户。广告骨干网络的 MFU 从基线提升至 60%。

### 核心贡献

1. **提出混合-恢复操作**：重新审视并重新设计 TokenMixer 中有缺陷的残差机制，通过消融实验验证 TokenMixer-Large 是更优的模型架构。

2. **纯模型设计理念**：观察到随着模型规模扩展，低层碎片化算子（如 DCN、LHUC）的收益可被堆叠的多个 TokenMixer Block 吸收。移除这些算子可将广告骨干网络的 MFU 大幅提升。

3. **深层模型梯度稳定化**：在 TokenMixer-Large Block 中引入层间残差、辅助损失机制和下投影小初始化，促进深层模型更好收敛。

4. **升级为 Sparse Per-token MoE**：将 RankMixer 中的 relu-MoE 升级为统一"稀疏训练、稀疏服务"范式的 Sparse-Pertoken MoE，结合高效算子设计和 FP8、Token Parallel 等工程优化，显著降低训练和推理成本。

5. **Scaling Laws 全面验证**：在不同业务场景下验证 TokenMixer-Large 的 Scaling Laws，成功将模型扩展到离线 15B 和在线 7B 参数。

---

## 2. 业界进展与相关工作

### 领域发展脉络

深度学习推荐模型（DLRM）的核心在于设计有效的特征交互架构。早期的 Wide & Deep 通过 bagging 风格同时捕获低阶和高阶特征交互，后续的 DeepFM、DCN、DCNv2、FAT 等在此基础上不断演进。然而，这些早期设计仍依赖 CPU 时代的高延迟算子，未能充分利用 GPU 的计算能力。

近年来，两条技术路线推动推荐系统 Scaling Laws 研究：（1）DHEN 和 Wukong 通过 bagging 思想集成多种特征交互模块（DCN/SA/FMB）并堆叠多层，验证了"统一设计、堆叠层数"迭代模式的有效性；（2）Transformer 系列（如 HiFormer、AutoInt）通过注意力机制增强特征交互能力，RankMixer 和 MLP-Mixer 将注意力简化为更轻量的 token 混合操作，降低了二次计算复杂度。

### 主要技术路线对比

| 技术路线 | 代表工作 | 核心思想 | 优势 | 局限 |
|---------|---------|---------|------|------|
| Bagging 类 | DHEN, Wukong | 多模块集成 + 堆叠 |  Scaling 可解释性强 | 硬件利用率仍有优化空间 |
| Transformer 类 | HiFormer, AutoInt | 自注意力建模 | 表达能力强 | 计算复杂度高 |
| TokenMixer 类 | RankMixer, MLP-Mixer | 轻量 token 混合 | 计算高效、MFU 高 | 深层配置不稳定 |
| MoE 扩展类 | Switch Transformer, ReMoE | 稀疏专家激活 | 参数扩展效率高 | 训练成本优化不足 |

### 最相关的前序工作

1. **RankMixer (ByteDance, 2025)**：提出 TokenMixer 作为排序模型骨干网络，验证了轻量 token 混合操作的有效性，通过硬件感知协同设计大幅提升 MFU。TokenMixer-Large 正是解决 RankMixer 深层配置瓶颈的续作。

2. **Wukong (Kuaishou, 2024)**：提出因子化机模块（FMB）和线性压缩模块（LCB）的 bagging 组合，验证了推荐系统的 Scaling Laws。TokenMixer-Large 在相同技术路线上进一步探索深层架构设计。

3. **DHEN (ByteDance, 2022)**：提出深层层次化集成网络，通过 bagging 思想集成多种特征交互模块。TokenMixer-Large 的 TokenMixer Block 设计借鉴了 DHEN 的堆叠思想。

### 本文定位

本文处于推荐系统 Scaling Laws 研究的前沿，定位于解决工业级 TokenMixer 架构的深层配置难题。通过系统性设计（混合-恢复、残差机制、Sparse Per-token MoE、工程优化），将 TokenMixer 的参数规模从 RankMixer 的约 10 亿扩展到 150 亿（离线）和 70 亿（在线），填补了深层 TokenMixer 架构设计的空白。

---

## 3. 详细技术方案

### 3.1 整体框架

TokenMixer-Large 的整体架构包含三个核心部分：

```
输入特征 → Tokenization → TokenMixer-Large Block堆叠 → 输出聚合 → 任务预测
                ↓
        Mixing & Reverting
        Pertoken-SwiGLU
        Residual & Normalization
        Interval Residual & Auxiliary Loss
                ↓
        Sparse-Pertoken MoE
```

1. **Tokenization（分词器）**：将高维稀疏 one-hot 特征通过 embedding 层投影为低维密集表征，再通过语义分组分词器（Semantic Group-wise Tokenizer）将不同维度的 embedding 对齐为语义 token。

2. **Token Mixing & Channel Mixing**：遵循"混合-恢复"范式，解决 RankMixer 中的维度不匹配问题。

3. **Sparse-Pertoken MoE**：升级版 Pertoken-FFN/relu-MoE，实现稀疏训练和稀疏服务。

### 3.2 关键模块详解

#### 3.2.1 Tokenization 模块

工业推荐系统包含用户特征、商品特征、序列特征（如 DIN/SIM/LONGER）和交叉特征。第一步通过 embedding 层将高维稀疏特征 $F_i$ 投影为维度为 $d_i$ 的密集表征：

$$
\mathbf{e}_i = \text{Embedding}(F_i, d_i) \in \mathbb{R}^{d_i}
$$

由于 TokenMixer-Large 是高度并行架构设计，需要将变长 embedding 表征转换为维度对齐的特征 token。按语义含义对不同维度的 embedding 进行分组，然后在每个组内对 embedding 进行拼接和压缩对齐：

$$
X_i = \text{MLP}_i(\text{concat}[e_l, ..., e_m]), \quad e_l, ..., e_m \in G_i
$$

其中 $G_i$ 表示第 $i$ 个语义分组。不同语义分组采用不同的 DNN 映射以保持异质性。

此外，引入全局 token（Global Token）来封装全局信息，借鉴 BERT 中的 [CLS] 机制：

$$
X_G = \text{MLP}_g\left(\text{concat}[G_1, ..., G_{T-1}]\right)
$$

最终输入为全局 token 和增强 token 的组合：

$$
X = \text{concat}[X_G, X_0, ..., X_{T-1}] \in \mathbb{R}^{T \times D}
$$

其中 $T$ 为 token 数量，$D$ 为隐藏维度。

#### 3.2.2 Mixing & Reverting 操作

RankMixer（TokenMixer）的残差设计存在维度不匹配问题：原始输入 token 数量为 $T$，经过第 $i$ 层混合后的 token 数量为 $H$。除非每层的 $H$ 保持相同且 $T = H$，否则残差连接无法在各层间平滑传播，导致语义错位。

TokenMixer-Large 设计了特殊的双层 TokenMixer 结构：
- **第一层（Mixing）**：负责在原始 token 间混合信息，将 $T$ 个 token 通过 split 操作转换为 $H$ 个混合 token。
- **第二层（Reverting）**：专门将混合后的 token 恢复为原始维度，确保输入输出的维度一致性。

这种对称的"混合-恢复"设计建立了从初始输入到深层网络的连续信号路径，启用每层稳定的残差连接，有效防止梯度信息丢失。

#### 3.2.3 Pertoken-SwiGLU

RankMixer 引入了参数隔离的前馈网络架构 pertoken FFN，用于建模不同 token 间的特征异质性。TokenMixer-Large 将其升级为 pertoken SwiGLU：

$$
\text{pSwiGLU}(\cdot) = \text{FC}_{\text{down}}\left(\text{Swish}\left(\text{FC}_{\text{gate}}(\cdot)\right) \odot \text{FC}_{\text{up}}(\cdot)\right)
$$

其中：
$$
\text{FC}_i(x) = W_i^t x_t + b_i^t, \quad i \in \{\text{up}, \text{gate}, \text{down}\}
$$

$\{W_{\text{up}}^t, W_{\text{gate}}^t\} \in \mathbb{R}^{D \times nD}$，$\{b_{\text{up}}^t, b_{\text{gate}}^t\} \in \mathbb{R}^{nD}$，$W_{\text{down}}^t \in \mathbb{R}^{nD \times D}$，$n$ 是调整 pertoken SwiGLU 隐藏维度的超参数。Swish(·) 是 Swish 激活函数，$x_t \in \mathbb{R}^D$ 是第 $t$ 个 token。

#### 3.2.4 残差与归一化

采用 Pre-Norm 设计替代原始 Post-Norm 架构，解决数值爆炸和梯度不稳定性问题。同时将标准 LayerNorm 替换为更轻量的 RMSNorm，通过移除均值中心化步骤，在保持核心归一化能力的同时显著降低计算开销。

#### 3.2.5 层间残差与辅助损失

除标准残差连接外，引入层间残差连接（Inter-residual），典型间隔为 2-3 层。这一设计主要解决梯度消失问题，通过增强低层特征向高层的传输，加速早期层参数收敛，缓解深层网络中的梯度逐渐衰减。

辅助损失机制将低层输出和高层输出的 logits 组合计算联合损失，使低层能够学习"估算高层特征偏差"，增强其特征表征能力，防止随着网络深度增加导致低层参数训练不足。

**注意**：层间残差连接不建议用于最后一层，因为末层的主要作用是蒸馏高度抽象的高层特征以支持后续分类任务，引入过多原始低层信息可能干扰抽象过程。

### 3.3 Sparse-Pertoken MoE

为进一步提高 TokenMixer-Large 的性价比，设计了 Sparse-Pertoken MoE，将每个 expert 拆分为多个 sub-expert，基于 pertoken SwiGLU 实现稀疏激活。

#### 迭代策略："先放大、后稀疏"

采用"先放大、后稀疏"的迭代策略：先将模型放大以获得效果，再将 pertoken SwiGLU 拆分并稀疏激活以获得效率收益。

$$
\text{S-P MoE}(\cdot) = \sum_{j=1}^{k} g_j(\cdot) \cdot \text{Expert}_j(\cdot), \quad \text{if } j \text{ is chosen}
$$

其中 $E$ 是每个 token 的 expert 数量，$k$ 是路由器的 top-k 数量，选中 expert 的概率之和为 1。

#### 共享 Expert

借鉴 LLM MoE 架构，引入共享 expert 以提升训练稳定性和效果。注意这里的共享 expert 仍是每个 token 分配，而非全局可见：

$$
\text{S-P MoE}(\cdot) = \sum_{i=1}^{k-1} g_i(\cdot) \cdot \text{Expert}_i(\cdot) + \text{SharedExpert}_i(\cdot)
$$

#### Gate Value Scaling

实践中观察到，由于 $g(\cdot)$ 通常使用 softmax 将路由 logits 转换为概率分布且概率和为 1，这种和为 1 的约束可能导致 SwiGLU 梯度更新不足。因此，在 $g(\cdot)$ 前添加常数 $\alpha$ 以允许 expert 网络的更充分更新：

$$
\text{S-P MoE}(\cdot) = \alpha \cdot \sum_{i=1}^{k-1} g_i(\cdot) \cdot \text{Expert}_i(\cdot) + \text{SharedExpert}_i(\cdot)
$$

#### Down-Matrix Small Init

借鉴 Rezero 思想，将 SwiGLU 中最后一层 FC_down 的初始化方差降低（Xavier Uniform，标准差从默认 1 降至 0.01），使早期训练阶段 $F(x)$ 项在 $F(x) + x$ 中接近零，有效使模块初始行为类似恒等映射，提升训练稳定性。

### 3.4 训练与服务优化

#### 高性能定制算子

MoE 工作流程包含三个关键算子：MoEPermute（转换为 expert-first 布局）、MoEGroupedFFN（单 kernel 计算所有 expert FFN）、MoEUnpermute（计算多激活 expert 输出的加权和）。MoEGroupedFFN 是延迟的主要贡献者，推理时间占比高达 98.35%。

#### FP8 量化

训练阶段维持 bfloat16 精度，推理阶段采用 FP8 E4M3 后训练量化。在线实验显示 FP8 推理提供 1.7 倍加速且不损害模型精度。

#### Token Parallel

针对 TokenMixer-Large 在分布式多设备环境中的扩展挑战，提出 Token Parallel 模型并行策略。与传统模型并行（每块需要 4 次通信）相比，Token Parallel 将通信开销从 $4L$ 降至 $2L + 1$（$L$ 为层数）。

在实际生产服务中，4 路 Token Parallel（全局批大小 320）的 TokenMixer-Large 吞吐量相比非并行基线提升 29.2%，通过计算通信重叠技术进一步提升至 96.6%。

---

## 4. 实验设计与结果分析

### 4.1 实验设置

#### 数据集

- **抖音电商主 Feed**：来自平台在线日志和用户反馈标签（点击、转化、GMV），包含 500+ 特征（数值型、ID型、交叉型、序列型），覆盖数亿唯一用户，日采样约 4 亿条记录（两年周期）
- **抖音广告**：日采样 3 亿条记录
- **抖音直播**：日采样 170 亿条记录

#### 评估指标

- **AUC/UAUC**：CTR 和 CVR 任务的 AUC 作为主要效果指标
- **参数数量**：纯密集参数（不含稀疏 embedding）
- **Training FLOPs per Batch**：单批次 2048 样本的计算成本
- **MFU**：Model FLOPs Utilization，衡量硬件理论浮点计算能力的实际利用率

#### Baseline 方法

DLRM-MLP、DCNv2、AutoInt、HiFormer、DHEN、Wukong、Group Transformer、FAT、RankMixer

#### 实验环境

64 GPU 混合分布式训练框架（电商场景），256 GPU（广告和直播）。稀疏参数异步更新，密集参数同步更新。Adagrad 优化器，学习率分别为 0.01（密集）和 0.05（稀疏）。

### 4.2 主实验结果

#### 500M 参数规模对比

| Model | ΔAUC↑ | Params | FLOPs/Batch |
|-------|-------|--------|-------------|
| DLRM-MLP-500M | – | 499 M | 125.1 T |
| HiFormer | +0.44% | 570 M | 28.8 T |
| DCNv2 | +0.49% | 502 M | 125.8 T |
| DHEN | +0.63% | 415 M | 103.4 T |
| AutoInt | +0.75% | 549 M | 138.6 T |
| Wukong | +0.76% | 513 M | 4.6 T |
| Group Transformer | +0.81% | 550 M | 4.5 T |
| FAT | +0.82% | 551 M | 4.59 T |
| RankMixer | +0.84% | 567 M | 4.6 T |
| **TokenMixer-Large 500M** | **+0.94%** | **501 M** | **4.2 T** |
| TokenMixer-Large 4B | +1.14% | 4.6 B | 29.8 T |
| TokenMixer-Large 7B | +1.20% | 7.6 B | 49.0 T |
| TokenMixer-Large 4B SP-MoE | +1.14% | 2.3 B in 4.6 B | 15.1 T |

**结果分析**：
- TokenMixer-Large 500M 在 500M 参数规模下实现最高 ΔAUC（+0.94%），同时保持最低 FLOPs（4.2 T）
- Sparse-Pertoken MoE（4B SP-MoE 版本）仅激活一半参数（2.3 B in 4.6 B）即可达到与全量密集模型相当的性能
- 相比 MLP-500M 基线，TokenMixer-Large 在 CTCVR 任务上实现 +1.14% AUC 提升

#### 与 RankMixer 详细对比

| Model Version | SR | OTR | TSA | ΔAUC↑ | Params | FLOPs |
|--------------|-----|-----|-----|-------|--------|-------|
| Group Transformer | ✓ | ✓ | ✓ | – | 500M | 4.5T |
| RankMixer w/o SR&OTR | ✘ | ✘ | ✘ | -0.20% | 510M | 4.2T |
| RankMixer w/o OTR | ✓ | ✘ | ✘ | -0.13% | 510M | 4.2T |
| RankMixer | ✓ | ✓ | ✘ | +0.03% | 567M | 4.6T |
| **TokenMixer-Large** | **✓** | **✓** | **✓** | **+0.13%** | **500M** | **4.2T** |

**关键发现**：
- TokenMixer-Large 满足全部三个设计属性（标准残差SR、原始token残差OTR、token语义对齐TSA），而 RankMixer 仅满足两个
- TokenMixer-Large 相比 RankMixer 实现 +0.10% AUC 提升，同时参数更少（500M vs 567M）、FLOPs 更低（4.2T vs 4.6T）

#### 在线性能

| 场景 | 指标 | Lift↑ |
|------|------|-------|
| Feed Ads | ΔAUC | +0.35% |
| | ADSS | +2.0% |
| E-Commerce | ΔAUC | +0.51% |
| | Order | +1.66% |
| | GMV | +2.98% |
| Live Streaming | ΔUAUC Pay | +0.7% |
| | Revenue | +1.4% |

### 4.3 消融实验

#### TokenMixer-Large Block 消融

| Setting | ΔAUC |
|---------|-------|
| w/o Global Token | -0.02% |
| w/o Mixing & Reverting | **-0.27%** |
| w/o Residual | -0.15% |
| w/o Internal Residual & AuxLoss | -0.04% |
| Pertoken SwiGLU→SwiGLU | -0.21% |
| Pertoken SwiGLU→Pertoken FFN | -0.10% |

**关键结论**：
- Mixing & Reverting 对整体性能影响最大（-0.27%），验证了该设计的核心价值
- Pertoken SwiGLU 相比标准 SwiGLU 带来 -0.21% 提升
- Pertoken SwiGLU 相比 Pertoken FFN 带来 -0.10% 提升

#### Sparse-Pertoken MoE 消融

| Setting | ΔAUC | ΔParams | ΔFLOPs |
|---------|-------|---------|---------|
| w/o Shared Expert | -0.02% | 0.0% | 0.0% |
| w/o Gate Value Scaling | -0.03% | 0.0% | 0.0% |
| w/o Down-Matrix Small Init | -0.03% | 0.0% | 0.0% |
| Sparse-Pertoken MoE→Sparse MoE | -0.10% | 0.0% | 0.0% |

**关键结论**：
- 所有操作均为零成本修改（无额外参数或 FLOPs），但每项对最终性能提升均有正向贡献
- Gate Value Scaling 的最优值与稀疏率成反比：1:2 稀疏率模型最佳 α 为 2，1:4 稀疏率模型最佳 α 为 4
- Down-Matrix Small Init 仅对 FC_down 层应用小初始化（标准差 0.01）效果最佳

#### 纯模型设计验证

| Params | DCN Gain |
|--------|----------|
| 150M | +0.09% |
| 500M | +0.04% |
| 700M | +0.00% |

随着 TokenMixer-Large 参数规模扩展，前端 DCN 模块带来的效果增益逐渐减小，当模型扩展到 700M 时，移除 DCN 结构不再造成效果损失，验证了"纯模型"设计理念。

### 4.4 Scaling Laws 分析

#### 模型收敛与数据需求

| Param | Convergence Day | ΔUAUC |
|-------|-----------------|-------|
| 30m | – | – |
| 90m | ↑14d | +0.94% |
| 500m | ↑30d | +0.62% |
| 2.3B | ↑30d | +0.41% |
| 2.3B | ↑(60d) | +0.70% |

**关键发现**：随着模型规模扩展，需要更多训练数据以实现收敛。90M 模型仅需 14 天训练样本即可收敛，而 500M→2.3B 需要 60 天样本才能完全收敛。

---

## 5. 关键结论与 Takeaway

### 论文自身宣称的贡献评析

1. **混合-恢复操作**：论文声称该设计解决了 TokenMixer 的维度不匹配问题。消融实验显示 -0.27% 的性能损失证明了该设计的核心价值，该贡献名副其实。

2. **纯模型设计**：移除碎片化算子可被深层 TokenMixer Block 吸收。实验数据支持这一结论，但对已有工业部署的系统升级需要谨慎评估迁移成本。

3. **层间残差与辅助损失**：有效促进深层模型收敛，但贡献相对较小（-0.04%），更像是锦上添花而非核心创新。

4. **Sparse Per-token MoE**："先放大、后稀疏"策略和 Gate Value Scaling 设计巧妙，在保持性能的同时显著降低训练/推理成本。

5. **Scaling Laws 验证**：成功将模型扩展到 150B（离线）和 70B（在线），并在三大场景实现产品级部署，结果可信。

### 最有价值的 Takeaway

1. **深层 TokenMixer 的设计原则**（可信度：高）：Mixing & Reverting 操作是解决深层 TokenMixer 稳定性问题的关键设计，对后续工作有重要参考价值。

2. **稀疏化策略的优先级**（可信度：高）："先放大、后稀疏"优于"直接稀疏"，Gate Value Scaling 是稀疏 MoE 训练稳定性的关键技巧。

3. **模型规模与数据规模的匹配**（可信度：高）：大模型需要更多训练数据收敛，Scaling 时需同步考虑数据 pipeline 扩展。

4. **MFU 作为架构设计的核心指标**（可信度：中高）：TokenMixer 相比 Transformer 的核心优势在于高 MFU，架构设计时应将 MFU 作为与效果同等重要的优化目标。

5. **碎片化算子的收益边界**（可信度：中等）：当模型规模足够大时，碎片化算子（如 DCN、LHUC）的收益可被主模型吸收，但这一阈值因场景而异。

---

## 6. 局限性与开放问题

### 方法局限

1. **Pre-Norm vs Post-Norm 的权衡**：论文选择 Pre-Norm 以保证训练稳定性，但这牺牲了一定效果（Post-Norm 效果更好但易梯度爆炸）。如何在保持训练稳定性的同时利用 Post-Norm 的效果优势仍是开放问题。

2. **稀疏率的上限**：当前 1:2 稀疏率可实现近乎零离线/在线损失，1:4 稀疏率有轻微下降。更高稀疏率（1:8+）的效果保持仍是探索方向。

3. **推理延迟优化**：尽管采用了 FP8 量化和 Token Parallel，在小 batch 场景下 MoE 仍是内存带宽瓶颈，MFU 仍有提升空间。

### 实验局限

1. **离线验证的代表性**：论文离线实验主要在抖音电商数据集，广告和直播场景的离线实验数据相对较少，可能存在场景偏差。

2. **长期用户反馈指标缺失**：主要评估指标为短期 CTR/CVR，缺乏长期用户留存、生命周期价值等指标的验证。

### 工业落地挑战

1. **模型压缩与部署**：从实验模型到生产服务需要额外的模型压缩、量化校准、算子融合等工程工作。

2. **多场景统一建模**：三大场景（电商、广告、直播）各自独立训练和部署，缺乏统一的跨场景迁移机制。

3. **冷启动与探索**：大模型对长尾用户和商品的表征能力有待验证，探索-利用平衡需要专门设计。

### 开放问题

1. **更大规模模型的有效性**：Scaling Laws 的边界在哪里？是否有临界点导致收益递减？

2. **多模态特征扩展**：当前主要处理结构化特征，如何有效引入图像、文本等多媒体特征？

3. **跨场景迁移**：能否通过统一的 TokenMixer-Large 架构实现多场景联合建模和知识迁移？

---

## 7. 应用价值分析

### 技术可借鉴性

1. **Mixing & Reverting 范式**：可直接应用于其他基于 Token 混合的推荐模型架构，解决深层配置不稳定问题。

2. **Gate Value Scaling**：作为稀疏 MoE 训练的通用技巧，可应用于其他 MoE 架构（如 Switch Transformer、DeepSeek-MoE）的训练稳定性优化。

3. **"先放大、后稀疏"策略**：为资源受限场景的模型扩展提供了可操作的工程路径。

4. **MFU 优化思路**：通过移除碎片化算子、合并计算等手段提升硬件利用率的设计理念值得借鉴。

### 适用场景

1. **大规模排序模型**：日活千万级以上、模型参数量超过 500M 的排序模型场景收益最大。

2. **高并发推理场景**：Token Parallel 策略适合对推理延迟敏感的高并发服务。

3. **资源受限扩展场景**：稀疏 MoE 适合在有限 GPU 资源下扩展模型参数规模。

### 改造建议

如果要在我们的搜索广告推荐系统中应用：

1. **短期（1-2个月）**：借鉴 Gate Value Scaling 技巧优化现有稀疏 MoE 训练稳定性，预期 +0.03% AUC 提升。

2. **中期（3-6个月）**：尝试 Mixing & Reverting 操作于现有 TokenMixer 架构，评估对深层配置稳定性的改善。

3. **长期（6个月+）**：评估引入 TokenMixer-Large 整体架构的可行性和工程成本，重点关注与现有系统的兼容性。

### ROI 评估

**中-高**：TokenMixer-Large 的核心设计（Mixing & Reverting、Gate Value Scaling）作为增量改进可快速落地，而完整架构迁移需要较大工程投入。建议优先评估 Gate Value Scaling 在现有系统的效果。

---

## 8. 关键引用与延伸阅读

1. **RankMixer (ByteDance, 2025)**：TokenMixer-Large 的前序工作，首次提出 TokenMixer 作为工业推荐骨干网络，验证了轻量 token 混合的有效性和 Scaling Laws。必读，作为理解本文的前提。

2. **Wukong (Kuaishou, 2024)**：验证推荐系统 Scaling Laws 的重要工作，与 RankMixer 并行，提出 bagging 思路的 Scaling Laws。推荐阅读，可对比不同 Scaling 策略的效果差异。

3. **DeepSeek-MoE (DeepSeek, 2024)**：提出细粒度专家分解的 MoE 架构，与本文的"先放大、后稀疏"策略有相似之处。推荐阅读，可扩展稀疏 MoE 的设计思路。

4. **ReZero (Bachlechner et al., 2021)**：提出通过初始化技巧改善深层网络训练稳定性的方法，启发了本文的 Down-Matrix Small Init 设计。推荐阅读，可深入理解训练稳定性技巧。

5. **Switch Transformer (Fedus et al., 2022)**：提出 Switch Transformer 的稀疏 MoE 设计，是 MoE Scaling 的经典工作。推荐阅读，可与本文的 Sparse Per-token MoE 对比。

6. **LONGER (ByteDance, 2025)**：ByteDance 提出的超长序列建模方法，与 TokenMixer-Large 同属 ByteDance AML 团队的工作。推荐阅读，可了解团队在序列建模方向的整体布局。

7. **HSTU (Google, 2024)**：Transformer 在序列推荐中的 Scaling Laws 研究，与本文的 LLM Agent 自进化方向有潜在关联。推荐阅读，可了解 Google 在推荐 Scaling 方向的研究进展。