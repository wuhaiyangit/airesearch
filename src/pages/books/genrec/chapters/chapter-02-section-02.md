---
layout: ../../../../layouts/BookLayout.astro
chapter: 02
section: 02
title: "向量量化方法：VQ 与 RQ"
drafted_at: "2026-05-11"
planner_notes: "research-notes/chapter-02/section-2.2.md"
refs: [REF-008, REF-009, REF-011, REF-018, REF-072, REF-074, REF-075, REF-076, REF-077, REF-078]
word_count: 6150
status: REVIEWED
reviewed_at: "2026-05-11"
review_notes:
  - "事实抽查 4 篇前沿 REF（REF-072 DIGER / REF-075 SA²CRQ / REF-076 CARD / REF-077 PRISM）arxiv abstract 全部字面命中：DIGER 'Gumbel noise / two uncertainty decay strategies / aligning indexing and recommendation objectives / first step toward effective differentiable semantic IDs' 四处；SA²CRQ 'dynamically allocate code lengths based on item path entropy / longer, discriminative IDs to head items and shorter, generalizable IDs to tail items / frozen semantic manifold' 三处；CARD 'NU-RQ-VAE / learnable and invertible non-uniform transformation / unifies textual, visual, and collaborative signals / plug-and-play and remains robust' 四处；PRISM 'impure and unstable semantic tokenization / Purified Semantic Quantizer / adaptive collaborative denoising and hierarchical semantic anchoring / dynamic semantic integration mechanism / semantic structure alignment objective / particularly in high-sparsity scenarios' 六处。"
  - "过度归因主动规避：(1) PRISM 调研笔记中的 'DHR 双头重建' 在 abstract 无对应字面，Writer 严格按摘要 'dynamic semantic integration mechanism + semantic structure alignment objective' 重写，未照搬调研笔记包装，主动吸取 §1.4 [REF-068] 同型 REVISE 教训；(2) TIGER β=0.25 / 3 层 / 256 码本 / latent 32 等 abstract 未涵盖的具体超参，Writer 加 '[REF-009] 原文实现细节' 前缀限定；(3) SA²CRQ Recall@2k +12.1% / 幻觉 -28.1% / JD.com +0.13% / +0.42% 摘要无字面，正文降级为 abstract 原句 '对已有基线获得一致提升、冷启动检索场景尤为显著'。"
  - "代际划分合规性：§2.2.6 五条主线（DIGER 联合优化 / SA²CRQ 自适应码长 / CARD 非均匀量化 / PRISM 纯净量化 / HiGR 结构约束）措辞均限定为各自摘要逐字短语；§2.2.7 表 2-2 行『RQ 是当前推荐领域绝对主流』属业界共识表述，由 TIGER/OneRec/CARD/PRISM/HiGR 五例工作直接支撑。"
  - "字数 6150 vs front-matter 原 6030 偏差 1.99%（PASS 模式同步校正 word_count 至实测 6150）；微超 writing-queue 建议上限 5000-6000 约 150 字（3%），原因是 §2.2.7 末段对 §2.3 的转入完整铺垫——属内容必要扩展非冗余，WARN 不阻塞。"
  - "公式 (2.3)-(2.7) 严格承接 §2.1 (2.1)(2.2)；图 2-2 / 图 2-3 承接 §2.1 图 2-1；表 2-2 / 表 2-3 承接 §2.1 表 2-1；本节无新增定义（§2.1 已给出语义 ID 定义 2.1）。"
  - "章节衔接：实读 02-reviewed/chapter-02-section-01.md 末段 '解决了「为什么」之后，§2.2 将深入解答「怎么做」——向量量化（VQ）及其残差扩展（RQ-VAE）是目前最成熟的技术路径' 与 §2.2.1 开篇 '§2.1 把语义 ID 的存在动机讲清楚了……本节回答它对应的工程问题' 字面承接；§2.2.7 末段 'RQ-VAE 给出的语义 ID 只能保证「相似的 embedding 共享前缀」，无法保证「相似前缀对应人类可理解的语义类别」' 完整铺垫 §2.3 主题。"
  - "front-matter refs 补挂：原列表 8 条不含正文实际引用的 REF-074（§2.2.3 唯一性兜底 Snapchat SID）与 REF-011（表 2-2 行『早期 P5 风格』），PASS 模式权限范围内补全为 10 条，正文 0 改动。"
human_quality_requirements: "无"
---

## 2.2.1　从「选最近的码字」开始：VQ 的基本原理

§2.1 把语义 ID 的存在动机讲清楚了——自回归生成机制要求一个有限的离散词表，工业级物品规模又要求这个词表必须以「小码本 × 多层组合」的方式构造。本节回答它对应的工程问题：**给定一个连续的物品向量 $\mathbf{e}_i \in \mathbb{R}^d$，如何把它一一映射到一个固定大小为 $K$ 的码本（codebook）上、得到一个离散整数 $c \in \{1, \dots, K\}$，并保留尽可能多的语义保真度？** 这就是向量量化（Vector Quantization, VQ）解决的核心任务。本节先把 VQ 与 VQ-VAE 的训练目标讲透，再过渡到主角——残差量化（Residual Quantization, RQ）及其变分自编码器形式 RQ-VAE，最后用 TIGER [REF-009] 与 OneRec [REF-018] 打通从原理到工业落地的全链路，并专门展开 RQ-VAE 上线时绕不开的码本坍缩问题与 2025—2026 年的最新解法。

