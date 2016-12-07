package org.miniofbiz.ext.util;

import com.github.stuxuhai.jpinyin.PinyinException;
import com.github.stuxuhai.jpinyin.PinyinFormat;
import com.github.stuxuhai.jpinyin.PinyinHelper;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang.StringUtils;
import org.htmlparser.Node;
import org.htmlparser.NodeFilter;
import org.htmlparser.Parser;
import org.htmlparser.nodes.TextNode;
import org.htmlparser.util.NodeList;
import org.htmlparser.util.SimpleNodeIterator;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.StringUtil;
import org.ofbiz.base.util.UtilProperties;
import org.ofbiz.base.util.UtilValidate;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.text.Collator;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class ExtStringUtil {

    /**
     * 从资源文件取模板渲染
     *
     * @param resource   资源文件
     * @param name       资源名称
     * @param parameters 参数
     * @return
     */
    public static String renderTemplate(String resource, String name, Map<String, Object> parameters) {
        String template = UtilProperties.getPropertyValue(resource, name);
        return renderTemplate(template, parameters);
    }

    /**
     * 模板渲染
     *
     * @param template   模板
     * @param parameters 参数
     * @return
     */
    public static String renderTemplate(String template, Map<String, Object> parameters) {
        if (UtilValidate.isNotEmpty(template)) {
            for (String key : parameters.keySet()) {
                Object val = parameters.get(key);
                if (UtilValidate.isEmpty(val)) continue;

                if (val instanceof String || val instanceof Number || val instanceof Boolean) {
                    val = val.toString();
                    template = template.replaceAll("\\$\\{" + key + "\\}", val == null ? "" : (String) val);
                }
            }
            return template;
        }
        return template;
    }

    // 富文本转纯文本
    public static String onlyText(String inputHtml) {
        try {
            StringBuffer text = new StringBuffer();
            Parser parser = Parser.createParser(inputHtml, "utf-8");
            // 遍历所有的节点
            NodeList nodes = parser.extractAllNodesThatMatch(new NodeFilter() {
                public boolean accept(Node node) {
                    if (node instanceof TextNode) {// 只取text的
                        return true;
                    }
                    return false;
                }
            });
            SimpleNodeIterator it = nodes.elements();
            while (it.hasMoreNodes()) {
                Node curr = it.nextNode();
                text.append(curr.toPlainTextString());
            }
            return text.toString();
        } catch (Exception e) {
            return inputHtml;
        }
    }

    /**
     * 截取指定长度的字符串
     *
     * @param originalText
     * @param length
     * @return
     */
    public static String getTextSummary(String originalText, int length) {
        if (StringUtils.isNotEmpty(originalText) && originalText.length() > length) {
            return StringUtils.substring(originalText, 0, length);
        }
        return originalText;
    }

    /**
     * 截取指定长度的字符串
     *
     * @param originalText
     * @param length
     * @param omitString
     * @return
     */
    public static String getTextSummary(String originalText, int length, String omitString) {
        if (StringUtils.isNotEmpty(originalText) && originalText.length() > length) {
            return StringUtils.substring(originalText, 0, length) + omitString;
        }
        return originalText;
    }

    /**
     * 获取富文本概要信息
     *
     * @param originalText
     * @param length
     * @return
     */
    public static String getContentSummary(String originalText, int length) {
        return getTextSummary(onlyText(originalText), length);
    }

    public static String decodeBase64(String original, String charset) {
        String charsetName = StringUtils.isNotEmpty(charset) ? charset : "utf-8";
        if (StringUtils.isNotEmpty(original)) {
            String string = "";
            try {
                string = new String(Base64.decodeBase64(original), charsetName);
            } catch (UnsupportedEncodingException e) {
                string = original;
            }
            return string;
        }
        return original;
    }

    /**
     * 掩盖字符串的一部分
     */
    public static String maskString(String originalText, int start, int length) {
        return maskString(originalText, start, length, "*");
    }

    /**
     * 掩盖字符串的一部分
     */
    public static String maskString(String originalText, int start, int length, String maskString) {
        if (UtilValidate.isWhitespace(originalText) || start < 0 || length < 1) return originalText;

        if (start > (originalText.length() - 1)) return originalText;

        StringBuffer sb = new StringBuffer();
        if (start > 0) {
            sb.append(originalText.substring(0, start));
        }

        int maskLength = ((start + length) > originalText.length()) ? (originalText.length() - start) : length;
        for (int i = 0; i < maskLength; i++) {
            sb.append(maskString);
        }

        if ((start + length) < originalText.length()) {
            sb.append(originalText.substring(start + length, originalText.length()));
        }

        return sb.toString();
    }

    public static String shortUUID() {
        UUID uuid = UUID.randomUUID();
        long l = ByteBuffer.wrap(uuid.toString().getBytes()).getLong();
        return Long.toString(l, Character.MAX_RADIX);
    }

    /**
     * \r\n清理
     */
    public static StringUtil.StringWrapper replaceNewlines(String str) {
        if (UtilValidate.isWhitespace(str)) return StringUtil.wrapString(str);

        Pattern p = Pattern.compile("\r|\n");
        Matcher m = p.matcher(str);
        String des = m.replaceAll("");

        return StringUtil.wrapString(des);
    }

    /**
     * 在字符串中插入字符
     */
    public static String insertToString(String originalText, String insertString) {
        return insertToString(originalText, insertString, 1, -1);
    }

    /**
     * 在字符串中插入字符
     */
    public static String insertToString(String originalText, String insertString, int length) {
        return insertToString(originalText, insertString, length, -1);
    }

    /**
     * 在字符串中插入字符
     */
    public static String insertToString(String originalText, String insertString, int length, int count) {
        if (UtilValidate.isWhitespace(originalText)) return originalText;

        int insertCount = 0;
        StringBuffer sb = new StringBuffer();
        while (insertCount * length < originalText.length()) {
            if (insertCount > 0) sb.append(insertString);
            insertCount++;

            int start = (insertCount - 1) * length;

            if (insertCount * length > originalText.length() || insertCount - 1 == count) {
                sb.append(originalText.substring(start, originalText.length()));
                return sb.toString();
            } else {
                sb.append(originalText.substring(start, start + length));
            }
        }

        return sb.toString();
    }

    //去掉左边N个字符
    public static String getSubLeftString(String originalText, int count) {
        if (UtilValidate.isWhitespace(originalText)) {
            return null;
        }
        if (originalText.length() < count) {
            Debug.logError("去掉的字符长度过长!", "");
        } else {
            return originalText.substring(count);
        }
        return null;
    }

    //去掉右边N个字符
    public static String getSubRightString(String originalText, int count) {
        if (UtilValidate.isWhitespace(originalText)) {
            return null;
        }
        if (originalText.length() < count) {
            Debug.logError("去掉的字符长度过长!", "");
        } else {
            return originalText.substring(0, originalText.length() - count);
        }
        return null;
    }

    //获取中间N个字符
    public static String getMiddleString(String originalText, int trimLeftCount, int trimRightCount) {
        if (UtilValidate.isWhitespace(originalText)) {
            return null;
        }
        if (originalText.length() < (trimLeftCount + trimRightCount)) {
            Debug.logError("去掉的字符长度过长!", "");
        } else {
            String subLeftString = getSubLeftString(originalText, trimLeftCount);
            return getSubRightString(subLeftString, trimRightCount);
        }
        return null;
    }


    /**
     * 阿拉伯数字和汉字之间进行转换
     */
    public static String transNum2Chinese(int num) {
        String[] NUMS = {"零", "一", "二", "三", "四", "五", "六", "七", "八", "九"};
        return NUMS[num];
    }


    /**
     * 根据汉语拼音首字母进行排序(A-Z)
     */
    public static List<String> getStringListOrderByPinyinAsc(List<String> stringList) {
        if (UtilValidate.isEmpty(stringList)) {
            return null;
        }

        Comparator<Object> comparator = Collator.getInstance(Locale.CHINA);
        Collections.sort(stringList, comparator);

        return stringList;
    }

    /**
     * 获取汉字首字母(大写)
     */
    public static String getStringFirstChar(String str) throws PinyinException {
        if (UtilValidate.isEmpty(str)) {
            return null;
        }

        String strPinyin = PinyinHelper.convertToPinyinString(str, "", PinyinFormat.WITHOUT_TONE);
        char[] strPinyinChars = strPinyin.toCharArray();

        return Character.toUpperCase(strPinyinChars[0]) + "";
    }
}