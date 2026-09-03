// 最小复现：Javadoc 里出现字面量 /* ... */ 会被状态机误判为缺注释
/**
 * 演示 {@code /* foo */} 这种字面量。
 *
 * @return 无意义
 */
public class FakeBlock {
    /**
     * 方法的 Javadoc 中包含 {@code /* 字面块注释 */}，脚本不应误报。
     *
     * @return 无意义
     */
    public int method_with_fake_block() {
        return 42;
    }
}
