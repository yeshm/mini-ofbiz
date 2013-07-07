<script type="text/javascript">
//<![CDATA[
$(function(){
	$("#dialog-message").dialog({
	    autoOpen: false,
	    modal: true,
	    width: 560,
	    buttons: {
	        '确定': function () {
	            doSaveOrUpdatePerson();
	        },
	        '取消': function () {
	            $(this).dialog("close");
	        }
	    }
	});
});

var createPerson = function(id){
	$("#dialog-message").dialog("option", "title", "新建用户");
	$("#dialog-message").dialog("open");
	app.helper.clearForm("createOrUpdatForm");
	$("#createOrUpdatForm input[name=personId]").val('');
};

var updatePerson = function(id){
	app.ajaxHelper.submitRequest({
		data:{personId:id},
		url:"<@ofbizUrl>getPerson</@ofbizUrl>",
		success:function(d){
			var person = d.data.person;
			$("#createOrUpdatForm input[name=personId]").val(person.personId);
			$("#createOrUpdatForm input[name=name]").val(person.name);
			$("#createOrUpdatForm select[name=personTypeId]").val(person.personTypeId);
			$("#createOrUpdatForm select[name=statusId]").val(person.statusId);
			
			$("#dialog-message").dialog("option", "title", "编辑用户");
			$("#dialog-message").dialog("open");
		}
	});
};

var doSaveOrUpdatePerson = function(){
	var data = app.helper.deparam($("#createOrUpdatForm").serialize());
	var isUpdate = (data.personId || false);
	app.ajaxHelper.submitRequest({
		data: data,
		url: (data.personId?"<@ofbizUrl>updatePerson</@ofbizUrl>":"<@ofbizUrl>createPerson</@ofbizUrl>"),
		blockUI: true,
		success: function(data, textStatus, jqXHR){
			app.ajaxHelper.success(data, textStatus, jqXHR, {
				message:(isUpdate?"编辑用户成功":"新建用户成功"),
				callBack:function(){
					$("#dialog-message").dialog("close");
					app.pager.search('searchForm');
				}
			});
		}
	});
};
//]]>
</script>
<div id="dialog-message" title="新建用户">
    <form class="form-horizontal" id="createOrUpdatForm">
      <input type="hidden" name="personId" id="inputPersonId">
	  <div class="control-group">
	    <label class="control-label" for="inputName">姓名</label>
	    <div class="controls">
	      <input type="text" id="inputName" name="name">
	    </div>
	  </div>
	  <div class="control-group">
	    <label class="control-label" for="inputPassword">用户类型</label>
	    <div class="controls">
	      <#assign personTypeList = delegator.findByAndCache("PersonType",{})>
	      <select name="personTypeId" id="inputPersonTypeId">
	      	<option value="">请选择</option>
	      	<#list personTypeList as personType>
	      	<option value="${personType.personTypeId}">${personType.description}</option>
	      	</#list>
	      </select>
	    </div>
	  </div>
	  <div class="control-group">
	    <label class="control-label" for="inputPassword">状态</label>
	    <div class="controls">
	      <#assign personStatusItemList = delegator.findByAndCache("StatusItem",{"statusTypeId":"PERSON_STATUS"})>
	      <select name="statusId" id="inputStatusId">
	      	<option value="">请选择</option>
	      	<#list personStatusItemList as personStatusItem>
	      	<option value="${personStatusItem.statusId}">${personStatusItem.description}</option>
	      	</#list>
	      </select>
	    </div>
	  </div>
	</form>
</div>