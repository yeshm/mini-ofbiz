package org.miniofbiz.ext.util;

import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.entity.Delegator;
import org.ofbiz.entity.GenericEntityException;
import org.ofbiz.entity.GenericValue;

import java.util.ArrayList;
import java.util.List;

/**
 * 安全助手类
 */
public class SecurityUtil {

    private static List<String> systemUserLoginIdList;
    private static GenericValue systemUserLogin = null;

    static {
        systemUserLoginIdList = new ArrayList<String>();
        systemUserLoginIdList.add("system");
        systemUserLoginIdList.add("super");
        systemUserLoginIdList.add("admin");
    }

    /**
     * 获取System UserLogin，当调用一些需要权限的系统service，但是当前用户没有操作权限的时候可以临时获取系统账号操作
     *
     * @param delegator
     * @return GenericValue
     */
    public static GenericValue getSystemUserLogin(Delegator delegator) throws GenericEntityException {
        if (UtilValidate.isEmpty(systemUserLogin)) {
            systemUserLogin = ExtEntityUtil.getOnlyCache(delegator, "UserLogin", UtilMisc.toMap("userLoginId", "system"));
        }
        return systemUserLogin;
    }

    public static boolean isSystemUserLoginId(String userLoginId) throws GenericEntityException {
        return systemUserLoginIdList.contains(userLoginId);
    }
}