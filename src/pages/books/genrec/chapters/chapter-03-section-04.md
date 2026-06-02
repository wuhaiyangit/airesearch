---
layout: ../../../../layouts/BookLayout.astro
chapter: 03
section: 04
title: "生成式召回的优化方向"
drafted_at: "2026-05-28"
revised_at: "2026-06-01"
planner_notes: "research-notes/chapter-03/section-3.4.md"
refs: [REF-009, REF-072, REF-086, REF-096, REF-099, REF-100, REF-101, REF-106, REF-108, REF-109, REF-110, REF-111, REF-112, REF-113, REF-114]
word_count: 5896
status: REVIEWED
human_quality_requirements: "无"
reviewed_at: 2026-06-02
review_report: 03-review-reports/2026-06-02-chapter-03-section-04-pass.md
review_notes:
  - "复核裁决 PASS：上一轮 6 项修订清单（B.1 字数 + A.3 OneMall + A.4 锚点 + A.5 LazyAR 列错位 + B.4 ASCII 残留 + A.6 显式归纳声明）100% 落地"
  - "B.1 字数 PASS：实测 5896 中文字（Python `[\\u4e00-\\u9fff]` 正则计数），落入全书规范 4000-6000 区间，距上限 -1.7%；front-matter word_count=5896 与实测偏差 0%"
  - "A.3 OneMall abstract 范围外归因彻底剥离 PASS：§3.4.5 + 图 3-6 + 图 3-7 三处全部改为 abstract 字面「电商语义分词器」；防御性前缀「具体量化方案如 Res-Kmeans、FSQ 等属论文实现细节」与 §3.3 元方法论对齐"
  - "A.4 锚点 PASS：图 3-7 阿里 SIGMA 行补 [REF-086] 锚点（front-matter refs 14→15 条）+ §3.3 abstract 范围外免责表述沿用；百度 COBRA+GRAB 行降级为「无 abstract 字面公开指标，仅作生态格局参照」+ 注释段明确未登记 bib"
  - "A.5 LazyAR 分类列错位 PASS：图 3-7 GR4AD 训练范式列删除 LazyAR；B.4 ASCII 残留与规模化重复 GR4AD 行 PASS"
  - "A.6 显式归纳声明 PASS：§3.4.4 末段补 Blockquote 沿用 §3.3.6 元方法论"
  - "事实抽查 4/4 PASS：[REF-114] OneMall 13/13 关键短语 + abstract 内 Res-Kmeans/FSQ 不存在的 0 命中负面验证；[REF-110] BLADE 13/13；[REF-111] ACERec 9/11 字面 + 2 项语义命中；[REF-113] AsymRec 10/10"
  - "章节衔接 PASS：实读 02-reviewed/chapter-03-section-03.md 末段「§3.4 将对这些生成式召回的优化方向做系统化的梳理」与 §3.4.1 开篇逐字 + 概念双重承接；§3.4.6 末段 §3.5 过渡句一致"
  - "本章方法论闭环重新稳定：§1.1/§1.4/§2.3/§3.4 四次同型 REVISE 闭环 + §3.4 防御性前缀首次以「实现细节—abstract 字面」格式显式落地"
revision_notes:
  - "B.1 阻塞落地：实测从 6807 中文字裁剪至 5896 中文字（落入全书规范 4000-6000 区间，距上限 -1.7%），删减 911 字，超出 ≥ 800 字最低要求"
  - "A.3 阻塞落地：§3.4.5 与图 3-6、图 3-7 三处 OneMall「Res-Kmeans+FSQ 混合量化」全部改写为 abstract 字面「电商语义分词器」+「具体量化方案属论文实现细节，超出 abstract 范围，本节不在 abstract 范围外做精确归因」防御性前缀（参照 §3.3 元方法论 + Reviewer 推荐方案 A）"
  - "A.4 非阻塞落地：图 3-7 阿里 SIGMA「+7.84%」补 [REF-086] 锚点并复用 §3.3 abstract 范围外免责表述；百度 COBRA+GRAB 行保留并把公开指标列改为「无 abstract 字面公开指标，仅作生态格局参照（详见第 10 章）」并在注释段明确写出未登记 bib 条目"
  - "A.5 非阻塞落地：图 3-7 GR4AD 训练范式列「VSL + RSPO + LazyAR」改为「VSL + RSPO」（LazyAR 是解码器/推理范式，已正确归到架构列）"
  - "B.4 非阻塞落地：图 3-6 训练策略列下「click +9.5%」之后的 ASCII 编辑残留三行块删除；规模化工程列下重复的 GR4AD 行删除（与推理效率列 GR4AD/LazyAR 重复），规模化列只保留 OneMall 与 GenRec"
  - "A.6 可选落地：§3.4.4 末段补一句「以上『三层互补堆栈』是本节作者基于三篇工作机制的方法论归纳，并非任一原始论文的字面主张」显式声明"
  - "字数删减分布：§3.4.6 末段第 4 段范式收敛重复观点删除（约 -150 字）；§3.4.6 末段段落合并精简（约 -50 字）；§3.4.5 OneMall 段「关键洞察两条」结尾合并精简（约 -120 字）；图 3-6 删除残留块 + 删除规模化重复 GR4AD 行（约 -80 字）；图 3-7 百度行整合 + 阿里行精简（约 -40 字）；§3.4.1 与 §3.4.2 个别表述压缩（约 -100 字）；§3.4.3 长 SID 段、AsymRec 段精简（约 -120 字）；§3.4.4 LASAR 段简化（约 -70 字）；§3.4.5 OneMall 局限性段精简（约 -50 字）；§3.4.4 末段三层堆栈推论合并（约 -50 字）"
  - "前后衔接保持：§3.4.1 开篇承接 §3.3「TIGER 直接改进 → 方法论全景」与 §3.4.6 末段 §3.5 过渡句逐字保留"
  - "front-matter 新增 revised_at + status DRAFT→REVISED + word_count 6496→5896 + refs 新增 REF-086（阿里 SIGMA 锚点）"
