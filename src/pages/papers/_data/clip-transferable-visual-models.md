---
title: "Learning Transferable Visual Models from Natural Language Supervision (CLIP)"
slug: "clip-transferable-visual-models"
authors: "Alec Radford, Jong Wook Kim, et al. (OpenAI)"
year: 2021
venue: "ICML 2021"
category: "多模态"
abstract: "CLIP 通过对比学习在 4 亿图文对上预训练，让视觉模型直接理解自然语言。开创了视觉-语言联合表示的新范式，是后续 DALL·E、Stable Diffusion、LLaVA 等多模态模型的基石。"
tags: ["CLIP", "对比学习", "多模态", "OpenAI", "Zero-Shot"]
---

## 研究背景

2020 年之前，计算机视觉的标准范式：

1. 在 ImageNet（1.4M 图，1000 类）上训练
2. 模型只认识固定的 1000 个类别
3. 换任务必须重新训练或微调

**核心问题**：标签集封闭、扩展性差、监督信号太弱。

CLIP 提出：**用互联网上海量的图文对（image-text pairs）作为监督信号**，让模型学习通用的视觉-语言表示。

## CLIP 核心方法

### 数据规模

OpenAI 收集了 **WIT 数据集**：
- 4 亿对 (image, text) 数据
- 来自互联网公开页面（Wikipedia、Reddit 等）
- 文本是图片的自然描述（caption / alt text）

### 对比学习目标

给定一个 batch 中的 N 对 (图像, 文本)，构造 N×N 相似度矩阵：

```
       text1  text2  text3 ... textN
img1  [✓                          ]
img2  [      ✓                    ]
img3  [            ✓              ]
...
imgN  [                        ✓  ]
```

目标：**对角线（正样本）相似度最大化，非对角线（负样本）最小化**。

损失函数（对称交叉熵）：

$$\mathcal{L} = \frac{1}{2}\left[\mathcal{L}_{i \to t} + \mathcal{L}_{t \to i}\right]$$

### 模型架构

- **视觉编码器**：ResNet 或 Vision Transformer (ViT)
- **文本编码器**：12 层 Transformer
- **投影头**：把图像和文本各自映射到 512-dim 共享空间
- 双塔架构，无任何交互

## 零样本（Zero-Shot）能力

这是 CLIP 最惊艳的特性。

### Zero-Shot 分类

无需任何微调，CLIP 就能分类任意类别：

```python
# 假设要分类一张图片是猫还是狗
prompts = [
    "a photo of a cat",
    "a photo of a dog",
]
text_features = clip.encode_text(prompts)
image_features = clip.encode_image(image)

# 计算相似度，相似度最高的就是预测类别
similarity = (text_features @ image_features.T).softmax(dim=0)
prediction = prompts[similarity.argmax()]
```

### Benchmark 表现

在 **27 个数据集** 上的零样本分类性能：

| 数据集 | CLIP Zero-Shot | 全监督 ResNet50 |
|--------|----------------|----------------|
| ImageNet | 76.2% | 76.1% |
| Oxford Pets | 93.5% | 93.4% |
| Stanford Cars | 78.8% | 65.2% |
| FGVC Aircraft | 36.1% | 49.1% |
| Country211 | 31.3% | 32.7% |

**关键结论**：在 ImageNet 上，CLIP 零样本竟然**追平了全监督 ResNet50**——这意味着模型不需要看 ImageNet 训练数据，就能达到 SOTA 监督模型的水平。

## 影响与衍生工作

CLIP 是过去几年多模态领域影响最大的工作之一：

| 衍生工作 | 用途 |
|---------|------|
| **DALL·E** | 文生图，使用 CLIP 评估生成质量 |
| **Stable Diffusion** | 文生图，使用 CLIP text encoder 提取条件 |
| **LLaVA** / **MiniGPT-4** | CLIP 视觉编码器接入 LLM |
| **OpenCLIP** | 开源复现，扩展到更大规模 |
| **EVA** / **SigLIP** | CLIP 的改进版本 |

## 局限性

1. **细粒度任务弱**：FGVC、医学影像等细粒度任务性能不佳
2. **抽象推理弱**：无法做计数、空间关系判断等
3. **训练成本高**：原始 CLIP 训练耗费 256 块 V100 跑 12 天
4. **数据偏见**：网络数据天然带有偏见，被 CLIP 继承

## 启示

CLIP 的成功揭示了几个重要原则：

1. **数据规模 > 模型规模**：4 亿数据 + 简单对比学习 > 复杂监督学习
2. **自然语言是最好的监督信号**：远比 one-hot 标签信息丰富
3. **简单架构 + 海量数据 = 通用表示**：这一原则后来被 GPT、SAM 等反复验证

## 论文链接

- arXiv: [2103.00020](https://arxiv.org/abs/2103.00020)
- 代码: [OpenAI CLIP](https://github.com/openai/CLIP)
- 开源版: [OpenCLIP](https://github.com/mlfoundations/open_clip)
