package org.miniofbiz.ext.jms;


import org.apache.activemq.command.ActiveMQDestination;
import org.miniofbiz.ext.redis.RedisLockWorker;
import org.miniofbiz.ext.redis.RedisWorker;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.ObjectType;
import org.ofbiz.base.util.UtilGenerics;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.entity.GenericEntityException;
import org.ofbiz.entity.serialize.XmlSerializer;
import org.ofbiz.entity.transaction.GenericTransactionException;
import org.ofbiz.entity.transaction.TransactionUtil;
import org.ofbiz.service.GenericServiceException;
import org.ofbiz.service.LocalDispatcher;
import org.ofbiz.service.ModelService;
import org.ofbiz.service.ServiceUtil;
import org.ofbiz.service.job.InvalidJobException;
import org.ofbiz.service.job.Job;

import javax.jms.JMSException;
import javax.jms.MapMessage;
import javax.jms.MessageConsumer;
import javax.jms.Session;
import java.io.Serializable;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * A generic Jms async-service job.
 */
@SuppressWarnings("serial")
public class GenericJmsServiceJob implements Job, Serializable {

    public static final String module = GenericJmsServiceJob.class.getName();

    protected final LocalDispatcher dispatcher;
    protected final Session session;
    protected final MessageConsumer consumer;
    private final MapMessage message;
    private final String jobId;
    private final String jobName;
    protected State currentState = State.CREATED;
    private long elapsedTime = 0;
    private final Date startTime = new Date();
    private String serviceName;
    private Map<String, ? extends Object> context;

    public GenericJmsServiceJob(LocalDispatcher dispatcher, Session session, MessageConsumer consumer, MapMessage message) {
        this.jobName = "JmsService";
        this.jobId = this.jobName + "." + Long.toString(System.currentTimeMillis());
        this.dispatcher = dispatcher;
        this.session = session;
        this.consumer = consumer;
        this.message = message;
    }

    /**
     * Invokes the service.
     */
    public void exec() throws InvalidJobException {
        if (currentState != State.QUEUED) {
            throw new InvalidJobException("Illegal state change");
        }
        currentState = State.RUNNING;
        init();
        Throwable thrown = null;
        Map<String, Object> result = null;
        // no transaction is necessary since runSync handles this
        try {
            boolean redelivered = message.getJMSRedelivered();
            String messageId = message.getJMSMessageID();
            String key = "jms:queue:" + messageId;
            String lockKey = key + RedisWorker.LOCK_KEY_SUFFIX;

            //如果是重发的消息，进行业务层检验，避免消息被重复消费
            if (redelivered && RedisWorker.exists(key)) {
                RedisWorker.incr("jms:queue:duplicateFoundCount");
                Debug.logError("message is duplicate comsume, messageId:" + messageId, module);
                message.acknowledge();
            } else {
                if(RedisLockWorker.tryLock(lockKey, 0, TimeUnit.SECONDS)) {
                    Map results = runService(message);
                    if (UtilValidate.isNotEmpty(results) && ServiceUtil.isSuccess(results)) {
                        ActiveMQDestination destination = (ActiveMQDestination) message.getJMSDestination();
                        if (destination.isQueue()) {
                            RedisWorker.incr("jms:queue:acknowledgeCount");

                            //消息消费成功，进行记录以防重复消息
                            String re = RedisWorker.set(key, "1", "nx", "ex", 3600);
                            if (!"OK".equals(re)) {
                                RedisWorker.incr("jms:queue:duplicateErrorCount");
                            }
                        }
                    }else{
                        runServiceAsync();
                    }
                }
            }
        } catch (Throwable t) {
            thrown = t;
        }

        if (thrown == null) {
            finish(result);
        } else {
            failed(thrown);
            runServiceAsync();
        }
    }

    /**
     * persist service defined in the MapMessage to db
     */
    protected void runServiceAsync() {
        boolean beganTransaction = false;
        try {
            beganTransaction = TransactionUtil.begin();
            dispatcher.runAsync(serviceName, context, true);
        } catch (Throwable e) {
            Debug.logError(e, module);
            String key = RedisWorker.getRedisKey("Jms", "ErrorList2");
            RedisWorker.sadd(key, message.toString());

            try {
                // only rollback the transaction if we started one...
                TransactionUtil.rollback(beganTransaction, "Problems when put jms to async", e);
            } catch (GenericEntityException e2) {
                Debug.logError(e2, "Could not rollback transaction: " + e2.toString(), module);
            }
        } finally {
            try {
                TransactionUtil.commit(beganTransaction);
            } catch (GenericEntityException e2) {
                Debug.logError(e2, "Could not commit transaction: " + e2.toString(), module);
            }
        }
    }

