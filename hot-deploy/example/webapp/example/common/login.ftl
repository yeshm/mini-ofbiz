<#assign username = requestParameters.USERNAME?default((sessionAttributes.autoUserLogin.userLoginId)?default(""))>
<#if username != "">
    <#assign focusName = false>
<#else>
    <#assign focusName = true>
</#if>
<center>
    <div class="screenlet login-screenlet">
        <div class="screenlet-title-bar">
            <h3>登录</h3>
        </div>
        <div class="screenlet-body">
            <form method="post" action="<@ofbizUrl>login</@ofbizUrl>" name="loginform">
                <table class="basic-table" cellspacing="0">
                    <tr>
                        <td class="label">用户名：</td>
                        <td><input type="text" name="USERNAME" value="${username}" size="20"/></td>
                    </tr>
                    <tr>
                        <td class="label">密码：</td>
                        <td><input type="password" name="PASSWORD" value="" size="20"/></td>
                    </tr>
                    <tr>
                        <td colspan="2" align="center">
                            <input type="submit" value="登录"/>
                        </td>
                    </tr>
                </table>
                <input type="hidden" name="JavaScriptEnabled" value="N"/>
                <br/>
                <a href="<@ofbizUrl>forgotPassword</@ofbizUrl>">忘记密码？</a>
            </form>
        </div>
    </div>
</center>

<script language="JavaScript" type="text/javascript">
    document.loginform.JavaScriptEnabled.value = "Y";
    <#if focusName>
    document.loginform.USERNAME.focus();
    <#else>
    document.loginform.PASSWORD.focus();
    </#if>

    if (window != top) {
        top.location.reload();
    }
</script>