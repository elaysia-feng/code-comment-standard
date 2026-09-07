---
name: code-comment-standard
description: 在实际新增、修改或重构 Java/Python 代码时，自动规范中文 Javadoc、Google 风格 docstring、复杂流程步骤注释和带负责人的 TODO；纯解释、只读审查及其他语言默认不触发。
---

# Java/Python 代码注释规范

## 触发范围

- 实际新增、修改或重构 Java/Python 代码时自动应用，无需用户另说“加注释”。
- 用户明确要求补注释、写 Javadoc/docstring、补步骤编号，或指出注释违规时应用。
- 纯代码解释、只读审查、PR review 和其他语言默认不触发；如果审查后开始改 Java/Python，从改动开始应用。
- 用户明确要求不改注释时，遵循用户要求。
- 简单测试夹具、框架/IDE 生成的样板、一次性脚本和教学示例默认不强制套用。

## 必须遵守的规则

1. 注释说明**为什么**，不要逐行复述代码；代码变化时同步更新过时注释。
2. 注释正文使用中文；类名、方法名、协议术语等必要专名可保留英文。
3. 对外可见的类型和成员必须有文档注释：
   - Java 的 `public` / `protected` 方法使用 Javadoc；公共类说明职责，必要时补充线程安全性和典型用法。
   - Python 的 public 函数/方法使用 Google 风格 docstring；公共类说明职责，有公共属性时使用 `Attributes:`。
4. 简单 getter/setter 或一行方法可以使用一行摘要，不强制添加流程编号。

## 文档注释内容

Java 方法的 Javadoc 至少包含摘要；有参数写 `@param`，非 `void` 返回值写 `@return`，有需要说明的异常写 `@throws`。

Python docstring 至少包含摘要；有参数、返回值或异常时分别使用 `Args:`、`Returns:`/`Yields:`、`Raises:`。

需要模板或特殊写法时，按需读取 [references/examples.md](references/examples.md)，不要为简单方法加载整份示例。

## 复杂方法的步骤编号

满足任一条件时，用步骤注释拆解执行流程：

- 方法体达到 20 行；或
- 方法体达到 10 行，且 `if`/`for`/`while`/`switch`/`try`/`catch`/`do` 等分支、循环和异常处理合计至少 3 个（Python 不计 `switch`）。

方法体少于 10 行时默认豁免。方法体内的嵌套函数、局部类和匿名类不计入外层复杂度。

- Java 使用 `// 1.`，Python 使用 `# 1.`；子步骤使用 `1.1`。
- 至少写 2 条编号注释；编号按执行顺序排列，每条说明阶段目的而不是重复代码。
- 文档注释面向调用者，步骤注释面向维护者；复杂方法两者都要有。

## TODO

TODO 必须写成 `TODO(负责人): 说明`，说明待办原因或下一步；无负责人的 `TODO` 视为违规。

## 修改后的检查

每次生成或修改 Java/Python 文件后：

1. 检查本次涉及的公共类型/成员、复杂流程、TODO 和过时注释。
2. 运行：

   ```bash
   py skill/scripts/check_comments.py <改动的文件或目录>
   ```

3. `ERROR` 必须为 0；逐条判断 `WARNING`，确认是启发式误报时在交付说明中注明。
4. 不能只凭脚本宣称完成：脚本不检查 Java 类注释、标签条目是否逐一匹配、异常说明完整性、注释语言和废话注释。

退出码：`0` 表示没有 ERROR，`1` 表示存在 ERROR，`2` 表示目标中没有匹配的 `.java` / `.py` 文件。

脚本路径不在当前仓库时，使用已安装技能目录中的 `scripts/check_comments.py` 绝对路径。
