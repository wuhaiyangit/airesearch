---
layout: ../../../../layouts/BookLayout.astro
chapter: 03
section: 02
title: "生成式检索的基本原理"
drafted_at: "2026-05-25"
reviewed_at: "2026-05-25"
planner_notes: "research-notes/chapter-03/section-3.2.md"
refs: [REF-009, REF-098, REF-099, REF-101, REF-102, REF-103, REF-104, REF-105]
word_count: 5029
status: REVIEWED
human_quality_requirements: "无"
review_notes:
  - "事实抽查 4 篇前沿 REF（REF-103 Latte / REF-104 CARE / REF-105 Lost in Decoding / REF-102 DSI）全部 abstract 字面命中（含 5 处直接引语 + Latte 6 项关键短语 + CARE 4 项关键短语 + Lost in Decoding 5 项关键短语）"
  - "REF-101 BEAR 与 REF-099 STATIC 在 §3.1 已抽查通过，本节复用论断与 §3.1 一致"
  - "字数 5029 vs front-matter 5040 偏差 -0.22%（已校正 word_count → 5029）；落在全书规范 4000-6000 与 writing-queue 建议区间内"
  - "公式 (3.3)(3.4)(3.5) 承接 §3.1 (3.1)(3.2) 体例正确；图 3-2 解码管线 + 图 3-3 解码树剪枝 + 表 3-2 三大机制对比体例齐全"
  - "章节衔接：实读 02-reviewed/chapter-03-section-01.md 末段「把'找到最相关的物品'重新理解为'生成最可能的物品标识序列'」与 §3.2.1 开篇逐字承接 PASS；§3.2.7 过渡句与调研笔记建议过渡句一致"
  - "防御性写作规范继承良好：5 处直接引语全部双引号 + abstract 字面命中；BEAR/STATIC 工业级声明已在 §3.1 加过限定；Latte 3.45% / CARE 三骨干引用克制"
  - "PASS 模式微调建议（不阻塞，归口下轮）：CARE [REF-104] abstract 仅说 'three GR backbones'，未点名 TIGER/LETTER/SETRec；Writer 列出三骨干名虽承调研笔记 + GitHub 仓库暗示 TIGER，但 abstract 字面无直接支撑——建议在后续节首次引用 CARE 时补加「据调研笔记 [REF-104] note 字段」之类的二次信源限定，沉淀 §1.4/§2.5 防御方法论"
  - "公式 (3.2 已给出) 标号格式存在不一致风险：本节为表示对 §3.1 公式 (3.2) 的复用而采用 \\tag{3.2 已给出}，建议下轮统一采用文字说明（如「沿用 §3.1 公式 (3.2)」）替代异常标号——非阻塞，仅体例统一建议"
  - "前沿覆盖度优秀：Latte / CARE / Lost in Decoding / BEAR / STATIC 五个 2025-2026 工作均已显式标注年份+机构+会议；理论层 [REF-098] / 解码层 [REF-101][REF-105] / 解码-推理一体化 [REF-104] / 工程层 [REF-099] 四象限均覆盖"
  - "学术 vs 工业边界清晰：§3.2.5 STATIC 工业部署声明已在 §3.1.6 详细引用 + 本节克制复用，避免双重声明；BEAR / Latte / CARE 限定为学术评测层（无工业 A/B 声明）"
---

## 3.2.1　本节定位与衔接

§3.1 论证了一个看似激进的判断——双塔加近似最近邻（Approximate Nearest Neighbor, ANN）的传统召回范式已经触及了它自己的极限。表征-索引解耦、检索-排序割裂、表示静态化与训练-推理不一致这三组结构性瓶颈，无法靠"再调一调温度系数"或"再换一个索引库"来根除。§3.1 末段抛出了一个新的提法：把"找到最相关的物品"重新理解为"生成最可能的物品标识序列"。本节的任务，就是把这一提法兑现为一套可以白板推导、可以工程实现、并且已经在多家头部企业落地的技术框架。

