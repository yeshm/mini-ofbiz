package org.miniofbiz.ext.util;

import org.ofbiz.base.util.UtilValidate;

public class EmojiFilter {

    /**
     * 检测是否有emoji字符
     *
     * @param source
     * @return 一旦含有就抛出
     */

    public static boolean containsEmoji(String source) {
        if (UtilValidate.isWhitespace(source)) {
            return false;
        }

        int len = source.length();

        for (int i = 0; i < len; i++) {
            char codePoint = source.charAt(i);
            if (isEmojiCharacter(codePoint)) {
                //do nothing，判断到了这里表明，确认有表情字符
                return true;
            }
        }
        return false;
    }

    /**
     * 2014-12-20 12:52:23,059 |OFBiz-JobQueue-1     |GenericDelegator    |E| Failure in create operation for entity [BizWeixinUser]: org.ofbiz.entity.GenericEntityException: Error while inserting: [GenericEntity:BizWeixinUser][city,淸原郡(java.lang.String)][country,韩国(java.lang.String)][createdByUserLogin,merchant@juweitu.com(java.lang.String)][createdDate,2014-12-20 12:52:23.054(java.sql.Timestamp)][createdStamp,2014-12-20 12:52:23.054(java.sql.Timestamp)][createdTxStamp,2014-12-20 12:51:03.239(java.sql.Timestamp)][groupId,10010(java.lang.String)][headimgurl,http://wx.qlogo.cn/mmopen/PiajxSqBRaEIwLUAR7trhIGUFSe8EdqWlRnkYAtbMfD5FwvP64nXqW0AArGwZo6Ykt5ibzbgYq5eqIPkvFTdJBDA/0(java.lang.String)][language,zh_CN(java.lang.String)][lastModifiedByUserLogin,merchant@juweitu.com(java.lang.String)][lastModifiedDate,2014-12-20 12:52:23.054(java.sql.Timestamp)][lastUpdatedStamp,2014-12-20 12:52:23.054(java.sql.Timestamp)][lastUpdatedTxStamp,2014-12-20 12:51:03.239(java.sql.Timestamp)][nickname,🎩Poison(java.lang.String)][province,忠清北道(java.lang.String)][productStoreId,weimain(java.lang.String)][sex,1(java.lang.String)][subscribe,1(java.lang.String)][subscribeTime,2014-12-10 14:37:40.0(java.sql.Timestamp)][weixinOpenId,oQI2ctyKB9nTBNAiuSMF7Acd3JFA(java.lang.String)][weixinUserId,10097(java.lang.String)] (SQL Exception while executing the following:INSERT INTO BIZ_WEIXIN_USER (WEIXIN_USER_ID, PARTY_ID, PUBLIC_ACCOUNT_ID, WEIXIN_OPEN_ID, SUBSCRIBE, GROUP_ID, SEX, CITY, COUNTRY, LATITUDE, LONGITUDE, PRECISION_INFO, LAST_ACCESS_TIME_LONG, PROVINCE, LANGUAGE, HEADIMGURL, SUBSCRIBE_TIME, COMMENTS, NICKNAME, MESSAGE_BOARD_BALCKLISTED, MESSAGE_BOARD_BALCKLISTED_TIME, MESSAGE_BOARD_MANAGERED, STATUS_ID, CREATED_DATE, CREATED_BY_USER_LOGIN, LAST_MODIFIED_DATE, LAST_MODIFIED_BY_USER_LOGIN, LAST_UPDATED_STAMP, LAST_UPDATED_TX_STAMP, CREATED_STAMP, CREATED_TX_STAMP) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) (Incorrect string value: '\xF0\x9F\x8E\xA9Po...' for column 'NICKNAME' at row 1)). Rolling back transaction.
     2014-12-20 12:52:23,059 |OFBiz-JobQueue-1     |TransactionUtil     |W| [TransactionUtil.setRollbackOnly] Calling transaction setRollbackOnly; this stack trace shows where this is happening:
     java.lang.Exception: Failure in create operation for entity [BizWeixinUser]: org.ofbiz.entity.GenericEntityException: Error while inserting: [GenericEntity:BizWeixinUser][city,淸原郡(java.lang.String)][country,韩国(java.lang.String)][createdByUserLogin,merchant@juweitu.com(java.lang.String)][createdDate,2014-12-20 12:52:23.054(java.sql.Timestamp)][createdStamp,2014-12-20 12:52:23.054(java.sql.Timestamp)][createdTxStamp,2014-12-20 12:51:03.239(java.sql.Timestamp)][groupId,10010(java.lang.String)][headimgurl,http://wx.qlogo.cn/mmopen/PiajxSqBRaEIwLUAR7trhIGUFSe8EdqWlRnkYAtbMfD5FwvP64nXqW0AArGwZo6Ykt5ibzbgYq5eqIPkvFTdJBDA/0(java.lang.String)][language,zh_CN(java.lang.String)][lastModifiedByUserLogin,merchant@juweitu.com(java.lang.String)][lastModifiedDate,2014-12-20 12:52:23.054(java.sql.Timestamp)][lastUpdatedStamp,2014-12-20 12:52:23.054(java.sql.Timestamp)][lastUpdatedTxStamp,2014-12-20 12:51:03.239(java.sql.Timestamp)][nickname,🎩Poison(java.lang.String)][province,忠清北道(java.lang.String)][productStoreId,weimain(java.lang.String)][sex,1(java.lang.String)][subscribe,1(java.lang.String)][subscribeTime,2014-12-10 14:37:40.0(java.sql.Timestamp)][weixinOpenId,oQI2ctyKB9nTBNAiuSMF7Acd3JFA(java.lang.String)][weixinUserId,10097(java.lang.String)] (SQL Exception while executing the following:INSERT INTO BIZ_WEIXIN_USER (WEIXIN_USER_ID, PARTY_ID, PUBLIC_ACCOUNT_ID, WEIXIN_OPEN_ID, SUBSCRIBE, GROUP_ID, SEX, CITY, COUNTRY, LATITUDE, LONGITUDE, PRECISION_INFO, LAST_ACCESS_TIME_LONG, PROVINCE, LANGUAGE, HEADIMGURL, SUBSCRIBE_TIME, COMMENTS, NICKNAME, MESSAGE_BOARD_BALCKLISTED, MESSAGE_BOARD_BALCKLISTED_TIME, MESSAGE_BOARD_MANAGERED, STATUS_ID, CREATED_DATE, CREATED_BY_USER_LOGIN, LAST_MODIFIED_DATE, LAST_MODIFIED_BY_USER_LOGIN, LAST_UPDATED_STAMP, LAST_UPDATED_TX_STAMP, CREATED_STAMP, CREATED_TX_STAMP) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) (Incorrect string value: '\xF0\x9F\x8E\xA9Po...' for column 'NICKNAME' at row 1)). Rolling back transaction.

     \xF0\x9F\x8E\xA9Po...
     * @param codePoint
     * @return
     */
    private static boolean isEmojiCharacter(char codePoint) {
        return (codePoint == 0x0) ||
                (codePoint == 0x9) ||
                (codePoint == 0xA) ||
                (codePoint == 0xD) ||
                ((codePoint >= 0x20) && (codePoint <= 0xD7FF)) ||
                ((codePoint >= 0xE000) && (codePoint <= 0xFFFD)) ||
                ((codePoint >= 0x10000) && (codePoint <= 0x10FFFF));
    }


    /**
     * 过滤emoji 或者 其他非文字类型的字符
     *
     * @param source
     * @return
     */

    public static String filterEmoji(String source) {
        //不过滤emoji
        //if(true)  return source;

        if (!containsEmoji(source)) {
            return source;//如果不包含，直接返回
        }

        //到这里铁定包含
        StringBuilder buf = null;

        int len = source.length();

        for (int i = 0; i < len; i++) {
            char codePoint = source.charAt(i);
            if (isEmojiCharacter(codePoint)) {
                if (buf == null) {
                    buf = new StringBuilder(source.length());
                }
                buf.append(codePoint);
            } else {

            }
        }


        if (buf == null) {
            return source;//如果没有找到 emoji表情，则返回源字符串
        } else {
            if (buf.length() == len) {//这里的意义在于尽可能少的toString，因为会重新生成字符串
                return source;
            } else {
                return buf.toString();
            }
        }
    }
}