向量量化的最朴素思想是：**给空间 $\mathbb{R}^d$ 铺一张「网」，把每个连续向量映射到离它最近的网点上**。形式化地，定义码本 $\mathbf{E} = [\mathbf{e}^{\text{cb}}_1, \dots, \mathbf{e}^{\text{cb}}_K] \in \mathbb{R}^{K\times d}$（每一行称为一个码字 / codeword），输入 $\mathbf{z}_e \in \mathbb{R}^d$ 的量化结果是

$$
q(\mathbf{z}_e) = \arg\min_{k\in\{1,\dots,K\}}\,\bigl\lVert \mathbf{z}_e - \mathbf{e}^{\text{cb}}_k \bigr\rVert_2^2,
\qquad \hat{\mathbf{z}} = \mathbf{e}^{\text{cb}}_{q(\mathbf{z}_e)}. \tag{2.3}
$$

公式 (2.3) 的两个返回值各司其职：$q(\mathbf{z}_e) \in \{1, \dots, K\}$ 是离散索引，下游的自回归模型只关心这个整数；$\hat{\mathbf{z}}$ 是量化后的连续向量，用于重建损失与梯度回传。读者可以把这一对返回值类比为图书馆查书——「索书号」（$q$）拿来索引、「书的内容」（$\hat{\mathbf{z}}$）拿来阅读。

(2.3) 式给出了 VQ 的前向计算，但训练时立刻撞上一个问题：$\arg\min$ 不可导，码本与编码器都无法通过反向传播更新。VQ-VAE [REF-008]（Van den Oord 等，NeurIPS 2017）给出的工程解法是**直通估计器（Straight-Through Estimator, STE）**：前向走最近邻、反向把 $\hat{\mathbf{z}}$ 处的梯度直接「拷贝」给 $\mathbf{z}_e$，相当于假装量化层是恒等映射。STE 让端到端训练成为可能，代价是码字本身不会通过这条路径收到梯度。为了让码本也能学习，VQ-VAE 把训练目标拆成三项：

$$
\mathcal{L}_{\text{VQ-VAE}} \;=\; \underbrace{\bigl\lVert \mathbf{x} - \text{Decoder}(\hat{\mathbf{z}}) \bigr\rVert_2^2}_{\mathcal{L}_{\text{recon}}}
\;+\; \underbrace{\bigl\lVert \text{sg}[\mathbf{z}_e] - \mathbf{e}^{\text{cb}}_{q(\mathbf{z}_e)} \bigr\rVert_2^2}_{\mathcal{L}_{\text{cb}}}
\;+\; \beta\,\underbrace{\bigl\lVert \mathbf{z}_e - \text{sg}[\mathbf{e}^{\text{cb}}_{q(\mathbf{z}_e)}] \bigr\rVert_2^2}_{\mathcal{L}_{\text{cmt}}}. \tag{2.4}
$$

其中 $\text{sg}[\cdot]$ 表示 stop-gradient（截断梯度），$\beta$ 是承诺损失的超参（[REF-008] 推荐 $\beta\in[0.1, 2.0]$）。三项各自负责一件事：

- $\mathcal{L}_{\text{recon}}$（重建损失）：让解码器从离散码 $\hat{\mathbf{z}}$ 出发还原原始输入 $\mathbf{x}$；保证量化是「**有损但可还原**」而非任意压缩。
- $\mathcal{L}_{\text{cb}}$（码本对齐损失 / codebook loss）：把码字 $\mathbf{e}^{\text{cb}}_k$ 朝它当前负责的输入向量 $\mathbf{z}_e$ 拉近；由于 $\text{sg}[\mathbf{z}_e]$ 截断了编码器侧的梯度，这一项**只更新码本不更新编码器**。
- $\mathcal{L}_{\text{cmt}}$（承诺损失 / commitment loss）：反向让编码器输出 $\mathbf{z}_e$ 朝它当前匹配的码字靠拢，避免编码器随意「漂移」到任何码字附近；$\text{sg}$ 此处截断的是码本侧的梯度，因此**只更新编码器不更新码本**。

这一对「双向 sg」是 VQ-VAE 的精妙之处：它把一个本来不可微的量化层拆成两条可微通路——一条更新码本，一条更新编码器，两者通过 STE 与重建损失绑在一起。$\beta$ 控制编码器收敛速度：$\beta$ 太小，编码器漂移过快、码字追不上；$\beta$ 太大，编码器被「钉死」在初始码字附近，码本表达力受损。实践中 $\beta=0.25$ 被许多后续工作（包括 TIGER [REF-009]）沿用为默认值。