具体地，本节回答四个问题：(1) 当我们说"生成"时，指的是把检索改写成什么样的数学问题；(2) 生成式检索（Generative Retrieval, GR）通过自回归解码具体如何"逐步生成"一个物品；(3) 在指数级规模的候选空间中，束搜索（Beam Search）扮演什么角色，又付出了什么代价；(4) 前缀树（Trie）约束解码如何保证生成的标识序列对应"真实存在的物品"，以及它的理论极限在哪里。结合这四问，我们会同时给出 GR 的诞生背景（2022 年 DSI [REF-102] 在文档检索的奠基）与它进入推荐领域的关键迁移（2023 年 TIGER [REF-009]）。具体的 RQ-VAE 与 T5 训练范式将留到 §3.3 详述，本节关注的是"原理"而非"配方"。

在全书结构里，§3.2 是从第 2 章「物品的离散化表示与语义 ID 体系」过渡到第 3 章其余各节的"原理桥"——它要把 §2.2 给出的 SID 词表、§2.6 提及的统一生成范式、与第 3 章后续讨论的 TIGER（§3.3）、训练优化（§3.4）等具体技术串成一条主线。

## 3.2.2　从「匹配」到「生成」：核心范式转换

把传统检索与生成式检索放在同一张白板上，最直观的差异是优化对象。传统范式优化的是相似度，生成式范式优化的是条件概率。设 $u$ 为用户上下文（可以是 ID、特征向量，或交互序列），$\mathcal{I}$ 为物品库，$f_u$ 与 $g_i$ 分别为用户塔与物品塔，传统双塔召回的检索目标可写成：

$$\hat{i} = \arg\max_{i \in \mathcal{I}} \mathrm{sim}\bigl(f_u(u), g_i(i)\bigr) \tag{3.2 已给出}$$

它隐含了一条假设——用户与物品的语义相似度可以被一个标量内积良好近似。生成式检索抛弃了这条假设。它把每个物品 $i$ 用一段长度为 $T$ 的离散标识序列 $s = (s_1, s_2, \dots, s_T)$ 来表示（如第 2 章给出的 Semantic ID, SID），然后把"检索一个物品"等价于"按概率从左到右生成这段序列"。形式化地：

$$p(s \mid u; \Theta) \;=\; \prod_{t=1}^{T} p\bigl(s_t \mid s_{<t}, u; \Theta\bigr) \tag{3.3}$$

$$\hat{s} \;=\; \arg\max_{s \in \mathcal{S}_{\mathrm{valid}}} p(s \mid u; \Theta), \quad \hat{i} \;=\; \mathrm{Lookup}(\hat{s})$$

公式 (3.3) 要怎么读？符号 $s_{<t} = (s_1, \dots, s_{t-1})$ 表示已经生成的前缀，$\Theta$ 是统一的生成式骨干（典型实现是 Transformer Encoder-Decoder）。$\mathcal{S}_{\mathrm{valid}} = \{\mathrm{SID}(i): i \in \mathcal{I}\}$ 是物品库对应的合法 SID 集合，$\mathrm{Lookup}$ 是从 SID 反查物品 ID 的查表操作。该式的物理意义是：**整段物品标识不再被一次性"匹配"出来，而是逐 token 在条件概率链下被"生成"出来**。一旦写成这个形式，三件事就自然解耦：

第一，"索引"消失了——或者更准确地说，**索引就是 $\Theta$ 本身**。物品库的全部信息以参数形式被压缩进生成模型；DSI [REF-102] 论文的原话是 "all information about the corpus is encoded in the parameters of the model"。这与传统范式中"模型决定向量、ANN 决定召回"的分工形成对照。第二，"训练"与"推理"被统一在同一个可微目标上——SFT 阶段最大化 $\log p(s \mid u; \Theta)$，推理阶段做 $\arg\max$，二者使用同一组参数 $\Theta$。第三，"约束"可以原生地写进解码——只需要在每一步把候选集合 $\mathcal{V}$ 限制为某个合法子集 $\mathcal{V}_{\mathrm{valid}}(s_{<t})$，就能把"必须是合法物品"这一硬约束嵌进生成过程，无需后置过滤。

