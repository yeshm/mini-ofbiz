package org.miniofbiz.ext.util;

import javolution.util.FastMap;
import org.apache.commons.compress.utils.IOUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang.math.RandomUtils;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.GeneralRuntimeException;
import org.ofbiz.base.util.UtilProperties;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.base.util.string.FlexibleStringExpander;

import java.io.*;
import java.util.Date;
import java.util.Map;

/**
 * 文件上传助手类
 */
public class UploadUtil {

    private static final String module = UploadUtil.class.getName();

    public static final Map<String, String> FILE_TYPE_MAP = FastMap.newInstance();

    static {
        FILE_TYPE_MAP.put("image", "images");
        FILE_TYPE_MAP.put("audio", "audios");
        FILE_TYPE_MAP.put("video", "videos");
        FILE_TYPE_MAP.put("app", "apps");
        FILE_TYPE_MAP.put("excel", "excel");
    }


    /**
     * 文件上传临时目录
     */
    public static String getTempPath(Map<String, Object> context) {
        String tempPath = getUploadPath(context) + "temp" + File.separator;
        return tempPath;
    }

    /**
     * 文件上传临时文件名
     */
    public static String getTempFileName(String fileName) {
        // 得到文件的扩展名(无扩展名时将得到全名)
        String tempfileName = ExtUtilDateTime.nowDateString() + "/" + getFileNamePrefix() + "." + FilenameUtils.getExtension(fileName);
        return tempfileName;
    }

    /**
     * 临时文件查看地址
     */
    public static String getViewFileUrl(String fileName) {
        String fileUrl = UtilProperties.getPropertyValue("extcommon", "upload.view.path") + "temp/" + fileName;
        return fileUrl;
    }

    /**
     * 保存临时文件到正式文件
     *
     * @param tempFileName  临时文件名
     * @param saveDirectory 正式文件保存目录(可多级，如 product/new/)
     * @param id            实体id
     * @param context
     * @return 正式文件文件名，如 product/new/id+时间+随机数+后缀
     */
    public static String saveUpload(String tempFileName, String saveDirectory, String id, Map<String, Object> context) {
        if (ExtUtilValidate.isEmpty(saveDirectory)) {
            throw new GeneralRuntimeException("文件保存目录不能为空");
        }
        if (!saveDirectory.endsWith("/") && !saveDirectory.endsWith(File.separator)) {
            saveDirectory += "/";
        }

        String saveFilePath = saveDirectory + ExtUtilDateTime.nowDateString() + "/" + id + "_" + getFileNamePrefix() + "." + FilenameUtils.getExtension(tempFileName);
        saveUploadWithSavePath(tempFileName, saveFilePath, context);

        return saveFilePath;
    }

    /**
     * 保存临时文件到正式文件
     *
     * @param tempFileName 临时文件名
     * @param saveFilePath 正式文件保存路径目录(可多级，如 product/new/aa.txt)
     * @param context
     * @return 正式文件文件名，如 product/new/id+时间+随机数+后缀
     */
    public static String saveUploadWithSavePath(String tempFileName, String saveFilePath, Map<String, Object> context) {
        File srcFile = new File(getTempPath(context) + tempFileName);

        if (ExtUtilValidate.isEmpty(saveFilePath)) {
            throw new GeneralRuntimeException("文件保存路径不能为空");
        }

        File destFile = new File(getUploadPath(context) + saveFilePath);

        try {
            FileUtils.copyFile(srcFile, destFile);
        } catch (IOException e) {
            Debug.logError(e, module);
            throw new GeneralRuntimeException(e);
        }

        return saveFilePath;
    }

    /**
     * 拷贝文件
     *
     * @param srcFile
     * @param destFile
     * @throws java.io.IOException
     */
    public static void copyFile(File srcFile, File destFile) throws IOException {
        FileUtils.copyFile(srcFile, destFile, true);
    }

    /**
     * 拷贝文件
     *
     * @param srcFileName
     * @param destFileName
     * @throws java.io.IOException
     */
    public static void copyFile(String srcFileName, String destFileName) throws IOException {
        FileUtils.copyFile(new File(srcFileName), new File(destFileName), true);
    }

    /**
     * 拷贝流文件到文件
     *
     * @param is       源流文件
     * @param fileName 目的文件
     */
    public static void copy(InputStream is, String fileName) {
        try {
            File tempFile = new File(fileName);
            if (tempFile.getParentFile() != null && tempFile.getParentFile().exists() == false) {
                if (tempFile.getParentFile().mkdirs() == false) {
                    throw new GeneralRuntimeException("Destination '" + tempFile + "' directory cannot be created");
                }
            }
            OutputStream bos = new FileOutputStream(tempFile);

            IOUtils.copy(is, bos);
        } catch (FileNotFoundException e) {
            Debug.logError(e, module);
            throw new GeneralRuntimeException(e);
        } catch (IOException e) {
            Debug.logError(e, module);
            e.printStackTrace();
            throw new GeneralRuntimeException(e);
        }
    }

    private static String getUploadPath(Map<String, Object> context) {
        String uploadPath = FlexibleStringExpander.expandString(UtilProperties.getPropertyValue("extcommon", "upload.server.path"), context);
        return uploadPath;
    }

    private static String getFileNamePrefix() {
        String prefix = new java.text.SimpleDateFormat("yyyyMMddHHmmss").format(new Date()) + "_" + RandomUtils.nextInt();
        return prefix;
    }

    /**
     * 按宽度等比缩放
     *
     * @param srcFileName
     * @param destFileName
     * @param width
     * @throws Exception
     */
    public static void thumbImageByWidth(String srcFileName, String destFileName, int width) throws Exception {
        ImageUtils.createThumbnailByWidth(srcFileName, width, destFileName);
    }


    /**
     * 生成文件存储路径，无文件后缀，如 images/10001/20120214/1432423452345243（随机阿拉伯字符串）
     *
     * @param fileType 文件类型image audio video
     * @param sign     签名or标示，如用户id等
     * @return
     */
    public static String generateStoreFilePathPrefix(String fileType, String sign) {
        StringBuilder sb = new StringBuilder();
        sb.append(UtilValidate.isNotEmpty(FILE_TYPE_MAP.get(fileType)) ? FILE_TYPE_MAP.get(fileType) : "temp");
        sb.append("/" + sign);
        sb.append("/" + ExtUtilDateTime.nowDateString("yyyyMMdd"));
        sb.append("/" + ExtUtilDateTime.nowDateString("yyyyMMddHHmmss") + RandomUtils.nextInt());
        return sb.toString();
    }
}
