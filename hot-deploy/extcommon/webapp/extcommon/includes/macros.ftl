<#macro pager formId page> 
<div class="pagination pagination-right">
  <ul>
  	<#if page.hasPreviousPage()>
    <li><a href="#" onclick="front.pager.page('${formId}',${page.getNumber()})">&lt;&lt;上一页</a></li>
    <#else>
    <li class="disabled"><span>&lt;&lt;上一页</span></li>
    </#if>
    
    <#list 1..5 as i>
    <#if (page.getTotalPages() >= i)>
    <#if ((page.getNumber()+1) == i)>
    <li class="disabled"><span>${i}</span></li>
    <#else>
    <li><a href="#" onclick="front.pager.page('${formId}',${i})">${i}</a></li>
    </#if>
    </#if>
    </#list>
    
    <#if (page.getTotalPages() > 10)>
    <li class="disabled"><span>...</span></li>
    </#if>
    
    <#if (page.getTotalPages() > 5)>
    <#list 1..5 as i>
    <#if (page.getTotalPages()-6 >= i)>
    <#if ((page.getNumber()+1) == page.getTotalPages()-5+i)>
    <li class="disabled"><span>${page.getTotalPages()-5+i}</span></li>
    <#else>
    <li><a href="#" onclick="front.pager.page('${formId}',${page.getTotalPages()-5+i})">${page.getTotalPages()-5+i}</a></li>
    </#if>
    </#if>
    </#list>
    </#if>
    
    <#if page.hasNextPage()>
    <li><a href="#" onclick="front.pager.page('${formId}',${page.getNumber()+2})">下一页&gt;&gt;</a></li>
    <#else>
    <li class="disabled"><span>下一页&gt;&gt;</span></li>
    </#if>
  </ul>
</div>
</#macro> 