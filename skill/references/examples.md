# 代码注释规范 · 完整示例

本文件是 [SKILL.md](../SKILL.md) 的配套示例集，按需查阅。规则条文见 SKILL.md，
这里只放可以直接对照抄写的完整代码。

> 所有示例的注释均为中文——规范硬性要求注释一律用中文书写，专有名词（类名、
> HTTP 状态码等）可原样保留英文。

> ⚠️ **反面示例块（第五节）一律禁止抄写**，已用 `❌ DO NOT COPY` 标记；
> 仅用于帮团队成员识别"什么样的注释是废话注释"。

## 一、Java：Javadoc + 步骤编号注释

一个同时具备完整 Javadoc（面向调用者）和步骤编号注释（面向维护者）的典型方法：

```java
/**
 * 校验并处理用户注册请求，完成账号创建与初始化。
 *
 * @param request 用户注册请求，不能为 null
 * @param source  注册来源渠道（如 "app"、"web"）
 * @return 创建成功的用户 ID
 * @throws IllegalArgumentException 当手机号格式非法时抛出
 * @throws UserAlreadyExistsException 当手机号已注册时抛出
 */
public long registerUser(RegisterRequest request, String source) {
    // 1. 参数校验
    // 1.1 校验手机号格式是否合法
    if (!PhoneValidator.isValid(request.getPhone())) {
        throw new IllegalArgumentException("手机号格式非法: " + request.getPhone());
    }
    // 1.2 校验密码强度是否符合要求
    if (!PasswordValidator.isStrong(request.getPassword())) {
        throw new IllegalArgumentException("密码强度不足");
    }

    // 2. 检查用户是否已存在
    if (userRepository.existsByPhone(request.getPhone())) {
        throw new UserAlreadyExistsException(request.getPhone());
    }

    // 3. 创建用户账号
    // 3.1 生成用户基础信息
    User user = User.builder()
            .phone(request.getPhone())
            .password(passwordEncoder.encode(request.getPassword()))
            .source(source)
            .build();
    // 3.2 持久化到数据库
    long userId = userRepository.save(user);

    // 4. 发送注册成功通知（异步，不阻塞主流程）
    notificationService.sendWelcomeMessageAsync(userId);

    return userId;
}
```

### 1.1 Java `record`

`record` 的组件（`id`、`email`）会隐式成为字段，需要在 Javadoc 里用 `@param` 描述：

```java
/**
 * 不可变的用户档案值对象。
 *
 * @param id    用户 ID
 * @param email 邮箱地址
 */
public record UserProfile(long id, String email) {}
```

### 1.2 Java `sealed` / `permits`

`sealed` 类用 Javadoc 写清"哪些子类被允许、为什么"，便于维护：

```java
/**
 * 支付结果基类：仅允许三种受控子类型，新增子类需在此显式 permits。
 *
 * <p>设计为 sealed 是为了在编译期阻止业务方新增未审核的支付结果分支。
 */
public sealed interface PaymentResult
        permits PaymentSuccess, PaymentFailure, PaymentPending {
}
```

### 1.3 Java text block（Java 13+）

text block 里的 `/** */`、`/* */` 不会与外层注释冲突，但写 Javadoc 引用代码示例时
仍建议避免出现裸的 `*/`，可用 Unicode 转义 `/*` 防止被误读：

```java
/**
 * 返回欢迎语模板。
 *
 * <p>模板包含一行 HTML：{@code <h1>hi /* 不当注释 */</h1>}
 *
 * @return 模板字符串
 */
public String welcomeHtml() {
    return """
            <h1>hi /* 这里是字符串内容，不会启动注释 */</h1>
            """;
}
```

## 二、Python：Google Style Docstring + 步骤编号注释

与上面 Java 版本等价的写法，docstring 固定为 `Args / Returns / Raises` 结构：

