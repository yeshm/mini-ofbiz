package org.miniofbiz.ext.util;

import javolution.util.FastMap;
import org.apache.http.*;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.HttpResponseException;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContexts;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.pool.PoolStats;
import org.apache.http.util.EntityUtils;
import org.apache.pdfbox.io.IOUtils;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.service.ServiceUtil;

import javax.net.ssl.SSLContext;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ExtHttpClient {

    public static final String module = ExtHttpClient.class.getName();

    private static CloseableHttpClient httpClient = null;
    private static RequestConfig requestConfig = null;
    private static PoolingHttpClientConnectionManager cm = null;

    static {
        cm = new PoolingHttpClientConnectionManager();
        cm.setMaxTotal(200);

        requestConfig = RequestConfig
                .custom()
                .setSocketTimeout(10000)
                .setConnectTimeout(10000)
                .setConnectionRequestTimeout(10000)
                .build();//设置请求和传输超时时间

        try {
            SSLContext sslContext = SSLContexts.custom()
                    .loadTrustMaterial((KeyStore) null, new TrustSelfSignedStrategy())
                            //I had a trust store of my own, and this might not work!
                    .build();

            SSLConnectionSocketFactory sslsf = new SSLConnectionSocketFactory(
                    sslContext,
                    SSLConnectionSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER);

            httpClient = HttpClients
                    .custom()
                    .setConnectionManager(cm)
                    .setDefaultRequestConfig(requestConfig)
                    .setHostnameVerifier(SSLConnectionSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER)
                    .setSSLSocketFactory(sslsf).build();

        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (KeyManagementException e) {
            e.printStackTrace();
        } catch (KeyStoreException e) {
            e.printStackTrace();
        }
    }

    public static Map post(String url, Map<String, String> parameters) throws UnsupportedEncodingException {
        Map<String, String> headerParams = new HashMap<String, String>();

        return post(url, parameters, headerParams);
    }

    public static Map post(String url, Map<String, String> parameters, Map<String, String> headerParams) throws UnsupportedEncodingException {
        HttpPost httpPost = new HttpPost(url);
        Debug.logInfo("httpPost url:" + url, module);
        Debug.logInfo("httpPost parameters:" + parameters, module);


        List<NameValuePair> nvps = new ArrayList<NameValuePair>();        //post Parameters
        if (UtilValidate.isNotEmpty(parameters)) {
            for (String k : parameters.keySet()) {
                nvps.add(new BasicNameValuePair(k, parameters.get(k)));
            }
        }

        httpPost.setEntity(new UrlEncodedFormEntity(nvps, Consts.UTF_8));

        if (UtilValidate.isNotEmpty(headerParams)) {
            for (String key : headerParams.keySet()) {
                httpPost.setHeader(key, headerParams.get(key));
                Debug.logInfo("httpPost Header " + key + ":" + headerParams.get(key), module);
            }
        }

        return post(httpPost);
    }

    public static Map post(String url, String body) throws UnsupportedEncodingException {
        Map<String, String> headerParams = new HashMap<String, String>();

        return post(url, body, headerParams);
    }

    public static Map post(String url, String body, Map<String, String> headerParams) throws UnsupportedEncodingException {
        return post(httpClient, url, body, headerParams);
    }

    public static Map post(HttpClient httpClient, String url, String body, Map<String, String> headerParams) throws UnsupportedEncodingException {
        HttpPost httpPost = new HttpPost(url);
        Debug.logInfo("httpPost url:" + url, module);
        Debug.logInfo("httpPost body:" + body, module);

        if (UtilValidate.isNotEmpty(body)) {
            HttpEntity entity = new ByteArrayEntity(body.getBytes(Consts.UTF_8));
            httpPost.setEntity(entity);
        }

        if (UtilValidate.isNotEmpty(headerParams)) {
            for (String key : headerParams.keySet()) {
                httpPost.setHeader(key, headerParams.get(key));
                Debug.logInfo("httpPost Header " + key + ":" + headerParams.get(key), module);
            }
        }

        return post(httpClient, httpPost);
    }

    public static Map post(String url, String body, File file) throws UnsupportedEncodingException {
        HttpPost httpPost = new HttpPost(url);
        Debug.logInfo("httpPost url:" + url, module);
        Debug.logInfo("httpPost file:" + file, module);

        if (UtilValidate.isNotEmpty(file)) {
            MultipartEntity entity = new MultipartEntity();
            FileBody bin = new FileBody(file);
            StringBody comment = new StringBody(body, Consts.UTF_8);
            entity.addPart("file", bin);
            entity.addPart("comment", comment);
            httpPost.setEntity(entity);
        }

        return post(httpPost);
    }

    public static Map post(HttpPost httpPost) {
        return post(httpClient, httpPost);
    }

    public static Map post(HttpClient httpClient, HttpPost httpPost) {
        ResponseHandler responseHandler = new StringResponseHandler();
        try {
            Map results = (Map) httpClient.execute(httpPost, responseHandler);
            return results;
        } catch (IOException e) {
            e.printStackTrace();
        }

        Map<String, Object> results = ServiceUtil.returnSuccess();
        Map<String, Object> errorMap = FastMap.newInstance();
        errorMap.put("errcode", "-2");
        results.put("responseString", JsonUtil.toJson(errorMap));
        return results;
    }

    public static Map get(String url) throws UnsupportedEncodingException {
        HttpGet httpGet = new HttpGet(url);

        Debug.logInfo("httpGet url:" + url, module);

        try {
            ResponseHandler responseHandler = new StringResponseHandler();
            Map results = (Map) httpClient.execute(httpGet, responseHandler);

            return results;
        } catch (IOException e) {
            Debug.logError(e, module);
        }
        return null;
    }

    public static Map getFile(String url) {
        HttpGet httpGet = new HttpGet(url);

        try {
            ResponseHandler<Map> responseHandler = new FileResponseHandler();
            Map results = httpClient.execute(httpGet, responseHandler);
            return results;
        } catch (IOException e) {
            Debug.logError(e, module);
        }
        return null;
    }

    static class StringResponseHandler implements ResponseHandler<Map> {

        @Override
        public Map handleResponse(HttpResponse response) throws ClientProtocolException, IOException {
            StatusLine statusLine = response.getStatusLine();
            HttpEntity entity = response.getEntity();
            if (statusLine.getStatusCode() >= 300) {
                throw new HttpResponseException(
                        statusLine.getStatusCode(),
                        statusLine.getReasonPhrase());
            }
            if (entity == null) {
                throw new ClientProtocolException("Response contains no content");
            }

            Debug.logInfo("ResponseHandler statusLine:" + statusLine.toString(), module);

            Map results;

            if (statusLine.getStatusCode() == HttpStatus.SC_OK) {
                results = ServiceUtil.returnSuccess();
                if (entity != null) {
                    results.put("responseString", EntityUtils.toString(entity, Consts.UTF_8));
                }

                Debug.logInfo("ResponseHandler content:" + results.get("responseString"), module);
            } else {
                results = ServiceUtil.returnError("httpGet Error");
            }

            results.put("statusCode", statusLine.getStatusCode());
            results.put("protocolVersion", statusLine.getProtocolVersion());
            results.put("reasonPhrase", statusLine.getReasonPhrase());

            return results;
        }
    }

    static class FileResponseHandler implements ResponseHandler<Map> {

        @Override
        public Map handleResponse(HttpResponse response) throws ClientProtocolException, IOException {
            StatusLine statusLine = response.getStatusLine();
            HttpEntity entity = response.getEntity();
            if (statusLine.getStatusCode() >= 300) {
                throw new HttpResponseException(
                        statusLine.getStatusCode(),
                        statusLine.getReasonPhrase());
            }
            if (entity == null) {
                throw new ClientProtocolException("Response contains no content");
            }

            Debug.logInfo("httpGet statusLine:" + statusLine.toString(), module);

            ExtUtilHttp.logReponseHeader(response, module);

            Map results;
            InputStream inputStream;

            if (statusLine.getStatusCode() == HttpStatus.SC_OK) {
                results = ServiceUtil.returnSuccess();

                String filename = ExtUtilHttp.getResponseFileName(response);
                results.put("filename", filename);

                if (entity != null) {
                    inputStream = entity.getContent();

                    byte[] bytes = IOUtils.toByteArray(inputStream);
                    results.put("bytes", bytes);

                    if (Debug.infoOn()) Debug.logInfo("httpGet response==>bytes:" + bytes.toString(), module);
                }

            } else {
                results = ServiceUtil.returnError("httpGet Error");
            }

            results.put("statusCode", statusLine.getStatusCode());
            results.put("protocolVersion", statusLine.getProtocolVersion());
            results.put("reasonPhrase", statusLine.getReasonPhrase());

            return results;
        }
    }

    public static PoolStats getPoolStats() {
        return cm.getTotalStats();
    }

}
