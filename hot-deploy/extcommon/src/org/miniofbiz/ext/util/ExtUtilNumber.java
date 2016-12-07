package org.miniofbiz.ext.util;

import org.ofbiz.base.util.UtilNumber;

import java.math.BigDecimal;

public class ExtUtilNumber extends UtilNumber {

    public static int decimals = getBigDecimalScale("finaccount.decimals");
    public static int rounding = getBigDecimalRoundingMode("finaccount.rounding");
    public static int downDecimals = getBigDecimalScale("halfdown.decimals");
    public static int downRounding = getBigDecimalRoundingMode("halfdown.rounding");
    public static int roundDownDecimals = getBigDecimalScale("roundDown.decimals");
    public static int roundDownRounding = getBigDecimalRoundingMode("roundDown.rounding");
    public static int upDecimals = getBigDecimalScale("roundup.decimals");
    public static int upRounding = getBigDecimalRoundingMode("roundup.rounding");
    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(decimals, rounding);
    public static final BigDecimal ONE = BigDecimal.ONE.setScale(decimals, rounding);

    // 加法
    private static BigDecimal addBase(Object a, Object b, int decimals, int rounding) throws RuntimeException {
        BigDecimal add1 = conversionToBigDecimal(a);
        BigDecimal add2 = conversionToBigDecimal(b);
        BigDecimal result = add1.add(add2).setScale(decimals, rounding);
        return result;
    }

    // 减法
    private static BigDecimal subtractBase(Object a, Object b, int decimals, int rounding) throws RuntimeException {
        BigDecimal subtract1 = conversionToBigDecimal(a);
        BigDecimal subtract2 = conversionToBigDecimal(b);
        BigDecimal result = subtract1.subtract(subtract2).setScale(decimals, rounding);
        return result;
    }

    // 乘法
    private static BigDecimal multiplyBase(Object a, Object b, int decimals, int rounding) throws RuntimeException {
        BigDecimal multiply1 = conversionToBigDecimal(a);
        BigDecimal multiply2 = conversionToBigDecimal(b);
        BigDecimal result = multiply1.multiply(multiply2).setScale(decimals, rounding);
        return result;
    }

    // 除法
    private static BigDecimal divideBase(Object a, Object b, int decimals, int rounding) throws RuntimeException {
        BigDecimal divide1 = conversionToBigDecimal(a);
        BigDecimal divide2 = conversionToBigDecimal(b);
        BigDecimal result = divide1.divide(divide2, decimals, rounding);
        return result;
    }

    // 精度截取
    private static BigDecimal transBase(Object a, int decimals, int rounding) throws RuntimeException {
        BigDecimal result = conversionToBigDecimal(a).setScale(decimals, rounding);
        return result;
    }

    // 类型转换
    private static BigDecimal conversionToBigDecimal(Object obj) throws RuntimeException {
        if (obj instanceof Double) {
            return new BigDecimal(obj.toString());
        } else if (obj instanceof Float) {
            return new BigDecimal(obj.toString());
        } else if (obj instanceof Integer) {
            return new BigDecimal(obj.toString());
        } else if (obj instanceof Long) {
            return new BigDecimal(obj.toString());
        } else if (obj instanceof Byte) {
            return new BigDecimal(obj.toString());
        } else if (obj instanceof Short) {
            return new BigDecimal(obj.toString());
        } else if (obj instanceof String) {
            return new BigDecimal(obj.toString());
        } else if (obj instanceof BigDecimal) {
            return (BigDecimal) obj;
        } else {
            throw new RuntimeException("不能转换");
        }
    }


    // 进位加法
    public static BigDecimal add(Object a, Object b) throws RuntimeException {
        return addBase(a, b, decimals, rounding);
    }

    // 进位减法
    public static BigDecimal subtract(Object a, Object b) throws RuntimeException {
        return subtractBase(a, b, decimals, rounding);
    }

    // 进位乘法
    public static BigDecimal multiply(Object a, Object b) throws RuntimeException {
        return multiplyBase(a, b, decimals, rounding);
    }

    // 进位除法
    public static BigDecimal divide(Object a, Object b) throws RuntimeException {
        return divideBase(a, b, decimals, rounding);
    }

    // 进位截取
    public static BigDecimal trans(Object a) throws RuntimeException {
        return transBase(a, decimals, rounding);
    }

    // 舍位加法
    public static BigDecimal addDown(Object a, Object b) throws RuntimeException {
        return addBase(a, b, downDecimals, downRounding);
    }

    // 舍位减法
    public static BigDecimal subtractDown(Object a, Object b) throws RuntimeException {
        return subtractBase(a, b, downDecimals, downRounding);
    }

    // 舍位乘法
    public static BigDecimal multiplyDown(Object a, Object b) throws RuntimeException {
        return multiplyBase(a, b, downDecimals, downRounding);
    }

    // 舍位除法
    public static BigDecimal divideDown(Object a, Object b) throws RuntimeException {
        return divideBase(a, b, downDecimals, downRounding);
    }

    // 向上取整加法
    public static BigDecimal addUp(Object a, Object b) throws RuntimeException {
        return addBase(a, b, upDecimals, upRounding);
    }

    // 向上取整减法
    public static BigDecimal subtractUp(Object a, Object b) throws RuntimeException {
        return subtractBase(a, b, upDecimals, upRounding);
    }

    // 向上取整乘法
    public static BigDecimal multiplyUp(Object a, Object b) throws RuntimeException {
        return multiplyBase(a, b, upDecimals, upRounding);
    }

    // 向上取整除法
    public static BigDecimal divideUp(Object a, Object b) throws RuntimeException {
        return divideBase(a, b, upDecimals, upRounding);
    }

    // 向上取整截取
    public static BigDecimal transUp(Object a) throws RuntimeException {
        return transBase(a, upDecimals, upRounding);
    }


    // 向下取整加法
    public static BigDecimal addDownInt(Object a, Object b) throws RuntimeException {
        return addBase(a, b, roundDownDecimals, roundDownRounding);
    }

    // 向下取整减法
    public static BigDecimal subtractDownInt(Object a, Object b) throws RuntimeException {
        return subtractBase(a, b, roundDownDecimals, roundDownRounding);
    }

    // 向下取整乘法
    public static BigDecimal multiplyDownInt(Object a, Object b) throws RuntimeException {
        return multiplyBase(a, b, roundDownDecimals, roundDownRounding);
    }

    // 向下取整除法
    public static BigDecimal divideDownInt(Object a, Object b) throws RuntimeException {
        return divideBase(a, b, roundDownDecimals, roundDownRounding);
    }

    // 向下取整截取
    public static BigDecimal transDownInt(Object a) throws RuntimeException {
        return transBase(a, roundDownDecimals, roundDownRounding);
    }
}