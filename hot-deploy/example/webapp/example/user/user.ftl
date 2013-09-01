<#--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->
<form id="searchForm" class="form-horizontal">
    <div class="row">
        <div class="control-group span8">
            <label class="control-label">ID：</label>

            <div class="controls">
                <input type="text" class="control-text" name="eq_personId">
            </div>
        </div>
        <div class="control-group span8">
            <label class="control-label">姓名：</label>

            <div class="controls">
                <input type="text" class="control-text" name="like_name">
            </div>
        </div>
        <div class="control-group span8">
            <label class="control-label">状态：</label>

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
    </div>
    <div class="row">
        <div class="control-group span9">
            <label class="control-label">注册时间：</label>

            <div class="controls">
                <input type="text" class=" calendar" name="ge_createdDate"><span> - </span><input name="le_createdDate" type="text" class=" calendar">
            </div>
        </div>
        <div class="span3 offset2">
            <button type="button" id="btnSearch" class="button button-primary">搜索</button>
            <button type="reset" class="btn">重置</button>
        </div>
    </div>
</form>

<div class="search-grid-container">
    <div id="grid"></div>
</div>

<div id="content" class="hide">
    <form id="J_Form" class="form-horizontal" action="../data/edit.php?a=1">
        <input type="hidden" name="a" value="3">

        <div class="row">
            <div class="control-group span8">
                <label class="control-label"><s>*</s>姓名</label>

                <div class="controls">
                    <input name="name" type="text" data-rules="{required:true}" class="input-normal control-text">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="control-group span8">
                <label class="control-label"><s>*</s>用户类型：</label>

                <div class="controls">
                <#assign personTypeList = delegator.findByAndCache("PersonType",{})>
                    <select data-rules="{required:true}" name="personTypeId" class="input-normal">
                        <option value="">请选择</option>
                    <#list personTypeList as personType>
                        <option value="${personType.personTypeId}">${personType.description}</option>
                    </#list>
                    </select>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="control-group span8">
                <label class="control-label"><s>*</s>状态：</label>

                <div class="controls">
                <#assign personStatusItemList = delegator.findByAndCache("StatusItem",{"statusTypeId":"PERSON_STATUS"})>
                    <select data-rules="{required:true}" name="statusId" class="input-normal">
                        <option value="">请选择</option>
                    <#list personStatusItemList as personStatusItem>
                        <option value="${personStatusItem.statusId}">${personStatusItem.description}</option>
                    </#list>
                    </select>
                </div>
            </div>
        </div>
    </form>
</div>


<script>
    BUI.use(['common/search', 'common/page'], function (Search) {

        var enumObj = {"PERSON_ENABLED": "启用", "PERSON_DISABLED": "禁用"};
        var editing = new BUI.Grid.Plugins.DialogEditing({
            contentId: 'content', //设置隐藏的Dialog内容
            triggerCls: 'btn-edit', //触发显示Dialog的样式
            editor: {
                success: function () { //点击确认的时候触发，可以进行异步提交
                    var editor = this;
                    var record = editing.get('record');
                    var data = editor.getValue(); //编辑完成的记录
                    var form = editing.get('form');
                    if (form.isValid()) {
                        submit(record, data, editor);
                    }
                    //var form = $('#J_Form'); //也可以直接使用表单同步提交的方式
                    //alert(form.isValid());
                    //form.submit();
                }
            }
        });
        var columns = [
            {title: '会员ID', dataIndex: 'personId', width: 80, renderer: function (v) {
                return Search.createLink({
                    id: 'detail' + v,
                    title: '会员信息',
                    text: v,
                    href: 'detail/example.html'
                });
            }},
            {title: '会员姓名', dataIndex: 'name', width: 100},
            {title: '注册时间', dataIndex: 'createdDate', width: 126, renderer: BUI.Grid.Format.datetimeRenderer},
            {title: '状态', dataIndex: 'statusId', width: 60, renderer: BUI.Grid.Format.enumRenderer(enumObj)},
            {title: '操作', dataIndex: '', width: 200, renderer: function (value, obj) {
                var editStr = '<span class="grid-command btn-edit" title="编辑">编辑</span>';
                var delStr = '<span class="grid-command btn-del" title="删除">删除</span>';
//页面操作不需要使用Search.createLink
                return editStr + delStr;
            }}
        ];
        var store = Search.createStore('<@ofbizUrl>user.json</@ofbizUrl>', {
            pageSize: 15
        });
        var gridCfg = Search.createGridCfg(columns, {
            tbar: {
                items: [
                    {text: '<i class="icon-plus"></i>新建', btnCls: 'button button-small', handler: addFunction},
                    {text: '<i class="icon-remove"></i>删除', btnCls: 'button button-small', handler: delFunction}
                ]
            },
            plugins: [editing, BUI.Grid.Plugins.CheckSelection] // 插件形式引入多选表格
        });

        var search = new Search({
            store: store,
            gridCfg: gridCfg
        });
        var grid = search.get('grid');

        function addFunction() {
            var newData = {isNew: true}; //标志是新增加的记录
//      store.addAt(newData,0);
            editing.edit(newData, 'name'); //添加记录后，直接编辑
        }

        function submit(record, data, editor) {
            var url = record.isNew ? '<@ofbizUrl>createPerson</@ofbizUrl>' : '<@ofbizUrl>updatePerson</@ofbizUrl>';
            data.personId = record.personId;
            $.ajax({
                type: 'post',
                url: url,
                dataType: 'json',
                data: data,
                success: function (data) {
                    if (data.result == "success") { //编辑、新建成功
                        editor.accept(); //隐藏弹出框
                        search.load();
                    } else { //编辑失败失败
                        var msg = data.msg;
                        BUI.Message.Alert('错误原因:' + msg);
                    }
                }
            });
        }

        //删除操作
        function delFunction() {
            var selections = grid.getSelection();
            delItems(selections);
        }

        function delItems(items) {
            var ids = [];
            BUI.each(items, function (item) {
                ids.push(item.id);
            });

            if (ids.length) {
                BUI.Message.Confirm('确认要删除选中的记录么？', function () {
                    alert("未实现！");
                }, 'question');
            }
        }

        //监听事件，删除一条记录
        grid.on('cellclick', function (ev) {
            var sender = $(ev.domTarget); //点击的Dom
            if (sender.hasClass('btn-del')) {
                var record = ev.record;
                delItems([record]);
            }
        });
    });
</script>