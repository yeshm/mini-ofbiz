package org.miniofbiz.ext.common

import com.juweitu.bonn.SystemConfigWorker
import org.miniofbiz.base.util.Debug
import org.miniofbiz.base.util.UtilDateTime
import org.miniofbiz.base.util.UtilValidate
import org.miniofbiz.entity.Delegator
import org.miniofbiz.entity.GenericValue
import org.miniofbiz.entity.condition.EntityCondition
import org.miniofbiz.entity.util.EntityListIterator
import org.miniofbiz.ext.constant.QrCodeExportStatus
import org.miniofbiz.ext.constant.QrCodeStatus
import org.miniofbiz.ext.util.ExtEntityUtil
import org.miniofbiz.ext.util.ExtUtilDateTime
import org.miniofbiz.ext.util.LockWorker
import org.miniofbiz.service.GenericResultWaiter
import org.miniofbiz.service.LocalDispatcher
import org.miniofbiz.service.ServiceUtil

/**
 * 创建二维码
 * @return
 */
public Map createQrCode() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters
    GenericValue userLogin = userLogin

    def uuid = UUID.randomUUID().toString()
    uuid = uuid.replaceAll("-", "")

    parameters.fromDate = UtilDateTime.nowTimestamp()
    parameters.createdDate = UtilDateTime.nowTimestamp()
    parameters.qrCodeSn = uuid

    def qrCode = delegator.makeValue("ExtQrCode")
    qrCode.setNonPKFields(parameters)
    qrCode.isPrint = "N"
    qrCode.setNextSeqId()
    qrCode.create()

    def results = ServiceUtil.returnSuccess()
    results.qrCodeId = qrCode.qrCodeId
    results.qrCodeSn = qrCode.qrCodeSn

    return results
}
/**
 * 修改二维码
 * @return
 */
public Map updateExtQrCode() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters
    GenericValue userLogin = userLogin

    def qrCodeId = parameters.qrCodeId

    def extQrCode = ExtEntityUtil.getOnly(delegator, "ExtQrCode", [
            qrCodeId: qrCodeId
    ])

    extQrCode.setNonPKFields(parameters)
    extQrCode.lastModifiedDate = ExtUtilDateTime.nowTimestamp()
    extQrCode.lastModifiedByUserLogin = userLogin.userLoginId
    extQrCode.store()

    def results = ServiceUtil.returnSuccess()
    results.qrCodeId = qrCodeId

    return results
}

/**
 * 批量创建二维码
 */
public Map batchCreateQrCode() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters
    GenericValue userLogin = userLogin

    def qrCodeTypeEnumId = parameters.qrCodeTypeEnumId
    def amount = parameters.amount
    def productStoreId = parameters.productStoreId

    def statusId = parameters.statusId ?: QrCodeStatus.UNBOUND
    def exportStatusId = parameters.exportStatusId ?: QrCodeExportStatus.NOT_EXPORT
    def needShortUrl = parameters.needShortUrl ?: "N"

    if (UtilValidate.isEmpty(amount) || amount <= 0) return ServiceUtil.returnError("需创建的二维码数量错误")

    def nowTimeStamp = ExtUtilDateTime.nowTimestamp()
    def uuid
    def qrCodeIds = []

    for (def i = 0; i < amount; i++) {
        uuid = UUID.randomUUID().toString()
        uuid = uuid.replaceAll("-", "")

        def qrCode = delegator.makeValue("ExtQrCode", [
                qrCodeTypeEnumId       : qrCodeTypeEnumId,
                qrCodeSn               : uuid,
                statusId               : statusId,
                exportStatusId         : exportStatusId,
                productStoreId         : productStoreId,
                isPrint                : "N",
                needShortUrl           : needShortUrl,
                createdDate            : nowTimeStamp,
                fromDate               : nowTimeStamp,
                createdByUserLogin     : userLogin.userLoginId,
                lastModifiedDate       : nowTimeStamp,
                lastModifiedByUserLogin: userLogin.userLoginId
        ])
        qrCode.setNextSeqId()
        qrCode.create()

        qrCodeIds.add(qrCode.qrCodeId)
    }

    def results = ServiceUtil.returnSuccess()
    results.qrCodeIds = qrCodeIds

    return results
}

