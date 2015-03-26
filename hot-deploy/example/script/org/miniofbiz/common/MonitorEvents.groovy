package org.miniofbiz.common

import org.miniofbiz.util.ExtEntityUtil
import org.miniofbiz.util.RenderUtil
import org.ofbiz.entity.Delegator
import org.ofbiz.service.LocalDispatcher

import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

public String http() {
    HttpServletRequest request = request
    HttpServletResponse response = response
    Delegator delegator = delegator
    LocalDispatcher dispatcher = dispatcher

    RenderUtil.renderText(response, "ok")

    return "success"
}

public String db() {
    HttpServletRequest request = request
    HttpServletResponse response = response
    Delegator delegator = delegator

    def count = ExtEntityUtil.findCountByFields(delegator, "UserLogin", [userLoginId: "system"])

    if (count == 1) {
        RenderUtil.renderText(response, "ok")
    } else {
        RenderUtil.renderText(response, "db access error")
    }
    return "success"
}