一个有用的类比是：传统检索像在图书馆里**用书名去比对全部书的索引卡**，比对过程依赖卡片的预先组织；生成式检索更像让一位熟读全部馆藏的图书管理员**逐字写下你要的索书号**，他不需要中间的卡片柜——记忆即索引。这个类比也提示了 GR 的两个根本难点：(a) 这位"管理员"必须在训练时记住整个馆藏（容量瓶颈，催生了第 4 章的 Tokenizer 与第 5 章的 LLM 化讨论）；(b) 他写下的索书号必须**真的存在**于馆藏目录里（合法性瓶颈，正是本节 §3.2.5 的 Trie 约束所要解决的）。

## 3.2.3　自回归解码过程：逐 token 地写出一个物品

把公式 (3.3) 落到实际推理流程上，就得到了图 3-2 所展示的"标准 GR 解码管线"。整条流水可拆为三段：编码、解码、约束过滤。

**图 3-2　生成式检索的自回归解码管线**

```
                ┌──────────────────────────────────┐
   用户行为序列 │ u = (i_1, i_2, ..., i_L)         │
                └───────────────────┬──────────────┘
                                    │
                                    ▼ Tokenizer：将每个 i 映射为 SID
                ┌──────────────────────────────────┐
                │ x = (s^{(1)}, s^{(2)}, ..., s^{(L)}) │
                └───────────────────┬──────────────┘
                                    ▼
            ┌───────────────────────────────────────┐
   ① 编码阶段  │  Encoder  ───────► h = Enc(x; Θ)    │
            └───────────────────┬───────────────────┘
                                ▼
                       ┌────────────────┐
            初始 beam   │ B_0 = { (BOS, 0) } │
                       └────────┬───────┘
                                ▼
     ┌─────────── 步骤 t = 1, 2, ..., T ──────────────┐
     │                                                │
     │   ② 解码阶段：    p(s_t | s_{<t}, h; Θ)        │
     │                                                │
     │   ③ 约束过滤：    V_valid(s_{<t}) ⊆ V          │
     │     ↑                                          │
     │     └── Trie 仅放行能延伸为合法物品 SID 的 token │
     │                                                │
     │   ④ 束搜索更新：B_t = Top-B 扩展               │
     │                                                │
     └─────────────────┬──────────────────────────────┘
                       ▼
                ┌─────────────┐
                │ B_T (Top-K SID) │
                └──────┬──────┘
                       ▼ Lookup（SID → 物品 ID 查表）
                ┌─────────────┐
                │ Top-K 物品   │
                └─────────────┘
```

**编码阶段**把用户的行为序列 $u = (i_1, \dots, i_L)$ 先经 Tokenizer 映射为 SID 序列 $x$，再经编码器得到上下文表征 $h$。这一步与传统序列推荐没有本质差异，差异在 Tokenizer——它必须输出一段可被解码器逐 token 复用的离散标识，而不是单个稠密向量。

**解码阶段**是 GR 的核心。解码器以自回归方式生成 SID：在第 $t$ 步，模型给出条件分布 $p(s_t \mid s_{<t}, h; \Theta)$，从中选择候选 token，然后把该 token 加入历史，进入第 $t+1$ 步。这一过程通过教师强迫（teacher forcing）训练、通过自回归推理使用，与机器翻译中的 seq2seq 生成是同构的。

**约束过滤阶段**与解码阶段交织进行：每生成一步，都要把 $p(s_t \mid \cdot)$ 限制在"能延伸为某个合法物品 SID 前缀"的子集 $\mathcal{V}_{\mathrm{valid}}(s_{<t})$ 上。这正是公式 (3.5) 所形式化的内容，详见 §3.2.5。

