/**
 * 改造后bui main.html的公共js，将改文件至于最底部
 */


/**
 * 计算右侧内容显示区高度
 */
var sideh,outconh,conh;
function calculateContainerHeight() {
    try {
        sideh = document.getElementsByClassName("bui-side-menu")[0].offsetHeight;
        sideh += 14;
        document.getElementsByClassName("bui-side-menu")[0].style.height = sideh + "px";

        outconh = document.getElementsByClassName("bui-nav-tab")[0].offsetHeight;
          
        outconh += 14;
        document.getElementsByClassName("bui-nav-tab")[0].style.height = outconh + "px";

        conh = document.getElementsByClassName("tab-content-container")[0].offsetHeight;
        conh += 14;
        document.getElementsByClassName("tab-content-container")[0].style.height = conh + "px";
         //initSkinValue();
    } catch (e) {
        setTimeout(calculateContainerHeight, 100);
    }
};

/**
 * 初始化帮助信息提示框事件
 */
function initHelpTipEvents() {
    $('#j-help').hover(function () {
        $('#j-help-unfold').css('display', 'block');
    }, function () {
        $('#j-help-unfold').css('display', 'none');
    });
}

function initSwitchSkinEvents() {
    $('#j-dl-log-skin').on('click', function () {
        if ($(this).hasClass('cur')) {
            $(this).removeClass('cur');
            $('#skinbox').css('display', 'none');
            return false
        } else {
            $(this).addClass('cur');
            $('#skinbox').css('display', 'block');
            return false;
        }
    });

    $("#J_Nav").on('click',function(){
    	$(".bui-side-menu").css("height",sideh+"px");
    	$(".bui-nav-tab").css("height",outconh+"px");
    	$(".tab-content-container").css("height",conh+"px");
    });


    var $li = $('#skinbox  > i');
    $li.mouseover(function () {
        switchSkin(this.id);
    });
    $li.click(function () {
        switchSkin(this.id);
        $('#skinbox').css('display', 'none');
        $('#j-dl-log-skin').removeClass('cur');
        tmp = 0;
    });
}

function initSkinValue() {
    var mySiteSkin = $.cookie("mySiteSkin");
    if (mySiteSkin) {
        switchSkin(mySiteSkin);
    }else{
    	switchSkin("subtitle");
    }
}
function switchSkin(skinName) {
    $('#cssfile').attr('href', '/bui_theme/assets/css/skin/' + skinName + '.css');
    switchIframeInnerPageSkin(skinName);
    $.cookie("mySiteSkin", skinName, {expires: 365, path: "/"});
}

/**
 * 改变iframe内部页面样式
 */
function switchIframeInnerPageSkin(skinName) {
    var currentIframeDocument = getCurrentIframeDocument();
    $('#cssfile', currentIframeDocument).attr('href', '/bui_theme/assets/css/skin/' + skinName + '.css');
}

/**
 * 获取当前iframe document对象
 */
function getCurrentIframeDocument() {
    var iframeDocument;
    $(".tab-content").each(function () {
        if ($(this).css("display") == "block") {
            var iframe = $(this).find("iframe")[0];
            iframeDocument = iframe.contentDocument || iframe.document;
            return false;
        }
    })
    return iframeDocument;
}

$(function () {
    calculateContainerHeight();

    initHelpTipEvents();

    initSwitchSkinEvents();

    //initSkinValue();
    
        //自定义颜色
//  setTimeout(function(){
//  	$(".bui-menu-item a").bind("click",function(){
//  		setTimeout(function(){initSkinValue()},400);
//  	});
//  },500);
});
