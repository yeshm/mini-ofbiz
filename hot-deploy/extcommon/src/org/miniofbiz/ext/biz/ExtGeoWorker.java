package org.miniofbiz.ext.biz;


import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.common.geo.GeoWorker;
import org.ofbiz.entity.Delegator;
import org.ofbiz.entity.GenericEntityException;
import org.ofbiz.entity.GenericValue;
import org.ofbiz.entity.condition.EntityCondition;
import org.miniofbiz.ext.util.ExtEntityUtil;

public class ExtGeoWorker extends GeoWorker {

    private static final String module = ExtGeoWorker.class.getName();

    public static GenericValue getGeo(Delegator delegator, String geoId) {
        try {
            if (UtilValidate.isWhitespace(geoId)) {
                return null;
            }
            GenericValue geo = ExtEntityUtil.getOnly(delegator, "Geo", EntityCondition.makeCondition("geoId", geoId));
            return geo;
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return null;
    }

    public static String getGeoName(Delegator delegator, String geoId) {
        if (UtilValidate.isWhitespace(geoId)) return null;

        GenericValue geo = getGeo(delegator, geoId);
        if (UtilValidate.isEmpty(geo)) return null;

        return geo.getString("geoName");
    }
    public static GenericValue getGeoByName(Delegator delegator, String geoTypeId, String geoName) {
        try {
            if (UtilValidate.isWhitespace(geoName)) {
                return null;
            }
            GenericValue geo = ExtEntityUtil.getOnly(delegator, "Geo", UtilMisc.toMap("geoName", geoName, "geoTypeId", geoTypeId));
            return geo;
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return null;
    }

    public static String getGeoIdByName(Delegator delegator, String geoTypeId, String geoName) {
        if (UtilValidate.isWhitespace(geoName)) return null;

        GenericValue geo = getGeoByName(delegator, geoTypeId, geoName);
        if (UtilValidate.isEmpty(geo)) return null;

        return geo.getString("geoId");
    }

    public static GenericValue getGeoCountyByCityNameAndCountyName(Delegator delegator, String cityName, String countyName) {
        try {
            if (UtilValidate.isWhitespace(cityName)) {
                return null;
            }
            //首先找出城市名对应的GeoId
            String geoId = getGeoIdByName(delegator, "CITY", cityName);
            GenericValue geo = ExtEntityUtil.getOnly(delegator, "GeoAssocAndGeoTo", UtilMisc.toMap("geoIdFrom", geoId, "geoName", countyName, "geoTypeId", "COUNTY"));
            return geo;
        } catch (GenericEntityException e) {
            Debug.logError(e, module);
        }
        return null;
    }

    public static String getGeoCountyIdByCityNameAndCountyName(Delegator delegator, String cityName, String countyName) {
        GenericValue geo = getGeoCountyByCityNameAndCountyName(delegator, cityName, countyName);
        return geo.getString("geoId");
    }
}