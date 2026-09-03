"""最小复现：from __future__ import annotations 下 -> None 被误判为有返回值。"""

from __future__ import annotations


def returns_none_explicit() -> None:
    """显式 None 注解。"""
    pass


def returns_int() -> int:
    """显式 int 注解。"""
    return 1
