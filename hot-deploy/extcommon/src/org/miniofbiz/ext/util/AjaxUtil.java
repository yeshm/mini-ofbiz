package org.miniofbiz.ext.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.ofbiz.base.util.UtilValidate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class AjaxUtil {
    private static final Logger logger = LoggerFactory.getLogger(AjaxUtil.class);
    public static enum ResultType{
        success, error, nosession
    }

    private static final JsonMapper mapper = JsonMapper.nonEmptyMapper();

    public static void renderSuccess(HttpServletResponse response) {
        render(response, null, null, null, ResultType.success);
    }
    
    public static void renderSuccess(HttpServletResponse response, final Object o, final String... headers) {
        render(response, o, null, null, ResultType.success, headers);
    }
    
    public static void renderError(HttpServletResponse response, final String message, final String... headers) {
        renderError(response, null, message, null, headers);
    }
    
    //TODO若重载，在调用的时候报模棱两可
    public static void renderError(HttpServletResponse response, final String message, final String code) {
        String[] empty = {};
        renderError(response, null, message, code, empty);
    }
    
    public static void renderError(HttpServletResponse response, final Object o, final String message, final String code, final String... headers) {
        render(response, o, message, code, ResultType.error, headers);
    }
    
    public static void renderNoSession(HttpServletResponse response, final String... headers) {
        render(response, null, null, null, ResultType.nosession, headers);
    }
    
    public static void render(HttpServletResponse response, final Object o, final String message, final String code, ResultType resultType, final String... headers) {
        ObjectNode objectNode = mapper.getMapper().createObjectNode();
        objectNode.put("result", resultType.toString());
        if(UtilValidate.isNotEmpty(o)) objectNode.put("data", mapper.getMapper().valueToTree(o));
        if(UtilValidate.isNotEmpty(message)) objectNode.put("message", message);
        if(UtilValidate.isNotEmpty(code)) objectNode.put("code", code);
        
        render(response, objectNode, headers);
    }
    
    public static void render(HttpServletResponse response, Object objectNode, final String... headers) {
        try {
            RenderUtil.renderJson(response, mapper.getMapper().writeValueAsString(objectNode), headers);
        } catch (JsonProcessingException e) {
            logger.error(e.getMessage(), e);
        }
    }

    public static boolean isAjaxRequest(HttpServletRequest request) {
        return (request.getHeader("accept").indexOf("application/json") > -1 || (request.getHeader("X-Requested-With") != null && request
                .getHeader("X-Requested-With").indexOf("XMLHttpRequest") > -1));
    }

}
