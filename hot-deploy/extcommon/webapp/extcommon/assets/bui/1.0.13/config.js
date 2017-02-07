;
(function() {
  var bui_config_110_config_debug;
  bui_config_110_config_debug = function() {
    //from seajs
    function getScriptAbsoluteSrc(node) {
      return node.hasAttribute ? // non-IE6/7
        node.src : // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
        node.getAttribute('src', 4);
    }
    var BUI = window.BUI = window.BUI || {};
    BUI.use = seajs.use;
    BUI.config = seajs.config;
    var scripts = document.getElementsByTagName('script'),
      loaderScript = scripts[scripts.length - 1],
      src = getScriptAbsoluteSrc(loaderScript),
      loaderPath = src.substring(0, src.lastIndexOf('/')),
      // 不能用data 因为在把包的时候会把data替换成data
      debug = loaderScript.getAttribute('debug') === 'true' ? true : false;
    BUI.loaderScript = loaderScript;
    //配置bui的路径
    seajs.config({
      paths: {
        'bui': loaderPath
      }
    });
    BUI.setDebug = function(debug) {
      BUI.debug = debug;
      //只有bui目录下面的文件使用-min.js
      var regexp = new RegExp('^(' + loaderPath + '\\S*).js$');
      if (!debug) {
        seajs.config({
          map: [
            [
              regexp, '$1-min.js'
            ]
          ]
        });
      } else {
        var map = seajs.data.map;
        var mapReg;
        if (!map) {
          return;
        }
        for (var i = map.length - 1; i >= 0; i--) {
          mapReg = map[i][0];
          if (Object.prototype.toString.call(mapReg) === '[object RegExp]' && mapReg.toString() === regexp.toString()) {
            map.splice(i, 1);
          }
        }
      }
    };
    BUI.setDebug(true);
    // 所有的模块都是依赖于jquery, 所以定义一个jquery的模块，并直接返回
    if (window.jQuery) {
      window.define('jquery', [], function() {
        return window.jQuery;
      });
    }
  }();
}());