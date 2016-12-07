package org.miniofbiz.ext.util.jackson;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.ofbiz.base.util.UtilNumber;
import org.ofbiz.base.util.UtilValidate;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Map;

/**
 * Jackson自定义序列化类，可针对一些数据类型进行特殊的格式处理
 */
public class CustomObjectSerializer extends JsonSerializer<Map> {

    private static int decimals = -1;
    private static int rounding = -1;

    static {
        decimals = UtilNumber.getBigDecimalScale("finaccount.decimals");
        rounding = UtilNumber.getBigDecimalRoundingMode("finaccount.rounding");
    }

    @Override
    public void serialize(Map value, JsonGenerator jgen, SerializerProvider provider) throws IOException, JsonProcessingException {
        jgen.writeStartObject();
        if (UtilValidate.isNotEmpty(value)) {
            for (Object key : value.keySet()) {
                Object v = value.get(key);
                if (v instanceof Map) {
                    jgen.writeFieldName(key.toString());
                    serialize((Map) value.get(key), jgen, provider);
                } else if (v instanceof Timestamp) {
                    jgen.writeNumberField(key.toString(), ((Timestamp) v).getTime());
                } else if (v instanceof BigDecimal) {
                    BigDecimal b = ((BigDecimal) v).setScale(decimals, rounding);
                    jgen.writeStringField(key.toString(), b.toString());
                } else {
                    jgen.writeFieldName(key.toString());
                    jgen.writeObject(v);
                }
            }
        }
        jgen.writeEndObject();
    }

    @Override
    public Class<Map> handledType() {
        return Map.class;
    }
}