package org.miniofbiz.ext.common

import org.miniofbiz.base.crypto.HashCrypt
import org.miniofbiz.base.util.UtilValidate
import org.miniofbiz.common.login.LoginServices
import org.miniofbiz.entity.Delegator
import org.miniofbiz.entity.GenericValue
import org.miniofbiz.service.LocalDispatcher
import org.miniofbiz.service.ServiceUtil

public Map resetPassword() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    GenericValue userLogin = userLogin
    Map parameters = parameters

    def userLoginId = parameters.userLoginId
    def newPassword = parameters.newPassword
    def newPasswordVerify = parameters.newPasswordVerify

    if (UtilValidate.isWhitespace(userLoginId) || UtilValidate.isWhitespace(newPassword) || UtilValidate.isWhitespace(newPasswordVerify)) return ServiceUtil.returnError("参数不完整")
    if (!newPassword.equals(newPasswordVerify)) return ServiceUtil.returnError("两次输入的密码不一致")

    def userLoginEntity = delegator.findOne("UserLogin", [userLoginId: userLoginId], false)
    if (UtilValidate.isEmpty(userLoginEntity)) return ServiceUtil.returnError("修改失败")

    userLoginEntity.currentPassword = HashCrypt.digestHash(LoginServices.getHashType(), null, newPassword)
    userLoginEntity.store()

    return ServiceUtil.returnSuccess()
}

public Map updatePassword() {
    LocalDispatcher dispatcher = dispatcher
    Delegator delegator = delegator
    GenericValue userLogin = userLogin
    Map parameters = parameters

    def userLoginId = parameters.userLoginId
    def currentPassword = parameters.currentPassword
    def newPassword = parameters.newPassword
    def newPasswordVerify = parameters.newPasswordVerify

    if (UtilValidate.isWhitespace(userLoginId) || UtilValidate.isWhitespace(currentPassword) || UtilValidate.isWhitespace(newPassword) || UtilValidate.isWhitespace(newPasswordVerify)) return ServiceUtil.returnError("参数不完整")
    if (!newPassword.equals(newPasswordVerify)) return ServiceUtil.returnError("两次输入的密码不一致")

    def userLoginEntity = delegator.findOne("UserLogin", [userLoginId: userLoginId], false)
    if (UtilValidate.isEmpty(userLoginEntity)) return ServiceUtil.returnError("修改失败")
    if (!HashCrypt.comparePassword(userLoginEntity.currentPassword, LoginServices.getHashType(), currentPassword)) return ServiceUtil.returnError("您输入的旧密码不正确")

    userLoginEntity.currentPassword = HashCrypt.digestHash(LoginServices.getHashType(), null, newPassword)
    userLoginEntity.store()

    return ServiceUtil.returnSuccess()
}