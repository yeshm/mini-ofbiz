package org.miniofbiz.ext.biz;

import javax.servlet.http.HttpSession;

public class SessionKeys {

	/**
	 * 校验码session key
	 */
	public static final String CAPTCHA_CODE_SESSION_KEY = "CAPTCHA_CODE_SESSION_KEY";

    /**当前操作的业务partyId，在模拟登录的情况下，会跟userLogin的partyId不一致，因此要单独记录**/
    public static final String CURRENT_BIZ_PARTY_ID = "CURRENT_BIZ_PARTY_ID";
	
	public static void setSessionCaptcha(HttpSession session, String captcha) {
		session.setAttribute(CAPTCHA_CODE_SESSION_KEY, captcha);
	}
	
	public static String getSessionCaptcha(HttpSession session) {
		return (String)session.getAttribute(CAPTCHA_CODE_SESSION_KEY);
	}
	
}
