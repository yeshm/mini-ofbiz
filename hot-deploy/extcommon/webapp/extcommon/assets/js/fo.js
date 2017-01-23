var regexEnum = {
    decmal: "^([+-]?)\\d*\\.\\d+$", //浮点数
    decmal1: "^[1-9]\\d*.\\d*|0.\\d*[1-9]\\d*$", //正浮点数
    decmal2: "^-([1-9]\\d*.\\d*|0.\\d*[1-9]\\d*)$", //负浮点数
    decmal3: "^-?([1-9]\\d*.\\d*|0.\\d*[1-9]\\d*|0?.0+|0)$", //浮点数
    decmal4: "^[1-9]\\d*.\\d*|0.\\d*[1-9]\\d*|0?.0+|0$", //非负浮点数（正浮点数 + 0）
    decmal5: "^(-([1-9]\\d*.\\d*|0.\\d*[1-9]\\d*))|0?.0+|0$", //非正浮点数（负浮点数 + 0）
    intege: "^-?[1-9]\\d*$", //整数
    intege1: "^[1-9]\\d*$", //正整数
    intege2: "^-[1-9]\\d*$", //负整数
    num: "^([+-]?)\\d*\\.?\\d+$", //数字
    num1: "^[1-9]\\d*|0$", //正数（正整数 + 0）
    num2: "^-[1-9]\\d*|0$", //负数（负整数 + 0）
    ascii: "^[\\x00-\\xFF]+$", //仅ACSII字符
    chinese: "^[\\u4e00-\\u9fa5]+$", //仅中文
    color: "^[a-fA-F0-9]{6}$", //颜色
    date: "^\\d{4}(\\-|\\/|\.)\\d{1,2}\\1\\d{1,2}$", //日期
    email: "^\\w+((-\\w+)|(\\.\\w+))*\\@[A-Za-z0-9]+((\\.|-)[A-Za-z0-9]+)*\\.[A-Za-z0-9]+$", //邮件
    idcard: "^[1-9]([0-9]{14}|[0-9]{17})$", //身份证
    ip4: "^(25[0-5]|2[0-4]\\d|[0-1]\\d{2}|[1-9]?\\d)\\.(25[0-5]|2[0-4]\\d|[0-1]\\d{2}|[1-9]?\\d)\\.(25[0-5]|2[0-4]\\d|[0-1]\\d{2}|[1-9]?\\d)\\.(25[0-5]|2[0-4]\\d|[0-1]\\d{2}|[1-9]?\\d)$", //ip地址
    letter: "^[A-Za-z]+$", //字母
    letter_l: "^[a-z]+$", //小写字母
    letter_u: "^[A-Z]+$", //大写字母
    mobile: "^0?(13|15|17|18|14)[0-9]{9}$", //手机
    notempty: "^\\S+$", //非空
    password: "^.*[A-Za-z0-9\\w_-]+.*$", //密码
    fullNumber: "^[0-9]+$", //数字
    picture: "(.*)\\.(jpg|bmp|gif|ico|pcx|jpeg|tif|png|raw|tga)$", //图片
    qq: "^[1-9]*[1-9][0-9]*$", //QQ号码
    rar: "(.*)\\.(rar|zip|7zip|tgz)$", //压缩文件
    tel: "^[0-9\-()（）]{7,18}$", //电话号码的函数(包括验证国内区号,国际区号,分机号)
    url: "^http[s]?:\\/\\/([\\w-]+\\.)+[\\w-]+([\\w-./?%&=]*)?$", //url
    username: "^[A-Za-z0-9_\\-\\u4e00-\\u9fa5]+$", //户名
    deptname: "^[A-Za-z0-9_()（）\\-\\u4e00-\\u9fa5]+$", //单位名
    zipcode: "^\\d{6}$", //邮编
    realname: "^[A-Za-z\\u4e00-\\u9fa5]+$", // 真实姓名
    companyname: "^[A-Za-z0-9_()（）\\-\\u4e00-\\u9fa5]+$",
    companyaddr: "^[A-Za-z0-9_()（）\\#\\-\\u4e00-\\u9fa5]+$",
    companysite: "^http[s]?:\\/\\/([\\w-]+\\.)+[\\w-]+([\\w-./?%&#=]*)?$"
};

//验证规则
var validateRules = {
    isNull: function (str) {
        return (str == "" || typeof str != "string");
    },
    betweenLength: function (str, _min, _max) {
        return (str.length >= _min && str.length <= _max);
    },
    isUid: function (str) {
        return new RegExp(regexEnum.username).test(str);
    },
    isNum: function (str) {
        return new RegExp(regexEnum.fullNumber).test(str);
    },
    isQQ: function (str) {
        return new RegExp(regexEnum.qq).test(str);
    },
    fullNumberName: function (str) {
        return new RegExp(regexEnum.fullNumber).test(str);
    },
    isPwd: function (str) {
        return /^.*([\W_a-zA-z0-9-])+.*$/i.test(str);
    },
    isPwdRepeat: function (str1, str2) {
        return (str1 == str2);
    },
    isEmail: function (str) {
        return new RegExp(regexEnum.email).test(str);
    },
    isTel: function (str) {
        return new RegExp(regexEnum.tel).test(str);
    },
    isMobile: function (str) {
        return new RegExp(regexEnum.mobile).test(str);
    },
    checkType: function (element) {
        return (element.attr("type") == "checkbox" || element.attr("type") == "radio" || element.attr("rel") == "select");
    },
    isUrl:function (str) {
        return new RegExp(regexEnum.url).test(str);
    },
    isRealName: function (str) {
        return new RegExp(regexEnum.realname).test(str);
    },
    isCompanyname: function (str) {
        return new RegExp(regexEnum.companyname).test(str);
    },
    isCompanyaddr: function (str) {
        return new RegExp(regexEnum.companyaddr).test(str);
    },
    isCompanysite: function (str) {
        return new RegExp(regexEnum.companysite).test(str);
    },
    simplePwd: function (str) {
//        var pin = $("#regName").val();
//        if (pin.length > 0) {
//            pin = strTrim(pin);
//            if (pin == str) {
//                return true;
//            }
//        }
        return pwdLevel(str) == 1;
    },
    weakPwd: function (str) {
        for(var i = 0; i < weakPwdArray.length; i++) {
            if(weakPwdArray[i] == str) {
                return true;
            }
        }
        return false;
    }
};