(2.4) 式之外，[REF-008] 还提出了一种用**指数滑动平均（Exponential Moving Average, EMA）**直接更新码本的等价做法——把 $\mathcal{L}_{\text{cb}}$ 替换为对每个码字的滑动平均更新：累计该 batch 中映射到 $k$ 的所有 $\mathbf{z}_e$ 的均值，再以 EMA 衰减系数（典型 $\gamma=0.99$）混合到 $\mathbf{e}^{\text{cb}}_k$ 上。EMA 形式在训练稳定性上明显优于直接梯度更新，是 §2.2.5 将要重点讨论的码本坍缩首要解药之一。

至此，单层 VQ 已经能把一个连续向量压成一个离散整数，并通过端到端训练让码本与编码器协同进化。但单层码本的容量上限是 $K$——典型 $K \in [256, 8192]$ 远小于工业物品规模。要把容量推到 $K^L$ 级，就必须从单层走向多层。

## 2.2.2　从单层到多层：残差量化的递推逻辑

残差量化的动机十分直观：**单层 VQ 量化后必然有残差 $\mathbf{r}_1 = \mathbf{z}_e - \hat{\mathbf{z}}_1$，这个残差还有结构、还能继续量化**。如果再用一个独立的码本 $\mathbf{E}^{(2)}$ 去量化 $\mathbf{r}_1$、得到第二级码字 $c_2$ 与残差 $\mathbf{r}_2 = \mathbf{r}_1 - \mathbf{e}^{\text{cb},(2)}_{c_2}$，并把这一过程递推 $L$ 层，就能用 $L$ 个独立的小码本（每个 $K_l$ 大小）逼近原向量，组合容量推到 $\prod_l K_l$。RQ-VAE 把这一思路与 VQ-VAE 的端到端训练结合起来，用一组共同的损失函数同时学 $L$ 层码本与编码器/解码器。

形式化地，给定输入 $\mathbf{z}_e$，初始化 $\mathbf{r}_0 = \mathbf{z}_e$；对于 $l = 1, 2, \dots, L$，递推地做最近邻量化与残差更新：

$$
c_l \;=\; \arg\min_{k\in\{1,\dots,K_l\}}\,\bigl\lVert \mathbf{r}_{l-1} - \mathbf{e}^{\text{cb},(l)}_k \bigr\rVert_2^2,
\qquad
\mathbf{r}_l \;=\; \mathbf{r}_{l-1} - \mathbf{e}^{\text{cb},(l)}_{c_l}. \tag{2.5}
$$

最终的量化重建是各层码字之和：

$$
\hat{\mathbf{z}} \;=\; \sum_{l=1}^{L}\,\mathbf{e}^{\text{cb},(l)}_{c_l}. \tag{2.6}
$$

(2.5)、(2.6) 是 RQ-VAE 的全部前向运算，几何直觉非常清晰——**第 $l$ 层码本的所有码字组成一组「位移向量」，依次叠加把 $\mathbf{z}_e$ 一步步逼近到原点；层数越多、逼近越细**。这种「从粗到细」（coarse-to-fine）的层次结构有两个工程优势：第一，前几层码字承担粗粒度宏语义（如商品大类），后几层承担细粒度差异（如型号、颜色）——刚好对应 §2.1.4「目标一：语义保真」中所要求的层次化共享前缀；第二，输出的码序列 $(c_1, \dots, c_L)$ 自带顺序结构，与自回归解码逐 token 生成的方向天然一致。

把 (2.5)—(2.6) 嵌入 VQ-VAE 的训练框架，需要把 (2.4) 的三组分损失对每一层都展开一次。RQ-VAE 的总损失可以写成：

$$
\mathcal{L}_{\text{RQ-VAE}} \;=\; \mathcal{L}_{\text{recon}} \;+\; \sum_{l=1}^{L}\Bigl(\bigl\lVert \text{sg}[\mathbf{r}_{l-1}] - \mathbf{e}^{\text{cb},(l)}_{c_l} \bigr\rVert_2^2 \;+\; \beta\,\bigl\lVert \mathbf{r}_{l-1} - \text{sg}[\mathbf{e}^{\text{cb},(l)}_{c_l}] \bigr\rVert_2^2\Bigr). \tag{2.7}
$$

其中 $\mathcal{L}_{\text{recon}} = \lVert \mathbf{x} - \text{Decoder}(\hat{\mathbf{z}}) \rVert_2^2$，$\hat{\mathbf{z}}$ 由 (2.6) 给出。直观上，(2.7) 让每一层都学一组「针对前一层残差」的码字。需要特别注意的是：**(2.5) 中每一层的 $\arg\min$ 都不可微，反向传播全部依赖 STE 把梯度从 $\hat{\mathbf{z}}$ 一路传回 $\mathbf{z}_e$**——层数 $L$ 越大，STE 拼接误差就越严重，这是 RQ-VAE 在 $L > 4$ 时容易训练不稳的工程根因之一，也是后文 §2.2.6 中 DIGER [REF-072] 用 Gumbel 重参数化替代 STE 的核心动机。

**图 2-2　RQ-VAE 完整流程图**

