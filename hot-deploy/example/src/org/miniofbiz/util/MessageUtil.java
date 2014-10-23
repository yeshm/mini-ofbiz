/*******************************************************************************
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *******************************************************************************/
package org.miniofbiz.util;

import javolution.util.FastList;
import org.ofbiz.base.util.UtilValidate;
import org.ofbiz.service.ModelService;
import org.ofbiz.service.ServiceUtil;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * HttpUtil - Misc Message Utility Functions
 */
public class MessageUtil {

    private static final String ERROR_MESSAGE_LIST_KEY = "_ERROR_MESSAGE_LIST_";
    private static final String EVENT_MESSAGE_LIST_KEY = "_EVENT_MESSAGE_LIST_";
    private static final String ERROR_MESSAGE_KEY = "_ERROR_MESSAGE_";

    private static final String JSON_RESPONSE_DATA_KEY = "_JSON_RESPONSE_DATA_";
    /**
     * 错误异常代码
     */
    private static final String ERROR_MESSAGE_CODE_KEY = "_ERROR_MESSAGE_CODE_";

    public static void saveSuccessMessage(HttpServletRequest request) {
        request.setAttribute(MessageUtil.JSON_RESPONSE_DATA_KEY, null);
    }

    public static void saveSuccessMessage(HttpServletRequest request, Object jsonResponseObject) {
        request.setAttribute(MessageUtil.JSON_RESPONSE_DATA_KEY, jsonResponseObject);
    }

    public static void saveErrorMessages(HttpServletRequest request, List<String> messages) {
        MessageUtil.add2MessageList(request, ERROR_MESSAGE_LIST_KEY, messages);
    }

    public static void saveErrorMessage(HttpServletRequest request, String message) {
        MessageUtil.add2MessageList(request, ERROR_MESSAGE_LIST_KEY, message);
    }

    /**
     * 单条异常信息
     *
     * @param request
     * @param message
     * @param errorCode 错误代码
     */
    public static void saveErrorMessage(HttpServletRequest request, String message, String errorCode) {
        saveErrorMessage(request, message);
        saveErrorCode(request, errorCode);
    }

    public static void saveErrorCode(HttpServletRequest request, String errorCode) {
        request.setAttribute(ERROR_MESSAGE_CODE_KEY, errorCode);
    }

    public static void saveEventMessages(HttpServletRequest request, List<String> messages) {
        MessageUtil.add2MessageList(request, EVENT_MESSAGE_LIST_KEY, messages);
    }

    public static void saveEventMessage(HttpServletRequest request, String message) {
        MessageUtil.add2MessageList(request, EVENT_MESSAGE_LIST_KEY, message);
    }

    public static String handleServiceResults(HttpServletRequest request, Map<String, Object> results) {
        if (!ServiceUtil.isSuccess(results)) {
            if (results.containsKey("errorMessage")) MessageUtil.saveErrorMessage(request, (String) results.get("errorMessage"));
            if (results.containsKey("errorMessageList")) MessageUtil.saveErrorMessages(request, (List<String>) results.get("errorMessageList"));
            return "error";
        } else {
            if (results.containsKey(ModelService.SUCCESS_MESSAGE)) MessageUtil.saveEventMessage(request, (String) results.get(ModelService.SUCCESS_MESSAGE));
            if (results.containsKey(ModelService.SUCCESS_MESSAGE_LIST)) MessageUtil.saveEventMessages(request, (List<String>) results.get(ModelService.SUCCESS_MESSAGE_LIST));
        }
        return "success";
    }

    @SuppressWarnings("unchecked")
    public static void add2MessageList(HttpServletRequest request, String attributeKey, String message) {
        if (UtilValidate.isEmpty(message)) return;

        Object o = request.getAttribute(attributeKey);
        List<String> messageList = null;

        if (o != null && o instanceof List) {
            messageList = (List<String>) o;
        } else {
            messageList = FastList.newInstance();
        }

        messageList.add(message);
        request.setAttribute(attributeKey, messageList);
    }

    @SuppressWarnings("unchecked")
    public static void add2MessageList(HttpServletRequest request, String attributeKey, List<String> messages) {
        if (UtilValidate.isEmpty(messages)) return;

        for (String message : messages) {
            MessageUtil.add2MessageList(request, attributeKey, message);
        }
    }
}