值得在这里就把一个常见误解拆开：**"自回归"不等于"贪心"**。自回归只是说"第 $t$ 个 token 的分布以前 $t{-}1$ 个 token 为条件"，并未规定如何在每一步从分布中挑选。挑选策略可以是贪心（greedy）、采样（sampling）、或者更工业化的束搜索。在推荐召回场景，因为我们要返回 Top-$K$ 物品而不是单一物品，束搜索几乎是默认选择——这就引出了 §3.2.4。

## 3.2.4　Beam Search：在指数级候选空间中搜索

整数级候选空间是 GR 的"硬币的另一面"。设 SID 长度为 $T$、词表大小为 $V$，则可能的物品 SID 总数高达 $V^T$，对 $V=256, T=4$ 的常见配置就是 $256^4 \approx 4.3 \times 10^9$ 条候选。即便加上 Trie 约束（合法集合大小退化为物品库规模 $|\mathcal{I}|$），也通常在亿级，仍远超单步 softmax 可承受的范围。

**束搜索（Beam Search）** 是在这种状态空间中做近似最大化的标准做法。它在每一步只保留概率最高的 $B$ 条前缀（$B$ 称为 beam width 或 beam size），然后把这 $B$ 条前缀分别向下扩展一个 token，再保留扩展结果中概率最高的 $B$ 条。形式化地：

$$\mathcal{B}_t \;=\; \mathrm{Top}\text{-}B\Bigl\{\,\bigl(s_{<t}\!\oplus\!v,\; \log p(s_{<t} \mid u;\Theta) + \log p(v \mid s_{<t}, u; \Theta)\bigr) \;\Bigm|\; s_{<t}\in \mathcal{B}_{t-1},\; v\in \mathcal{V}_{\mathrm{valid}}(s_{<t}) \,\Bigr\} \tag{3.4}$$

这里 $\oplus$ 表示 token 拼接，$\mathcal{B}_0 = \{(\mathrm{BOS}, 0)\}$ 是初始束。该式的数学意义是：**在每一时刻只对累积对数概率最高的 $B$ 条前缀进行扩展，把整体搜索从指数级 $V^T$ 压成线性级 $B \cdot T \cdot V$**。当 $B = 1$ 时退化为贪心解码；当 $B \to \infty$ 时退化为穷举。

把束搜索放进解码树（decoding tree）的图像里看会更直观——见图 3-3。

**图 3-3　解码树与束搜索的剪枝行为**

```
                              [BOS]
                                │
              ┌─────────────────┼─────────────────┐
   t = 1     v_a              v_b               v_c        ...
            -2.1              -2.3              -2.0
              │                 │                 │
   beam       ✓ keep(B=2)       ✗ pruned          ✓ keep(B=2)
              │                                   │
        ┌─────┼─────┐                       ┌─────┼─────┐
   t = 2 v_a₁  v_a₂  v_a₃               v_c₁  v_c₂  v_c₃    ...
       -3.4  -3.7  -4.1                 -3.5  -3.8  -4.0
        │     │                          │     │
        ✓     ✗                          ✓     ✗   (B=2 全局保留)
        │                                │
        ▼                                ▼
                       ...
                                          ▲
                                          │
                                       ★ 假设这里有一个"正样本"叶节点
                                       但它的祖先节点 v_x 在 t=1 处
                                       因前缀概率不足被剪掉 → 训练-推理不一致
                                       （Beam Search Train-Inference Mismatch）

  关键观察：
   ① 树深度 = SID 长度 T（图 2-2/2-3 已揭示 RQ-VAE 给出多级码本结构）
   ② 每层分支因子 = |V_valid|（受 Trie 约束）
   ③ Beam Search 在每层做 Top-B，未能进入 top-B 的前缀连同其全部子孙被永久丢弃
```

