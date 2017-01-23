<link rel="stylesheet" type="text/css" href="/ext/assets/qiniuuploader/plupload/jquery.ui.plupload/css/jquery.ui.plupload.css">
<link rel="stylesheet" type="text/css" href="/ext/assets/qiniuuploader/js/highlight/highlight.css">

<script type="text/javascript" charset="utf-8" src="/ext/assets/qiniuuploader/plupload/plupload.full.min.js"></script>
<script type="text/javascript" charset="utf-8" src="/ext/assets/qiniuuploader/plupload/i18n/zh_CN.js"></script>
<script type="text/javascript" charset="utf-8" src="/ext/assets/qiniuuploader/js/uploader.js"></script>
<script type="text/javascript">
    app.uploader = {
        //关闭图片
        closeImg: function (obj, options) {
            $(obj).parent().removeClass("had");
            if (options && options.callback) {
                options.callback();
            }
        },
        //显示图片
        showImage: function () {
            $(".upload-image").addClass("had");
        },
        //初始化图片上传
        initImageUpload: function () {
            $(".js-add-image-upload .upload-image").removeClass("had");
        }
    }
</script>
<div class="box-content" id="progressBarBox" style="display: none">
    <div class="progress-box">
        <div class="progress">
            <span class="prog-w orange" style="width: 0%;"><span class="prog-val" id="spaceused1">0%</span></span>
        </div>
    </div>
</div>