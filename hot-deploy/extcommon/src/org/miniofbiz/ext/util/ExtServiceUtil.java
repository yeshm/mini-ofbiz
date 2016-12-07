package org.miniofbiz.ext.util;

import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilGenerics;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.service.ModelService;
import org.ofbiz.service.ServiceUtil;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

public class ExtServiceUtil extends ServiceUtil {

	/**
	 * 专门供调用service异常时使用
	 * @param request
	 * @param result
	 */
    public static void getMessages(HttpServletRequest request, Map<String, Object> result) {
        String errorMsg = (String) result.get(ModelService.ERROR_MESSAGE);
        List<? extends Object> errorMsgList = UtilGenerics.checkList(result.get(ModelService.ERROR_MESSAGE_LIST));
        Map<String, ? extends Object> errorMsgMap = UtilGenerics.checkMap(result.get(ModelService.ERROR_MESSAGE_MAP));
        if(ExtUtilValidate.isEmpty(errorMsg) && ExtUtilValidate.isEmpty(errorMsgList) && ExtUtilValidate.isEmpty(errorMsgMap)){
            result.put(ModelService.ERROR_MESSAGE, "系统异常");
        }

        getMessages(request, result, null, null, null, null, null, null, null);
    }

    /**
     * service耗时调试使用，开始
     */
    public static void logSpendTimeStart(Map parameters) {
        Long starTime = System.currentTimeMillis();
        parameters.put("starTime", starTime);
    }

    /**
     * service耗时调试使用，过程中
     * @param parameters service参数
     * @param tag 标记
     */
    public static void logSpendTime(Map parameters, String tag) {
        Long starTime = (Long) parameters.get("starTime");
        if(UtilValidate.isEmpty(starTime)){
            Debug.logInfo("starTime is empty when logSpendTime, tag:" + tag, module);
        }

        Long logTime = System.currentTimeMillis();
        Debug.logInfo("spend ["+ (logTime - starTime) +"] milliseconds, tag:"+tag, module);
    }
}
