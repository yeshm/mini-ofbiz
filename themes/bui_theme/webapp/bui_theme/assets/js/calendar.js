var doc=document;
function Calendar(){
	this.init.apply(this,arguments);
}
Calendar.prototype={
	init:function(tableId,dateId,selectY,selectM,startYear,endYear){
		var table=doc.getElementById(tableId);
		var dateObj=doc.getElementById(dateId);
		var selectY=doc.getElementById(selectY);
		var selectM=doc.getElementById(selectM);
		this._setSelectYear(selectY,startYear,endYear);
		this._setTodayDate(table,selectY,selectM);
		this._selectChange(table,selectY,selectM);
		this._clickBtn(table,dateObj,selectY,selectM,startYear,endYear);
	},
	//设置年份
	_setSelectYear:function(selectY,startYear,endYear){
		var html="";
		var date=new Date();
		if(!endYear){
			var endYear=date.getFullYear();
		}else{
			var endYear=endYear;	
		}
		for(var i=startYear;i<=endYear;i++){
			var _option=document.createElement('option');
			selectY.appendChild(_option);
			_option.value=i;
			_option.innerHTML=i;
		}
	},
	//设置当天的时间
	_setTodayDate:function(table,selectY,selectM){
		var _this=this;
		var date=new Date();
		var year=date.getFullYear(),month=date.getMonth(),_date=date.getDate(),day=date.getDay();
		var n=parseInt(_date/7);
		var l=n%7;
		if(l>=day){
			var todayTd=day+7*l;
		}else{
			var todayTd=day+7*(l+1);
		}
		var startTd=todayTd-_date+1;
		var monthDays=this._getMonthDays(year,month);
		var td=table.getElementsByTagName('td');
		this._setSelectValue(selectY,year);
		this._setSelectValue(selectM,month+1);
		for(i=startTd,len=td.length;i<len;i++){
			var _td=td[i];	
			var j=i-startTd+1
			_td.innerHTML=j;
			_td.className="date";
			if(j==_date){
				_td.className="today";
			}else{
				_this._mouseOn(_td);
			}
			if(j>=monthDays){
				break;
			}
		}
	},
	//鼠标移入移出日期
	_mouseOn:function(obj){
		obj.onmouseover=function(){
			if(this.innerHTML){
				this.style.background="#bbb";	
			}
		}
		obj.onmouseout=function(){
			this.style.	background="";
		}
	},
	//下拉菜单选择日期
	_selectChange:function(table,selectY,selectM){
		var _this=this;
		selectY.onchange=function(){
			var year=_this._getSelectValue(selectY);
			var month=_this._getSelectValue(selectM)-1;
			_this._showCalendar(table,year,month);
		}
		selectM.onchange=function(){
			var year=_this._getSelectValue(selectY);
			var month=_this._getSelectValue(selectM)-1;;
			_this._showCalendar(table,year,month);
		}
	},
	//获取下拉菜单的默认值
	_getSelectValue:function(selectObj){
		var selectList=selectObj.getElementsByTagName('option');
		for(var i=0,len=selectList.length;i<len;i++){
			var _option=selectList[i];
			if(_option.selected){
				return parseInt(_option.value);
			}
		}
	},
	//设置下拉菜单默认值
	_setSelectValue:function(selectObj,value){
		var selectList=selectObj.getElementsByTagName('option');
		for(var i=0,len=selectList.length;i<len;i++){
			var _option=selectList[i];
			if(parseInt(_option.value)==value){
				_option.selected=true;
				break;
			}
		}
	},
	_clickBtn:function(table,dateObj,selectY,selectM,startYear,endYear){
		var _this=this,year=0;
		var btn=dateObj.getElementsByTagName('a');
		btn[0].onclick=function(){
			year=_this._getSelectValue(selectY)-1;
			var month=_this._getSelectValue(selectM);
			if(!isYearOver(year)){
				return;
			}
			_this._setSelectValue(selectY,year);
			_this._setSelectValue(selectM,month);
			_this._showCalendar(table,year,month-1);
		}
		btn[1].onclick=function(){
			year=_this._getSelectValue(selectY);
			var month=_this._getSelectValue(selectM)-1;
			if(month<=0){
				month=12;
				year--;
			}
			if(!isYearOver(year)){
				return;
			}
			_this._setSelectValue(selectM,month);
			_this._setSelectValue(selectY,year);
			_this._showCalendar(table,year,month-1);
		}
		btn[2].onclick=function(){
			year=_this._getSelectValue(selectY);
			var month=_this._getSelectValue(selectM)+1;
			if(month>12){
				month=1;
				year++;
			}
			if(!isYearOver(year)){
				return;
			}
			_this._setSelectValue(selectM,month);
			_this._setSelectValue(selectY,year);
			_this._showCalendar(table,year,month-1);
		}
		btn[3].onclick=function(){
			year=_this._getSelectValue(selectY)+1;
			var month=_this._getSelectValue(selectM);
			if(!isYearOver(year)){
				return;
			}
			_this._setSelectValue(selectM,month);
			_this._setSelectValue(selectY,year);
			_this._showCalendar(table,year,month-1);
		}
		function isYearOver(year){
			var date=new Date();
			var _endYear=endYear?endYear:date.getFullYear();
			if(year>_endYear||year<startYear){
				alert("超出日期范围");
				return false;;
			}else{
				return true;	
			}
		}
	},
	//显示日历
	_showCalendar:function(table,year,month){
		var date=new Date();
		var _year=date.getFullYear();
		var _month=date.getMonth();
		var _date=date.getDate();
		date.setYear(year);
		date.setMonth(month);
		date.setDate(1);
		var day=date.getDay();
		var _this=this;
		var monthDays=this._getMonthDays(year,month);
		var td=table.getElementsByTagName('td');
		for(var k=0;k<td.length;k++){
			td[k].innerHTML="";
			td[k].className="";
		}
		for(var i=day,len=td.length;i<len;i++){
			var _td=td[i];
			var j=i-day+1;
			_td.innerHTML=j;
			_td.className="date";
			if(_year==year&&_month==month&&_date==j){
				_td.className="today";
			}else{
				_this._mouseOn(_td);	
			}
			if(j>=monthDays){
				break;
			}
		}
	},
	//返回某个月的天数
	_getMonthDays:function(year,month){
		var monthAry=[31,28,31,30,31,30,31,31,30,31,30,31];
		if(year%400==0){
			monthAry[1]=29;
		}else{
			if(year%4==0&&year%100!=0){
				monthAry[1]=29;
			}
		}
		return monthAry[month];
	}
}