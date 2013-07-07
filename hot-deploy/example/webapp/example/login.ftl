<style type="text/css">
  body {
    padding-top: 100px;
    padding-bottom: 40px;
    background-color: #f5f5f5;
  }

  .form-signin {
    max-width: 520px;
	padding-top: 49px;
    background-color: #fff;
    border: 1px solid #e5e5e5;
    margin-left:auto;  
	margin-right:auto; 
  }
</style>
<div class="container">
<form action="<@ofbizUrl>login</@ofbizUrl>" class="form-horizontal form-signin" id="myform" method="post">
  <div class="control-group">
    <label class="control-label" for="USERNAME">用户名：</label>
    <div class="controls">
      <input type="text" id="USERNAME" name="USERNAME">
    </div>
  </div>
  <div class="control-group">
    <label class="control-label" for="PASSWORD">密码：</label>
    <div class="controls">
      <input type="password" id="PASSWORD" name="PASSWORD">
    </div>
  </div>
  <div class="control-group">
    <div class="controls">
      <button type="submit" class="btn btn-large btn-primary" id="submit">登录</button>
    </div>
  </div>
</form>
<#include "component://example/webapp/example/includes/container_footer.ftl">
</div>