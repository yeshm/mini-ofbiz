package org.miniofbiz.ext.common

import org.miniofbiz.base.util.UtilDateTime
import org.miniofbiz.entity.Delegator
import org.miniofbiz.service.LocalDispatcher
import org.miniofbiz.service.ServiceUtil

public Map createUserOperateLog() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters

    def bizPartyId = parameters.bizPartyId
    def comments = parameters.comments
    def operateIp = parameters.operateIp
    def enumId = parameters.enumId
    def operateUserLoginId = parameters.operateUserLoginId

    def userOperateLog = delegator.makeValue("ExtUserOperateLog", [
            bizPartyId        : bizPartyId,
            operateUserLoginId: operateUserLoginId,
            operateDate       : UtilDateTime.nowTimestamp(),
            comments          : comments,
            operateIp         : operateIp,
            enumId            : enumId
    ])
    userOperateLog.setNextSeqId()
    userOperateLog.create()

    def results = ServiceUtil.returnSuccess()
    results.operateLogId = userOperateLog.operateLogId

    return results
}