$.ajaxSetup({
    dataType: "json",
    type: "POST",
    traditional: true,
    success: function (data) {
        if (app.ajaxHelper.handleAjaxMsg(data)) {
            try {
                $(this).dialog("close");
            } catch (e) {

            }
        }
    },
    error: function () {
        app.showError("糟糕，出错了");
        app.helper.unblockUI();
    },
    complete: function () {
    }
});

if(!app) var app = {};

app.showError = function (msg, options) {
    if($("#errorDialog").length<=0){
        $("body").append('<div style="display:none"><div id="errorDialog" class="comm-dialog"><div class="comm-dialog-detail"><span><i class="ico error-ico"></i><label id="errorMsg">'+msg+'</label></div> <div class="comm-dialog-foot"><a href="javascript:app.closeDialog()" class="btn-action" id="errorDialogButton">确定</a></div></div></div>');
    }else{
        $("#errorMsg").html(msg)
    }

    var fancyCartOptions ={
        overlayColor:"",
        closeClick  : false,
        autoDimensions:false,
        hideOnOverlayClick:false,
        padding:0,
        margin:0,
        width: 300,
        height: 130
    };
    $.fancybox($.extend({}, { href : "#errorDialog"}, fancyCartOptions, options));

    if(options && options.callback){
        $("#errorDialogButton").click(function(){
            options.callback();
        });
    }
};
app.showSuccess = function (msg, options) {
    if($("#succDialog").length<=0){
        $("body").append('<div style="display:none"><div id="succDialog" class="comm-dialog"><div class="comm-dialog-detail"><span><i class="ico succ-ico"></i><label id="successMsg">'+msg+'</label></div> <div class="comm-dialog-foot"><a href="javascript:app.closeDialog()" class="btn-action" id="successDialogButton">确定</a></div></div></div>');
    }else{
        $("#successMsg").html(msg)
    }

    var fancyCartOptions ={
        overlayColor:"",
        closeClick  : false,
        autoDimensions:false,
        hideOnOverlayClick:false,
        padding:0,
        margin:0,
        width: 300,
        height: 130
    };
    $.fancybox($.extend({}, {href : "#succDialog"}, fancyCartOptions, options));

    if(options && options.callback){
        $("#successDialogButton").click(function(){
            options.callback();
        });
    }
};

app.closeDialog = function(){
    $.fancybox.close();
}

app.openDialog = function(obj,options){
    var fancyCartOptions ={
        overlayColor:"",
        closeClick  : false,
        autoDimensions:false,
        hideOnOverlayClick:false,
        padding:0,
        margin:0,
        width: 450,
        height: 300
    };
    $.fancybox($.extend({}, {href : obj}, fancyCartOptions, options));
}

app.confirm = function (msg, options) {
    if ($("#confirmDialog").length <= 0) {
        $("body").append(' <div style="display:none"><div id="confirmDialog" class="comm-dialog"><div class="comm-dialog-detail"><span id="confirmMsg">' + msg + '</span></div><div class="comm-dialog-foot"><a href="javascript:app.closeDialog()" class="btn-action" id="confirmButton">确定</a><a href="javascript:app.closeDialog()" class="btn-action">取消</a> </div> </div> </div>');
    } else {
        $("#confirmMsg").html(msg);
    }

    var fancyCartOptions = {
        overlayColor: "",
        closeClick: false,
        autoDimensions: false,
        hideOnOverlayClick: false,
        padding: 0,
        margin: 0,
        width: 320,
        height: 170
    };
    $.fancybox($.extend({}, {href: "#confirmDialog"}, fancyCartOptions, options));

    if (options && options.callback) {
        $("#confirmButton").click(function () {
            options.callback();
        });
    }else{
        app.showError("你必须传入回调函数");
    }
};

