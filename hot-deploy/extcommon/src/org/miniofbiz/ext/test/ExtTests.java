package org.miniofbiz.ext.test;

import org.ofbiz.service.testtools.OFBizTestCase;

public class ExtTests extends OFBizTestCase {

    public static final String module = ExtTests.class.getName();

    public ExtTests(String name) {
        super(name);
    }

    public void testSomething() throws Exception {
        assertNotNull("object is not null", "I'm string");
    }

}
