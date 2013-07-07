package org.ofbiz.example.common

import javolution.util.FastList
import javolution.util.FastMap

import org.ofbiz.base.util.Debug
import org.ofbiz.base.util.UtilGenerics
import org.ofbiz.base.util.UtilMisc
import org.ofbiz.base.util.UtilProperties
import org.ofbiz.base.util.UtilValidate
import org.ofbiz.common.FindServices
import org.ofbiz.entity.Delegator
import org.ofbiz.entity.GenericEntityException
import org.ofbiz.entity.GenericValue
import org.ofbiz.entity.condition.EntityCondition
import org.ofbiz.entity.condition.EntityConditionList
import org.ofbiz.entity.condition.EntityOperator
import org.ofbiz.entity.util.EntityFindOptions
import org.ofbiz.entity.util.EntityListIterator
import org.ofbiz.example.EntityConditionWorker
import org.ofbiz.service.DispatchContext
import org.ofbiz.service.ServiceUtil

public Map performFindPage() {
	logInfo("----- performFindPage invoked -----");
	context = prepareParameters(dctx, context);

	def result = performFindList(dctx, context);
	println "result:"+result;

	result.viewSize = context.get("viewSize");
	result.viewIndex = context.get("viewIndex");
	
	return result;
}

private Map prepareParameters(DispatchContext dctx, Map context){
	context = preparePageParameters(context);
	context = prepareEntityConditionParameters(dctx, context);

	return context;
}

private Map preparePageParameters(Map context){
	if(!UtilValidate.isNotEmpty(context.get("viewSize"))){
		context.put("viewSize",Integer.valueOf(20));
	}else{
		int viewSize = UtilMisc.toInteger(context.get("viewSize"));
		if(viewSize <= 0){
			context.put("viewSize",Integer.valueOf(20));
		}
	}

	if(!UtilValidate.isNotEmpty(context.get("viewIndex"))){
		context.put("viewIndex",Integer.valueOf(0));
	}else{
		int viewIndex = UtilMisc.toInteger(context.get("viewIndex"));
		if(viewIndex < 0){
			context.put("viewIndex",Integer.valueOf(0));
		}
	}

	return context;
}


private Map prepareEntityConditionParameters(DispatchContext dctx, Map context){
	Map inputFields = context.get("inputFields");
	Delegator delegator = dctx.getDelegator();
	
	Set keySet = inputFields.keySet();
	Iterator it = keySet.iterator();
	String key = null; 
	String fieldName = null;
	String operation = null;
	List entityConditionList = FastList.newInstance();
	EntityCondition entityCondition = null;
	while(it.hasNext()){
		key = it.next();
		if(key.contains("_")){
			fieldName = key.substring(key.indexOf("_")+1, key.length());
			operation = key.substring(0, key.indexOf("_"));
			entityCondition = EntityConditionWorker.createSingleCondition(delegator,context.get("entityName"),fieldName,operation,inputFields.get(key));
			if(entityCondition != null) entityConditionList.add(entityCondition);
		}
	}
	
	println "entityConditionList:"+entityConditionList
	context.put("entityConditionList", EntityCondition.makeCondition(entityConditionList,EntityOperator.AND));
	return context;
}

public static Map<String, Object> performFindList(DispatchContext dctx, Map<String, Object> context) {
    Map<String, Object> result = performFind(dctx,context);

    int start = context.get("viewIndex").intValue() * context.get("viewSize").intValue();
    List<GenericValue> list = null;
    Integer listSize = null;
    try {
        EntityListIterator it = (EntityListIterator) result.get("listIt");
        list = it.getPartialList(start+1, context.get("viewSize")); // list starts at '1'
        listSize = it.getResultsSizeAfterPartialList();
        it.close();
    } catch (Exception e) {
        logInfo("Problem getting partial list" + e,PerformFindPage.class.name);
    }

    result.put("listSize", listSize);
    result.put("list",list);
    result.remove("listIt");
    return result;
}

/**
 * performFind
 *
 * This is a generic method that expects entity data affixed with special suffixes
 * to indicate their purpose in formulating an SQL query statement.
 */
public static Map<String, Object> performFind(DispatchContext dctx, Map<String, Object> context) {
	String noConditionFind = (String) context.get("noConditionFind");
	
	if (UtilValidate.isEmpty(noConditionFind)) {
		// Use configured default
		noConditionFind = UtilProperties.getPropertyValue("widget", "widget.defaultNoConditionFind");
	}

	Integer viewSize = (Integer) context.get("viewSize");
	Integer viewIndex = (Integer) context.get("viewIndex");
	Integer maxRows = null;
	if (viewSize != null && viewIndex != null) {
		maxRows = viewSize * (viewIndex + 1);
	}
	
	context.put("inputFields", FastMap.newInstance());
	Map<String, Object> prepareResult = FindServices.prepareFind(dctx, context);
	List<String> orderByList = UtilGenerics.checkList(prepareResult.get("orderByList"), String.class);

	Map<String, Object> executeCtx = FastMap.newInstance();
	executeCtx.putAll(context);
	executeCtx.put("orderByList", orderByList);
	executeCtx.put("maxRows", maxRows);
	executeCtx.put("noConditionFind", noConditionFind);
	
	Map<String, Object> executeResult = executeFind(dctx, executeCtx);
	if(!ServiceUtil.isSuccess(executeResult)) return executeResult;

	Map<String, Object> results = ServiceUtil.returnSuccess();
	results.put("listIt", executeResult.get("listIt"));
	return results;
}

public static Map<String, Object> executeFind(DispatchContext dctx, Map<String, ?> context) {
	String entityName = (String) context.get("entityName");
	EntityConditionList entityConditionList = (EntityConditionList) context.get("entityConditionList");
	EntityConditionList havingConditionList = (EntityConditionList) context.get("havingConditionList");
	List<String> orderByList = UtilGenerics.checkList(context.get("orderByList"), String.class);
	boolean noConditionFind = "Y".equals((String) context.get("noConditionFind"));
	boolean distinct = "Y".equals((String) context.get("distinct"));
	List<String> fieldList =  UtilGenerics.checkList(context.get("fieldList"));
	Set<String> fieldSet = null;
	if (fieldList != null) {
		fieldSet = UtilMisc.makeSetWritable(fieldList);
	}
	Integer maxRows = (Integer) context.get("maxRows");
	maxRows = maxRows != null ? maxRows : -1;
	Delegator delegator = dctx.getDelegator();
	// Retrieve entities  - an iterator over all the values
	EntityListIterator listIt = null;
	try {
		if (noConditionFind || (entityConditionList != null && entityConditionList.getConditionListSize() > 0)) {
			listIt = delegator.find(entityName, entityConditionList, havingConditionList, fieldSet, orderByList,
					new EntityFindOptions(true, EntityFindOptions.TYPE_SCROLL_INSENSITIVE, EntityFindOptions.CONCUR_READ_ONLY, -1, maxRows, distinct));
			
		}
	} catch (GenericEntityException e) {
		return ServiceUtil.returnError("Error running Find on the [" + entityName + "] entity: " + e.getMessage());
	}

	Map<String, Object> results = ServiceUtil.returnSuccess();
	results.put("listIt", listIt);
	return results;
}