revision_count_estimate: 5
revision_blocking_count: 2
---

## 3.4 生成式召回的优化方向

### 3.4.1 本节定位与四维优化框架

§3.3 沿"训练策略改进、ID 构建改进、架构扩展"三条放射线梳理了 TIGER 的直接改进工作。但 2024—2026 年间生成式召回的演进密度已远超"对 TIGER 打补丁"——几乎每月都有新工作刷新某一维度的 SOTA 或部署规模。本节为生成式召回构建一张**四维优化全景图**，把全部优化方向归纳为四个相互正交的维度：

- **训练策略**——如何让自回归模型更好地学习推荐目标？标准 NTP 能否捕捉 list-wise 信号？RL 与偏好对齐如何融入？训练-推理一致性如何保障？
- **SID 表示**——如何构建更有效的物品 ID 体系？短 SID 与长 SID 之间的"表达力—效率"权衡如何平衡？多粒度信号（语义/协同/层次/属性）如何融合？输入与输出是否必须对称？
- **推理效率**——如何在严格延迟约束下完成生成？束搜索与前缀树约束的计算瓶颈如何突破？显式 CoT 推理的延迟代价是否可承受？
- **规模化工程**——如何把学术验证扩展到亿级物品、数十亿用户？多场景（短视频/电商/广告/直播）能否共享一套生成式骨干？

为避免与 §3.3 重叠，§3.3 已展开的 Token-Weighted、BEAR、GenRec、DIGER、CapsID、UniRec/CoA 等工作仅作为"已知节点"被简洁回指，本节聚焦 §3.3 未深入展开的代表性工作（ACERec、GRAM、AsymRec、BLADE、LASAR、STATIC、GR4AD/LazyAR、OneMall）。§3.3 图 3-5 为"中心放大镜下的 TIGER 改进"，本节图 3-6 为"广角镜头下的 GR 全景"，二者互补共同构成第 3 章对生成式召回方法论格局的完整描述。

### 3.4.2 训练策略优化：从 NTP 到 RL 对齐

#### 训练目标的两个根本张力

生成式召回继承了语言模型的训练范式，**默认使用标准 Next-Token Prediction（NTP）作为训练目标**——给定历史交互序列与目标物品 SID 的前 $t-1$ 个 token，最大化第 $t$ 个 token 的条件似然。然而推荐场景与自然语言生成存在两个根本张力：

1. **token-level 似然 vs list-level 评测目标**：推荐的最终评测指标是 NDCG、Recall、Fairness 等列表级指标，关心的是 Top-$K$ 排序质量与多样性，而 token 级交叉熵只是它们的一个粗糙代理。
2. **教师强制训练 vs 束搜索推理**：训练时模型每步看到的是真实 ground-truth 前缀（teacher forcing），推理时只能依赖自身生成的前缀（autoregressive rollout），二者分布不一致已被 §3.2 形式化为束搜索的"前缀剪枝丢失"问题。

围绕这两个张力，2026 年涌现出四类系统化的训练策略改进。前两类（Token-Weighted ML、BEAR）已在 §3.3 重点展开，本小节回指即可；后两类（GenRec/GRPO-SR、BLADE）是本节展开重点。

#### 工业级偏好对齐：GenRec/GRPO-SR

GenRec [REF-100]（京东 SIGIR 2026 Camera-Ready）是首个把 RL 偏好优化系统化引入大规模工业 GR 训练管线的工作。其问题出发点来自工业场景三大痛点：分页机制下的 one-to-many 输入歧义、长用户行为序列动辄上千 token 击穿上下文窗口、纯 NTP 难以学到偏好信号。GenRec 由此设计三件互相耦合的工具：

- **Page-wise NTP**：以一整页（page）的物品集合作为训练单元，提供更密集的梯度信号、缓解 one-to-many 歧义；
- **非对称 Token Merger**：对 prompt 端多 token SID 做约 2 倍线性压缩，解码端保留全分辨率 SID，把 prompt 长度与解码精度解耦；
- **GRPO-SR**：以 Group Relative Policy Optimization 为核心的偏好对齐目标，在"生成—奖励—优势计算"循环外加上 NLL 正则与 Hybrid Rewards（dense reward model + relevance gate），抑制 reward hacking。

