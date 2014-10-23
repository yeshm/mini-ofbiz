package org.miniofbiz.example.person

import org.miniofbiz.util.MessageUtil
import org.ofbiz.base.util.UtilHttp
import org.ofbiz.base.util.UtilValidate
import org.ofbiz.entity.Delegator
import org.ofbiz.entity.GenericValue
import org.ofbiz.service.LocalDispatcher
import org.ofbiz.service.ServiceUtil

import javax.servlet.http.HttpServletRequest

public String gridPerson() {
    HttpServletRequest request = request
    Delegator delegator = delegator
    LocalDispatcher dispatcher = dispatcher
    def requestParameters = UtilHttp.getParameterMap(request)

    def viewIndex = Integer.valueOf(requestParameters.pageIndex)
    def viewSize = Integer.valueOf(requestParameters.limit)

    def result = dispatcher.runSync("performFindPage", [
            inputFields    : requestParameters,
            entityName     : "PersonAndType",
            noConditionFind: "Y",
            orderBy        : "personId",
            viewIndex      : viewIndex,
            viewSize       : viewSize,
            timeZone       : timeZone
    ])

    request.setAttribute("result", result)

    return "success"
}

public String deletePerson() {
    HttpServletRequest request = request
    Delegator delegator = delegator
    LocalDispatcher dispatcher = dispatcher
    GenericValue userLogin = userLogin
    def requestParameters = UtilHttp.getParameterMap(request)

    def ids = requestParameters.get("ids[]")

    if (UtilValidate.isNotEmpty(ids)) {
        if (ids instanceof String) ids = [ids]
        for (def id : ids) {
            def results = dispatcher.runSync("deletePerson", [
                    personId : id,
                    userLogin: userLogin
            ])
            if (!ServiceUtil.isSuccess(results)) return MessageUtil.handleServiceResults(request, results)
        }
    }

    return "success"
}

public String getPerson() {
    HttpServletRequest request = request
    Delegator delegator = delegator
    LocalDispatcher dispatcher = dispatcher
    GenericValue userLogin = userLogin
    def requestParameters = UtilHttp.getParameterMap(request)

    def personId = requestParameters.personId

    def person = delegator.findOne("Person", [personId: personId], true)
    request.setAttribute("person", person)

    return "success"
}

