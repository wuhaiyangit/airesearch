---
原文件: "LLM Retrieval for Stable and Predictable Ad Recommendations.pdf"
title: "LLM Retrieval for Stable and Predictable Ad Recommendations"
authors: "Vinodh Kumar Sunkara, Satheeshkumar Karuppusamy, Hangjun Xu, Sai Deepika Regani, Kshitij Gupta, Gaby Nahum, Sneha Iyer, Jean-Baptiste Fiot, Yinglong Guo, Xiaowen Guo, Atul Jangra, Yucheng Liu, Jinghao Yan, Vijay Pappu, Benjamin Schulte, Deepak Chandra"
affiliation: "Meta Platforms, Inc."
year: "2026"
venue: "SIGIR Workshop AgentSearch 2026"
category: "生成式召回"
abstract: "Meta提出基于LLM的广告语义召回框架，通过提取广告创意的层次化语义属性获取LLM表示，结合图扩展确保语义变体稳定一致检索，引入稳定性和可预测性评估框架"
tags: ["广告召回", "LLM语义检索", "可预测性"]
Hash: "9e26f682a6889982"
RecRatio: "8"
Team: "Meta"
Reason: "Meta广告系统的LLM召回实践，稳定性/可预测性视角新颖，工业价值高"
精读日期: "2026-05-25"
---

## 1. 摘要与核心贡献

本文由Meta Platforms提出，针对大规模广告推荐系统中一个被长期忽视但极其关键的问题：**系统可预测性（Predictability）**。传统广告推荐系统主要优化预测精度（Recall, NDCG），但随着广告库存的爆发式增长和生成式AI技术的普及，系统对微小输入扰动（广告创意变体）的稳定性变得至关重要。

核心贡献：

1. **新评估框架**：提出量化广告推荐系统稳定性和可预测性的指标体系（StatSigDiff, MAD），填补了行业在可预测性量化方面的空白
2. **LLM语义召回框架**：利用微调LLM提取广告创意的层次化语义属性，构建语义图进行候选扩展，从根本上提升系统语义感知能力
3. **工业验证**：线上A/B测试显示广告性能topline提升0.45%，最终阶段recall提升1.2%，A/A'可预测性差异降低8.62%，日展示差异MAD改善45%

## 2. 业界进展与相关工作

**广告推荐系统架构**：工业界主流采用多阶段级联架构（Covington et al., 2016）：多路候选生成 → 粗排 → 精排。现有候选生成器包括双塔模型、embedding-based和图扩展方法。

**LLM在推荐中的应用**：Kim et al. (2024)将LLM与协同过滤结合；Lyu et al. (2023)通过prompting利用LLM做推荐；Vats et al. (2024)综述了LLM对推荐系统的影响。

**语义ID与稳定性**：Zheng et al. (2025)提出在推荐中使用semantic ID增强embedding表示的稳定性，这是本文可预测性问题在排序阶段的对应工作。

**本文的独特视角**：不同于优化精度的传统路径，本文首次系统性地定义和量化广告系统的可预测性问题，并通过LLM语义召回从源头改善。

## 3. 详细技术方案

### 3.1 可预测性指标定义

**A/A'测试框架**：为每个原始广告（primary ad）创建一个语义相同但ID不同的影子广告（shadow ad）。如果系统是完全语义感知的，两者应获得一致的投放表现。

对于广告对 $(ad_p, ad_s)$，定义统计显著差异：

$$\text{StatSigDiff}(ad_p, ad_s) = \max\left(0, \Delta - 1.65 \cdot \sqrt{\frac{2}{conv(ad_p) + conv(ad_s)}}\right)$$

其中 $\Delta$ 为两广告转化的相对差异，1.65标准差对应90%置信区间。系统级聚合指标：

$$\text{StatSigDiff} = \frac{\sum_{i=1}^{N} \text{StatSigDiff}(ad^p_i, ad^s_i) \cdot \sqrt{rev(ad^p_i) + rev(ad^s_i)}}{\sum_{i=1}^{N} \sqrt{rev(ad^p_i) + rev(ad^s_i)}}$$

低StatSigDiff反映强语义感知能力，高值表明系统依赖非语义特征（如ad ID）。

**MAD指标**：量化A/A'差异在时间维度的波动：

$$MAD = \text{median}(\mid\text{rel. diff. of impression}(day_i) - m\mid)$$

### 3.2 LLM驱动的广告表示学习

利用已在广告互动数据上微调的LLM（基于LLaMA3-8B Instruct），从广告创意（标题、描述等文本）中提取层次化语义属性：

**Stage 1 - 类别与属性生成**：

$$f_1(Ad) \rightarrow S^{text}_{Ad}(C) \rightarrow \{(c_1, s_1), (c_2, s_2), \ldots, (c_n, s_n)\}$$

LLM为每个广告生成多层次类别标签及置信度分数，形成结构化语义表示。

### 3.3 语义图构建与图遍历扩展

基于LLM生成的类别和属性构建广告语义图，通过两步完成候选扩展：

**Step 1 - Retrieval**：基于类别相关性计算广告间初步匹配：

$$S_R(Ad_1, Ad_2) = \sum (S_{Ad_1}(c) \times S_{Ad_2}(c)), \quad c \in C_{Ad_1} \cap C_{Ad_2}$$

**Step 2 - Relevance Scoring**：基于更深维度（品牌、产品、上下文属性）精确评分。两步均使用基于Jaccard相似度的模糊集合匹配：

$$S_R(Ad_1, Ad_2) = \begin{cases} S(P_{Ad_1}, P_{Ad_2}) & \text{if } S(P_{Ad_1}, P_{Ad_2}) \geq \theta \\ S(T_{Ad_1}, T_{Ad_2}) & \text{otherwise} \end{cases}$$

