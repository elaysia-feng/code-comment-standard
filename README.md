# code-comment-standard

团队代码注释规范（基于 Google Style：Java 用 Javadoc、Python 用 Google
Docstring），外加复杂方法的**步骤编号注释**约定，以及一条硬性规定：
**所有注释必须使用中文**（专有名词可保留英文）。

仓库分两层：

```text
                     GitHub（本仓库）
               skill/ + version.json
                     │
              ccs check / update
                     │
                     ▼
                  ccs CLI（npm 只负责安装它）
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       Codex                 Claude
 ~/.agents/skills       ~/.claude/skills
```

**Skill 规则更新走 GitHub（改 version.json + 打 tag 即可），CLI 本体更新才走
npm。** 改注释规范不需要重新 `npm publish`。

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
└── package.json           # npm 包（只装 CLI）
```

## 用户侧使用

```bash
# 1. 安装 CLI（只需一次）
npm install -g code-comment-standard

# 2. 安装 skill 到 Codex / Claude Code
ccs install codex
ccs install claude
ccs install all

# 3. 日常：检查更新、更新、看状态
ccs check
ccs update
ccs status
ccs version
ccs uninstall codex
```

安装位置：

- Codex：`~/.agents/skills/code-comment-standard`
- Claude Code：`~/.claude/skills/code-comment-standard`
- 配置：`~/.code-comment-standard/config.json`

CLI 零运行时依赖，要求 Node >= 18。

## 维护者：发布新版 Skill

1. 修改 `skill/` 下的规则文件
2. 更新 `version.json`：`version` 升一位，`files` 与实际文件保持一致
3. 提交并打 tag：

```bash
git add .
git commit -m "feat: update Java comment rules"
git tag v1.1.0
git push
git push origin v1.1.0
```

之后所有用户 `ccs check` 即可看到新版本，`ccs update` 会按 `version.json`
的 `files` 清单从 tag 快照逐个下载并覆写已安装目标（下载全部成功后才写盘，
断网不会留下半成品）。

发布 CLI 本体（仅当 cli/、bin/ 变化时才需要）：

```bash
# package.json 的 version 同步升位后
npm publish
```

## 本地开发与自测

```bash
# 校验脚本回归测试
py -m pytest tests/ -q

# 用 skill 自带的规范检查它自己的源码（吃自己的狗粮）
py skill/scripts/check_comments.py skill/ tests/

# 在隔离的 HOME 下冒烟测试 CLI（不碰真实 ~/.claude、~/.agents）
export CCS_HOME=$(mktemp -d)   # Windows Git Bash 可用；PowerShell 用 $env:CCS_HOME
node bin/ccs.js install all
node bin/ccs.js status
node bin/ccs.js uninstall all
```
