package org.miniofbiz.test

import org.ofbiz.base.util.UtilMisc
import org.ofbiz.entity.Delegator
import org.ofbiz.entity.GenericValue
import org.ofbiz.service.LocalDispatcher

public Map testCreatePersonService() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters

    GenericValue userLogin = delegator.findOne("UserLogin", UtilMisc.toMap("userLoginId", "system"), false);

    HashMap<String, Object> serviceCtx = new HashMap<String, Object>();
    serviceCtx.put("name", "Test Name");
    serviceCtx.put("statusId", "PERSON_ENABLED");
    serviceCtx.put("personTypeId", "ADMIN");
    serviceCtx.put("userLogin", userLogin);

    Map<String, Object> results = dispatcher.runSync("createPerson", serviceCtx);

    return results
}