读者只需把图 3-3 中"每一步只保留 Top-$B$ 路径"这一动作看作**贪心地裁剪整棵决策树**，束搜索的两个根本性副作用就清晰了：

第一，**前缀剪枝（prefix pruning）丢失正样本**。如果某个正样本物品的 SID 前缀在第 $t$ 步因概率排名 $> B$ 而被丢弃，那么不论它的剩余 token 在后续步上能拿到多高概率，整条路径都将永远不会被选中。SIGIR 2026 的 BEAR [REF-101] 正是从这一观察切入的。据 [REF-101] abstract 原文，trie-constrained beam search "does not guarantee that such items will be retrieved by beam search even if they possess high overall probabilities"，并明确指出 "beam search can prematurely discard a positive item once its prefix probability is insufficient"——这就是教科书意义上的"训练-推理不一致"：SFT 阶段优化的是 $\log p(s \mid u; \Theta)$ 整体，推理阶段却被一个贪心的、不可微的 Top-$B$ 过滤算子改变了行为。BEAR 的方案是把"正样本每个 token 在每一步必须排进 Top-$B$"作为**松弛后的必要条件**写进训练目标，正文与公式细节将留到 §3.4 展开；据 [REF-101] abstract 原文，BEAR "significantly outperforms strong baselines" 且 "with negligible computational overhead compared to standard SFT"。

第二，**"近视"地优化逐步分布而非整段联合分布**。束搜索使用的是逐步条件分布的逐步乘积来近似 $\arg\max p(s\mid u)$，理论上并不等价于对整段 $s$ 的全局最大化。SIGIR 2025 的 [REF-098] 从更基础的角度说明了这一点——下一节 §3.2.5 一并讨论。

为缓解前缀剪枝问题，2024-2026 年间出现了一类被统称为**前瞻规划（look-ahead planning）**的方案。其代表是 PAG（Planning Ahead in Generative Retrieval），通过在自回归解码之前同步计算一个文档级 look-ahead 先验来引导后续逐步解码。SIGIR 2026 的 Lost in Decoding [REF-105] 复现并压力测试了 PAG 的鲁棒性：据 [REF-105] abstract 原文，作者引入了 plan drift 诊断，发现 "PAG's planning signal is brittle under lexical surface-form variation"——即"意图保持的拼写变体可触发 plan collapse，使 look-ahead bonus 提供的引导效果极其有限"。同时 [REF-105] abstract 原文也确认 PAG 在原始设置下"reproduce the main effectiveness results"——前瞻规划在标准设置下确实有效，只是对查询表面形式的鲁棒性需要工程上的补强（如 [REF-105] 报告的查询翻译策略在跨语言场景给出了最强恢复）。这一发现给后续的 GR 系统设计提了一个朴素提醒：**任何在 token 之上引入"跳跃式"全局信号的机制，都需要专门评估其对查询变体的鲁棒性**。

值得补充一句关于 beam width 的取值经验。在 GR 推荐场景，beam width $B$ 通常取 $2K \sim 4K$（$K$ 为最终需要的 Top-$K$ 物品数）以预留剪枝失败的安全边界；过小则前缀剪枝问题加剧，过大则推理延迟与显存占用线性上涨。BEAR 等工作已经证明，单纯通过加大 $B$ 并不能根除训练-推理不一致——理由很直接：无论 $B$ 多大，"按当前模型在每步 Top-$B$ 内"始终是一个**贪心条件**，而 SFT 损失关心的是**整段联合概率**，二者在数学上根本不等价。这正是 §3.4 要从训练目标侧重新审视 GR 优化的根本动机。

## 3.2.5　约束解码与前缀树：保证生成合法

自回归解码不加约束时，模型有不可忽略的概率生成"不存在的物品 SID"——也就是说生成出的 token 序列在 $\mathcal{S}_{\mathrm{valid}}$ 之外。这在文档检索里早已被广泛讨论；在推荐里它的危害更直接：返回一个不存在的 ID 既无法落回到精排，也无法展示给用户，必须被丢弃。**前缀树约束（Trie-based constrained decoding）** 是工程上的事实标准答案：把全部合法 SID 排入一棵以 token 为分叉的字典树，解码时仅放行那些"能在树上找到延续路径"的 token。

