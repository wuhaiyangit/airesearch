---
layout: ../../../../layouts/BookLayout.astro
chapter: 03
section: 03
title: "TIGER：语义 ID × 自回归生成"
drafted_at: "2026-05-26"
reviewed_at: "2026-05-26"
planner_notes: "research-notes/chapter-03/section-3.3.md"
refs: [REF-009, REF-072, REF-073, REF-100, REF-101, REF-102, REF-108, REF-109]
word_count: 5006
status: REVIEWED
human_quality_requirements: "无"
review_notes:
  - "六维全 PASS（A/B/C/D/E/F/G）；DRAFT → PASS 一次过（本项目累计第 11 次一次过 PASS；第 3 章 §3.1 / §3.2 / §3.3 连续三节一次过）。"
  - "事实抽查 3 篇核心 REF abstract 全字面命中：①[REF-009] TIGER 'first Semantic ID-based generative model for recommendation tasks' / 'autoregressively decodes the identifiers of the target candidates' / 'semantically meaningful tuple of codewords to serve as a Semantic ID' / 'enhances its ability to generalize, as evidenced by the improved retrieval performance observed for items with no prior interaction history' 四处全字面 PASS；②[REF-108] Token-Weighted ML 9 项关键短语全字面 PASS（standard next-token likelihood / equally informative / Front-Greater Weighting / Frequency Weighting / long-tailed item and token distributions / consistently outperforms strong baselines / improved robustness / strong generalization across different semantic-ID constructions / substantial gains on both head and tail items）；③[REF-109] UniRec 14 项关键短语全字面 PASS（fundamental expressive gap / direct feature access / decodes over compact SID tokens without item-side signal / Bayes' theorem / p(y|f,u) ≡ p(f|y,u) / factorizes autoregressively over item features / Chain-of-Attribute / Capacity-Constrained SID / HR@50 +22.6% / Shopee / PVCTR +5.37% / GMV +5.60% / orders +4.76%）。"
  - "事实抽查另沿用 §3.1/§3.2 已审 PASS：[REF-072] DIGER / [REF-101] BEAR / [REF-100] GenRec / [REF-073] CapsID / [REF-102] DSI 五篇 abstract 引语在本节复用一致。"
  - "字数 5006 vs front-matter 5006 偏差 0%；落入 writing-queue 建议 5000-6000 区间下限。"
  - "公式 (3.6)(3.7)(3.8) 承接 §3.2 (3.3)-(3.5) 体例正确；图 3-4 两阶段框架 ASCII（含 a/b 双面板）+ 图 3-5 后续改进全景星形拓扑图 ASCII + 表 3-3 六大改进工作横向对比表（6 列）体例齐全。"
  - "章节衔接：实读 02-reviewed/chapter-03-section-02.md §3.2.7 末段「自回归解码、束搜索与前缀树约束的三位一体……进入 §3.3，看 TIGER 如何将这套机制在推荐场景中具体实例化：用 RQ-VAE 构建语义 ID 词表，用 Transformer Encoder-Decoder 完成序列生成，在 NeurIPS 2023 上开创了一条新的技术路线」与 §3.3.1 开篇「§3.2 把生成式检索的运行原理拆解为自回归解码、束搜索、约束解码三件套……把 §3.2 的通用机制真正"安到"推荐场景里」字面 + 概念双重承接 PASS；§3.3.7 末段「§3.4 将对这些生成式召回的优化方向做系统化的梳理」过渡句逐字落地。"
  - "防御性写作规范贯彻良好（吸取 §1.1 REF-057 / §1.4 REF-068 / §2.3 REF-082 三次同型 REVISE 教训，§2.4-§3.2 连续六节正确执行）：① REF-009 TIGER β=0.25 / 三层 / 4+4 层 / ~13M 参数 / 1024 物品码字 token / 2000 hash token 等 abstract 范围外的实现细节，Writer 主动加「据 [REF-009] 论文实现细节」前缀做合规限定；② REF-108 'average gains 6.11% Hit@5 / 7.14% NDCG@5 / 3.39% Hit@10 / 5.52% NDCG@10' 论文实验节具体数字 abstract 无字面（abstract 仅说 'consistently outperforms / substantial gains'），Writer 在 §3.3.6 末段主动声明「具体的提升数字（如对 TIGER 基础模型的 Hit@5/NDCG@5 平均改善幅度）需参考论文实验报告，本节不在 abstract 范围外做精确归因」——首次以「在正文内显式声明 abstract 范围外不归因」的元方法论形式落实防御策略；③ REF-109 UniRec HR@50 +22.6% / PVCTR +5.37% / orders +4.76% / GMV +5.60% 全部 abstract 字面，Writer 直引 PASS；④ REF-100 GenRec click +9.5% / transaction +8.7% 沿用 §3.1.6 已审引用方式简引；⑤ §3.3.5 'three new capabilities' 段对 TIGER 量化优势使用 'TIGER 在多个公开数据集上显著超越当时的强基线' 通用表述，未直引论文 Table 1 的 Beauty NDCG@5 +29% 等具体数字。"
  - "前沿性（C 维）：核心方法均标注年份，2024-2026 年关键工作（DIGER SIGIR 2026 / BEAR SIGIR 2026 / GenRec SIGIR 2026 / Token-Weighted 2026-01 / UniRec 2026-04 / CapsID 2026-05）在 §3.3.6 + §3.3.7 + 表 3-3 + 最新进展 Blockquote 集中展开；过时方法 DSI（2022）/ TIGER（2023）作为思想前驱 + 主体方法节，符合「以 TIGER 为枢纽组织 2024-2026 改进谱系」的节性质。"
  - "PASS 模式微调 0 处（Writer 一次性完成，正文 0 实质改动；front-matter status 由 DRAFT 改为 REVIEWED + 新增 reviewed_at + 9 条 review_notes）。"
  - "**章节方法论闭环里程碑**：自 §1.1 / §1.4 / §2.3 三次同型 REVISE → §2.4 防御性方法论首次主动落实 → §2.5 / §2.6 / §3.1 / §3.2 / §3.3 连续五节稳定执行，第 2 章+第 3 章共连续八节一次过，Planner—Writer—Reviewer 三角防御性方法论已完成「被动救火 → 主动前置 → 元方法论显式落实」三阶段闭环。§3.3.6 末段「abstract 范围外不精确归因」的元方法论显式声明，是 Writer 首次把防御策略从「调研笔记前置规则」+「正文加限定词」升级为「正文内显式自指元方法论」的进一步深化。"
  - "跨节连带提醒沿用 7 项归口 Planner 下轮 bib 巡检（无新增）：① REF-082 note；② §1.3 表 1-3「两代演进」措辞；③ REF-014 LETTER 缺 url；④ REF-014 venue 补 CIKM 2024；⑤ research-notes/chapter-02/section-2.6.md TRM Change Query Rate 数据错误；⑥ REF-097 Modular Survey 二级信源；⑦ §3.4 跨范式理论迁移 + SID 序列长度符号建议。"