先尝试短语级匹配，不满足阈值则回退到token级匹配。

### 3.4 实时候选检索服务

系统包含四个核心组件：(1) LLM驱动的广告表示学习；(2) 可扩展的LLM处理基础设施（分布式GPU集群）；(3) 语义图遍历算法；(4) 实时候选检索服务层。高吞吐低延迟的服务层确保与下游排序模块兼容。

## 4. 实验设计与结果分析

### 4.1 实验设置

- LLM：开源LLaMA3-8B Instruct，zero-shot推理
- 数据规模：约数千万广告数据点，仅使用文本描述
- 评估方式：线上A/B测试
- Test组：在广告召回阶段引入LLM候选生成器，其余流程不变
- Baseline：双塔、embedding和图扩展等多路候选生成器集成

### 4.2 广告投放性能提升

| Top-K | Recall Alignment Ratio | Incremental Recall Potential |
|-------|----------------------|---------------------------|
| 5 | 0.51X | 1.00Y (baseline) |
| 10 | 0.44X | 1.15Y |
| 50 | 0.21X | 1.62Y |
| 100 | 0.13X | 1.77Y |
| 200 | 0.07X | 1.89Y |

关键发现：
- Recall Alignment Ratio从Top-5的0.51X下降到Top-200的0.07X（7倍浓度差），验证LLM有效优先排列高质量候选
- Incremental Recall Potential从1.0Y增长到1.89Y，证明LLM候选生成器能提供互补多样性推荐
- 线上topline指标统计显著提升**0.45%**
- 最终阶段recall提升**1.2%**

### 4.3 系统可预测性（A/A'）改善

- A/A' StatSigDiff相对降低**8.62%**（test vs control）
- 日展示差异的MAD改善**45%**（如论文Figure 3所示，test组的daily impression relative difference明显更收敛）

### 4.4 核心假设验证

实验验证了核心假设：微调LLM能够更好地检索属于同一语义等价类的广告候选，这些候选在传统方法中会被遗漏。通过语义图扩展，语义变体（如同一产品的不同创意表达）获得一致的检索结果。

## 5. 关键结论与 Takeaway

1. **可预测性是被忽视的关键指标**：传统只关注精度的评估体系不完整，A/A'差异直接影响广告主体验和投放效率
2. **LLM语义表示从根本解决可预测性**：非语义特征（如ad ID）导致语义相同广告获得不同投放，LLM语义表示消除了这种不一致
3. **层次化属性 + 图扩展是有效组合**：LLM生成结构化元数据 → 构建语义图 → 图遍历扩展，形成完整的语义候选生成管线
4. **Zero-shot LLM已够用**：LLaMA3-8B Instruct的zero-shot能力即可支撑有效的广告语义理解
5. **精度与可预测性可以同时提升**：LLM召回不是在精度和稳定性间取舍，而是同时改善两者

## 6. 局限性与开放问题

1. **仅使用文本信息**：当前方案仅利用广告文本描述，未使用图像/视频等多模态信息，而视觉创意是广告的重要组成
2. **离线计算依赖**：LLM元数据生成和图构建均为离线/近线流程，新广告的语义表示获取有延迟
3. **Jaccard相似度的局限**：基于集合匹配的相似度可能无法捕捉深层语义关联
4. **单一LLM依赖**：仅使用LLaMA3-8B，未探索更大模型或多模态模型的效果
5. **可预测性指标的generalization**：StatSigDiff依赖广告转化数据，对低转化广告的度量可能不稳定
6. **Workshop短文限制**：技术细节较少，如LLM微调策略、图更新频率、在线延迟数据等未详细报告

## 7. 应用价值分析

**对广告推荐系统的直接价值**：

1. **可预测性评估框架的通用性**：A/A' shadow testing + StatSigDiff指标可直接应用于任何推荐系统的稳定性评估，不限于广告场景
2. **冷启动改善**：新广告通过LLM语义表示即可与已有广告建立图连接，无需积累交互数据
3. **广告主信任**：可预测性的改善直接提升广告主对投放效果的信心，减少"同一产品不同创意投放结果差异巨大"的困扰

**对通用推荐的启发**：

- 将"系统对输入扰动的鲁棒性"作为评估维度，可以揭示模型过度依赖非语义特征的问题
- LLM生成结构化元数据 → 图构建 → 图遍历的管线是一种通用的LLM集成推荐模式
- 语义等价类的概念可推广到商品推荐（如同款不同色）

**工程实践要点**：
- 分布式GPU集群处理千万级广告的LLM推理
- 图的增量更新策略确保新广告及时获得语义连接
- 与现有多路召回架构的无缝集成（additive而非替代）

## 8. 关键引用与延伸阅读

1. **Covington et al. (2016)** - YouTube深度学习推荐系统，多阶段级联架构的经典工作
2. **Zheng et al. (2025)** - RecSys'25，在推荐中使用Semantic ID增强表示稳定性，与本文排序阶段互补
3. **Naumov et al. (2019)** - DLRM深度学习推荐模型，Meta的基础推荐架构
4. **Kim et al. (2024)** - LLM与协同过滤结合的高效全能推荐系统
5. **Meta LLaMA Team (2024)** - LLaMA 3模型系列
6. **Zhang et al. (2023)** - Recommendation as instruction following
7. **Deldjoo et al. (2024)** - 生成式模型推荐综述

延伸方向：
- 多模态LLM（图文结合）进一步提升广告语义理解
- 实时自适应学习应对快速变化的广告环境
- 端到端语义感知广告推荐系统（覆盖召回→排序→竞价全链路）
- 可预测性指标在其他推荐领域的推广验证
