<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title></title>
    <link href="/bui_theme/assets/css/page_vote_card.css" rel="stylesheet" type="text/css"/>

</head>
<body>
<div class="msg_card">
    <div class="msg_card_inner">
        <div class="msg_card_bd">
            <h4 class="msg_card_title" id="jsVoteTitle">投票</h4>
            <div class="msg_card_extra_info">
                <ul class="vote_option_list" id="jsVoteList"></ul>
            </div>
        </div>
    </div>
</div>
<script type="text/javascript">
    ;(function(){
        function encode(text) {
            var r = text;
            //var ar=['&','&amp;','<','&lt;','>','&gt;',' ','&nbsp;','"','&quot;',"'",'&#39;','\\r','<br>','\\n','<br>'];
            var ar=['&','&amp;','<','&lt;','>','&gt;',' ','&nbsp;','"','&quot;',"'",'&#39;'];
            //if(!escape)ar.reverse();
            for(var i=0;i<ar.length;i+=2){
                try{
                    r=r.replace(new RegExp(ar[i],'g'),ar[1+i]);
                }catch(e){
                    r = null;
                }
            };
            return r;
        }

        function getParam(key, s){
            s = s || location.href;
            key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
            var match = s.match(new RegExp("[?&]"+key+"=([^&]+)(&|$)"));
            return match && decodeURIComponent(match[1].replace(/\+/g, " "));
        }

        var radioTemplate = ['<li class="vote_option">',
            '<label for="" class="frm_radio_label">',
            '<i class="icon_radio"></i>',
            '<input type="radio" class="frm_radio">',
            '<span class="lbl_content">...</span>',
            '</label>',
            '</li>'];

        var checkTemplate = ['<li class="vote_option">',
            '<label for="" class="frm_checkbox_label">',
            '<i class="icon_checkbox"></i>',
            '<input type="checkbox" class="frm_checkbox">',
            '<span class="lbl_content">...</span>',
            '</label>',
            '</li>'];

        try{
            var title = encode(getParam('title'));
            document.getElementById("jsVoteTitle").innerHTML = title;

            var tmpl = +getParam('isMlt') ? checkTemplate : radioTemplate;

            var ul = '';
            for (var i = 0; i < 6; i++) {
                ul += tmpl.join('');
            };

            document.getElementById("jsVoteList").innerHTML = ul;

            var lis = document.getElementsByTagName("li");
            for(var i = 0; i < 6; i++){
                var li = lis[i];
                var name = getParam('option' + i);

                if (name !== "null" && name !== 'undefined' && name) {
                    li.style.display = '';
                    li.getElementsByTagName('span')[0].innerHTML = encode(name);
                }
                else{
                    li.style.display = 'none';
                }
            }
        }
        catch(e){

        }
    })();
</script>
</body>
</html>