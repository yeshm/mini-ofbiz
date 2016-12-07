package org.miniofbiz.ext.jms;

import org.apache.activemq.command.ActiveMQDestination;
import org.ofbiz.base.start.Start;
import org.ofbiz.base.util.Debug;
import org.ofbiz.base.util.JNDIContextFactory;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.entity.Delegator;
import org.ofbiz.service.GenericServiceException;
import org.ofbiz.service.LocalDispatcher;
import org.ofbiz.service.ServiceContainer;
import org.ofbiz.service.job.Job;

import javax.jms.*;
import javax.naming.InitialContext;
import java.util.concurrent.atomic.AtomicInteger;

public class JmsPoller extends Thread implements ExceptionListener {

    public static final String module = JmsPoller.class.getName();
    private static final AtomicInteger created = new AtomicInteger();

    private LocalDispatcher dispatcher;
    private String jndiServer, jndiName, queueName, userName, password;
    private QueueConnection con = null;
    private ActiveMQDestination destination = null;
    protected boolean isConnected = false;
    private boolean stop = false;
//    private long lastLoopTime = 0;

    public JmsPoller(Delegator delegator, String jndiServer, String jndiName, String queueName, String userName, String password) {
        this.jndiServer = jndiServer;
        this.jndiName = jndiName;
        this.queueName = queueName;
        this.userName = userName;
        this.password = password;

        this.dispatcher = ServiceContainer.getLocalDispatcher("JMSDispatcher", delegator);

        this.setName("OFBiz-JmsPoller-" + created.getAndIncrement());
        this.setDaemon(false);
        this.start();
    }

    public void close() {
        try {
            con.close();
            this.setConnected(false);
            this.setStop(true);
        } catch (JMSException e) {
            Debug.logError(e, module);
        }
    }

    /**
     * 连接到jms服务器
     */
    public void connect() {
        try {
            InitialContext jndi = JNDIContextFactory.getInitialContext(jndiServer);
            QueueConnectionFactory factory = (QueueConnectionFactory) jndi.lookup(jndiName);

            if (factory != null) {
                con = factory.createQueueConnection(userName, password);
                con.setExceptionListener(this);
                destination = (ActiveMQDestination) jndi.lookup(queueName);
                if (destination != null) {
                    con.start();
                    this.setConnected(true);
                    Debug.logInfo("Monitor on queue [" + queueName + "]...", module);
                } else {
                    throw new GenericServiceException("Queue lookup failed.");
                }
            }
        } catch (Exception e) {
            Debug.logError(e, module);
        }
    }

    // Do not check for interrupts in this method. The design requires the
    // thread to complete the job manager poll uninterrupted.
    public void run() {
        Debug.logInfo("JmsPoller thread started.", module);
        try {
            while (Start.getInstance().getCurrentState() != Start.ServerState.RUNNING) {
                Thread.sleep(1000);
            }

//            lastLoopTime = System.currentTimeMillis();
            while (true) {
//                    Debug.logInfo("waiting for message...", module);
                try {
                    if (isStop() || Start.getInstance().getCurrentState() == Start.ServerState.STOPPING) {
                        break;
                    }

                    if (isConnected()) {
//                            Map map = new HashMap<>();
//                            ExtServiceUtil.logSpendTimeStart(map);
                        Session session = con.createSession(false, Session.CLIENT_ACKNOWLEDGE);
//                            ExtServiceUtil.logSpendTime(map, "jmstest createSession");

                        MessageConsumer receiver = session.createConsumer(destination);
//                        long createTime = System.currentTimeMillis();
//                            ExtServiceUtil.logSpendTime(map, "jmstest createReceiver");
                        Message message = receiver.receive();
//                        long receiveTime = System.currentTimeMillis();
//                            ExtServiceUtil.logSpendTime(map, "jmstest receive");

                        if (UtilValidate.isNotEmpty(message)) {
                            MapMessage mapMessage = (MapMessage) message;

                            try {
                                Job job = new GenericJmsServiceJob(dispatcher, session, receiver, mapMessage);
                                dispatcher.getJobManager().runJob(job);
                            }catch (Exception e){
                                Debug.logError(e, module);
                                receiver.close();
                                session.close();
                            }

//                                ExtServiceUtil.logSpendTime(map, "jmstest runJob");
                        } else {
                            receiver.close();
                            session.close();
                        }
//                        long runServiceTime = System.currentTimeMillis();

//                        long thisLoopTime = System.currentTimeMillis();
//                        Debug.logInfo("JmlPollerLoop %d, create %d, receive %d, runService %d", module, thisLoopTime - lastLoopTime, createTime - lastLoopTime, receiveTime - createTime, runServiceTime - receiveTime);
//                        lastLoopTime = thisLoopTime;
                    } else {
                        Debug.logError("JmsPoller " + this.getName() + " isn't connected to server", module);
                        Thread.sleep(1000);
                        connect();
                    }
                } catch (Exception e) {
                    Debug.logError(e, module);
                } finally {

                }
            }
        } catch (InterruptedException e) {
            // Happens when JmsPoller shuts down - nothing to do.
            Thread.currentThread().interrupt();
        }
        Debug.logInfo("JmsPoller thread stopped.", module);
    }

    /**
     * On exception try to re-establish connection to the JMS server.
     *
     * @see javax.jms.ExceptionListener#onException(JMSException)
     */
    public void onException(JMSException je) {
        try {
            this.setConnected(false);
            con.close();
        } catch (JMSException e) {
            Debug.logError(e, module);
        }
    }

    public boolean isStop() {
        return stop;
    }

    public void setStop(boolean stop) {
        this.stop = stop;
    }

    public boolean isConnected() {
        return this.isConnected;
    }

    protected void setConnected(boolean connected) {
        this.isConnected = connected;
    }
}