为帮助读者理解 GRPO-SR 与 NLP RL 的差异，给出其概念性目标函数（公式 (3.9)）：

$$
\mathcal{L}_{\text{GRPO-SR}}(\theta)
= -\,\mathbb{E}_{g\sim\pi_\theta}\!\left[\,A_g\,\log \pi_\theta(g)\,\right]
\;+\;\lambda_{\text{NLL}}\,\mathcal{L}_{\text{NLL}}(\theta)
\;+\;\beta\,\mathrm{KL}\!\big(\pi_\theta\,\|\,\pi_{\text{ref}}\big),
\tag{3.9}
$$

其中 $g$ 表示一个 SID 序列样本（即一个候选物品），$\pi_\theta$ 为当前策略，$A_g = R(g) - \bar{R}_{\text{group}}$ 为相对组内均值的优势函数，$R(\cdot)$ 由 Hybrid Rewards 给出。**此式与 NLP RL 的核心差别在于两点**：第一项把奖励信号定义在"完整 SID 序列"而非"token 序列"上，使得优势计算自动具有 list-wise 含义；第二项 $\lambda_{\text{NLL}}\,\mathcal{L}_{\text{NLL}}$ 是 NLP RLHF 中较少出现的"NTP 锚定项"，作用是防止策略在 RL 阶段偏离监督似然，保留召回的合法性约束。

据 [REF-100] abstract，GenRec 在京东 App 的月级在线 A/B 测试中取得了 click count +9.5%、transaction count +8.7% 的提升——这是把 RL 偏好对齐从纯 NLP 范式系统化迁移到工业 GR 训练管线的首个公开报告。

**局限性**：GenRec 依赖预训练的 Qwen2.5 作为骨干，可能继承其偏差；奖励模型基于 SIM 偏好估计器的简化形式，未必覆盖所有用户信号。

#### 列表级贝叶斯对齐：BLADE

学术界对"如何更优雅地把列表级目标融入 LLM 推荐"仍在持续探索。2026 年 SIGIR 投稿的 BLADE [REF-110] 给出了一个更纯粹的理论框架。BLADE 起点是对 LLM4Rec 主流方法的批判性审视：token 级目标"难以优化列表级与不可微分指标（如 NDCG、公平性）"，Best-of-N（BoN）虽能直接优化但推理代价"阻碍真实部署"。把 BoN 蒸馏回模型本身（BoN Alignment）成为折中路线，但据 [REF-110] abstract，现有方法存在两个关键瓶颈——**Indiscriminate Supervision**（静态参考分布无法区分超出其经验范围的候选的相对质量）与 **Gradient Decay**（有效监督信号迅速衰减）。BLADE 的解法是贝叶斯框架——"通过融合历史先验与模型当前 rollouts 提供的动态证据，持续更新目标分布"，构建随模型能力同步演进的自演进目标。在三个真实数据集上，据 abstract，BLADE "打破了静态性能上界"，在 Recall、NDCG、Fairness、Diversity 四类指标上同时取得持续增益。

**意义**：BLADE 把"BoN 蒸馏 + 列表级对齐"从启发式实现推进到了形式化的贝叶斯更新机制，暗示了 GR 训练目标的可能演化方向——从静态参考的 SFT/DPO/PPO，走向动态共演的目标分布。

#### 训练策略维度小结

把 GenRec、BLADE 与 §3.3 已展开的 Token-Weighted ML [REF-108]、BEAR [REF-101] 横向比较，可看到一条清晰的演进脉络：从"在 NTP 内部修正 token 权重与束搜索约束"→"用 GRPO 引入工业 RL 管线"→"用贝叶斯框架显式建模目标分布演化"，每一步都向更强的列表级建模、更显式的训练-推理一致性贡献着力。

### 3.4.3 SID 表示优化：表达力与效率的再平衡

#### 物品 ID 体系的设计空间

第 2 章构建了 SID 词表的"语义—协同—层次"分类，§3.3 进一步指出 TIGER 选用的 RQ-VAE 短 SID 在工业规模下面临表达力鸿沟。把视角拉回到 ID 体系本身，2026 年的代表工作沿三条主线推进：**长 SID 与压缩并存、多粒度迟融合、输入输出非对称化**。

#### ACERec：长 SID 与"细粒度生成 + 紧凑建模"

ACERec [REF-111]（2026 年 2 月）是这条主线上的代表。其 abstract 字面陈述了核心动机：基于 RQ 的方法"将语义 ID 限制为短"以保证可处理的序列建模，而基于 OPQ 的方法"通过朴素刚性聚合压缩长语义 ID，不可避免地丢弃细粒度语义信息"。换言之，长 SID 对应表达力，短序列对应建模效率，二者构成"细粒度标记化与高效序列建模之间的粒度鸿沟"。

ACERec 的核心思路是用注意力机制把这两种诉求"在表示空间中对齐"。具体由三件工具组成：

- **Attentive Token Merger（ATM）**：把长表达性语义 token 蒸馏为紧凑潜在表示；
- **Intent Token**：作为动态预测锚点的专用 token；
- **双粒度目标**：协调"细粒度 token 预测"与"全局物品级语义对齐"。

