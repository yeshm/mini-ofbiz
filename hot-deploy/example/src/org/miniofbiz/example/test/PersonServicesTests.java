package org.miniofbiz.example.test;

import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.entity.GenericValue;
import org.ofbiz.service.ModelService;
import org.ofbiz.service.testtools.OFBizTestCase;

import java.util.HashMap;
import java.util.Map;

public class PersonServicesTests extends OFBizTestCase {

    public PersonServicesTests(String name) {
        super(name);
    }

    public void testCreatePerson() throws Exception {
        GenericValue userLogin = delegator.findOne("UserLogin", UtilMisc.toMap("userLoginId", "system"), false);

        boolean isEcasDisabled = dispatcher.isEcasDisabled();

        try {
//            dispatcher.disableEcas();

            HashMap<String, Object> serviceCtx = new HashMap<String, Object>();
            serviceCtx.put("name", "Test Name");
            serviceCtx.put("statusId", "PERSON_ENABLED");
            serviceCtx.put("personTypeId", "ADMIN");
            serviceCtx.put("userLogin", userLogin);

            Map<String, Object> result = dispatcher.runSync("createPerson", serviceCtx);
            assertEquals("Service result success", ModelService.RESPOND_SUCCESS, result.get(ModelService.RESPONSE_MESSAGE));
        } finally {
            if (isEcasDisabled) {
                dispatcher.disableEcas();
            } else {
                dispatcher.enableEcas();
            }
        }
    }

}
