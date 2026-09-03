"""最小复现：嵌套类里的方法应被检查。

Expected: 脚本报 missing-doc；现状：脚本静默跳过。
"""


class Outer:
    """外层类。"""

    class Inner:
        def m(self, x):  # 缺 docstring，脚本应报 missing-doc
            return x + 1
