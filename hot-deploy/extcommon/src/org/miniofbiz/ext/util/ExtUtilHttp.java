package org.miniofbiz.ext.util;

import com.fasterxml.jackson.databind.JsonNode;
import javolution.util.FastMap;
import org.apache.commons.io.IOUtils;
import org.apache.http.Header;
import org.apache.http.HeaderElement;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilGenerics;
import org.ofbiz.base.util.UtilHttp;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.webapp.control.RequestHandler;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

public class ExtUtilHttp extends UtilHttp {

    public static String getPathInfoFromTarget(String target) {
        if (UtilValidate.isEmpty(target)) return "";

        String temp = target;
        int queryStart = target.indexOf('?');
        if (queryStart != -1) {
            temp = temp.substring(0, queryStart);
        }

        temp = temp.substring(temp.lastIndexOf("/"));
        return temp;
    }

    public static Map<String, Object> getUrlOnlyParameterMapFromTarget(String target) {
        String queryString = getQueryStringFromTarget(target);
        if (UtilValidate.isNotEmpty(queryString) && queryString.startsWith("?")) {
            queryString = queryString.substring(1);
        }
        return getUrlOnlyParameterMap(queryString, getPathInfoFromTarget(target));
    }

    /**
     * 获取客户端ip地址
     */
    public static String getRemoteAddr(HttpServletRequest request) {
        String ip = request.getHeader("X-Real-IP");
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Forwarded-For");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    /**
     * 获取客户端ip地址
     */
    public static String getRemoteAddrIpV4(HttpServletRequest request) {
        String ip = getRemoteAddr(request);
        if (ip.contains(".")) return ip;
        else return null;
    }

    /**
     * 获取登录前访问的URI+QUERYPARAMS
     */
    public static String getPreviousRequestURIAndQueryParams(HttpServletRequest request, HttpServletResponse response) throws UnsupportedEncodingException {

        String previousRequestUrl = getPreviousRequestUrl(request, response);

        if (UtilValidate.isNotEmpty(previousRequestUrl))
            return previousRequestUrl.substring(previousRequestUrl.lastIndexOf("/") + 1);

        return null;
    }

    /**
     * 获取登录前访问的链接
     */
    public static String getPreviousRequestUrl(HttpServletRequest request, HttpServletResponse response) throws UnsupportedEncodingException {
        String previousRequest = (String) request.getSession().getAttribute("_PREVIOUS_REQUEST_");

        if (Debug.verboseOn())
            Debug.logVerbose("[RequestHandler]: previousRequest - " + previousRequest + " sessionId=" + UtilHttp.getSessionId(request), "");

        // if previous request exists, and a login just succeeded, do that now.
        if (previousRequest != null) {
            RequestHandler rh = RequestHandler.getRequestHandler(request.getSession().getServletContext());

            // special case to avoid login/logout looping: if request was "logout" before the login, change to null for default success view; do the same for "login" to avoid going back to the same page
            if ("logout".equals(previousRequest) || "/logout".equals(previousRequest) || "login".equals(previousRequest) || "/login".equals(previousRequest) || "checkLogin".equals(previousRequest) || "/checkLogin".equals(previousRequest) || "/checkLogin/login".equals(previousRequest)) {
                Debug.logWarning("Found special _PREVIOUS_REQUEST_ of [" + previousRequest + "], setting to null to avoid problems, not running request again", "");
            } else {
                if (Debug.infoOn())
                    Debug.logInfo("[Doing Previous Request]: " + previousRequest + " sessionId=" + UtilHttp.getSessionId(request), "");

                // note that the previous form parameters are not setup (only the URL ones here), they will be found in the session later and handled when the old request redirect comes back
                Map<String, Object> previousParamMap = UtilGenerics.checkMap(request.getSession().getAttribute("_PREVIOUS_PARAM_MAP_URL_"), String.class, Object.class);
                String queryString = UtilHttp.urlEncodeArgs(previousParamMap, false);
                String redirectTarget = previousRequest;
                if (UtilValidate.isNotEmpty(queryString)) {
                    redirectTarget += "?" + queryString;
                }

                String url = rh.makeLink(request, response, redirectTarget, false, false, false);
                return url;
            }
        }
        return null;
    }

    /**
     * 获取完整的登录前访问的链接，包括域名
     */
    public static String getFullPreviousRequestUrl(HttpServletRequest request, HttpServletResponse response) throws UnsupportedEncodingException {
        return getFullPreviousRequestUrl(request, response, false);
    }

    /**
     * 获取完整的登录前访问的链接，包括域名
     */
    public static String getFullPreviousRequestUrl(HttpServletRequest request, HttpServletResponse response, boolean excludeServerPort) throws UnsupportedEncodingException {
        String previousRequest = (String) request.getSession().getAttribute("_PREVIOUS_REQUEST_");

        if (Debug.verboseOn())
            Debug.logVerbose("[RequestHandler]: previousRequest - " + previousRequest + " sessionId=" + UtilHttp.getSessionId(request), "");

        // if previous request exists, and a login just succeeded, do that now.
        if (previousRequest != null) {
            RequestHandler rh = RequestHandler.getRequestHandler(request.getSession().getServletContext());

            // special case to avoid login/logout looping: if request was "logout" before the login, change to null for default success view; do the same for "login" to avoid going back to the same page
            if ("logout".equals(previousRequest) || "/logout".equals(previousRequest) || "login".equals(previousRequest) || "/login".equals(previousRequest) || "checkLogin".equals(previousRequest) || "/checkLogin".equals(previousRequest) || "/checkLogin/login".equals(previousRequest)) {
                Debug.logWarning("Found special _PREVIOUS_REQUEST_ of [" + previousRequest + "], setting to null to avoid problems, not running request again", "");
            } else {
                if (Debug.infoOn())
                    Debug.logInfo("[Doing Previous Request]: " + previousRequest + " sessionId=" + UtilHttp.getSessionId(request), "");

                // note that the previous form parameters are not setup (only the URL ones here), they will be found in the session later and handled when the old request redirect comes back
                Map<String, Object> previousParamMap = UtilGenerics.checkMap(request.getSession().getAttribute("_PREVIOUS_PARAM_MAP_URL_"), String.class, Object.class);
                String queryString = UtilHttp.urlEncodeArgs(previousParamMap, false);
                String redirectTarget = previousRequest;
                if (UtilValidate.isNotEmpty(queryString)) {
                    redirectTarget += "?" + queryString;
                }

                String url = rh.makeLink(request, response, redirectTarget, true, false, true);

                if (excludeServerPort) {
                    url = url.replaceAll(":\\d+", "");
                }
//                url = URLEncoder.encode(url, "UTF-8");
                return url;
            }
        }
        return null;
    }


    /**
     * 登录成功后，将session中的_PREVIOUS_REQUEST_参数删除
     * 说明：如果要自己处理登录成功之后的页面跳转时需要调用这个方法，不然
     * ofbiz框架会在org.ofbiz.webapp.control.RequestHandler这个类的512行开始处理
     */
    public static void removePreviousRequest(HttpServletRequest request, HttpServletResponse response) throws UnsupportedEncodingException {
        String previousRequest = (String) request.getSession().getAttribute("_PREVIOUS_REQUEST_");

        if (Debug.verboseOn())
            Debug.logVerbose("[ExtUtilHttp]:afterLogin delete  previousRequest - " + previousRequest + " sessionId=" + UtilHttp.getSessionId(request), "");

        // if previous request exists, and a login just succeeded, do that now.
        if (previousRequest != null) {
            request.getSession().removeAttribute("_PREVIOUS_REQUEST_");

        }
    }

    public static String getRequestBody(HttpServletRequest request) throws IOException {
        StringWriter sw = new StringWriter();
        IOUtils.copy(request.getInputStream(), sw);
        return sw.toString();
    }

    /**
     * 获取工程根路径 http://127.0.0.1:8080/ext
     *
     * @param request
     * @return
     */
    public static String getHostHomePageUrl(HttpServletRequest request) {
        String hostUrl = getHostUrl(request);
        return hostUrl + request.getContextPath();
    }

    /**
     * 获取主机根路径 http://127.0.0.1:8080
     *
     * @param request
     * @return
     */
    public static String getHostUrl(HttpServletRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append(request.getScheme());
        sb.append("://");
        sb.append(request.getServerName());

        int serverPort = request.getServerPort();
        if (serverPort != 80) {
            sb.append(":");
            sb.append(request.getServerPort());
        }
        return sb.toString();
    }

    /**
     * Create a map from a HttpRequest (attributes) object used in JSON requests
     * 1.取消Timestamp.toString()
     * 2.多加处理了JsonNode,Timestamp类型数据
     *
     * @return The resulting Map
     */
    public static Map<String, Object> getJSONAttributeMap(HttpServletRequest request) {
        Map<String, Object> returnMap = FastMap.newInstance();
        Map<String, Object> attrMap = getAttributeMap(request);
        for (Map.Entry<String, Object> entry : attrMap.entrySet()) {
            String key = entry.getKey();
            Object val = entry.getValue();
//            if (val instanceof java.sql.Timestamp) {
//                val = val.toString();
//            }
            if (val instanceof String || val instanceof Number || val instanceof Map<?, ?> || val instanceof List<?> || val instanceof Boolean || val instanceof JsonNode || val instanceof Timestamp) {
                if (Debug.verboseOn()) Debug.logVerbose("Adding attribute to JSON output: " + key, module);
                returnMap.put(key, val);
            }
        }
        return returnMap;
    }

    /**
     * 获取response header中Content-Disposition中的filename值
     *
     * @param response
     * @return
     */
    public static String getResponseFileName(HttpResponse response) {
        Header contentHeader = response.getFirstHeader("Content-Disposition");
        String filename = null;

        if (contentHeader != null) {
            HeaderElement[] values = contentHeader.getElements();
            if (values.length == 1) {
                NameValuePair param = values[0].getParameterByName("filename");
                if (param != null) {
                    try {
                        //filename = new String(param.getValue().toString().getBytes(), "utf-8");
                        //filename=URLDecoder.decode(param.getValue(),"utf-8");
                        filename = param.getValue();

                        if (Debug.infoOn()) {
//                            NameValuePair param1 = values[0].getParameterByName("attachment");

                            Debug.logInfo("==response=Content-Disposition==filename：" + filename, module);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
        return filename;
    }

    public static void logReponseHeader(HttpResponse response, String moudle) {
        if (response == null) Debug.logInfo("[response is null]", module);

        Header[] headers = response.getAllHeaders();

        if (headers != null) {
            for (Header header : headers) {
                HeaderElement[] headerElements = header.getElements();
//
                if (headerElements != null) {
                    for (HeaderElement headerElement : headerElements) {
                        NameValuePair[] nameValuePairs = headerElement.getParameters();

                        if (nameValuePairs != null) {
                            for (NameValuePair nameValuePair : nameValuePairs) {
                                Debug.logInfo("[Header:" + header.getName() + "]pairName:" + nameValuePair.getName() + " pairValue:" + nameValuePair.getValue(), module);
                            }
                        }
                    }
                }
            }
        }

        Header contentHeader = response.getFirstHeader("Content-Length");

        if (contentHeader != null) {
            HeaderElement[] headerElements = contentHeader.getElements();

            if (headerElements != null) {
                for (HeaderElement headerElement : headerElements) {
                    NameValuePair[] nameValuePairs = headerElement.getParameters();

                    if (nameValuePairs != null) {
                        for (NameValuePair nameValuePair : nameValuePairs) {
                            Debug.logInfo("pairName:" + nameValuePair.getName() + " pairValue:" + nameValuePair.getValue(), module);
                        }
                    }
                }
            }
        }


//        Header contentHeader = response.getFirstHeader("Content-Disposition");
//        if(contentHeader!=null){
//            HeaderElement[] headerElements=contentHeader.getElements();
//
//            if(headerElements!=null){
//                for(HeaderElement headerElement:headerElements){
//                    NameValuePair[] nameValuePairs=headerElement.getParameters();
//
//                    if(nameValuePairs!=null){
//                        for(NameValuePair nameValuePair:nameValuePairs){
//                            Debug.logInfo("pairName:"+nameValuePair.getName()+" pairValue:"+nameValuePair.getValue(),module);
//                        }
//                    }
//                }
//            }
//        }

    }

    public static StringBuffer getServerRootUrl(HttpServletRequest request, boolean excludeServerPort) {
        StringBuffer requestUrl = new StringBuffer();
        requestUrl.append(request.getScheme());
        requestUrl.append("://" + request.getServerName());
        if (!excludeServerPort && request.getServerPort() != 80 && request.getServerPort() != 443)
            requestUrl.append(":" + request.getServerPort());
        return requestUrl;
    }

    public static StringBuffer getFullRequestUrl(HttpServletRequest request, boolean excludeServerPort) {
        StringBuffer requestUrl = getServerRootUrl(request, excludeServerPort);
        requestUrl.append(request.getRequestURI());
        if (request.getQueryString() != null) {
            requestUrl.append("?" + request.getQueryString());
        }
        return requestUrl;
    }
}
