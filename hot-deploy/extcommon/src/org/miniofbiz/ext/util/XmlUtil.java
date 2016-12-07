package org.miniofbiz.ext.util;

import com.fasterxml.jackson.databind.JavaType;
import org.dom4j.Document;
import org.dom4j.io.OutputFormat;
import org.dom4j.io.SAXReader;
import org.dom4j.io.XMLWriter;
import org.ofbiz.base.util.UtilValidate;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;

/**
 * XML助手类
 */
public class XmlUtil {

    private static final XmlMapper xmlMapper = XmlMapper.nonEmptyMapper();
    private static final XmlMapper emptyXmlMapper = XmlMapper.emptyMapper();

    public static String formatXML(String inputXML) throws Exception {
        if (UtilValidate.isWhitespace(inputXML)) return inputXML;

        SAXReader reader = new SAXReader();
        Document document = reader.read(new StringReader(inputXML));
        String requestXML = null;
        XMLWriter writer = null;
        if (document != null) {
            try {
                StringWriter stringWriter = new StringWriter();
                OutputFormat format = new OutputFormat(" ", true);
                writer = new XMLWriter(stringWriter, format);
                writer.write(document);
                writer.flush();
                requestXML = stringWriter.getBuffer().toString();
            } finally {
                if (writer != null) {
                    try {
                        writer.close();
                    } catch (IOException e) {
                    }
                }
            }
        }
        return requestXML;
    }

    public static String toXml(final Object o) {
        String xml = xmlMapper.toXml(o);
        return xml;
    }

    public static String toXml(final Object o, boolean nonEmpty) {
        return nonEmpty ? xmlMapper.toXml(o) : emptyXmlMapper.toXml(o);
    }

    public static <T> T fromXml(String xmlString, Class<T> clazz) {
        return xmlMapper.fromXml(xmlString, clazz);
    }

    public static <T> T fromXml(String xmlString, JavaType javaType) {
        return xmlMapper.fromXml(xmlString, javaType);
    }

    public static XmlMapper getXmlMapper() {
        return xmlMapper;
    }
}
