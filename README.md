<div align="center">

# 代码注释规范

**团队所有 Java / Python 代码必须遵守的注释规则**

[安装](#安装) · [规则速查](#规则速查) · [示例](#示例) · [常见问题](#常见问题)

</div>

---

## 这是什么

一份团队代码注释规范，要求：

- ✅ Java 用 **Javadoc**，Python 用 **Google Style Docstring**
- ✅ **复杂方法用 `// 1.` `// 1.1` 编号注释**拆解执行流程
- ✅ **所有注释一律使用中文**（专有名词除外）
- ✅ `TODO` 必须标注负责人
- ✅ 每次写完代码，跑 `ccs check` 自动校验

代码里没写的注释、写得不对的注释，**会被团队规范拒绝**。

---

## 安装

> 需要 Node.js 18 或更高版本。

**第一步：装 ccs 工具**（5 秒）

```bash
npm install -g github:elaysia-feng/code-comment-standard
```

**第二步：把规范装进你用的 AI 编程助手**（10 秒）

```bash
ccs install codex     # 如果你用 Codex
ccs install claude    # 如果你用 Claude Code
ccs install all       # 两个都用
```

**第三步：验证一下**

```bash
ccs status
```

看到类似这样的输出就成功了：

```
Codex        ✓ installed  1.0.0
Claude Code  ✓ installed  1.0.0
```

---

## 日常使用

| 命令 | 做什么 |
|---|---|
| `ccs check` | 看你的注释是否符合规范 |
| `ccs update` | 拉取最新规范（团队改了规则你立刻就能拿到） |
| `ccs status` | 看哪些工具已安装、什么版本 |
| `ccs version` | 看 CLI 与已装 skill 版本 |

**最常用的场景**：写完一个 Java/Python 文件，跑：

```bash
py skill/scripts/check_comments.py src/
```

（在仓库根目录运行）它会列出 ERROR 和 WARNING，**ERROR 必须修干净**才能提交。

---

## 规则速查

> 完整规则在 `skill/SKILL.md`，但下面这 6 条你写代码时必须记住：

### 1. 所有注释必须用中文

```java
// ✅ 对：中文
// 校验用户输入的手机号格式是否合法
if (!PhoneValidator.isValid(phone)) { ... }

// ❌ 错：英文（团队禁止）
// Validate phone format
if (!PhoneValidator.isValid(phone)) { ... }
```

类名、方法名、HTTP 状态码这些**专有名词可以保留英文**，但注释句子本身必须是中文。

### 2. 每个 public 方法必须有文档注释

**Java**：

```java
/**
 * 校验并处理用户注册请求，完成账号创建与初始化。
 *
 * @param request 用户注册请求，不能为 null
 * @param source  注册来源渠道（如 "app"、"web"）
 * @return 创建成功的用户 ID
 * @throws UserAlreadyExistsException 当手机号已注册时抛出
 */
public long registerUser(RegisterRequest request, String source) { ... }
```

**Python**：

```python
def register_user(request: RegisterRequest, source: str) -> int:
    """校验并处理用户注册请求，完成账号创建与初始化。

    Args:
        request: 用户注册请求对象。
        source: 注册来源渠道（如 "app"、"web"）。

    Returns:
        创建成功的用户 ID。

    Raises:
        UserAlreadyExistsError: 当手机号已注册时抛出。
    """
    ...
```

### 3. 复杂方法用编号注释拆步骤

判断标准（满足任一即可）：
- 方法体 ≥ 20 行
- 或方法体 ≥ 10 行，且分支/循环 ≥ 3 个

```java
public long registerUser(RegisterRequest request, String source) {
    // 1. 参数校验
    // 1.1 校验手机号格式是否合法
    if (!PhoneValidator.isValid(request.getPhone())) { ... }
    // 1.2 校验密码强度是否符合要求
    if (!PasswordValidator.isStrong(request.getPassword())) { ... }

    // 2. 检查用户是否已存在
    if (userRepository.existsByPhone(request.getPhone())) { ... }

    // 3. 创建用户账号
    // 3.1 生成用户基础信息
    User user = User.builder()...build();
    // 3.2 持久化到数据库
    long userId = userRepository.save(user);

    // 4. 发送注册成功通知（异步，不阻塞主流程）
    notificationService.sendWelcomeMessageAsync(userId);

    return userId;
}
```

**至少要写 2 条编号**才算出"拆解"，只写一条 `// 1.` 等于没拆。

### 4. TODO 必须有负责人

```java
// ✅ 对
// TODO(zhangsan): 支付超时后需要补充自动关单逻辑，预计 v2.3 版本处理

// ❌ 错（团队禁止）
// TODO: 支付超时后需要补充自动关单逻辑
```

### 5. 不要写废话注释

```java
// ❌ 错（禁止）
int count = 0; // 将 count 初始化为 0
count++;       // count 加一

// ✅ 对：注释解释"为什么"，不是"是什么"
int retryCount = 0; // 最多重试 3 次，超过则放弃并告警
retryCount++;
```

### 6. 注释必须与代码同步更新

代码改了但注释忘了改 = **比没注释更糟**。每次重构顺手把过时的注释也改掉。

---

## 示例

完整可对照抄写的 Java / Python 示例在 `skill/references/examples.md`，包括：

- 基础 Javadoc / Docstring 写法
- 步骤编号注释（含分支并列写法）
- 类注释（Java `record` / Python `@dataclass`）
- TODO 正确与反面写法
- 异步函数、生成器、`@property` 的特殊写法

**写代码前先看一眼**，比事后返工划算。

---

## 常见问题

### Q: 装完之后 `ccs status` 提示"未安装"？

答：你只装了 CLI 工具（`ccs` 命令本身），没装 skill。运行：

```bash
ccs install codex    # 或 claude / all
```

### Q: 改了 `.py` / `.java` 文件后多久会自动生效？

答：ccs 不"自动跑"，需要每次手动执行：

```bash
py skill/scripts/check_comments.py 你改的文件.py
```

建议在 IDE 里绑定保存时自动跑（搜索 `pyright` / `mypy` 的 `Run on save` 配置类似思路）。

### Q: 我的项目有几百个旧文件，跑 `ccs check` 全是 ERROR 怎么办？

答：分阶段推进：

1. 先在新写的代码上**严格执行**（PR 合并前必跑）
2. 每周抽 1-2 小时改一批老文件
3. 不要试图一次性扫一遍全仓库

### Q: 英文注释真的完全不行吗？

答：是的。团队硬性规定。如果代码注释全英文，PR 会被打回。专有名词（类名、`@param` 里的 `null` 字面量、HTTP 状态码）可以保留英文，但注释句子本身必须是中文。

### Q: ccs update 会覆盖我改过的本地 skill 文件吗？

答：会。如果你想保留自定义版本，先备份再 update，或者本地装好后切到非自动同步模式（见 `ccs update --help`，如果有的话）。

### Q: 我怎么改规则？

答：改 `skill/SKILL.md` → 同步升 `version.json` 的版本号 → 提交并打 tag：

```bash
# 改完文件后
git add .
git commit -m "feat: 加一条新规则"
git tag v1.1.0
git push origin main v1.1.0
```

下次所有团队成员跑 `ccs update` 就能拿到新规则。

---

## 仓库结构（给想深入的人）

```
├── skill/                 # 规则本体（ccs install 时复制到 ~/.claude/skills/）
│   ├── SKILL.md           # 完整规则文档
│   ├── references/examples.md  # 可抄写的代码示例
│   └── scripts/check_comments.py  # 自动校验脚本
├── cli/                   # ccs 命令实现
├── bin/ccs.js             # CLI 入口
├── tests/                 # 校验脚本的回归测试
├── version.json           # skill 版本 + 文件清单
└── package.json           # 仅声明 bin 字段供 npm 识别
```

**工作原理**：

```text
  GitHub（仓库 + tag）
       │
       │ ccs check / update
       ▼
   ccs CLI
       │
       ├──> ~/.agents/skills/    (Codex)
       └──> ~/.claude/skills/    (Claude Code)
```

更新只走 GitHub tag（改 `version.json` + 打 tag），不依赖任何外部 registry。

---

## 给项目维护者

### 发布新版本

```bash
# 1. 改 skill/ 或 cli/
# 2. 同步升两个 version 字段
#    version.json      → "version": "1.1.0"
#    package.json      → "version": "1.1.0"

# 3. 提交 + 打 tag + 推送
git add .
git commit -m "feat: ..."
git tag v1.1.0
git push origin main v1.1.0
```

发布后用户的 `ccs update` 会自动按 `version.json` 的 `files` 清单下载新版本。

### 本地自测

```bash
# 跑测试
py -m pytest tests/ -q

# 用 skill 自带的规范检查它自己（吃自己狗粮）
py skill/scripts/check_comments.py skill/ tests/

# 隔离环境跑 CLI 冒烟测试（不碰真实 ~/.claude）
export CCS_HOME="$(mktemp -d)"
node bin/ccs.js install all
node bin/ccs.js status
```

---

<div align="center">

**有问题先问团队群，别自己猜。规则可能更新，GitHub 上的版本才是真理。**

</div>