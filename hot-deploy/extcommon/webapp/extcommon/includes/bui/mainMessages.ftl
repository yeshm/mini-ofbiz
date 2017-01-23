<div id="messageContainer">
<#--<div class="outpop" >
        <div class="ico1"></div>
        <div class="title">脱离iframe的提示信息</div>
    </div>-->
</div>
<script type="text/javascript">
    function showMessage(message, clazz) {
        var messageContainer = $("#messageContainer");
        messageContainer.html('');

        var html = $('<div class="outpop '+clazz+'" ><div class="ico-img"></div><div class="title">'+message+'</div></div>');
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
</script>