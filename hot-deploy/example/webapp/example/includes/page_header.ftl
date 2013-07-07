<style type="text/css">
  .sider-nav-container{
  	width: 150px;
  }
</style>
<script type="text/javascript">
//<![CDATA[
$(function(){
	$("#sider-nav-container ul li a[href='"+location.pathname+"']").parent("li").addClass("active");
});
//]]>
</script>
<div class="container-fluid">
      <div class="row-fluid">
        <div class="span2" style="min-height:500px;">
          <div class="well sider-nav-container" data-spy="affix" data-offset-top="0" id="sider-nav-container">
            <ul class="nav nav-list">
              <li class="nav-header">一级菜单</li>
              <li><a href="<@ofbizUrl>main</@ofbizUrl>">系统概况</a></li>
              <li><a href="<@ofbizUrl>listPerson</@ofbizUrl>">用户管理</a></li>
              <li><a href="<@ofbizUrl>exampleList</@ofbizUrl>">示例管理</a></li>
              <li><a href="#">Link</a></li>
              <li class="nav-header">Sidebar</li>
              <li><a href="#">Link</a></li>
              <li><a href="#">Link</a></li>
              <li><a href="#">Link</a></li>
              <li><a href="#">Link</a></li>
              <li><a href="#">Link</a></li>
              <li><a href="#">Link</a></li>
              <li class="nav-header">Sidebar</li>
              <li><a href="#">Link</a></li>
              <li><a href="#">Link</a></li>
              <li><a href="#">Link</a></li>
            </ul>
          </div><!--/.well -->
        </div><!--/span-->
        <div class="span10">