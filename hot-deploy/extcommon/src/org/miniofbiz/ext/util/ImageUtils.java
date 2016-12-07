package org.miniofbiz.ext.util;

import javolution.util.FastMap;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.Random;

/**
 * 图片处理工具类
 */
public final class ImageUtils {

    public static final String CAPTCHA_BUFFERED_IMAGE_OBJECT = "CAPTCHA_BUFFERED_IMAGE_OBJECT";
    public static final String CAPTCHA_RANDOM_CODE_NUMBER = "CAPTCHA_RANDOM_CODE_NUMBER";

    /**
     * 处理图片即裁剪且圆角
     *
     * @param srcImgPath   原图路径
     * @param targerPath   目标图路径
     * @param scaledWidth  裁剪宽度
     * @param scaledHeight 裁剪高度
     * @param cornerRadius 圆角度数
     * @throws java.io.IOException
     */
    public static void makeImageResizerAndRoundedCorner(String srcImgPath, String targerPath, int scaledWidth,
                                                        int scaledHeight, int cornerRadius) throws IOException {

        BufferedImage originalImage = ImageIO.read(new File(srcImgPath));
        BufferedImage output = new BufferedImage(scaledWidth, scaledHeight, BufferedImage.TYPE_INT_ARGB);

        Graphics2D g = output.createGraphics();

        g.setComposite(AlphaComposite.Src);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(Color.WHITE);
        g.fill(new RoundRectangle2D.Float(0, 0, scaledWidth, scaledHeight, cornerRadius, cornerRadius));

        g.setComposite(AlphaComposite.SrcAtop);
        g.drawImage(originalImage, 0, 0, scaledWidth, scaledHeight, null);

        g.dispose();

        ImageIO.write(output, getImageFileSuffix(srcImgPath), new File(targerPath));
    }

    /**
     * 图片裁剪
     *
     * @param srcImgPath    原图路径
     * @param targerPath    目标图片路径
     * @param scaledWidth   裁剪宽度
     * @param scaledHeight  裁剪高度
     * @param preserveAlpha 是否保存Alpha
     * @throws java.io.IOException
     */
    public static void makeImageResizer(String srcImgPath, String targerPath, int scaledWidth, int scaledHeight, boolean preserveAlpha) throws IOException {
        BufferedImage originalImage = ImageIO.read(new File(srcImgPath));

        int imageType = preserveAlpha ? BufferedImage.TYPE_INT_RGB : BufferedImage.TYPE_INT_ARGB;
        BufferedImage scaledBI = new BufferedImage(scaledWidth, scaledHeight, imageType);
        Graphics2D g = scaledBI.createGraphics();
        if (preserveAlpha) {
            g.setComposite(AlphaComposite.Src);
        }
        g.drawImage(originalImage, 0, 0, scaledWidth, scaledHeight, null);
        g.dispose();

        ImageIO.write(scaledBI, getImageFileSuffix(srcImgPath), new File(targerPath));
    }

    public static String getImageFileSuffix(String imagePath) {
        String imageSuffix = "jpg";
        int index = imagePath.lastIndexOf(".");
        if (index > -1) {
            imageSuffix = imagePath.substring(index + 1);
        }
        return imageSuffix;
    }

    /**
     * 处理图片圆角
     *
     * @param srcImgPath   原图路径
     * @param targerPath   生成后图片路径
     * @param cornerRadius 圆角度数
     * @throws java.io.IOException
     */
    public static void makeRoundedCorner(String srcImgPath, String targerPath, int cornerRadius) throws IOException {

        BufferedImage image = ImageIO.read(new File(srcImgPath));
        int w = image.getWidth();
        int h = image.getHeight();

        BufferedImage output = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);

        Graphics2D g = output.createGraphics();

        g.setComposite(AlphaComposite.Src);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(Color.WHITE);
        g.fill(new RoundRectangle2D.Float(0, 0, w, h, cornerRadius, cornerRadius));
        g.setComposite(AlphaComposite.SrcAtop);
        g.drawImage(image, 0, 0, null);

        g.dispose();

