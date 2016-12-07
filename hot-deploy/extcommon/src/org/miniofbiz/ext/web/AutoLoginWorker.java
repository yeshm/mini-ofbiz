package org.miniofbiz.ext.web;

import org.ofbiz.base.crypto.HashCrypt;
import org.ofbiz.base.util.Base64;
import org.ofbiz.base.util.UtilHttp;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.common.login.LoginServices;
import org.ofbiz.entity.GenericValue;
import org.ofbiz.webapp.control.LoginWorker;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.Map;

public class AutoLoginWorker {
    public static void rememberAutoLogin(HttpServletRequest request, HttpServletResponse response, String nameCookieKey, String nameMd5CookieKey) {
        Map<String, Object> requestParameters = UtilHttp.getParameterMap(request);

        String username = requestParameters.get("USERNAME").toString();
        Object autoLogin = requestParameters.get("autoLogin");

        if (UtilValidate.isNotEmpty(autoLogin)) {
            if ("on".equals(autoLogin)) {
                Cookie userName = new Cookie(nameCookieKey, username);
                Cookie userNameMd5 = new Cookie(nameMd5CookieKey, Base64.base64Encode(HashCrypt.digestHash(LoginServices.getHashType(), null, username)));

                userName.setMaxAge(7*24*60*60);
                userNameMd5.setMaxAge(7*24*60*60);

                userName.setPath("/");
                userNameMd5.setPath("/");

                response.addCookie(userName);
                response.addCookie(userNameMd5);
            }
        }
    }

    /**
     * 用户登录到本系统中，检测用户cookie中是否存在登录信息
     * 如果存在，并且未过期，则自动登录
     */
    public static void autoLogin(HttpServletRequest request, HttpServletResponse response, String nameCookieKey, String nameMd5CookieKey) {
        HttpSession session = request.getSession();
        GenericValue userLogin = (GenericValue) session.getAttribute("userLogin");

        if (UtilValidate.isNotEmpty(userLogin)) return;

        String userName = null;
        String userNameMd5 = null;

        Cookie[] cookies = request.getCookies();

        if (UtilValidate.isNotEmpty(cookies)) {
            for (int i = 0; i < cookies.length; i++) {
                if (nameCookieKey.equals(cookies[i].getName())) {
                    userName = cookies[i].getValue();
                    continue;
                }

                if (nameMd5CookieKey.equals(cookies[i].getName())) {
                    userNameMd5 = cookies[i].getValue();
                    continue;
                }
            }
        }

        if (UtilValidate.isNotEmpty(userName) && UtilValidate.isNotEmpty(userNameMd5)) {
            if (userNameMd5.equals(Base64.base64Encode(HashCrypt.digestHash(LoginServices.getHashType(), null, userName)))) {
                LoginWorker.loginUserWithUserLoginId(request, response, userName);
            }
        }
    }

    /**
     * 用户手动退出系统时，将用户cookie中相关的登录信息删除
     */
    public static void clearAutoLogin(HttpServletRequest request, HttpServletResponse response, String nameCookieKey, String nameMd5CookieKey) {
        Cookie[] cookies = request.getCookies();
        for (int i = 0; i < cookies.length; i++) {
            if (nameCookieKey.equals(cookies[i].getName())) {
                cookies[i].setPath("/");
                cookies[i].setMaxAge(0);
                response.addCookie(cookies[i]);
                continue;
            }

            if (nameMd5CookieKey.equals(cookies[i].getName())) {
                cookies[i].setPath("/");
                cookies[i].setMaxAge(0);
                response.addCookie(cookies[i]);
                continue;
            }
        }
    }
}
