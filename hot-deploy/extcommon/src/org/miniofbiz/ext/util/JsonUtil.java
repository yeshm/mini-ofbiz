package org.miniofbiz.ext.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.Version;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.miniofbiz.ext.util.jackson.CustomObjectSerializer;

import java.util.Map;

public class JsonUtil {

    private static final String module = JsonUtil.class.getName();

    private static final JsonMapper mapper;

    static {
        mapper = JsonMapper.nonEmptyMapper();

        SimpleModule simpleModule = new SimpleModule("SimpleModule", new Version(1, 0, 0, null, null, null));
        simpleModule.addSerializer(Map.class, new CustomObjectSerializer());
        mapper.getMapper().registerModule(simpleModule);
    }

    public static String toJson(final Object o) {
        String json = mapper.toJson(o);
        return json;
    }

    public static <T> T fromJson(String jsonString, Class<T> clazz) {
        return mapper.fromJson(jsonString, clazz);
    }

    public static <T> T fromJson(String jsonString, JavaType javaType) {
        return mapper.fromJson(jsonString, javaType);
    }

    public static JsonMapper getMapper() {
        return mapper;
    }

    public static JsonNode readTree(String content) {
        try {
            return getMapper().getMapper().readTree(content);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String writeValueAsString(JsonNode jsonNode) throws JsonProcessingException {
        return getMapper().getMapper().writeValueAsString(jsonNode);
    }

    public static <T> T convertValue(JsonNode jsonNode, Class<T> clazz) {
        return getMapper().getMapper().convertValue(jsonNode, clazz);
    }

}