app.helper = {
    mergeArray: function (array1, array2) {
        var array = new Array();
        if (typeof array1 != "undefined") {
            if ($.type(array1) == "array") {
                for (var i = 0; i < array1.length; i++) {
                    array.push(array1[i]);
                }
            } else array.push(array1);
        }
        if (typeof array2 != "undefined") {
            if ($.type(array2) == "array") {
                for (var i = 0; i < array2.length; i++) {
                    array.push(array2[i]);
                }
            } else array.push(array2);
        }
        return array;
    },
    removeArray: function (array, delObj) { //扩展Array.prototype与jquery冲突，故采用此法
        var index = -1;
        for (var i = 0; i < array.length; i++) {
            if (array[i] == delObj) {
                index = i;
            }
        }
        if (index > -1) {
            array.splice(index, 1);
        }
        return array;
    },
    getContextPath: function () {
        var contextPath = location.pathname;
        var index = contextPath.substr(1).indexOf("/");
        contextPath = contextPath.substr(0, index + 1);
        delete index;
        return contextPath;
    },
    getFullContextPath: function () {
        var contextPath = app.helper.getContextPath();
        return location.protocol + "//" + location.host + contextPath;
    },
    getWebUrlPrefix: function () {
        return location.protocol + "//" + location.host;
    },
    safeRender: function (s) {
        return (s && s != "" && s != '_NA_') ? s : "";
    },
    download: function (url) {
        var downloadIframe = $("#downloadIframe");
        var downloadForm = $("#downloadForm");
        if (downloadIframe.size() <= 0) {
            $('<iframe name="downloadIframe" id="downloadIframe" width="0" height="0" frameborder="0" marginheight="0" marginwidth="0" hspace="0" allowtransparency="true" scrolling="no" vspace="0"></iframe>').appendTo("body");
        }
        if (downloadForm.size() <= 0) {
            $('<form id="downloadForm" target="downloadIframe" action="" method="post"></form>').appendTo("body");
        }
        $("#downloadForm").attr("action", url).submit();
    },
    loadStatus: function (id, status, defaultValue) {
        var e = $("#" + id);
        if (e.size() > 0) {
            e.empty();
            $("<option value=''>请选择</option>").appendTo(e);
            for (var s in status) {
                var str = "<option value='" + s + "' ";
                if (defaultValue && defaultValue == s) str += "selected";
                ;
                str += ">" + status[s] + "</option>";
                $(str).appendTo(e);
            }
        }
    },
    calculateJsonMapSize: function(jsonMap) {
        if (!jsonMap) {
            return 0;
        }
        var count = 0;
        for (var s in jsonMap) {
            count++;
        }
        return count;
    },
    addFavorite: function (url, title) {
        if (url == null || url == '') {
            url = window.location.href;
        }
        if (title == null || title == '') {
            title = document.title;
        }
        if (window.sidebar && window.sidebar.addPanel) { // Mozilla Firefox Bookmark
            window.sidebar.addPanel(title, url, '');
        } else if (window.external && window.external.AddFavorite) { // IE Favorite
            window.external.AddFavorite(url, title);
        } else if (window.opera && window.print) { // Opera Hotlist
            this.title = title;
            return true;
        } else { // webkit - safari/chrome
            alert('请按 ' + (navigator.userAgent.toLowerCase().indexOf('mac') != -1 ? 'Command/Cmd' : 'CTRL') + ' + D 来收藏.');
        }
    },
    parseInt: function (value) {
        return parseInt(value.replace(/,/g, ""));
    },
    parseFloat: function (value) {
        return parseFloat(value.replace(/,/g, ""));
    },
    onlyAllowNumberEvent: function (inputElementObj) {
        //限制用户输入除0-9的其他字符
        inputElementObj.keydown(function (e) {
            return document.all ? ((e.keyCode > 47) && (e.keyCode < 58) || e.keyCode == 8) : ((e.which > 47) && (e.which < 58) || e.which == 8);
        }).focus(function () {
            this.style.imeMode = 'disabled';   // 禁用输入法,禁止输入中文字符
        });
    },
    blockUI: function () {
        showBlockUI();
        return false;
    },
    unblockUI: function () {
        $.unblockUI();
        return false;
    },
    getCheckboxValues: function (checkboxName) {
        var checkedValues = [];
        $('input[name="' + checkboxName + '"]:checked').each(function () {
            checkedValues.push($(this).val());
        });
        return checkedValues;
    },
    getRadioValue: function (radioName) {
        return $("input[name='"+radioName+"']:checked").val();
    },
    queryStringToJSON: function (queryString) {
        var pairs = location.search.slice(1).split('&');
        //var pairs = [];
        /*if (queryString.indexOf("?") >= 0) {
         pairs = queryString.split('?')[1].split('&');
         } else {
         pairs = queryString.split('&');
         }*/
        var result = {};
        pairs.forEach(function (pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });
        return JSON.parse(JSON.stringify(result));
    },
    getIframeById: function (idIframe) {
        return window.document.getElementById(idIframe) || window.document.frames[idIframe];
    },
    getIframeDoc: function (idIframe) {
        return getIframeById(idIframe).contentDocument || getIframeById(idIframe).document;
    }
};

app.dateTime={
    formatDate: function (dateString, pattern) {
        var date;
        if (dateString) date = new Date(dateString);
        else return "";
        return date.pattern(pattern ? pattern : 'yyyy-MM-dd');
    },
    formatCurrentDate: function (pattern) {
        var date = new Date();
        return date.pattern(pattern ? pattern : 'yyyy-MM-dd');
    },
    nowAsString: function(){
        return new Date().getTime();
    },
    getMonthStartDate:function(){
        var date = new Date()
        with (date) {
            year = date.getYear() + 1900;
            month = date.getMonth() + 1;
        }
        return monthStartDate = year + "-" + month + "-1";
    },
    getMonthEndDate:function(){
        var dt = new Date();
        dt.setDate(1);
        dt.setMonth(dt.getMonth()+1);
        cdt = new Date(dt.getTime()-1000*60*60*24);
        return monthEndDate = cdt.getFullYear() + "-" + (Number(cdt.getMonth())+1) + "-"+cdt.getDate();
    }
}

app.CascadeSelect= function(options){
    this.settings={};
    this.data=[];
    this.dataMap={};
    this.elements=null;
    this.uiIds=[];
    this.defaultOptions={
        nameKey:"name",
        valueKey:"id",
        childsKey:"childs"
    };
    this.init=function(options){
        var this_ = this;
        this.settings = $.extend({},this.defaultOptions,options);
        this.data = this.settings.data || [];
        this.uiIds = this.settings.uiIds || [];
        this.elements = new Array(this.uiIds.length);
        for(var i=0;i<this.uiIds.length;i++){
            var e = $("#"+this.uiIds[i]+":first");
            if(!e || e.size() == 0){
                app.showError({messages:["元素"+this.uiIds[i]+"不是下拉框！"]});
                return;
            }
            e.empty();
            $("<option value=''>请选择</option>").appendTo(e);
            e.change(function(){
                this_.clearSub(this.id);
                this_.updateSub(this.id);
            });
            this.elements[i] = e;
        }

        this.loadData2UI(0);

        if(this.settings.defaultValues){
            for(var i=0;i<this.settings.defaultValues.length;i++){
                //TODO ie下有问题
                this.elements[i].val(this.settings.defaultValues[i]).change();
            }
        }
    };
    this.loadData2UI=function(uiIndex){
        if(uiIndex+1>this.uiIds.length) return;
        var index = uiIndex || 0;
        var data = (index>0)?this.dataMap[this.uiIds[index-1]+this.elements[index-1].val()]:this.data;
        if(!data) return;
        var e = this.elements[uiIndex];
        e.empty();
        $("<option value=''>请选择</option>").appendTo(e);
        for(var i=0;i<data.length;i++){
            var key = data[i][this.settings.nameKey];
            var value = data[i][this.settings.valueKey];
            $("<option value='" + value + "'>" + key + "</option>").appendTo(e);
            this.dataMap[this.uiIds[uiIndex]+value]=data[i][this.settings.childsKey];
        }
    };
    this.updateSub=function(id){
        var index = this.uiIds.indexOf(id);
        this.loadData2UI(index+1);
    };
    this.clearSub=function(id){
        var index = this.uiIds.indexOf(id)+1;
        for(;index<this.uiIds.length;index++){
            var e = this.elements[index];
            e.empty();
            $("<option value=''>请选择</option>").appendTo(e);
        }
    }
    this.init(options);
};

