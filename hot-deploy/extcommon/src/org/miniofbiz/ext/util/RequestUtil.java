package org.miniofbiz.ext.util;

import org.miniofbiz.ext.biz.ConstantParameter;

import javax.servlet.ServletRequest;


public class RequestUtil {
    /**分页的当前页码，第一页的pageIndex为0**/
    public static int getRequestPageIndex(ServletRequest request){
        String v = request.getParameter("pageIndex");
        return parseInt(v,0);
    }

    public static int getRequestPageSize(ServletRequest request,int defaultValue){
        String v = request.getParameter("limit");
        return parseInt(v,defaultValue);
    }

    public static int getRequestPageSize(ServletRequest request){
        return getRequestPageSize(request, ConstantParameter.DEFAULT_GRID_PAGE_SIZE);
    }

    private static int parseInt(String s,int defaultValue){
        if(ExtUtilValidate.isEmpty(s)){
            return defaultValue;
        }
        try {
            return Integer.valueOf(s);
        }catch (Exception e){
            //nothing
            return defaultValue;
        }
    }
}