形式化地，给定当前已生成的前缀 $s_{<t} = (s_1, \dots, s_{t-1})$，第 $t$ 步的合法 token 集合为：

$$\mathcal{V}_{\mathrm{valid}}(s_{<t}) \;=\; \bigl\{\, v \in \mathcal{V} \;\big|\; \exists\, i \in \mathcal{I},\;\; \mathrm{SID}(i)_{1:t-1} = s_{<t} \;\wedge\; \mathrm{SID}(i)_{t} = v \,\bigr\} \tag{3.5}$$

公式 (3.5) 的物理意义直白：**只有当 $s_{<t} \oplus v$ 仍是某个真实物品 SID 的合法前缀时，token $v$ 才可被选中**。把它配进公式 (3.4) 的 Top-$B$ 扩展，Trie 约束就自然地嵌进了束搜索循环。这一设计有三个实际收益：(a) 输出空间一定落在 $\mathcal{S}_{\mathrm{valid}}$ 内，不需要任何后置过滤；(b) Trie 早期分支较浅，可显著减少 softmax 计算量；(c) 业务规则（如下架、年龄分级）可以以"修剪 Trie 分支"的形式植入解码本身。

但 Trie 约束并非没有代价。**SIGIR 2025 的 [REF-098]** 从理论上回答了"约束解码究竟好到哪里、差到哪里"。论文从 Bayes-optimal 设定出发——也就是说，假设生成式模型恰好捕捉了所有可能文档的真实相关分布。在这一最理想假设下，作者把"对特定语料施加约束"建模为"加上 corpus-specific constraints"，并得出两个结论：

> 据 [REF-098] abstract 原文，第一个结论是 "we derive a lower bound of the error, in terms of the KL divergence between the ground-truth and the model-predicted step-wise marginal distributions"；第二个结论是 "we reveal that the usage of marginal distributions may not be an ideal approach"。

如何理解？第一条说：即使是一个"完美"的生成模型，被加上 corpus-specific 约束以后，**也会因为模型预测的逐步边际分布与真实分布之间的 KL 散度而出现一个不可消除的误差下界**——这是约束解码的理论"地板"。第二条则提示了一个实践含义：**束搜索使用边际分布做剪枝并不是最优选择**，未来更稳健的算法应当考虑联合分布或非边际化的近似。这两条结论的工程意义是：当工程团队报告"上线 Trie 约束之后召回率下降 1—2 个百分点"时，这并不一定是实现 bug 或 SID 设计问题，而很可能是触碰到了 [REF-098] 给出的理论下界——优化方向应当是改进解码算法而不是拆掉约束。

约束解码的另一面是工程效率。在数十亿物品规模下，把每一步解码都做"在 Trie 上回溯并取所有合法子节点"会成为推理吞吐的瓶颈。Google/YouTube 在 2026 年发布的 STATIC [REF-099] 给出了一个极致工程方案——把整棵 Trie 展平为静态压缩稀疏行（Static Compressed Sparse Row, CSR）矩阵，将不规则的树遍历转为完全向量化的稀疏矩阵运算。STATIC 的具体实现细节、加速比与生产部署证据已在 §3.1.6 详细引用，本节只把它定位为"约束解码工程化的事实标杆"——它证明了公式 (3.5) 不仅在白板上是优雅的形式化，在 TPU/GPU 流水线上也能跑到亚毫秒级的工程稳态。

## 3.2.6　解码树的表达力问题：概率耦合与偏见放大

讲到这里，自回归解码 + Beam Search + Trie 约束三件套构成了 GR 在工程上"够用"的最小骨架。但理论上 GR 还有两个更深的问题——这两个问题在 2026 年才开始被系统性地揭示，决定了未来几年 GR 研究的主轴。

