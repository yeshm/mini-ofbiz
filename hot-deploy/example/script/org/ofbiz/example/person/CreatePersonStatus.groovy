package org.ofbiz.example.person

import org.ofbiz.base.util.UtilDateTime
import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.entity.util.EntityUtil;
import org.ofbiz.service.ServiceUtil;

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