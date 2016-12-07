package org.miniofbiz.ext.util;

/**
 * 地理位置助手类
 */
public class LocationUtil {

    static double DEF_PI = 3.14159265359; // PI
    static double DEF_2PI = 6.28318530712; // 2*PI
    static double DEF_PI180 = 0.01745329252; // PI/180.0
    static double DEF_R = 6370693.5; // radius of earth

    //获取短距离使用
    public static double getShortDistance(double lon1, double lat1, double lon2, double lat2) {
        double ew1, ns1, ew2, ns2;
        double dx, dy, dew;
        double distance;

        // 角度转换为弧度
        ew1 = lon1 * DEF_PI180;
        ns1 = lat1 * DEF_PI180;
        ew2 = lon2 * DEF_PI180;
        ns2 = lat2 * DEF_PI180;
        // 经度差
        dew = ew1 - ew2;
        // 若跨东经和西经180 度，进行调整
        if (dew > DEF_PI)
            dew = DEF_2PI - dew;
        else if (dew < -DEF_PI)
            dew = DEF_2PI + dew;
        dx = DEF_R * Math.cos(ns1) * dew; // 东西方向长度(在纬度圈上的投影长度)
        dy = DEF_R * (ns1 - ns2); // 南北方向长度(在经度圈上的投影长度)
        // 勾股定理求斜边长
        distance = Math.sqrt(dx * dx + dy * dy);
        return distance;
    }

    public static double getShortDistance(String lon1, String lat1, String lon2, String lat2) {
        return getShortDistance(Double.valueOf(lon1), Double.valueOf(lat1), Double.valueOf(lon2), Double.valueOf(lat2));
    }

    //获取远距离使用
    public static double getLongDistance(double lon1, double lat1, double lon2, double lat2) {
        double ew1, ns1, ew2, ns2;
        double distance;
        // 角度转换为弧度
        ew1 = lon1 * DEF_PI180;
        ns1 = lat1 * DEF_PI180;
        ew2 = lon2 * DEF_PI180;
        ns2 = lat2 * DEF_PI180;
        // 求大圆劣弧与球心所夹的角(弧度)
        distance = Math.sin(ns1) * Math.sin(ns2) + Math.cos(ns1) * Math.cos(ns2) * Math.cos(ew1 - ew2);
        // 调整到[-1..1]范围内，避免溢出
        if (distance > 1.0)
            distance = 1.0;
        else if (distance < -1.0)
            distance = -1.0;
        // 求大圆劣弧长度
        distance = DEF_R * Math.acos(distance);
        return distance;
    }

    public static double getLongDistance(String lon1, String lat1, String lon2, String lat2) {
        return getLongDistance(Double.valueOf(lon1), Double.valueOf(lat1), Double.valueOf(lon2), Double.valueOf(lat2));
    }

    /**
     * google maps的脚本里代码
     *//*
    private static double EARTH_RADIUS = 6378.137;

    private static double rad(double d) {
        return d * Math.PI / 180.0;
    }

    *//**
     * 根据两点间经纬度坐标（string值），计算两点间距离，单位为米
     *//*
    public static double getDistance(String lngFrom, String latFrom, String lngTo, String latTo) {
        return getDistance(Double.valueOf(lngFrom), Double.valueOf(latFrom), Double.valueOf(lngTo), Double.valueOf(latTo));
    }

    *//**
     * 根据两点间经纬度坐标（double值），计算两点间距离，单位为米
     *//*
    public static double getDistance(double lngFrom, double latFrom, double lngTo, double latTo) {
        double radLat1 = rad(latFrom);
        double radLat2 = rad(latTo);
        double a = radLat1 - radLat2;
        double b = rad(lngFrom) - rad(lngTo);
        double s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
                Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * EARTH_RADIUS;
        s = Math.round(s * 10000) / 10000;
        return s;
    }*/
}
