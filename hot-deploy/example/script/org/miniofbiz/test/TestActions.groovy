package org.miniofbiz.test

import org.ofbiz.base.util.UtilHttp
import org.ofbiz.entity.Delegator
import org.ofbiz.service.LocalDispatcher

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

def test (Map context) {
    HttpServletRequest request = request
    HttpServletResponse response = response
    Delegator delegator = delegator
    LocalDispatcher dispatcher = dispatcher
    def requestParameters = UtilHttp.getParameterMap(request)

    //演练代码开始

    context.text = "hello world!"
}