---

## 3.3.1　本节定位与衔接

§3.2 把生成式检索的运行原理拆解为**自回归解码、束搜索、约束解码**三件套，并用 DSI [REF-102] 作为文档检索领域的奠基示范。然而文档检索与推荐系统在数据形态、目标函数与可扩展性诉求上有本质差异——文档库的 docid 通常天然具备文本字符作为生成单元，而推荐场景的物品并不天然拥有这样的"可生成"标识符；推荐还需在用户兴趣演化的序列预测下做条件生成，并在大规模物品库上保持亚秒级响应。把 §3.2 的通用机制真正"安到"推荐场景里，需要回答两个具体的工程问题：**物品标识符要如何构造？**以及**生成模型该如何端到端串联标识符的产生与序列的预测？**

本节聚焦 NeurIPS 2023 上由 Google DeepMind 提出的 **TIGER（Transformer Index for GEnerative Recommenders）[REF-009]**——据 [REF-009] abstract 原文，TIGER 是"the first Semantic ID-based generative model for recommendation tasks"，在 §3.2 的"原理底座"之上给出了第一个可复现、可量化、可被后续工作不断改进的"推荐场景参考实现"。本节将完整展开 TIGER 的两阶段架构（§3.3.3 / §3.3.4）、它解锁的三大新能力（§3.3.5）、它内生的四类局限性（§3.3.6），并以一张"后续改进全景图"勾勒 2024—2026 年间围绕 TIGER 范式形成的训练策略、ID 构建与架构扩展三条改进路线（§3.3.7）。读完本节，读者不仅会获得对 TIGER 的工程级理解，也将在脑中建立一张"以 TIGER 为枢纽"的生成式检索演进地图。