```
        x (item content / multimodal feature)
        │
        ▼
   ┌──────────┐
   │ Encoder  │  fθ(x)
   └──────────┘
        │
        ▼  z_e ∈ R^d
        │
        │  ┌────────┐   r0 = z_e
        ├──▶ codebook 1 ──▶ c1   ; ê1 = e^(1)_{c1}
        │  └────────┘    K1 codewords
        │   r1 = r0 - ê1
        │
        │  ┌────────┐
        ├──▶ codebook 2 ──▶ c2   ; ê2 = e^(2)_{c2}
        │  └────────┘    K2 codewords
        │   r2 = r1 - ê2
        │
        │  ┌────────┐
        ├──▶ codebook 3 ──▶ c3   ; ê3 = e^(3)_{c3}
        │  └────────┘    K3 codewords
        │   r3 = r2 - ê3
        │
        ▼  ẑ = ê1 + ê2 + ê3   ←─ Semantic ID = (c1, c2, c3)
   ┌──────────┐
   │ Decoder  │  gφ(ẑ)
   └──────────┘
        │
        ▼  x̂  ≈ x       (重建损失 L_recon)

(每层码本独立、依次量化前一层残差；
 输出离散序列 (c1, c2, c3) 即为该物品的语义 ID。
 对每一层都计算一组承诺损失 + 码本对齐损失，详见公式 (2.7)。)
```

> **图 2-2 注释**：流程图刻意保留了「同一个 $\mathbf{z}_e$ 依次被三层量化」的递推关系——这与单层 VQ-VAE 是同一个解码器、同一份重建损失，只是中间多了 $L$ 个独立的小码本。读者若把 $L=1$ 代入 (2.7) 即得 (2.4)，即 RQ-VAE 严格包含 VQ-VAE 为特例。

## 2.2.3　TIGER 案例拆解：RQ-VAE 在推荐中的标准实现

把 (2.5)—(2.7) 落到推荐场景的代表性工作是 **TIGER（Transformer Index for GEnerative Recommenders）[REF-009]**（Rajput 等，NeurIPS 2023）——它是第一篇把语义 ID 作为生成式召回的「物品 token」整套跑通的论文，也是后续所有 RQ-VAE 系语义 ID 工作的方法基线。本小节按「数据 → 编码器 → 量化 → 唯一性兜底 → 召回模型」五个环节拆解 TIGER 的工程实现。

**输入侧**：TIGER 的物品表示来自纯内容编码——把每个物品的标题、描述、品类等文本字段拼接为一段自然语言，再通过预训练的 Sentence-T5 编码为一个 $d=768$ 维的连续向量 $\mathbf{e}_i$。这一选择有两个工程含义：第一，物品 embedding 完全脱离协同信号、纯粹捕捉内容相似性，这是 TIGER 在新物品上的优势来源（[REF-009] 摘要明确指出「the improved retrieval performance observed for items with no prior interaction history」）；第二，所有依赖 Sentence-T5 的后续 RQ-VAE 都继承了这个 768 维输入维度，工业落地若改用其他文本编码器（如 BGE、E5）需重新调参。

**编码器与 RQ-VAE 配置**：TIGER 使用一个浅层 MLP 编码器把 768 维向量压到 32 维 latent，再做 3 层残差量化、每层码本 256 个码字、每个码字 32 维。这一组超参——**3 层、$K_l=256$、$d_{\text{latent}}=32$**——成了后续大多数工作的默认起点（OneRec [REF-018]、PRISM [REF-077]、CARD [REF-076] 在不同数据集上做了规模放大，但 3—4 层、$256\sim 1024$ 码字的「TIGER 量级」基本未变）。组合容量 $K^L = 256^3 \approx 1.68\times 10^7$，足以覆盖 Amazon Beauty/Sports/Toys 等百万级学术数据集，但在工业级 $N\geq 10^9$ 下仍会高频碰撞——这正是 OneRec [REF-018] 后续要把方案改造为 RQ-KMeans 的工程动机。需要提醒读者：本段超参是 [REF-009] 原文实现细节，不同后续工作复现时会按数据集规模微调。

**唯一性兜底**：TIGER 的 3-token 语义 ID 在百万物品库下不可避免地出现碰撞。[REF-009] 的工程解法是**在 RQ-VAE 输出之上追加一位非语义的「去重 hash」**：当某个 $(c_1, c_2, c_3)$ 已被占用时，新物品挂上 $(c_1, c_2, c_3, \text{collision\_id})$ 这一第 4 位整数做消歧——前 3 位仍承担语义共享前缀的角色，第 4 位仅负责唯一性。这一对「主语义 ID + 末位唯一性后缀」的设计在工业落地中被反复沿用——Snapchat SID 实践 [REF-074] 在 SIGIR 2026 Industry Track 上也采用了类似策略，体现了 §2.1.4「目标三：唯一性」与「目标四：可生成性」之间的工程妥协。

**召回模型**：得到所有物品的语义 ID 后，TIGER 把用户历史行为序列改写为一连串语义 ID（每个物品 3 个 token），再训练 T5 风格的 Transformer 编码器–解码器，以历史序列为输入、自回归地解码下一个物品的 3 个 token。这一步详见第 3 章生成式召回，此处只需把握一点：**TIGER 把推荐问题彻底改写为「序列到序列」任务，候选集大小不再是物品数量 $N$、而是每步 256 个码字**——这正是 §2.1.2 公式 (2.1)(2.2) 所说的「逐 token 解码 + 组合容量爆炸」红利的工程兑现。

