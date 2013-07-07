<#include "component://example/webapp/example/includes/macros.ftl">
<script type="text/javascript">
//<![CDATA[
$(function(){
	$('#myTab a').click(function (e) {
		e.preventDefault();
		var a = $(this);
		if("#person-new" == a.attr("href")){
			createPerson();
		}else{
			$(this).tab('show');
		}
	})
});
//]]>
</script>
${requestParameters}
<ul class="nav nav-tabs" id="myTab">
  <li class="active"><a href="#person-list">用户列表</a></li>
  <li><a href="#person-new">新建用户</a></li>
</ul>
<div class="tab-content">
	<div class="search mini-layout tab-pane active" id="person-list">
		<form class="form-horizontal" id="searchForm" method="post">
		  <input type="hidden" name="VIEW_INDEX">
		  <input type="hidden" name="VIEW_SIZE" value="${viewSize?default('')}">
		  <div class="control-group">
		    <label class="control-label" for="inputEmail">姓名</label>
		    <div class="controls">
		      <input type="text" id="inputEmail" name="like_name" value="${requestParameters.like_name?default("")}">
		    </div>
		  </div>
		  <div class="control-group">
		    <label class="control-label" for="inputPassword">用户类型</label>
		    <div class="controls">
		      <#assign personTypeList = delegator.findByAndCache("PersonType",{})>
		      <select name="eq_personTypeId">
		      	<option value="">请选择</option>
		      	<#list personTypeList as personType>
		      	<option value="${personType.personTypeId}" ${(requestParameters.eq_personTypeId?default("") == personType.personTypeId)?string("selected","")}>${personType.description}</option>
		      	</#list>
		      </select>
		    </div>
		  </div>
		  <div class="control-group">
		    <label class="control-label" for="inputPassword">状态</label>
		    <div class="controls">
		      <#assign personStatusItemList = delegator.findByAndCache("StatusItem",{"statusTypeId":"PERSON_STATUS"})>
		      <select name="eq_statusId">
		      	<option value="">请选择</option>
		      	<#list personStatusItemList as personStatusItem>
		      	<option value="${personStatusItem.statusId}" ${(requestParameters.eq_statusId?default("") == personStatusItem.statusId)?string("selected","")}>${personStatusItem.description}</option>
		      	</#list>
		      </select>
		    </div>
		  </div>
		  <div class="control-group">
		    <div class="controls">
		      <button type="button" class="btn" onclick="app.pager.search('searchForm')">搜索</button>
      			<button type="button" class="btn" onclick="app.helper.clearForm('searchForm')">重置</button>
		    </div>
		  </div>
		</form>
	</div>
  <table class="table table-bordered">
	  <thead>
	    <tr>
	      <th>#</th>
	      <th>姓名</th>
	      <th>用户类型</th>
	      <th>状态</th>
	      <th>创建时间</th>
	      <th>最后修改时间</th>
	      <th>操作</th>
	    </tr>
	  </thead>
	  <tbody>
	  	<#list result.list as item>
	    <tr>
	      <td>${item_index}</td>
	      <td>${item.name}</td>
	      <td>${item.personTypeDesc}</td>
	      <td>${item.getRelatedOneCache("StatusItem").description}</td>
	      <td>${item.createdDate?string("yyyy-MM-dd HH:mm:ss")}</td>
	      <td>${item.lastModifiedDate?string("yyyy-MM-dd HH:mm:ss")}</td>
	      <td>
	      	<a href="javascript:void(0);" onclick="updatePerson('${item.personId}')">编辑</a>
	      </td>
	    </tr>
	    </#list>
	  </tbody>
	</table>
	<@pager />
</div>
<#include "createOrUpdatePerson.ftl">
          
        