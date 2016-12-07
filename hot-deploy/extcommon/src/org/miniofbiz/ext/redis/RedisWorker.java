package org.miniofbiz.ext.redis;

import groovy.lang.Closure;
import org.ofbiz.base.util.StringUtil;
import org.ofbiz.base.util.UtilProperties;
import org.ofbiz.base.util.UtilValidate;
import redis.clients.jedis.*;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

public class RedisWorker {

    private static final String module = RedisWorker.class.getName();

    public static final String KEY_SEPARATOR = ":";
    public static final String LOCK_KEY_SUFFIX = ":LOCK";

    public static final int SECONDS_OF_MONTH = 31 * 24 * 60 * 60;
    public static final int SECONDS_OF_YEAR = 365 * 24 * 60 * 60;

    private static JedisPool pool = null;

    static {
        String host = UtilProperties.getPropertyValue("redisConfig", "host");
        int port = UtilProperties.getPropertyAsInteger("redisConfig", "port", 6379);
        String password = UtilProperties.getPropertyValue("redisConfig", "password");

        password = UtilValidate.isWhitespace(password) ? null : password;

        int timeout = 1000;

        JedisPoolConfig config = new JedisPoolConfig();
        config.setMaxTotal(1000);
        config.setMaxWaitMillis(1000);

        pool = new JedisPool(config, host, port, timeout, password);
    }

    public static String getRedisKey(String... params) {
        if (params.length > 0) {
            return StringUtil.join(Arrays.asList(params), RedisWorker.KEY_SEPARATOR);
        }
        return null;
    }

    public static String getRedisLockKey(String... params) {
        String redisKey = getRedisKey(params);
        if (!UtilValidate.isWhitespace(redisKey)) {
            return redisKey + LOCK_KEY_SUFFIX;
        } else {
            return null;
        }
    }

    public static Jedis getJedis() {
        return pool.getResource();
    }

    public static void closeJedis(Jedis jedis) {
        jedis.close();
    }

    /**
     * Groovy闭包写法
     * def partyId = RedisWorker.work { jedis ->
     * return jedis.get("PARTY_KEY")
     * }
     */
    public static Object work(Closure jedisWorker) {
        Jedis jedis = RedisWorker.getJedis();

        Object result;
        try {
            result = jedisWorker.call(jedis);
        } finally {
            closeJedis(jedis);
        }

        return result;
    }

    /**
     * java8 lamda表达式写法
     * return RedisWorker.work((jedis) -> {
     * return jedis.srandmember("PARTY_KEY");
     * });
     */
    public static <T> T work(RedisFunc redisFunc) throws Exception {
        Jedis jedis = RedisWorker.getJedis();

        T result;
        try {
            result = (T) redisFunc.run(jedis);
        } finally {
            closeJedis(jedis);
        }

        return result;
    }

    public static JedisPool getPool() {
        return pool;
    }