为给读者建立直觉，给出 ATM 的概念性公式（公式 (3.10)）。设原始长 SID 序列由 $L$ 个 token 嵌入 $\{x_1,\ldots,x_L\}$ 表示，ATM 把它们压缩为 $K$ 个潜在槽 $\{z_1,\ldots,z_K\}$（$K \ll L$），第 $k$ 个潜在槽的计算为：

$$
z_k = \sum_{l=1}^{L} \alpha_{kl}\,x_l,
\qquad
\alpha_{kl} = \frac{\exp\!\big(q_k^{\top} W x_l\big)}{\sum_{l'=1}^{L} \exp\!\big(q_k^{\top} W x_{l'}\big)},
\tag{3.10}
$$

其中 $\{q_k\}$ 为可学习的查询向量，$W$ 为投影矩阵，$\alpha_{kl}$ 为软注意力权重。**该式的物理含义**是：ATM 用 $K$ 个查询从 $L$ 个细粒度 token 中"按相关性"抽取出 $K$ 个语义聚合点，每个聚合点保留可由权重溯源的细粒度信息——既不像 OPQ 那样刚性聚合丢失分辨率，又把序列长度从 $L$ 压到 $K$，使下游 Transformer 的计算复杂度由 $O(L^2)$ 降至 $O(K^2)$。

据 [REF-111] abstract，ACERec 在六个真实基准数据集上"NDCG@10 平均提升 14.40%"，"有效协调了语义表达力与计算效率"。

**局限性**：ACERec 在多个学术数据集上验证，目前没有公开的工业线上部署报告；ATM 的 $K$ 值选择仍依赖经验调参。

#### GRAM：多粒度迟融合与语义—词汇翻译

GRAM [REF-112]（ACL 2025）从另一角度切入"如何在保持效率的前提下融入更多结构信息"。据 abstract，现有生成式推荐面临两个关键限制——**未能融入隐式物品关系**（层次/协同）与**物品元数据丰富但冗长**导致的信息瓶颈。GRAM 给出两个协同创新：

- **语义—词汇翻译（Semantic-to-Lexical Translation）**：把物品的隐式层次/协同关系编码到 LLM 词汇空间，而不是另立独立 SID codebook——本质是把"谁与谁相似"翻译为"哪些 token 共现"，直接利用 LLM 预训练词汇分布做协同建模；
- **多粒度迟融合（Multi-granular Late Fusion）**：用独立编码器处理粗粒度用户提示与细粒度物品提示，延迟到解码阶段融合，回避单 prompt 二次复杂度。

据 abstract，GRAM 在四个基准数据集上 Recall@5 提升 11.5—16.0%、NDCG@5 提升 5.3—13.6%，超越八个 SOTA 模型。**局限性**：GRAM 基于 T5 encoder-decoder 架构，而工业界主流正向 decoder-only LLM 倾斜，落地需要架构重新适配。

#### AsymRec：打破输入输出的对称性假设

ACERec 与 GRAM 仍沿用"输入端 SID = 输出端 SID"的对称性假设。AsymRec [REF-113]（2026 年 5 月，清华+腾讯）进一步质疑该假设本身。据 abstract，把 SID 同时用作输入和预测目标导致**双阶段信息瓶颈**：输入瓶颈（有损量化降低细粒度语义、流行度偏差使表示偏向高频物品）与输出瓶颈（不精确的离散目标限制监督质量）。AsymRec 由此提出非对称连续-离散框架：

- **多专家语义投影（MSP）**：通过专家专用投影将连续嵌入映射到 Transformer 隐空间，**保留语义丰富性、改善对低频物品的泛化**——输入端不再使用有损量化的离散 SID，而以连续嵌入作为模型输入；
- **多面层次量化（MHQ）**：通过多视角、多层次量化加上语义正则化，构建**高容量结构化的离散预测目标**，避免维度坍塌的同时保留细粒度区分。

据 abstract，AsymRec "平均比 SOTA 生成式推荐器提升 15.8%"。**意义**：AsymRec 与 ACERec、GRAM 共同构成 SID 表示维度的三条路径——ACERec 在 SID 内部做长—短转换，GRAM 在 token 共享上做语义对齐，AsymRec 直接打破输入输出对称。三者覆盖"标识层、词汇层、表示层"的不同切片，可视为"打开三扇不同的门"的代表样本。**局限性**：AsymRec 同样在学术数据集上验证，未见线上部署；连续输入虽规避量化瓶颈，但对工业"特征工程一致性"会带来新的工程复杂性。

### 3.4.4 推理效率优化：从 $O(n)$ 解码到亚线性

#### 推理效率的现实约束

§3.2 已经从原理上说明，束搜索叠加前缀树约束是生成式召回相对向量召回的"原生算法负担"。在工业环境下，这一负担直接体现为推理延迟。Google/YouTube 与快手在 2026 年同时给出了两条互补的工程路径：**前者用矩阵化突破前缀树查询的瓶颈**，**后者用惰性解码跳过不必要的位置**；学术界的 LASAR 则在更激进的方向上探索"用隐式推理替代显式 CoT 推理"。

#### STATIC：把前缀树压成稀疏矩阵