app.geoHelper = {
    getGeoName: function(geoId){
        if(typeof geoDataMap == "undefined"){
            alert("未装载geo数据！");
            return "";
        }
        if(typeof geoId  == "undefined" || !geoId){
            alert("未指定geoId！");
            return "";
        }

        return geoDataMap[geoId];
    },
    checkRequired: function(uiId){
        var geoLength = $("#"+uiId+" option").length;
        var geoValue = $("#"+uiId).val();

        if (geoLength > 1 && app.validator.isEmpty(geoValue)) return false;
        return true;
    }
};
app.ajaxHelper = {
    defaultSettings: {
        data: {},
        loadingMask: true
    },
    success: function (data, textStatus, jqXHR, options) {
        var settings = $.extend({}, options);
        //do some thing
    },
    // isUnblockUI：如果传入false，loading效果就不关闭，不传或者传入true，则关闭；在某些情况下如果不想关闭loading，可以传入该参数
    handleAjaxMsg: function (d, isUnblockUI) {
        isUnblockUI = isUnblockUI || true;
        if(isUnblockUI) {
            app.helper.unblockUI();
        }
        if (d.result == "error") {
            app.helper.unblockUI();
            app.showError(d.message);
            return false;
        }else if (d.result == "noSession") {
            app.helper.unblockUI();
            app.confirm("亲爱的用户，您未登录，请登录后操作",{
                callback:function(){
                    window.location.href = "/mp/control/login?psid="+ d.productStoreId;
                }
            });
            return false;
        }
        return true;
    },
    submitRequest: function (options) {
        var settings = $.extend(true, {}, this.defaultSettings, options);
        if (!settings.url) {
            alert("缺少url参数");
            return false;
        }
        if(settings.loadingMask) showBlockUI();
        $.ajax(settings.url, {
            data: settings.data,
            success: settings.success,
            error: settings.error
        });
    },
    confirm: function (options) {
        var settings = $.extend(true, {}, options);
        if (!settings.url) {
            alert("缺少url参数");
            return false;
        }
        var sure = function () {
            $.ajax(settings.url, {
                data: settings.data,
                success: function (d) {
                    if (app.ajaxHelper.handleAjaxMsg(d)) {
                        if (settings.success) settings.success();
                    }
                }
            });
        };
        app.confirm({
            message: settings.message,
            sure: sure
        });
        return false;
    },
    isSuccess: function(d) {
        if (d.result == "error") {
            return false;
        }else if (d.result == "noSession") {
            return false;
        }
        return true;
    },
    getErrorMessage:function(d) {
        return d.message;
    },
    getEventMessage:function(d) {
        if(this.isSuccess(d)){
            if(d.data && d.data._EVENT_MESSAGE_LIST_){
                return d.data._EVENT_MESSAGE_LIST_[0];
            }
        }
        return "";
    }
};

app.validator = {
    isEmpty: function(value){
        if(value==undefined || value==""){
            return true;
        }
        var val = value.replace(/^[ \s]+/, "").replace(/[ \s]+$/, "");
        return val == "";
    },
    regexValid: function(value, regexName) {
        var regex = eval("regexEnum." + regexName);
        if(regex==undefined || regex==""){
            return false;
        }
        return (new RegExp(regex, "g")).test(value);
    },
    //短时间，形如 (13:04:06)
    isTime: function (str) {
        var a = str.match(/^(\d{1,2})(:)?(\d{1,2})\2(\d{1,2})$/);
        if (a == null) {
            return false
        }
        if (a[1] > 24 || a[3] > 60 || a[4] > 60) {
            return false;
        }
        return true;
    },
    //短日期，形如 (2003-12-05)
    isDate: function (str) {
        var r = str.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
        if (r == null)return false;
        var d = new Date(r[1], r[3] - 1, r[4]);
        return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4]);
    },
    //长时间，形如 (2003-12-05 13:04:06)
    isDateTime: function (str) {
        var reg = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
        var r = str.match(reg);
        if (r == null) return false;
        var d = new Date(r[1], r[3] - 1, r[4], r[5], r[6], r[7]);
        return (d.getFullYear() == r[1] && (d.getMonth() + 1) == r[3] && d.getDate() == r[4] && d.getHours() == r[5] && d.getMinutes() == r[6] && d.getSeconds() == r[7]);
    },
    isNumber: function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
}


app.upload = function (settings) {
    this.init(settings);
};
app.upload.prototype.init = function(settings){
    this.settings = $.extend({}, this.defaultSettings, settings);
    this.swfu = new SWFUpload(this.settings);
}

app.upload.prototype.handleUploadSuccess = function (file, serverData, callback) {
    try {
        var progress = new FileProgress(file, this.swfu.customSettings.progressTarget);
        progress.setComplete();
        progress.setStatus("上传完成。");
        progress.toggleCancel(false);

        var jsonData = eval("(" + serverData + ")");
        if(app.ajaxHelper.handleAjaxMsg(jsonData)){
            if(callback){
                callback(jsonData);
            }
        }

    } catch (ex) {
        this.debug(ex);
    }
    return false;
}

