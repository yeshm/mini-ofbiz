bui修改记录
========================================================================================================================
2014-01-13
/hot-deploy/extcommon/webapp/extcommon/assets/bui/1.0.0/js/common/main.js:460

navItems.each(function(index,item){
    var item = $(item);
    item.on('click',function(){
      var sender =$(this);
      if(sender.hasClass(CLS_SELECTE)){
        return;
      }
    //一级菜单事件自定义，不显示二级菜单，一般跳转到外部的链接
    if(sender.hasClass("nav-item-custom")){
        return;
    }

    新增部分为：
    //一级菜单事件自定义，不显示二级菜单，一般跳转到外部的链接
    if(sender.hasClass("nav-item-custom")){
        return;
    }
========================================================================================================================
2014-04-06
/hot-deploy/extcommon/webapp/extcommon/assets/bui/1.0.0/common/main.js:54
 menu.on('menuclick',function(ev){
      var item = ev.item;
      if(item && item.get("isCustomerMenu")) return;//如果是自定义菜单，不执行默认的处理流程

      新增部分为：
      if(item && item.get("isCustomerMenu")) return;//如果是自定义菜单，不执行默认的处理流程


/hot-deploy/extcommon/webapp/extcommon/assets/bui/1.0.0/common/main.js:70
menu.on('itemselected',function(ev){
      var item = ev.item;
      if(item && item.get("isCustomerMenu")) return;//如果是自定义菜单，不执行默认的处理流程

      新增部分为：
      if(item && item.get("isCustomerMenu")) return;//如果是自定义菜单，不执行默认的处理流程
========================================================================================================================
2015-04-21
hot-deploy/extcommon/webapp/extcommon/assets/bui/1.0.13/common/search.js:168
    新增部分为：
    //session失效处理
    store.on("beforeprocessload", function(d){
    app.ajaxHelper.handleAjaxMsg(d.data);
    });

========================================================================================================================
2016-02-23
bug修复-在不同组件间跳转，源id跟新id一样，会关闭自身
hot-deploy/extcommon/webapp/extcommon/assets/bui/1.0.13/common/main.js:301
    if(isClose){ -》 if(isClose && id != sourceId){
