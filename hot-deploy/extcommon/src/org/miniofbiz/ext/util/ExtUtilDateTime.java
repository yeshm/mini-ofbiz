package org.miniofbiz.ext.util;

import javolution.util.FastSet;
import org.apache.commons.lang.time.DateUtils;
import org.joda.time.*;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.GeneralRuntimeException;
import org.ofbiz.base.util.UtilDateTime;
import org.ofbiz.base.util.UtilValidate;

import java.sql.Timestamp;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;

public class ExtUtilDateTime extends UtilDateTime {

    public static final String module = ExtUtilDateTime.class.getName();

    public static final Set<String> PARSE_PATTERNS = FastSet.newInstance();

    public static final String DATE_NUMBER_FORMAT = "yyyyMMdd";
    public static final String DATE_TIME_NUMBER_FORMAT = "yyyyMMddHHmmss";

    static {
        PARSE_PATTERNS.add("yyyy-MM");
        PARSE_PATTERNS.add("yyyyMMdd");
        PARSE_PATTERNS.add("yyyy.MM.dd");
        PARSE_PATTERNS.add("yyyy/MM/dd");
        PARSE_PATTERNS.add("yyyy-MM-dd");
        PARSE_PATTERNS.add("yyyy-MM-dd HH:mm:ss.SSS");
        PARSE_PATTERNS.add("yyyy-MM-dd HH:mm:ss");
        PARSE_PATTERNS.add("yyyyMMddHHmmss");
    }

    public static Timestamp parseTimestamp(String str) {
        Date newDate = parseDate(str);

        if (newDate != null) {
            return new Timestamp(newDate.getTime());
        } else {
            return null;
        }
    }

    public static Date parseDate(String str) {
        try {
            return DateUtils.parseDate(str, PARSE_PATTERNS.toArray(new String[PARSE_PATTERNS.size()]));
        } catch (ParseException e) {
            Debug.logError(e, module);
            throw new GeneralRuntimeException("无法解析日期：" + str, e);
        }
    }

    public static Date parseDate(String str, String dateFromat) {
        Set<String> patterns = FastSet.newInstance();
        patterns.addAll(PARSE_PATTERNS);
        patterns.add(dateFromat);
        try {
            return DateUtils.parseDate(str, patterns.toArray(new String[patterns.size()]));
        } catch (ParseException e) {
            Debug.logError(e, module);
            throw new GeneralRuntimeException("无法解析日期：" + str, e);
        }
    }

    public static java.sql.Date parseSqlDate(String str, String format) {
        return new java.sql.Date(parseDate(str, format).getTime());
    }

    public static java.sql.Date nowSqlDate() {
        return parseSqlDate(ExtUtilDateTime.nowDate2String(), ExtUtilDateTime.DATE_FORMAT);
    }


    private static Timestamp praseDateTime2Timestamp(DateTime dateTime) {
        return new Timestamp(dateTime.getMillis());
    }

    /**
     * 获得日期相加N个月之后的时间
     */
    public static Timestamp getMonthRangeTimestamp(Object date, int monthsLater) {
        DateTime dateTime = new DateTime(date);
        DateTime plusMonthsDateTime = dateTime.plusMonths(monthsLater).withTime(0, 0, 0, 0);

        return praseDateTime2Timestamp(plusMonthsDateTime);
    }

    /**
     * 获得日期相加N个月之后的时间
     */
    public static DateTime getMonthRangeDateTime(Object date, int monthsLater) {
        DateTime dateTime = new DateTime(date);
        DateTime plusMonthsDateTime = dateTime.plusMonths(monthsLater).withTime(0, 0, 0, 0);

        return plusMonthsDateTime;
    }

    /**
     * 获得日期相加月份之后的第一天开始时间
     */
    public static Timestamp getMonthRangeStart(Object date, int monthsLater) {
        DateTime plusMonthsDateTime = getMonthRangeDateTime(date, monthsLater);

        return new Timestamp(plusMonthsDateTime.dayOfMonth().withMinimumValue().getMillis());
    }

    /**
     * 获得日期相加月份之后的最后一天结束时间
     */
    public static Timestamp getMonthRangeEnd(Object date, int monthsLater) {
        DateTime dateTime = new DateTime(date);
        DateTime plusMonthsDateTime = dateTime.plusMonths(monthsLater).withTime(23, 59, 59, 999);

        return praseDateTime2Timestamp(plusMonthsDateTime);
    }

    public static String dateString(Date date) {
        SimpleDateFormat df = new SimpleDateFormat(UtilDateTime.DATE_FORMAT);
        return df.format(date);
    }

    public static String dateString(Date date, String format) {
        SimpleDateFormat df = new SimpleDateFormat(format);
        return df.format(date);
    }

    public static String dateTimeString(Date date) {
        SimpleDateFormat df = new SimpleDateFormat(UtilDateTime.DATE_FORMAT + " " + UtilDateTime.TIME_FORMAT);
        return df.format(date);
    }

    public static String formatDate2String(Object date, String formatString) {
        DateTime dateTime = new DateTime(date);

        return dateTime.toString(formatString);
    }

    public static Date getNowDateStart() {
        return getDateStart(nowDate());
    }