app.upload.prototype.defaultSettings = {
    flash_url: "/ext/assets/swfupload/2.5.0/swfupload.swf",
    flash9_url: "/ext/assets/swfupload/2.5.0/swfupload_fp9.swf",
    upload_url: "/ext/control/omUploadFile",
    file_size_limit: "10 MB",
    file_types: "*.jpg;*.png;*.gif;*.jpeg;*.bmp",
    file_types_description: "图片",
    file_upload_limit : 0,     //限定用户一次性最多上传多少个文件，在上传过程中，该数字会累加，如果设置为“0”，则表示没有限制
    file_queue_limit : 1, //上传队列数量限制，该项通常不需设置，会根据file_upload_limit自动赋值
    custom_settings: {
        //progressTarget: "fsUploadProgress"
        //,cancelButtonId: "btnCancel"
    },
    debug: false,

    // Button settings
    button_image_url: "/ext/assets/swfupload/2.5.0/TestImageNoText_65x29.png",
    button_width: "80",
    button_height: "29",
    button_placeholder_id: "spanButtonPlaceHolder",
    button_text: '<span>选择文件</span>',
    button_text_left_padding: 12,
    button_text_top_padding: 7,

    // The event handler functions are defined in handlers.js
    swfupload_preload_handler: function () {
        if (!this.support.loading) {
            alert("需安装Flash Player 9.028以上才能使用文件上传。");
            return false;
        }
    },
    swfupload_load_failed_handler: function () {
        alert("Something went wrong while loading SWFUpload. If this were a real application we'd clean up and then give you an alternative");
    },
    file_queued_handler : function(file) {
        try {
            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setStatus("等待中...");
            progress.toggleCancel(true, this);

        } catch (ex) {
            this.debug(ex);
        }

    },
    file_queue_error_handler : function(file, errorCode, message) {
        try {
            if (errorCode === SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED) {
                var m = parseInt(message);
                alert("文件数量超过限制。\n" + (m === 0 ? "上传文件数量到达上限。" : "最多只能再上传" + (m > 1 ? "" + m + "个文件。" : "1个文件")));
                return;
            }

            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setError();
            progress.toggleCancel(false);

            switch (errorCode) {
                case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT:
                    progress.setStatus("文件超过"+this.settings.file_size_limit+"。");
                    this.debug("Error Code: File too big, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE:
                    progress.setStatus("文件大小为0，不能上传。");
                    this.debug("Error Code: Zero byte file, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.QUEUE_ERROR.INVALID_FILETYPE:
                    progress.setStatus("无效的文件类型。");
                    this.debug("Error Code: Invalid File Type, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                default:
                    if (file !== null) {
                        progress.setStatus("Unhandled Error");
                    }
                    this.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
            }
        } catch (ex) {
            this.debug(ex);
        }
    },
    file_dialog_complete_handler: function (numFilesSelected, numFilesQueued) {
        try {
            if (numFilesSelected > 0 && this.customSettings.cancelButtonId) {
                document.getElementById(this.customSettings.cancelButtonId).disabled = false;
            }

            /* I want auto start the upload and I can do that here */
            this.startUpload();
        } catch (ex) {
            this.debug(ex);
        }
    },
    upload_start_handler: function (file) {
        try {
            /* I don't want to do any file validation or anything,  I'll just update the UI and
             return true to indicate that the upload should start.
             It's important to update the UI here because in Linux no uploadProgress events are called. The best
             we can do is say we are uploading.
             */
            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setStatus("上传中...");
            progress.toggleCancel(true, this);
        }
        catch (ex) {
        }

        return true;
    },
    upload_progress_handler: function (file, bytesLoaded, bytesTotal) {
        try {
            var percent = Math.ceil((bytesLoaded / bytesTotal) * 100);

            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setProgress(percent);
            progress.setStatus("上传中...");
        } catch (ex) {
            this.debug(ex);
        }
    },
    upload_error_handler: function (file, errorCode, message) {
        try {
            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setError();
            progress.toggleCancel(false);

            switch (errorCode) {
                case SWFUpload.UPLOAD_ERROR.HTTP_ERROR:
                    progress.setStatus("上传错误: " + message);
                    this.debug("Error Code: HTTP Error, File name: " + file.name + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_FAILED:
                    progress.setStatus("上传失败。");
                    this.debug("Error Code: Upload Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.IO_ERROR:
                    progress.setStatus("服务器(IO)错误。");
                    this.debug("Error Code: IO Error, File name: " + file.name + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.SECURITY_ERROR:
                    progress.setStatus("安全错误。");
                    this.debug("Error Code: Security Error, File name: " + file.name + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED:
                    progress.setStatus("上传超过限制。");
                    this.debug("Error Code: Upload Limit Exceeded, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.FILE_VALIDATION_FAILED:
                    progress.setStatus("验证失败，上传已跳过。");
                    this.debug("Error Code: File Validation Failed, File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
                case SWFUpload.UPLOAD_ERROR.FILE_CANCELLED:
                    // If there aren't any files left (they were all cancelled) disable the cancel button
                    if (this.getStats().files_queued === 0 && this.customSettings.cancelButtonId) {
                        document.getElementById(this.customSettings.cancelButtonId).disabled = true;
                    }
                    progress.setStatus("已取消。");
                    progress.setCancelled();
                    break;
                case SWFUpload.UPLOAD_ERROR.UPLOAD_STOPPED:
                    progress.setStatus("已停止。");
                    break;
                default:
                    progress.setStatus("Unhandled Error: " + errorCode);
                    this.debug("Error Code: " + errorCode + ", File name: " + file.name + ", File size: " + file.size + ", Message: " + message);
                    break;
            }
        } catch (ex) {
            this.debug(ex);
        }
    },
    upload_success_handler: function (file, serverData) {
        try {
            var progress = new FileProgress(file, this.customSettings.progressTarget);
            progress.setComplete();
            progress.setStatus("上传完成");
            progress.toggleCancel(false);

            var jsonData = eval("(" + serverData + ")");
            if(app.ajaxHelper.handleAjaxMsg(jsonData)){
                if(this.settings.success){
                    this.settings.success(jsonData);
                }
            }
        } catch (ex) {
            this.debug(ex);
        }
        return false;
    },
    upload_complete_handler: function (file) {
        if (this.getStats().files_queued === 0) {
            if(this.customSettings.cancelButtonId){
                document.getElementById(this.customSettings.cancelButtonId).disabled = true;
            }
        }
    },
    queue_complete_handler : function(numFilesUploaded) {
        try {
            var status = document.getElementById("divStatus");
            status.innerHTML = numFilesUploaded + "个文件上传完成";
        } catch(e){

        }
    }
}
/*
app.ueditorHelper = {
    initEditor: function (options, operating) {
        var editorContainerId = options.editorContainerId;
        var setting = {
            // toolbars:[["fullscreen","fontfamily","fontsize","source","background","justifyleft","justifycenter","justifyright","justifyjustify","|","source","bold","italic","underline","|","insertorderedlist","insertunorderedlist","|","insertimage","|",'removeformat','forecolor','backcolor',"insertvideo","|",'emotion']],
            toolbars:[
                [
                    "source", "|", "undo", "redo", "|", "bold", "italic", "underline", "strikethrough" ,"|", "superscript", "subscript", "|", "forecolor", "backcolor", "|", "removeformat","|",
                    "insertorderedlist", "insertunorderedlist", "|", "selectall", "cleardoc", "paragraph", "|", "fontfamily", "fontsize" ,
                    "|", "justifyleft", "justifycenter", "justifyright", "justifyjustify", "|",
                    "link", "unlink", "|", "emotion", "insertimage", "insertvideo", "|", "map", "insertvote","defineform",//添加一个投票按钮
                    "|", "horizontal", "preview", "fullscreen"
                ]
            ],
            //投票按钮鼠标移动到上面的时候的提示信息
            labelMap: {'insertvote': '投票添加','defineform': '万能表单'},
            initialFrameWidth: 700,
            initialFrameHeight: 200
        };

        var setting = $.extend({}, setting, options);
        var ue = UE.getEditor(editorContainerId, setting);
        //为投票添加使用页面的回调
        if (operating.vote) {
            UE.dialogShow = operating.vote;
        }else if(operating.defineForm){
            UE.dialogShowForDefineForm = operating.defineForm;
        }
        return ue;
    }
};*/


/*
 * MAP对象，实现MAP功能
 *
 * 接口：
 * size()     获取MAP元素个数
 * isEmpty()    判断MAP是否为空
 * clear()     删除MAP所有元素
 * put(key, value)   向MAP中增加元素（key, value)
 * remove(key)    删除指定KEY的元素，成功返回True，失败返回False
 * get(key)    获取指定KEY的元素值VALUE，失败返回NULL
 * element(index)   获取指定索引的元素（使用element.key，element.value获取KEY和VALUE），失败返回NULL
 * containsKey(key)  判断MAP中是否含有指定KEY的元素
 * containsValue(value) 判断MAP中是否含有指定VALUE的元素
 * values()    获取MAP中所有VALUE的数组（ARRAY）
 * keys()     获取MAP中所有KEY的数组（ARRAY）
 *
 * 例子：
 * var map = new Map();
 *
 * map.put("key", "value");
 * var val = map.get("key")
 * ……
 *
 */
function Map() {
    this.elements = new Array();

    //获取MAP元素个数
    this.size = function() {
        return this.elements.length;
    }

    //判断MAP是否为空
    this.isEmpty = function() {
        return(this.elements.length < 1);
    }

    //删除MAP所有元素
    this.clear = function() {
        this.elements = new Array();
    }

    //向MAP中增加元素（key, value)
    this.put = function(_key, _value) {
        this.remove(_key);
        this.elements.push( {
            key : _key,
            value : _value
        });
    }

    //删除指定KEY的元素，成功返回True，失败返回False
    this.remove = function(_key) {
        var bln = false;
        try{
            for(i = 0; i < this.elements.length; i++) {
                if(this.elements[i].key == _key) {
                    this.elements.splice(i, 1);
                    return true;
                }
            }
        } catch(e) {
            bln = false;
        }
        return bln;
    }

    //获取指定KEY的元素值VALUE，失败返回NULL
    this.get = function(_key) {
        try{
            for(i = 0; i < this.elements.length; i++) {
                if(this.elements[i].key == _key) {
                    return this.elements[i].value;
                }
            }
        } catch(e) {
            return null;
        }
    }

    //获取指定索引的元素（使用element.key，element.value获取KEY和VALUE），失败返回NULL
    this.element = function(_index) {
        if(_index < 0 || _index >= this.elements.length) {
            return null;
        }
        return this.elements[_index];
    }

    //判断MAP中是否含有指定KEY的元素
    this.containsKey = function(_key) {
        var bln = false;
        try{
            for(i = 0; i < this.elements.length; i++) {
                if(this.elements[i].key == _key) {
                    bln = true;
                }
            }
        } catch(e) {
            bln = false;
        }
        return bln;
    }

    //判断MAP中是否含有指定VALUE的元素
    this.containsValue = function(_value) {
        var bln = false;
        try{
            for(i = 0; i < this.elements.length; i++) {
                if(this.elements[i].value == _value) {
                    bln = true;
                }
            }
        } catch(e) {
            bln = false;
        }
        return bln;
    }

    //获取MAP中所有VALUE的数组（ARRAY）
    this.values = function() {
        var arr = new Array();
        for(i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].value);
        }
        return arr;
    }

    //获取MAP中所有KEY的数组（ARRAY）
    this.keys = function() {
        var arr = new Array();
        for(i = 0; i < this.elements.length; i++) {
            arr.push(this.elements[i].key);
        }
        return arr;
    }
};


//扩展jquey Jquery 将表单序列化为Json对象
(
    function($){
        $.fn.serializeJson=function(){
            var serializeObj={};
            var array=this.serializeArray();
            var str=this.serialize();
            $(array).each(function(){
                if(serializeObj[this.name]){
                    if($.isArray(serializeObj[this.name])){
                        serializeObj[this.name].push(this.value);
                    }else{
                        serializeObj[this.name]=[serializeObj[this.name],this.value];
                    }
                }else{
                    serializeObj[this.name]=this.value;
                }
            });
            return serializeObj;
        };
    }
    )(jQuery);

if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match
        })
    }
};

//扩充日期Date对象Format方法
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//javascript的base64加密解密功能，因为我在ueditor点击投票按钮填写完投票信息的时候是用json把数据回传到使用页面的，
//由于ueditor对json可能是有过滤或者bug，在保存后取出ueditor数据时会造成json数据缺失的情况，所以需要进行json转换加密，然后再进行解密，
var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, 62, -1, -1, -1, 63,52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1,
        0,  1,2,3, 4,5,6,7,8,9, 10, 11, 12, 13, 14,15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1,
        -1, -1, -1,-1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
    )
    ;
function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += base64EncodeChars.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}
function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        /* c1 */
        do {
            c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c1 == -1);
        if (c1 == -1)
            break;
        /* c2 */
        do {
            c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c2 == -1);
        if (c2 == -1)
            break;
        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
        /* c3 */
        do {
            c3 = str.charCodeAt(i++) & 0xff;
            if (c3 == 61)
                return out;
            c3 = base64DecodeChars[c3];
        } while (i < len && c3 == -1);
        if (c3 == -1)
            break;
        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
        /* c4 */
        do {
            c4 = str.charCodeAt(i++) & 0xff;
            if (c4 == 61)
                return out;
            c4 = base64DecodeChars[c4];
        } while (i < len && c4 == -1);
        if (c4 == -1)
            break;
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
}
function utf16to8(str) {
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            out += str.charAt(i);
        } else if (c > 0x07FF) {
            out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
            out += String.fromCharCode(0x80 | ((c >> 6
                ) &
                0x3F
                ))
            ;
            out += String.fromCharCode(0x80 | ((c >> 0
                ) &
                0x3F
                ))
            ;
        } else {
            out += String.fromCharCode(0xC0 | ((c >> 6
                ) &
                0x1F
                ))
            ;
            out += String.fromCharCode(0x80 | ((c >> 0
                ) &
                0x3F
                ))
            ;
        }
    }
    return out;
}
function utf8to16(str) {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
        c = str.charCodeAt(i++);
        switch (c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                out += str.charAt(i - 1);
                break;
            case 12:
            case 13:
                char2 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                char2 = str.charCodeAt(i++);
                char3 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0)
                );
                break;
        }
    }
    return out;
}