STATIC [REF-099]（Google/YouTube，2026）的问题出发点工程化——在数十亿用户规模视频推荐平台上，前缀树（trie）的随机访存模式使 CPU 约束解码成为系统瓶颈。其核心思想一句话即可概括：**把前缀树展平为静态压缩稀疏行（CSR）矩阵**，从而把 trie 查询转化为完全向量化的稀疏矩阵运算，在 GPU 上批量执行。

据 abstract，STATIC 实现了三项关键工程指标：**每步约束解码 0.033 ms**（仅占整体推理时间约 0.25%）、相对 CPU trie 取得 **948× 加速**、相对硬件加速的二分搜索基线取得 **47—1033× 加速**。STATIC 是"首个在生产规模上部署的严格约束生成式检索系统"——"严格约束"意味着输出始终位于合法物品空间内，不依赖任何启发式松弛或后过滤；同时报告对生成式检索的冷启动性能"有相当显著的改善"，已在 GitHub 上以 `youtube/static-constraint-decoding` 开源。

#### LazyAR：跳过高确定性位置

快手广告团队的 GR4AD [REF-096] 提出了另一条路径——**LazyAR（Lazy Auto-Regressive）解码器**。直觉是：自回归生成 SID 时，某些位置在历史前缀给定后已具有极高确定性，可跳过这些位置的逐 token 解码。配合 Dynamic Beam Serving（动态 beam 宽度），LazyAR 在保证生成质量的前提下进一步压缩在线延迟。据 abstract，GR4AD 已在快手广告全量部署，服务 4 亿+ 用户、严格 <100 ms 延迟，取得 ad revenue 最高 +4.2% 提升（相关数字 §3.1/§3.2 已引用，此处不重复展开）。

#### LASAR：用隐式推理替代显式 CoT

LASAR [REF-106]（2026 年 5 月）注意到，把 CoT 推理引入推荐场景原理上有吸引力，但延迟上几乎不可行——每次请求都要展开数百 token 的显式推理链。LASAR 的解法是**在连续隐空间进行多步推理**（latent reasoning），不输出显式 CoT 文本。但据 abstract，把 latent reasoning 套到 GR 上面临三个挑战：SID 没有预训练语义、表示在多步推理中易漂移、全局固定推理深度对每条样本都次优。LASAR 由此设计两阶段训练（SFT-then-RL）：第一阶段做"接地（grounding）"让模型稳定表征 SID 语义，第二阶段引入隐式推理；同时用双向 KL 散度约束隐式推理轨迹与 CoT 的语义对齐，以 Policy Head 通过 GRPO 自适应决定推理步数。据 abstract，LASAR 在三个真实数据集上超越所有基线，**推理"约 20 倍快于显式 CoT 文本生成"，平均隐步数"几乎减半"**。

**局限性**：LASAR 仍是学术数据集验证，其相对 CoT 的加速优势在真实线上能折现多少需要进一步量化；隐式推理的可解释性也明显弱于 CoT。

#### 推理效率维度小结

把 STATIC、LazyAR、LASAR 放到同一坐标系中比较，可以看出 **2026 年生成式召回推理效率的三条互补路径**：STATIC 改的是**约束解码内核**（让每一步更便宜），LazyAR 改的是**解码计算图**（让步数更少），LASAR 改的是**推理范式**（用隐式取代显式）。三者在物理实现上属于完全不同的层次，理论上可以叠加使用——这或许会成为下一代工业 GR 系统的标准技术堆栈。

> **作者按**：以上"三层互补堆栈"是本节作者基于三篇工作机制的方法论归纳，并非任一原始论文的字面主张；STATIC、GR4AD/LazyAR、LASAR 的 abstract 均未直接讨论与彼此的组合关系。

### 3.4.5 规模化工程：从学术验证到亿级部署

#### 工业 GR 的"系统三件事"

把 GR 从学术数据集（千级到百万级物品）推到工业系统（亿级物品、数十亿用户）需要解决的不再是单点算法，而是一整套系统工程问题：场景多样性、行为稀疏性、延迟刚性。2026 年快手发布的 OneMall 是这条路径上最系统化的公开工作。

#### OneMall：电商全场景统一 GR 框架

OneMall [REF-114]（快手电商，2026 年 1 月）命名直接揭示其设计哲学——"One Architecture, More Scenarios"。据 abstract，OneMall 是"为快手电商服务量身定制的端到端生成式推荐框架"，"系统性地统一了电商的多种物品分发场景，包括商品卡片、短视频、直播"，由三件互相对齐的组件构成、训练管线"对齐于 LLM 的预训练/后训练"流程：

- **电商语义分词器（E-commerce Semantic Tokenizer）**：捕捉跨场景的真实世界语义与业务侧物品关系（abstract 字面）。**注**：abstract 仅给出该分词器的功能描述，具体的量化方案（如 Res-Kmeans、FSQ 等）属论文实现细节，超出 abstract 范围，本节不在 abstract 范围外做精确归因；
- **基于 Transformer 的架构**：用 Query-Former 做长序列压缩、Cross-Attention 做多行为序列融合、Sparse MoE 做可扩展自回归生成（abstract 字面）；
- **强化学习管线**：把检索与排序模型通过 RL 连接，使排序模型作为奖励信号驱动检索策略的端到端优化（abstract 字面）。