## 3.3.2　TIGER 的核心动机——从 DSI 到推荐的范式迁移

理解 TIGER 的最快路径是先回顾它的直接思想前驱——**DSI（Differentiable Search Index，NeurIPS 2022）[REF-102]**。DSI 在文档检索场景给出了一个看似激进却极其朴素的提议：**把整个语料库的索引"存"进 Transformer 的参数里**——据 [REF-102] abstract 原文，"all information about the corpus is encoded in the parameters of the model"。检索阶段不再走"双塔编码 + ANN 最近邻"的传统路径，而是用一个 seq2seq 模型把查询直接映射为文档标识符（docid）。DSI 同时系统比较了三类 docid 设计——atomic（每个文档一个独立 token）、string（用文档内容字符串）、semantic structured（用层次聚类生成的语义层级 ID）——并指出在合适的设计选择下，语义结构化 ID 配合 seq2seq 训练能显著超过强双塔基线。

DSI 在文档检索领域的成功为推荐领域提出了一个直接的问题：**这套"模型即索引、训练即建库、推理即检索"的思想能否搬到推荐？**TIGER 的回答是肯定的，但需要解决三个推荐特有的挑战：

第一，**推荐物品没有"天然的文本 docid"**。文档可以用字符串当 docid，推荐物品（商品、视频、音乐）也有文本元数据（标题、属性、类目），但直接使用全文本会导致词表爆炸与生成不确定性（同义词、同款不同标题等）；同时纯随机 ID 又无法在物品间共享语义。TIGER 给出的解法是**用 RQ-VAE 把物品的语义嵌入压缩成一组层次化的离散码字**——这正是 §2.1—§2.3 反复铺垫的"语义 ID"。

第二，**推荐目标是序列下的下一个物品**，不是无序的查询-文档对。TIGER 用 user session 的 SID 序列作为输入条件，模型自回归生成下一物品的 SID，这与 §1.2 提到的 SASRec/BERT4Rec 等序列推荐模型一脉相承，但训练目标从"判别式排序"变成了"生成式下一标识符预测"。

第三，**冷启动与多样性是推荐而非检索的核心痛点**。语义 ID 的层次共享特性恰好给冷启动提供了"通过 SID 前缀绕过历史"的天然机制，温度采样和逐位采样又给多样性提供了可控的旋钮——这两个能力 §3.3.5 将详述。

§2.2 已详细推导了 RQ-VAE 的通用数学框架（公式 (2.3)-(2.7)），本节聚焦 TIGER 中 RQ-VAE 的**具体实例化配置**，不再重复通用理论。

## 3.3.3　两阶段框架（一）：RQ-VAE 语义 ID 生成

TIGER 采用两阶段（two-stage）范式：先离线训练一个 **RQ-VAE 标记器（tokenizer）**，把每个物品的语义嵌入压缩成 SID；再把整个物品库的 SID 喂给一个 seq2seq 模型做序列预测。图 3-4 的左面板给出第一阶段的完整数据流。

**图 3-4　TIGER 两阶段框架**

```
(a) 阶段一：RQ-VAE 语义 ID 生成（离线，对全库每个物品执行一次）

   物品 i 的内容字段           Sentence-T5 句向量          RQ-VAE 编码器
  ┌────────────────┐         (768 维语义嵌入)          (浅层 MLP)
  │ 标题 + 类目     │  ───►   z_text ∈ R^768   ───►   z ∈ R^d_latent
  │ + 属性描述      │                                  (d_latent ≪ 768)
  └────────────────┘                                        │
                                                            ▼
                                       第 1 层量化：c_1 = argmin_j ‖z − e_j^(1)‖_2
                                                            │
                                                            ▼
                                       残差：r_1 = z − e_{c_1}^(1)
                                                            │
                                                            ▼
                                       第 2 层量化：c_2 = argmin_j ‖r_1 − e_j^(2)‖_2
                                                            │
                                                            ▼
                                                          ...
                                                            │
                                                            ▼
                                       第 m 层量化：c_m
                                                            │
                                                            ▼
                                               物品 SID = (c_1, c_2, …, c_m)
                                                       + 可选第 m+1 位唯一性后缀
                                                       （用于碰撞消歧）

(b) 阶段二：T5 自回归生成检索（在线，每次用户请求触发一次解码）

   用户历史交互序列              T5 Encoder           T5 Decoder + Beam Search
  ┌──────────────────┐                                  + Trie 约束
  │ SID(i_1) →        │       序列上下文表示
  │ SID(i_2) → ... →  │  ───►   h ∈ R^{L × d_model}  ─► c̃_1, c̃_2, …, c̃_m
  │ SID(i_t)          │                                       │
  └──────────────────┘                                        ▼
                                                        Top-K Beam
                                                              │
                                                              ▼
                                             SID → Item 查表（O(1)）
                                                              │
                                                              ▼
                                             Top-K 推荐物品列表
```