public Map changeQrCodeStatus() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters
    GenericValue userLogin = userLogin

    def qrCodeId = parameters.qrCodeId
    def statusId = parameters.statusId

    if (UtilValidate.isWhitespace(qrCodeId)) return ServiceUtil.returnError("修改二维码状态失败，二维码id为空")
    if (UtilValidate.isWhitespace(statusId)) return ServiceUtil.returnError("修改二维码状态失败，二维码状态id为空")
    if (!QrCodeStatus.BOUND.equals(statusId) && !QrCodeStatus.DELETED.equals(statusId) && !QrCodeStatus.UNBOUND.equals(statusId)) ServiceUtil.returnError("修改二维码状态失败，二维码状态不合法")

    def qrCode = delegator.findOne("ExtQrCode", [qrCodeId: qrCodeId], false)
    qrCode.statusId = statusId

    qrCode.store()

    return ServiceUtil.returnSuccess()
}

public Map changeQrCodeExportStatus() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters
    GenericValue userLogin = userLogin

    def qrCodeId = parameters.qrCodeId
    def exportStatusId = parameters.exportStatusId

    if (UtilValidate.isWhitespace(qrCodeId)) return ServiceUtil.returnError("修改二维码状态失败，二维码id为空")
    if (UtilValidate.isWhitespace(exportStatusId)) return ServiceUtil.returnError("修改二维码状态失败，二维码导出状态id为空")
    if (!QrCodeExportStatus.NOT_EXPORT.equals(exportStatusId) && !QrCodeExportStatus.EXPORTED.equals(exportStatusId)) ServiceUtil.returnError("修改二维码状态失败，二维码导出状态不合法")

    def qrCode = delegator.findOne("ExtQrCode", [qrCodeId: qrCodeId], false)
    qrCode.exportStatusId = exportStatusId

    qrCode.store()

    return ServiceUtil.returnSuccess()
}

public Map generateQrCodeShortUrls() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters
    GenericValue userLogin = userLogin

    def productStoreId = parameters.productStoreId

    def entityCondition = EntityCondition.makeCondition([
            EntityCondition.makeCondition("productStoreId", productStoreId),
            EntityCondition.makeCondition("needShortUrl", "Y"),
            EntityCondition.makeCondition("shortUrl", null)
    ])
    EntityListIterator qrCodeIt = delegator.find("ExtQrCode", entityCondition, null, null, null, null)
    GenericValue qrCode

    def waiterList = []
    while ((qrCode = qrCodeIt.next()) != null) {
        def qrCodeId = qrCode.qrCodeId

        GenericResultWaiter waiter = dispatcher.runAsyncWait("bizUpdateExtQrCodeShortUrl", [
                productStoreId: productStoreId,
                qrCodeId      : qrCodeId,
                userLogin     : userLogin
        ], false)
        waiterList.add(waiter)
    }
    qrCodeIt.close()

    def generateCount = 0
    def errorMessageSb = new StringBuffer()
    if (UtilValidate.isNotEmpty(waiterList)) {
        for (GenericResultWaiter waiter : waiterList) {
            def results = waiter.waitForResult()
            if (!ServiceUtil.isSuccess(results)){
                Debug.logError(ServiceUtil.getErrorMessage(results), "")

                if(errorMessageSb.length()>0) errorMessageSb.append(",")
                errorMessageSb.append(ServiceUtil.getErrorMessage(results))
            }else{
                generateCount++
            }
        }
    }

    results = ServiceUtil.returnSuccess()
    results.processCount = waiterList.size()
    results.generateCount = generateCount
    results.processErrorMessage = errorMessageSb.toString()
    return results
}

public Map updateExtQrCodeShortUrl() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    Map parameters = parameters
    GenericValue userLogin = userLogin

    def qrCodeId = parameters.qrCodeId
    def productStoreId = parameters.productStoreId

    GenericValue qrCode = LockWorker.lockEntity(delegator, "ExtQrCode", [
            qrCodeId      : qrCodeId
    ])

    if (UtilValidate.isNotEmpty(qrCode.shortUrl)) {
        return ServiceUtil.returnError("shortUrl for qrCodeId:" + qrCodeId + "is exist, shortUrl:" + qrCode.shortUrl, "")
    }

    def qrCodeUrl = SystemConfigWorker.getDomainMobile(delegator) + "/biz/qr/" + qrCode.qrCodeSn
    def results = dispatcher.runSync("bizGetShortUrl", [
            productStoreId: productStoreId,
            longUrl       : qrCodeUrl
    ])
    if (!ServiceUtil.isSuccess(results)) return results

    String shortUrl = results.shortUrl
    def shortSn = shortUrl.substring(shortUrl.lastIndexOf("/") + 1)

    results = dispatcher.runSync("bizUpdateExtQrCode", [
            qrCodeId : qrCodeId,
            shortUrl : shortUrl,
            shortSn  : shortSn,
            userLogin: userLogin
    ])
    if (!ServiceUtil.isSuccess(results)) return results

    results = ServiceUtil.returnSuccess()
    results.qrCodeId = qrCodeId
    results.shortUrl = shortUrl
    return results
}