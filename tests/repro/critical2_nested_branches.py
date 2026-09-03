"""最小复现：嵌套函数体里的分支不应计入外层。

外层方法体只有 2 个顶层 if（短），但因为嵌套 helper 里有 for/if/try/while，
ast.walk 会把它们算到外层头上 → 误报"需要步骤编号"。

修复后：只数外层 2 个 if，< 阈值，不触发。
"""


def outer_function(x):
    """外层函数。"""
    if x > 0:
        x += 1
    if x > 1:
        x += 2

    def nested_helper(z):
        for i in range(10):
            if z:
                pass
            try:
                pass
            except Exception:
                pass
        while z:
            z -= 1
        return z

    return nested_helper(x)
