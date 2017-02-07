/*global Qiniu */
/*global plupload */
/*global FileProgress */
/*global hljs */


$(function () {
    console.log("fileType:" + fileType);

    var fileType = "image";

    var filterRule={};

    if("image"==fileType){
        filterRule={
            title: 'Images',
            extensions: 'gif,jpg,jpeg,bmp,png',
            mimeTypes: 'image/*'
        }
    }else if("audio"==fileType){
        filterRule={
            title: 'Images',
            extensions: 'mp3,AIF,RM,WMV',
            mimeTypes: 'audio/*'
        }
    }

    var uploader = Qiniu.uploader({
        fileType: fileType,
        sign: sign,
        isConfigReturnUrl: false,//配置了重定向 需要处理303
        runtimes: 'html5,flash,html4',
//        runtimes: 'flash,html4',
        browse_button: 'pickfiles',
        container: 'container',
        drop_element: 'container',
        max_file_size: '3mb',
        flash_swf_url: 'js/plupload/Moxie.swf',
        dragdrop: true,
        chunk_size: '4mb',
        uptoken_url: '/tp/control/generateUploadToken',
        domain: 'http://bonn.qiniudn.com/',
        // downtoken_url: '/downtoken',
        // unique_names: true,
        // save_key: true,
        // x_vars: {
        //     'id': '1234',
        //     'time': function(up, file) {
        //         var time = (new Date()).getTime();
        //         // do something with 'time'
        //         return time;
        //     },
        // },
        auto_start: true,
        filters: [
            filterRule
        ],
        init: {
            'FilesAdded': function (up, files) {
                console.log("添加文件...");
                $('table').show();
                $('#success').hide();
                plupload.each(files, function (file) {
                    var progress = new FileProgress(file, 'fsUploadProgress');
                    progress.setStatus("等待...");
                });
            },
            'BeforeUpload': function (up, file) {
                var progress = new FileProgress(file, 'fsUploadProgress');
                var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                if (up.runtime === 'html5' && chunk_size) {
                    progress.setChunkProgess(chunk_size);
                }
            },
            'UploadProgress': function (up, file) {
                var progress = new FileProgress(file, 'fsUploadProgress');
                var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);

            },
            'UploadComplete': function () {
                console.log("上传完成");

                $('#success').show();
            },
            'FileUploaded': function (up, file, info) {
//                var id=up.id;

                var res = $.parseJSON(info);
                var key = res.key;
//                var id=res.hash;
//                var id=file.id.toString();
                var id = useMediaWallPhoto;

                console.log("type of id" + typeof id);

                console.log("res" + res);

//                console.log("上传完成上传完成上传完成上传完成上传完成"+info);
//                console.log("filefilefile"+file);
//                console.log("upupup"+up);

                var isNew = !($("#mediaWallPhotoImageUrlList" + id).val());

                if (isNew && useMediaWallPhoto < totalImage) {
                    appendUploadImageDom(id);
                    useMediaWallPhoto++;

//                    var imageView = '?imageView2/1/w/100/h/100';
                    var imageView = '?imageView2/1/w/65/h/49';

                    $("#mediaWallPhotoPreview" + id).attr("src", "http://bonn.qiniudn.com/" + key + imageView);
                    $("#mediaWallPhotoImageUrlList" + id).val(key);
                    $("#alt" + id).hide();
                    $("#delete" + id).addClass("prd-thumblist-delete");
                    $("#mediaWallPhotoImageUrlList" + id).attr("value", key)
                }


                var progress = new FileProgress(file, 'fsUploadProgress');
                progress.setComplete(up, info);
            },
            'Error': function (up, err, errTip) {
                console.log("上传出错");
                $('table').show();
                var progress = new FileProgress(err.file, 'fsUploadProgress');
                progress.setError();
                progress.setStatus(errTip);
            }
            // ,
            // 'Key': function(up, file) {
            //     var key = "";
            //     // do something with key
            //     return key
            // }
        }
    });

    uploader.bind('FileUploaded', function () {
        console.log('hello man,a file is uploaded');
    });
    $('#container').on(
        'dragenter',
        function (e) {
            e.preventDefault();
            $('#container').addClass('draging');
            e.stopPropagation();
        }
    ).on('drop', function (e) {
            e.preventDefault();
            $('#container').removeClass('draging');
            e.stopPropagation();
        }).on('dragleave', function (e) {
            e.preventDefault();
            $('#container').removeClass('draging');
            e.stopPropagation();
        }).on('dragover', function (e) {
            e.preventDefault();
            $('#container').addClass('draging');
            e.stopPropagation();
        });


    $('#show_code').on('click', function () {
        $('#myModal-code').modal();
        $('pre code').each(function (i, e) {
            hljs.highlightBlock(e);
        });
    });


    $('body').on('click', 'table button.btn', function () {
        $(this).parents('tr').next().toggle();
    });


    var getRotate = function (url) {
        if (!url) {
            return 0;
        }
        var arr = url.split('/');
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === 'rotate') {
                return parseInt(arr[i + 1], 10);
            }
        }
        return 0;
    };

    $('#myModal-img .modal-body-footer').find('a').on('click', function () {
        var img = $('#myModal-img').find('.modal-body img');
        var key = img.data('key');
        var oldUrl = img.attr('src');
        var originHeight = parseInt(img.data('h'), 10);
        var fopArr = [];
        var rotate = getRotate(oldUrl);
        if (!$(this).hasClass('no-disable-click')) {
            $(this).addClass('disabled').siblings().removeClass('disabled');
            if ($(this).data('imagemogr') !== 'no-rotate') {
                fopArr.push({
                    'fop': 'imageMogr2',
                    'auto-orient': true,
                    'strip': true,
                    'rotate': rotate,
                    'format': 'png'
                });
            }
        } else {
            $(this).siblings().removeClass('disabled');
            var imageMogr = $(this).data('imagemogr');
            if (imageMogr === 'left') {
                rotate = rotate - 90 < 0 ? rotate + 270 : rotate - 90;
            } else if (imageMogr === 'right') {
                rotate = rotate + 90 > 360 ? rotate - 270 : rotate + 90;
            }
            fopArr.push({
                'fop': 'imageMogr2',
                'auto-orient': true,
                'strip': true,
                'rotate': rotate,
                'format': 'png'
            });
        }

        $('#myModal-img .modal-body-footer').find('a.disabled').each(function () {

            var watermark = $(this).data('watermark');
            var imageView = $(this).data('imageview');
            var imageMogr = $(this).data('imagemogr');

            if (watermark) {
                fopArr.push({
                    fop: 'watermark',
                    mode: 1,
                    image: 'http://www.b1.qiniudn.com/images/logo-2.png',
                    dissolve: 100,
                    gravity: watermark,
                    dx: 100,
                    dy: 100
                });
            }

            if (imageView) {
                var height;
                switch (imageView) {
                    case 'large':
                        height = originHeight;
                        break;
                    case 'middle':
                        height = originHeight * 0.5;
                        break;
                    case 'small':
                        height = originHeight * 0.1;
                        break;
                    default:
                        height = originHeight;
                        break;
                }
                fopArr.push({
                    fop: 'imageView2',
                    mode: 3,
                    h: parseInt(height, 10),
                    q: 100,
                    format: 'png'
                });
            }

            if (imageMogr === 'no-rotate') {
                fopArr.push({
                    'fop': 'imageMogr2',
                    'auto-orient': true,
                    'strip': true,
                    'rotate': 0,
                    'format': 'png'
                });
            }
        });

        var newUrl = Qiniu.pipeline(fopArr, key);

        var newImg = new Image();
        img.attr('src', 'loading.gif');
        newImg.onload = function () {
            img.attr('src', newUrl);
            img.parent('a').attr('href', newUrl);
        };
        newImg.src = newUrl;
        return false;
    });

});
