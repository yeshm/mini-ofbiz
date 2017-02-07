<#assign functionName=result.functionName!>

<#if paging?has_content && paging.getTotalPage() gte 1>
    <#macro renderPagingPager pageFrom pageTo pageIndex>
        <#list pageFrom..pageTo as index>
            <#if pageIndex == index>
            <a href="javascript:void(0);" class="num active">${pageIndex+1}</a>
            <#else>
            <a class="fetch_page num" href="javascript:void(0);" onclick="${functionName}(${index},'${searchItem!}')">${index+1}</a>
            </#if>
        </#list>
    </#macro>

    <#assign total = paging.getTotalPage()>
    <#assign pageIndex = paging.pageIndex>
    <span class="total">共 ${paging.getTotalSize()!} 条，每页${paging.getPageSize()!}条</span>
    <#if paging.hasPreviousPage()>
    <a class="prev" href="javascript:void(0);" onclick="${functionName}(${pageIndex-1},'${searchItem!}')"><i></i>上一页</a>
    </#if>
    <#if (total > 0) >
        <#assign inputPageIndex = pageIndex+1>
        <#if total lte 6>
            <@renderPagingPager pageFrom=0 pageTo=total-1 pageIndex=pageIndex/>
        <#else>
            <#if pageIndex lte 2>
                <@renderPagingPager pageFrom=0 pageTo=3 pageIndex=pageIndex/>...
            <#else>
                <#assign tmpTotalPage = (pageIndex+3)>
                <#if tmpTotalPage gte total>
                    <@renderPagingPager pageFrom=0 pageTo=1 pageIndex=pageIndex/>...
                    <#assign thisPageIndex = pageIndex>
                    <#if ((pageIndex+1)>(total-1))>
                        <#assign thisPageIndex = (total-2)>
                    </#if>
                    <@renderPagingPager pageFrom=(thisPageIndex-1) pageTo=(thisPageIndex+1) pageIndex=pageIndex/>
                <#else>
                    <@renderPagingPager pageFrom=0 pageTo=0 pageIndex=pageIndex/>...
                    <@renderPagingPager pageFrom=(pageIndex-1) pageTo=pageIndex+1 pageIndex=pageIndex/>
                ...
                    <@renderPagingPager pageFrom=(total-1) pageTo=(total-1) pageIndex=pageIndex/>
                </#if>
            </#if>
        </#if>
    </#if>
    <#if paging.hasNextPage()>
    <a class="next" href="javascript:void(0);" onclick="${functionName}(${pageIndex+1},'${searchItem!}')">下一页<i></i></a>
    </#if>
</#if>