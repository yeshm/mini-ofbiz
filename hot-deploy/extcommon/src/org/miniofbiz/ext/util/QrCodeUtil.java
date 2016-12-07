package org.miniofbiz.ext.util;

import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.entity.Delegator;
import org.ofbiz.entity.GenericEntityException;
import org.ofbiz.entity.GenericValue;
import org.ofbiz.entity.condition.EntityCondition;
import org.ofbiz.entity.condition.EntityOperator;
import org.miniofbiz.ext.constant.QrCodeStatus;

import java.util.List;

public class QrCodeUtil {

    /**
     * 二维码
     *
     * @param delegator
     * @param qrCodeSn
     * @return
     * @throws GenericEntityException
     */
    public static GenericValue getQrCodeBySn(Delegator delegator, String qrCodeSn) throws GenericEntityException {
        GenericValue qrCode = ExtEntityUtil.getOnlyCache(delegator, "ExtQrCode", UtilMisc.toMap("shortSn", qrCodeSn));
        if (UtilValidate.isEmpty(qrCode)) {
            qrCode = ExtEntityUtil.getOnlyCache(delegator, "ExtQrCode", UtilMisc.toMap("qrCodeSn", qrCodeSn));
        }
        return qrCode;
    }

    /**
     * 有效二维码
     *
     * @param delegator
     * @param qrCodeSn
     * @return
     * @throws GenericEntityException
     */
    public static GenericValue getValidQrCodeBySn(Delegator delegator, String qrCodeSn) throws GenericEntityException {
        List entityConditionList = UtilMisc.toList(
                EntityCondition.makeCondition("shortSn", qrCodeSn),
                EntityCondition.makeCondition("statusId", EntityOperator.NOT_EQUAL, QrCodeStatus.DELETED)
        );

        GenericValue qrCode = ExtEntityUtil.getOnlyCache(delegator, "ExtQrCode", EntityCondition.makeCondition(entityConditionList));
        if (UtilValidate.isEmpty(qrCode)) {
            entityConditionList = UtilMisc.toList(
                    EntityCondition.makeCondition("qrCodeSn", qrCodeSn),
                    EntityCondition.makeCondition("statusId", EntityOperator.NOT_EQUAL, QrCodeStatus.DELETED)
            );

            qrCode = ExtEntityUtil.getOnlyCache(delegator, "ExtQrCode", EntityCondition.makeCondition(entityConditionList));
        }

        return qrCode;
    }

    /**
     * 有效二维码
     *
     * @param delegator
     * @param qrCodeSn
     * @param productStoreId
     * @return
     * @throws GenericEntityException
     */
    public static GenericValue getValidQrCodeBySnAndProductStoreId(Delegator delegator, String qrCodeSn, String productStoreId) throws GenericEntityException {
        List entityConditionList = UtilMisc.toList(
                EntityCondition.makeCondition("shortSn", qrCodeSn),
                EntityCondition.makeCondition("productStoreId", productStoreId),
                EntityCondition.makeCondition("statusId", EntityOperator.NOT_EQUAL, QrCodeStatus.DELETED)
        );

        GenericValue qrCode = ExtEntityUtil.getOnlyCache(delegator, "ExtQrCode", EntityCondition.makeCondition(entityConditionList));
        if (UtilValidate.isEmpty(qrCode)) {
            entityConditionList = UtilMisc.toList(
                    EntityCondition.makeCondition("qrCodeSn", qrCodeSn),
                    EntityCondition.makeCondition("productStoreId", productStoreId),
                    EntityCondition.makeCondition("statusId", EntityOperator.NOT_EQUAL, QrCodeStatus.DELETED)
            );

            qrCode = ExtEntityUtil.getOnlyCache(delegator, "ExtQrCode", EntityCondition.makeCondition(entityConditionList));
        }

        return qrCode;
    }

    /**
     * 二维码ID
     *
     * @param delegator
     * @param qrCodeSn
     * @return
     * @throws GenericEntityException
     */
    public static String getQrCodeIdBySn(Delegator delegator, String qrCodeSn) throws GenericEntityException {
        GenericValue qrCode = getQrCodeBySn(delegator, qrCodeSn);
        return UtilValidate.isEmpty(qrCode) ? "" : qrCode.getString("qrCodeId");
    }

    /**
     * 二维码类型
     *
     * @param delegator
     * @param qrCodeId
     * @return
     * @throws GenericEntityException
     */
    public static String getQrCodeTypeEnumId(Delegator delegator, String qrCodeId) throws GenericEntityException {
        GenericValue qrCode = ExtEntityUtil.findOneCache(delegator, "ExtQrCode", UtilMisc.toMap("qrCodeId", qrCodeId));
        return UtilValidate.isEmpty(qrCode) ? "" : qrCode.getString("qrCodeTypeEnumId");
    }

    /**
     * 二维码是否有效
     *
     * @param delegator
     * @param qrCodeId
     * @return
     * @throws GenericEntityException
     */
    public static boolean isQrCodeValid(Delegator delegator, String qrCodeId) throws GenericEntityException {
        GenericValue qrCode = ExtEntityUtil.findOneCache(delegator, "ExtQrCode", UtilMisc.toMap("qrCodeId", qrCodeId));
        return UtilValidate.isNotEmpty(qrCode) && !QrCodeStatus.DELETED.equals(qrCode.get("statusId")) && ExtEntityUtil.isValueActive(qrCode, ExtUtilDateTime.nowTimestamp());
    }
}