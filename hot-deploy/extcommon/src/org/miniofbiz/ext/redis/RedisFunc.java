package org.miniofbiz.ext.redis;

import redis.clients.jedis.Jedis;

@FunctionalInterface
public interface RedisFunc {

    public abstract Object run(Jedis jedis) throws Exception;
}
