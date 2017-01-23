<div class="content">
    <div class="dl-main-nav">
        <ul id="J_Nav" class="nav-list ks-clear">
            <li class="nav-item dl-selected">
                <div class="nav-item-inner">管理</div>
            </li>
            <li class="nav-item">
                <div class="nav-item-inner">功能</div>
            </li>
        </ul>
    </div>

    <ul id="J_NavContent" class="dl-tab-content">

    </ul>
</div>

<script>
    BUI.use('common/main', function () {
        var config = [
            {
                id: 'menu',
                homePage: 'home',
                menu: [
                    {
                        text: '我的主页',
                        items: [
                            {id: 'home', text: '主页', href: '<@ofbizUrl>home</@ofbizUrl>', closeable: false},
                        ]
                    }
                ]
            },
            {
                id: 'mod',
                homePage: '',
                menu: [
                    {
                        text: '公共组件',
                        items: []
                    }
                ]
            }
        ];
        new PageUtil.MainPage({
            modulesConfig: config
        });
    });

    function showMessage(message, clazz) {
        var messageContainer = $("#messageContainer");
        messageContainer.html('');

        var html = $('<div class="outpop ' + clazz + '" ><div class="ico-img"></div><div class="title">' + message + '</div></div>');
        html.appendTo(messageContainer);

        setTimeout(function () {
            html.remove()
        }, 2000);
    }

    function showSuccess(message) {
        showMessage(message, 'ico1');
    }

    function showError(message) {
        showMessage(message, 'ico2');
    }

    function showWarning(message) {
        showMessage(message, 'ico3');
    }


    //关闭信息框
    function clossMsgBox(obj) {
        $(obj).parents(".msg-box").remove();
    }

    $(function () {
        setTimeout(function () {
            $(".msg-box").remove();
        }, 10000)
    })

</script>