app.uploadHelper = {
    singleUploader: function (options) {
        var singleUploaderOption = {
            BeforeUploadCallBack: function () {

                $("#progressBarBox").show();
            },
            UploadProgressCallBack: function (pluploader, up, file) {
                $('.progress-box .prog-w').css("width", file.percent + "%");
                $('.progress-box .prog-val').html(file.percent + "%");
            },
            UploadCompleteCallBack: function () {

                $("#progressBarBox").hide();
            }
        }

        $.extend(options, singleUploaderOption);

        this.pluploader(options);
    },

    multiUploader: function (options) {
        $.extend(options, {multipart: true});

        this.pluploader(options);
    },

    pluploader: function (options) {
        if (!options.uploadButtonId) throw '(需要制定组件的id)uploadButtonId is required!';
        if (!options.sign) throw 'sign is required!';
        var qiniuIsOpen = options.qiniuIsOpen || app.config.qiniuIsOpen;  //thirdparty local
        var fileType = options.fileType || "image";
        var fileSizeLimit = options.fileSizeLimit || '3mb';
        var sign = options.sign;
        var multipart = options.multipart || true;

        var btnText = options.btnText || "选择文件";

        var filterRule = {};

        if ("image" == fileType) {
            filterRule = {
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png,ico',
                mimeTypes: 'image/*'
            }
        } else if ("audio" == fileType) {
            filterRule = {
                title: 'Images',
                extensions: 'mp3,AIF,RM,WMV',
                mimeTypes: 'audio/*'
            }
        } else if ("androidApp" == fileType) {
            filterRule = {
                title: 'apps',
                extensions: 'apk',
                mimeTypes: 'audio/*'
            }
        } else if ("iosApp" == fileType) {
            filterRule = {
                title: 'apps',
                extensions: 'ipa',
                mimeTypes: 'audio/*'
            }
        }

        var uploader = UPLOADER.uploader({
            qiniuIsOpen: qiniuIsOpen,
            fileKeyFrom: options.fileKeyFrom,
            fileType: fileType,
            sign: sign,
            isConfigReturnUrl: false,//配置了重定向 需要处理303
            runtimes: 'html5,flash,html4',
            browse_button: options.uploadButtonId,
//          container: 'container',
//          drop_element: 'container',
            max_file_size: fileSizeLimit,
            flash_swf_url: 'js/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            'multipart': multipart,
            uptoken_url: '/tp/control/generateUploadToken',
            domain: app.config.imageHomeUrl,
            auto_start: true,
            filters: [
                filterRule
            ],
            init: {
                'FilesAdded': function (up, files) {

                    if (options.FilesAddedCallBack)
                        options.FilesAddedCallBack(up, files);
                },
                'BeforeUpload': function (up, file) {
                    if (options.BeforeUploadCallBack)
                        options.BeforeUploadCallBack(this, up, file);
                },
                'UploadProgress': function (up, file) {
                    if (options.UploadProgressCallBack)
                        options.UploadProgressCallBack(this, up, file);
                },
                'UploadComplete': function () {
                    if (options.UploadCompleteCallBack)
                        options.UploadCompleteCallBack();
                },
                'FileUploaded': function (up, file, info) {
                    if (options.FileUploadedCallBack)
                        options.FileUploadedCallBack(up, file, info);

                    var res = $.parseJSON(info);
                    var fileName;
                    var fileUrl;

                    if ("Y" == qiniuIsOpen) {
                        fileUrl = up.getOption('domain') + res.key;
                        fileName = res.key;
                    } else {
                        var data = res.data;

                        fileUrl = data[0].fileUrl;
                        fileName = data[0].fileName;
                    }

                    $.extend(res, {fileUrl: fileUrl, fileName: fileName});

                    var file = res;

                    if (options && options.callback) {
                        options.callback(file.fileUrl, file.fileName, file.imageWidth, file.imageHeight);
                    }

                    var showFileUrlId = options.showFileUrlId;
                    var hiddenFileInputUrlId = options.showFileNameId;

                    if (fileType == "image" && showFileUrlId != "") {
                        $('#' + showFileUrlId).attr("src", file.fileUrl).show();
                    }
                    if (fileType == "audio" && showFileUrlId != "") {
                        $('#' + showFileUrlId).attr("href", file.fileUrl);
                    }
                    if (hiddenFileInputUrlId != "") {
                        $('#' + hiddenFileInputUrlId).val(file.fileName);
                    }

                }
            }
        });

        uploader.bind('FileUploaded', function () {

        });

    }
}

