package org.miniofbiz.ext.constant;

import org.miniofbiz.ext.util.JsonUtil;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class QrCodeExportStatus {
    private static Map<String, String> map = new LinkedHashMap<String, String>();

    public static String NOT_EXPORT = "NOT_EXPORT";
    public static String EXPORTED = "EXPORTED";

    static {
        map = new LinkedHashMap<String, String>();
        map.put(NOT_EXPORT, "未导出");
        map.put(EXPORTED, "已导出");
    }

    public static String getDesc(String id) {
        return map.get(id);
    }

    public static String toJson() {
        return JsonUtil.toJson(map);
    }

    public static Map getMap() {
        return map;
    }

    public static Map getMap(String... ids) {
        Map<String, String> newMap = new LinkedHashMap<String, String>(map);
        List<String> keys = Arrays.asList(ids);
        newMap.keySet().retainAll(keys);

        return newMap;
    }

    public static String toJson(String... ids) {
        Map<String, String> newMap = getMap(ids);

        return JsonUtil.toJson(newMap);
    }
}
