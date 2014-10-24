package org.miniofbiz.elasticsearch;

import org.elasticsearch.common.settings.ImmutableSettings;
import org.elasticsearch.common.settings.Settings;
import org.elasticsearch.node.Node;
import org.elasticsearch.node.NodeBuilder;
import org.ofbiz.base.util.Debug;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

public class ElasticsearchServletContextListener implements ServletContextListener {

    private static final String module = ElasticsearchServletContextListener.class.getName();

    private static Node node;

    @Override
    public void contextInitialized(ServletContextEvent servletContextEvent) {
        Debug.logInfo("contextInitialized", module);

        ImmutableSettings.Builder settings = ImmutableSettings.settingsBuilder();
        settings.put("path.home", System.getProperty("ofbiz.home") + "/hot-deploy/elasticsearch");

        Settings esSettings = settings.build();

        node = NodeBuilder.nodeBuilder().local(false).settings(esSettings).node();
        node.start();
    }

    @Override
    public void contextDestroyed(ServletContextEvent servletContextEvent) {
        Debug.logInfo("contextDestroyed", module);
        node.close();
    }
}