app.page = {
    reload: function () {
        location.reload();
    },
    open: function (options) {
        if(!options.href){
            app.showError("未传入跳转地址");
        }
        location.href = options.href;
    }
}


app.currency = {
    regions: {},
    defaults: {
        name: "formatCurrency",
        colorize: false,
        region: 'zh-CN',
        global: true,
        roundToDecimalPlace: 2, // roundToDecimalPlace: -1; for no rounding; 0 to round to the dollar; 1 for one digit cents; 2 for two digit cents; 3 for three digit cents; ...
        eventOnDecimalsEntered: false
    },
    formatCurrency:function(num, settings){
        // initialize default region
        defaultSettings = $.extend({}, this.defaults, this.regions['']);
        // override defaults with settings passed in
        settings = $.extend(defaultSettings, settings);

        // check for region setting
        if (settings.region.length > 0) {
            settings = $.extend(settings, this.getRegionOrCulture(settings.region));
        }
        settings.regex = this.generateRegex(settings);

        num = String(num)
        //identify '(123)' as a negative number
        if (num.search('\\(') >= 0) {
            num = '-' + num;
        }

        if (num === '') {
            num = '0';
        }

        if (num === '-' && settings.roundToDecimalPlace === -1) {
            return;
        }

        // if the number is valid use it, otherwise clean it
        if (isNaN(num)) {
            // clean number
            num = num.replace(settings.regex, '');

            if (num === '' || (num === '-' && settings.roundToDecimalPlace === -1)) {
                return;
            }

            if (settings.decimalSymbol != '.') {
                num = num.replace(settings.decimalSymbol, '.');  // reset to US decimal for arithmetic
            }
            if (isNaN(num)) {
                num = '0';
            }
        }

        // evalutate number input
        var numParts = String(num).split('.');
        var isPositive = (num == Math.abs(num));
        var hasDecimals = (numParts.length > 1);
        var decimals = (hasDecimals ? numParts[1].toString() : '0');
        var originalDecimals = decimals;

        // format number
        num = Math.abs(numParts[0]);
        num = isNaN(num) ? 0 : num;
        if (settings.roundToDecimalPlace >= 0) {
            decimals = parseFloat('1.' + decimals); // prepend "0."; (IE does NOT round 0.50.toFixed(0) up, but (1+0.50).toFixed(0)-1
            decimals = decimals.toFixed(settings.roundToDecimalPlace); // round
            if (decimals.substring(0, 1) == '2') {
                num = Number(num) + 1;
            }
            decimals = decimals.substring(2); // remove "0."
        }
        num = String(num);

        if (settings.groupDigits) {
            for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
                num = num.substring(0, num.length - (4 * i + 3)) + settings.digitGroupSymbol + num.substring(num.length - (4 * i + 3));
            }
        }

        if ((hasDecimals && settings.roundToDecimalPlace == -1) || settings.roundToDecimalPlace > 0) {
            num += settings.decimalSymbol + decimals;
        }

        // format symbol/negative
        var format = isPositive ? settings.positiveFormat : settings.negativeFormat;
        var money = format.replace(/%s/g, settings.symbol);
        money = money.replace(/%n/g, num);
        return money;
    },
    getRegionOrCulture: function(region) {
        var regionInfo = this.regions[region];
        if (regionInfo) {
            return regionInfo;
        }
        else {
            if (/(\w+)-(\w+)/g.test(region)) {
                var culture = region.replace(/(\w+)-(\w+)/g, "$1");
                return this.regions[culture];
            }
        }
        // fallback to extend(null) (i.e. nothing)
        return null;
    },
    generateRegex: function(settings) {
        if (settings.symbol === '') {
            return new RegExp("[^\\d" + settings.decimalSymbol + "-]", "g");
        }
        else {
            var symbol = settings.symbol.replace('$', '\\$').replace('.', '\\.');
            return new RegExp(symbol + "|[^\\d" + settings.decimalSymbol + "-]", "g");
        }
    }
}
app.currency.regions['zh-CN'] = {
    symbol: '￥',
    positiveFormat: '%s%n',
    negativeFormat: '%s-%n',
    decimalSymbol: '.',
    digitGroupSymbol: ',',
    groupDigits: true
}