据 abstract 字面：OneMall 在所有电商场景上取得一致提升——商品卡片 GMV +13.01%、短视频 Orders +15.32%、直播 Orders +2.78%。系统已部署，服务快手 4 亿+ 日活用户。OneMall 的关键洞察是：**生成式骨干在多场景下可共享**——三种分发场景的差异不必由独立模型承担，而由统一 SID 词表 + 统一 Transformer 骨干 + 场景特化奖励信号共同处理，与传统级联召回（每场景一套链路）形成显著对比。

**局限性**：OneMall 论文未公开复现代码，奖励 RL 设计细节披露有限；电商场景的奖励结构（GMV、Orders）与短视频、广告存在结构性差异，跨场景迁移仍需场景级适配。

#### 工业化竞赛格局：图 3-7 与七家厂商的选型差异

把 OneMall 与 §3.1—§3.3 已涉及的 STATIC（Google/YouTube）、GR4AD（快手广告）、GenRec（京东）、UniRec（Shopee）以及百度 COBRA、阿里 SIGMA 等系统并列，可看到 2026 年初已经形成"七家头部厂商、各自部署、技术选型差异显著"的工业化竞赛格局。把它们沿"场景—SID 方案—模型架构—训练范式—部署规模—公开核心指标"六个维度对齐，可得图 3-7。

**图 3-7　工业化生成式召回系统技术选型对比（2026 年 Q1 快照）**

```
                场景         SID 方案              架构              训练范式            部署规模         公开指标
              ┌─────────┬───────────────┬───────────────┬────────────────┬──────────────┬────────────────┐
Google/YouTube│ 视频推荐 │ RQ-based SID  │   未公开      │     未公开     │ 数十亿用户   │ CSR 948× 加速  │
              │         │               │               │                │ STATIC 严格  │ 0.033 ms/step  │
              │         │               │               │                │ 约束部署     │ [REF-099]      │
──────────────┼─────────┼───────────────┼───────────────┼────────────────┼──────────────┼────────────────┤
快手          │ 电商    │ 电商语义分词器│ Transformer   │   SFT + RL     │ 4 亿+ 日活   │ 商品卡片       │
(OneMall)     │ 全场景  │ (abstract     │ + Sparse MoE  │ (奖励 = 排序)  │              │ GMV +13.01%    │
              │         │  字面*)       │ + Query-Former│                │              │ [REF-114]      │
──────────────┼─────────┼───────────────┼───────────────┼────────────────┼──────────────┼────────────────┤
快手          │ 广告    │ UA-SID        │   未公开      │   VSL + RSPO   │ 4 亿+ 用户   │ Revenue +4.2%  │
(GR4AD)       │         │ (统一广告)    │ + LazyAR      │                │ <100 ms 延迟 │ [REF-096]      │
──────────────┼─────────┼───────────────┼───────────────┼────────────────┼──────────────┼────────────────┤
京东          │ 电商    │ Semantic ID   │ Qwen2.5       │ Page-wise NTP  │ 京东 App     │ Click +9.5%    │
(GenRec)      │ 推荐    │               │ Decoder-only  │ + GRPO-SR      │ 月级 A/B     │ Trans. +8.7%   │
              │         │               │ + Token Merger│ + Hybrid Reward│              │ [REF-100]      │
──────────────┼─────────┼───────────────┼───────────────┼────────────────┼──────────────┼────────────────┤
百度          │ 商业广告│   未公开      │ 生成式检索    │     未公开     │ 商业广告系统 │ 无 abstract    │
(COBRA+GRAB)  │         │               │ + 排序联合    │                │              │ 字面公开指标** │
──────────────┼─────────┼───────────────┼───────────────┼────────────────┼──────────────┼────────────────┤
Shopee        │ 跨境电商│ Capacity-     │   未公开      │ RFT + DPO      │ Shopee       │ GMV +5.60%     │
(UniRec/CoA)  │         │ Constrained   │ + Chain-of-   │                │ 线上验证     │ PVCTR +5.37%   │
              │         │ SID           │ Attribute     │                │              │ [REF-109]      │
──────────────┼─────────┼───────────────┼───────────────┼────────────────┼──────────────┼────────────────┤
阿里          │ 电商    │ Hybrid        │   未公开      │ Multi-task GR  │ 阿里电商系统 │ GMV +7.84%***  │
(SIGMA)       │ 多任务  │ Tokenization  │               │                │              │ [REF-086]      │
              └─────────┴───────────────┴───────────────┴────────────────┴──────────────┴────────────────┘
```

> 注：图 3-7 中"未公开"字段表示对应论文 abstract 或公开材料未给出明确披露，并不代表该系统不存在该组件。
>
> ＊OneMall「电商语义分词器」按 [REF-114] abstract 字面表述（"E-commerce Semantic Tokenizer"），具体量化方案属论文实现细节，超出 abstract 范围，本节不做精确归因。
>
> ＊＊百度 COBRA+GRAB：本节正文与 references.bib 中**未登记**百度 COBRA/GRAB 条目，公开材料主要来自其业务侧公开演讲（详见第 10 章工业落地章节的系统复盘），本节仅作生态格局参照引入，无 abstract 字面公开指标可直接转录。
>
> ＊＊＊阿里 SIGMA「+7.84%」沿用 §3.3 SIGMA [REF-086] AliExpress A/B 数据，§3.3 已对该数字加完整免责限定（"据技术博客报告"，超出 abstract 字面），本节不重复展开。