**关键结果与局限**：[REF-009] 摘要明确报告——「recommender systems trained with the proposed paradigm significantly outperform the current SOTA models on various datasets」，并强调对零交互历史新物品的检索性能提升。但 TIGER 的两阶段范式——先训 RQ-VAE 把所有物品语义 ID 算好后冻结、再训推荐器——直接导致两个对齐问题：(1) **目标错位**：RQ-VAE 只看重建损失、不看推荐任务的 next-item prediction loss，码本不一定是「最有利于推荐」的码本；(2) **冷启动惯性**：新物品上线后需要重新调用 RQ-VAE 推理一次才能得到语义 ID。这两个问题在 §2.2.6 的 DIGER [REF-072] 中被同时解决——它把 (2.5) 的硬最近邻替换为 Gumbel 软采样，让推荐损失能反向更新码本。

## 2.2.4　工业落地：OneRec 的 RQ-KMeans 变体与「沙漏现象」

OneRec [REF-018]（快手，2025）是 RQ-VAE 走向工业大规模物品库的代表性变体。它在底层语义 ID 构造环节做了关键改造：**RQ-KMeans**——先用 K-Means 对多模态特征做粗聚类、再做残差量化。这一改造来自工业实战中观察到的「沙漏现象」：在亿级视频物品库上直接套用 TIGER 风格的 RQ-VAE，少数热门码字会被几乎所有热门视频反复选中、占用过半的训练流量，而大量码字几乎不被使用——码本利用率从学术数据集上的 80% 量级骤降到工业数据集上的不足 30%。这种「头部过度集中、尾部码字闲置」的形状像一个上下颠倒的沙漏，故得此名。

OneRec 的解法分两步：第一步用 K-Means 在多模态特征上做带平衡约束的聚类，强制每个聚类簇容量接近物品总数的 $1/K$；第二步以聚类质心作为第一层码本初始化，再做剩余 $L-1$ 层标准 RQ。OneRec 在快手主站上线后，[REF-018] 报告 watch-time +1.6%，端到端单模型替代了原本召回–粗排–精排的多级架构。这是首份**对外公开的、生成式推荐工业级落地数据**——它对工程读者的价值不在 watch-time 数字本身，而在「RQ-VAE 在亿级物品库上确实可以跑、但需要平衡约束改造」这一结论。

OneRec 的工业经验对应到方法层面，可以提炼为两条原则：**第一层码本必须强制平衡**——工业场景下物品分布天然偏斜，第一层 RQ 直接用最近邻分配会导致「沙漏」；OneRec 用 K-Means + 容量约束、CARD [REF-076] 用可学习非线性变换、SA²CRQ [REF-075] 用基于路径熵的码长自适应，都是同一问题的不同解法。**「先聚类后量化」可视为弱化的端到端训练**——RQ-KMeans 仍是两阶段，但 K-Means 已把协同信号注入第一层码本，相当于走在 TIGER 纯内容范式与 DIGER [REF-072] 完全联合优化之间。至此 VQ → RQ-VAE → TIGER → OneRec 的方法主线已经完整；但所有上述工作都共享一个共同的工程难题——码本坍缩——下一小节专门展开。

## 2.2.5　码本坍缩：RQ-VAE 训练中绕不开的核心难题

**码本坍缩（codebook collapse）** 是 VQ 系列方法的「老问题」，也是 §2.1.4 提到的「四位一体」目标之间相互拉扯最剧烈的体现。它的工程定义是：**训练后大量码字从未或极少被选中、码本的有效容量远小于名义容量 $K$**。一个名义 $K=256$ 的码本，若只有 80 个码字被高频使用、其余 176 个码字几乎从未在 (2.5) 的 $\arg\min$ 中胜出，码本的「实际词表」就只有 80——组合容量从 $256^3$ 缩水到 $80^3$，下游推荐器能区分的物品空间也同步缩水。

**根因**有三条主要来源：(1) **冷启动循环（cold-start loop）**：随机初始化的码字若初始位置远离任何 $\mathbf{z}_e$，它就永远不会被选中、永远不会收到梯度，从而永远「冷死」在初始位置；(2) **梯度饥饿（gradient starvation）**：高频被选中的码字主导整个训练步，热门码字越拉越准、长尾码字越拉越偏，最终热门码字「吸走」所有数据；(3) **STE 估计误差**：随着层数 $L$ 增大，STE 把各层梯度直接拼接的近似误差累积，深层码字更新方向越来越「噪声化」。

