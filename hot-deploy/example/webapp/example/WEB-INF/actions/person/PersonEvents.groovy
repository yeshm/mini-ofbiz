package person

import org.ofbiz.base.util.UtilHttp;
import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.entity.Delegator;

public String list(){
	def svcCtx = [:];
	svcCtx.put("message", "5555");
	//def svcResult = dispatcher.runSync("serviceGroupOne",svcCtx);
	//svcResult = dispatcher.runSync("serviceTwo",svcCtx);
	//svcResult = dispatcher.runSync("serviceThree",svcCtx);
	
	//def delegator = request.getAttribute("delegator");
	//request.setAttribute("svcResult", svcResult);
	
	Delegator delegator = request.getAttribute("delegator");
	
	request.setAttribute("delegator", delegator);
	
	String s = "sbdasd";
	println "hsdfasdfafs";
	return "success";
}

public String get(){
	def person = delegator.findByPrimaryKeyCache("Person", UtilMisc.toMap("personId", parameters.personId));
	request.setAttribute("person", person);
	return "success";
}

