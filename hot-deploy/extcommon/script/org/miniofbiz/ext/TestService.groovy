package org.miniofbiz.ext

import org.miniofbiz.entity.Delegator
import org.miniofbiz.service.DispatchContext
import org.miniofbiz.service.ServiceUtil

public Map setSurveyOptionSeqId4SurveyResponseAnswer() {
    DispatchContext dctx = (DispatchContext) context.get("dctx")
    Delegator delegator = dctx.getDelegator()
    def parameters = parameters

    Map<String, Object> result = ServiceUtil.returnSuccess()
    result.result = "success result!"
    return result
}