package org.miniofbiz.ext.util;

import org.ofbiz.base.util.UtilValidate;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Cookie助手类
 */
public class CookieUtil {

    /**
     * 默认生存期
     */
    private static final int DEFAULT_MAX_AGE = 30 * 24 * 60 * 60;

    public static void createCookie(HttpServletRequest request, HttpServletResponse response, String key, String value, int maxAge, String path) {
        Cookie cookie = new Cookie(key, value);

        //设置60秒生存期，如果设置为负值的话，则为浏览器进程Cookie(内存中保存)，关闭浏览器就失效。
        cookie.setMaxAge(maxAge);

        //设置Cookie路径，不设置的话为当前路径(对于Servlet来说为request.getContextPath() + web.xml里配置的该Servlet的url-pattern路径部分) 。
        if (ExtUtilValidate.isNotEmpty(path)) cookie.setPath(path);

        response.addCookie(cookie);
    }

    public static void createCookie(HttpServletRequest request, HttpServletResponse response, String key, String value, int maxAge) {
        createCookie(request, response, key, value, maxAge, null);
    }

    public static void createCookie(HttpServletRequest request, HttpServletResponse response, String key, String value) {
        createCookie(request, response, key, value, DEFAULT_MAX_AGE);
    }

    public static void createCookie(HttpServletRequest request, HttpServletResponse response, String key, String value,String path) {
        createCookie(request, response, key, value, DEFAULT_MAX_AGE,path);
    }

    public static Cookie getCookie(HttpServletRequest request, String key) {
        Cookie cookies[] = request.getCookies();
        Cookie c;
        if (cookies != null) {
            for (int i = 0; i < cookies.length; i++) {
                c = cookies[i];
                if (c.getName().equals(key)) {
                    return c;
                }
            }
        }
        return null;
    }

    public static String getCookieValue(HttpServletRequest request, String key) {
        Cookie cookie = getCookie(request, key);
        if (UtilValidate.isNotEmpty(cookie)) {
            return cookie.getValue();
        }
        return null;
    }

    //删除Cookie,(将Cookie的有效时间设为0)
    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String key, String path) {
        Cookie cookie = new Cookie(key, null);
        cookie.setMaxAge(0);
        if (ExtUtilValidate.isNotEmpty(path)) cookie.setPath(path);
        response.addCookie(cookie);
    }

    public static void deleteCookie(HttpServletRequest request, HttpServletResponse response, String key) {
        String path = request.getContextPath();
        deleteCookie(request, response, key, path);
    }

}