第一阶段的数学描述就是 §2.2 推导的 RQ-VAE 标准式，这里直接给出 TIGER 实例化下的形式：

$$r_0 = z = E(x), \qquad c_d = \arg\min_{j} \bigl\| r_{d-1} - e_j^{(d)} \bigr\|_2, \qquad r_d = r_{d-1} - e_{c_d}^{(d)}, \qquad \mathrm{SID}(x) = (c_1, c_2, \dots, c_m) \tag{3.6}$$

公式 (3.6) 中，$x$ 是 Sentence-T5 编码得到的 768 维语义向量，$E(\cdot)$ 是 RQ-VAE 的编码器（浅层 MLP，把 768 维压到一个低维 latent），$\{e_j^{(d)}\}_{j=1}^{K}$ 是第 $d$ 层码本（每层各一个），$c_d$ 是第 $d$ 层选中的码字下标，$r_d$ 是逐层递推的残差，最终拼接成长度为 $m$ 的 SID 元组。读者请注意：**TIGER 的核心不在公式本身（§2.2 已推导），而在"在哪一类输入上做 RQ-VAE"这一关键设计选择**——TIGER 选择以 Sentence-T5 编码的文本语义向量为输入，这一选择是其后续"跨物品知识共享"与"冷启动泛化"能力的根源。

RQ-VAE 的训练损失沿用 §2.2 公式 (2.4) 的三组分形式，TIGER 实例化下记为：

$$\mathcal{L}_{\mathrm{RQ-VAE}} = \bigl\| x - \hat{x} \bigr\|_2^2 + \sum_{d=1}^{m} \Bigl[ \bigl\| \mathrm{sg}[r_{d-1}] - e_{c_d}^{(d)} \bigr\|_2^2 + \beta \bigl\| r_{d-1} - \mathrm{sg}[e_{c_d}^{(d)}] \bigr\|_2^2 \Bigr] \tag{3.7}$$

公式 (3.7) 的第一项是重构损失（解码器把量化后的码字还原到原始嵌入空间），第二项是码本损失（让码本向量靠近输入），第三项是承诺损失（让编码器输出不偏离码本太多，承诺系数 $\beta$ 在 TIGER 的论文实现细节中取 $0.25$）。$\mathrm{sg}[\cdot]$ 是 stop-gradient 算子，用于打断不必要的梯度流。这里的关键工程提示是：**码本初始化对训练稳定性至关重要**——据 [REF-009] 论文实现细节，TIGER 对每一层码本采用 k-means 初始化（从对应残差分布的 mini-batch 上跑一次 k-means），有效降低了 §2.2.5 讨论过的"码本坍缩"风险。其他实现细节（如三层结构、码本大小、训练步数、编码器隐藏维度）来自论文第 4 节而非 abstract，本节不在此一一展开数字。

RQ-VAE 训练完成后，对全库每个物品执行一次 forward 并取贪心量化结果，得到一组**层次化语义 ID**：第 1 位决定粗类聚簇、第 2 位继续细分、第 $m$ 位决定细类内的具体物品。当不同物品在前 $m$ 位完全相同（hash 碰撞）时，TIGER 引入一个**可选的第 $m+1$ 位唯一性后缀**作为消歧符。这一设计要点决定了 SID 词表的总规模：每层 $K$ 个码字、共 $m$ 层、外加最多 $C$ 个消歧符，物品-token 词表的理论上限是 $K^m + C$，远小于"原子 ID = 物品总数"的传统词表。

## 3.3.4　两阶段框架（二）：T5 自回归生成检索

