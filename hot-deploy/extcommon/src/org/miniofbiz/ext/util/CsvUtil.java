package org.miniofbiz.ext.util;

import javolution.util.FastList;
import javolution.util.FastMap;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.entity.GenericValue;
import org.ofbiz.service.ServiceUtil;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Map;

public class CsvUtil {
    //解释csv文件
    public static BufferedReader explainCsvFileToBuff(InputStream inputStream) throws Exception {
        if (UtilValidate.isEmpty(inputStream))
            return null;
        BufferedReader br = new BufferedReader(new InputStreamReader(inputStream, "GBK"));
        return br;
    }

    //解释csv行
    public static String[] getCsvLineInfo(String line) {
        if (UtilValidate.isWhitespace(line)) return null;
        return line.split(",");
    }

    //行信息和配置信息配对
    public static Map<String, Object> pairCsvLineInfoAndConfig(String[] lineInfoArray, List<GenericValue> dataConfigList) {
        if (UtilValidate.isEmpty(lineInfoArray)) return null;
        if (UtilValidate.isEmpty(dataConfigList)) return null;

        if (lineInfoArray.length != dataConfigList.size()) {
            return ServiceUtil.returnError("行信息的数量和配置的数量不一致");
        }

        FastMap lineInfo = FastMap.newInstance();
        for (int i = 0; i < dataConfigList.size(); i++) {
            GenericValue dataConfig = dataConfigList.get(i);
            String cellName = dataConfig.getString("cellName");
            String tmpLineInfo = lineInfoArray[i].replaceAll("\t", "");
            tmpLineInfo = tmpLineInfo.replaceAll("\"", "");
            tmpLineInfo = tmpLineInfo.replaceAll("\'", "").trim();
            lineInfo.put(cellName, tmpLineInfo);
        }

        if (UtilValidate.isEmpty(lineInfo)) return null;

        Map results = ServiceUtil.returnSuccess();
        results.put("dataMap", lineInfo);

        return results;
    }


    public static Map<String, Object> explainCsvFile(InputStream inputStream, List<GenericValue> dataConfigList) throws Exception {
        if (UtilValidate.isEmpty(inputStream)) return null;
        if (UtilValidate.isEmpty(dataConfigList)) return null;

        BufferedReader br = CsvUtil.explainCsvFileToBuff(inputStream);
        if (UtilValidate.isEmpty(br)) {
            return null;
        }

        String comment = "";
        FastList lineInfoList = FastList.newInstance();
        try {
            String line;
            int lineNum = 0;
            while ((line = br.readLine()) != null) {
                lineNum++;
                if (1 == lineNum) {
                    continue;
                }
                Debug.logError("line_%s", "", line);
                Map results = pairCsvLineInfoAndConfig(getCsvLineInfo(line), dataConfigList);
                if (!ServiceUtil.isSuccess(results)) {
                    StringBuffer commentBf = new StringBuffer();
                    commentBf.append("第");
                    commentBf.append(lineNum);
                    commentBf.append("行出错.出错原因：");
                    commentBf.append(ServiceUtil.getErrorMessage(results));
                    comment = commentBf.toString();

                    return ServiceUtil.returnError(comment);
                }
                lineInfoList.add(results);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        if (UtilValidate.isNotEmpty(lineInfoList)) {
            Map results = ServiceUtil.returnSuccess();
            results.put("lineInfoList", lineInfoList);

            return results;
        }
        return ServiceUtil.returnError("空数据");
    }
}