        ImageIO.write(output, getImageFileSuffix(srcImgPath), new File(targerPath));
    }

    /**
     * 把图片印刷到图片上
     *
     * @param iconPath   -- 水印文件
     * @param srcImgPath -- 目标文件
     * @param targerPath
     * @throws Exception
     */
    public final static void pressImage(String iconPath, String srcImgPath, String targerPath) throws Exception {
        // 目标文件
        File _file = new File(srcImgPath);
        Image src = ImageIO.read(_file);
        int wideth = src.getWidth(null);
        int height = src.getHeight(null);
        BufferedImage image = new BufferedImage(wideth, height, BufferedImage.TYPE_INT_RGB);
        Graphics g = image.createGraphics();
        g.drawImage(src, 0, 0, wideth, height, null);

        // 水印文件
        File _filebiao = new File(iconPath);
        Image src_biao = ImageIO.read(_filebiao);
        int wideth_biao = src_biao.getWidth(null);
        int height_biao = src_biao.getHeight(null);
        // g.drawImage(src_biao, (wideth - wideth_biao /2 ) / 2, (height -
        // height_biao /2) / 2, wideth_biao / 2, height_biao / 2, null);

        g.drawImage(src_biao, (wideth - wideth_biao) / 2, (height - height_biao) / 2, wideth_biao, height_biao, null); // 居中

        // 水印文件结束
        g.dispose();

        /*
         * FileOutputStream out = new FileOutputStream(targerPath);
         * JPEGImageEncoder encoder = JPEGCodec.createJPEGEncoder(out);
         * encoder.encode(image); out.close();
         */

        ImageIO.write(image, getImageFileSuffix(srcImgPath), new File(targerPath));
    }

    /**
     * 打印文字水印图片
     *
     * @param pressText  --文字
     * @param srcImgPath -- 目标图片
     * @param fontName   -- 字体名
     * @param fontStyle  -- 字体样式
     * @param color      -- 字体颜色
     * @param fontSize   -- 字体大小
     * @param x          -- 偏移量
     * @param y
     * @throws Exception
     */

    public static void pressText(String pressText, String srcImgPath, String targerPath, String fontName,
                                 int fontStyle, Color color, int fontSize, int x, int y) throws Exception {
        File _file = new File(srcImgPath);
        Image src = ImageIO.read(_file);
        int wideth = src.getWidth(null);
        int height = src.getHeight(null);
        BufferedImage image = new BufferedImage(wideth, height, BufferedImage.TYPE_INT_RGB);
        Graphics g = image.createGraphics();
        g.drawImage(src, 0, 0, wideth, height, null);

        g.setColor(color);
        g.setFont(new Font(fontName, fontStyle, fontSize));

        // g.drawString(pressText, wideth - fontSize - x, height - fontSize -
        // y);
        g.drawString(pressText, (wideth - fontSize) / 2, (height - fontSize) / 2);
        g.dispose();

        /*
         * FileOutputStream out = new FileOutputStream(targerPath);
         * JPEGImageEncoder encoder = JPEGCodec.createJPEGEncoder(out);
         * encoder.encode(image); out.close();
         */

        ImageIO.write(image, getImageFileSuffix(srcImgPath), new File(targerPath));
    }

    /**
     * 按设定的宽高压缩图片
     *
     * @param srcImgPath
     * @param width
     * @param height
     * @param targerPath
     * @throws Exception
     */
    public static void createSmallImage(String srcImgPath, int width, int height, String targerPath) throws Exception {
        File srcImg = new File(srcImgPath);
        Image src = ImageIO.read(srcImg); // 构造Image对象
        BufferedImage tag = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        tag.getGraphics().drawImage(src, 0, 0, width, height, null); // 绘制缩小后的图

        /*
         * FileOutputStream out = new FileOutputStream(targerPath); // 输出到文件流
         * JPEGImageEncoder encoder = JPEGCodec.createJPEGEncoder(out);
         * encoder.encode(tag); // 近JPEG编码 out.close();
         */

        ImageIO.write(tag, getImageFileSuffix(srcImgPath), new File(targerPath));
    }

    /**
     * 按比例缩放
     *
     * @param srcImgPath
     * @param thumbWidth
     * @param thumbHeight
     * @param targerPath
     */
    public static void createThumbnail(String srcImgPath, int thumbWidth, int thumbHeight, String targerPath)
            throws Exception {
        // load image from filename
        Image image = ImageIO.read(new File(srcImgPath));
        // Toolkit.getDefaultToolkit().getImage(srcImgPath);
        MediaTracker mediaTracker = new MediaTracker(new Container());
        mediaTracker.addImage(image, 0);
        mediaTracker.waitForID(0);
        // use this to test for errors at this point:
        // System.out.println(mediaTracker.isErrorAny());
        // determine thumbnail size from WIDTH and HEIGHT
        double thumbRatio = (double) thumbWidth / (double) thumbHeight;
        int imageWidth = image.getWidth(null);
        int imageHeight = image.getHeight(null);
        double imageRatio = (double) imageWidth / (double) imageHeight;
        if (thumbRatio < imageRatio) {
            thumbHeight = (int) (thumbWidth / imageRatio);
        } else {
            thumbWidth = (int) (thumbHeight * imageRatio);
        }

        // draw original image to thumbnail image object and
        // scale it to the new size on-the-fly
        BufferedImage thumbImage = new BufferedImage(thumbWidth, thumbHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics2D = thumbImage.createGraphics();
        graphics2D.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics2D.drawImage(image, 0, 0, thumbWidth, thumbHeight, null);

        // save thumbnail image to outFilename
        /*
         * BufferedOutputStream out = new BufferedOutputStream(new
         * FileOutputStream(targerPath)); JPEGImageEncoder encoder =
         * JPEGCodec.createJPEGEncoder(out); JPEGEncodeParam param =
         * encoder.getDefaultJPEGEncodeParam(thumbImage); quality = Math.max(0,
         * Math.min(quality, 100)); param.setQuality((float) quality / 100.0f,
         * false); encoder.setJPEGEncodeParam(param);
         * encoder.encode(thumbImage); out.close();
         */

        ImageIO.write(thumbImage, getImageFileSuffix(srcImgPath), new File(targerPath));
    }

    /**
     * 固定宽度，高度自动缩放
     *
     * @param srcImgPath
     * @param thumbWidth
     * @param targerPath
     */
    public static void createThumbnailByWidth(String srcImgPath, int thumbWidth, String targerPath) throws Exception {
        // load image from filename
        Image image = ImageIO.read(new File(srcImgPath));
        MediaTracker mediaTracker = new MediaTracker(new Container());
        mediaTracker.addImage(image, 0);
        mediaTracker.waitForID(0);

        int imageWidth = image.getWidth(null);
        int imageHeight = image.getHeight(null);

        int thumbHeight = (imageHeight * thumbWidth) / imageWidth;

        // draw original image to thumbnail image object and
        // scale it to the new size on-the-fly
        BufferedImage thumbImage = new BufferedImage(thumbWidth, thumbHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics2D = thumbImage.createGraphics();
        graphics2D.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics2D.drawImage(image, 0, 0, thumbWidth, thumbHeight, null);

        ImageIO.write(thumbImage, getImageFileSuffix(srcImgPath), new File(targerPath));
    }

    /**
     * @param width      验证码图片的宽度
     * @param height     验证码图片的高度
     * @param wordNumber 数字个数
     * @return CAPTCHA_BUFFERED_IMAGE_OBJECT is BufferedImage, CAPTCHA_RANDOM_CODE_NUMBER is random code
     */
    public static Map<String, Object> generateCaptcha(int width, int height, int wordNumber) {
        //设置备选字符
        char[] codeSequence = {'1', '2', '3', '4', '5', '6', '7', '8', '9','0'};
        Map<String, Object> results = FastMap.newInstance();

        BufferedImage buffImg = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = buffImg.createGraphics();
        int red = 0, green = 0, blue = 0;
        // 创建一个随机数生成器类。
        Random random = new Random();

        // 设定图像背景色(因为是做背景，所以偏淡)
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, width, height);
        // 创建字体，字体的大小应该根据图片的高度来定。
        Font font = new Font("\\9ED1\\4F53", Font.HANGING_BASELINE, 20);
        // 设置字体。
        g.setFont(font);
        // 画边框。
        g.setColor(Color.DARK_GRAY);
        g.drawRect(0, 0, width - 1, height - 1);
        // 随机产生155条干扰线，使图象中的认证码不易被其它程序探测到。
        // g.setColor(Color.GRAY);
        for (int i = 0; i < 30; i++) {
            g.setColor(generateColor(0, 255));
            int x = random.nextInt(width);
            int y = random.nextInt(height);
            int xl = random.nextInt(12);
            int yl = random.nextInt(12);
            g.drawLine(x, y, x + xl, y + yl);
        }
        // randomCode用于保存随机产生的验证码，以便用户登录后进行验证。
        StringBuffer randomCode = new StringBuffer();

        for (int i = 0; i < wordNumber; i++) {
            String strRand = String.valueOf(codeSequence[random.nextInt(codeSequence.length)]);
            // 产生随机的颜色值，让输出的每个字符的颜色值都将不同。
            g.setColor(Color.BLACK);
            g.drawString(strRand,8 +(i*15), 20);
            // 将产生的随机数组合在一起。
            randomCode.append(strRand);
        }
        // 图象生效
        g.dispose();

        results.put(CAPTCHA_BUFFERED_IMAGE_OBJECT, buffImg);
        results.put(CAPTCHA_RANDOM_CODE_NUMBER, randomCode.toString());

        return results;
    }

    /**
     * 给定范围，随机生成颜色
     *
     * @param fc
     * @param bc
     * @return
     */
    private static Color generateColor(int fc, int bc) {
        Random random = new Random();
        if (fc > 255)
            fc = 255;
        if (bc > 255)
            bc = 255;
        int r = fc + random.nextInt(bc - fc);
        int g = fc + random.nextInt(bc - fc);
        int b = fc + random.nextInt(bc - fc);
        return new Color(r, g, b);
    }
}
