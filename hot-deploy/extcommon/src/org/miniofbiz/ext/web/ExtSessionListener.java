package org.miniofbiz.ext.web;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

public class ExtSessionListener implements HttpSessionListener {
    private static int count;

    @Override
    public void sessionCreated(HttpSessionEvent event) {
        count++;
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent event) {
        count--;
    }

    public static int getCount() {
        return count;
    }
}