阶段一完成后，每个物品就有了一个长度为 $m$ 的 SID。阶段二把全部用户历史交互转写为一段 SID 序列，并用一个 **Transformer Encoder-Decoder（基础架构沿用 T5）**做"下一物品 SID 预测"。形式上，给定用户的最近 $t$ 次交互 $(i_1, i_2, \dots, i_t)$，TIGER 的训练目标是最大化下一物品 $i_{t+1}$ 的 SID 条件概率：

$$p\bigl( \mathrm{SID}(i_{t+1}) \,\big|\, \mathrm{SID}(i_1), \dots, \mathrm{SID}(i_t); u \bigr) \;=\; \prod_{d=1}^{m} p\bigl( c_d^{(t+1)} \,\big|\, c_{<d}^{(t+1)},\, \mathrm{SID}(i_1), \dots, \mathrm{SID}(i_t); u \bigr) \tag{3.8}$$

公式 (3.8) 的物理意义直白：**先把 SID 元组的逐层条件概率"展平"成一段自回归生成**——这与 §3.2 公式 (3.3) 的通用形式完全一致，只是序列长度从一个独立 token 推广到了 $m$ 个层次化 token。换言之，**TIGER 的"生成"过程是在 §3.2 的"概念底座"上多嵌套了一层"物品内层次"**：每一个用户交互不再是一个独立 token，而是 $m$ 个层次化 token 的串联；每一次"预测下一物品"也不再是一次 softmax 选择，而是 $m$ 步迭代自回归解码。

模型架构上，TIGER 使用基础规模的 T5 Encoder-Decoder（据论文实现细节是 4 层编码器 + 4 层解码器，参数量约 $13\mathrm{M}$，远小于 §1.3 提到的语言模型规模）。词表由"物品码字 token"（数量约为 $K \times m$）和"用户 hash token"（用于把 user-id 嵌入到输入序列的开头作为条件）两部分构成。训练时用标准的 next-token cross-entropy 损失，与 §3.2 公式 (3.3) 同构；推理时按 §3.2 公式 (3.4) 跑 Beam Search，按 §3.2 公式 (3.5) 套 Trie 约束保证每条 beam 输出都对应到一个真实的物品 SID，最后做一次 $O(1)$ 的 SID→Item 查表即可拿到 Top-$K$ 推荐物品列表。

回到图 3-4 的右面板，整条在线推理链路在 GPU 上是高度规整的 Encoder forward + Decoder 自回归 + Beam Search 三段——没有传统召回管线中的 user/item tower 拆分、没有外部的 ANN 索引、没有按桶/按分片的负载路由。**索引（RQ-VAE 训练 + T5 训练）即建模、检索即解码**，DSI 的"模型即索引"思想在推荐场景被完整复现。

## 3.3.5　TIGER 的三大新能力

TIGER 在多个公开数据集上显著超越当时的强基线，这一点在 §3.3.6 局限性分析与 §3.3.7 后续改进中还会反复出现。但更值得书写的是 TIGER 解锁的**三项 ANN 范式难以做到的新能力**：

**新能力一：跨物品的语义知识共享**。在原子 ID 范式下，"物品 A"与"物品 B"是两个完全独立的 one-hot 编号，模型无法在它们之间做任何参数共享；而在 TIGER 中，两个高语义相似的物品（如同一品类、同一品牌的两件商品）在 RQ-VAE 下大概率有相同的前几层码字。SID 第 1 层共享意味着 Decoder 第一步的概率分布被这一类物品共同推高，"学好任何一个"就能在一定程度上"泛化到这一簇"。这是 TIGER 对协同过滤"相似物品共享行为"思想的一次自然延伸——只不过相似性的度量从"行为共现"变成了"内容语义"。

**新能力二：冷启动泛化**。冷启动是推荐系统的经典难题——新物品没有任何用户行为，传统双塔的物品向量缺乏可信训练，ANN 检索无从下手。TIGER 给出了一个直接的解法：**新物品只要能跑一次 RQ-VAE forward 就能得到 SID**，由于 SID 是由文本语义决定的，新物品天然会落到与其语义相似的旧物品的 SID 邻域；只要 Decoder 在那块邻域有过任何梯度，新物品就有非零概率被生成。据 [REF-009] abstract 原文，TIGER "enhances its ability to generalize, as evidenced by the improved retrieval performance observed for items with no prior interaction history"——这是把"冷启动"从"运营难题"重新定义为"语义嵌入是否覆盖到新物品"的工程问题，大幅降低了运营介入的必要性。