    public static Boolean exists(String key) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.exists(key);
        } finally {
            closeJedis(jedis);
        }
    }

    public static String set(String key, String value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.set(key, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static String set(byte[] key, byte[] value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.set(key, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static String set(String key, String value, String nxxx, String expx, long time) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.set(key, value, nxxx, expx, time);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long setnx(String key, String value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.setnx(key, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static String setex(String key, int seconds, String value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.setex(key, seconds, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static String setex(byte[] key, int seconds, byte[] value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.setex(key, seconds, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static String get(String key) {
        Jedis jedis = RedisWorker.getJedis();
        String value = null;
        try {
            value = jedis.get(key);
        } finally {
            closeJedis(jedis);
        }
        return value;
    }

    public static byte[] get(byte[] key) {
        Jedis jedis = RedisWorker.getJedis();
        byte[] value = null;
        try {
            value = jedis.get(key);
        } finally {
            closeJedis(jedis);
        }
        return value;
    }

    public static Long del(String key) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.del(key);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long del(byte[]... key) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.del(key);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long decrBy(String key, long value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.decrBy(key, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long decr(String key) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.decr(key);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long incrBy(String key, long value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.incrBy(key, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long incr(String key) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.incr(key);
        } finally {
            closeJedis(jedis);
        }
    }

    public static long hincrBy(String key, String field, long value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.hincrBy(key, field, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long hset(String key, String field, String value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.hset(key, field, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static String hget(String key, String field) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.hget(key, field);
        } finally {
            closeJedis(jedis);
        }
    }

    public static List<String> hmget(String key, String... fields) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.hmget(key, fields);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long hdel(String key, String... field) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.hdel(key, field);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long sadd(String key, String... value) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.sadd(key, value);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Set<String> smembers(String key) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.smembers(key);
        } finally {
            closeJedis(jedis);
        }
    }

    public static String srandmember(String key) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.srandmember(key);
        } finally {
            closeJedis(jedis);
        }
    }

    public static List<String> srandmember(String key, int count) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.srandmember(key, count);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long srem(String key, String... members) {
        Jedis jedis = RedisWorker.getJedis();
        try {
            return jedis.srem(key, members);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long zadd(String key, double score, String member) {
        Jedis jedis = getJedis();
        try {
            return jedis.zadd(key, score, member);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Double zincrby(String key, double score, String member) {
        Jedis jedis = getJedis();
        try {
            return jedis.zincrby(key, score, member);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Set<Tuple> zrevrangeWithScores(String key, long start, long end) {
        Jedis jedis = getJedis();
        try {
            return jedis.zrevrangeWithScores(key, start, end);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Set<Tuple> zrangeWithScores(String key, long start, long end) {
        Jedis jedis = getJedis();
        try {
            return jedis.zrangeWithScores(key, start, end);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Set<Tuple> zrevrangeByScoreWithScores(String key, double max, double min) {
        Jedis jedis = getJedis();
        try {
            return jedis.zrevrangeByScoreWithScores(key, max, min);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Set<Tuple> zrangeByScoreWithScores(String key, double min, double max) {
        Jedis jedis = getJedis();
        try {
            return jedis.zrangeByScoreWithScores(key, min, max);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long zunionstore(String dstkey, ZParams params, String... sets) {
        Jedis jedis = getJedis();
        try {
            return jedis.zunionstore(dstkey, params, sets);
        } finally {
            closeJedis(jedis);
        }
    }

    public static Long zrevrank(String key, String member) {
        Jedis jedis = getJedis();
        try {
            return jedis.zrevrank(key, member);
        } finally {
            closeJedis(jedis);
        }
    }

    /***
     * 事务
     * @param doTransaction 事务操作
     * @param isDestory 是否释放连接
     * @throws Throwable
     */
    public static <R> R doTransaction(final DoTransaction<R> doTransaction, boolean isDestory) throws Throwable {
        try {
            return doTransaction.doRun();
        } finally {
            if (isDestory)
                closeJedis(doTransaction.getJedis());
        }
    }

    /***
     * 事务抽像类
     */
    public static abstract class DoTransaction<R> {

        private Jedis jedis;
        private String lock;

        public R doRun() throws Throwable {
            try {
                if (RedisLockWorker.tryLock(lock)) {
                    Transaction transaction = jedis.multi();
                    R result = run(transaction);
                    transaction.exec();
                    return result;
                }
            } finally {
                RedisLockWorker.unLock(lock);
            }
            return null;
        }

        public abstract R run(final Transaction transaction) throws Throwable;

        public DoTransaction(final Jedis jedis, final String lock) {
            this.lock = lock;
            this.jedis = jedis;
        }

        public Jedis getJedis() {
            return this.jedis;
        }

        public DoTransaction setJedis(final Jedis jedis) {
            this.jedis = jedis;
            return this;
        }

        public String getLock() {
            return this.lock;
        }

        public DoTransaction setJedis(final String lock) {
            this.lock = lock;
            return this;
        }
    }
}