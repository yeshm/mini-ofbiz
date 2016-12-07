package org.miniofbiz.ext.biz;

import javolution.util.FastMap;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilDateTime;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.entity.GenericEntityException;
import org.ofbiz.entity.GenericValue;
import org.miniofbiz.ext.util.ExtUtilHttp;
import org.ofbiz.service.GenericServiceException;
import org.ofbiz.service.LocalDispatcher;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.Map;

/**
 * 平台后台用户操作日志助手
 */
public abstract class BaseUserOperateLogUtil {

    private static String module = BaseUserOperateLogUtil.class.getName();

    protected abstract String getBizPartyId(HttpServletRequest request);

    protected void log(HttpServletRequest request, String comments, String enumId, String bizPartyId) {
        LocalDispatcher dispatcher = (LocalDispatcher) request.getAttribute("dispatcher");
        GenericValue userLogin = (GenericValue) request.getSession().getAttribute("userLogin");

        if (UtilValidate.isEmpty(userLogin)) {
            throw new RuntimeException("记录操作日志时找不到操作人");
        }

        Map<String, Object> userOperateLogParams = FastMap.newInstance();
        userOperateLogParams.put("bizPartyId", bizPartyId);
        userOperateLogParams.put("comments", comments);
        userOperateLogParams.put("operateIp", ExtUtilHttp.getRemoteAddr(request));
        userOperateLogParams.put("enumId", enumId);
        userOperateLogParams.put("operateUserLoginId", userLogin.get("userLoginId"));

        try {
            dispatcher.runAsync("createUserOperateLog", userOperateLogParams);
        } catch (GenericServiceException e) {
            Debug.logError(e, module);
        }
    }

    public void doLogCreate(HttpServletRequest request, String comments) {
        log(request, comments, "UOLT_CREATE", getBizPartyId(request));
    }

    public void doLogDelete(HttpServletRequest request, String comments) {
        log(request, comments, "UOLT_DELETE", getBizPartyId(request));
    }

    public void doLogUpdate(HttpServletRequest request, String comments) {
        log(request, comments, "UOLT_UPDATE", getBizPartyId(request));
    }

    public void doLogLogin(HttpServletRequest request, String comments) throws GenericEntityException {
        log(request, comments, "UOLT_LOGIN", getBizPartyId(request));

        HttpSession session = request.getSession();
        GenericValue userLogin = (GenericValue) session.getAttribute("userLogin");
        userLogin.put("lastLoginIp", userLogin.get("currentLoginIp"));
        userLogin.put("lastLoginDate", userLogin.get("currentLoginDate"));
        userLogin.put("currentLoginIp", ExtUtilHttp.getRemoteAddr(request));
        userLogin.put("currentLoginDate", UtilDateTime.nowTimestamp());
        userLogin.store();
    }

    public void doLogLogout(HttpServletRequest request, String comments) {
        log(request, comments, "UOLT_LOGOUT", getBizPartyId(request));
    }

    public void doLogUpload(HttpServletRequest request, String comments) {
        log(request, comments, "UOLT_UPLOAD", getBizPartyId(request));
    }

    public void doLogDownload(HttpServletRequest request, String comments) {
        log(request, comments, "UOLT_DOWNLOAD", getBizPartyId(request));
    }
}
