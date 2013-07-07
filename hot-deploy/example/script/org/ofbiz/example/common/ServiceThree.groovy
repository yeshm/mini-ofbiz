package org.ofbiz.example.common

import org.ofbiz.service.ServiceUtil;

println ":context.message"+context.message;

Map result = ServiceUtil.returnSuccess();
result.put("message", context.message+",in service three");

return result;