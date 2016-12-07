package org.miniofbiz.ext.common

import org.miniofbiz.base.util.UtilDateTime
import org.miniofbiz.base.util.UtilValidate
import org.miniofbiz.base.util.cache.UtilCache
import org.miniofbiz.entity.Delegator
import org.miniofbiz.entity.GenericValue
import org.miniofbiz.ext.util.ExtEntityUtil
import org.miniofbiz.service.LocalDispatcher
import org.miniofbiz.service.ServiceUtil

/**
 * 保存系统配置
 */
public Map saveSystemConfig() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters

    def configTypeEnumId = parameters.configTypeEnumId
    def configValue = parameters.configValue

    GenericValue config = ExtEntityUtil.getOnly(delegator, "ExtSystemConfig", [configTypeEnumId: configTypeEnumId])
    if (UtilValidate.isEmpty(config)) {
        config = delegator.makeValue("ExtSystemConfig", [
                configTypeEnumId: configTypeEnumId,
                configValue     : configValue,
                fromDate        : UtilDateTime.nowTimestamp(),
                createdDate     : UtilDateTime.nowTimestamp(),
                lastModifiedDate: UtilDateTime.nowTimestamp(),
        ])
        config.setNextSeqId()
        config.setNonPKFields(parameters)
        config.create()
    } else {
        config.configValue = configValue
        config.lastModifiedDate = UtilDateTime.nowTimestamp()
        config.setNonPKFields(parameters)
        config.store()
    }

    def results = ServiceUtil.returnSuccess()
    results.configId = config.configId

    return results
}
/**
 * 清除系统全部缓存
 */
public Map cleanAllCache() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters

    //清除系统全部缓存
    UtilCache.clearAllCaches();

    return ServiceUtil.returnSuccess()
}