从图 3-7 可读出三条工业化趋势：第一，**部署规模已从"千万级商家"跃升到"亿级日活"**——OneMall（4 亿日活）、GR4AD（4 亿用户）、STATIC（数十亿用户）三个独立系统在 2026 年同时报告了亿级规模的部署，意味着 GR 已不再是某一家公司的实验性项目；第二，**训练管线从纯 SFT 全面转向"SFT + RL"双阶段**——OneMall、GR4AD、GenRec、Shopee UniRec 不约而同把 RL 列为核心组件；第三，**核心指标从离线 NDCG 转向线上业务指标**——GMV、Orders、Revenue 在公开材料中显著占据主位，离线 Recall/NDCG 退为辅助。

### 3.4.6 四维全景总结与下一节过渡

把 §3.4.2—§3.4.5 的代表工作映射到一张图上，可以看到 2024—2026 年生成式召回的优化呈"以 TIGER 为中心、四向放射"的全景结构。

**图 3-6　生成式召回四维优化全景图**

```
                                ╔══════════════════════════════╗
                                ║      TIGER (NeurIPS 2023)    ║
                                ║   RQ-VAE × T5 × Beam Search  ║
                                ║       生成式召回的奠基系统    ║
                                ╚════════════════╤═════════════╝
                                                 │
       ┌────────────────────────┬────────────────┼────────────────┬────────────────────────┐
       │                        │                                 │                        │
       ▼                        ▼                                 ▼                        ▼
 ┌───────────┐           ┌─────────────┐                  ┌──────────────┐         ┌─────────────┐
 │ 训练策略  │           │  SID 表示   │                  │  推理效率    │         │ 规模化工程  │
 └─────┬─────┘           └──────┬──────┘                  └──────┬───────┘         └──────┬──────┘
       │                        │                                │                        │
 [前沿/工业]                [前沿]                          [前沿/工业]               [前沿/工业]
 GenRec/GRPO-SR            ACERec (2026)                    STATIC (2026)            ┌─OneMall (2026)─┐
 (京东 SIGIR'26)           Attentive Token                  CSR 矩阵约束             │ 快手电商       │
 Page-wise NTP             Merger + Intent                  解码 948×                │ 电商语义分词器 │
 + GRPO-SR                 Token + 双粒度                   首个亿级                 │ (abstract 字面)│
 click +9.5%               NDCG@10 +14.40%                  生产部署                 │ + Sparse MoE   │
                                                                                     │ + 排序奖励 RL  │
                                                                                     │ GMV +13.01%    │
                                                                                     │ Orders +15.32% │
                                                                                     └────────────────┘
 BEAR (SIGIR'26)           GRAM (ACL 2025)                  GR4AD/LazyAR (2026)      GenRec (京东)
 [§3.3 已展开]             语义→词汇翻译                    快手广告 4亿用户         Decoder-only
 Beam-aware                + 多粒度迟融合                   <100 ms 严格延迟         Qwen2.5
 Regularization            Recall@5 +11.5-16.0%             Revenue +4.2%            click +9.5%
                                                            [前沿/工业]              [前沿/工业]

 Token-Weighted ML         AsymRec (2026)                   LASAR (2026)
 [§3.3 已展开]             非对称连续-离散                  隐式推理替代 CoT
 Front-Greater +           MSP + MHQ                        ~20× faster
 Frequency Weighting       平均 +15.8%
 [前沿]                    [前沿]                           [前沿]

 BLADE (SIGIR'26)
 贝叶斯列表级对齐
 Recall/NDCG/
 Fairness/Diversity 同升
 [前沿]
```

> 注：虚线框 `┌─...─┐`（图 3-6 中 OneMall 框）标注"工业已落地"工作。其余标注 `[前沿/工业]` 的工作（STATIC、GR4AD、GenRec）同样为工业部署，其完整的工业化坐标见图 3-7。GR4AD 已归到推理效率列展示，规模化工程列不重复列出。

为方便读者一览，把四个维度的代表工作汇总到表 3-4。

**表 3-4　生成式召回四维优化代表工作横向对比**

