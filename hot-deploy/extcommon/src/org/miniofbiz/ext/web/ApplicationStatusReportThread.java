package org.miniofbiz.ext.web;

import org.miniofbiz.ext.util.ExtUtilDateTime;
import org.miniofbiz.ext.util.JsonUtil;
import org.ofbiz.base.start.Start;
import org.ofbiz.base.util.UtilDateTime;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.base.util.cache.UtilCache;
import org.ofbiz.entity.connection.DBCPConnectionFactory;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeSet;

public class ApplicationStatusReportThread extends Thread {

    private static final String MAPPING_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSZZ";
    private static final String lineSeparator = System.getProperty("line.separator");
    private static final String fileName = System.getProperty("ofbiz.home") + "/runtime/logs/status.log";

    public void run() {
        while (Start.getInstance().getCurrentState() != Start.ServerState.STOPPING) {
            try {
                BufferedWriter out = new BufferedWriter(new FileWriter(fileName, true));

                String data = getData();

                out.write(data);
                out.close();

                Thread.sleep(10 * 1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public static String getData() {

        StringBuilder sb = new StringBuilder();

        Map status = new HashMap<>();

        //memory
        double totalCacheMemory = 0.0;
        TreeSet<String> names = new TreeSet(UtilCache.getUtilCacheTableKeySet());
        for (String cacheName : names) {
            UtilCache utilCache = UtilCache.findCache(cacheName);
            totalCacheMemory += utilCache.getSizeInBytes();
        }

        Runtime rt = Runtime.getRuntime();
        Map memoryInfo = new HashMap<>();
        memoryInfo.put("totalMemory", rt.totalMemory());
        memoryInfo.put("freeMemory", rt.freeMemory());
        memoryInfo.put("usedMemory", (rt.totalMemory() - rt.freeMemory()));
        memoryInfo.put("maxMemory", rt.maxMemory());
        memoryInfo.put("totalCacheMemory", totalCacheMemory);
        status.put("memory", memoryInfo);

        //connectionPool
        Map dataSourceInfo = DBCPConnectionFactory.getDataSourceInfo("localpostnew");
        Map connectionPool = new HashMap<>();
        if (UtilValidate.isNotEmpty(dataSourceInfo)) {
            connectionPool.put("numActive", dataSourceInfo.get("poolNumActive"));
            connectionPool.put("numIdle", dataSourceInfo.get("poolNumIdle"));
            connectionPool.put("numTotal", dataSourceInfo.get("poolNumTotal"));
            connectionPool.put("maxActive", dataSourceInfo.get("poolMaxActive"));
            connectionPool.put("maxIdle", dataSourceInfo.get("poolMaxIdle"));
            connectionPool.put("minIdle", dataSourceInfo.get("poolMinIdle"));
            connectionPool.put("minEvictableIdleTimeMillis", dataSourceInfo.get("poolMinEvictableIdleTimeMillis"));
            connectionPool.put("maxWait", dataSourceInfo.get("poolMaxWait"));
        }
        status.put("connectionPool", connectionPool);

        status.put("@timestamp", ExtUtilDateTime.formatDate2String(UtilDateTime.nowTimestamp(), MAPPING_DATE_TIME_FORMAT));

        sb.append(JsonUtil.toJson(status));
        sb.append(lineSeparator);

        return sb.toString();
    }
}