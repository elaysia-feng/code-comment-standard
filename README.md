# code-comment-standard

团队代码注释规范（基于 Google Style：Java 用 Javadoc、Python 用 Google
Docstring），外加复杂方法的**步骤编号注释**约定，以及一条硬性规定：
**所有注释必须使用中文**（专有名词可保留英文）。

仓库结构：

```text
                     GitHub（本仓库）
               skill/ + version.json + tag
                     │
              ccs check / update
                     │
                     ▼
                  ccs CLI（直接从 GitHub 装）
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       Codex                 Claude
 ~/.agents/skills       ~/.claude/skills
```

**全部更新走 GitHub**（改 `skill/` 或 `cli/` → 改 `version.json` → 打 tag 即可）。
不依赖任何 npm registry——CLI 和 skill 内容都从 GitHub 拉。

## 目录结构

```text
├── skill/                 # Skill 本体（安装时整个复制到各目标）
│   ├── SKILL.md
│   ├── references/examples.md
│   └── scripts/check_comments.py
├── cli/                   # ccs 命令实现
├── bin/ccs.js             # CLI 入口
├── tests/                 # 校验脚本回归测试
├── version.json           # skill 版本 + 文件清单（更新的事实来源）
├── package.json           # 仅声明 bin 字段，方便 `npm i -g` 从 GitHub 装 CLI
└── .npmignore             # 控制 npm 打包范围
```

## 用户侧使用

### 1. 装 CLI（一次性）

CLI 只是一个 Node.js 脚本，从 GitHub 装即可：

```bash
# 方式一：npm 直接从 GitHub 拉（最方便）
npm install -g github:elaysia-feng/code-comment-standard

# 方式二：手动 clone（不想走 npm 也可以）
git clone https://github.com/elaysia-feng/code-comment-standard.git ~/.ccs
# 然后把 ~/.ccs/bin/ccs.js 加到 PATH，或：
# Windows PowerShell：
#   [Environment]::SetEnvironmentVariable("Path", "$env:Path;$HOME\.ccs\bin", "User")
# macOS / Linux：把下面这一行加到 ~/.zshrc 或 ~/.bashrc
#   export PATH="$HOME/.ccs/bin:$PATH"
```

装完验证：

```bash
ccs version
# 应输出：ccs CLI:  1.0.0
#        本地 skill 包:  1.0.0
#        已安装版本:     未安装
```

### 2. 安装 skill 到 Codex / Claude Code

```bash
ccs install codex     # 只装到 Codex
ccs install claude   # 只装到 Claude Code
ccs install all      # 同时装到两个
```

安装位置：

- Codex：`~/.agents/skills/code-comment-standard`
- Claude Code：`~/.claude/skills/code-comment-standard`
- 配置：`~/.code-comment-standard/config.json`

### 3. 日常

```bash
ccs check      # 对比本地与 GitHub 最新版本
ccs update     # 下载最新 skill 并同步到已安装目标
ccs status     # 查看各目标安装状态与版本
ccs version    # CLI 与已装 skill 版本
ccs uninstall codex   # 卸载
```

CLI 零运行时依赖，要求 Node >= 18。

## 维护者：发布新版

**所有改动（skill 规则、CLI 本体）走同一条流程：**

1. 改代码（`skill/` 改规范、`bin/` 或 `cli/` 改 CLI）
2. 同步升位 `version.json`（`files` 字段保持与 `skill/` 内真实文件一致）
3. 同步升位 `package.json` 的 `"version"` 字段
4. 提交 + 打 tag：

```bash
git add .
git commit -m "feat: xxx"
git tag v1.1.0
git push origin main v1.1.0
```

之后所有用户 `ccs check` 即可看到新版本，`ccs update` 会按 `version.json`
的 `files` 清单从 tag 快照逐个下载并覆写已安装目标（下载全部成功后才写盘，
断网不会留下半成品）。

**为什么连 CLI 也走 GitHub？** 避免 npm 2FA、registry 账号、token 那些麻烦事。
`npm install -g github:...` 已经够用，团队 5-10 人装一次就够了。

如果以后真的要把 CLI 发到 npm 官方源，再单独起一个 PR 改 README 即可，**不影响 skill 的更新链路**。

## 本地开发与自测

```bash
# 校验脚本回归测试
py -m pytest tests/ -q

# 用 skill 自带的规范检查它自己的源码（吃自己的狗粮）
py skill/scripts/check_comments.py skill/ tests/

# 在隔离的 HOME 下冒烟测试 CLI（不碰真实 ~/.claude、~/.agents）
export CCS_HOME="$(mktemp -d)"   # Windows Git Bash；PowerShell 用 $env:CCS_HOME
node bin/ccs.js install all
node bin/ccs.js status
node bin/ccs.js uninstall all

# 验证 README 里的 npm 命令能跑通
npm pack --dry-run
# 应输出 11 个文件，无 tests/、无 __pycache__/
```

## 给团队的一句话

> **注释一律中文；Javadoc 用 Google Style；复杂方法用 `// 1. // 1.1` 拆步骤；
> TODO 必须有负责人。详细看 `ccs install claude` 装进 Claude Code 的那份。**