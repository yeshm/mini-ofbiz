package org.miniofbiz.ext.util;

import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.util.JSONPObject;
import com.fasterxml.jackson.module.jaxb.JaxbAnnotationModule;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;

/**
 * 简单封装Jackson，实现Xml String<->Java Object的Mapper.
 * 
 * 封装不同的输出风格, 使用不同的builder函数创建实例.
 * 
 */
public class XmlMapper {

    private static Logger logger = LoggerFactory.getLogger(XmlMapper.class);

    private com.fasterxml.jackson.dataformat.xml.XmlMapper mapper;
    
    public XmlMapper() {
        this(null);
    }

    public XmlMapper(Include include) {
        mapper = new com.fasterxml.jackson.dataformat.xml.XmlMapper();
        // 设置输出时包含属性的风格
        if (include != null) {
            mapper.setSerializationInclusion(include);
        }
        // 设置输入时忽略在JSON字符串中存在但Java对象实际没有的属性
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    }

    public XmlMapper(Include include, String formatPattern) {
        mapper = new com.fasterxml.jackson.dataformat.xml.XmlMapper();
        // 设置输出时包含属性的风格
        if (include != null) {
            mapper.setSerializationInclusion(include);
        }
        // 设置输入时忽略在JSON字符串中存在但Java对象实际没有的属性
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);

        // 设置时间格式
        setDateFormat(formatPattern);
    }

    /**
     * 创建只输出非Null且非Empty(如List.isEmpty)的属性到Json字符串的Mapper,建议在外部接口中使用.
     */
    public static XmlMapper nonEmptyMapper() {
        return new XmlMapper(Include.NON_EMPTY);
    }
    
    /**
     * 可以允许为空值，但null忽略
     * @return
     */
    public static XmlMapper emptyMapper() {
        return new XmlMapper(Include.NON_NULL);
    }

    public static XmlMapper nonEmptyMapper(String formatPattern) {
        return new XmlMapper(Include.NON_EMPTY, formatPattern);
    }

    /**
     * 创建只输出初始值被改变的属性到Json字符串的Mapper, 最节约的存储方式，建议在内部接口中使用。
     */
    public static XmlMapper nonDefaultMapper() {
        return new XmlMapper(Include.NON_DEFAULT);
    }

    public static XmlMapper nonDefaultMapper(String formatPattern) {
        return new XmlMapper(Include.NON_DEFAULT, formatPattern);
    }

    /**
     * 设置转换日期类型的format pattern,如果不设置默认打印Timestamp毫秒数.
     */
    public void setDateFormat(String formatPattern) {
        if (StringUtils.isNotBlank(formatPattern)) {
            DateFormat df = new SimpleDateFormat(formatPattern);
            mapper.setDateFormat(df);
        }
    }

    /**
     * Object可以是POJO，也可以是Collection或数组。 如果对象为Null, 返回"null". 如果集合为空集合, 返回"[]".
     */
    public String toXml(Object object) {

        try {
            return mapper.writeValueAsString(object);
        } catch (IOException e) {
            logger.warn("write to xml string error:" + object, e);
            return null;
        }
    }

    /**
     * 反序列化POJO或简单Collection如List<String>.
     * 
     * 如果JSON字符串为Null或"null"字符串, 返回Null. 如果JSON字符串为"[]", 返回空集合.
     * 
     * 如需反序列化复杂Collection如List<MyBean>, 请使用fromXml(String,JavaType)
     * 
     * @see #fromXml(String, JavaType)
     */
    public <T> T fromXml(String xmlString, Class<T> clazz) {
        if (StringUtils.isEmpty(xmlString)) {
            return null;
        }

        try {
            return mapper.readValue(xmlString, clazz);
        } catch (IOException e) {
            logger.warn("parse xml string error:" + xmlString, e);
            return null;
        }
    }

    /**
     * 反序列化复杂Collection如List<Bean>, 先使用函數createCollectionType构造类型,然后调用本函数.
     * 
     * @see #createCollectionType(Class, Class...)
     */
    public <T> T fromXml(String xmlString, JavaType javaType) {
        if (StringUtils.isEmpty(xmlString)) {
            return null;
        }

        try {
            return (T) mapper.readValue(xmlString, javaType);
        } catch (IOException e) {
            logger.warn("parse xml string error:" + xmlString, e);
            return null;
        }
    }

    /**
     * 構造泛型的Collection Type如: ArrayList<MyBean>,
     * 则调用constructCollectionType(ArrayList.class,MyBean.class)
     * HashMap<String,MyBean>, 则调用(HashMap.class,String.class, MyBean.class)
     */
    public JavaType createCollectionType(Class<?> collectionClass, Class<?>... elementClasses) {
        return mapper.getTypeFactory().constructParametricType(collectionClass, elementClasses);
    }

    /**
     * 當JSON裡只含有Bean的部分屬性時，更新一個已存在Bean，只覆蓋該部分的屬性.
     */
    public <T> T update(String xmlString, T object) {
        try {
            return (T) mapper.readerForUpdating(object).readValue(xmlString);
        } catch (JsonProcessingException e) {
            logger.warn("update xml string:" + xmlString + " to object:" + object + " error.", e);
        } catch (IOException e) {
            logger.warn("update xml string:" + xmlString + " to object:" + object + " error.", e);
        }
        return null;
    }

    /**
     * 輸出JSONP格式數據.
     */
    public String toXmlP(String functionName, Object object) {
        return toXml(new JSONPObject(functionName, object));
    }

    /**
     * 設定是否使用Enum的toString函數來讀寫Enum, 為False時時使用Enum的name()函數來讀寫Enum, 默認為False.
     * 注意本函數一定要在Mapper創建後, 所有的讀寫動作之前調用.
     */
    public void enableEnumUseToString() {
        mapper.enable(SerializationFeature.WRITE_ENUMS_USING_TO_STRING);
        mapper.enable(DeserializationFeature.READ_ENUMS_USING_TO_STRING);
    }

    /**
     * 支持使用Jaxb的Annotation，使得POJO上的annotation不用与Jackson耦合。
     * 默认会先查找jaxb的annotation，如果找不到再找jackson的。
     */
    public void enableJaxbAnnotation() {
        JaxbAnnotationModule module = new JaxbAnnotationModule();
        mapper.registerModule(module);
    }

    /**
     * 取出Mapper做进一步的设置或使用其他序列化API.
     */
    public ObjectMapper getMapper() {
        return mapper;
    }
}
