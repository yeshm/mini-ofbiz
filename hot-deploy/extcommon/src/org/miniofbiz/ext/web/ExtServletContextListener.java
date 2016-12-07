package org.miniofbiz.ext.web;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

public class ExtServletContextListener implements ServletContextListener {
    private static Thread applicationStatusReportThread;

    @Override
    public void contextInitialized(ServletContextEvent servletContextEvent) {
        if (applicationStatusReportThread == null) {
            applicationStatusReportThread = new ApplicationStatusReportThread();
            applicationStatusReportThread.setName("ApplicationStatusReportThread");
            applicationStatusReportThread.start();
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent servletContextEvent) {

    }
}