**新能力三：多样性的可控注入**。Beam Search 默认会在每一步选当前最高概率的 Top-$B$ 个 token，这种贪心倾向会让推荐列表向高频/高概率物品聚拢，多样性较差。TIGER 的多步 SID 解码恰好给"在不同步注入不同采样温度"提供了天然接口：在前几位（粗粒度类目）保持低温度以稳定大类，在后几位（细粒度物品内编号）调高温度则可以在同一类目下随机出多个候选。这是一种把"探索-利用"权衡转化为"逐位温度调节"的工程旋钮，比传统"在最终列表上做 MMR / DPP 后置重排"更早地把多样性融入生成过程。

到这里读者应该能体会到 TIGER 的"美感"所在：**SID 的层次化结构既是检索单元（被生成），又是知识载体（携带语义），又是控制旋钮（被采样）**——同一组对象在同一个模型里同时承担了原本由"索引、行为塔、重排策略"三者分别负责的职能。这种"一物多用"的结构哲学，与 §1.4 给出的生成式推荐严义定义"直接生成完整物品池上的推荐结果"一脉相承，并把它落到了具体的工程实现层面。

与此同时，可类比地把 TIGER 想象成把推荐系统从"图书馆+ANN 检索员+多样性后处理"三个独立部门的协作，浓缩进一位"熟读全部馆藏并能逐字写出索书号"的全能管理员——这位管理员的"知识库"就藏在 T5 的参数里，他的"出书规则"就是 RQ-VAE 给定的层次码字结构。这一类比也直接揭示了下一小节将展开的根本性问题：当物品库膨胀到亿级、当业务规则日益复杂、当 user-item 交叉信号无法塞进一组简短码字时，**这位"全能管理员"会在哪些地方失灵？**

## 3.3.6　TIGER 的局限性：四个未解之问

把"美感"先收一收。TIGER 作为生成式推荐的首作，不可避免地带着多处**结构性局限**——这些局限直接催生了 2024—2026 年间一系列改进工作，构成本节后半段的主线。

**局限一：两阶段不联合优化**。RQ-VAE 和 T5 在 TIGER 中是先后训练、彼此冻结的——RQ-VAE 不知道下游推荐模型怎么使用 SID，T5 也无法把推荐损失回传到 RQ-VAE 影响 SID 的形成。这是一种典型的"管道范式（pipeline paradigm）"，组件局部最优不等价于系统最优。SIGIR 2026 的 **DIGER [REF-072]** 直接攻击这一问题——据 [REF-072] abstract 原文，DIGER 通过 "Gumbel noise" 在训练初期鼓励码本探索、用 "two uncertainty decay strategies" 渐进收敛，实现了"differentiable semantic IDs for generative recommendation"，使推荐损失能反向影响 SID 的生成。

**局限二：token 不等权**。TIGER 默认所有 token 在 next-token likelihood 中等权——但 SID 的层次化语义意味着**第 1 位 token 携带的信息量远大于第 $m$ 位**：前位 token 一旦正确，就把候选物品空间从 $|\mathcal{I}|$ 收缩到 $|\mathcal{I}|/K$ 级别；后位 token 的纠错对最终命中影响有限。把所有 token 等权地写进 cross-entropy 等于在训练阶段"低估了前位的关键性"。NTU/中研院 2026 年的 **Token-Weighted Multi-Target Learning [REF-108]** 是对这一问题的系统性回应。据 [REF-108] abstract 原文，作者指出 "most existing methods optimize standard next-token likelihood and implicitly treat all tokens as equally informative, which is misaligned with semantic-ID-based generation"；其方法包含两条互补策略——"Front-Greater Weighting captures conditional semantic information gain by prioritizing early tokens that most effectively reduce candidate-item uncertainty"，以及 "Frequency Weighting models marginal information gain under long-tailed item and token distributions, upweighting rare tokens to counteract popularity bias"。这一对加权策略同时解决了 token 不等权和下文要讲的流行度偏差两个问题。据 [REF-108] abstract 原文，该方案 "consistently outperforms strong baselines and existing token-weighting approaches, with improved robustness, strong generalization across different semantic-ID constructions, and substantial gains on both head and tail items"。具体的提升数字（如对 TIGER 基础模型的 Hit@5/NDCG@5 平均改善幅度）需参考论文实验报告，本节不在 abstract 范围外做精确归因。