**问题一：解码树本身限制了模型的表达力。** UCSD/Snap 团队 2026 年 5 月发布的 Latte [REF-103] 是首个从理论角度回答这个问题的工作。据 [REF-103] abstract 原文，"token-by-token generation can be viewed as traversing a decoding tree induced by semantic ID tokens, where leaf nodes correspond to candidate items"，且作者观察到 "the item probabilities produced by GR models are strongly correlated with this tree structure: items that are close in the tree tend to receive similar probabilities for any given user, making it difficult to distinguish among them based on user-specific preferences"。换言之，**SID 在树上越近的两个物品，GR 越倾向于给它们相近的条件概率**——这是树结构带来的"几何邻接 → 概率邻接"的强约束。Latte 进一步证明，这种结构相关性 "prevent GR models from representing even simple patterns that can be well captured by conventional collaborative filtering models"。一个直观的反例：协同过滤可以通过共现统计把"完全没有内容相似性的两个物品"识别为高度相关（如雨伞与雨衣），但只要这两个物品在 SID 树上的前缀差异较大，GR 的解码概率就会被树拉开，难以表达这种 CF 模式。

Latte 给出的缓解策略是 **latent token injection**：在每个 SID token 之前注入一个 latent token，把单棵解码树重塑为多棵 latent-token-conditioned 子树，从而 "creates multiple paths with varying tree distances between items, relaxing tree-induced probability coupling"。据 [REF-103] abstract 原文，该方案在 NDCG@10 上取得 "an average of 3.45% relative improvement"。Latte 的意义不在于这一具体的相对增益，而在于它**首次把 SID 词表的几何结构与 GR 的表达力上界直接挂钩**——这给了第 4 章 Tokenizer 设计与第 5 章 LLM-based GR 提供了重要的理论锚点。

**问题二：偏见在 token 步上累积，越生成越偏。** WWW 2026 的 CARE [REF-104] 揭示的是另一种结构性问题——偏见放大（bias amplification）。据 [REF-104] abstract 原文，作者观察到 "token-level bias escalates as token generation progresses"，根因是 GR 在每一步都依赖**同一份编码后的历史表示** $h$（"homogeneous reliance on the encoded history"），导致模型在"细粒度 token"上仍以"粗粒度兴趣信号"为主线，逐步丧失多样性。CARE 的解法是把推理过程级联化：(a) progressive history encoding——利用 SID 的层级结构（粗粒度 token 在前、细粒度 token 在后），早期推理仅注入粗粒度历史 token，后期才逐渐纳入细粒度信息；(b) query-anchored reasoning——为每一步引入可学习的查询向量做并行推理，"under fixed computational budgets" 增加计算密度而不增加自回归步数。CARE 在 TIGER、LETTER、SETRec 三个 GR 骨干上同时报告了准确率与多样性的提升。它的更广泛意义在于：**在 GR 中"推理"不应只发生在编码阶段，解码阶段的每一步都需要相应的推理通道**。这一思路与第 5 章将讨论的 LLM-based GR 中 CoT 推理 + RL 优化（如 LASAR、SAPO）形成了一条共同的技术演进线。

把 Latte 与 CARE 放在一起看，结论是：自回归解码 + Beam Search + Trie 约束这套骨架在 2023 年的 TIGER 上就已经能跑通 SOTA，但**它隐藏的两个理论缺陷——树结构强制概率耦合与解码步偏见累积——只有到 2026 年才开始被显式建模并提出系统性缓解**。这正是 §3.4 「训练目标与解码优化」要展开的主线之一。

## 3.2.7　小结与 §3.3 过渡

把本节四问的答案凝练成一句话：**生成式检索的核心是用一组可微的自回归条件概率把"找物品"重写为"逐 token 写出物品 SID"，再用束搜索做指数空间近似最大化、用前缀树约束保证生成合法**。这三件套共同构成了 GR 的"原理底座"。

