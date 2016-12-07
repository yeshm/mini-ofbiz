package org.miniofbiz.ext.util;

import javolution.util.FastList;
import javolution.util.FastMap;
import org.apache.poi.hssf.usermodel.*;
import org.apache.poi.hssf.util.CellRangeAddress;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.RichTextString;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.ss.util.NumberToTextConverter;
import org.apache.poi.xssf.usermodel.*;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.GeneralRuntimeException;
import org.ofbiz.base.util.StringUtil;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.entity.GenericValue;
import org.ofbiz.service.ServiceUtil;

import javax.servlet.http.HttpServletResponse;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.util.*;

public class ExcelUtil {

    private static final String numberFormatString = "#,##0";
    private static final String currencyFormatString = "\"¥\"#,##0.00";
    private static final String percentFormatString = "0.00%";
    private static final String dateFormatString = "yyyy-MM-dd HH:mm:ss";

    public static void createExcelFileOutputResponse(String fileName, String sheetName, List<String> headerFields, List<List<String>> dataList, Map<String, Object> options, HttpServletResponse response) throws IOException {
        createExcelFileOutputResponse(fileName, sheetName, headerFields, dataList, null, options, response);
    }

    public static void createExcelFileOutputResponse(String fileName, String sheetName, List<String> headerFields, List<List<String>> dataList, Map<String, List> styleMap, Map<String, Object> options, HttpServletResponse response) throws IOException {
        byte[] buffer = new byte[1024];

        response.reset();
        response.setContentType("application/vnd.ms-excel;charset=utf-8");

        if (UtilValidate.isWhitespace(fileName)) fileName = "聚微途网络科技有限公司";
        String extension = (boolean) options.get("isUseLowVersion") ? ".xls" : ".xlsx";
        response.addHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode(fileName, "UTF-8") + extension);