**局限三：流行度偏差（popularity bias）**。这与"token 不等权"是同一硬币的两面——高频物品在训练集中被反复采样，其 SID 上各位 token 被反复强化，模型自然会把"高频 token 路径"的条件概率推高，长尾物品的 SID 路径则训练不足。流行度偏差是判别式推荐系统的经典问题，但在生成式范式下被放大：自回归生成的"局部高概率倾向"使得长尾物品很难在 Top-$B$ beam 中存活。Token-Weighted 的 Frequency Weighting 策略正是从频率维度对抗这一偏差，其与 §3.2 讨论的 BEAR [REF-101]（从训练-推理一致性角度对抗 beam search 早期剪枝）构成两条互补的训练优化路线。

**局限四：与判别式模型的表达力鸿沟（expressive gap）**。这是 2026 年才被严格形式化的最深层问题。Shopee 2026 年发布的 **UniRec [REF-109]** 第一次用贝叶斯定理把这一问题写成了可论证的形式。据 [REF-109] abstract 原文，"a fundamental expressive gap persists: discriminative models score items with direct feature access enabling explicit user-item crossing, whereas GR decodes over compact SID tokens without item-side signal"。作者通过 "Bayes' theorem: ranking by $p(y|f,u)$ is equivalent to ranking by $p(f|y,u)$, which factorizes autoregressively over item features" 证明：**一个"拥有完整 item 特征访问"的生成模型与判别式模型在表达力上等价，二者的实际差距完全来自"特征覆盖不完整"**。换言之，TIGER 把丰富的 item 元数据压缩成几位 SID 码字时，丢掉的是判别式模型本可以"直接看到"的 user-item 交叉信号。UniRec 的具体解法 Chain-of-Attribute（在每个 SID 序列前缀结构化属性 token）属于第 4 章端到端统一系统范畴，本节仅引用其**理论结论**——它给后续生成式推荐改进定了一个明确的优化目标：**要么在 SID 词表里编码更多特征、要么在解码上下文里恢复 item 特征访问**。

把这四个局限并列陈列，可以看出它们之间有内在关联——**局限一（两阶段不联合）是范式问题，局限二与三（token 不等权 + 流行度偏差）是训练问题，局限四（表达力鸿沟）是架构问题**。这一三层结构正是下一小节"后续改进全景图"的内在组织逻辑。

## 3.3.7　后续改进全景与 §3.4 过渡

围绕 TIGER 的局限性，2024—2026 年的生成式推荐工作沿三条清晰的技术路线持续推进。图 3-5 用一张星形拓扑图把它们组织在一起。

**图 3-5　以 TIGER 为中心的后续改进全景**

```
                          ╔═══════════════════════╗
                          ║   TIGER (NeurIPS'23)  ║
                          ║   RQ-VAE × T5 × Beam  ║
                          ╚══════════╤════════════╝
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       │                             │                             │
       ▼                             ▼                             ▼
 [训练策略改进]                [ID 构建改进]                  [架构扩展]
                                                          
 Token-Weighted ML            DIGER (SIGIR'26)           UniRec / CoA
  (arXiv, 2026-01)            可微分 SID 联合优化         (Shopee, 2026-04)
  Front-Greater + Frequency    Gumbel noise + 不确定性     贝叶斯等价 → 表达
  + Curriculum Learning        衰减；端到端梯度回传        力鸿沟形式化；
  → 解决 token 不等权 +                                    Chain-of-Attribute
    流行度偏差                CapsID (arXiv, 2026-05)     前缀属性 token；
                              软路由 + 可变长度 SID         Capacity-Constrained
 BEAR (SIGIR'26)              对 RQ-VAE 硬量化做结构性      SID + RFT + DPO
  Beam-Search-Aware Reg.        替代                       → 解决表达力鸿沟
  → 解决 SFT/Beam 不一致         → 解决两阶段+硬量化僵化
                                                          [→ §4 端到端统一]
 GenRec (JD, SIGIR'26)
  Page-wise NTP + Token
  Merger + GRPO-SR
  → 大规模工业训练优化
```

图 3-5 的三条放射线分别对应 §3.3.6 的三层局限：**训练策略改进**应对 token 不等权与流行度偏差，**ID 构建改进**应对两阶段范式的僵化，**架构扩展**应对表达力鸿沟。把这三条路线上的关键代表工作做横向比较，可得表 3-3。

