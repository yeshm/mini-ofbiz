<script type="text/javascript" charset="utf-8" src="/ext/assets/ueditor/1.4.3/ueditor.config.js"></script>
<script type="text/javascript" charset="utf-8" src="/ext/assets/ueditor/1.4.3/ueditor.all.js"></script>
<#include "/extcommon/webapp/extcommon/includes/imagePicker/imagePicker.ftl"/>
<script type="text/javascript">
    //Ueditor操作类
    app.ueditorHelper = {
        initEditor: function (options, operating) {
            var editorContainerId = options.editorContainerId;
            var setting = {
                // toolbars:[["fullscreen","fontfamily","fontsize","source","background","justifyleft","justifycenter","justifyright","justifyjustify","|","source","bold","italic","underline","|","insertorderedlist","insertunorderedlist","|","insertimage","|",'removeformat','forecolor','backcolor',"insertvideo","|",'emotion']],
                toolbars: [
                    [
                        "source", "|", "undo", "redo", "|", "bold", "italic", "underline", "strikethrough", "|", "superscript", "subscript", "|", "forecolor", "backcolor", "|", "removeformat", "|",
                        "insertorderedlist", "insertunorderedlist", "|", "selectall", "cleardoc", "rowspacingtop", "rowspacingbottom", "lineheight", "|", "paragraph", "|", "fontfamily", "fontsize",
                        "|", "justifyleft", "justifycenter", "justifyright", "justifyjustify", "|",
                        "link", "unlink", "|", "emotion", "insertvideo", "|", "map",
                        "|", "horizontal", "preview", "fullscreen"
                    ]
                ],
                initialFrameWidth: 700,
                initialFrameHeight: 200,
                zIndex: 500,
            };

            var setting = $.extend({}, setting, options);
            var ue = UE.getEditor(editorContainerId, setting);
            //为投票和万能表单添加使用页面的回调
            if (operating != undefined) {
                if (operating.vote) {
                    UE.dialogShow = operating.vote;
                }
                if (operating.defineForm) {
                    UE.dialogShowForDefineForm = operating.defineForm;
                }
            }
            this.initImageButton({
                editor: ue,
                editorContainerId: editorContainerId
            });
            return ue;
        },
        initWieinEditor: function (options) {
            var editorContainerId = options.editorContainerId;
            var setting = {
                // toolbars:[["fullscreen","fontfamily","fontsize","source","background","justifyleft","justifycenter","justifyright","justifyjustify","|","source","bold","italic","underline","|","insertorderedlist","insertunorderedlist","|","insertimage","|",'removeformat','forecolor','backcolor',"insertvideo","|",'emotion']],
                toolbars: [
                    ['bold', 'italic', 'underline', 'strikethrough', 'forecolor', 'backcolor',
                        'justifyleft', 'justifycenter', 'justifyright', '|', 'insertorderedlist', 'insertunorderedlist',
                        'blockquote'
                    ],
                    ['emotion', 'link', '|', 'removeformat',
                        'rowspacingtop', 'rowspacingbottom', 'lineheight', 'paragraph', 'fontsize'
                    ],
                    ['inserttable', 'deletetable', 'insertparagraphbeforetable', 'insertrow',
                        'deleterow', 'insertcol', 'deletecol', 'mergecells', 'mergeright', 'mergedown',
                        'splittocells', 'splittorows', 'splittocols'
                    ]
                ],
                zIndex: 1,
            };
            var setting = $.extend({}, setting, options);
            var ue = UE.getEditor(editorContainerId, setting);

            return ue;
        },
        initImageButton: function (options) {
            var editor = options.editor;
            var editorContainerId = options.editorContainerId;
            //修改上传图片按钮
            UE.registerUI('上传图片', function (editor, uiName) {
                //注册按钮执行时的command命令，使用命令默认就会带有回退操作
                editor.registerCommand(uiName, {
                    execCommand: function () {

                    }
                });
                //创建一个button
                var btn = new UE.ui.Button({
                    //按钮的名字
                    name: uiName,
                    //提示
                    title: uiName,
                    //需要添加的额外样式，指定icon图标，这里默认使用一个重复的icon
                    cssRules: 'background-position: -726px -77px;',
                    //点击时执行的命令
                    onclick: function () {
                        //这里可以不用执行命令,做你自己的操作也可
                        editor.execCommand(uiName);
                        app.imagePicker.initImagePicker({
                            imgChooseType: "multiterm",
                            imgUploadType: "multi",
                            multiCallback: function (imgList) {
                                var html = '<p>';
                                for (var i = 0; i < imgList.length; i++) {
                                    var imgnUrl = imgList[i].imgUrl;
                                    html += '<img width="99%" src="' + imgnUrl + '">';
                                }
                                html += '</p>';
                                editor.execCommand('insertHtml', html);
                            }
                        });
                    }
                });
                //当点到编辑内容上时，按钮要做的状态反射
                editor.addListener('selectionchange', function () {
                    var state = editor.queryCommandState(uiName);
                    if (state == -1) {
                        btn.setDisabled(true);
                        btn.setChecked(false);
                    } else {
                        btn.setDisabled(false);
                        btn.setChecked(state);
                    }
                });
                //因为你是添加button,所以需要返回这个button
                return btn;
            });
        }
    };
</script>

