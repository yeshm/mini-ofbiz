package org.miniofbiz.ext.jms;

import org.miniofbiz.ext.redis.RedisWorker;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.ObjectType;
import org.ofbiz.base.util.UtilGenerics;
import org.ofbiz.entity.Delegator;
import org.ofbiz.entity.GenericEntityException;
import org.ofbiz.entity.serialize.XmlSerializer;
import org.ofbiz.entity.transaction.TransactionUtil;
import org.ofbiz.service.GenericServiceException;
import org.ofbiz.service.ModelService;
import org.ofbiz.service.ServiceUtil;
import org.ofbiz.service.jms.JmsQueueListener;
import org.ofbiz.service.job.Job;
import org.ofbiz.service.job.JobPoller;

import javax.jms.JMSException;
import javax.jms.MapMessage;
import java.util.Map;
import java.util.concurrent.BlockingQueue;

/**
 * ExtJmsQueueListener - Queue (P2P) Message Listener.
 */
public class ExtJmsQueueListener extends JmsQueueListener {

    public static final String module = ExtJmsQueueListener.class.getName();

    /**
     * Creates a new ExtJmsQueueListener - Should only be called by the JmsListenerFactory.
     */
    public ExtJmsQueueListener(Delegator delegator, String jndiServer, String jndiName, String queueName, String userName, String password) {
        super(delegator, jndiServer, jndiName, queueName, userName, password);
    }

    @Override
    protected Map<String, Object> runService(MapMessage message) {
        try {
            BlockingQueue queue = JobPoller.executor.getQueue();
            int size = queue.size();
            int remainingCapacity = queue.remainingCapacity();

            if (remainingCapacity <= 0) {
                Debug.logError("JobPoller queue is full when execute jms message: %s", "", message.toString());
                runServiceAsync(message);
                Thread.sleep(500);
                return ServiceUtil.returnSuccess();
            }

            Job job = new GenericJmsServiceJob(dispatcher, null, null, message);
            dispatcher.getJobManager().runJob(job);

            if (size / remainingCapacity > 4) {
                Thread.sleep(500);
            }
        } catch (Throwable e) {
            Debug.logError(e, module);
            runServiceAsync(message);
        }
        return ServiceUtil.returnSuccess();
    }

    /**
     * persist service defined in the MapMessage to db
     *
     * @param message
     * @return Map
     */
    protected void runServiceAsync(MapMessage message) {
        Map<String, ? extends Object> context = null;
        String serviceName = null;
        String xmlContext = null;

        try {
            serviceName = message.getString("serviceName");
            xmlContext = message.getString("serviceContext");
            if (serviceName == null || xmlContext == null) {
                Debug.logError("Message received is not an OFB service message. Ignored!", module);
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
            }
        } catch (GenericServiceException e) {
            Debug.logError(e, "Unable to get ModelService for service : " + serviceName, module);
        }

        if (Debug.verboseOn()) Debug.logVerbose("Running service: " + serviceName, module);

        if (context != null) {
            boolean beganTransaction = false;
            try {
                beganTransaction = TransactionUtil.begin();
                dispatcher.runAsync(serviceName, context, true);
            } catch (Throwable e) {
                String key = RedisWorker.getRedisKey("Jms", "ErrorList1");
                RedisWorker.sadd(key, message.toString());
                Debug.logError(e, "Problems when put jms to async", module);
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
    }
}