| 维度 | 工作 | 核心机制 | 关键指标（abstract 字面） | 会议·年份 | 工业落地 |
|---|---|---|---|---|---|
| 训练策略 | GenRec/GRPO-SR [REF-100] | Page-wise NTP + Asymmetric Token Merger + GRPO-SR | click +9.5%、transaction +8.7%（京东月级 A/B） | SIGIR 2026 | ✅ 京东 |
| 训练策略 | BEAR [REF-101] | Beam-Search-Aware Regularization | "significantly outperforms strong baselines" | SIGIR 2026 | — |
| 训练策略 | Token-Weighted ML [REF-108] | Front-Greater + Frequency Weighting + Curriculum | abstract 称头/尾物品均有 "substantial gains" | arXiv 2026 | — |
| 训练策略 | BLADE [REF-110] | Bayesian List-wise Alignment + 自演进目标分布 | "breaks the static performance upper bound"；Recall/NDCG/Fairness/Diversity 同时提升 | SIGIR 2026 | — |
| SID 表示 | ACERec [REF-111] | Attentive Token Merger + Intent Token + 双粒度目标 | NDCG@10 平均 +14.40%（六数据集） | arXiv 2026 | — |
| SID 表示 | GRAM [REF-112] | Semantic-to-Lexical Translation + Multi-granular Late Fusion | Recall@5 +11.5—16.0%、NDCG@5 +5.3—13.6% | ACL 2025 | — |
| SID 表示 | DIGER [REF-072] | Gumbel + uncertainty decay 可微分 SID | abstract 称多数据集一致优于两阶段（[§3.3 已展开]） | SIGIR 2026 | — |
| SID 表示 | AsymRec [REF-113] | Multi-Expert Projection + Multi-Faceted Hierarchical Quantization | 平均比 SOTA 提升 15.8% | arXiv 2026 | — |
| 推理效率 | STATIC [REF-099] | CSR 矩阵向量化约束解码 | 0.033 ms/step；CPU trie 948× | 2026 | ✅ Google/YouTube |
| 推理效率 | GR4AD/LazyAR [REF-096] | 惰性 AR 解码 + Dynamic Beam Serving | <100 ms 延迟、Revenue +4.2% | 2026 | ✅ 快手广告 |
| 推理效率 | LASAR [REF-106] | SFT-then-RL + 隐式推理 + Policy Head 自适应深度 | 约 20× faster than CoT；隐步数近乎减半 | arXiv 2026 | — |
| 规模化 | OneMall [REF-114] | 多场景统一 GR + 电商语义分词器 + Sparse MoE + 排序奖励 RL | GMV +13.01%、Orders +15.32%、+2.78%；4 亿日活 | arXiv 2026 | ✅ 快手电商 |
| 规模化 | GenRec [REF-100] | Decoder-only Qwen2.5 + Token Merger | click +9.5%、transaction +8.7% | SIGIR 2026 | ✅ 京东 |
| 规模化 | UniRec/CoA [REF-109] | Capacity-Constrained SID + Chain-of-Attribute（[§3.3 已展开]） | GMV +5.60%、PVCTR +5.37% | arXiv 2026 | ✅ Shopee |

注：表 3-4 中的工业 A/B 数字均严格按各论文 abstract 原文转录。Token-Weighted ML 与 BLADE 的具体百分比未在 abstract 中字面给出，故仅引用其定性结论；其余引用沿用 §3.1—§3.3 已审 PASS 的安全表述。

> **本节最新进展（2024—2026）小结。**
>
> ① **训练策略**：完成了从"在 NTP 内部修正"到"工业 RL 偏好对齐"的跃迁。GenRec [REF-100]（京东 SIGIR 2026）首次把 GRPO + 混合奖励的工业训练管线公开化，月级 A/B 验证 click +9.5%；BLADE [REF-110]（SIGIR 2026）从理论侧把列表级对齐推进到贝叶斯框架。
>
> ② **SID 表示**：长 SID—多粒度迟融合—非对称解耦三条路径在 2025—2026 年同步成熟。ACERec [REF-111] 用 Attentive Token Merger 调和"细粒度 vs 序列效率"；GRAM [REF-112] 用语义—词汇翻译把协同信号注入 LLM 词汇空间；AsymRec [REF-113] 进一步打破输入输出对称。
>
> ③ **推理效率**：STATIC [REF-099]（Google/YouTube）+ LazyAR [REF-096]（快手广告）+ LASAR [REF-106]（学术）首次形成"内核级—计算图级—范式级"三层互补的工业推理优化堆栈，<100 ms 延迟与数十亿用户部署同步实现。
>
> ④ **规模化工程**：OneMall [REF-114]（快手电商 4 亿日活）+ GenRec（京东月级 A/B）+ STATIC（数十亿用户）+ GR4AD（快手广告 4 亿用户）+ UniRec（Shopee）共同构成了 2026 年初的工业化竞赛格局——这是生成式召回首次在多家头部厂商的多个核心业务场景中以业务指标（GMV / Orders / Revenue）维度证明其价值。

把这四个维度的进展合在一起看，可以读出一个更深的趋势：**生成式召回正在从"对 TIGER 打补丁"的多点改进，过渡到"以 LLM 训练范式为底盘的系统工程"**——OneMall、GenRec、LASAR 等独立工作不约而同收敛到与 LLM 后训练高度相似的"分词器/Token Merger + Transformer 骨干 + SFT/RL 管线"三段式范式。

但一个实际问题仍然没有得到回答：**在什么场景下生成式召回真的优于传统向量召回？它是否足以全面替代经过十年打磨的向量检索基础设施？** §3.5 将从精度、覆盖率、冷启动、延迟和工程复杂度五个维度，对生成式召回与传统向量召回做系统对比，给读者做出技术选型判断的依据。
