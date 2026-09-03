"""最小复现：SKILL.md §2.3 要求 Attributes:，脚本未实现。"""


class UserService:
    """用户服务。

    本类无状态，方法均线程安全。
    """

    repository: object  # 公共属性，但缺 Attributes:，脚本未报
    max_retry: int = 3
