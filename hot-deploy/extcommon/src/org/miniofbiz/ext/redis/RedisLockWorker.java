package org.miniofbiz.ext.redis;

import org.ofbiz.base.util.Debug;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.exceptions.JedisConnectionException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

/**
 * redis 分布式锁实现
 */
public class RedisLockWorker {

    private static final String module = RedisLockWorker.class.getName();

    // 单个锁有效期
    private static final long DEFAULT_SINGLE_EXPIRE_TIME = 70;
    // 批量锁有效期  
    private static final int DEFAULT_BATCH_EXPIRE_TIME = 120;

    /**
     * 获取锁 如果锁可用 立即返回true， 否则返回false，不等待
     *
     * @return
     */
    public static boolean tryLock(String key) {
        return tryLock(key, 0L, null);
    }

    /**
     * 锁在给定的等待时间内空闲，则获取锁成功 返回true， 否则返回false
     *
     * @param timeout
     * @param unit
     * @return
     */
    public static boolean tryLock(String key, long timeout, TimeUnit unit) {
        Jedis jedis = null;
        try {
            jedis = getResource();
            //系统计时器的当前值，以毫微秒为单位。  
            long nano = System.nanoTime();
            do {
                Debug.logVerbose("try lock key: " + key, module);
                String result = jedis.set(key, key, "nx", "ex", DEFAULT_SINGLE_EXPIRE_TIME);
                if ("OK".equals(result)) {
                    Debug.logVerbose("get lock, key: " + key + " , expire in " + DEFAULT_SINGLE_EXPIRE_TIME + " seconds.", module);
                    //成功获取锁，返回true  
                    return Boolean.TRUE;
                } else { // 存在锁,循环等待锁  
                    if (Debug.isOn(Debug.VERBOSE)) {
                        String desc = jedis.get(key);
                        Debug.logVerbose("key: " + key + " locked by another business：" + desc, module);
                    }
                }
                if (timeout <= 0) {
                    //没有设置超时时间，直接退出等待  
                    break;
                }
                Thread.sleep(300);
            } while ((System.nanoTime() - nano) < unit.toNanos(timeout));
            return Boolean.FALSE;
        } catch (Exception e) {
            Debug.logError(e, module);
        } finally {
            RedisWorker.closeJedis(jedis);
        }
        return Boolean.FALSE;
    }

    /**
     * 如果锁空闲立即返回 获取失败 一直等待
     */
    public static void lock(String key) {
        Jedis jedis = null;
        try {
            jedis = getResource();
            do {
                Debug.logVerbose("lock key: " + key, module);
                String result = jedis.set(key, key, "nx", "ex", DEFAULT_SINGLE_EXPIRE_TIME);
                if ("OK".equals(result)) {
                    Debug.logVerbose("get lock, key: " + key + " , expire in " + DEFAULT_SINGLE_EXPIRE_TIME + " seconds.", module);
                    return;
                } else {
                    if (Debug.isOn(Debug.VERBOSE)) {
                        String desc = jedis.get(key);
                        Debug.logVerbose("key: " + key + " locked by another business：" + desc, module);
                    }
                }
                Thread.sleep(300);
            } while (true);
        } catch (Exception e) {
            Debug.logError(e, module);
        } finally {
            RedisWorker.closeJedis(jedis);
        }
    }

    /**
     * 释放锁
     */
    public static void unLock(String key) {
        List<String> list = new ArrayList<String>();
        list.add(key);
        unLock(list);
    }

    /**
     * 批量获取锁 如果全部获取 立即返回true, 部分获取失败 返回false
     *
     * @return
     */
    public static boolean tryLock(List<String> keyList) {
        return tryLock(keyList, 0L, null);
    }

    /**
     * 锁在给定的等待时间内空闲，则获取锁成功 返回true， 否则返回false
     *
     * @param timeout
     * @param unit
     * @return
     */
    public static boolean tryLock(List<String> keyList, long timeout, TimeUnit unit) {
        Jedis jedis = null;
        try {
            //需要的锁  
            List<String> needLocking = new CopyOnWriteArrayList<String>();
            //得到的锁  
            List<String> locked = new CopyOnWriteArrayList<String>();
            jedis = getResource();
            long nano = System.nanoTime();
            do {
                // 构建pipeline，批量提交  
                Pipeline pipeline = jedis.pipelined();
                for (String key : keyList) {
                    needLocking.add(key);
                    pipeline.set(key, key, "nx", "ex", DEFAULT_BATCH_EXPIRE_TIME);
                }
                Debug.logVerbose("try lock keys: " + needLocking, module);
                // 提交redis执行计数,批量处理完成返回  
                List<Object> results = pipeline.syncAndReturnAll();
                for (int i = 0; i < results.size(); ++i) {
                    String result = (String) results.get(i);
                    String key = needLocking.get(i);
                    if ("OK".equals(result)) { // set成功，获得锁
                        locked.add(key);
                    }
                }
                needLocking.removeAll(locked); // 已锁定资源去除  

                if (needLocking.size() == 0) { //成功获取全部的锁  
                    return true;
                } else {
                    // 部分资源未能锁住  
                    Debug.logVerbose("keys: " + needLocking + " locked by another business：", module);
                }

                if (timeout == 0) {
                    break;
                }
                Thread.sleep(500);
            } while ((System.nanoTime() - nano) < unit.toNanos(timeout));

            // 得不到锁，释放锁定的部分对象，并返回失败  
            if (locked.size() > 0) {
                jedis.del(locked.toArray(new String[0]));
            }
            return false;
        } catch (Exception e) {
            Debug.logError(e, module);
        } finally {
            RedisWorker.closeJedis(jedis);
        }
        return true;
    }

    /**
     * 批量释放锁
     */
    public static void unLock(List<String> keyList) {
        List<String> keys = new CopyOnWriteArrayList<String>();
        for (String key : keyList) {
            keys.add(key);
        }
        Jedis jedis = null;
        try {
            jedis = getResource();
            jedis.del(keys.toArray(new String[0]));
            Debug.logVerbose("release lock, keys :" + keys, module);
        } catch (JedisConnectionException je) {
            Debug.logError(je, module);
            RedisWorker.closeJedis(jedis);
        } catch (Exception e) {
            Debug.logError(e, module);
        } finally {
            RedisWorker.closeJedis(jedis);
        }
    }

    /**
     * 获取redis客户端
     *
     * @return
     */
    private static Jedis getResource() {
        return RedisWorker.getJedis();
    }
} 