**经典解法**有两条已被广泛采用：**EMA 更新**——用 (2.4) 中 $\mathcal{L}_{\text{cb}}$ 项的 EMA 等价形式（VQ-VAE [REF-008] 原文已给出）替代直接梯度更新，每个码字按当前 batch 中映射到它的 $\mathbf{z}_e$ 的均值做指数滑动平均；它对单 batch 噪声不敏感，是几乎所有 RQ-VAE 实现的默认配置。**K-Means 初始化**——把码本初始位置直接设为训练数据 $\mathbf{z}_e$ 上的 K-Means 聚类中心，让所有码字一开始就处在「数据密度高的区域」，根本避开根因 (1)；OneRec [REF-018] 的 RQ-KMeans 把这一思路推到极致。

EMA + K-Means init 的组合在学术数据集上往往足以把码本利用率维持在 $\geq 80\%$ 量级，TIGER [REF-009] 的实验设置即采用类似配置。但当物品规模、分布偏斜程度、协同信号噪声级别都升级到工业量级时，经典解法仍不够——这就引出 2025—2026 年补全码本坍缩解法图谱的一批新工作。

**图 2-3　码本坍缩可视化**

```
   ┌───────── 健康码本 (utilization > 80%) ─────────┐
   │  · ·  · · ·  · · ·   · · · · · · · · · · · ·  │
   │ · · · · · · · · · · · · · · · · · · · · · · · │
   │  · · · · · · · · · · · · · · · · · · · · · ·  │     图例
   │ · · · · · · · · · · · · · · · · · · · · · · · │     ·  健康码字（被选用，分布均匀）
   │  · · · · · · · · · · · · · · · · · · · · · ·  │     ●  热点码字（被高频选中）
   └────────────────────────────────────────────────┘     ○  闲置码字（从未或极少被选中）

   ┌───────── 坍缩码本 (utilization ≈ 30%) ─────────┐
   │ ●●●● ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ │
   │ ●●●● ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ │
   │ ●● ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ │     头部码字过度集中（沙漏顶部）
   │ ●● ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ │     大量码字闲置（沙漏底部）
   │ ○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○○ │
   └────────────────────────────────────────────────┘
```

> **图 2-3 注释**：示意图刻意夸大了对比——实际工业系统中，「沙漏现象」更多表现为前 5%—10% 的码字承担 60%—80% 的流量。实测利用率的常用统计口径有两种：① 训练 batch 中至少被选中一次的码字占比；② 各码字被选中频次的熵值（越接近 $\log K$ 越均衡）。后者对头部集中更敏感，是更严格的诊断指标。

## 2.2.6　最新进展：2025—2026 年码本坍缩与量化质量的前沿解法

把镜头切到 2025—2026 年，码本坍缩在不同维度上被一批新工作系统化推进。本小节按「**联合优化、自适应码长、非均匀量化、纯净量化、结构约束**」五条主线各选一个代表展开，五条主线并非互斥——许多工业系统会同时引入两条或三条作为组合方案。

**联合优化：DIGER [REF-072]（SIGIR 2026）**——把可微分性引入 RQ-VAE 的码本选择本身。据 [REF-072] 摘要逐字描述，DIGER 在前向中注入 Gumbel 噪声，**显式鼓励早期阶段的码本探索（early-stage exploration over codes）**；并设计两种**不确定性衰减策略（uncertainty decay strategies）**逐步降低 Gumbel 噪声幅度，**实现从早期探索到后期利用的平滑过渡**。这一改造让推荐损失可经 SID 模块直接反向传播到 tokenizer，**实现索引目标与推荐目标的对齐（aligning indexing and recommendation objectives）**。机制上 DIGER 用 Gumbel-Softmax 可微采样替代 (2.5) 中的硬 $\arg\min$ + STE 拼接梯度，根因 (3) 的 STE 误差累积被根治；[REF-072] 自定位为「可微分语义索引这一新研究方向的第一步（first step toward effective differentiable semantic IDs）」，与 §2.1.5 所述「第二代语义 ID（可微分 + 联合优化）」论断一致。

**自适应码长：SA²CRQ [REF-075]（Wang 等，arXiv 2602.23978）**——头部物品给长码、尾部物品给短码。据 [REF-075] 摘要逐字描述，SA²CRQ 全称 **Anchored Curriculum with Sequential Adaptive Quantization**，由两个组件构成：(1) **SARQ**——「dynamically allocate code lengths based on item path entropy」（基于路径熵动态分配码长），「assigning longer, discriminative IDs to head items and shorter, generalizable IDs to tail items」（**头部分配更长、更具辨别力的 ID，尾部分配更短、更具泛化性的 ID**）；(2) **ACRQ**——「utilizes a frozen semantic manifold learned from head items to regularize and accelerate the representation learning of tail items」（**用从头部学到的、被冻结的语义流形作为「锚」正则化并加速尾部表示学习**）。摘要明确报告 [REF-075] 在「a large-scale industrial search system and multiple public datasets」上对已有基线获得一致提升、**冷启动检索场景尤为显著**。SA²CRQ 通过「头尾使用不同长度的码序列」从源头解耦了根因 (2) 头部码字被吸走的问题。

