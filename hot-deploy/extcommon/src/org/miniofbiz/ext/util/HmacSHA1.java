package org.miniofbiz.ext.util;

import org.ofbiz.base.util.Base64;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

public class HmacSHA1 {
  
    private static final String MAC_NAME = "HmacSHA1";    
    private static final String ENCODING = "UTF-8";    
      
    /* 
     * 展示了一个生成指定算法密钥的过程 初始化HMAC密钥  
     * @return  
     * @throws Exception 
     *  
      public static String initMacKey() throws Exception { 
      //得到一个 指定算法密钥的密钥生成器 
      KeyGenerator KeyGenerator keyGenerator =KeyGenerator.getInstance(MAC_NAME);  
      //生成一个密钥 
      SecretKey secretKey =keyGenerator.generateKey(); 
      return null; 
      } 
     */  
      
    /**  
     * 使用 HMAC-SHA1 签名方法对对encryptText进行签名  
     * @param encryptText 被签名的字符串  
     * @param encryptKey  密钥  
     * @return  
     * @throws Exception  
     */    
    public static String HmacSHA1Encrypt(String encryptText, String encryptKey) throws Exception
    {           
        byte[] data=encryptKey.getBytes(ENCODING);  
        //根据给定的字节数组构造一个密钥,第二参数指定一个密钥算法的名称  
        SecretKey secretKey = new SecretKeySpec(data, MAC_NAME);
        //生成一个指定 Mac 算法 的 Mac 对象  
        Mac mac = Mac.getInstance(MAC_NAME);
        //用给定密钥初始化 Mac 对象  
        mac.init(secretKey);    
          
        byte[] text = encryptText.getBytes(ENCODING);    
        //完成 Mac 操作   
        byte[] rawHmac = mac.doFinal(text);

        //base64-encode the hmac
        String result = new String(Base64.base64Encode(rawHmac));

        return result;
    }    
}  