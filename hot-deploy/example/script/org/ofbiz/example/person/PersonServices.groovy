package org.ofbiz.example.person

import org.ofbiz.base.util.UtilDateTime
import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.entity.util.EntityUtil;
import org.ofbiz.service.ServiceUtil;

public Map createPerson() {
	def nowTimestamp = UtilDateTime.nowTimestamp();
	
	def newEntity = makeValue("Person");
	newEntity.setPKFields(context);
	newEntity.setNonPKFields(context);
	newEntity.createdDate = nowTimestamp;
	newEntity.createdByUserLogin = userLogin.userLoginId;
	newEntity.lastModifiedDate = nowTimestamp;
	newEntity.lastModifiedByUserLogin = userLogin.userLoginId;
	newEntity.setNextSeqId();
	newEntity.create();
	
	def result = ServiceUtil.returnSuccess();
	
	return result;
}

public Map updatePerson() {
	def nowTimestamp = UtilDateTime.nowTimestamp();
	def result = ServiceUtil.returnSuccess();
	
	def entity = delegator.findByPrimaryKey("Person", UtilMisc.toMap("personId", context.personId));
	result.oldStatusId = entity.statusId;
	
	entity.setNonPKFields(context);
	entity.lastModifiedDate = nowTimestamp;
	entity.lastModifiedByUserLogin = userLogin.userLoginId;
	entity.store();
	
	return result;
}

public Map createPersonStatus() {
	def nowTimestamp = UtilDateTime.nowTimestamp();
	
	//find the most recent status record and set the statusEndDate
	def oldExampleStatusList = delegator.findByAnd("PersonStatus", UtilMisc.toMap("personId", context.personId), UtilMisc.toList("-statusDate"));
	def oldExampleStatus = EntityUtil.getFirst(oldExampleStatusList);
	if(oldExampleStatus){
		oldExampleStatus.statusEndDate = nowTimestamp;
		oldExampleStatus.store();
	}
	
	def newEntity = makeValue("PersonStatus");
	newEntity.setPKFields(context);
	newEntity.setNonPKFields(context);
	newEntity.statusDate = nowTimestamp;
	newEntity.create();
	
	return ServiceUtil.returnSuccess();
}