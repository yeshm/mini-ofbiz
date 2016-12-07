package org.miniofbiz.ext.ftl;

import freemarker.template.SimpleScalar;
import freemarker.template.TemplateModelException;
import freemarker.template.TemplateScalarModel;
import freemarker.template.TemplateTransformModel;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilValidate;
import org.miniofbiz.ext.util.ExtUtilDateTime;

import java.io.IOException;
import java.io.Writer;
import java.sql.Timestamp;
import java.util.Map;

/**
 * freemarker日期时间格式化标签
 * <p/>
 * <@extDateTimeFormat date=date/>
 * <@extDateTimeFormat date=date format="yyyy-MM-dd HH:mm:ss.SSS"/>
 */
public class ExtDateTimeFormatTransform implements TemplateTransformModel {

    public final static String module = ExtDateTimeFormatTransform.class.getName();

    @SuppressWarnings("unchecked")
    private static String getArg(Map args, String key) {
        String result = "";
        Object obj = args.get(key);
        if (obj != null) {
            if (Debug.verboseOn()) Debug.logVerbose("Arg Object : " + obj.getClass().getName(), module);
            if (obj instanceof TemplateScalarModel) {
                TemplateScalarModel s = (TemplateScalarModel) obj;
                try {
                    result = s.getAsString();
                } catch (TemplateModelException e) {
                    Debug.logError(e, "Template Exception", module);
                }
            } else {
                result = obj.toString();
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private static java.sql.Timestamp getTimestamp(Map args, String key) {
        if (args.containsKey(key)) {
            Object o = args.get(key);

            if (UtilValidate.isEmpty(o)) return null;

            if (Debug.verboseOn()) Debug.logVerbose("Amount Object : " + o.getClass().getName(), module);

            if (o instanceof SimpleScalar) {
                SimpleScalar s = (SimpleScalar) o;
                if (UtilValidate.isEmpty(s.getAsString())) return null;

                return ExtUtilDateTime.parseTimestamp(s.getAsString());
            }

            try {
                return ExtUtilDateTime.parseTimestamp(o.toString());
            } catch (Exception e) {
                Debug.logError(e, module);
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public Writer getWriter(final Writer out, final Map args) {
        final StringBuilder buf = new StringBuilder();

        final Timestamp date = ExtDateTimeFormatTransform.getTimestamp(args, "date");

        String formatTemp = ExtDateTimeFormatTransform.getArg(args, "format");
        if (UtilValidate.isWhitespace(formatTemp)) formatTemp = "yyyy-MM-dd HH:mm:ss";

        final String format = formatTemp;

        return new Writer(out) {
            @Override
            public void write(char cbuf[], int off, int len) {
                buf.append(cbuf, off, len);
            }

            @Override
            public void flush() throws IOException {
                out.flush();
            }

            @Override
            public void close() throws IOException {
                if (UtilValidate.isEmpty(date)) return;

                String dateString = ExtUtilDateTime.formatDate2String(date, format);

                out.write(dateString);
            }
        };
    }
}