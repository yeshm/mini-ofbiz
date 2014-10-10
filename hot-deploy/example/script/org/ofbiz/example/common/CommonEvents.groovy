package org.ofbiz.example.common

import javolution.util.FastList
import net.sf.json.JSONArray
import org.ofbiz.base.util.UtilValidate

import java.sql.Timestamp

import javax.servlet.http.HttpServletResponse

import net.sf.json.JSON
import net.sf.json.JSONObject
import net.sf.json.JsonConfig

import org.ofbiz.base.util.Debug
import org.ofbiz.base.util.UtilHttp
import org.ofbiz.entity.GenericValue
import org.ofbiz.example.JsonValueProcessor

public String jsonResponseFromRequestAttributes() {
    List<String> skipRequestAttributeKeys = FastList.newInstance();
    skipRequestAttributeKeys.add("_CONTEXT_ROOT_");
    skipRequestAttributeKeys.add("_CONTROL_PATH_");
    skipRequestAttributeKeys.add("_ERROR_MESSAGE_");
    skipRequestAttributeKeys.add("_FORWARDED_FROM_SERVLET_");
    skipRequestAttributeKeys.add("_SERVER_ROOT_URL_");
    skipRequestAttributeKeys.add("javax.servlet.request.cipher_suite");
    skipRequestAttributeKeys.add("javax.servlet.request.key_size");
    skipRequestAttributeKeys.add("javax.servlet.request.ssl_session");
    skipRequestAttributeKeys.add("javax.servlet.request.ssl_session_id");
    skipRequestAttributeKeys.add("multiPartMap");
    skipRequestAttributeKeys.add("targetRequestUri");
    skipRequestAttributeKeys.add("thisRequestUri");

    // pull out the service response from the request attribute
    Map<String, Object> attrMap = UtilHttp.getJSONAttributeMap(request);
    JsonConfig config = new JsonConfig();
    config.registerJsonValueProcessor(BigDecimal.class, new JsonValueProcessor());
    config.registerJsonValueProcessor(Timestamp.class, new JsonValueProcessor());

    // create a JSON Object for return
    JSONObject json = new JSONObject();

    if (attrMap.containsKey("_ERROR_MESSAGE_LIST_") || attrMap.containsKey("_ERROR_MESSAGE_")) {
        json.put("result", "error");
        if(attrMap.containsKey("_ERROR_MESSAGE_LIST_")){
            def messageList = attrMap.get("_ERROR_MESSAGE_LIST_") as List;
            json.put("msg", messageList.join(","));
        }else{
            json.put("msg", attrMap.get("_ERROR_MESSAGE_"));
        }
    } else {
        json.put("result", "success");
    }
    for(String k : skipRequestAttributeKeys){
        attrMap.remove(k);
    }
    json.put("data", JSONObject.fromObject(attrMap, config));

    writeJSONtoResponse(json, response);

    return "success";
}

public String gridResponseFromRequestAttributes() {
    // pull out the service response from the request attribute
    Map<String, Object> attrMap = UtilHttp.getJSONAttributeMap(request);
    JsonConfig config = new JsonConfig();
    config.registerJsonValueProcessor(BigDecimal.class, new JsonValueProcessor());
    config.registerJsonValueProcessor(Timestamp.class, new JsonValueProcessor());

    // create a JSON Object for return
    JSONObject json = new JSONObject();
    Map<String, Object> result = attrMap.get("result");

    if (attrMap.containsKey("_ERROR_MESSAGE_LIST_") || attrMap.containsKey("_ERROR_MESSAGE_") || UtilValidate.isEmpty(result)) {
        json.put("result", "error");
    } else {
        json.put("rows", JSONArray.fromObject(result.get("list"), config));
        json.put("results", result.get("listSize"));
    }

    writeJSONtoResponse(json, response);

    return "success";
}

private static void writeJSONtoResponse(JSON json, HttpServletResponse response) {
    String jsonStr = json.toString();
    if (jsonStr == null) {
        Debug.logError("JSON Object was empty; fatal error!", CommonEvents.getClass().name);
        return;
    }

    // set the X-JSON content type
    response.setContentType("application/x-json");
    // jsonStr.length is not reliable for unicode characters
    try {
        response.setContentLength(jsonStr.getBytes("UTF8").length);
    } catch (UnsupportedEncodingException e) {
        Debug.logError("Problems with Json encoding: " + e, CommonEvents.getClass().name);
    }

    // return the JSON String
    Writer out;
    try {
        out = response.getWriter();
        out.write(jsonStr);
        out.flush();
    } catch (IOException e) {
        Debug.logError(e, CommonEvents.getClass().name);
    }
}
