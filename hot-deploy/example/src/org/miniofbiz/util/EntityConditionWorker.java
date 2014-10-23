package org.miniofbiz.util;

import javolution.util.FastList;
import javolution.util.FastMap;
import net.sf.json.JSONArray;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilDateTime;
import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.entity.Delegator;
import org.ofbiz.entity.GenericEntity;
import org.ofbiz.entity.condition.EntityComparisonOperator;
import org.ofbiz.entity.condition.EntityCondition;
import org.ofbiz.entity.condition.EntityOperator;
import org.ofbiz.entity.model.ModelEntity;
import org.ofbiz.entity.model.ModelField;

import java.text.ParseException;
import java.util.*;

public class EntityConditionWorker {

    public final static String module = EntityConditionWorker.class.getName();
    public static Map<String, EntityComparisonOperator<?, ?>> entityOperators;

    static {
        entityOperators = FastMap.newInstance();
        entityOperators.put("between", EntityOperator.BETWEEN);
        entityOperators.put("equals", EntityOperator.EQUALS);
        entityOperators.put("greaterThan", EntityOperator.GREATER_THAN);
        entityOperators.put("greaterThanEqualTo", EntityOperator.GREATER_THAN_EQUAL_TO);
        entityOperators.put("in", EntityOperator.IN);
        entityOperators.put("lessThan", EntityOperator.LESS_THAN);
        entityOperators.put("lessThanEqualTo", EntityOperator.LESS_THAN_EQUAL_TO);
        entityOperators.put("like", EntityOperator.LIKE);
        entityOperators.put("notLike", EntityOperator.NOT_LIKE);
        entityOperators.put("not", EntityOperator.NOT);
        entityOperators.put("notEqual", EntityOperator.NOT_EQUAL);
        entityOperators.put("eq", EntityOperator.EQUALS);
        entityOperators.put("ne", EntityOperator.NOT_EQUAL);
        entityOperators.put("lt", EntityOperator.LESS_THAN);
        entityOperators.put("le", EntityOperator.LESS_THAN_EQUAL_TO);
        entityOperators.put("gt", EntityOperator.GREATER_THAN);
        entityOperators.put("ge", EntityOperator.GREATER_THAN_EQUAL_TO);
        entityOperators.put("bw", EntityOperator.LIKE);
        entityOperators.put("bn", EntityOperator.NOT_LIKE);
        entityOperators.put("in", EntityOperator.IN);
        entityOperators.put("ni", EntityOperator.NOT_IN);
        entityOperators.put("ew", EntityOperator.LIKE);
        entityOperators.put("en", EntityOperator.NOT_LIKE);
        entityOperators.put("cn", EntityOperator.LIKE);
        entityOperators.put("nc", EntityOperator.NOT_LIKE);
    }

    public static EntityCondition createSingleCondition(Delegator delegator, String entityName, String fieldName, String operation, Object fieldValue) {

        ModelEntity modelEntity = delegator.getModelEntity(entityName);
        ModelField modelField = modelEntity.getField(fieldName);
        if (modelField == null) {
//        	Debug.logError("can't find modelField["+fieldName+"] for entity["+entityName+"]", module);
            return null;
        }

        if (UtilValidate.isEmpty(fieldValue)) {
//        	Debug.logError("fieldValue is empty", module);
            return null;
        }

        EntityCondition cond = null;

        EntityComparisonOperator<?, ?> fieldOp = null;
        if (entityOperators.containsKey(operation)) fieldOp = entityOperators.get(operation);
        else fieldOp = EntityOperator.EQUALS;

        if (modelField.getType().equals("date-time") && ((String) fieldValue).length() == 10 && (operation.equals("lt") || operation.equals("lessThan") || operation.equals("le") || operation.equals("lessThanEqualTo"))) {
            try {
                fieldValue = UtilDateTime.stringToTimeStamp((String) fieldValue + " 23:59:59.000", UtilDateTime.DATE_TIME_FORMAT, TimeZone.getDefault(), Locale.getDefault());
            } catch (ParseException e) {
                Debug.logError(e, module);
            }
        }

        if (operation != null) {
            if (operation.equals("like") || operation.equals("notLike") || operation.equals("cn") || operation.equals("nc")) {
                fieldValue = "%" + fieldValue + "%";
            } else if (operation.equals("bw") || operation.equals("bn")) {
                fieldValue = fieldValue + "%";
            } else if (operation.equals("ew") || operation.equals("en")) {
                fieldValue = "%" + fieldValue;
            } else if (operation.equals("in")) {
                JSONArray a = JSONArray.fromObject(fieldValue);
                List<Object> values = FastList.newInstance();
                for (int i = 0; i < a.size(); i++) {
                    values.add(modelField.getModelEntity().convertFieldValue(modelField, a.get(i), delegator, new HashMap<String, Object>()));
                }
                fieldValue = values;
            }
        }
        Object fieldObject = fieldValue;

        if (fieldOp != EntityOperator.IN || !(fieldValue instanceof Collection<?>)) {
            fieldObject = modelField.getModelEntity().convertFieldValue(modelField, fieldValue, delegator, new HashMap<String, Object>());
        }

        if (fieldObject.equals(GenericEntity.NULL_FIELD.toString())) {
            fieldObject = null;
        }

        cond = EntityCondition.makeCondition(fieldName, fieldOp, fieldObject);

        if (EntityOperator.NOT_EQUAL.equals(fieldOp) && fieldObject != null) {
            cond = EntityCondition.makeCondition(UtilMisc.toList(cond, EntityCondition.makeCondition(fieldName, null)), EntityOperator.OR);
        }
        return cond;
    }

}
