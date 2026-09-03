/**
 * ccs check / status：版本比对与安装状态展示。
 */

"use strict";

const fs = require("fs");
const {
  TARGETS,
  targetDir,
  loadConfig,
  fetchRemoteVersionInfo,
  compareVersions,
} = require("./common");

/** ccs check：比对本地安装版本与 GitHub 最新版本 */
async function check() {
  const config = loadConfig();
  const remote = await fetchRemoteVersionInfo();

  const current = config.version || "未安装";
  const latest = remote.version || "unknown";
  console.log(`Current: ${current}`);
  console.log(`Latest:  ${latest}\n`);

  // 1. 还没安装过：提示安装而不是更新，避免 update 时才发现无目标可更新
  if (!config.version || Object.keys(config.targets).length === 0) {
    console.log("Not installed.");
    console.log("Run: ccs install all");
    return 1;
  }
  // 2. 已安装：本地落后时提示更新，否则就是最新
  if (compareVersions(current, latest) < 0) {
    console.log("Update available.");
    console.log("Run: ccs update");
    return 1;
  }
  console.log("✓ Already up to date");
  return 0;
}

/** ccs status：逐个目标显示安装状态与版本 */
async function status() {
  const config = loadConfig();
  const remoteInfo = await fetchRemoteVersionInfo().catch(() => null);

  for (const name of Object.keys(TARGETS)) {
    const installed = fs.existsSync(targetDir(name));
    if (installed) {
      const ver = config.targets[name] || config.version || "unknown";
      console.log(`${TARGETS[name].label.padEnd(12)} ✓ installed  ${ver}`);
    } else {
      console.log(`${TARGETS[name].label.padEnd(12)} ✗ not installed`);
    }
  }
  if (remoteInfo && remoteInfo.version) {
    console.log(`\nLatest:  ${remoteInfo.version} (GitHub)`);
  }
  return 0;
}

module.exports = { check, status };