        OutputStream fileOutputStream = createExcelFile(sheetName, headerFields, dataList, styleMap, options, response);
        fileOutputStream.write(buffer);
        fileOutputStream.flush();
        fileOutputStream.close();
    }

    /**
     * 生成excel文件
     *
     * @param sheetName    excel标签名
     * @param headerFields 表格头数据集合
     * @param dataList     表格数据集合
     * @param styleMap     样式集合
     * @param options      选项集合
     */
    public static OutputStream createExcelFile(String sheetName, List<String> headerFields, List<List<String>> dataList, Map<String, List> styleMap, Map<String, Object> options, HttpServletResponse response) throws IOException {
        if (UtilValidate.isWhitespace(sheetName)) sheetName = "sheet1";
        if (UtilValidate.isEmpty(headerFields)) throw new GeneralRuntimeException("表格标题为空");

        //这里要注意,如果直接导出该文件,需要传入response对象,response.getOutputStream()不同于ByteArrayOutputStream,如果不传入,导出的文件则会损坏
        OutputStream outputStream;
        if (UtilValidate.isEmpty(response)) {
            outputStream = new ByteArrayOutputStream(1024);
        } else {
            outputStream = new BufferedOutputStream(response.getOutputStream());
        }

        List<Integer> cellWidthList = null;
        List<Integer> numberFormatList = null;
        List<Integer> currencyFormatList = null;
        List<Integer> percentFormatList = null;
        List<Integer> dateFormatList = null;
        if (UtilValidate.isNotEmpty(styleMap)) {
            cellWidthList = styleMap.get("cellWidth");
            numberFormatList = styleMap.get("numberFormat");
            currencyFormatList = styleMap.get("currencyFormat");
            percentFormatList = styleMap.get("percentFormat");
            dateFormatList = styleMap.get("dateFormat");
        }

        boolean isProtect = false;
        boolean isUseLowVersion = true;
        List<Map<String, Object>> validationDataList = null;
        List<Map<String, Integer>> mergedRegionList = null;
        if (UtilValidate.isNotEmpty(options)) {
            if (UtilValidate.isNotEmpty(options.get("isProtect"))) {
                isProtect = (boolean) options.get("isProtect");
            }
            if (UtilValidate.isNotEmpty(options.get("isUseLowVersion"))) {
                isUseLowVersion = (boolean) options.get("isUseLowVersion");
            }
            if (UtilValidate.isNotEmpty(options.get("validationDataList"))) {
                validationDataList = (List) options.get("validationDataList");
            }
            if (UtilValidate.isNotEmpty(options.get("mergedRegionList"))) {
                mergedRegionList = (List) options.get("mergedRegionList");
            }
        }

        if (isUseLowVersion) {
            HSSFWorkbook wb = new HSSFWorkbook();
            HSSFSheet sheet = wb.createSheet(sheetName);
            HSSFDataFormat dataFormat = wb.createDataFormat();
            HSSFCellStyle style = (HSSFCellStyle) createCellStyle(wb);

            if (isProtect) sheet.protectSheet("jianlaifu");
            sheet.createFreezePane(0, 1, 0, 1);

            // The maximum number of cell styles was exceeded. You can define up to 4000 styles in a .xls workbook
            HSSFCellStyle generalCellStyle = (HSSFCellStyle) createCellStyle(wb);

            HSSFCellStyle numberCellStyle = (HSSFCellStyle) createCellStyle(wb);
            numberCellStyle.setDataFormat(dataFormat.getFormat(numberFormatString));

            HSSFCellStyle currencyCellStyle = (HSSFCellStyle) createCellStyle(wb);
            currencyCellStyle.setDataFormat(dataFormat.getFormat(currencyFormatString));

            HSSFCellStyle percentCellStyle = (HSSFCellStyle) createCellStyle(wb);
            percentCellStyle.setDataFormat(dataFormat.getFormat(percentFormatString));

            HSSFCellStyle dateCellStyle = (HSSFCellStyle) createCellStyle(wb);
            dateCellStyle.setDataFormat(dataFormat.getFormat(dateFormatString));

            List<Integer> hasCellStyleList = new ArrayList<>();

            if (UtilValidate.isNotEmpty(numberFormatList)) {
                for (int column : numberFormatList) {
                    hasCellStyleList.add(column);
                    sheet.setDefaultColumnStyle(column, numberCellStyle);
                }
            }

            if (UtilValidate.isNotEmpty(currencyFormatList)) {
                for (int column : currencyFormatList) {
                    hasCellStyleList.add(column);
                    sheet.setDefaultColumnStyle(column, currencyCellStyle);
                }
            }

            if (UtilValidate.isNotEmpty(percentFormatList)) {
                for (int column : percentFormatList) {
                    hasCellStyleList.add(column);
                    sheet.setDefaultColumnStyle(column, percentCellStyle);
                }
            }

            if (UtilValidate.isNotEmpty(dateFormatList)) {
                for (int column : dateFormatList) {
                    hasCellStyleList.add(column);
                    sheet.setDefaultColumnStyle(column, dateCellStyle);
                }
            }

            HSSFCell cell;
            HSSFRow row = sheet.createRow(0);
            row.setHeightInPoints(30);  // 设置行的高度

            for (int i = 0; i < headerFields.size(); i++) {
                if (!hasCellStyleList.contains(i)) sheet.setDefaultColumnStyle(i, generalCellStyle);

                cell = row.createCell(i);
                cell.setCellValue(headerFields.get(i).toString());
                cell.setCellStyle(style);
            }

            for (int i = 0; i < dataList.size(); i++) {
                row = sheet.createRow(i + 1);
                row.setHeightInPoints(20);      // 设置行的高度

                List data = dataList.get(i);
                for (int j = 0; j < data.size(); j++) {
                    Object obj = data.get(j);
                    cell = row.createCell(j);

                    if (UtilValidate.isNotEmpty(obj)) {
                        if (obj instanceof BigDecimal) {
                            cell.setCellValue(((BigDecimal) obj).doubleValue());
                        } else if (obj instanceof Double) {
                            cell.setCellValue((Double) obj);
                        } else if (obj instanceof Date) {
                            cell.setCellValue((Date) obj);
                        } else if (obj instanceof Calendar) {
                            cell.setCellValue((Calendar) obj);
                        } else if (obj instanceof RichTextString) {
                            cell.setCellValue((RichTextString) obj);
                        } else if (obj instanceof Boolean) {
                            cell.setCellValue((Boolean) obj);
                        } else {
                            String dataFormatString = cell.getCellStyle().getDataFormatString();
                            if (numberFormatString.equals(dataFormatString) || currencyFormatString.equals(dataFormatString) || percentFormatString.equals(dataFormatString)) {
                                cell.setCellValue(new BigDecimal(String.valueOf(obj)).doubleValue());
                            } else {
                                cell.setCellValue((String) obj);
                            }
                        }
                    } else {
                        cell.setCellValue("");
                    }
                }
            }

            // 在数据填充完之后再自动计算列宽
            for (int i = 0; i < headerFields.size(); i++) {
                boolean autoWidth = true;
                if (UtilValidate.isNotEmpty(cellWidthList) && (UtilValidate.isNotEmpty(cellWidthList.get(i)) && cellWidthList.get(i) > 0))
                    autoWidth = false;
                if (autoWidth) {
                    sheet.autoSizeColumn(i, true);
                } else {
                    sheet.setColumnWidth(i, cellWidthList.get(i) * 256);
                }
            }

            if (UtilValidate.isNotEmpty(validationDataList)) {
                for (Map<String, Object> validationDataMap : validationDataList) {
                    int firstRow = (int) validationDataMap.get("firstRow");
                    int lastRow = (int) validationDataMap.get("lastRow");
                    int firstCol = (int) validationDataMap.get("firstCol");
                    int lastCol = (int) validationDataMap.get("lastCol");
                    String[] explicitListValues = (String[]) validationDataMap.get("explicitListValues");

                    CellRangeAddressList regions = new CellRangeAddressList(firstRow, lastRow, firstCol, lastCol);
                    DVConstraint constraint = DVConstraint.createExplicitListConstraint(explicitListValues);
                    HSSFDataValidation hssfDataValidation = new HSSFDataValidation(regions, constraint);
                    sheet.addValidationData(hssfDataValidation);
                }
            }

            if (UtilValidate.isNotEmpty(mergedRegionList)) {
                for (Map<String, Integer> mergedRegionMap : mergedRegionList) {
                    int firstRow = mergedRegionMap.get("firstRow");
                    int lastRow = mergedRegionMap.get("lastRow");
                    int firstCol = mergedRegionMap.get("firstCol");
                    int lastCol = mergedRegionMap.get("lastCol");

                    CellRangeAddress cellRangeAddress = new CellRangeAddress(firstRow, lastRow, firstCol, lastCol);
                    sheet.addMergedRegion(cellRangeAddress);
                }
            }

            wb.write(outputStream);
        } else {
            XSSFWorkbook wb = new XSSFWorkbook();
            XSSFSheet sheet = wb.createSheet(sheetName);
            XSSFDataFormat dataFormat = wb.createDataFormat();
            XSSFCellStyle style = (XSSFCellStyle) createCellStyle(wb);

            //设置文档保护
            if (isProtect) sheet.protectSheet("jianlaifu");
            //固定表头
            sheet.createFreezePane(0, 1, 0, 1);

            // setDefaultColumnStyle() in XSSFSheet not working - https://bz.apache.org/bugzilla/show_bug.cgi?id=51037
            XSSFCellStyle generalCellStyle = (XSSFCellStyle) createCellStyle(wb);

            XSSFCellStyle numberCellStyle = (XSSFCellStyle) createCellStyle(wb);
            numberCellStyle.setDataFormat(dataFormat.getFormat(numberFormatString));

            XSSFCellStyle currencyCellStyle = (XSSFCellStyle) createCellStyle(wb);
            currencyCellStyle.setDataFormat(dataFormat.getFormat(currencyFormatString));

            XSSFCellStyle percentCellStyle = (XSSFCellStyle) createCellStyle(wb);
            percentCellStyle.setDataFormat(dataFormat.getFormat(percentFormatString));

            XSSFCellStyle dateCellStyle = (XSSFCellStyle) createCellStyle(wb);
            dateCellStyle.setDataFormat(dataFormat.getFormat(dateFormatString));

            XSSFCell cell;
            XSSFRow row = sheet.createRow(0);
            row.setHeightInPoints(30);  // 设置行的高度

            for (int i = 0; i < headerFields.size(); i++) {
                cell = row.createCell(i);
                cell.setCellValue(headerFields.get(i).toString());
                cell.setCellStyle(style);
            }

            for (int i = 0; i < dataList.size(); i++) {
                row = sheet.createRow(i + 1);
                row.setHeightInPoints(20);      // 设置行的高度

                List data = dataList.get(i);
                for (int j = 0; j < data.size(); j++) {
                    Object obj = data.get(j);
                    cell = row.createCell(j);

                    if (UtilValidate.isNotEmpty(numberFormatList) && numberFormatList.contains(j)) {
                        cell.setCellStyle(numberCellStyle);
                    } else if (UtilValidate.isNotEmpty(currencyFormatList) && currencyFormatList.contains(j)) {
                        cell.setCellStyle(currencyCellStyle);
                    } else if (UtilValidate.isNotEmpty(percentFormatList) && percentFormatList.contains(j)) {
                        cell.setCellStyle(percentCellStyle);
                    } else if (UtilValidate.isNotEmpty(dateFormatList) && dateFormatList.contains(j)) {
                        cell.setCellStyle(dateCellStyle);
                    } else {
                        cell.setCellStyle(generalCellStyle);
                    }

                    if (UtilValidate.isNotEmpty(obj)) {
                        if (obj instanceof BigDecimal) {
                            cell.setCellValue(((BigDecimal) obj).doubleValue());
                        } else if (obj instanceof Double) {
                            cell.setCellValue((Double) obj);
                        } else if (obj instanceof Date) {
                            cell.setCellValue((Date) obj);
                        } else if (obj instanceof Calendar) {
                            cell.setCellValue((Calendar) obj);
                        } else if (obj instanceof RichTextString) {
                            cell.setCellValue((RichTextString) obj);
                        } else if (obj instanceof Boolean) {
                            cell.setCellValue((Boolean) obj);
                        } else {
                            String dataFormatString = cell.getCellStyle().getDataFormatString();
                            if (numberFormatString.equals(dataFormatString) || currencyFormatString.equals(dataFormatString) || percentFormatString.equals(dataFormatString)) {
                                cell.setCellValue(new BigDecimal(String.valueOf(obj)).doubleValue());
                            } else {
                                cell.setCellValue((String) obj);
                            }
                        }
                    } else {
                        cell.setCellValue("");
                    }
                }
            }

            // 在数据填充完之后再自动计算列宽
            for (int i = 0; i < headerFields.size(); i++) {
                boolean autoWidth = true;
                if (UtilValidate.isNotEmpty(cellWidthList) && (UtilValidate.isNotEmpty(cellWidthList.get(i)) && cellWidthList.get(i) > 0))
                    autoWidth = false;
                if (autoWidth) {
                    sheet.autoSizeColumn(i, true);
                } else {
                    sheet.setColumnWidth(i, cellWidthList.get(i) * 256);
                }
            }

            if (UtilValidate.isNotEmpty(validationDataList)) {
                for (Map<String, Object> validationDataMap : validationDataList) {
                    int firstRow = (int) validationDataMap.get("firstRow");
                    int lastRow = (int) validationDataMap.get("lastRow");
                    int firstCol = (int) validationDataMap.get("firstCol");
                    int lastCol = (int) validationDataMap.get("lastCol");
                    String[] explicitListValues = (String[]) validationDataMap.get("explicitListValues");

                    XSSFDataValidationHelper dvHelper = new XSSFDataValidationHelper(sheet);
                    XSSFDataValidationConstraint dvConstraint = (XSSFDataValidationConstraint) dvHelper
                            .createExplicitListConstraint(explicitListValues);

                    CellRangeAddressList addressList = new CellRangeAddressList(firstRow, lastRow, firstCol, lastCol);
                    XSSFDataValidation xssfDataValidation = (XSSFDataValidation) dvHelper.createValidation(
                            dvConstraint, addressList);
                    sheet.addValidationData(xssfDataValidation);
                }
            }

            if (UtilValidate.isNotEmpty(mergedRegionList)) {
                for (Map<String, Integer> mergedRegionMap : mergedRegionList) {
                    int firstRow = mergedRegionMap.get("firstRow");
                    int lastRow = mergedRegionMap.get("lastRow");
                    int firstCol = mergedRegionMap.get("firstCol");
                    int lastCol = mergedRegionMap.get("lastCol");

                    CellRangeAddress cellRangeAddress = new CellRangeAddress(firstRow, lastRow, firstCol, lastCol);
                    sheet.addMergedRegion(cellRangeAddress);
                }
            }

            wb.write(outputStream);
        }

        return outputStream;
    }

    private static CellStyle createCellStyle(HSSFWorkbook wb) {
        HSSFCellStyle style = wb.createCellStyle();

        style.setAlignment(HSSFCellStyle.ALIGN_CENTER); // 创建一个水平居中格式
        style.setVerticalAlignment(HSSFCellStyle.VERTICAL_CENTER); // 创建一个垂直居中格式
        style.setWrapText(true);    // 设置单元格内容是否自动换行

        HSSFFont font = wb.createFont();
        font.setFontName("宋体");

        style.setFont(font);

        return style;
    }

    private static CellStyle createCellStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();

        style.setAlignment(XSSFCellStyle.ALIGN_CENTER); // 创建一个水平居中格式
        style.setVerticalAlignment(XSSFCellStyle.VERTICAL_CENTER); // 创建一个垂直居中格式
        style.setWrapText(true);    // 设置单元格内容是否自动换行

        XSSFFont font = wb.createFont();
        font.setFontName("宋体");

        style.setFont(font);

        return style;
    }

    public static String getXlsStringValue(HSSFCell cell) {
        String strCell = "";
        if (UtilValidate.isNotEmpty(cell)) {
            switch (cell.getCellType()) {
                case HSSFCell.CELL_TYPE_STRING:
                    strCell = cell.getStringCellValue();
                    break;
                case HSSFCell.CELL_TYPE_NUMERIC:
                    strCell = NumberToTextConverter.toText(cell.getNumericCellValue());
                    break;
                case HSSFCell.CELL_TYPE_BOOLEAN:
                    strCell = String.valueOf(cell.getBooleanCellValue());
                    break;
                default:
                    break;
            }
        }
        strCell = strCell.replaceAll("\t", "");
        strCell = strCell.replaceAll("\"", "");
        strCell = strCell.replaceAll("\'", "").trim();

        return strCell;
    }

    public static String getXlsxStringValue(Cell cell) {
        String strCell = "";
        if (UtilValidate.isNotEmpty(cell)) {
            switch (cell.getCellType()) {
                case HSSFCell.CELL_TYPE_STRING:
                    strCell = cell.getStringCellValue();
                    break;
                case HSSFCell.CELL_TYPE_NUMERIC:
                    strCell = NumberToTextConverter.toText(cell.getNumericCellValue());
                    break;
                case HSSFCell.CELL_TYPE_BOOLEAN:
                    strCell = String.valueOf(cell.getBooleanCellValue());
                    break;
                default:
                    break;
            }
        }
        strCell = strCell.replaceAll("\t", "");
        strCell = strCell.replaceAll("\"", "");
        strCell = strCell.replaceAll("\'", "").trim();

        return strCell;
    }

    //得到Excel表格每一行的内容
    public static Map getExcelRowValue(Row row, List<GenericValue> cellConfigList) {
        Map dataMap = FastMap.newInstance();
        Map results = ServiceUtil.returnSuccess();

        if (null == row) {
            return null;
        }
        int cellStart = row.getFirstCellNum();
        int cellEnd = row.getLastCellNum();
        List cellStringList = FastList.newInstance();
        //首先把一行数据放进list
        for (int i = cellStart; i < cellEnd; i++) {
            Cell cell = row.getCell(i);
            String cellString = getXlsxStringValue(cell);
            Debug.logError("cellString_%s", "", cellString);
            cellStringList.add(cellString);
        }

        if (cellEnd > cellConfigList.size()) {
            results = ServiceUtil.returnError("数据格式不正确");
        } else {
            //上传的数据和配置的数据进行关联
            for (int i = 0; i < cellConfigList.size(); i++) {
                GenericValue cellConfig = cellConfigList.get(i);
                String cellString = (String) cellStringList.get(i);
                String cellName = cellConfig.getString("cellName");
                dataMap.put(cellName, cellString);
            }
            results.put("dataMap", dataMap);
        }
        //得到每一行数据的文本
        String rowContentString = StringUtil.join(cellStringList, ",");
        results.put("rowContentString", rowContentString);
        results.put("rowNum", String.valueOf(row.getRowNum() + 1));
        return results;
    }
}