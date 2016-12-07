package org.miniofbiz.ext.util;

import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.lang.time.DateUtils;
import org.ofbiz.base.util.UtilDateTime;
import org.ofbiz.base.util.UtilValidate;
import org.miniofbiz.ext.bean.LoginToken;
import org.ofbiz.webapp.control.LoginWorker;

import javax.servlet.http.HttpServletRequest;
import java.util.Date;


public class TokenUtil {

    private static final String SPLITCHAR = "|";

    private static final String PRIVATEKEY = "";

    /**
     * @param userLoginId
     * @param partyId
     * @param userName
     * @param deadline    有效期 单位分
     * @return
     */
    public static LoginToken createLoginToken(HttpServletRequest request, String userLoginId, String partyId, String userName, int deadline) {

        String loginTime = UtilDateTime.nowDateString(UtilDateTime.DATE_TIME_FORMAT);
        String loginIp = ExtUtilHttp.getRemoteAddr(request);
        // 生成加密字符串
        String checkString = DigestUtils.md5Hex(loginIp + SPLITCHAR + userLoginId + SPLITCHAR + userName + SPLITCHAR + loginTime + SPLITCHAR + deadline
                + SPLITCHAR + PRIVATEKEY);

        LoginToken token = new LoginToken();
        token.setCheckString(checkString);
        token.setDeadline(deadline);
        token.setLoginIp(loginIp);
        token.setPartyId(partyId);
        token.setUserLoginId(userLoginId);
        token.setUserName(userName);
        token.setLoginTime(loginTime);
        token.setRedirectUrl(ExtUtilHttp.getHostHomePageUrl(request) + "/control/main?externalLoginKey=" + LoginWorker.getExternalLoginKey(request));

        return token;
    }

    public static boolean validateLoginToken(LoginToken loginToken) {
        if (UtilValidate.isEmpty(loginToken)) {
            throw new RuntimeException("loginToken is null");
        }
        // 生成加密字符串
        String checkString = DigestUtils.md5Hex(loginToken.getLoginIp() + SPLITCHAR + loginToken.getUserLoginId() + SPLITCHAR + loginToken.getUserName()
                + SPLITCHAR + loginToken.getLoginTime() + SPLITCHAR + loginToken.getDeadline() + SPLITCHAR + PRIVATEKEY);
        if (checkString.equals(loginToken.getCheckString())) {
            Date loginTime = ExtUtilDateTime.parseDate(loginToken.getLoginTime());
            Date validLoginTime = DateUtils.addMinutes(loginTime, loginToken.getDeadline());
            return !UtilDateTime.nowDate().after(validLoginTime);
        }
        return false;
    }
}