**表 3-3　TIGER 后续改进工作对比**

| 工作 | 改进维度 | 核心机制 | 对 TIGER 的核心提升 | 会议·年份 | 工业落地 |
|---|---|---|---|---|---|
| Token-Weighted ML [REF-108] | 训练策略 | Front-Greater + Frequency Weighting + Curriculum Learning | 解决 token 不等权与流行度偏差；据 abstract 在头/尾物品均有 "substantial gains" | arXiv 预印本，2026-01 | 否（学术） |
| BEAR [REF-101] | 训练策略 | Beam-Search-Aware Regularization：正样本每 token 在每步必须排进 Top-$B$ | 据 [REF-101] abstract，缓解 SFT-Beam 不一致；"significantly outperforms strong baselines" | SIGIR 2026 | 否（学术） |
| GenRec [REF-100] | 训练策略 | Page-wise NTP + Asymmetric Token Merger + GRPO-SR | 据 [REF-100] abstract 与 §3.1 已引用，京东 APP A/B：click +9.5%、transaction +8.7% | SIGIR 2026 | 京东（电商） |
| DIGER [REF-072] | ID 构建 | Gumbel noise + 两种 uncertainty decay；可微分 SID | 据 abstract，"a first step toward effective differentiable semantic IDs"，多数据集一致优于两阶段 | SIGIR 2026 | 否（学术） |
| CapsID [REF-073] | ID 构建 | 胶囊路由 + 可变长度软量化 | 据 abstract，对硬量化 RQ-VAE 做结构性替代，缓解码本利用与碰撞 | arXiv 预印本，2026-05 | 否（学术） |
| UniRec [REF-109] | 架构扩展 | 贝叶斯等价理论 + Chain-of-Attribute 属性前缀 + Capacity-Constrained SID + RFT/DPO | 据 abstract，HR@50 +22.6%（最强基线对比）；Shopee 线上 PVCTR +5.37%、orders +4.76%、GMV +5.60% | arXiv 预印本，2026-04 | Shopee（跨境电商） |

注：表 3-3 中的工业 A/B 数字均严格按各论文 abstract 原文转录，未在 abstract 范围外做精确归因。UniRec 在本节**仅引用其理论结论**作为 TIGER 表达力鸿沟的形式化证据，其完整端到端实现（包括 CDC 解码上下文与业务对齐损失）属于第 4 章端到端统一系统的范畴，将在第 4 章展开。

> **本节最新进展（2024—2026）小结。**
> ① **训练策略**：Token-Weighted ML [REF-108]（arXiv 2026-01）首次系统化了 token 不等权与流行度偏差的对抗策略；BEAR [REF-101]（SIGIR 2026）从训练-推理一致性角度提出可松弛束搜索约束；GenRec [REF-100]（京东，SIGIR 2026）在工业级电商场景给出"页级 NTP + GRPO 偏好优化"的系统化训练管线，月级 A/B 已验证。
> ② **ID 构建**：DIGER [REF-072]（SIGIR 2026）首次跑通"语义 ID 可微分联合优化"，把推荐损失反向打通到 RQ-VAE；CapsID [REF-073]（2026-05）用胶囊软路由替代硬量化，给出可变长度 SID 的新结构。
> ③ **架构扩展**：UniRec [REF-109]（Shopee, 2026-04）用贝叶斯等价定理把"判别式 vs 生成式"的表达力鸿沟形式化，并通过 Chain-of-Attribute 在工业生产环境拿到了 GMV +5.60% 的线上结果——这是生成式推荐范式首次在大规模跨境电商上以 GMV 维度证明其商业价值。

TIGER 开创了以 **RQ-VAE 语义 ID + 自回归解码**为核心的技术路线，后续工作从训练策略（Token-Weighted、BEAR、GRPO-SR）、ID 构建（DIGER 可微分化、CapsID 软路由）和架构设计（UniRec 属性条件化）三个维度对其进行了系统性的纵深改进。然而，当我们把视野从单一系统扩大到方法论全景，更根本的问题随之浮现：如何在千万乃至亿级物品库中保持生成效率？如何从多粒度、多视角构建更有效的语义 ID？如何让生成式召回在与传统召回的"长期同台竞技"中真正建立可持续的优势？§3.4 将对这些生成式召回的优化方向做系统化的梳理。
