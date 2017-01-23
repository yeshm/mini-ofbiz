<script type="text/javascript" src="/ext/assets/jquery.zclip/1.1.1/jquery.zclip.min.js"></script>

<script type="text/javascript">
    if (!app) {
        app = {}
    }

    app.zclip = function (options) {
        this.settings = $.extend({}, this.defaultOptions, options);

        if (!this.settings.buttonId) return;
        if (!this.settings.copy && this.settings.dataSourceInputId) {

            var copyFunctionStr = 'this.settings.copy = function(){'+
                'var v = $("#'+this.settings.dataSourceInputId+'").val().trim();'+
                'if(!v) v = $("#'+this.settings.dataSourceInputId+'").text().trim();'+
                //'app.showSuccess(v);'+
                'return v;'+
            '}';
            //console.dir(copyFunctionStr)

            eval(copyFunctionStr)
            //console.dir(this.settings.copy)
        }
        $("#" + this.settings.buttonId).zclip(this.settings);
    };
    app.zclip.prototype.defaultOptions = {
        path: "/ext/assets/jquery.zclip/1.1.1/ZeroClipboard.swf",
        buttonId: "",
        dataSourceInputId: "",
        afterCopy: function () {
            //console.dir(ZeroClipboard);
            app.showSuccess("复制成功,请粘帖到您需要的地方");
        }
    };
</script>