    /**
     * Runs the service defined in the MapMessage
     *
     * @param message
     * @return Map
     */
    protected Map<String, Object> runService(MapMessage message) {
        context = null;
        serviceName = null;
        String xmlContext = null;

        try {
            serviceName = message.getString("serviceName");
            xmlContext = message.getString("serviceContext");
            if (serviceName == null || xmlContext == null) {
                Debug.logError("Message received is not an OFB service message. Ignored!", module);
                return null;
            }

            Object o = XmlSerializer.deserialize(xmlContext, dispatcher.getDelegator());

            if (Debug.verboseOn()) Debug.logVerbose("De-Serialized Context --> " + o, module);
            if (ObjectType.instanceOf(o, "java.util.Map"))
                context = UtilGenerics.checkMap(o);
        } catch (JMSException je) {
            Debug.logError(je, "Problems reading message.", module);
        } catch (Exception e) {
            Debug.logError(e, "Problems deserializing the service context.", module);
        }

        try {
            ModelService model = dispatcher.getDispatchContext().getModelService(serviceName);
            if (!model.export) {
                Debug.logWarning("Attempt to invoke a non-exported service: " + serviceName, module);
                return null;
            }
        } catch (GenericServiceException e) {
            Debug.logError(e, "Unable to get ModelService for service : " + serviceName, module);
        }

        if (Debug.verboseOn()) Debug.logVerbose("Running service: " + serviceName, module);

        Map<String, Object> result = null;
        if (context != null) {
            try {
                result = dispatcher.runSync(serviceName, context);
            } catch (GenericServiceException gse) {
                Debug.logError(gse, "Problems with service invocation.", module);
            }
        }
        return result;
    }

    @Override
    public void run() {
        long startMillis = System.currentTimeMillis();
        try {
            exec();
        } catch (InvalidJobException e) {
            Debug.logWarning(e.getMessage(), module);
        }
        // sanity check; make sure we don't have any transactions in place
        try {
            // roll back current TX first
            if (TransactionUtil.isTransactionInPlace()) {
                Debug.logWarning("*** NOTICE: JobInvoker finished w/ a transaction in place! Rolling back.", module);
                TransactionUtil.rollback();
            }
            // now resume/rollback any suspended txs
            if (TransactionUtil.suspendedTransactionsHeld()) {
                int suspended = TransactionUtil.cleanSuspendedTransactions();
                Debug.logWarning("Resumed/Rolled Back [" + suspended + "] transactions.", module);
            }
        } catch (GenericTransactionException e) {
            Debug.logWarning(e, module);
        }
        elapsedTime = System.currentTimeMillis() - startMillis;
    }

    /**
     * Method is called prior to running the service.
     */
    protected void init() throws InvalidJobException {
        if (Debug.verboseOn()) Debug.logVerbose("Async-Service initializing.", module);
    }

    /**
     * Method is called after the service has finished successfully.
     */
    protected void finish(Map<String, Object> result) throws InvalidJobException {
        if (currentState != State.RUNNING) {
            throw new InvalidJobException("Illegal state change");
        }
        currentState = State.FINISHED;
        if (Debug.verboseOn()) Debug.logVerbose("Async-Service finished.", module);
    }

    /**
     * Method is called when the service fails.
     *
     * @param t Throwable
     */
    protected void failed(Throwable t) throws InvalidJobException {
        if (currentState != State.RUNNING) {
            throw new InvalidJobException("Illegal state change");
        }
        currentState = State.FAILED;
        Debug.logError(t, "Async-Service failed.", module);
    }

    @Override
    public boolean isValid() {
        return currentState == State.CREATED;
    }

    @Override
    public void deQueue() throws InvalidJobException {
        throw new InvalidJobException("Unable to queue job [" + getJobId() + "]");
    }

    @Override
    public State currentState() {
        return currentState;
    }

    @Override
    public String getJobId() {
        return this.jobId;
    }

    @Override
    public String getJobName() {
        return this.jobName;
    }

    @Override
    public void queue() throws InvalidJobException {
        if (currentState != State.CREATED) {
            throw new InvalidJobException("Illegal state change");
        }
        this.currentState = State.QUEUED;
    }

    @Override
    public long getRuntime() {
        return elapsedTime;
    }

    @Override
    public Date getStartTime() {
        return startTime;
    }
}
