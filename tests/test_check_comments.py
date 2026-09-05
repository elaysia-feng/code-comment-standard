"""回归测试：每个 Critical / Major 修复各跑一组断言。

可独立运行::

    py tests/test_check_comments.py

脚本本身只依赖标准库，与 scripts/check_comments.py 共用同一份逻辑。
"""

from __future__ import annotations

import sys
from pathlib import Path

# 把 skill/scripts/ 加进 path，让 check_comments 可被 import
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "skill" / "scripts"))

import check_comments as cc  # noqa: E402


REPRO = ROOT / "tests" / "repro"


def _codes(issues):
    return sorted({i.code for i in issues})


def _lines(issues, code):
    return sorted(i.line for i in issues if i.code == code)


# ---------------------------------------------------------------------------
# Critical #1：嵌套类的方法应被检查
# ---------------------------------------------------------------------------
def test_critical1_nested_class_methods_checked():
    """嵌套类与其内部方法缺 docstring 应被报出，外层类自身不应误报。"""
    src = (REPRO / "critical1_nested_class.py").read_text(encoding="utf-8")
    issues = cc.check_python_file(REPRO / "critical1_nested_class.py", src)
    lines = _lines(issues, "missing-doc")
    # Outer 自己有 docstring 不该被报；Inner 类 + 嵌套类方法应被报
    assert 8 not in lines, f"Outer wrongly flagged; got {lines}"
    assert 10 in lines, f"Inner class missing-doc not flagged; got {lines}"
    assert 11 in lines, f"nested m() missing-doc not flagged; got {lines}"


# ---------------------------------------------------------------------------
# Critical #2：嵌套函数体里的分支不应计入外层
# ---------------------------------------------------------------------------
def test_critical2_nested_branches_ignored():
    """内部函数的分支不应计入外层函数的复杂度，避免误报 missing-steps。"""
    src = (REPRO / "critical2_nested_branches.py").read_text(encoding="utf-8")
    issues = cc.check_python_file(REPRO / "critical2_nested_branches.py", src)
    # 外层只有 2 个顶层 if，不达阈值 → 不应报 missing-steps
    assert "missing-steps" not in _codes(issues), \
        f"missing-steps wrongly fired; codes={_codes(issues)}"


# ---------------------------------------------------------------------------
# Critical #3：Javadoc 里出现 {@code /* foo */} 不应误判为缺注释
# ---------------------------------------------------------------------------
def test_critical3_javadoc_literal_block():
    """Javadoc 内含字面量 /* */ 时不应误判为缺少文档注释。"""
    src = (REPRO / "critical3_fake_block_javadoc.java").read_text(encoding="utf-8")
    issues = cc.check_java_file(REPRO / "critical3_fake_block_javadoc.java", src)
    assert "missing-doc" not in _codes(issues), \
        f"Javadoc with literal /* */ was wrongly flagged; codes={_codes(issues)}"


# ---------------------------------------------------------------------------
# Minor：待办标记不区分大小写
# ---------------------------------------------------------------------------
def test_todo_case_insensitive():
    """小写 todo 同样要求标注负责人，不能靠大小写绕过。"""
    src = (REPRO / "minor_todo_case.py").read_text(encoding="utf-8")
    issues = cc.check_python_file(REPRO / "minor_todo_case.py", src)
    assert "todo-no-owner" in _codes(issues), \
        f"lowercase # todo: not detected; codes={_codes(issues)}"


# ---------------------------------------------------------------------------
# Minor：from __future__ import annotations 下 -> None 不应被误判
# ---------------------------------------------------------------------------
def test_future_annotations_none():
    """返回注解为 None 的函数不应误报缺 Returns，返回 int 的应当报。"""
    src = (REPRO / "minor_python_none_future.py").read_text(encoding="utf-8")
    issues = cc.check_python_file(REPRO / "minor_python_none_future.py", src)
    # returns_none_explicit 不应触发 missing-returns；returns_int 应触发
    miss = _lines(issues, "missing-returns")
    assert 7 not in miss, \
        f"def ... -> None wrongly flagged missing-returns; lines={miss}"
    assert 11 in miss, \
        f"def ... -> int should be flagged missing-returns; lines={miss}"