    public static Date getNowDateEnd() {
        return getDateEnd(nowDate());
    }

    public static String getTodayStartString() {
        DateTime dateTime = new DateTime(UtilDateTime.nowDate());
        DateTime newDateTime = dateTime.withTime(0, 0, 0, 0);

        return newDateTime.toString("yyyy-MM-dd HH:mm:ss");
    }

    public static Date getDateStart(Date date) {
        DateTime dateTime = new DateTime(date);
        DateTime newDateTime = dateTime.withTime(0, 0, 0, 0);

        return newDateTime.toDate();
    }

    public static Date getDateEnd(Date date) {
        DateTime dateTime = new DateTime(date);
        DateTime newDateTime = dateTime.withTime(23, 59, 59, 999);

        return newDateTime.toDate();
    }

    /**
     * 获取两个日期区间每一天的日期
     *
     * @return List
     */
    public static List<String> getEveryDayDateFromStartDateAndEndDate(Object startDate, Object endDate, String format) throws ParseException {
        List<String> dateTimeList = new ArrayList<String>();

        DateTime start = new DateTime(startDate);
        DateTime end = new DateTime(endDate);
        int daysInterval = Days.daysBetween(start, end).getDays();

        for (int i = 0; i <= daysInterval; i++) {
            DateTime nextDateTime = start.plusDays(i);
            dateTimeList.add(nextDateTime.toString(format));
        }

        return dateTimeList;
    }

    public static String formatDate2String(Timestamp stamp, String format) {
        SimpleDateFormat df = new SimpleDateFormat(format);
        return df.format(stamp);
    }

    public static String nowDate2String() {
        return nowDateString(DATE_FORMAT);
    }

    /**
     * 获取两个日期区间相差的月份数
     */
    public static int getMonthInterval(Object startDateTime, Object endDateTime) {
        DateTime start = new DateTime(startDateTime);
        DateTime end = new DateTime(endDateTime);

        return Months.monthsBetween(start, end).getMonths();
    }

    /**
     * 获取两个日期区间相差的分钟数
     */
    public static int getMinutesInterval(Object startDateTime, Object endDateTime) {
        DateTime start = new DateTime(startDateTime);
        DateTime end = new DateTime(endDateTime);

        return Minutes.minutesBetween(start, end).getMinutes();
    }

    /**
     * 获取两个日期区间相差的小时数
     */
    public static int getHoursInterval(Object startDateTime, Object endDateTime) {
        DateTime start = new DateTime(startDateTime);
        DateTime end = new DateTime(endDateTime);

        return Hours.hoursBetween(start, end).getHours();
    }

    /**
     * 时间计算（传入的时间加上分钟数，返回相加之后的时间）
     */
    public static Timestamp addMinuteToTimestamp(Object dateTime, int minutes) {
        DateTime dateTimeObj = new DateTime(dateTime);
        DateTime dateTimePlusObj = dateTimeObj.plusMinutes(minutes);

        Timestamp timestamp = new Timestamp(dateTimePlusObj.getMillis());

        return timestamp;
    }

    /**
     * 开始时间是否在结束时间之前
     */
    public static boolean isBefore(Object startDateTime, Object endDateTime) {
        DateTime start = new DateTime(startDateTime);
        DateTime end = new DateTime(endDateTime);

        return start.isBefore(end.getMillis());
    }


    public static boolean isTimeActive(Timestamp startTimeStamp, Timestamp endTimeStamp, Timestamp moment) {
        if (UtilValidate.isEmpty(startTimeStamp) && UtilValidate.isEmpty(endTimeStamp)) return true;

        Timestamp fromDate = null;
        Timestamp thruDate = null;

        String date = ExtUtilDateTime.formatDate2String(moment, ExtUtilDateTime.DATE_FORMAT);

        if (UtilValidate.isNotEmpty(startTimeStamp)) {
            String time = ExtUtilDateTime.formatDate2String(startTimeStamp, ExtUtilDateTime.TIME_FORMAT);
            String dateTime = date + " " + time;
            fromDate = ExtUtilDateTime.parseTimestamp(dateTime);
        }

        if (UtilValidate.isNotEmpty(endTimeStamp)) {
            String time = ExtUtilDateTime.formatDate2String(endTimeStamp, ExtUtilDateTime.TIME_FORMAT);
            String dateTime = date + " " + time;
            thruDate = ExtUtilDateTime.parseTimestamp(dateTime);
        }

        if ((thruDate == null || thruDate.after(moment)) && (fromDate == null || fromDate.before(moment) || fromDate.equals(moment))) {
            return true;
        } else {
            return false;
        }
    }

    public static int getIntervalInDaysOverride(Timestamp from, Timestamp thru) {
        String fromDate = ExtUtilDateTime.formatDate2String(from, ExtUtilDateTime.DATE_FORMAT);
        String thruDate = ExtUtilDateTime.formatDate2String(thru, ExtUtilDateTime.DATE_FORMAT);

        int intervalInDays = getIntervalInDays(ExtUtilDateTime.parseTimestamp(fromDate), ExtUtilDateTime.parseTimestamp(thruDate));

        return intervalInDays;
    }
}