**非均匀量化：CARD [REF-076]（Wei 等，arXiv 2604.26427）**——把偏斜的 embedding 分布先「掰直」再量化。据 [REF-076] 摘要逐字描述，CARD 提出 **NU-RQ-VAE（non-uniform quantization framework）**，核心是在量化过程中**插入一个可学习且可逆的非均匀变换（learnable and invertible non-uniform transformation）**，把偏斜的语义分布映射到更均衡的潜在空间再做标准 RQ-VAE，**显著提升码本利用率与量化精度（significantly improving codebook utilization and quantization accuracy）**。CARD 还提出**视觉语义单元（visual semantic unit）**——「unifies textual, visual, and collaborative signals into a structured visual representation prior to encoding」（**编码前把文本、视觉、协同三类信号统一为结构化视觉表示**）。摘要强调该非均匀变换模块**即插即用，对不同量化方案均保持稳健（plug-and-play and remains robust across different quantization schemes）**——意味着 CARD 与 SA²CRQ、PRISM 等方案可正交组合。

**纯净量化：PRISM [REF-077]（Fang 等，arXiv 2601.16556）**——同时治理「噪声」与「坍缩」两类失真。据 [REF-077] 摘要逐字描述，PRISM 把现有 GSR 框架的核心局限定位为「**impure and unstable semantic tokenization**——量化方法在交互噪声与码本坍缩面前难以稳定，导致 SID 判别力弱（with ambiguous discrimination）」，其解法是 **Purified Semantic Quantizer**——「constructs a robust codebook via adaptive collaborative denoising and hierarchical semantic anchoring mechanisms」（**通过自适应协同去噪 ACD 与层次语义锚定 HSA 两类机制构造鲁棒码本**），下游再配合 **Integrated Semantic Recommender** 通过「dynamic semantic integration mechanism」与「semantic structure alignment objective」整合细粒度语义。摘要报告 PRISM 在四个公开数据集上一致超越 SOTA 基线，**高稀疏度场景提升尤为显著（particularly in high-sparsity scenarios）**。机制上 ACD 对应根因 (1) 含噪冷启动场景下的码字漂移、HSA 对应根因 (3) 深层码字更新噪声化，二者形成对码本坍缩的双侧防御。

**结构约束：HiGR [REF-078]（腾讯，arXiv 2512.24787）**——在 RQ 上叠加对比损失解决**语义纠缠（semantic entanglement）**：同一码字承担多个语义、不同语义的物品被映射到相邻码字，导致 Slate 推荐难以精准控制生成意图。其解法是在 RQ-VAE 之上叠加**对比约束**让不同物品语义 ID 被显式拉开距离，再配合「List-level 规划 + Item-level 解码」的层次生成框架。[REF-078] 报告腾讯线上 A/B 平均观看时长 +1.22%、播放量 +1.73%，离线效果亦超 SOTA 基线。HiGR 揭示了**码本质量不仅取决于重建损失，还需要额外的结构约束**——这一思路与 §2.5「协同信号注入」一脉相承。

> **本节最新进展（2024—2026）小结**：① DIGER（SIGIR 2026）[REF-072] 用 Gumbel + 不确定性衰减实现可微分量化、对齐索引与推荐目标；② SA²CRQ [REF-075] 用路径熵做自适应码长 + 锚定课程，化解头-尾不平衡；③ CARD [REF-076] 用可学习非线性变换治理偏斜分布、模块即插即用；④ PRISM [REF-077] 用 ACD + HSA 同时治理噪声与坍缩；⑤ HiGR [REF-078] 用对比约束 + 层次规划解决语义纠缠并加速 Slate 解码。这五项工作共同把 RQ-VAE 从「先冻结再使用的预处理工具」推进为「与推荐器联合优化、结构约束、分布感知」的研究子领域。

## 2.2.7　量化方法横向对比与本节小结

把本节走过的方法主线放进一张对比表，便于读者快速定位。

**表 2-2　量化方法对比**

| 方法 | 年份 / 出处 | 核心原理 | 码本容量 | 天然有序（适配自回归） | 训练稳定性 | 码本坍缩风险 | 推荐领域代表 | 适用场景 |
|---|---|---|---|---|---|---|---|---|
| VQ | 2017 [REF-008] | 单层最近邻量化 + STE | $K$ | 否（无层次） | 中 | 高（单层） | VQ-VAE 直接路线（早期 P5 风格 [REF-011]） | 中小规模、单粒度离散 |
| RQ | 2017—2023（RQ-VAE 形式 [REF-008] 思路 / TIGER [REF-009]） | 多层残差量化 + 各层独立码本 | $\prod_l K_l$ | 是（层次有序） | 中（受 STE 误差累积） | 中—高 | TIGER [REF-009]、OneRec RQ-KMeans [REF-018] | 工业级物品规模、自回归生成式召回（主流） |
| PQ | 2011（PQ for ANN） | 向量分组、各组独立码本 | $\prod_g K_g$ | 否（分组无顺序） | 高（无 STE） | 中 | ANN 检索加速、生成式推荐中的 OPQ 变体 | 检索加速、压缩存储为主 |
| FSQ | 2024（Finite Scalar Quantization） | 各维度独立有限标量量化、免显式码本 | $\prod_d L_d$ | 否（无层次） | 高（无 STE、无码本） | 极低（无显式码本） | QARM V2 / RecGPT（2025—2026 探索） | 简化训练、对码本坍缩敏感场景 |

