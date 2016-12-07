package org.miniofbiz.ext.util;

import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.UtilDateTime;
import org.ofbiz.base.util.UtilMisc;
import org.ofbiz.entity.Delegator;
import org.ofbiz.entity.GenericEntityException;
import org.ofbiz.entity.GenericValue;
import org.ofbiz.entity.condition.EntityCondition;
import org.ofbiz.entity.condition.EntityOperator;
import org.ofbiz.entity.transaction.TransactionUtil;
import org.ofbiz.entity.util.EntityFindOptions;
import org.ofbiz.entity.util.EntityListIterator;
import org.ofbiz.entity.util.EntityUtil;
import org.miniofbiz.ext.bean.Page;

import javax.servlet.ServletRequest;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ExtEntityUtil extends EntityUtil {

    public static GenericValue findOne(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        return delegator.findOne(entityName, fields, false);
    }

    public static GenericValue findOneCache(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        return delegator.findOne(entityName, fields, true);
    }

    public static List<GenericValue> findList(Delegator delegator, String entityName, EntityCondition condition) throws GenericEntityException {
        return delegator.findList(entityName, condition, null, null, null, false);
    }

    public static List<GenericValue> findList(Delegator delegator, String entityName, EntityCondition condition, List<String> orderBy) throws GenericEntityException {
        return delegator.findList(entityName, condition, null, orderBy, null, false);
    }

    public static List<GenericValue> findList(Delegator delegator, String entityName, Set<String> fieldsToSelect, EntityCondition condition) throws GenericEntityException {
        return delegator.findList(entityName, condition, fieldsToSelect, null, null, false);
    }

    public static List<GenericValue> findList(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return findList(delegator, entityName, ecl);
    }

    public static List<GenericValue> findList(Delegator delegator, String entityName, Set<String> fieldsToSelect, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return findList(delegator, entityName, fieldsToSelect, ecl);
    }

    public static List<GenericValue> findListCache(Delegator delegator, String entityName, EntityCondition condition) throws GenericEntityException {
        return delegator.findList(entityName, condition, null, null, null, true);
    }

    public static List<GenericValue> findListCache(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return findListCache(delegator, entityName, ecl);
    }

    public static List<GenericValue> findListCache(Delegator delegator, String entityName, Set<String> fieldsToSelect, EntityCondition condition) throws GenericEntityException {
        return delegator.findList(entityName, condition, fieldsToSelect, null, null, true);
    }

    public static List<GenericValue> findListCache(Delegator delegator, String entityName, Set<String> fieldsToSelect, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return delegator.findList(entityName, ecl, fieldsToSelect, null, null, true);
    }

    public static List<GenericValue> findListSortedCache(Delegator delegator, String entityName, EntityCondition condition, List<String> orderBy) throws GenericEntityException {
        return delegator.findList(entityName, condition, null, orderBy, null, true);
    }

    public static List<GenericValue> findListSortedCache(Delegator delegator, String entityName, Map<String, ? extends Object> fields, List<String> orderBy) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return findListSortedCache(delegator, entityName, ecl, orderBy);
    }

    public static List<GenericValue> findListSortedCache(Delegator delegator, String entityName, Set<String> fieldsToSelect, EntityCondition condition, List<String> orderBy) throws GenericEntityException {
        return delegator.findList(entityName, condition, fieldsToSelect, orderBy, null, true);
    }

    public static List<GenericValue> findListSortedCache(Delegator delegator, String entityName, Set<String> fieldsToSelect, Map<String, ? extends Object> fields, List<String> orderBy) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return findListSortedCache(delegator, entityName, fieldsToSelect, ecl, orderBy);
    }

    public static List<GenericValue> findListSorted(Delegator delegator, String entityName, EntityCondition condition, List<String> orderBy) throws GenericEntityException {
        return delegator.findList(entityName, condition, null, orderBy, null, false);
    }

    public static List<GenericValue> findListSorted(Delegator delegator, String entityName, Map<String, ? extends Object> fields, List<String> orderBy) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return findListSorted(delegator, entityName, ecl, orderBy);
    }

    public static List<GenericValue> findListSorted(Delegator delegator, String entityName, Set<String> fieldsToSelect, EntityCondition condition, List<String> orderBy) throws GenericEntityException {
        return delegator.findList(entityName, condition, fieldsToSelect, orderBy, null, false);
    }

    public static List<GenericValue> findListSorted(Delegator delegator, String entityName, Set<String> fieldsToSelect, Map<String, ? extends Object> fields, List<String> orderBy) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return findListSorted(delegator, entityName, fieldsToSelect, ecl, orderBy);
    }

    public static GenericValue getOnly(Delegator delegator, String entityName, EntityCondition condition) throws GenericEntityException {
        List<GenericValue> list = findList(delegator, entityName, condition);
        return EntityUtil.getOnly(list);
    }

    public static GenericValue getOnly(Delegator delegator, String entityName, Set<String> fieldsToSelect, EntityCondition condition) throws GenericEntityException {
        List<GenericValue> list = findList(delegator, entityName, fieldsToSelect, condition);
        return EntityUtil.getOnly(list);
    }

    public static GenericValue getOnly(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return getOnly(delegator, entityName, ecl);
    }

    public static GenericValue getOnly(Delegator delegator, String entityName, Set<String> fieldsToSelect, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return getOnly(delegator, entityName, fieldsToSelect, ecl);
    }

    public static GenericValue getOnlyCache(Delegator delegator, String entityName, Set<String> fieldsToSelect, EntityCondition condition) throws GenericEntityException {
        List<GenericValue> list = findListCache(delegator, entityName, fieldsToSelect, condition);
        return EntityUtil.getOnly(list);
    }

    public static GenericValue getOnlyCache(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return getOnlyCache(delegator, entityName, ecl);
    }

    public static GenericValue getOnlyCache(Delegator delegator, String entityName, EntityCondition condition) throws GenericEntityException {
        List<GenericValue> list = findListCache(delegator, entityName, condition);
        return EntityUtil.getOnly(list);
    }

    public static GenericValue getFirst(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return getFirst(delegator, entityName, ecl);
    }

    public static GenericValue getFirst(Delegator delegator, String entityName, EntityCondition condition) throws GenericEntityException {
        return getFirst(delegator, entityName, condition, false);
    }

    public static GenericValue getFirstCache(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return getFirstCache(delegator, entityName, ecl);
    }

    public static GenericValue getFirstCache(Delegator delegator, String entityName, EntityCondition condition) throws GenericEntityException {
        return getFirst(delegator, entityName, condition, true);
    }

    public static GenericValue getFirst(Delegator delegator, String entityName, EntityCondition condition, boolean useCache) throws GenericEntityException {
        return getFirstSorted(delegator, entityName, condition, null, useCache);
    }

    public static GenericValue getFirstSorted(Delegator delegator, String entityName, Map<String, ? extends Object> fields, List<String> orderBy) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return getFirstSorted(delegator, entityName, ecl, orderBy);
    }

    public static GenericValue getFirstSorted(Delegator delegator, String entityName, EntityCondition condition, List<String> orderBy) throws GenericEntityException {
        return getFirstSorted(delegator, entityName, condition, orderBy, false);
    }

    public static GenericValue getFirstSorted(Delegator delegator, String entityName, List<String> orderBy) throws GenericEntityException {
        return getFirstSorted(delegator, entityName, null, orderBy, false);
    }

    public static GenericValue getFirstSortedCache(Delegator delegator, String entityName, Map<String, ? extends Object> fields, List<String> orderBy) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return getFirstSortedCache(delegator, entityName, ecl, orderBy);
    }

    public static GenericValue getFirstSortedCache(Delegator delegator, String entityName, EntityCondition condition, List<String> orderBy) throws GenericEntityException {
        return getFirstSorted(delegator, entityName, condition, orderBy, true);
    }

    public static GenericValue getFirstSortedCache(Delegator delegator, String entityName, List<String> orderBy) throws GenericEntityException {
        return getFirstSorted(delegator, entityName, null, orderBy, true);
    }

    public static GenericValue getFirstSorted(Delegator delegator, String entityName, EntityCondition condition, List<String> orderBy, boolean useCache) throws GenericEntityException {
        List<GenericValue> list = delegator.findList(entityName, condition, null, orderBy, null, useCache);
        return EntityUtil.getFirst(list);
    }

    public static List<GenericValue> findAll(Delegator delegator, String entityName) throws GenericEntityException {
        EntityCondition ecl = null;
        return findList(delegator, entityName, ecl);
    }

    public static List<GenericValue> findAllSorted(Delegator delegator, String entityName, List<String> orderBy) throws GenericEntityException {
        EntityCondition ecl = null;
        return delegator.findList(entityName, ecl, null, orderBy, null, false);
    }

    public static long findCountByFields(Delegator delegator, String entityName, Map<String, ? extends Object> fields) throws GenericEntityException {
        EntityCondition ecl = EntityCondition.makeCondition(fields);
        return delegator.findCountByCondition(entityName, ecl, null, null);
    }

    public static long findCountByCondition(Delegator delegator, String entityName, EntityCondition entityCondition) throws GenericEntityException {
        return delegator.findCountByCondition(entityName, entityCondition, null, null);
    }

    public static List<String> getAllPartyUserLoginId(GenericValue userLogin) {
        String partyId = userLogin.getString("partyId");
        try {
            List<GenericValue> all = userLogin.getDelegator().findByAndCache("UserLogin", UtilMisc.toMap("partyId", partyId));
            return getFieldListFromEntityList(all, "userLoginId", false);
        } catch (GenericEntityException e) {
            Debug.log(e.getMessage(), module);
        }
        return null;
    }

    public static EntityCondition getUserLoginEntityCondition(GenericValue userLogin) {
        List<String> ids = getAllPartyUserLoginId(userLogin);
        EntityCondition condition = null;
        if (ids.size() == 1) {
            condition = EntityCondition.makeCondition("userLoginId", ids.get(0));
        } else {
            condition = EntityCondition.makeCondition("userLoginId", EntityOperator.IN, ids);
        }
        return condition;
    }

    public static void testUserLoginIdThrowException(GenericValue gv, ServletRequest request) {
        GenericValue userLogin = (GenericValue) request.getAttribute("userLogin");
        String gvUserLoginId = gv.getString("userLoginId");
        boolean result = false;
        if (ExtUtilValidate.isNotEmpty(userLogin) && ExtUtilValidate.isNotEmpty(gvUserLoginId)) {
            result = getAllPartyUserLoginId(userLogin).contains(gvUserLoginId);
        }
        if (!result) {
            throw new RuntimeException("非法访问");
        }
    }

    /**
     * @param delegator
     * @param entityName
     * @param condition
     * @param orderBy
     * @param pageIndex  分页的当前页码，第一页的pageIndex为0
     * @param pageSize
     * @return
     * @throws GenericEntityException
     */
    public static Page<GenericValue> pageByAnd(Delegator delegator, String entityName, EntityCondition condition, List<String> orderBy, int pageIndex, int pageSize) throws GenericEntityException {
        return pageByAnd(delegator, entityName, condition, null, orderBy, pageIndex, pageSize);
    }

    public static Page<GenericValue> pageByAnd(Delegator delegator, String entityName, EntityCondition condition, Set<String> fieldsToSelect, List<String> orderBy, int pageIndex, int pageSize) throws GenericEntityException {
        EntityFindOptions findOptions = new EntityFindOptions();
        EntityListIterator it = null;
        boolean beganTransaction = false;
        try {
            beganTransaction = TransactionUtil.begin();
            findOptions.setResultSetType(EntityFindOptions.TYPE_SCROLL_INSENSITIVE);
            it = delegator.find(entityName, condition, null, fieldsToSelect, orderBy, findOptions);
            int totalSize = it.getResultsSizeAfterPartialList();
            int start = (pageIndex * pageSize) + 1;
            List<GenericValue> content = it.getPartialList(start, pageSize);
            Page<GenericValue> page = new Page<GenericValue>(pageIndex, pageSize, totalSize, content);
            return page;
        } finally {
            TransactionUtil.commit(beganTransaction);
            if (it != null) {
                it.close();
            }
        }
    }

    public static List<GenericValue> topList(Delegator delegator, String entityName, EntityCondition condition, List<String> orderBy, int count) throws GenericEntityException {
        EntityFindOptions findOptions = new EntityFindOptions();
        EntityListIterator it = null;
        try {
            it = delegator.find(entityName, condition, null, null, orderBy, findOptions);
            return it.getPartialList(0, count);
        } finally {
            if (it != null) {
                it.close();
            }
        }
    }

    public static GenericValue getUserLoginByPartyId(Delegator delegator, String partyId) throws GenericEntityException {
        List<GenericValue> list = delegator.findByAnd("UserLogin", UtilMisc.toMap("partyId", partyId));
        return EntityUtil.getOnly(list);
    }

    public static String getUserLoginIdByPartyId(Delegator delegator, String partyId) throws GenericEntityException {
        List<GenericValue> list = delegator.findByAnd("UserLogin", UtilMisc.toMap("partyId", partyId));
        GenericValue userLogin = EntityUtil.getOnly(list);
        return ExtUtilValidate.isEmpty(userLogin) ? "" : (String) userLogin.get("userLoginId");
    }


    public static GenericValue getPersonByPartyId(Delegator delegator, String partyId) throws GenericEntityException {
        List<GenericValue> list = delegator.findByAnd("Person", UtilMisc.toMap("partyId", partyId));
        return EntityUtil.getOnly(list);
    }

    public static EntityCondition getFilterByTodayExpr(String dateFieldName) {
        Timestamp now = UtilDateTime.nowTimestamp();
        Timestamp todayStart = UtilDateTime.getDayStart(now);
        Timestamp todayEnd = UtilDateTime.getDayEnd(now);

        EntityCondition entityCondition = EntityCondition.makeCondition(
                EntityCondition.makeCondition(dateFieldName, EntityOperator.GREATER_THAN_EQUAL_TO, todayStart),
                EntityCondition.makeCondition(dateFieldName, EntityOperator.LESS_THAN_EQUAL_TO, todayEnd)
        );
        return entityCondition;
    }

    public static EntityCondition getFilterByYesterdayExpr(String dateFieldName) {
        Timestamp yesterday = UtilDateTime.addDaysToTimestamp(UtilDateTime.nowTimestamp(), -1);
        Timestamp yesterdayStart = UtilDateTime.getDayStart(yesterday);
        Timestamp yesterdayEnd = UtilDateTime.getDayEnd(yesterday);

        EntityCondition entityCondition = EntityCondition.makeCondition(
                EntityCondition.makeCondition(dateFieldName, EntityOperator.GREATER_THAN_EQUAL_TO, yesterdayStart),
                EntityCondition.makeCondition(dateFieldName, EntityOperator.LESS_THAN_EQUAL_TO, yesterdayEnd)
        );
        return entityCondition;
    }

    public static EntityCondition makeNotEqualsCondition(String fieldName, String fieldValue) {
        EntityCondition entityCondition = EntityCondition.makeCondition(
                EntityCondition.makeCondition(fieldName, null),
                EntityOperator.OR,
                EntityCondition.makeCondition(fieldName, EntityOperator.NOT_EQUAL, fieldValue)
        );
        return entityCondition;
    }
}
