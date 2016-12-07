package org.miniofbiz.ext.redis;

import org.ofbiz.base.util.Debug;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Pipeline;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * redis 分布式等待实现
 */
public class RedisWaitWorker {

    private static final String module = RedisWaitWorker.class.getName();

    //单个等待超时时间
    private static final long DEFAULT_SINGLE_WAIT_TIME = 10;
    //批量等待超时时间
    private static final long DEFAULT_BATCH_WAIT_TIME = 30;

    /**
     * 获取key 如果key存在 立即返回true， 否则返回false，不等待
     *
     * @return
     */
    public static boolean tryWait(String key) {
        return tryWait(key, DEFAULT_SINGLE_WAIT_TIME);
    }

    /**
     * 获取key 如果key存在 返回true， 否则返回false，不等待
     *
     * @return
     */
    public static boolean tryWait(String key, long timeoutInSeconds) {
        return tryWait(key, timeoutInSeconds, TimeUnit.SECONDS);
    }

    /**
     * key在给定的等待时间内获得，则获取锁成功 返回true， 否则返回false
     *
     * @param timeout
     * @param unit
     * @return
     */
    public static boolean tryWait(String key, long timeout, TimeUnit unit) {
        Jedis jedis = null;
        try {
            jedis = getResource();
            //系统计时器的当前值，以毫微秒为单位。
            long nano = System.nanoTime();
            do {
                Debug.logVerbose("try wait key: " + key, module);
                if (jedis.exists(key)) {
                    Debug.logVerbose("get wait, key: " + key, module);
                    //成功获取key，返回true
                    return Boolean.TRUE;
                } else {
                    //key不存在,循环等待
                    Debug.logVerbose("key: " + key + " is not exists", module);
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
     * 批量获取key 如果全部获取 返回true, 部分获取失败 返回false
     *
     * @return
     */
    public static boolean tryWait(List<String> keyList) {
        return tryWait(keyList, DEFAULT_BATCH_WAIT_TIME);
    }

    /**
     * 批量获取key 如果全部获取 返回true, 部分获取失败 返回false
     *
     * @return
     */
    public static boolean tryWait(List<String> keyList, long timeout) {
        return tryWait(keyList, timeout, TimeUnit.SECONDS);
    }

    /**
     * 锁在给定的等待时间内空闲，则获取锁成功 返回true， 否则返回false
     *
     * @param timeout
     * @param unit
     * @return
     */
    public static boolean tryWait(List<String> keyList, long timeout, TimeUnit unit) {
        Jedis jedis = null;
        try {
            jedis = getResource();
            long nano = System.nanoTime();
            do {
                Boolean allExists = true;
                //构建pipeline，批量提交
                Pipeline pipeline = jedis.pipelined();
                for (String key : keyList) {
                    pipeline.exists(key);
                }
                Debug.logVerbose("try wait keys: " + keyList, module);
                //提交redis执行计数,批量处理完成返回
                List<Object> results = pipeline.syncAndReturnAll();
                for (int i = 0; i < results.size(); ++i) {
                    Boolean result = (Boolean) results.get(i);
                    if (!result) {
                        allExists = false;
                    }
                }

                if (allExists) return true;//成功获取全部的key

                //部分资源未全部存在
                Debug.logVerbose("keys: " + keyList + " is not all exists", module);

                if (timeout == 0) {
                    break;
                }
                Thread.sleep(500);
            } while ((System.nanoTime() - nano) < unit.toNanos(timeout));

            //得不到所有key，返回失败
            return false;
        } catch (Exception e) {
            Debug.logError(e, module);
        } finally {
            RedisWorker.closeJedis(jedis);
        }
        return true;
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