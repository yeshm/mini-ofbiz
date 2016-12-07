package org.miniofbiz.ext.biz;


import org.ofbiz.base.util.GeneralRuntimeException;
import org.ofbiz.base.util.UtilValidate;
import org.miniofbiz.ext.util.UploadUtil;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.Map;

public class ImageWorker {
    private Font font = new Font("", Font.PLAIN, 70);// 添加字体的属性设置

    private Graphics2D g = null;

    private int fontsize = 70;

    private int x = 0;

    private int y = 0;

    /**
     * 导入本地图片到缓冲区
     */
    public BufferedImage loadImageLocal(String imgName) {
        try {
            return ImageIO.read(new File(imgName));
        } catch (IOException e) {
            System.out.println(e.getMessage());
        }
        return null;
    }

    /**
     * 导入网络图片到缓冲区
     */
    public BufferedImage loadImageUrl(String imgName) {
        try {
            URL url = new URL(imgName);
            return ImageIO.read(url);
        } catch (IOException e) {
            System.out.println(e.getMessage());
        }
        return null;
    }

    /**
     * 生成新图片到本地
     */
    public void writeImageLocal(String newImage, BufferedImage img) {
        if (newImage != null && img != null) {
            try {
                File outputfile = new File(newImage);
                if (outputfile.getParentFile() != null && outputfile.getParentFile().exists() == false) {
                    if (outputfile.getParentFile().mkdirs() == false) {
                        throw new GeneralRuntimeException("Destination '" + outputfile + "' directory cannot be created");
                    }
                }
                ImageIO.write(img, "png", outputfile);
            } catch (IOException e) {
                System.out.println(e.getMessage());
            }
        }
    }

    /**
     * 设定文字的字体等
     */
    public void setFont(String fontStyle, int fontSize) {
        this.fontsize = fontSize;
        this.font = new Font(fontStyle, Font.PLAIN, fontSize);
    }

