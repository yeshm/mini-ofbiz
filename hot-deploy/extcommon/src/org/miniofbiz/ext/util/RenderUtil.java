package org.miniofbiz.ext.util;

import net.sf.json.JSONObject;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang.StringUtils;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilGenerics;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.base.util.collections.MapStack;
import org.ofbiz.service.DispatchContext;
import org.ofbiz.widget.html.HtmlScreenRenderer;
import org.ofbiz.widget.screen.ScreenRenderer;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;
import java.util.Map;

public class RenderUtil {

    /**
     * The HTTP Content-Disposition header field name.
     */
    public static final String CONTENT_DISPOSITION = "Content-Disposition";
    /**
     * The HTTP Expires header field name.
     */
    public static final String EXPIRES = "Expires";
    /**
     * The HTTP Pragma header field name.
     */
    public static final String PRAGMA = "Pragma";
    /**
     * The HTTP Cache-Control header field name.
     */
    public static final String CACHE_CONTROL = "Cache-Control";

    //-- Content Type 定义 --//
    public static final String TEXT_TYPE = "text/plain";
    public static final String JSON_TYPE = "application/json";
    public static final String XML_TYPE = "text/xml";
    public static final String HTML_TYPE = "text/html";
    public static final String JS_TYPE = "text/javascript";
    public static final String EXCEL_TYPE = "application/vnd.ms-excel";

    //-- Header 定义 --//
    public static final String AUTHENTICATION_HEADER = "Authorization";

    //-- 常用数值定义 --//
    public static final long ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

    //-- header 常量定义 --//
    private static final String HEADER_ENCODING = "encoding";
    private static final String HEADER_NOCACHE = "no-cache";
    private static final String DEFAULT_ENCODING = "UTF-8";
    private static final boolean DEFAULT_NOCACHE = true;

    private static final HtmlScreenRenderer htmlScreenRenderer = new HtmlScreenRenderer();

    //-- 绕过jsp/freemaker直接输出文本的函数 --//

