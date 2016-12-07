package org.miniofbiz.ext.bean;


public class OmUploadFile {

    private String fileName;

    private String fileUrl;

    /**
     * 缩略图
     */
    private String thumbFileUrl;

    private String thumbFileName;

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getThumbFileUrl() {
        return thumbFileUrl;
    }

    public void setThumbFileUrl(String thumbFileUrl) {
        this.thumbFileUrl = thumbFileUrl;
    }

    public String getThumbFileName() {
        return thumbFileName;
    }

    public void setThumbFileName(String thumbFileName) {
        this.thumbFileName = thumbFileName;
    }
}