为了便于读者横向对比这三大机制，表 3-2 给出了一份核心机制速查表。

**表 3-2　生成式检索三大核心机制对比**

| 机制 | 数学对象 | 作用 | 主要优势 | 理论极限 / 已知问题 | 代表工作（年份）|
|---|---|---|---|---|---|
| 自回归解码 | 公式 (3.3)：条件概率链 $\prod_t p(s_t \mid s_{<t}, u; \Theta)$ | 把"找物品"改写为"逐 token 生成物品标识" | 端到端可微，索引即模型；天然支持冷启动（共享前缀） | 解码树结构导致**相邻 item 概率耦合**，限制 GR 表达力 | DSI（2022）[REF-102]；TIGER（2023）[REF-009]；Latte（2026）[REF-103] |
| 束搜索（Beam Search） | 公式 (3.4)：每步 Top-$B$ 扩展 | 在指数级 SID 候选空间中近似最大化 | 计算量从 $V^T$ 压到 $B \cdot T \cdot V$；天然产出 Top-$K$ | **训练-推理不一致**：正样本前缀概率不足即被永久丢弃；前瞻规划信号在查询变体下脆弱 | BEAR（2026）[REF-101]；Lost in Decoding（2026）[REF-105] |
| 约束解码（Trie / Prefix Tree） | 公式 (3.5)：$\mathcal{V}_{\mathrm{valid}}(s_{<t})$ | 仅放行能延伸为合法物品 SID 的 token | 输出必为合法物品；业务规则可植入解码本身；与 Beam Search 正交叠加 | 存在 **KL 散度误差下界**（即使 Bayes-optimal 模型也不可避免）；边际分布并非最优 | 约束 AR 解码理论（2025）[REF-098]；STATIC（2026）[REF-099] |

表 3-2 同时提示了第 3 章其余各节的位置：§3.3 将以 TIGER 为例把"自回归解码"这一行落到具体的 RQ-VAE × Encoder-Decoder 训练流程；§3.4 将把"束搜索"这一行的局限对应到 BEAR 等训练优化方案；约束解码的工程化已在 §3.1.6 与本节多处引用 STATIC，留待第 4 章再讨论它在大规模物品库上的扩展。

> **本节最新进展（2024—2026）小结。**
> ① **理论层**：[REF-098]（SIGIR 2025）首次给出约束自回归解码的 KL 散度误差下界，把"约束解码也有理论天花板"形式化为可计算的下界；[REF-103] Latte（2026-05）把 SID 解码树的几何结构与 GR 的表达力上界直接挂钩，证明树结构会强制概率耦合从而阻碍 GR 表达简单 CF 模式。
> ② **解码层**：[REF-101] BEAR（SIGIR 2026）通过松弛"正样本每步必须排进 Top-$B$"的必要条件，缓解束搜索带来的训练-推理不一致；[REF-105] Lost in Decoding（SIGIR 2026）复现 PAG 前瞻规划并发现其在词汇表面变体下会出现 plan collapse。
> ③ **解码-推理一体化**：[REF-104] CARE（WWW 2026）把"渐进式历史编码 + 查询锚定并行推理"作为对解码偏见的级联级缓解，把推理从编码阶段延展到了解码每一步。
> ④ **工程层**：[REF-099] STATIC（2026，Google/YouTube）把 Trie 展平为 CSR 稀疏矩阵，使严格约束生成式检索首次以亚毫秒级开销在数十亿用户级别稳定运行。

理解了生成式检索的通用机制——自回归解码、束搜索与前缀树约束的三位一体，我们便可以进入 §3.3，看 TIGER 如何将这套机制在推荐场景中具体实例化：用 RQ-VAE 构建语义 ID 词表，用 Transformer Encoder-Decoder 完成序列生成，在 NeurIPS 2023 上开创了一条新的技术路线。