    /**
     * 修改图片,返回修改后的图片缓冲区（只输出一行文本）
     */
    public BufferedImage modifyImage(BufferedImage img, Object content, int x, int y, int fontSize, int color) {

        try {
            int w = img.getWidth();
            int h = img.getHeight();
            g = img.createGraphics();
            g.setBackground(Color.WHITE);
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setColor(new Color(color));// 设置字体颜色
            this.setFont("", fontSize);
            g.setFont(this.font);
            // 验证输出位置的纵坐标和横坐标
            if (x >= w || y >= h) {
                this.x = h - fontSize + 2;
                this.y = w;
            } else {
                this.x = x;
                this.y = y;
            }
            if (content != null) {
                g.drawString(content.toString(), this.x, this.y);
            }
            g.dispose();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

        return img;
    }

    /**
     * 修改图片,返回修改后的图片缓冲区（输出多个文本段） xory：true表示将内容在一行中输出；false表示将内容多行输出
     */
    public BufferedImage modifyImage(BufferedImage img, Object[] contentArr, int x, int y, boolean xory) {
        try {
            int w = img.getWidth();
            int h = img.getHeight();
            g = img.createGraphics();
            g.setBackground(Color.WHITE);
            g.setColor(Color.WHITE);
            if (this.font != null)
                g.setFont(this.font);
            // 验证输出位置的纵坐标和横坐标
            if (x >= w || y >= h) {
                this.x = h - this.fontsize + 2;
                this.y = w;
            } else {
                this.x = x;
                this.y = y;
            }
            if (contentArr != null) {
                int arrlen = contentArr.length;
                if (xory) {
                    for (int i = 0; i < arrlen; i++) {
                        g.drawString(contentArr[i].toString(), this.x, this.y);
                        this.x += contentArr[i].toString().length() * this.fontsize / 2 + 5;// 重新计算文本输出位置
                    }
                } else {
                    for (int i = 0; i < arrlen; i++) {
                        g.drawString(contentArr[i].toString(), this.x, this.y);
                        this.y += this.fontsize + 2;// 重新计算文本输出位置
                    }
                }
            }
            g.dispose();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

        return img;
    }

    public BufferedImage modifyImageYe(BufferedImage img) {

        try {
            int w = img.getWidth();
            int h = img.getHeight();
            g = img.createGraphics();
            g.setBackground(Color.WHITE);
            g.setColor(Color.black);// 设置字体颜色
            if (this.font != null)
                g.setFont(this.font);
            g.drawString("www.hi.baidu.com?xia_mingjian", w - 85, h - 5);
            g.dispose();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

        return img;
    }

    /**
     * 等比例修改图片大小
     *
     * @param img
     * @param width
     * @param height
     * @return
     */

    public BufferedImage modifyImageSize(BufferedImage img, int width, int height) {
        int dw = img.getWidth();
        int dh = img.getHeight();

        // 限制放入图片的宽高
        double sx = (double) width / dw;
        double sy = (double) height / dh;

        int targetW;
        int targetH;
        // 这里想实现等比缩放
        if (sx > sy) {
            sx = sy;
            targetW = (int) (sx * dw);
            targetH = (int) (sx * dh);
        } else {
            sy = sx;
            targetW = (int) (sx * dw);
            targetH = (int) (sy * dh);
        }
        g = img.createGraphics();
        BufferedImage tag = g.getDeviceConfiguration().createCompatibleImage(targetW, targetH, Transparency.TRANSLUCENT);
        try {
            // 构造新的压缩图图片
            g = tag.createGraphics();
            g.drawImage(img, 0, 0, targetW, targetH, null);
            g.dispose();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

        return tag;
    }

    /**
     * 把图片insertImg放到图片backgroundImg的X，Y位置
     *
     * @param backgroundImg
     * @param insertImg
     * @param x
     * @param y
     * @return
     */
    public BufferedImage modifyImagetogeter(BufferedImage backgroundImg, BufferedImage insertImg, int x, int y) {

        try {
            int bw = backgroundImg.getWidth();
            int bh = backgroundImg.getHeight();

            int iw = insertImg.getWidth();
            int ih = insertImg.getHeight();

            // 验证输出位置的纵坐标和横坐标
            if (x >= bw || y >= bh) {
                this.x = bh - this.fontsize + 2;
                this.y = bw;
            } else {
                this.x = x;
                this.y = y;
            }
            g = backgroundImg.createGraphics();
            g.drawImage(insertImg, this.x, this.y, iw, ih, null);
            g.dispose();
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

        return backgroundImg;
    }

    //根据给定的内容合成图片
    public static String composeUserImage(String bgImgName, java.util.List<Map<String, Object>> imgList, java.util.List<Map<String, Object>> contentList, Map<String, Object> context) {
        String newImageName = "";
        ImageWorker imgWorker = new ImageWorker();
        BufferedImage bgImg = imgWorker.loadImageUrl(bgImgName);
        //加入文字
        if (UtilValidate.isNotEmpty(contentList)) {
            for (Map contentMap : contentList) {
                int contentX = (Integer) contentMap.get("contentX");
                int contentY = (Integer) contentMap.get("contentY");
                String colorS = (String) contentMap.get("color");
                int fontSize = (Integer) contentMap.get("fontSize");
                String content = (String) contentMap.get("content");
                colorS = colorS.substring(1);
                int color = Integer.parseInt(colorS, 16);
                bgImg = imgWorker.modifyImage(bgImg, content, contentX, contentY, fontSize, color);
            }
        }
        //加入图片
        for (Map img : imgList) {
            String imgName = (String) img.get("imgName");
            int x = (Integer) img.get("imgX");
            int y = (Integer) img.get("imgY");
            int w = (Integer) img.get("imgW");
            int h = (Integer) img.get("imgH");
            BufferedImage tmpImg;
            String imageType = (String) img.get("imgType");
            //根据不同的图片类型，从不同的地方得到图片
            if ("localImg".equals(imageType)) {
                tmpImg = imgWorker.loadImageLocal(imgName);
            } else {
                tmpImg = imgWorker.loadImageUrl(imgName);
            }
            //根据宽高压缩图片
            BufferedImage resizeQrImg = imgWorker.modifyImageSize(tmpImg, w, h);
            // 合成图片 坐标(x,y)
            bgImg = imgWorker.modifyImagetogeter(bgImg, resizeQrImg, x, y);
        }
        String savePath = UploadUtil.getTempPath(context);
        String saveName = UploadUtil.generateStoreFilePathPrefix("image", "Company") + ".jpg";
        String fullName = savePath + saveName;
        imgWorker.writeImageLocal(fullName, bgImg);
        return saveName;

    }

    public static void main(String[] args) {

        ImageWorker imgWorker = new ImageWorker();

        BufferedImage bgImg = imgWorker.loadImageLocal("E:\\img_test\\background.jpg");
        BufferedImage qrImg = imgWorker.loadImageUrl("https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=gQHm7zoAAAAAAAAAASxodHRwOi8vd2VpeGluLnFxLmNvbS9xL1drekpzUXZsY2E0SXRhajFhR0FvAAIEI1OnVQMEAAAAAA==");
        BufferedImage headImg = imgWorker.loadImageLocal("E:\\img_test\\head.png");

        Object[] contentList = new Object[3];

        contentList[0] = "当用户发送消息给公众号时。";
        contentList[1] = "当用户发送消息给公众号时。";
        contentList[2] = "当用户发送消息给公众号时。";

        //坐标 (200,700)
        BufferedImage textImg = imgWorker.modifyImage(bgImg, contentList, 0xC8, 0x2BC, false);
        // 把二维码图片改成227*227大小
        BufferedImage resizeQrImg = imgWorker.modifyImageSize(qrImg, 0xE3, 0xE3);
        // 合成带二维码的图片 坐标(150,290)
        BufferedImage tmpQrImg = imgWorker.modifyImagetogeter(textImg, resizeQrImg, 0x96, 0x122);
        // 把头像图片改成75*75大小
        BufferedImage resizeHeadImg = imgWorker.modifyImageSize(headImg, 0X4B, 0X4B);
        // 合成头像图片
        BufferedImage tmpHeadImg = imgWorker.modifyImagetogeter(tmpQrImg, resizeHeadImg, 0x63, 0x2A4);
        // 构造目标图片
        imgWorker.writeImageLocal("E:\\img_test\\new.jpg", tmpHeadImg);

        System.out.println("success");
    }

}