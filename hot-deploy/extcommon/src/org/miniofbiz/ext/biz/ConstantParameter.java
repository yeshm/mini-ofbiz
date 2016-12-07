package org.miniofbiz.ext.biz;


public class ConstantParameter {
    public static final int DEFAULT_GRID_PAGE_SIZE = 30;//默认分页大小
    public static final int DEFAULT_SIMPLE_PAGE_SIZE = 10;//默认简单分页大小
    public static final double DEFAULT_LBS_DISTANCE = 1000;// 默认LBS查询范围
    public static final int RANDOM_RANGE = 9999999;// 随机数范围

    public static final String NA = "_NA_";//Not Applicable 不适用，多见于非空字段的无适用值时的取代，比如说汽车的参数中有火花塞的相关参数，那么对于柴油汽车就是“不适用”的，因为柴油发动机是压燃结构，没有火花塞
}