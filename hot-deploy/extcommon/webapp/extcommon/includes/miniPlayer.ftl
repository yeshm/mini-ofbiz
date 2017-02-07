<link type="text/css" rel="stylesheet" href="/ext/assets/jquery.mb.miniAudioPlayer/1.7.6/css/font.css">
<link type="text/css" rel="stylesheet" href="/ext/assets/jquery.mb.miniAudioPlayer/1.7.6/css/miniplayer.css">

<script type="text/javascript" src="/ext/assets/jquery.mb.miniAudioPlayer/1.7.6/inc/jquery.mb.miniPlayer.js"></script>
<script type="text/javascript" src="/ext/assets/jquery.mb.miniAudioPlayer/1.7.6/inc/jquery.jplayer.min.js"></script>

<script type="text/javascript">
    function initMiniPlayer(){
        var ua = navigator.userAgent.toLowerCase();
        var isAndroid = /android/.test(ua);
        var isAndroidDefault = isAndroid && !(/chrome/i).test(ua);
        if(isAndroidDefault){
            app.showError("对不起,您的浏览器不支持此音乐播放器");
        }

        $(".audio").mb_miniPlayer({
            width:150,
            inLine:false,
            id3:false,
            downloadPage:null
        });
    }
</script>
