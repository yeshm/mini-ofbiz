$.ajaxSetup({
	dataType: "json",
	type: "POST",
	traditional: true,
	error: function(){
		app.helper.showError("系统错误");
	}
});

var app = {}

app.helper = {
	contextPath:"",
	mergeArray: function(array1, array2){
		var array = new Array();
		if(typeof array1 != "undefined"){
			if($.type(array1) == "array"){
				for(index in array1){
					array.push(array1[index]);
				}
			}else array.push(array1);
		}
		if(typeof array2 != "undefined"){
			if($.type(array2) == "array"){
				for(index in array2){
					array.push(array2[index]);
				}
			}else array.push(array2);
		}
		return array;
	},
	showTip: function(options){
		var op = {
				title: "错误",
				buttons:[
					{
					    text: "关闭",
					    click: function() {
					    	$(this).dialog("close");
					    	if(options.callBack){
					    		options.callBack();
					    	}
					    }
					}
				]
			};
		
		$.extend(op, options);
		var s = '<div id="">';
		var messages = app.helper.mergeArray(op.message,op.messages);
		if(messages.length == 0) messages.push("处理失败，请重试！");
		for(var index in messages){
			s += '<p>'+messages[index]+'</p>';
		}
		s += '</div>';
		
		app.helper.unblockUI();
		$(s).dialog(op);
	},
	showError: function(options){
		options.title = "错误";
		this.showTip(options);
	},
	showMessage: function(options){
		options.title = "信息";
		this.showTip(options);
	},
	showWarn: function(options){
		options.title = "警告";
		this.showTip(options);
	},
	checkForm:function(fields){
		if(!fields) return false;
		if(typeof fields == "string"){
			return this.checkFormField(fields);
		}else{
			for(var i=0;i<fields.length;i++){
				if(!this.checkFormField(fields[i])) return false;
			}
			return true;
		}
	},
	checkFormField:function(field){
		var v = $("#"+field).val();
		if(!v || v.trim().length == 0){
			return false;
		}else return true;
	},
	reloadPage: function(){
		window.location.href=window.location.href;
    },
	loadStatus: function(id, status, defaultValue){
    	var e = $("#"+id);
    	if(e.size() > 0){
    		e.empty();
    		$("<option value=''>请选择</option>").appendTo(e);
    		for(var s in status){
    			var str = "<option value='" + s + "' ";
    			if(defaultValue && defaultValue==s) str += "selected";;
    			str += ">" +  status[s] + "</option>";
    			$(str).appendTo(e);
    		}
    	}
     },
     initDatePicker: function(options){
    	 var settings = $.extend({},{
    		 showOn: "both",
    		 buttonImage: app.helper.contextPath+"/static/images/admin/calendar.gif",
    		 buttonImageOnly: true,
    		 dateFormat:"yy-mm-dd",
    		 defaultDate: "${nowTimestamp?string('yyyy-MM-dd')}"
    	 },options);
    	 $(".datepicker").datepicker(settings);
     },
     clearForm:function(formId){
    	 $(':input','#'+formId)  
    	 .not(':button, :submit, :reset, :hidden')  
    	 .val('')  
    	 .removeAttr('checked')  
    	 .removeAttr('selected');
     },
     blockUI: function() {
    	 $.blockUI({ 
 	        message:  '<h4>处理中，请稍候...</h4>',
 	        overlayCSS:  { 
 	            backgroundColor: '#000', 
 	            opacity: 0.3 
 	        },
 	        baseZ: 99999
 	    });
     },
     unblockUI: function() {
    	 $.unblockUI({ fadeOut: 200 });
     },
     deparam: function(params, coerce){
		var decode = decodeURIComponent;
	    var obj = {},
	      coerce_types = { 'true': !0, 'false': !1, 'null': null };
	    $.each( params.replace( /\+/g, ' ' ).split( '&' ), function(j,v){
	      var param = v.split( '=' ),
	        key = decode( param[0] ),
	        val,
	        cur = obj,
	        i = 0,
	        keys = key.split( '][' ),
	        keys_last = keys.length - 1;
	      if ( /\[/.test( keys[0] ) && /\]$/.test( keys[ keys_last ] ) ) {
	        keys[ keys_last ] = keys[ keys_last ].replace( /\]$/, '' );
	        keys = keys.shift().split('[').concat( keys );
	        keys_last = keys.length - 1;
	      } else {
	        keys_last = 0;
	      }
	      
	      if ( param.length === 2 ) {
	        val = decode( param[1] );
	        
	        if ( coerce ) {
	          val = val && !isNaN(val)            ? +val              // number
	            : val === 'undefined'             ? undefined         // undefined
	            : coerce_types[val] !== undefined ? coerce_types[val] // true, false, null
	            : val;                                                // string
	        }
	        
	        if ( keys_last ) {
	          for ( ; i <= keys_last; i++ ) {
	            key = keys[i] === '' ? cur.length : keys[i];
	            cur = cur[key] = i < keys_last
	              ? cur[key] || ( keys[i+1] && isNaN( keys[i+1] ) ? {} : [] )
	              : val;
	          }
	        } else {
	          if ( $.isArray( obj[key] ) ) {
	            obj[key].push( val );
	          } else if ( obj[key] !== undefined ) {
	            obj[key] = [ obj[key], val ];
	          } else {
	            obj[key] = val;
	          }
	        }
	        
	      } else if ( key ) {
	        obj[key] = coerce
	          ? undefined
	          : '';
	      }
	    });
	    
	    return obj;
	}
};

app.pager = {
	page:function(formId,pageIndex){
		var form = $("#"+formId);
		form.find("input[name=VIEW_INDEX]").val(pageIndex);
		form.submit();
		return false;
	},	
	search:function(formId){
		var form = $("#"+formId);
		form.find("input[name=VIEW_INDEX]").val("0");
		form.submit();
	}	
};

app.handlerServiceResponse = function(d){
	if(typeof d.result == "undefined"){
		app.helper.showError("数据格式错误");
		return false;
	}else if(d.result == "success"){
		return true;
	}else if(d.result == "error"){
		var data = d.data;
		var hasError = false;
		var messages = new Array();
		if(typeof data._ERROR_MESSAGE_LIST_ != "undefined") messages.push(data._ERROR_MESSAGE_LIST_);
		if(typeof data._ERROR_MESSAGE_ != "undefined") messages.push(data._ERROR_MESSAGE_);
		if(typeof data.errorMessageList != "undefined") messages.push(data.errorMessageList);
		if(typeof data.errorMessage != "undefined") messages.push(data.errorMessage);
		if(typeof data.message != "undefined") messages.push(data.message);
		
		if(messages.length == 0) messages.push("系统错误");
		app.helper.showError({messages:messages});
		return false;
	}else if(d.result == "nosession"){
		app.helper.showError('长时间未操作，请重新<a href="${ctx}/" class="btn btn-success">登录</a>');
		return false;
	}else{
		app.helper.showError("数据格式错误");
		return false;
	}
};

app.ajaxHelper = {
	success: function(data, textStatus, jqXHR, options){
		var settings = $.extend({},options);
		if(app.handlerServiceResponse(data)){
			app.helper.showMessage(options);
			return true;
		}
		return false;
	},
	submitRequest: function(options){
		var settings = $.extend(true,{data:{}},options);
		if(settings.blockUI && settings.blockUI == true){
			app.helper.blockUI();
		}
		$.ajax(settings.url,{
    		data: settings.data,
    		success: settings.success
    	});
	}
};


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
    			//this.elements[i].val(this.settings.defaultValues[i]).change();
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
