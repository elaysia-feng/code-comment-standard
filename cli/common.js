/**
 * ccs CLI 公共常量与工具函数。
 *
 * 设计要点：
 * - 零运行时依赖，只用 Node 18+ 内置模块与全局 fetch
 * - Skill 规则更新走 GitHub（raw + tag），CLI 本体更新走 npm
 * - 支持 CCS_HOME 环境变量覆盖主目录，方便冒烟测试与多环境安装
 */

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

/** GitHub 仓库（Skill 内容与版本清单的唯一事实来源） */
const REPO = "elaysia-feng/code-comment-standard";

/** raw.githubusercontent.com 基地址 */
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}`;

/** 安装到各目标时的 skill 目录名 */
const SKILL_NAME = "code-comment-standard";

/** 网络请求超时时间（毫秒） */
const FETCH_TIMEOUT_MS = 15000;

/**
 * 各安装目标的定义。
 *
 * codex  -> ~/.agents/skills/<skill>
 * claude -> ~/.claude/skills/<skill>
 */
const TARGETS = {
  codex: { label: "Codex", rel: path.join(".agents", "skills", SKILL_NAME) },
  claude: { label: "Claude Code", rel: path.join(".claude", "skills", SKILL_NAME) },
};

/** ccs 自身的 home 基准目录，可用 CCS_HOME 覆盖（测试用） */
function homeBase() {
  return process.env.CCS_HOME || os.homedir();
}

/** 某个安装目标在本机的 skill 目录绝对路径 */
function targetDir(name) {
  return path.join(homeBase(), TARGETS[name].rel);
}

/** ccs 配置文件路径（~/.code-comment-standard/config.json） */
function configPath() {
  return path.join(homeBase(), ".code-comment-standard", "config.json");
}

/** 读取本地配置；不存在或损坏时返回空骨架 */
function loadConfig() {
  try {
    const raw = fs.readFileSync(configPath(), "utf8");
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || null,
      targets: parsed.targets && typeof parsed.targets === "object" ? parsed.targets : {},
    };
  } catch (err) {
    return { version: null, targets: {} };
  }
}

/** 保存本地配置（自动创建父目录） */
function saveConfig(config) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2) + "\n", "utf8");
}

/** 随 CLI 一起发布的 skill 源目录（package 根下的 skill/） */
function localSkillDir() {
  return path.join(__dirname, "..", "skill");
}

/** 读取随 CLI 发布的 version.json；失败时返回 null */
function localVersionInfo() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "version.json"), "utf8"));
  } catch (err) {
    return null;
  }
}

/** 抓取远端文本；非 2xx 或网络失败时抛出带说明的错误 */
async function fetchText(url) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (err) {
    throw new Error(`网络请求失败: ${url}\n${err.message}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return res.text();
}

/** 抓取远端 JSON */
async function fetchJson(url) {
  const text = await fetchText(url);
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`远端返回的不是合法 JSON: ${url}`);
  }
}

/** 拉取 GitHub 上的 version.json（默认分支 main，失败时回退 master） */
async function fetchRemoteVersionInfo() {
  const bases = [`${RAW_BASE}/main`, `${RAW_BASE}/master`];
  let lastErr = null;
  for (const base of bases) {
    try {
      return await fetchJson(`${base}/version.json`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`无法获取远端 version.json（${REPO}）\n${lastErr.message}`);
}

/** 下载 skill 内单个文件内容：优先取 tag 快照，tag 不存在时回退默认分支 */
async function downloadSkillFile(version, relPath) {
  const candidates = [
    `${RAW_BASE}/v${version}/skill/${relPath}`,
    `${RAW_BASE}/main/skill/${relPath}`,
  ];
  let lastErr = null;
  for (const url of candidates) {
    try {
      return await fetchText(url);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`文件下载失败: ${relPath}\n${lastErr.message}`);
}

/** 语义化版本比较：a<b 返回 -1，相等返回 0，a>b 返回 1 */
function compareVersions(a, b) {
  const pa = String(a || "0").split(".").map((x) => parseInt(x, 10) || 0);
  const pb = String(b || "0").split(".").map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

/** 解析命令行目标参数：all / 单个目标名 / 缺省按 all 处理 */
function resolveTargets(arg) {
  if (!arg || arg === "all") {
    return Object.keys(TARGETS);
  }
  if (!TARGETS[arg]) {
    throw new Error(`未知目标: ${arg}（可选: codex, claude, all）`);
  }
  return [arg];
}

module.exports = {
  REPO,
  RAW_BASE,
  SKILL_NAME,
  TARGETS,
  homeBase,
  targetDir,
  configPath,
  loadConfig,
  saveConfig,
  localSkillDir,
  localVersionInfo,
  fetchText,
  fetchJson,
  fetchRemoteVersionInfo,
  downloadSkillFile,
  compareVersions,
  resolveTargets,
};
