package org.miniofbiz.ext.util;

import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.GeneralRuntimeException;
import org.ofbiz.entity.Delegator;
import org.ofbiz.entity.GenericDelegator;
import org.ofbiz.entity.GenericEntityException;
import org.ofbiz.entity.datasource.GenericHelperInfo;
import org.ofbiz.entity.jdbc.ConnectionFactory;
import org.ofbiz.entity.model.ModelEntity;
import org.ofbiz.entity.model.ModelField;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Sequence Utility to get unique sequences from named sequence banks
 * Uses a collision detection approach to safely get unique sequenced ids in banks from the database
 * 序列的使用需注意，使用数据库悲观锁实现代价比较大，需考量使用的场景，并做压力测试。
 */
public class SequenceHelper {

    public static final String module = SequenceHelper.class.getName();

    private final GenericHelperInfo helperInfo;
    private final String tableName;
    private final String nameColName;
    private final String idColName;

    public SequenceHelper(GenericDelegator delegator, GenericHelperInfo helperInfo, ModelEntity seqEntity, String nameFieldName, String idFieldName) {
        this.helperInfo = helperInfo;
        if (seqEntity == null) {
            throw new IllegalArgumentException("The sequence model entity was null but is required.");
        }
        this.tableName = seqEntity.getTableName(helperInfo.getHelperBaseName());

        ModelField nameField = seqEntity.getField(nameFieldName);

        if (nameField == null) {
            throw new IllegalArgumentException("Could not find the field definition for the sequence name field " + nameFieldName);
        }
        this.nameColName = nameField.getColName();

        ModelField idField = seqEntity.getField(idFieldName);

        if (idField == null) {
            throw new IllegalArgumentException("Could not find the field definition for the sequence id field " + idFieldName);
        }
        this.idColName = idField.getColName();

    }

    public static Long getNextSeq(Delegator delegator, String seqName) {
        try {
            GenericHelperInfo helperInfo = delegator.getGroupHelperInfo(delegator.getEntityGroupName("SequenceValueItem"));
            ModelEntity seqEntity = delegator.getModelEntity("SequenceValueItem");
            GenericDelegator d = (GenericDelegator) delegator;

            SequenceHelper helper = new SequenceHelper(d, helperInfo, seqEntity, "seqName", "seqId");

            Long l = null;
            String sql;

            Connection conn = ConnectionFactory.getConnection(helperInfo.getHelperBaseName());

            sql = "SELECT " + helper.idColName + " FROM " + helper.tableName + " WHERE " + helper.nameColName + " = ? FOR UPDATE";
            PreparedStatement statement = conn.prepareStatement(sql);
            statement.setString(1, seqName);
            ResultSet rs = statement.executeQuery();

            if (rs.next()) {
                String seq = rs.getString(helper.idColName);
                rs.close();
                statement.close();

                l = Long.parseLong(seq);
                l++;

                sql = "UPDATE " + helper.tableName + " SET " + helper.idColName + "=" + helper.idColName + "+" + 1 + " WHERE " + helper.nameColName + "='" + seqName + "'";
                statement = conn.prepareStatement(sql);
                if (statement.executeUpdate() <= 0) {
                    throw new GenericEntityException("No rows changed when trying insert new sequence row with this SQL: " + sql);
                }
            } else {
                rs.close();
                statement.close();
                sql = "SELECT " + helper.idColName + " FROM " + helper.tableName + " WHERE " + helper.nameColName + " = '_NA_' FOR UPDATE";
                statement = conn.prepareStatement(sql);
                rs = statement.executeQuery();
                rs.close();
                statement.close();
                l = 1l;

                sql = "INSERT INTO " + helper.tableName + " (" + helper.nameColName + ", " + helper.idColName + ") VALUES ('" + seqName + "', " + 1 + ")";
                statement = conn.prepareStatement(sql);
                if (statement.executeUpdate() <= 0) {
                    throw new GenericEntityException("No rows changed when trying insert new sequence row with this SQL: " + sql);
                }
            }

            return l;
        } catch (Exception e) {
            Debug.logError(e, module);
            throw new GeneralRuntimeException(e);
        }
    }

}