def test_string_return_annotation_requires_returns_section():
    """字符串形式的非 None 返回注解同样应要求 Returns: 小节。"""
    src = '''def load_user() -> "User":
    """加载用户。"""
    raise NotImplementedError
'''
    issues = cc.check_python_file(Path("string_annotation.py"), src)
    assert "missing-returns" in _codes(issues), \
        f"string return annotation was ignored; codes={_codes(issues)}"


def test_nested_return_does_not_affect_outer_function():
    """内部函数的返回值不应让外层函数被误判为需要 Returns:。"""
    src = '''def outer():
    """执行外层流程。"""
    def inner():
        return 1
    inner()
'''
    issues = cc.check_python_file(Path("nested_return.py"), src)
    assert "missing-returns" not in _codes(issues), \
        f"nested return leaked into outer function; codes={_codes(issues)}"


# ---------------------------------------------------------------------------
# Minor：Java text block 里的 fake_method 不应被识别为方法
# ---------------------------------------------------------------------------
def test_java_text_block_fake_method_ignored():
    """Java text block 内的伪方法声明不应被识别为真实方法。"""
    src = (REPRO / "minor_text_block.java").read_text(encoding="utf-8")
    issues = cc.check_java_file(REPRO / "minor_text_block.java", src)
    names = [i.message for i in issues]
    assert not any("fake_method" in m for m in names), \
        f"fake_method from text block leaked into issues; names={names}"


def test_java_anonymous_class_branches_ignored_for_outer_method():
    """匿名类内部的分支不应计入外层 Java 方法复杂度。"""
    # 1. 构造一个分支全部位于匿名类内部的 Java 外层短方法
    src = '''public class Demo {
    /** 执行任务。 */
    public void run() {
        Runnable job = new Runnable() {
            /** 执行内部任务。 */
            public void execute() {
                if (a) {}
                if (b) {}
                if (c) {}
                if (d) {}
                if (e) {}
                if (f) {}
                if (g) {}
                if (h) {}
            }
        };
        job.run();
    }
}
'''
    # 2. 确认匿名类的复杂度没有泄漏到外层 run 方法
    issues = cc.check_java_file(Path("Demo.java"), src)
    outer_step_issues = [i for i in issues if i.code == "missing-steps" and "`run`" in i.message]
    assert not outer_step_issues, f"anonymous class branches leaked into run(): {outer_step_issues}"


# ---------------------------------------------------------------------------
# Minor：类有公共属性但缺 Attributes: 应报警
# ---------------------------------------------------------------------------
def test_missing_attributes_warning():
    """类有公共属性但 docstring 缺 Attributes: 小节时应报警。"""
    src = (REPRO / "minor_attributes.py").read_text(encoding="utf-8")
    issues = cc.check_python_file(REPRO / "minor_attributes.py", src)
    assert "missing-attributes" in _codes(issues), \
        f"missing-attributes not fired; codes={_codes(issues)}"


# ---------------------------------------------------------------------------
# 退出码：没找到文件应返回 2
# ---------------------------------------------------------------------------
def test_no_files_exit_code_2():
    """targets 未匹配到任何源文件时退出码应为 2，与干净通过区分。"""
    rc = cc.main(["__definitely_not_a_real_path__"])
    assert rc == 2, f"empty target should exit 2, got {rc}"


if __name__ == "__main__":
    tests = [
        test_critical1_nested_class_methods_checked,
        test_critical2_nested_branches_ignored,
        test_critical3_javadoc_literal_block,
        test_todo_case_insensitive,
        test_future_annotations_none,
        test_string_return_annotation_requires_returns_section,
        test_nested_return_does_not_affect_outer_function,
        test_java_text_block_fake_method_ignored,
        test_java_anonymous_class_branches_ignored_for_outer_method,
        test_missing_attributes_warning,
    ]
    failures = 0
    for t in tests:
        try:
            t()
            print(f"PASS  {t.__name__}")
        except AssertionError as exc:
            failures += 1
            print(f"FAIL  {t.__name__}: {exc}")
    # 退出码用例单独跑（需要传不存在的路径）
    try:
        test_no_files_exit_code_2()
        print("PASS  test_no_files_exit_code_2")
    except AssertionError as exc:
        failures += 1
        print(f"FAIL  test_no_files_exit_code_2: {exc}")
    print(f"\n{len(tests) + 1 - failures}/{len(tests) + 1} passed")
    sys.exit(1 if failures else 0)
