package org.ofbiz.example.user

import org.ofbiz.base.util.UtilHttp
import org.ofbiz.base.util.UtilMisc
import org.ofbiz.entity.Delegator
import org.ofbiz.service.LocalDispatcher

import javax.servlet.http.HttpServletRequest

public String grid(){
	Delegator delegator = request.getAttribute("delegator");
	LocalDispatcher dispatcher = request.getAttribute("dispatcher");
    HttpServletRequest request = request;
	
	def requestParameters = UtilHttp.getParameterMap(request);
    def viewIndex = Integer.valueOf(requestParameters.pageIndex);
    def viewSize = Integer.valueOf(requestParameters.limit);

    def result = dispatcher.runSync("performFindPage", [
            inputFields : requestParameters,
            entityName : "PersonAndType",
            noConditionFind : "Y",
            orderBy : "personId",
            viewIndex : viewIndex,
            viewSize : viewSize,
            timeZone : timeZone
    ]);

    request.setAttribute("result", result);

	return "success";
}

public String get(){
	def person = delegator.findByPrimaryKeyCache("Person", UtilMisc.toMap("personId", parameters.personId));
	request.setAttribute("person", person);
	return "success";
}