```python
def register_user(request: RegisterRequest, source: str) -> int:
    """校验并处理用户注册请求，完成账号创建与初始化。

    Args:
        request: 用户注册请求对象。
        source: 注册来源渠道（如 "app"、"web"）。

    Returns:
        创建成功的用户 ID。

    Raises:
        ValueError: 当手机号格式非法或密码强度不足时抛出。
        UserAlreadyExistsError: 当手机号已注册时抛出。
    """
    # 1. 参数校验
    # 1.1 校验手机号格式是否合法
    if not is_valid_phone(request.phone):
        raise ValueError(f"手机号格式非法: {request.phone}")
    # 1.2 校验密码强度是否符合要求
    if not is_strong_password(request.password):
        raise ValueError("密码强度不足")

    # 2. 检查用户是否已存在
    if user_repository.exists_by_phone(request.phone):
        raise UserAlreadyExistsError(request.phone)

    # 3. 创建用户账号
    # 3.1 生成用户基础信息
    user = User(
        phone=request.phone,
        password=hash_password(request.password),
        source=source,
    )
    # 3.2 持久化到数据库
    user_id = user_repository.save(user)

    # 4. 发送注册成功通知（异步，不阻塞主流程）
    notification_service.send_welcome_message_async(user_id)

    return user_id
```

### 2.1 Python `@dataclass`

`@dataclass` 字段同样需要在类 docstring 里用 `Attributes:` 列出：

```python
from dataclasses import dataclass


@dataclass
class UserProfile:
    """不可变的用户档案值对象。

    Attributes:
        id: 用户 ID。
        email: 邮箱地址。
    """

    id: int
    email: str
```

### 2.2 Python `async def`

异步函数的 docstring 结构和同步函数一致；调用方需要 `await`，这一点可以写在
摘要行里：

```python
async def fetch_user(user_id: int) -> User:
    """根据 ID 异步加载用户。

    Args:
        user_id: 用户 ID。

    Returns:
        加载到的用户对象。
    """
    ...
```

### 2.3 Python `@property`

`@property` 同样视为 public 方法，需要 docstring（用一行摘要即可）：

```python
@property
def is_active(self) -> bool:
    """账号是否处于激活状态。"""
    return self._status == Status.ACTIVE
```

### 2.4 Python 生成器 `Yields:`

生成器用 `Yields:` 代替 `Returns:`：

```python
def iter_active_users(page_size: int = 100) -> Iterator[User]:
    """分页遍历所有活跃用户。

    Args:
        page_size: 每页拉取的记录数。

    Yields:
        逐个产出的活跃用户对象。
    """
    ...
```

## 三、分支逻辑的编号方式

并列分支属于同一个大步骤时，用子编号，并在注释里点明分支条件：

```java
// 3. 根据支付方式分别处理
if (payType == PayType.WECHAT) {
    // 3.1 微信支付：调用微信统一下单接口
    ...
} else if (payType == PayType.ALIPAY) {
    // 3.2 支付宝支付：调用支付宝下单接口
    ...
}
```

## 四、类注释

Java 类说明职责、线程安全性与典型用法：

```java
/**
 * 用户注册与账号初始化服务。
 *
 * <p>本类无状态，方法均线程安全，可作为单例注入。
 *
 * <pre>{@code
 * long userId = userService.registerUser(request, "app");
 * }</pre>
 */
public class UserService {
    ...
}
```

Python 类用 `Attributes:` 列出公共属性：

```python
class UserService:
    """用户注册与账号初始化服务。

    本类无状态，方法均线程安全，可作为单例复用。

    Attributes:
        repository: 用户仓储，提供持久化能力。
        max_retry: 注册失败时的最大重试次数。
    """
```

## 五、TODO 与反面写法（❌ DO NOT COPY）

### 5.1 TODO 必须标注负责人

**正确写法**（要照抄这种）：

```java
// TODO(zhangsan): 支付超时后需要补充自动关单逻辑，预计 v2.3 版本处理
```

```python
# TODO(zhangsan): 支付超时后需要补充自动关单逻辑，预计 v2.3 版本处理
```

### 5.2 ❌ DO NOT COPY：无主 TODO

下面这段是**反面示例**，禁止写入代码；只用来识别违规 TODO。

```java
// ❌ DO NOT COPY: 没有负责人的 TODO，团队里没人会去处理
// TODO: 支付超时后需要补充自动关单逻辑
```

```python
# ❌ DO NOT COPY: 小写 todo + 没负责人
# todo: 支付超时后需要补充自动关单逻辑
```

### 5.3 ❌ DO NOT COPY：废话注释

下面这段是**反面示例**，禁止写入代码；只用来识别"复述代码本身"的废话注释。

```java
// ❌ DO NOT COPY: 注释只是把代码换种说法
int count = 0; // 将 count 初始化为 0
count++;       // count 加一
```

```python
# ❌ DO NOT COPY: 注释只是把代码换种说法
count = 0  # 将 count 初始化为 0
count += 1  # count 加一
```
