// 最小复现：Java text block 里的 /** */ 应被识别为字符串内容，
// 而非 Javadoc。修复前 fake_method 会被误识别为方法并报 missing-doc；
// 修复后 fake_method 不应出现在结果中。
public class TextBlockDemo {
    private static final String TEMPLATE = """
        /**
         * 这看起来像 Javadoc 但其实是字符串内容，
         * 还会 "嵌套 /* 块注释 */ 假装成多行注释。
         */
        public int fake_method(int x) {
            if (x > 0) {
                return x;
            }
            return -x;
        }
        """;

    /**
     * 真正的方法，有 Javadoc，应当通过校验。
     *
     * @param x 输入
     * @return x 的两倍
     */
    public int real_method(int x) {
        return x * 2;
    }
}
