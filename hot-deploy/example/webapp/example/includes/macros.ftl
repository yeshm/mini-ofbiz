<#macro pager formId="searchForm" result=result>
	<#assign hasPreviousPage=(result.viewIndex > 0)>
	 
	<#assign totalPages=((result.listSize / result.viewSize)?int)>
	<#if ((result.listSize / result.viewSize) > totalPages)>
		<#assign totalPages=totalPages+1>
	</#if>
	
	<#assign hasNextPage=((totalPages-1) > result.viewIndex)> 
	<div class="pagination pagination-right">
	  <ul>
	  	<#if hasPreviousPage>
	    <li><a href="#" onclick="return app.pager.page('${formId}',${result.viewIndex-1})">&lt;&lt;上一页</a></li>
	    <#else>
	    <li class="disabled"><span>&lt;&lt;上一页</span></li>
	    </#if>
	    
	    <#list 0..4 as i>
		    <#if (totalPages >= (i+1))>
			    <#if result.viewIndex == i>
			    <li class="disabled"><span>${i+1}</span></li>
			    <#else>
			    <li><a href="#" onclick="return app.pager.page('${formId}',${i})">${i+1}</a></li>
			    </#if>
		    </#if>
	    </#list>
	    
	    <#if (totalPages > 10)>
	    <li class="disabled"><span>...</span></li>
	    </#if>
	    
	    <#if (totalPages > 5)>
		    <#list 0..4 as i>
			    <#assign newIndex = totalPages - 5>
				<#if ((newIndex+i+1) > 5)>
				    <#if result.viewIndex == newIndex+i>
				    <li class="disabled"><span>${newIndex+i+1}</span></li>
				    <#else>
				    <li><a href="#" onclick="return app.pager.page('${formId}',${newIndex+i})">${newIndex+i+1}</a></li>
				    </#if>
			    </#if>
		    </#list>
	    </#if>
	    
	    <#if hasNextPage>
	    <li><a href="#" onclick="return app.pager.page('${formId}',${result.viewIndex+1})">下一页&gt;&gt;</a></li>
	    <#else>
	    <li class="disabled"><span>下一页&gt;&gt;</span></li>
	    </#if>
	  </ul>
	</div>
</#macro> 