app.input = {
    onlyNumber:function clearNoNum(obj){
        //先把非数字的都替换掉，除了数字和.
        obj.value = obj.value.replace(/[^\d.]/g,"");
        //必须保证第一个为数字而不是.
        obj.value = obj.value.replace(/^\./g,"");
        //保证只有出现一个.而没有多个.
        obj.value = obj.value.replace(/\.{2,}/g,".");
        //保证.只出现一次，而不能出现两次以上
        obj.value = obj.value.replace(".","$#$").replace(/\./g,"").replace("$#$",".");
        if (obj.value.toString().split(".").length > 1 && obj.value.toString().split(".")[1].length > 2) {
            //alert("小数点后多于两位！");
        }
    }
}
/**
 * 商城上的在线反馈，在使用的地方直接调用
 * onclick="return app.decoration.openFeedbackDialog(this)"
 * @type {{openFeedbackDialog: openFeedbackDialog}}
 */
app.decoration = {
    openFeedbackDialog: function(obj){
        app.openDialog("#feedbackDialog",{
            width: 500,
            height:330
        })
    }
}

/**
 *页面探测器
 */
app.pageDetector = {
    isIOS: function() {
        if (/(iPhone|iPad|iPod)/i.test(navigator.userAgent)) return true;
        return false;
    },
    isAndroid: function() {
        if (/Android/i.test(navigator.userAgent)) return true;
        return false;
    },
    isWeixin: function() {
        if (/MicroMessenger/i.test(navigator.userAgent)) return true;
        return false;
    }
};

app.dateTime = {
    format: function (d, pattern) {
        var date;
        if (!d) return "";
        if (typeof d == "string") {
            date = new Date(d);
        } else {
            date = d;
        }
        return date.pattern(pattern ? pattern : 'yyyy-MM-dd HH:mm:ss');
    },
    formatDate: function (date) {
        return app.dateTime.format(date, "yyyy-MM-dd");
    },
    formatTime: function (date) {
        return app.dateTime.format(date, "HH:mm:ss");
    },
    formatCurrentDate: function (pattern) {
        var date = new Date();
        return app.dateTime.format(date, pattern);
    },
    formatCurrentTime: function (pattern) {
        var date = new Date();
        return app.dateTime.format(date, pattern || "HH:mm:ss");
    },
    formatCurrentDateTime: function (pattern) {
        var date = new Date();
        return app.dateTime.format(date, pattern || "yyyy-MM-dd HH:mm:ss");
    },
    nowAsString: function () {
        return new Date().getTime();
    },
    getMonthStartDate: function () {
        var date = new Date()
        with (date) {
            year = date.getYear() + 1900;
            month = date.getMonth() + 1;
        }
        return monthStartDate = year + "-" + month + "-1";
    },
    getMonthEndDate: function () {
        var dt = new Date();
        dt.setDate(1);
        dt.setMonth(dt.getMonth() + 1);
        cdt = new Date(dt.getTime() - 1000 * 60 * 60 * 24);
        return monthEndDate = cdt.getFullYear() + "-" + (Number(cdt.getMonth()) + 1) + "-" + cdt.getDate();
    }
}

/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * eg:
 * (new Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
Date.prototype.pattern = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    var week = {
        "0": "/u65e5",
        "1": "/u4e00",
        "2": "/u4e8c",
        "3": "/u4e09",
        "4": "/u56db",
        "5": "/u4e94",
        "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}