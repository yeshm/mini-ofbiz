package org.miniofbiz.ext.util;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HttpUtils {

    private static Logger logger = LoggerFactory.getLogger(HttpUtils.class);

    private final static String RESULT_FLAG_KEY = "result_flag";
    private final static String RESULT_CONTENT_KEY = "result_content";

    private final static String RESULT_FLAG_TRUE = "true";
    private final static String RESULT_FLAG_FALSE = "false";

    private static final String DEFAULT_CHARSET = "UTF-8";

    // -- Content Type 定义 --//
    public static final String TEXT_TYPE = "text/plain";
    public static final String JSON_TYPE = "application/json";
    public static final String XML_TYPE = "text/xml";
    public static final String HTML_TYPE = "text/html";
    public static final String JS_TYPE = "text/javascript";
    public static final String EXCEL_TYPE = "application/vnd.ms-excel";

    public static Map<String, String> simplePostMethod(String url, String content, Map<String, String> headers) {
        return simplePostMethod(url, content, headers, DEFAULT_CHARSET, DEFAULT_CHARSET);
    }

    public static Map<String, String> simplePostMethod(String url, String content, Map<String, String> headers,
                                                       String defalutRequestCharset) {
        return simplePostMethod(url, content, headers, defalutRequestCharset, DEFAULT_CHARSET);
    }

    public static Map<String, String> simplePostMethod(String url, String content, Map<String, String> headers,
                                                       String defalutRequestCharset, String defaultResponseCharset) {
        logger.info("simplePostMethod request url:{}, headers:{}, content: {}", new Object[]{url, headers, content});

        Map<String, String> result = new HashMap<String, String>();
        HttpClient httpclient = new DefaultHttpClient();
        try {
            HttpPost httpPost = new HttpPost(url);

            StringEntity stringEntity = new StringEntity(content, defalutRequestCharset);
            httpPost.setEntity(stringEntity);

            generateHttpPostHeaders(httpPost, headers);

            HttpResponse response = httpclient.execute(httpPost);
            HttpEntity entity = response.getEntity();
            if (entity != null) {
                generateHttpResult(result, true,
                        EntityUtils.toString(entity, defaultResponseCharset).replaceAll("\r", ""));
            }
        } catch (Throwable e) {
            logger.error("simplePostMethod request请求异常，url: " + url, e);
            generateHttpResult(result, false, e.getMessage());
        } finally {
            httpclient.getConnectionManager().shutdown();
        }
        return result;
    }

    public static Map<String, String> postMethod(String url, Map<String, String> params) {
        return postMethod(url, null, params);
    }

    public static Map<String, String> postMethod(String url, Map<String, String> headers, Map<String, String> params) {
        return postMethod(url, headers, params, DEFAULT_CHARSET);
    }

    public static Map<String, String> postMethod(String url, Map<String, String> headers, Map<String, String> params,
                                                 String defalutRequestCharset) {
        return postMethod(url, headers, params, defalutRequestCharset, DEFAULT_CHARSET);
    }

    public static Map<String, String> postMethod(String url, Map<String, String> headers, Map<String, String> params,
                                                 String defalutRequestCharset, String defaultResponseCharset) {
        logger.info("postMethod request url:{}, headers:{}, content: {}", new Object[]{url, headers, JsonUtil.toJson(params)});

        Map<String, String> result = new HashMap<String, String>();
        HttpClient httpclient = new DefaultHttpClient();
        try {
            HttpPost httpPost = new HttpPost(url);

            generateHttpPostHeaders(httpPost, headers);
            generateHttpPostParams(httpPost, params, defalutRequestCharset);

            HttpResponse response = httpclient.execute(httpPost);
            HttpEntity entity = response.getEntity();
            if (entity != null) {
                generateHttpResult(result, true,
                        EntityUtils.toString(entity, defaultResponseCharset).replaceAll("\r", ""));
            }
        } catch (Throwable e) {
            logger.error("postMethod request请求异常，url: " + url, e);
            generateHttpResult(result, false, e.getMessage());
        } finally {
            httpclient.getConnectionManager().shutdown();
        }
        return result;
    }

    /**
     * 生成httppost头部信息
     *
     * @param httpPost
     * @param headers
     */
    private static void generateHttpPostHeaders(HttpPost httpPost, Map<String, String> headers) {
        if (headers != null && headers.size() > 0) {
            for (String key : headers.keySet()) {
                httpPost.setHeader(key, headers.get(key));
            }
        }
    }

    /**
     * 生成httppost数据
     *
     * @param httpPost
     * @param params
     * @param defaultResponseCharset
     * @throws java.io.UnsupportedEncodingException
     */
    private static void generateHttpPostParams(HttpPost httpPost, Map<String, String> params,
                                               String defaultResponseCharset) throws UnsupportedEncodingException {
        if (params != null && params.size() > 0) {
            List<NameValuePair> nvps = new ArrayList<NameValuePair>();
            for (String key : params.keySet()) {
                nvps.add(new BasicNameValuePair(key, params.get(key)));
            }
            httpPost.setEntity(new UrlEncodedFormEntity(nvps, defaultResponseCharset));
        }
    }

    public static Map<String, String> getMethod(String url, Map<String, String> params) {
        Map<String, String> result = new HashMap<String, String>();
        HttpClient httpclient = new DefaultHttpClient();
        try {
            url = generateHttpGetUrl(url, params);
            HttpGet httpGet = new HttpGet(url);
            HttpResponse response = httpclient.execute(httpGet);
            HttpEntity entity = response.getEntity();
            if (entity != null) {
                generateHttpResult(result, true, EntityUtils.toString(entity).replaceAll("\r", ""));
            }
        } catch (Throwable e) {
            logger.error("GET请求异常，url: " + url, e);
            generateHttpResult(result, false, e.getMessage());
        } finally {
            httpclient.getConnectionManager().shutdown();
        }
        return result;
    }

    private static String generateHttpGetUrl(String url, Map<String, String> params) {
        if (params != null && params.size() > 0) {
            url += url.indexOf("?") > -1 ? "&" : "?timestamp=" + ExtUtilDateTime.nowDateString() + "&";
            for (String key : params.keySet()) {
                url += (key + "=" + params.get(key) + "&");
            }
            return url.substring(0, url.length() - 1);
        }
        return url;
    }

    private static void generateHttpResult(Map<String, String> result, boolean flag, String message) {
        logger.info("http response status：{}, response: {}", flag, message);
        result.put(RESULT_FLAG_KEY, flag ? RESULT_FLAG_TRUE : RESULT_FLAG_FALSE);
        result.put(RESULT_CONTENT_KEY, message);
    }

    /**
     * 判断http请求结果是否正确
     *
     * @param result
     * @return
     */
    public static boolean isSuccess(Map<String, String> result) {
        return result.get(RESULT_FLAG_KEY).equals(RESULT_FLAG_TRUE) ? true : false;
    }

    /**
     * 判断http请求结果是否失败
     *
     * @param result
     * @return
     */
    public static boolean isFaile(Map<String, String> result) {
        return result.get(RESULT_FLAG_KEY).equals(RESULT_FLAG_FALSE) ? true : false;
    }

    /**
     * 获取返回内容
     *
     * @param result
     * @return
     */
    public static String responseContent(Map<String, String> result) {
        return result.get(RESULT_CONTENT_KEY);
    }
}
