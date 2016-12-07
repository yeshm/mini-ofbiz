package org.miniofbiz.ext.util;

import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.FileUtil;
import org.ofbiz.base.util.UtilValidate;

import java.io.*;
import java.math.BigInteger;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.security.MessageDigest;

public class ExtFileUtil extends FileUtil {
    /**
     * 获取网络文件流
     */
    public static InputStream getInternetFileInputStream(String fileInternetUrl) throws IOException {
        if (UtilValidate.isWhitespace(fileInternetUrl)) {
            Debug.logWarning("文件网络地址为空", "");
            return null;
        }

        URL url = new URL(fileInternetUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        InputStream inputStream = conn.getInputStream();

        return inputStream;
    }

    public static InputStream outputStreamParseInputStream(OutputStream outputStream) throws IOException {
        ByteArrayOutputStream byteArrayOutputStream = (ByteArrayOutputStream) outputStream;
        InputStream inputStream = new ByteArrayInputStream(byteArrayOutputStream.toByteArray());

        return inputStream;
    }

    public static void inputStreamToFile(InputStream inputStream, File file) {
        try {
            OutputStream os = new FileOutputStream(file);
            int bytesRead = 0;
            byte[] buffer = new byte[8192];
            while ((bytesRead = inputStream.read(buffer, 0, 8192)) != -1) {
                os.write(buffer, 0, bytesRead);
            }
            os.close();
            inputStream.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 获取文件MD5加密字符串
     */
    public static String getFileMD5String(File file) {
        String fileMD5Value = null;
        FileInputStream fileInputStream = null;
        try {
            fileInputStream = new FileInputStream(file);
            MappedByteBuffer byteBuffer = fileInputStream.getChannel().map(FileChannel.MapMode.READ_ONLY, 0, file.length());
            MessageDigest messageDigest = MessageDigest.getInstance("MD5");
            messageDigest.update(byteBuffer);
            BigInteger bigInteger = new BigInteger(1, messageDigest.digest());
            fileMD5Value = bigInteger.toString(16);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (null != fileInputStream) {
                try {
                    fileInputStream.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
        return fileMD5Value;
    }
}