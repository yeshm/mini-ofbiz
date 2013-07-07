package common

import java.sql.Timestamp

import javax.servlet.http.HttpServletResponse

import net.sf.json.JSON
import net.sf.json.JSONObject
import net.sf.json.JsonConfig

import org.ofbiz.base.util.Debug
import org.ofbiz.base.util.UtilHttp
import org.ofbiz.entity.GenericValue
import org.ofbiz.example.JsonValueProcessor

public String jsonResponseFromRequestAttributes(){
	// pull out the service response from the request attribute
	Map<String, Object> attrMap = UtilHttp.getJSONAttributeMap(request);
	JsonConfig config = new JsonConfig();
	config.registerJsonValueProcessor(BigDecimal.class,new JsonValueProcessor());
	config.registerJsonValueProcessor(Timestamp.class,new JsonValueProcessor());
	
	// create a JSON Object for return
	JSONObject json = new JSONObject();
	
	if(attrMap.containsKey("_ERROR_MESSAGE_LIST_") || attrMap.containsKey("_ERROR_MESSAGE_")){
		json.put("result","error");
	}else{
		json.put("result","success");
	}
	json.put("data", JSONObject.fromObject(attrMap, config));
	
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
