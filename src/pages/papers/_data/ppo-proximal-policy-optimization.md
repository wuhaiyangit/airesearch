---
title: "Proximal Policy Optimization Algorithms (PPO)"
slug: "ppo-proximal-policy-optimization"
authors: "John Schulman, Filip Wolski, Prafulla Dhariwal, et al. (OpenAI)"
year: 2017
venue: "arXiv:1707.06347"
category: "强化学习"
abstract: "PPO 通过 Clipped Surrogate Objective 限制每次策略更新的幅度，在保证训练稳定性的同时大幅简化实现复杂度，成为深度强化学习领域使用最广泛的算法，也是 RLHF 的核心组件。"
tags: ["PPO", "策略梯度", "OpenAI", "RLHF", "强化学习"]
---

## 研究背景

PPO 之前的策略梯度方法面临两难：

| 算法 | 优点 | 缺点 |
|------|------|------|
| Vanilla PG | 简单 | 步长难选，易崩 |
| TRPO | 稳定、有理论保证 | 实现复杂（需要二阶优化、共轭梯度） |
| A3C | 异步训练快 | 超参敏感 |

**核心矛盾**：策略更新太小训练慢，太大训练崩。

PPO 的目标：用一阶优化达到接近 TRPO 的效果，同时**实现极其简单**。

## PPO 核心思想

### Surrogate Objective

经典策略梯度的目标：

$$L^{PG}(\theta) = \mathbb{E}_t \left[\frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)} \cdot A_t\right]$$

其中 $r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)}$ 是新旧策略概率比。

**问题**：$r_t$ 可以无限增大，导致一次更新就毁掉策略。

### Clipped Surrogate（PPO-Clip）

PPO 的核心创新是**裁剪**：

$$L^{CLIP}(\theta) = \mathbb{E}_t \left[\min\left(r_t(\theta) A_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) A_t\right)\right]$$

直观理解：

| 情况 | 优势 $A_t$ | 概率比 $r_t$ | 裁剪行为 |
|------|----------|------------|---------|
| 好动作 | $A_t > 0$ | $r_t < 1+\epsilon$ | 正常更新 |
| 好动作 | $A_t > 0$ | $r_t \geq 1+\epsilon$ | 上界 clip，停止增大 |
| 坏动作 | $A_t < 0$ | $r_t > 1-\epsilon$ | 正常更新 |
| 坏动作 | $A_t < 0$ | $r_t \leq 1-\epsilon$ | 下界 clip，停止减小 |

通常 $\epsilon = 0.2$。

### 完整目标函数

$$L^{PPO}(\theta) = \mathbb{E}_t \left[L^{CLIP}_t - c_1 L^{VF}_t + c_2 H[\pi_\theta]\right]$$

三项含义：
1. **Clipped Surrogate**：策略梯度（裁剪过的）
2. **Value Loss**：价值函数误差，通常 MSE
3. **Entropy Bonus**：鼓励探索

## 实现的工程优雅

PPO 的伪代码非常简洁：

```python
for iteration in range(N):
    # 1. 用当前策略采集 T 步数据
    trajectories = collect_rollouts(policy, T)

    # 2. 计算 advantage（GAE）
    advantages = compute_gae(trajectories, value_fn)

    # 3. 多次 epoch 更新（关键！）
    for epoch in range(K):
        for batch in minibatches(trajectories):
            ratio = pi_new(a|s) / pi_old(a|s)
            surr1 = ratio * advantage
            surr2 = clip(ratio, 1-eps, 1+eps) * advantage
            policy_loss = -min(surr1, surr2).mean()

            value_loss = MSE(value_pred, returns)
            entropy_loss = -entropy(pi_new).mean()

            loss = policy_loss + c1 * value_loss + c2 * entropy_loss
            loss.backward()
            optimizer.step()
```

**关键 trick**：同一批数据**反复用 K 次**（通常 K=3-10），大幅提升样本效率。

## 实验表现

在多个 benchmark 上 PPO 都达到或超过 TRPO/A2C：

| 任务 | PPO | TRPO | A2C |
|------|-----|------|-----|
| Atari (49 games) | **平均 730** | 580 | 470 |
| MuJoCo HalfCheetah | **3500** | 2100 | 1800 |
| MuJoCo Humanoid | **6800** | 5300 | 4200 |

## 在 RLHF 中的应用

PPO 是 OpenAI 训练 ChatGPT 的核心算法：

```
SFT 模型 → 训练 Reward Model → PPO 优化 → 对齐后的模型
```

RLHF 流程中 PPO 的角色：
- **Policy**：被训练的 LLM
- **Reward**：来自 Reward Model 的人类偏好分数
- **KL 约束**：防止策略偏离 SFT 模型太远

但 PPO 在 RLHF 中也暴露问题：
- 显存占用大（4 个模型同时存活）
- 超参极其敏感
- 不稳定，常出现 reward hacking

这也是后来 **DPO** 兴起的直接原因。

## 局限性

1. **样本效率不如 off-policy 方法**（如 SAC、TD3）
2. **超参仍然敏感**（特别是 $\epsilon$、学习率）
3. **稀疏奖励场景表现差**
4. **难以处理多模态行为分布**

## 影响与遗产

PPO 是 RL 历史上**使用最广泛**的算法：

- OpenAI 的 Dota Five、ChatGPT 都基于 PPO
- 几乎所有 RL 库（Stable-Baselines3、Ray RLlib 等）的默认推荐
- 成为 RL 教学的标配算法
- 哪怕 DPO 兴起，PPO 在游戏 AI、机器人控制等领域仍是主流

## 论文链接

- arXiv: [1707.06347](https://arxiv.org/abs/1707.06347)
- OpenAI Spinning Up: [PPO 教程](https://spinningup.openai.com/en/latest/algorithms/ppo.html)
