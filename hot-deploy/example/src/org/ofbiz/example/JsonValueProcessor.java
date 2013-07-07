package org.ofbiz.example;

import java.math.BigDecimal;
import java.sql.Timestamp;

import net.sf.json.JsonConfig;

import org.ofbiz.base.util.UtilNumber;

public class JsonValueProcessor implements net.sf.json.processors.JsonValueProcessor {

	private static int decimals = -1;
	private static int rounding = -1;
	static {
		decimals = UtilNumber.getBigDecimalScale("finaccount.decimals");
		rounding = UtilNumber.getBigDecimalRoundingMode("finaccount.rounding");
	}
	
	@Override
	public Object processArrayValue(Object value, JsonConfig arg1) {
		if (value instanceof Timestamp[]) {
			long[] obj = {};
			Timestamp[] timestamps = (Timestamp[]) value;
			obj = new long[timestamps.length];
			for (int i = 0; i < timestamps.length; i++) {
				obj[i] = timestamps[i].getTime();
			}
			return obj;
		}else if(value instanceof BigDecimal[]){
			String[] obj = {};
			BigDecimal[] bigDecimals = (BigDecimal[]) value;
			obj = new String[bigDecimals.length];
			for (int i = 0; i < bigDecimals.length; i++) {
				obj[i] = bigDecimals[i].setScale(decimals, rounding).toString();
			}
			return obj;
		}
		return "";
	}

	@Override
	public Object processObjectValue(String key, Object value, JsonConfig config) {
		if(value instanceof BigDecimal){
			return ((BigDecimal) value).setScale(decimals, rounding).toString();
		}else if(value instanceof Timestamp){
			return ((Timestamp) value).getTime();	
		}
		return "";
	}

}