    /**
     * 直接输出内容的简便函数.
     * <p/>
     * eg.
     * render("text/plain", "hello", "encoding:GBK");
     * render("text/plain", "hello", "no-cache:false");
     * render("text/plain", "hello", "encoding:GBK", "no-cache:false");
     *
     * @param headers 可变的header数组，目前接受的值为"encoding:"或"no-cache:",默认值分别为UTF-8和true.
     */
    public static void render(HttpServletResponse response, final String contentType, final String content,
                              final String... headers) {
        initResponseHeader(response, contentType, headers);
        try {
            response.getWriter().write(content);
            response.getWriter().flush();
        } catch (IOException e) {
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    /**
     * 直接输出文本.
     *
     * @see #render(javax.servlet.http.HttpServletResponse, String, String, String...)
     */
    public static void renderText(HttpServletResponse response, final String text, final String... headers) {
        render(response, RenderUtil.TEXT_TYPE, text, headers);
    }

    /**
     * 直接输出HTML.
     *
     * @see #render(javax.servlet.http.HttpServletResponse, String, String, String...)
     */
    public static void renderHtml(HttpServletResponse response, final String html, final String... headers) {
        render(response, RenderUtil.HTML_TYPE, html, headers);
    }

    /**
     * 直接输出XML.
     *
     * @see #render(javax.servlet.http.HttpServletResponse, String, String, String...)
     */
    public static void renderXml(HttpServletResponse response, final String xml, final String... headers) {
        render(response, RenderUtil.XML_TYPE, xml, headers);
    }

    /**
     * 直接输出JSON.
     *
     * @param jsonString json字符串.
     * @see #render(javax.servlet.http.HttpServletResponse, String, String, String...)
     */
    public static void renderJson(HttpServletResponse response, final String jsonString, final String... headers) {
        render(response, RenderUtil.JSON_TYPE, jsonString, headers);
    }

    /**
     * 直接输出JSON,使用Jackson转换Java对象.
     *
     * @param data 可以是List<POJO>, POJO[], POJO, 也可以Map名值对.
     * @see #render(javax.servlet.http.HttpServletResponse, String, String, String...)
     */
    public static void renderJson(HttpServletResponse response, final Object data, final String... headers) {
        initResponseHeader(response, RenderUtil.JSON_TYPE, headers);
        try {
            JSONObject json = JSONObject.fromObject(data);
            response.getWriter().write(json.toString());
            response.getWriter().flush();
        } catch (IOException e) {
            throw new IllegalArgumentException(e);
        }
    }

    /**
     * 直接输出支持跨域Mashup的JSONP.
     *
     * @param callbackName callback函数名.
     * @param object       Java对象,可以是List<POJO>, POJO[], POJO ,也可以Map名值对, 将被转化为json字符串.
     */
    public static void renderJsonp(HttpServletResponse response, final String callbackName, final Object object,
                                   final String... headers) {
        String jsonString = null;
        try {
            JSONObject json = JSONObject.fromObject(object);
            response.getWriter().write(json.toString());
            response.getWriter().flush();
        } catch (IOException e) {
            throw new IllegalArgumentException(e);
        }

        String result = new StringBuilder().append(callbackName).append("(").append(jsonString).append(");").toString();

        //渲染Content-Type为javascript的返回内容,输出结果为javascript语句, 如callback197("{html:'Hello World!!!'}");
        render(response, RenderUtil.JS_TYPE, result, headers);
    }

    /**
     * 分析并设置contentType与headers.
     */
    public static HttpServletResponse initResponseHeader(HttpServletResponse response, final String contentType,
                                                         final String... headers) {
        //分析headers参数
        String encoding = DEFAULT_ENCODING;
        boolean noCache = DEFAULT_NOCACHE;
        for (String header : headers) {
            String headerName = StringUtils.substringBefore(header, ":");
            String headerValue = StringUtils.substringAfter(header, ":");

            if (StringUtils.equalsIgnoreCase(headerName, HEADER_ENCODING)) {
                encoding = headerValue;
            } else if (StringUtils.equalsIgnoreCase(headerName, HEADER_NOCACHE)) {
                noCache = Boolean.parseBoolean(headerValue);
            } else {
                throw new IllegalArgumentException(headerName + "不是一个合法的header类型");
            }
        }

        //设置headers参数
        String fullContentType = contentType + ";charset=" + encoding;
        response.setContentType(fullContentType);
        if (noCache) {
            setNoCacheHeader(response);
        }

        return response;
    }

    /**
     * 文件下载
     *
     * @param response
     * @param fileUrl
     */
    public static void downFile(HttpServletResponse response, String fileUrl) {
        String fileName = FilenameUtils.getName(fileUrl);
        downFile(response, fileUrl, fileName);
    }

    /**
     * 文件下载
     *
     * @param response
     * @param fileUrl
     * @param fileName
     */
    public static void downFile(HttpServletResponse response, String fileUrl, String fileName) {
        try {
            File file = new File(fileUrl);

            InputStream ins;
            if (file.exists()) {
                ins = new FileInputStream(file);
            } else {
                URL url = new URL(fileUrl);
                HttpURLConnection httpUrl = (HttpURLConnection) url.openConnection();
                //连接指定的资源
                httpUrl.connect();
                //获取网络输入流
                ins = httpUrl.getInputStream();
            }

            if (UtilValidate.isNotEmpty(ins)) {
                BufferedInputStream bins = new BufferedInputStream(ins);// 放到缓冲流里面
                OutputStream outs = response.getOutputStream();// 获取文件输出IO流
                BufferedOutputStream bouts = new BufferedOutputStream(outs);
                initResponseHeader(response, "application/x-download");
                setFileDownloadHeader(response, fileName);
                int bytesRead = 0;
                byte[] buffer = new byte[8192];
                // 开始向网络传输文件流
                while ((bytesRead = bins.read(buffer, 0, 8192)) != -1) {
                    bouts.write(buffer, 0, bytesRead);
                }
                bouts.flush();// 这里一定要调用flush()方法
                ins.close();
                bins.close();
                outs.close();
                bouts.close();
            }
        } catch (IOException e) {
            Debug.logError(e, "文件下载出错");
        }
    }

    /**
     * 文本内容转换成文件下载
     */
    public static void downTextAsFile(HttpServletResponse response, String content, String fileName) throws IOException {
        try {
            RenderUtil.setFileDownloadHeader(response, fileName);

            OutputStream out = response.getOutputStream();
            response.setContentType("text/plain; charset=utf-8");
            out.write(content.getBytes(Charset.forName("UTF-8")));
            out.flush();
            out.close();
        } catch (IOException e) {
            Debug.logError(e, "文件下载出错");
        }
    }

    /**
     * 设置让浏览器弹出下载对话框的Header.
     *
     * @param fileName 下载后的文件名.
     */
    public static void setFileDownloadHeader(HttpServletResponse response, String fileName) {
        try {
            // 中文文件名支持
            String encodedfileName = new String(fileName.getBytes(), "ISO8859-1");
            response.setHeader(CONTENT_DISPOSITION, "attachment; filename=\"" + encodedfileName + "\"");
        } catch (UnsupportedEncodingException e) {
        }
    }

    /**
     * 设置禁止客户端缓存的Header.
     */
    public static void setNoCacheHeader(HttpServletResponse response) {
        // Http 1.0 header
        response.setDateHeader(EXPIRES, 1L);
        response.addHeader(PRAGMA, "no-cache");
        // Http 1.1 header
        response.setHeader(CACHE_CONTROL, "no-cache, no-store, max-age=0");
    }

    /**
     * 渲染screen，并获取最终输出结果
     *
     * @param context      上下文参数
     * @param combinedName screen路径
     * @return
     */
    public static String renderHtmlScreen(MapStack<String> context, String combinedName) {
        if (UtilValidate.isEmpty(combinedName)) {
            return "";
        }
        StringWriter htmlWriter = new StringWriter();
        ScreenRenderer screens = new ScreenRenderer(htmlWriter, context, htmlScreenRenderer);
        try {
            screens.render(combinedName);
            return htmlWriter.toString();
        } catch (Throwable e) {
            Debug.logError(e, "renderHtmlScreen combinedName: " + combinedName + "异常");
            return "";
        }

    }

    public static String renderHtmlScreenForRequest(HttpServletRequest request, HttpServletResponse response, String combinedName) {
        return renderHtmlScreenForRequest(request, response, null, combinedName);
    }

    public static String renderHtmlScreenForRequest(HttpServletRequest request, HttpServletResponse response, MapStack<String> context, String combinedName) {
        if (UtilValidate.isEmpty(combinedName)) {
            return "";
        }
        StringWriter htmlWriter = new StringWriter();
        ScreenRenderer screens = new ScreenRenderer(htmlWriter, context, htmlScreenRenderer);
        screens.populateContextForRequest(request, response, request.getSession().getServletContext());
        try {
            screens.render(combinedName);
            return htmlWriter.toString();
        } catch (Throwable e) {
            Debug.logError(e, "renderHtmlScreenForRequest combinedName: " + combinedName + "异常");
            return "";
        }

    }

    public static String renderHtmlScreenForService(DispatchContext dctx, Map<String, ? extends Object> serviceContext, MapStack<String> context, String combinedName) {
        if (UtilValidate.isEmpty(combinedName)) {
            return "";
        }
        Map<String, Object> screenContext = UtilGenerics.checkMap(serviceContext.remove("screenContext"));
        StringWriter htmlWriter = new StringWriter();
        ScreenRenderer screens = new ScreenRenderer(htmlWriter, context, htmlScreenRenderer);
        screens.populateContextForService(dctx, screenContext);
        try {
            screens.render(combinedName);
            return htmlWriter.toString();
        } catch (Throwable e) {
            Debug.logError(e, "renderHtmlScreenForService combinedName: " + combinedName + "异常");
            return "";
        }
    }
}
