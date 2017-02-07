// QQ表情插件
(function($){  
	$.fn.qqFace = function(options){
		var defaults = {
			id : 'facebox',
			path : 'face/',
			assign : 'content',
			tip : 'em_'
		};
		var option = $.extend(defaults, options);
		var assign = $('#'+option.assign);
		var id = option.id;
		var path = option.path;
		var tip = option.tip;
		
		if(assign.length<=0){
			alert('缺少表情赋值对象。');
			return false;
		}
		
		$(this).click(function(e){
			var strFace, labFace;
			if($('#'+id).length<=0){
				strFace = '<div id="'+id+'" style="position:absolute;display:none;z-index:1000;" class="qqFace">' +
							  '<table border="0" cellspacing="0" cellpadding="0"><tr>';
				for(var i=1; i<=72; i++){
					if(tip=="cn"){
						switch(i){
							case 1: labFace = '/::)';break;
							case 2: labFace = '/::~';break;
							case 3: labFace = '/::B';break;
							case 4: labFace = '/::|';break;
							case 5: labFace = '/::<';break;
							case 6: labFace = '/::$';break;
							case 7: labFace = '/::X';break;
							case 8: labFace = '/::Z';break;
							case 9: labFace = '/::’(';break;
							case 10: labFace = '/::-|';break;
							case 11: labFace = '/::@';break;
							case 12: labFace = '/::P';break;
							case 13: labFace = '/::D';break;
							case 14: labFace = '/::O';break;
							case 15: labFace = '/::(';break;
							case 16: labFace = '/:–b';break;
							case 17: labFace = '/::Q';break;
							case 18: labFace = '/::T';break;
							case 19: labFace = '/:,@P';break;
							case 20: labFace = '/:,@-D';break;
							case 21: labFace = '/::d';break;
							case 22: labFace = '/:,@o';break;
							case 23: labFace = '/::g';break;
							case 24: labFace = '/:|-)';break;
							case 25: labFace = '/::!';break;
							case 26: labFace = '/::L';break;
							case 27: labFace = '/::>';break;
							case 28: labFace = '/::,@';break;
							case 29: labFace = '/:,@f';break;
							case 30: labFace = '/::-S';break;
							case 31: labFace = '/:?';break;
							case 32: labFace = '/:,@x';break;
							case 33: labFace = '/:,@@';break;
							case 34: labFace = '/::8';break;
							case 35: labFace = '/:,@!';break;
							case 36: labFace = '/:xx';break;
							case 37: labFace = '/:bye';break;
							case 38: labFace = '/:wipe';break;
							case 39: labFace = '/:dig';break;
							case 40: labFace = '/:wipe';break;
							case 41: labFace = '/:B-)';break;
							case 42: labFace = '/:<@';break;
							case 43: labFace = '/:@>';break;
							case 44: labFace = '/::-O';break;
							case 45: labFace = '/:>-|';break;
							case 46: labFace = '/:P-(';break;
							case 47: labFace = '/::’|';break;
							case 48: labFace = '/:X-)';break;
							case 49: labFace = '/::*';break;
							case 50: labFace = '/:@x';break;
							case 51: labFace = '/:8*';break;
							case 52: labFace = '/:hug';break;
							case 53: labFace = '/:moon';break;
							case 54: labFace = '/:sun';break;
							case 55: labFace = '/:bome';break;
							case 56: labFace = '/:!!!';break;
							case 57: labFace = '/:pd';break;
							case 58: labFace = '/:pig';break;
							case 59: labFace = '/:<W>';break;
							case 60: labFace = '/:coffee';break;
							case 61: labFace = '/:eat';break;
							case 62: labFace = '/:heart';break;
							case 63: labFace = '/:strong';break;
							case 64: labFace = '/:weak';break;
							case 65: labFace = '/:share';break;
							case 66: labFace = '/:v';break;
							case 67: labFace = '/:@)';break;
							case 68: labFace = '/:jj';break;
							case 69: labFace = '/:ok';break;
							case 70: labFace = '/:rose';break;
							case 71: labFace = '/:fade';break;
							case 72: labFace = '/:showlove';break;
						}
					}else{
						labFace = '['+tip+i+']';
					}
					strFace += '<td><img src="'+path+i+'.gif" onclick="$(\'#'+option.assign+'\').setCaret();$(\'#'+option.assign+'\').insertAtCaret(\'' + labFace + '\');" /></td>';
					if( i % 15 == 0 ) strFace += '</tr><tr>';
				}
				strFace += '</tr></table></div>';
			}
			$(this).parent().append(strFace);
			var offset = $(this).position();
			var top = offset.top + $(this).outerHeight();
			$('#'+id).css('top',top);
			$('#'+id).css('left',offset.left);
			$('#'+id).show();
			e.stopPropagation();
		});

		$(document).click(function(){
			$('#'+id).hide();
			$('#'+id).remove();
		});
	};

})(jQuery);

jQuery.extend({ 
unselectContents: function(){ 
	if(window.getSelection) 
		window.getSelection().removeAllRanges(); 
	else if(document.selection) 
		document.selection.empty(); 
	} 
}); 
jQuery.fn.extend({ 
	selectContents: function(){ 
		$(this).each(function(i){ 
			var node = this; 
			var selection, range, doc, win; 
			if ((doc = node.ownerDocument) && (win = doc.defaultView) && typeof win.getSelection != 'undefined' && typeof doc.createRange != 'undefined' && (selection = window.getSelection()) && typeof selection.removeAllRanges != 'undefined'){ 
				range = doc.createRange(); 
				range.selectNode(node); 
				if(i == 0){ 
					selection.removeAllRanges(); 
				} 
				selection.addRange(range); 
			} else if (document.body && typeof document.body.createTextRange != 'undefined' && (range = document.body.createTextRange())){ 
				range.moveToElementText(node); 
				range.select(); 
			} 
		}); 
	}, 

	setCaret: function(){ 
		//if(!$.browser.msie) return; 
		var initSetCaret = function(){ 
			var textObj = $(this).get(0); 
			textObj.caretPos = document.selection.createRange().duplicate(); 
		}; 
		$(this).click(initSetCaret).select(initSetCaret).keyup(initSetCaret); 
	}, 

	insertAtCaret: function(textFeildValue){ 
		var textObj = $(this).get(0); 
		if(document.all && textObj.createTextRange && textObj.caretPos){ 
			var caretPos=textObj.caretPos; 
			caretPos.text = caretPos.text.charAt(caretPos.text.length-1) == '' ? 
			textFeildValue+'' : textFeildValue; 
		} else if(textObj.setSelectionRange){ 
			var rangeStart=textObj.selectionStart; 
			var rangeEnd=textObj.selectionEnd; 
			var tempStr1=textObj.value.substring(0,rangeStart); 
			var tempStr2=textObj.value.substring(rangeEnd); 
			textObj.value=tempStr1+textFeildValue+tempStr2; 
			textObj.focus(); 
			var len=textFeildValue.length; 
			textObj.setSelectionRange(rangeStart+len,rangeStart+len); 
			textObj.blur(); 
		}else{ 
			textObj.value+=textFeildValue; 
		} 
	} 
});