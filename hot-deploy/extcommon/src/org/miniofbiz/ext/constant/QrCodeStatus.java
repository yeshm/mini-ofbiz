package org.miniofbiz.ext.constant;

import org.miniofbiz.ext.util.JsonUtil;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class QrCodeStatus {

    private static Map<String, String> map = new LinkedHashMap<String, String>();

    public static String UNBOUND = "QR_CODE_UNBOUND";
    public static String BOUND = "QR_CODE_BOUND";
    public static String DELETED = "QR_CODE_DELETED";

    static {
        map = new LinkedHashMap<String, String>();
        map.put(UNBOUND, "未绑定");
        map.put(BOUND, "已绑定");
        map.put(DELETED, "已废除");
    }

    /**
     * 获取描述
     */
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