> **表 2-2 注释**：列「天然有序」指方法输出的离散码序列是否带有从粗到细的层次结构——这一性质决定了它能否与自回归解码无缝衔接。RQ 是当前推荐领域绝对主流，PQ 主要保留在 ANN 检索路径，FSQ 是新兴替代方案、尚未成为推荐领域主流（绝大多数 2024—2026 工作仍基于 RQ-VAE）。

把 §2.2.5—§2.2.6 的码本坍缩解法也整理成同维度对比，便于工程读者按场景选型。

**表 2-3　RQ-VAE 码本坍缩解决方案汇总**

| 解决方案 | 代表工作 | 机制一句话 | 主要应对的根因 | 典型效果 |
|---|---|---|---|---|
| EMA 更新 | VQ-VAE [REF-008] | 用滑动平均替代直接梯度更新码本 | 梯度饥饿 (2)、STE 噪声 (3) | 学术数据集利用率 $\geq 80\%$ |
| K-Means 初始化 | TIGER [REF-009]、OneRec [REF-018] | 用聚类中心做码本初始位置，避免冷死码字 | 冷启动循环 (1) | 工业落地标配 |
| RQ-KMeans + 平衡约束 | OneRec [REF-018] | 第一层用 K-Means + 容量约束，再做残差 | 头部沙漏（特殊形态的 (2)） | 快手线上 watch-time +1.6% |
| 可微分量化（Gumbel） | DIGER [REF-072] | Gumbel 噪声替代硬 $\arg\min$，推荐损失反传 | STE 噪声 (3)、目标错位 | SIGIR 2026 多数据集一致提升 |
| 自适应码长 | SA²CRQ [REF-075] | 路径熵决定码长，头部长码尾部短码 + 锚定课程 | 梯度饥饿 (2)、长尾稀疏 | 一致提升，冷启动场景显著 |
| 非均匀变换 | CARD [REF-076] | 可学习可逆变换将偏斜分布拉平后再量化 | 输入分布偏斜（(1) 的延伸） | 码本利用率与量化精度显著提升、即插即用 |
| 协同去噪 + 语义锚定 | PRISM [REF-077] | ACD 流行度门控去噪 + HSA 防止码本漂移 | 冷启动 (1)、STE 噪声 (3) | 四数据集超 SOTA，高稀疏度场景显著 |
| 对比约束 | HiGR [REF-078] | RQ + 对比损失拉开不同物品 ID 距离 | 语义纠缠（重建损失之外） | 腾讯线上观看时长 +1.22% |

> **表 2-3 注释**：根因编号对应 §2.2.5 列出的三条根因——(1) 冷启动循环、(2) 梯度饥饿、(3) STE 估计误差。多数方案不是单一解药——OneRec 同时用了 K-Means 初始化与平衡约束、PRISM 同时治理噪声与坍缩、CARD 模块明示「即插即用」可与其他方案叠加，这正是工业系统选型时「组合用」而非「二选一」的工程现实。

**本节小结。** §2.2 围绕「连续 → 离散」核心转换，从 VQ 的最近邻 + STE（公式 2.3—2.4）出发，递推到 RQ-VAE 的多层残差量化与端到端训练（公式 2.5—2.7、图 2-2），用 TIGER [REF-009] 把 3 层 × 256 量级码本的标准实现拆透；再以 OneRec RQ-KMeans [REF-018] 揭示「沙漏现象」与平衡约束改造的必要性；最后系统梳理了码本坍缩的三条根因（冷启动循环 / 梯度饥饿 / STE 噪声）、两条经典解法（EMA / K-Means init）以及 2025—2026 年衍生出的五条前沿主线（联合优化 / 自适应码长 / 非均匀变换 / 纯净量化 / 结构约束）。一句话总结——**RQ-VAE 是当前推荐领域语义 ID 的主流方法基线，但它在工业级规模下的可用性，依赖于一组围绕码本坍缩展开的工程改造**。

**RQ-VAE 的根本局限。** 然而，本节所有努力——EMA、K-Means 初始化、Gumbel 重参数化、非均匀变换、对比约束——都共享一个工作前提：**它们量化的是连续 embedding 的几何结构，但不直接关注语义可解释性**。几何上邻近的两个码点未必是语义上的近亲——商品库里的「无线鼠标」与「鼠标垫」可能因常被一起购买而 embedding 相近，但语义类别完全不同。RQ-VAE 给出的语义 ID 只能保证「相似的 embedding 共享前缀」，无法保证「相似前缀对应人类可理解的语义类别」。如果我们希望语义 ID 本身就承载人类可读的语义（如品类层级、品牌、属性），就需要绕开 RQ-VAE 路线、直接从文本/属性出发构建 token——这正是下一节 §2.3「基于语义描述的标记方法」的研究主题：用 LLM 直接生成可读 ID（如 IDGenRec）、用层次类目编码（hierarchical taxonomy）、或把品牌-品类-属性串接为可读 token 序列，让语义 ID 既可被自回归解码、又能被人类直接审读。
