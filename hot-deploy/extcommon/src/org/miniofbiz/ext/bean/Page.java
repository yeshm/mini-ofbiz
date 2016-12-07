package org.miniofbiz.ext.bean;

import org.ofbiz.base.util.UtilValidate;

import java.util.List;

public class Page<T> {
    /**
     * 分页索引从0开始
     */
    private int pageIndex = 0;
    private int pageSize = 20;
    private long totalSize;
    private List<T> content;

    public Page(int pageIndex, int pageSize, int totalSize, List<T> content) {
        this.pageIndex = pageIndex;
        this.pageSize = pageSize;
        this.totalSize = totalSize;
        this.content = content;
    }

    public int getPageIndex() {
        return pageIndex;
    }

    public void setPageIndex(int pageIndex) {
        this.pageIndex = pageIndex;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public long getTotalPage() {
        if (pageSize != 0) {
            long result = totalSize / pageSize;
            if (totalSize % pageSize != 0) {
                result++;
            }
            return result;
        }
        return 0;
    }


    public long getTotalSize() {
        return totalSize;
    }

    public void setTotalSize(long totalSize) {
        this.totalSize = totalSize;
    }

    public List<T> getContent() {
        return content;
    }

    public void setContent(List<T> content) {
        this.content = content;
    }

    public boolean hasPreviousPage() {
        if (isFirstPage()) {
            return false;
        }
        return true;
    }

    public boolean isFirstPage() {
        if (pageIndex <= 0) {
            return true;
        }
        return false;
    }

    public boolean hasNextPage() {
        if (isLastPage()) {
            return false;
        } else {
            return true;
        }
    }

    public boolean isLastPage() {
        if ((pageIndex + 1) >= this.getTotalPage()) {
            return true;
        } else {
            return false;
        }
    }

    public boolean hasContent() {
        return (UtilValidate.isNotEmpty(this.getContent()));
    }

    public String getPageParams() {
        StringBuffer sb = new StringBuffer();
        sb.append("{");
        sb.append("pageIndex:" + getPageIndex());
        sb.append(",");
        sb.append("totalSize:" + getTotalSize());
        sb.append(",");
        sb.append("pageSize:" + getPageSize());
        sb.append("}");
        return sb.toString();
    }
}