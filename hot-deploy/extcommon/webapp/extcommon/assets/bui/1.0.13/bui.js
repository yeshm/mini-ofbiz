/**
 * Sea.js 2.2.1 | seajs.org/LICENSE.md
 */
(function(global, undefined) {

// Avoid conflicting when `sea.js` is loaded multiple times
if (global.seajs) {
  return
}

var seajs = global.seajs = {
  // The current version of Sea.js being used
  version: "2.2.1"
}

var data = seajs.data = {}


/**
 * util-lang.js - The minimal language enhancement
 */

function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) == "[object " + type + "]"
  }
}

var isObject = isType("Object")
var isString = isType("String")
var isArray = Array.isArray || isType("Array")
var isFunction = isType("Function")

var _cid = 0
function cid() {
  return _cid++
}


/**
 * util-events.js - The minimal events support
 */

var events = data.events = {}

// Bind event
seajs.on = function(name, callback) {
  var list = events[name] || (events[name] = [])
  list.push(callback)
  return seajs
}

// Remove event. If `callback` is undefined, remove all callbacks for the
// event. If `event` and `callback` are both undefined, remove all callbacks
// for all events
seajs.off = function(name, callback) {
  // Remove *all* events
  if (!(name || callback)) {
    events = data.events = {}
    return seajs
  }

  var list = events[name]
  if (list) {
    if (callback) {
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i] === callback) {
          list.splice(i, 1)
        }
      }
    }
    else {
      delete events[name]
    }
  }

  return seajs
}

// Emit event, firing all bound callbacks. Callbacks receive the same
// arguments as `emit` does, apart from the event name
var emit = seajs.emit = function(name, data) {
  var list = events[name], fn

  if (list) {
    // Copy callback lists to prevent modification
    list = list.slice()

    // Execute event callbacks
    while ((fn = list.shift())) {
      fn(data)
    }
  }

  return seajs
}


/**
 * util-path.js - The utilities for operating path such as id, uri
 */

var DIRNAME_RE = /[^?#]*\//

var DOT_RE = /\/\.\//g
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
var DOUBLE_SLASH_RE = /([^:/])\/\//g

// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
function dirname(path) {
  return path.match(DIRNAME_RE)[0]
}

// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
function realpath(path) {
  // /a/b/./c/./d ==> /a/b/c/d
  path = path.replace(DOT_RE, "/")

  // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/")
  }

  // a//b/c  ==>  a/b/c
  path = path.replace(DOUBLE_SLASH_RE, "$1/")

  return path
}

// Normalize an id
// normalize("path/to/a") ==> "path/to/a.js"
// NOTICE: substring is faster than negative slice and RegExp
function normalize(path) {
  var last = path.length - 1
  var lastC = path.charAt(last)

  // If the uri ends with `#`, just return it without '#'
  if (lastC === "#") {
    return path.substring(0, last)
  }

  return (path.substring(last - 2) === ".js" ||
      path.indexOf("?") > 0 ||
      path.substring(last - 3) === ".css" ||
      lastC === "/") ? path : path + ".js"
}


var PATHS_RE = /^([^/:]+)(\/.+)$/
var VARS_RE = /{([^{]+)}/g

function parseAlias(id) {
  var alias = data.alias
  return alias && isString(alias[id]) ? alias[id] : id
}

function parsePaths(id) {
  var paths = data.paths
  var m

  if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
    id = paths[m[1]] + m[2]
  }

  return id
}

function parseVars(id) {
  var vars = data.vars

  if (vars && id.indexOf("{") > -1) {
    id = id.replace(VARS_RE, function(m, key) {
      return isString(vars[key]) ? vars[key] : m
    })
  }

  return id
}

function parseMap(uri) {
  var map = data.map
  var ret = uri

  if (map) {
    for (var i = 0, len = map.length; i < len; i++) {
      var rule = map[i]

      ret = isFunction(rule) ?
          (rule(uri) || uri) :
          uri.replace(rule[0], rule[1])

      // Only apply the first matched rule
      if (ret !== uri) break
    }
  }

  return ret
}


var ABSOLUTE_RE = /^\/\/.|:\//
var ROOT_DIR_RE = /^.*?\/\/.*?\//

function addBase(id, refUri) {
  var ret
  var first = id.charAt(0)

  // Absolute
  if (ABSOLUTE_RE.test(id)) {
    ret = id
  }
  // Relative
  else if (first === ".") {
    ret = realpath((refUri ? dirname(refUri) : data.cwd) + id)
  }
  // Root
  else if (first === "/") {
    var m = data.cwd.match(ROOT_DIR_RE)
    ret = m ? m[0] + id.substring(1) : id
  }
  // Top-level
  else {
    ret = data.base + id
  }

  // Add default protocol when uri begins with "//"
  if (ret.indexOf("//") === 0) {
    ret = location.protocol + ret
  }

  return ret
}

function id2Uri(id, refUri) {
  if (!id) return ""

  id = parseAlias(id)
  id = parsePaths(id)
  id = parseVars(id)
  id = normalize(id)

  var uri = addBase(id, refUri)
  uri = parseMap(uri)

  return uri
}


var doc = document
var cwd = dirname(doc.URL)
var scripts = doc.scripts

// Recommend to add `seajsnode` id for the `sea.js` script element
var loaderScript = doc.getElementById("seajsnode") ||
    scripts[scripts.length - 1]

// When `sea.js` is inline, set loaderDir to current working directory
var loaderDir = dirname(getScriptAbsoluteSrc(loaderScript) || cwd)

function getScriptAbsoluteSrc(node) {
  return node.hasAttribute ? // non-IE6/7
      node.src :
    // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
      node.getAttribute("src", 4)
}


// For Developers
seajs.resolve = id2Uri


/**
 * util-request.js - The utilities for requesting script and style files
 * ref: tests/research/load-js-css/test.html
 */

var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement
var baseElement = head.getElementsByTagName("base")[0]

var IS_CSS_RE = /\.css(?:\?|$)/i
var currentlyAddingScript
var interactiveScript

// `onload` event is not supported in WebKit < 535.23 and Firefox < 9.0
// ref:
//  - https://bugs.webkit.org/show_activity.cgi?id=38995
//  - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
//  - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
var isOldWebKit = +navigator.userAgent
    .replace(/.*(?:AppleWebKit|AndroidWebKit)\/(\d+).*/, "$1") < 536


function request(url, callback, charset) {
  var isCSS = IS_CSS_RE.test(url)
  var node = doc.createElement(isCSS ? "link" : "script")

  if (charset) {
    var cs = isFunction(charset) ? charset(url) : charset
    if (cs) {
      node.charset = cs
    }
  }

  addOnload(node, callback, isCSS, url)

  if (isCSS) {
    node.rel = "stylesheet"
    node.href = url
  }
  else {
    node.async = true
    node.src = url
  }

  // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
  // the end of the insert execution, so use `currentlyAddingScript` to
  // hold current node, for deriving url in `define` call
  currentlyAddingScript = node

  // ref: #185 & http://dev.jquery.com/ticket/2709
  baseElement ?
      head.insertBefore(node, baseElement) :
      head.appendChild(node)

  currentlyAddingScript = null
}

function addOnload(node, callback, isCSS, url) {
  var supportOnload = "onload" in node

  // for Old WebKit and Old Firefox
  if (isCSS && (isOldWebKit || !supportOnload)) {
    setTimeout(function() {
      pollCss(node, callback)
    }, 1) // Begin after node insertion
    return
  }

  if (supportOnload) {
    node.onload = onload
    node.onerror = function() {
      emit("error", { uri: url, node: node })
      onload()
    }
  }
  else {
    node.onreadystatechange = function() {
      if (/loaded|complete/.test(node.readyState)) {
        onload()
      }
    }
  }

  function onload() {
    // Ensure only run once and handle memory leak in IE
    node.onload = node.onerror = node.onreadystatechange = null

    // Remove the script to reduce memory leak
    if (!isCSS && !data.debug) {
      head.removeChild(node)
    }

    // Dereference the node
    node = null

    callback()
  }
}

function pollCss(node, callback) {
  var sheet = node.sheet
  var isLoaded

  // for WebKit < 536
  if (isOldWebKit) {
    if (sheet) {
      isLoaded = true
    }
  }
  // for Firefox < 9.0
  else if (sheet) {
    try {
      if (sheet.cssRules) {
        isLoaded = true
      }
    } catch (ex) {
      // The value of `ex.name` is changed from "NS_ERROR_DOM_SECURITY_ERR"
      // to "SecurityError" since Firefox 13.0. But Firefox is less than 9.0
      // in here, So it is ok to just rely on "NS_ERROR_DOM_SECURITY_ERR"
      if (ex.name === "NS_ERROR_DOM_SECURITY_ERR") {
        isLoaded = true
      }
    }
  }

  setTimeout(function() {
    if (isLoaded) {
      // Place callback here to give time for style rendering
      callback()
    }
    else {
      pollCss(node, callback)
    }
  }, 20)
}

function getCurrentScript() {
  if (currentlyAddingScript) {
    return currentlyAddingScript
  }

  // For IE6-9 browsers, the script onload event may not fire right
  // after the script is evaluated. Kris Zyp found that it
  // could query the script nodes and the one that is in "interactive"
  // mode indicates the current script
  // ref: http://goo.gl/JHfFW
  if (interactiveScript && interactiveScript.readyState === "interactive") {
    return interactiveScript
  }

  var scripts = head.getElementsByTagName("script")

  for (var i = scripts.length - 1; i >= 0; i--) {
    var script = scripts[i]
    if (script.readyState === "interactive") {
      interactiveScript = script
      return interactiveScript
    }
  }
}


// For Developers
seajs.request = request


/**
 * util-deps.js - The parser for dependencies
 * ref: tests/research/parse-dependencies/test.html
 */

var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g
var SLASH_RE = /\\\\/g

function parseDependencies(code) {
  var ret = []

  code.replace(SLASH_RE, "")
      .replace(REQUIRE_RE, function(m, m1, m2) {
        if (m2) {
          ret.push(m2)
        }
      })

  return ret
}


/**
 * module.js - The core of module loader
 */

var cachedMods = seajs.cache = {}
var anonymousMeta

var fetchingList = {}
var fetchedList = {}
var callbackList = {}

var STATUS = Module.STATUS = {
  // 1 - The `module.uri` is being fetched
  FETCHING: 1,
  // 2 - The meta data has been saved to cachedMods
  SAVED: 2,
  // 3 - The `module.dependencies` are being loaded
  LOADING: 3,
  // 4 - The module are ready to execute
  LOADED: 4,
  // 5 - The module is being executed
  EXECUTING: 5,
  // 6 - The `module.exports` is available
  EXECUTED: 6
}


function Module(uri, deps) {
  this.uri = uri
  this.dependencies = deps || []
  this.exports = null
  this.status = 0

  // Who depends on me
  this._waitings = {}

  // The number of unloaded dependencies
  this._remain = 0
}

// Resolve module.dependencies
Module.prototype.resolve = function() {
  var mod = this
  var ids = mod.dependencies
  var uris = []

  for (var i = 0, len = ids.length; i < len; i++) {
    uris[i] = Module.resolve(ids[i], mod.uri)
  }
  return uris
}

// Load module.dependencies and fire onload when all done
Module.prototype.load = function() {
  var mod = this

  // If the module is being loaded, just wait it onload call
  if (mod.status >= STATUS.LOADING) {
    return
  }

  mod.status = STATUS.LOADING

  // Emit `load` event for plugins such as combo plugin
  var uris = mod.resolve()
  emit("load", uris)

  var len = mod._remain = uris.length
  var m

  // Initialize modules and register waitings
  for (var i = 0; i < len; i++) {
    m = Module.get(uris[i])

    if (m.status < STATUS.LOADED) {
      // Maybe duplicate: When module has dupliate dependency, it should be it's count, not 1
      m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1
    }
    else {
      mod._remain--
    }
  }

  if (mod._remain === 0) {
    mod.onload()
    return
  }

  // Begin parallel loading
  var requestCache = {}

  for (i = 0; i < len; i++) {
    m = cachedMods[uris[i]]

    if (m.status < STATUS.FETCHING) {
      m.fetch(requestCache)
    }
    else if (m.status === STATUS.SAVED) {
      m.load()
    }
  }

  // Send all requests at last to avoid cache bug in IE6-9. Issues#808
  for (var requestUri in requestCache) {
    if (requestCache.hasOwnProperty(requestUri)) {
      requestCache[requestUri]()
    }
  }
}

// Call this method when module is loaded
Module.prototype.onload = function() {
  var mod = this
  mod.status = STATUS.LOADED

  if (mod.callback) {
    mod.callback()
  }

  // Notify waiting modules to fire onload
  var waitings = mod._waitings
  var uri, m

  for (uri in waitings) {
    if (waitings.hasOwnProperty(uri)) {
      m = cachedMods[uri]
      m._remain -= waitings[uri]
      if (m._remain === 0) {
        m.onload()
      }
    }
  }

  // Reduce memory taken
  delete mod._waitings
  delete mod._remain
}

// Fetch a module
Module.prototype.fetch = function(requestCache) {
  var mod = this
  var uri = mod.uri

  mod.status = STATUS.FETCHING

  // Emit `fetch` event for plugins such as combo plugin
  var emitData = { uri: uri }
  emit("fetch", emitData)
  var requestUri = emitData.requestUri || uri

  // Empty uri or a non-CMD module
  if (!requestUri || fetchedList[requestUri]) {
    mod.load()
    return
  }

  if (fetchingList[requestUri]) {
    callbackList[requestUri].push(mod)
    return
  }

  fetchingList[requestUri] = true
  callbackList[requestUri] = [mod]

  // Emit `request` event for plugins such as text plugin
  emit("request", emitData = {
    uri: uri,
    requestUri: requestUri,
    onRequest: onRequest,
    charset: data.charset
  })

  if (!emitData.requested) {
    requestCache ?
        requestCache[emitData.requestUri] = sendRequest :
        sendRequest()
  }

  function sendRequest() {
    seajs.request(emitData.requestUri, emitData.onRequest, emitData.charset)
  }

  function onRequest() {
    delete fetchingList[requestUri]
    fetchedList[requestUri] = true

    // Save meta data of anonymous module
    if (anonymousMeta) {
      Module.save(uri, anonymousMeta)
      anonymousMeta = null
    }

    // Call callbacks
    var m, mods = callbackList[requestUri]
    delete callbackList[requestUri]
    while ((m = mods.shift())) m.load()
  }
}

// Execute a module
Module.prototype.exec = function () {
  var mod = this

  // When module is executed, DO NOT execute it again. When module
  // is being executed, just return `module.exports` too, for avoiding
  // circularly calling
  if (mod.status >= STATUS.EXECUTING) {
    return mod.exports
  }

  mod.status = STATUS.EXECUTING

  // Create require
  var uri = mod.uri

  function require(id) {
    return Module.get(require.resolve(id)).exec()
  }

  require.resolve = function(id) {
    return Module.resolve(id, uri)
  }

  require.async = function(ids, callback) {
    Module.use(ids, callback, uri + "_async_" + cid())
    return require
  }

  // Exec factory
  var factory = mod.factory

  var exports = isFunction(factory) ?
      factory(require, mod.exports = {}, mod) :
      factory

  if (exports === undefined) {
    exports = mod.exports
  }

  // Reduce memory leak
  delete mod.factory

  mod.exports = exports
  mod.status = STATUS.EXECUTED

  // Emit `exec` event
  emit("exec", mod)

  return exports
}

// Resolve id to uri
Module.resolve = function(id, refUri) {
  // Emit `resolve` event for plugins such as text plugin
  var emitData = { id: id, refUri: refUri }
  emit("resolve", emitData)

  return emitData.uri || seajs.resolve(emitData.id, refUri)
}

// Define a module
Module.define = function (id, deps, factory) {
  var argsLen = arguments.length

  // define(factory)
  if (argsLen === 1) {
    factory = id
    id = undefined
  }
  else if (argsLen === 2) {
    factory = deps

    // define(deps, factory)
    if (isArray(id)) {
      deps = id
      id = undefined
    }
    // define(id, factory)
    else {
      deps = undefined
    }
  }

  // Parse dependencies according to the module factory code
  if (!isArray(deps) && isFunction(factory)) {
    deps = parseDependencies(factory.toString())
  }

  var meta = {
    id: id,
    uri: Module.resolve(id),
    deps: deps,
    factory: factory
  }

  // Try to derive uri in IE6-9 for anonymous modules
  if (!meta.uri && doc.attachEvent) {
    var script = getCurrentScript()

    if (script) {
      meta.uri = script.src
    }

    // NOTE: If the id-deriving methods above is failed, then falls back
    // to use onload event to get the uri
  }

  // Emit `define` event, used in nocache plugin, seajs node version etc
  emit("define", meta)

  meta.uri ? Module.save(meta.uri, meta) :
      // Save information for "saving" work in the script onload event
      anonymousMeta = meta
}

// Save meta data to cachedMods
Module.save = function(uri, meta) {
  var mod = Module.get(uri)

  // Do NOT override already saved modules
  if (mod.status < STATUS.SAVED) {
    mod.id = meta.id || uri
    mod.dependencies = meta.deps || []
    mod.factory = meta.factory
    mod.status = STATUS.SAVED
  }
}

// Get an existed module or create a new one
Module.get = function(uri, deps) {
  return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps))
}

// Use function is equal to load a anonymous module
Module.use = function (ids, callback, uri) {
  var mod = Module.get(uri, isArray(ids) ? ids : [ids])

  mod.callback = function() {
    var exports = []
    var uris = mod.resolve()

    for (var i = 0, len = uris.length; i < len; i++) {
      exports[i] = cachedMods[uris[i]].exec()
    }

    if (callback) {
      callback.apply(global, exports)
    }

    delete mod.callback
  }

  mod.load()
}

// Load preload modules before all other modules
Module.preload = function(callback) {
  var preloadMods = data.preload
  var len = preloadMods.length

  if (len) {
    Module.use(preloadMods, function() {
      // Remove the loaded preload modules
      preloadMods.splice(0, len)

      // Allow preload modules to add new preload modules
      Module.preload(callback)
    }, data.cwd + "_preload_" + cid())
  }
  else {
    callback()
  }
}


// Public API

seajs.use = function(ids, callback) {
  Module.preload(function() {
    Module.use(ids, callback, data.cwd + "_use_" + cid())
  })
  return seajs
}

Module.define.cmd = {}
global.define = Module.define


// For Developers

seajs.Module = Module
data.fetchedList = fetchedList
data.cid = cid

seajs.require = function(id) {
  var mod = Module.get(Module.resolve(id))
  if (mod.status < STATUS.EXECUTING) {
    mod.onload()
    mod.exec()
  }
  return mod.exports
}


/**
 * config.js - The configuration for the loader
 */

var BASE_RE = /^(.+?\/)(\?\?)?(seajs\/)+/

// The root path to use for id2uri parsing
// If loaderUri is `http://test.com/libs/seajs/[??][seajs/1.2.3/]sea.js`, the
// baseUri should be `http://test.com/libs/`
data.base = (loaderDir.match(BASE_RE) || ["", loaderDir])[1]

// The loader directory
data.dir = loaderDir

// The current working directory
data.cwd = cwd

// The charset for requesting files
data.charset = "utf-8"

// Modules that are needed to load before all other modules
data.preload = (function() {
  var plugins = []

  // Convert `seajs-xxx` to `seajs-xxx=1`
  // NOTE: use `seajs-xxx=1` flag in uri or cookie to preload `seajs-xxx`
  var str = location.search.replace(/(seajs-\w+)(&|$)/g, "$1=1$2")

  // Add cookie string
  str += " " + doc.cookie

  // Exclude seajs-xxx=0
  str.replace(/(seajs-\w+)=1/g, function(m, name) {
    plugins.push(name)
  })

  return plugins
})()

// data.alias - An object containing shorthands of module id
// data.paths - An object containing path shorthands in module id
// data.vars - The {xxx} variables in module id
// data.map - An array containing rules to map module uri
// data.debug - Debug mode. The default value is false

seajs.config = function(configData) {

  for (var key in configData) {
    var curr = configData[key]
    var prev = data[key]

    // Merge object config such as alias, vars
    if (prev && isObject(prev)) {
      for (var k in curr) {
        prev[k] = curr[k]
      }
    }
    else {
      // Concat array config such as map, preload
      if (isArray(prev)) {
        curr = prev.concat(curr)
      }
      // Make sure that `data.base` is an absolute path
      else if (key === "base") {
        // Make sure end with "/"
        if (curr.slice(-1) !== "/") {
          curr += "/"
        }
        curr = addBase(curr)
      }

      // Set config
      data[key] = curr
    }
  }

  emit("config", configData)
  return seajs
}

})(this);

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
    BUI.setDebug(debug);
    // 所有的模块都是依赖于jquery, 所以定义一个jquery的模块，并直接返回
    if (window.jQuery) {
      window.define('jquery', [], function() {
        return window.jQuery;
      });
    }
  }();
}());
define("bui/common", ["jquery"], function(require, exports, module) {
  var BUI = require("bui/common/util");
  BUI.mix(BUI, {
    UA: require("bui/common/ua"),
    JSON: require("bui/common/json"),
    Date: require("bui/common/date"),
    Array: require("bui/common/array"),
    KeyCode: require("bui/common/keycode"),
    Observable: require("bui/common/observable"),
    Base: require("bui/common/base"),
    Component: require("bui/common/component/component")
  });
  module.exports = BUI;
});
define("bui/common/util", ["jquery"], function(require, exports, module) {
  /**
   * @class BUI
   * 控件库的工具方法，这些工具方法直接绑定到BUI对象上
   * <pre><code>
   *   BUI.isString(str);
   *
   *   BUI.extend(A,B);
   *
   *   BUI.mix(A,{a:'a'});
   * </code></pre>
   * @singleton
   */
  var $ = require('jquery');
  //兼容jquery 1.6以下
  (function($) {
    if ($.fn) {
      $.fn.on = $.fn.on || $.fn.bind;
      $.fn.off = $.fn.off || $.fn.unbind;
    }
  })($);
  /**
   * @ignore
   * 处于效率的目的，复制属性
   */
  function mixAttrs(to, from) {
      for (var c in from) {
        if (from.hasOwnProperty(c)) {
          to[c] = to[c] || {};
          mixAttr(to[c], from[c]);
        }
      }
    }
    //合并属性
  function mixAttr(attr, attrConfig) {
    for (var p in attrConfig) {
      if (attrConfig.hasOwnProperty(p)) {
        if (p == 'value') {
          if (BUI.isObject(attrConfig[p])) {
            attr[p] = attr[p] || {};
            BUI.mix( /*true,*/ attr[p], attrConfig[p]);
          } else if (BUI.isArray(attrConfig[p])) {
            attr[p] = attr[p] || [];
            //BUI.mix(/*true,*/attr[p], attrConfig[p]);
            attr[p] = attr[p].concat(attrConfig[p]);
          } else {
            attr[p] = attrConfig[p];
          }
        } else {
          attr[p] = attrConfig[p];
        }
      }
    };
  }
  var win = window,
    doc = document,
    objectPrototype = Object.prototype,
    toString = objectPrototype.toString,
    BODY = 'body',
    DOC_ELEMENT = 'documentElement',
    SCROLL = 'scroll',
    SCROLL_WIDTH = SCROLL + 'Width',
    SCROLL_HEIGHT = SCROLL + 'Height',
    ATTRS = 'ATTRS',
    PARSER = 'PARSER',
    GUID_DEFAULT = 'guid';
  window.BUI = window.BUI || {};
  $.extend(BUI, {
    /**
     * 版本号
     * @memberOf BUI
     * @type {Number}
     */
    version: '1.1.0',
    /**
     * 是否为函数
     * @param  {*} fn 对象
     * @return {Boolean}  是否函数
     */
    isFunction: function(fn) {
      return typeof(fn) === 'function';
    },
    /**
     * 是否数组
     * @method
     * @param  {*}  obj 是否数组
     * @return {Boolean}  是否数组
     */
    isArray: ('isArray' in Array) ? Array.isArray : function(value) {
      return toString.call(value) === '[object Array]';
    },
    /**
     * 是否日期
     * @param  {*}  value 对象
     * @return {Boolean}  是否日期
     */
    isDate: function(value) {
      return toString.call(value) === '[object Date]';
    },
    /**
     * 是否是javascript对象
     * @param {Object} value The value to test
     * @return {Boolean}
     * @method
     */
    isObject: (toString.call(null) === '[object Object]') ? function(value) {
      // check ownerDocument here as well to exclude DOM nodes
      return value !== null && value !== undefined && toString.call(value) === '[object Object]' && value.ownerDocument === undefined;
    } : function(value) {
      return toString.call(value) === '[object Object]';
    },
    /**
     * 是否是数字或者数字字符串
     * @param  {String}  value 数字字符串
     * @return {Boolean}  是否是数字或者数字字符串
     */
    isNumeric: function(value) {
      return !isNaN(parseFloat(value)) && isFinite(value);
    },
    /**
     * 将指定的方法或属性放到构造函数的原型链上，
     * 函数支持多于2个变量，后面的变量同s1一样将其成员复制到构造函数的原型链上。
     * @param  {Function} r  构造函数
     * @param  {Object} s1 将s1 的成员复制到构造函数的原型链上
     *      @example
     *      BUI.augment(class1,{
     *        method1: function(){
     *
     *        }
     *      });
     */
    augment: function(r, s1) {
      if (!BUI.isFunction(r)) {
        return r;
      }
      for (var i = 1; i < arguments.length; i++) {
        BUI.mix(r.prototype, arguments[i].prototype || arguments[i]);
      };
      return r;
    },
    /**
     * 拷贝对象
     * @param  {Object} obj 要拷贝的对象
     * @return {Object} 拷贝生成的对象
     */
    cloneObject: function(obj) {
      var result = BUI.isArray(obj) ? [] : {};
      return BUI.mix(true, result, obj);
    },
    /**
     * 抛出错误
     */
    error: function(msg) {
      if (BUI.debug) {
        throw msg;
      }
    },
    /**
     * 实现类的继承，通过父类生成子类
     * @param  {Function} subclass
     * @param  {Function} superclass 父类构造函数
     * @param  {Object} overrides  子类的属性或者方法
     * @return {Function} 返回的子类构造函数
     * 示例:
     *    @example
     *    //父类
     *    function base(){
     *
     *    }
     *
     *    function sub(){
     *
     *    }
     *    //子类
     *    BUI.extend(sub,base,{
     *      method : function(){
     *
     *      }
     *    });
     *
     *    //或者
     *    var sub = BUI.extend(base,{});
     */
    extend: function(subclass, superclass, overrides, staticOverrides) {
      //如果只提供父类构造函数，则自动生成子类构造函数
      if (!BUI.isFunction(superclass)) {
        overrides = superclass;
        superclass = subclass;
        subclass = function() {};
      }
      var create = Object.create ? function(proto, c) {
        return Object.create(proto, {
          constructor: {
            value: c
          }
        });
      } : function(proto, c) {
        function F() {}
        F.prototype = proto;
        var o = new F();
        o.constructor = c;
        return o;
      };
      var superObj = create(superclass.prototype, subclass); //new superclass(),//实例化父类作为子类的prototype
      subclass.prototype = BUI.mix(superObj, subclass.prototype); //指定子类的prototype
      subclass.superclass = create(superclass.prototype, superclass);
      BUI.mix(superObj, overrides);
      BUI.mix(subclass, staticOverrides);
      return subclass;
    },
    /**
     * 生成唯一的Id
     * @method
     * @param {String} prefix 前缀
     * @default 'bui-guid'
     * @return {String} 唯一的编号
     */
    guid: (function() {
      var map = {};
      return function(prefix) {
        prefix = prefix || BUI.prefix + GUID_DEFAULT;
        if (!map[prefix]) {
          map[prefix] = 1;
        } else {
          map[prefix] += 1;
        }
        return prefix + map[prefix];
      };
    })(),
    /**
     * 判断是否是字符串
     * @return {Boolean} 是否是字符串
     */
    isString: function(value) {
      return typeof value === 'string';
    },
    /**
     * 判断是否数字，由于$.isNumberic方法会把 '123'认为数字
     * @return {Boolean} 是否数字
     */
    isNumber: function(value) {
      return typeof value === 'number';
    },
    /**
     * 是否是布尔类型
     *
     * @param {Object} value 测试的值
     * @return {Boolean}
     */
    isBoolean: function(value) {
      return typeof value === 'boolean';
    },
    /**
     * 控制台输出日志
     * @param  {Object} obj 输出的数据
     */
    log: function(obj) {
      if (BUI.debug && win.console && win.console.log) {
        win.console.log(obj);
      }
    },
    /**
     * 将多个对象的属性复制到一个新的对象
     */
    merge: function() {
      var args = $.makeArray(arguments),
        first = args[0];
      if (BUI.isBoolean(first)) {
        args.shift();
        args.unshift({});
        args.unshift(first);
      } else {
        args.unshift({});
      }
      return BUI.mix.apply(null, args);
    },
    /**
     * 封装 jQuery.extend 方法，将多个对象的属性merge到第一个对象中
     * @return {Object}
     */
    mix: function() {
      return $.extend.apply(null, arguments);
    },
    /**
     * 创造顶层的命名空间，附加到window对象上,
     * 包含namespace方法
     */
    app: function(name) {
      if (!window[name]) {
        window[name] = {
          namespace: function(nsName) {
            return BUI.namespace(nsName, window[name]);
          }
        };
      }
      return window[name];
    },
    mixAttrs: mixAttrs,
    mixAttr: mixAttr,
    /**
     * 将其他类作为mixin集成到指定类上面
     * @param {Function} c 构造函数
     * @param {Array} mixins 扩展类
     * @param {Array} attrs 扩展的静态属性，默认为['ATTRS']
     * @return {Function} 传入的构造函数
     */
    mixin: function(c, mixins, attrs) {
      attrs = attrs || [ATTRS, PARSER];
      var extensions = mixins;
      if (extensions) {
        c.mixins = extensions;
        var desc = {
            // ATTRS:
            // HTML_PARSER:
          },
          constructors = extensions['concat'](c);
        // [ex1,ex2]，扩展类后面的优先，ex2 定义的覆盖 ex1 定义的
        // 主类最优先
        BUI.each(constructors, function(ext) {
          if (ext) {
            // 合并 ATTRS/HTML_PARSER 到主类
            BUI.each(attrs, function(K) {
              if (ext[K]) {
                desc[K] = desc[K] || {};
                // 不覆盖主类上的定义，因为继承层次上扩展类比主类层次高
                // 但是值是对象的话会深度合并
                // 注意：最好值是简单对象，自定义 new 出来的对象就会有问题(用 function return 出来)!
                if (K == 'ATTRS') {
                  //BUI.mix(true,desc[K], ext[K]);
                  mixAttrs(desc[K], ext[K]);
                } else {
                  BUI.mix(desc[K], ext[K]);
                }
              }
            });
          }
        });
        BUI.each(desc, function(v, k) {
          c[k] = v;
        });
        var prototype = {};
        // 主类最优先
        BUI.each(constructors, function(ext) {
          if (ext) {
            var proto = ext.prototype;
            // 合并功能代码到主类，不覆盖
            for (var p in proto) {
              // 不覆盖主类，但是主类的父类还是覆盖吧
              if (proto.hasOwnProperty(p)) {
                prototype[p] = proto[p];
              }
            }
          }
        });
        BUI.each(prototype, function(v, k) {
          c.prototype[k] = v;
        });
      }
      return c;
    },
    /**
     * 生成命名空间
     * @param  {String} name 命名空间的名称
     * @param  {Object} baseNS 在已有的命名空间上创建命名空间，默认“BUI”
     * @return {Object} 返回的命名空间对象
     *    @example
     *    BUI.namespace("Grid"); // BUI.Grid
     */
    namespace: function(name, baseNS) {
      baseNS = baseNS || BUI;
      if (!name) {
        return baseNS;
      }
      var list = name.split('.'),
        //firstNS = win[list[0]],
        curNS = baseNS;
      for (var i = 0; i < list.length; i++) {
        var nsName = list[i];
        if (!curNS[nsName]) {
          curNS[nsName] = {};
        }
        curNS = curNS[nsName];
      };
      return curNS;
    },
    /**
     * BUI 控件的公用前缀
     * @type {String}
     */
    prefix: 'bui-',
    /**
     * 替换字符串中的字段.
     * @param {String} str 模版字符串
     * @param {Object} o json data
     * @param {RegExp} [regexp] 匹配字符串的正则表达式
     */
    substitute: function(str, o, regexp) {
      if (!BUI.isString(str) || (!BUI.isObject(o)) && !BUI.isArray(o)) {
        return str;
      }
      return str.replace(regexp || /\\?\{([^{}]+)\}/g, function(match, name) {
        if (match.charAt(0) === '\\') {
          return match.slice(1);
        }
        return (o[name] === undefined) ? '' : o[name];
      });
    },
    /**
     * 将$.param的反操作
     * jquery只提供param方法
     * @return {[type]} [description]
     */
    unparam: function(str) {
      if (typeof str != 'string' || !(str = $.trim(str))) {
        return {};
      }
      var pairs = str.split('&'),
        pairsArr,
        rst = {};
      for (var i = pairs.length - 1; i >= 0; i--) {
        pairsArr = pairs[i].split('=');
        rst[pairsArr[0]] = decodeURIComponent(pairsArr[1]);
      }
      return rst;
    },
    /**
     * 使第一个字母变成大写
     * @param  {String} s 字符串
     * @return {String} 首字母大写后的字符串
     */
    ucfirst: function(s) {
      s += '';
      return s.charAt(0).toUpperCase() + s.substring(1);
    },
    /**
     * 页面上的一点是否在用户的视图内
     * @param {Object} offset 坐标，left,top
     * @return {Boolean} 是否在视图内
     */
    isInView: function(offset) {
      var left = offset.left,
        top = offset.top,
        viewWidth = BUI.viewportWidth(),
        wiewHeight = BUI.viewportHeight(),
        scrollTop = BUI.scrollTop(),
        scrollLeft = BUI.scrollLeft();
      //判断横坐标
      if (left < scrollLeft || left > scrollLeft + viewWidth) {
        return false;
      }
      //判断纵坐标
      if (top < scrollTop || top > scrollTop + wiewHeight) {
        return false;
      }
      return true;
    },
    /**
     * 页面上的一点纵向坐标是否在用户的视图内
     * @param {Object} top  纵坐标
     * @return {Boolean} 是否在视图内
     */
    isInVerticalView: function(top) {
      var wiewHeight = BUI.viewportHeight(),
        scrollTop = BUI.scrollTop();
      //判断纵坐标
      if (top < scrollTop || top > scrollTop + wiewHeight) {
        return false;
      }
      return true;
    },
    /**
     * 页面上的一点横向坐标是否在用户的视图内
     * @param {Object} left 横坐标
     * @return {Boolean} 是否在视图内
     */
    isInHorizontalView: function(left) {
      var viewWidth = BUI.viewportWidth(),
        scrollLeft = BUI.scrollLeft();
      //判断横坐标
      if (left < scrollLeft || left > scrollLeft + viewWidth) {
        return false;
      }
      return true;
    },
    /**
     * 获取窗口可视范围宽度
     * @return {Number} 可视区宽度
     */
    viewportWidth: function() {
      return $(window).width();
    },
    /**
     * 获取窗口可视范围高度
     * @return {Number} 可视区高度
     */
    viewportHeight: function() {
      return $(window).height();
    },
    /**
     * 滚动到窗口的left位置
     */
    scrollLeft: function() {
      return $(window).scrollLeft();
    },
    /**
     * 滚动到横向位置
     */
    scrollTop: function() {
      return $(window).scrollTop();
    },
    /**
     * 窗口宽度
     * @return {Number} 窗口宽度
     */
    docWidth: function() {
      return Math.max(this.viewportWidth(), doc[DOC_ELEMENT][SCROLL_WIDTH], doc[BODY][SCROLL_WIDTH]);
    },
    /**
     * 窗口高度
     * @return {Number} 窗口高度
     */
    docHeight: function() {
      return Math.max(this.viewportHeight(), doc[DOC_ELEMENT][SCROLL_HEIGHT], doc[BODY][SCROLL_HEIGHT]);
    },
    /**
     * 遍历数组或者对象
     * @param {Object|Array} element/Object 数组中的元素或者对象的值
     * @param {Function} func 遍历的函数 function(elememt,index){} 或者 function(value,key){}
     */
    each: function(elements, func) {
      if (!elements) {
        return;
      }
      $.each(elements, function(k, v) {
        return func(v, k);
      });
    },
    /**
     * 封装事件，便于使用上下文this,和便于解除事件时使用
     * @protected
     * @param  {Object} self   对象
     * @param  {String} action 事件名称
     */
    wrapBehavior: function(self, action) {
      return self['__bui_wrap_' + action] = function(e) {
        if (!self.get('disabled')) {
          self[action](e);
        }
      };
    },
    /**
     * 获取封装的事件
     * @protected
     * @param  {Object} self   对象
     * @param  {String} action 事件名称
     */
    getWrapBehavior: function(self, action) {
      return self['__bui_wrap_' + action];
    },
    /**
     * 获取页面上使用了此id的控件
     * @param  {String} id 控件id
     * @return {BUI.Component.Controller}  查找的控件
     */
    getControl: function(id) {
      return BUI.Component.Manager.getComponent(id);
    },
    /**
     * 设置对象的属性，支持深度设置属性值
     *
     *   @example
     *   BUI.setValue(obj,'a.b.c',value) //obj.a.b.c = value;
     * @param {Object} obj   对象
     * @param {String} name  名称
     * @param {String} value 值
     */
    setValue: function(obj, name, value) {
      if (!obj && !name) {
        return obj;
      }
      var arr = name.split('.'),
        curObj = obj,
        len = arr.length;
      for (var i = 0; i < len; i++) {
        if (!curObj || !BUI.isObject(curObj)) {
          break;
        }
        var subName = arr[i];
        if (i === len - 1) {
          curObj[subName] = value;
          break;
        }
        if (!curObj[subName]) {
          curObj[subName] = {};
        }
        curObj = curObj[subName];
      }
      return obj;
    },
    /**
     * 设置对象的属性，支持深度设置属性值
     *
     *   @example
     *   BUI.getValue(obj,'a.b.c') //return obj.a.b.c;
     * @param {Object} obj   对象
     * @param {String} name  名称
     * @param {String} value 值
     */
    getValue: function(obj, name) {
      if (!obj && !name) {
        return null;
      }
      var arr = name.split('.'),
        curObj = obj,
        len = arr.length,
        value = null;
      for (var i = 0; i < len; i++) {
        if (!curObj || !BUI.isObject(curObj)) {
          break;
        }
        var subName = arr[i];
        if (i === len - 1) {
          value = curObj[subName];
          break;
        }
        if (!curObj[subName]) {
          break;
        }
        curObj = curObj[subName];
      }
      return value;
    }
  });
  /**
   * 表单帮助类，序列化、反序列化，设置值
   * @class BUI.FormHelper
   * @singleton
   */
  var FormHelper = {
    /**
     * 将表单格式化成键值对形式
     * @param {HTMLElement} form 表单
     * @return {Object} 键值对的对象
     */
    serializeToObject: function(form) {
      var array = $(form).serializeArray(),
        result = {};
      BUI.each(array, function(item) {
        var name = item.name;
        if (!result[name]) { //如果是单个值，直接赋值
          result[name] = item.value;
        } else { //多值使用数组
          if (!BUI.isArray(result[name])) {
            result[name] = [result[name]];
          }
          result[name].push(item.value);
        }
      });
      return result;
    },
    /**
     * 设置表单的值
     * @param {HTMLElement} form 表单
     * @param {Object} obj  键值对
     */
    setFields: function(form, obj) {
      for (var name in obj) {
        if (obj.hasOwnProperty(name)) {
          BUI.FormHelper.setField(form, name, obj[name]);
        }
      }
    },
    /**
     * 清空表单
     * @param  {HTMLElement} form 表单元素
     */
    clear: function(form) {
      var elements = $.makeArray(form.elements);
      BUI.each(elements, function(element) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          $(element).attr('checked', false);
        } else {
          $(element).val('');
        }
        $(element).change();
      });
    },
    /**
     * 设置表单字段
     * @param {HTMLElement} form 表单元素
     * @param {string} field 字段名
     * @param {string} value 字段值
     */
    setField: function(form, fieldName, value) {
      var fields = form.elements[fieldName];
      if (fields && fields.type) {
        FormHelper._setFieldValue(fields, value);
      } else if (BUI.isArray(fields) || (fields && fields.length)) {
        BUI.each(fields, function(field) {
          FormHelper._setFieldValue(field, value);
        });
      }
    },
    //设置字段的值
    _setFieldValue: function(field, value) {
      if (field.type === 'checkbox') {
        if (field.value == '' + value || (BUI.isArray(value) && BUI.Array.indexOf(field.value, value) !== -1)) {
          $(field).attr('checked', true);
        } else {
          $(field).attr('checked', false);
        }
      } else if (field.type === 'radio') {
        if (field.value == '' + value) {
          $(field).attr('checked', true);
        } else {
          $(field).attr('checked', false);
        }
      } else {
        $(field).val(value);
      }
    },
    /**
     * 获取表单字段值
     * @param {HTMLElement} form 表单元素
     * @param {string} field 字段名
     * @return {String}   字段值
     */
    getField: function(form, fieldName) {
      return BUI.FormHelper.serializeToObject(form)[fieldName];
    }
  };
  BUI.FormHelper = FormHelper;
  module.exports = BUI;
});
define("bui/common/ua", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview UA,jQuery的 $.browser 对象非常难使用
   * @ignore
   * @author dxq613@gmail.com
   */
  var $ = require('jquery');

  function numberify(s) {
    var c = 0;
    // convert '1.2.3.4' to 1.234
    return parseFloat(s.replace(/\./g, function() {
      return (c++ === 0) ? '.' : '';
    }));
  };

  function uaMatch(s) {
    s = s.toLowerCase();
    var r = /(chrome)[ \/]([\w.]+)/.exec(s) || /(webkit)[ \/]([\w.]+)/.exec(s) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(s) || /(msie) ([\w.]+)/.exec(s) || s.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(s) || [],
      a = {
        browser: r[1] || "",
        version: r[2] || "0"
      },
      b = {};
    a.browser && (b[a.browser] = !0, b.version = a.version),
      b.chrome ? b.webkit = !0 : b.webkit && (b.safari = !0);
    return b;
  }
  var UA = $.UA || (function() {
    var browser = $.browser || uaMatch(navigator.userAgent),
      versionNumber = numberify(browser.version),
      /**
       * 浏览器版本检测
       * @class BUI.UA
       * @singleton
       */
      ua = {
        /**
         * ie 版本
         * @type {Number}
         */
        ie: browser.msie && versionNumber,
        /**
         * webkit 版本
         * @type {Number}
         */
        webkit: browser.webkit && versionNumber,
        /**
         * opera 版本
         * @type {Number}
         */
        opera: browser.opera && versionNumber,
        /**
         * mozilla 火狐版本
         * @type {Number}
         */
        mozilla: browser.mozilla && versionNumber
      };
    return ua;
  })();
  module.exports = UA;
});
define("bui/common/json", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 由于jQuery只有 parseJSON ，没有stringify所以使用过程不方便
   * @ignore
   */
  var $ = require('jquery'),
    UA = require("bui/common/ua"),
    win = window,
    JSON = win.JSON;
  // ie 8.0.7600.16315@win7 json 有问题
  if (!JSON || UA['ie'] < 9) {
    JSON = win.JSON = {};
  }

  function f(n) {
    // Format integers to have at least two digits.
    return n < 10 ? '0' + n : n;
  }
  if (typeof Date.prototype.toJSON !== 'function') {
    Date.prototype.toJSON = function(key) {
      return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null;
    };
    String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function(key) {
      return this.valueOf();
    };
  }
  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = { // table of character substitutions
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '"': '\\"',
      '\\': '\\\\'
    },
    rep;

  function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    escapable['lastIndex'] = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
      var c = meta[a];
      return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
  }

  function str(key, holder) {
    // Produce a string from holder[key].
    var i, // The loop counter.
      k, // The member key.
      v, // The member value.
      length,
      mind = gap,
      partial,
      value = holder[key];
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
      value = value.toJSON(key);
    }
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
      value = rep.call(holder, key, value);
    }
    // What happens next depends on the value's type.
    switch (typeof value) {
      case 'string':
        return quote(value);
      case 'number':
        // JSON numbers must be finite. Encode non-finite numbers as null.
        return isFinite(value) ? String(value) : 'null';
      case 'boolean':
      case 'null':
        // If the value is a boolean or null, convert it to a string. Note:
        // typeof null does not produce 'null'. The case is included here in
        // the remote chance that this gets fixed someday.
        return String(value);
        // If the type is 'object', we might be dealing with an object or an array or
        // null.
      case 'object':
        // Due to a specification blunder in ECMAScript, typeof null is 'object',
        // so watch out for that case.
        if (!value) {
          return 'null';
        }
        // Make an array to hold the partial results of stringifying this object value.
        gap += indent;
        partial = [];
        // Is the value an array?
        if (Object.prototype.toString.apply(value) === '[object Array]') {
          // The value is an array. Stringify every element. Use null as a placeholder
          // for non-JSON values.
          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || 'null';
          }
          // Join all of the elements together, separated with commas, and wrap them in
          // brackets.
          v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
          gap = mind;
          return v;
        }
        // If the replacer is an array, use it to select the members to be stringified.
        if (rep && typeof rep === 'object') {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            k = rep[i];
            if (typeof k === 'string') {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        } else {
          // Otherwise, iterate through all of the keys in the object.
          for (k in value) {
            if (Object.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (gap ? ': ' : ':') + v);
              }
            }
          }
        }
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.
        v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
  }
  if (typeof JSON.stringify !== 'function') {
    JSON.stringify = function(value, replacer, space) {
      // The stringify method takes a value and an optional replacer, and an optional
      // space parameter, and returns a JSON text. The replacer can be a function
      // that can replace values, or an array of strings that will select the keys.
      // A default replacer method can be provided. Use of the space parameter can
      // produce text that is more easily readable.
      var i;
      gap = '';
      indent = '';
      // If the space parameter is a number, make an indent string containing that
      // many spaces.
      if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
          indent += ' ';
        }
        // If the space parameter is a string, it will be used as the indent string.
      } else if (typeof space === 'string') {
        indent = space;
      }
      // If there is a replacer, it must be a function or an array.
      // Otherwise, throw an error.
      rep = replacer;
      if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
      }
      // Make a fake root object containing our value under the key of ''.
      // Return the result of stringifying the value.
      return str('', {
        '': value
      });
    };
  }

  function looseParse(data) {
      try {
        return new Function('return ' + data + ';')();
      } catch (e) {
        throw 'Json parse error!';
      }
    }
    /**
     * JSON 格式化
     * @class BUI.JSON
     * @singleton
     */
  var JSON = {
    /**
     * 转成json 等同于$.parseJSON
     * @method
     * @param {String} jsonstring 合法的json 字符串
     */
    parse: $.parseJSON,
    /**
     * 业务中有些字符串组成的json数据不是严格的json数据，如使用单引号，或者属性名不是字符串
     * 如 ： {a:'abc'}
     * @method
     * @param {String} jsonstring
     */
    looseParse: looseParse,
    /**
     * 将Json转成字符串
     * @method
     * @param {Object} json json 对象
     */
    stringify: JSON.stringify
  }
  module.exports = JSON;
});
define("bui/common/date", [], function(require, exports, module) {
  /*
   * @fileOverview Date Format 1.2.3
   * @ignore
   * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
   * MIT license
   *
   * Includes enhancements by Scott Trenda <scott.trenda.net>
   * and Kris Kowal <cixar.com/~kris.kowal/>
   *
   * Accepts a date, a mask, or a date and a mask.
   * Returns a formatted version of the given date.
   * The date defaults to the current date/time.
   * The mask defaults to dateFormat.masks.default.
   *
   * Last modified by jayli 拔赤 2010-09-09
   * - 增加中文的支持
   * - 简单的本地化，对w（星期x）的支持
   *
   */
  var dateRegex = /^(?:(?!0000)[0-9]{4}([-/.]+)(?:(?:0?[1-9]|1[0-2])\1(?:0?[1-9]|1[0-9]|2[0-8])|(?:0?[13-9]|1[0-2])\1(?:29|30)|(?:0?[13578]|1[02])\1(?:31))|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)([-/.]?)0?2\2(?:29))(\s+([01]|([01][0-9]|2[0-3])):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9]))?$/;

  function dateParse(val, format) {
    if (val instanceof Date) {
      return val;
    }
    if (typeof(format) == "undefined" || format == null || format == "") {
      var checkList = new Array('y-m-d', 'yyyy-mm-dd', 'yyyy-mm-dd HH:MM:ss', 'H:M:s');
      for (var i = 0; i < checkList.length; i++) {
        var d = dateParse(val, checkList[i]);
        if (d != null) {
          return d;
        }
      }
      return null;
    };
    val = val + "";
    var i_val = 0;
    var i_format = 0;
    var c = "";
    var token = "";
    var x, y;
    var now = new Date();
    var year = now.getYear();
    var month = now.getMonth() + 1;
    var date = 1;
    var hh = 00;
    var mm = 00;
    var ss = 00;
    this.isInteger = function(val) {
      return /^\d*$/.test(val);
    };
    this.getInt = function(str, i, minlength, maxlength) {
      for (var x = maxlength; x >= minlength; x--) {
        var token = str.substring(i, i + x);
        if (token.length < minlength) {
          return null;
        }
        if (this.isInteger(token)) {
          return token;
        }
      }
      return null;
    };
    while (i_format < format.length) {
      c = format.charAt(i_format);
      token = "";
      while ((format.charAt(i_format) == c) && (i_format < format.length)) {
        token += format.charAt(i_format++);
      }
      if (token == "yyyy" || token == "yy" || token == "y") {
        if (token == "yyyy") {
          x = 4;
          y = 4;
        }
        if (token == "yy") {
          x = 2;
          y = 2;
        }
        if (token == "y") {
          x = 2;
          y = 4;
        }
        year = this.getInt(val, i_val, x, y);
        if (year == null) {
          return null;
        }
        i_val += year.length;
        if (year.length == 2) {
          year = year > 70 ? 1900 + (year - 0) : 2000 + (year - 0);
        }
      } else if (token == "mm" || token == "m") {
        month = this.getInt(val, i_val, token.length, 2);
        if (month == null || (month < 1) || (month > 12)) {
          return null;
        }
        i_val += month.length;
      } else if (token == "dd" || token == "d") {
        date = this.getInt(val, i_val, token.length, 2);
        if (date == null || (date < 1) || (date > 31)) {
          return null;
        }
        i_val += date.length;
      } else if (token == "hh" || token == "h") {
        hh = this.getInt(val, i_val, token.length, 2);
        if (hh == null || (hh < 1) || (hh > 12)) {
          return null;
        }
        i_val += hh.length;
      } else if (token == "HH" || token == "H") {
        hh = this.getInt(val, i_val, token.length, 2);
        if (hh == null || (hh < 0) || (hh > 23)) {
          return null;
        }
        i_val += hh.length;
      } else if (token == "MM" || token == "M") {
        mm = this.getInt(val, i_val, token.length, 2);
        if (mm == null || (mm < 0) || (mm > 59)) {
          return null;
        }
        i_val += mm.length;
      } else if (token == "ss" || token == "s") {
        ss = this.getInt(val, i_val, token.length, 2);
        if (ss == null || (ss < 0) || (ss > 59)) {
          return null;
        }
        i_val += ss.length;
      } else {
        if (val.substring(i_val, i_val + token.length) != token) {
          return null;
        } else {
          i_val += token.length;
        }
      }
    }
    if (i_val != val.length) {
      return null;
    }
    if (month == 2) {
      if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) { // leap year
        if (date > 29) {
          return null;
        }
      } else {
        if (date > 28) {
          return null;
        }
      }
    }
    if ((month == 4) || (month == 6) || (month == 9) || (month == 11)) {
      if (date > 30) {
        return null;
      }
    }
    return new Date(year, month - 1, date, hh, mm, ss);
  }

  function DateAdd(strInterval, NumDay, dtDate) {
    var dtTmp = new Date(dtDate);
    if (isNaN(dtTmp)) {
      dtTmp = new Date();
    }
    NumDay = parseInt(NumDay, 10);
    switch (strInterval) {
      case 's':
        dtTmp = new Date(dtTmp.getTime() + (1000 * NumDay));
        break;
      case 'n':
        dtTmp = new Date(dtTmp.getTime() + (60000 * NumDay));
        break;
      case 'h':
        dtTmp = new Date(dtTmp.getTime() + (3600000 * NumDay));
        break;
      case 'd':
        dtTmp = new Date(dtTmp.getTime() + (86400000 * NumDay));
        break;
      case 'w':
        dtTmp = new Date(dtTmp.getTime() + ((86400000 * 7) * NumDay));
        break;
      case 'm':
        dtTmp = new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + NumDay, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
        break;
      case 'y':
        //alert(dtTmp.getFullYear());
        dtTmp = new Date(dtTmp.getFullYear() + NumDay, dtTmp.getMonth(), dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
        //alert(dtTmp);
        break;
    }
    return dtTmp;
  }
  var dateFormat = function() {
    var token = /w{1}|d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
      timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
      timezoneClip = /[^-+\dA-Z]/g,
      pad = function(val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) {
          val = '0' + val;
        }
        return val;
      },
      // Some common format strings
      masks = {
        'default': 'ddd mmm dd yyyy HH:MM:ss',
        shortDate: 'm/d/yy',
        //mediumDate:   'mmm d, yyyy',
        longDate: 'mmmm d, yyyy',
        fullDate: 'dddd, mmmm d, yyyy',
        shortTime: 'h:MM TT',
        //mediumTime:   'h:MM:ss TT',
        longTime: 'h:MM:ss TT Z',
        isoDate: 'yyyy-mm-dd',
        isoTime: 'HH:MM:ss',
        isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
        isoUTCDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
        //added by jayli
        localShortDate: 'yy年mm月dd日',
        localShortDateTime: 'yy年mm月dd日 hh:MM:ss TT',
        localLongDate: 'yyyy年mm月dd日',
        localLongDateTime: 'yyyy年mm月dd日 hh:MM:ss TT',
        localFullDate: 'yyyy年mm月dd日 w',
        localFullDateTime: 'yyyy年mm月dd日 w hh:MM:ss TT'
      },
      // Internationalization strings
      i18n = {
        dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', '星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      };
    // Regexes and supporting functions are cached through closure
    return function(date, mask, utc) {
      // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
      if (arguments.length === 1 && Object.prototype.toString.call(date) === '[object String]' && !/\d/.test(date)) {
        mask = date;
        date = undefined;
      }
      // Passing date through Date applies Date.parse, if necessary
      date = date ? new Date(date) : new Date();
      if (isNaN(date)) {
        throw SyntaxError('invalid date');
      }
      mask = String(masks[mask] || mask || masks['default']);
      // Allow setting the utc argument via the mask
      if (mask.slice(0, 4) === 'UTC:') {
        mask = mask.slice(4);
        utc = true;
      }
      var _ = utc ? 'getUTC' : 'get',
        d = date[_ + 'Date'](),
        D = date[_ + 'Day'](),
        m = date[_ + 'Month'](),
        y = date[_ + 'FullYear'](),
        H = date[_ + 'Hours'](),
        M = date[_ + 'Minutes'](),
        s = date[_ + 'Seconds'](),
        L = date[_ + 'Milliseconds'](),
        o = utc ? 0 : date.getTimezoneOffset(),
        flags = {
          d: d,
          dd: pad(d, undefined),
          ddd: i18n.dayNames[D],
          dddd: i18n.dayNames[D + 7],
          w: i18n.dayNames[D + 14],
          m: m + 1,
          mm: pad(m + 1, undefined),
          mmm: i18n.monthNames[m],
          mmmm: i18n.monthNames[m + 12],
          yy: String(y).slice(2),
          yyyy: y,
          h: H % 12 || 12,
          hh: pad(H % 12 || 12, undefined),
          H: H,
          HH: pad(H, undefined),
          M: M,
          MM: pad(M, undefined),
          s: s,
          ss: pad(s, undefined),
          l: pad(L, 3),
          L: pad(L > 99 ? Math.round(L / 10) : L, undefined),
          t: H < 12 ? 'a' : 'p',
          tt: H < 12 ? 'am' : 'pm',
          T: H < 12 ? 'A' : 'P',
          TT: H < 12 ? 'AM' : 'PM',
          Z: utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
          o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
          S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 !== 10) * d % 10]
        };
      return mask.replace(token, function($0) {
        return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
      });
    };
  }();
  /**
   * 日期的工具方法
   * @class BUI.Date
   */
  var DateUtil = {
    /**
     * 日期加法
     * @param {String} strInterval 加法的类型，s(秒),n(分),h(时),d(天),w(周),m(月),y(年)
     * @param {Number} Num     数量，如果为负数，则为减法
     * @param {Date} dtDate    起始日期，默认为此时
     */
    add: function(strInterval, Num, dtDate) {
      return DateAdd(strInterval, Num, dtDate);
    },
    /**
     * 小时的加法
     * @param {Number} hours 小时
     * @param {Date} date 起始日期
     */
    addHour: function(hours, date) {
      return DateAdd('h', hours, date);
    },
    /**
     * 分的加法
     * @param {Number} minutes 分
     * @param {Date} date 起始日期
     */
    addMinute: function(minutes, date) {
      return DateAdd('n', minutes, date);
    },
    /**
     * 秒的加法
     * @param {Number} seconds 秒
     * @param {Date} date 起始日期
     */
    addSecond: function(seconds, date) {
      return DateAdd('s', seconds, date);
    },
    /**
     * 天的加法
     * @param {Number} days 天数
     * @param {Date} date 起始日期
     */
    addDay: function(days, date) {
      return DateAdd('d', days, date);
    },
    /**
     * 增加周
     * @param {Number} weeks 周数
     * @param {Date} date  起始日期
     */
    addWeek: function(weeks, date) {
      return DateAdd('w', weeks, date);
    },
    /**
     * 增加月
     * @param {Number} months 月数
     * @param {Date} date  起始日期
     */
    addMonths: function(months, date) {
      return DateAdd('m', months, date);
    },
    /**
     * 增加年
     * @param {Number} years 年数
     * @param {Date} date  起始日期
     */
    addYear: function(years, date) {
      return DateAdd('y', years, date);
    },
    /**
     * 日期是否相等，忽略时间
     * @param  {Date}  d1 日期对象
     * @param  {Date}  d2 日期对象
     * @return {Boolean}  是否相等
     */
    isDateEquals: function(d1, d2) {
      return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    },
    /**
     * 日期时间是否相等，包含时间
     * @param  {Date}  d1 日期对象
     * @param  {Date}  d2 日期对象
     * @return {Boolean}  是否相等
     */
    isEquals: function(d1, d2) {
      if (d1 == d2) {
        return true;
      }
      if (!d1 || !d2) {
        return false;
      }
      if (!d1.getTime || !d2.getTime) {
        return false;
      }
      return d1.getTime() == d2.getTime();
    },
    /**
     * 字符串是否是有效的日期类型
     * @param {String} str 字符串
     * @return 字符串是否能转换成日期
     */
    isDateString: function(str) {
      return dateRegex.test(str);
    },
    /**
     * 将日期格式化成字符串
     * @param  {Date} date 日期
     * @param  {String} mask 格式化方式
     * @param  {Date} utc  是否utc时间
     * @return {String}    日期的字符串
     */
    format: function(date, mask, utc) {
      return dateFormat(date, mask, utc);
    },
    /**
     * 转换成日期
     * @param  {String|Date} date 字符串或者日期
     * @param  {String} dateMask  日期的格式,如:yyyy-MM-dd
     * @return {Date}    日期对象
     */
    parse: function(date, s) {
      if (BUI.isString(date)) {
        date = date.replace('\/', '-');
      }
      return dateParse(date, s);
    },
    /**
     * 当前天
     * @return {Date} 当前天 00:00:00
     */
    today: function() {
      var now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    },
    /**
     * 返回当前日期
     * @return {Date} 日期的 00:00:00
     */
    getDate: function(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  };
  module.exports = DateUtil;
});
define("bui/common/array", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 数组帮助类
   * @ignore
   */
  /**
   * @class BUI
   * 控件库的基础命名空间
   * @singleton
   */
  var BUI = require("bui/common/util");
  /**
   * @class BUI.Array
   * 数组帮助类
   */
  var ArrayUtil = {
    /**
     * 返回数组的最后一个对象
     * @param {Array} array 数组或者类似于数组的对象.
     * @return {*} 数组的最后一项.
     */
    peek: function(array) {
      return array[array.length - 1];
    },
    /**
     * 查找记录所在的位置
     * @param  {*} value 值
     * @param  {Array} array 数组或者类似于数组的对象
     * @param  {Number} [fromIndex=0] 起始项，默认为0
     * @return {Number} 位置，如果为 -1则不在数组内
     */
    indexOf: function(value, array, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? 0 : (opt_fromIndex < 0 ? Math.max(0, array.length + opt_fromIndex) : opt_fromIndex);
      for (var i = fromIndex; i < array.length; i++) {
        if (i in array && array[i] === value) return i;
      }
      return -1;
    },
    /**
     * 数组是否存在指定值
     * @param  {*} value 值
     * @param  {Array} array 数组或者类似于数组的对象
     * @return {Boolean} 是否存在于数组中
     */
    contains: function(value, array) {
      return ArrayUtil.indexOf(value, array) >= 0;
    },
    /**
     * 遍历数组或者对象
     * @method
     * @param {Object|Array} element/Object 数组中的元素或者对象的值
     * @param {Function} func 遍历的函数 function(elememt,index){} 或者 function(value,key){}
     */
    each: BUI.each,
    /**
     * 2个数组内部的值是否相等
     * @param  {Array} a1 数组1
     * @param  {Array} a2 数组2
     * @return {Boolean} 2个数组相等或者内部元素是否相等
     */
    equals: function(a1, a2) {
      if (a1 == a2) {
        return true;
      }
      if (!a1 || !a2) {
        return false;
      }
      if (a1.length != a2.length) {
        return false;
      }
      var rst = true;
      for (var i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) {
          rst = false;
          break;
        }
      }
      return rst;
    },
    /**
     * 过滤数组
     * @param {Object|Array} element/Object 数组中的元素或者对象的值
     * @param {Function} func 遍历的函数 function(elememt,index){} 或者 function(value,key){},如果返回true则添加到结果集
     * @return {Array} 过滤的结果集
     */
    filter: function(array, func) {
      var result = [];
      ArrayUtil.each(array, function(value, index) {
        if (func(value, index)) {
          result.push(value);
        }
      });
      return result;
    },
    /**
     * 转换数组数组
     * @param {Object|Array} element/Object 数组中的元素或者对象的值
     * @param {Function} func 遍历的函数 function(elememt,index){} 或者 function(value,key){},将返回的结果添加到结果集
     * @return {Array} 过滤的结果集
     */
    map: function(array, func) {
      var result = [];
      ArrayUtil.each(array, function(value, index) {
        result.push(func(value, index));
      });
      return result;
    },
    /**
     * 获取第一个符合条件的数据
     * @param  {Array} array 数组
     * @param  {Function} func  匹配函数
     * @return {*}  符合条件的数据
     */
    find: function(array, func) {
      var i = ArrayUtil.findIndex(array, func);
      return i < 0 ? null : array[i];
    },
    /**
     * 获取第一个符合条件的数据的索引值
     * @param  {Array} array 数组
     * @param  {Function} func  匹配函数
     * @return {Number} 符合条件的数据的索引值
     */
    findIndex: function(array, func) {
      var result = -1;
      ArrayUtil.each(array, function(value, index) {
        if (func(value, index)) {
          result = index;
          return false;
        }
      });
      return result;
    },
    /**
     * 数组是否为空
     * @param  {Array}  array 数组
     * @return {Boolean}  是否为空
     */
    isEmpty: function(array) {
      return array.length == 0;
    },
    /**
     * 插入数组
     * @param  {Array} array 数组
     * @param  {Number} index 位置
     * @param {*} value 插入的数据
     */
    add: function(array, value) {
      array.push(value);
    },
    /**
     * 将数据插入数组指定的位置
     * @param  {Array} array 数组
     * @param {*} value 插入的数据
     * @param  {Number} index 位置
     */
    addAt: function(array, value, index) {
      ArrayUtil.splice(array, index, 0, value);
    },
    /**
     * 清空数组
     * @param  {Array} array 数组
     * @return {Array}  清空后的数组
     */
    empty: function(array) {
      if (!(array instanceof(Array))) {
        for (var i = array.length - 1; i >= 0; i--) {
          delete array[i];
        }
      }
      array.length = 0;
    },
    /**
     * 移除记录
     * @param  {Array} array 数组
     * @param  {*} value 记录
     * @return {Boolean}   是否移除成功
     */
    remove: function(array, value) {
      var i = ArrayUtil.indexOf(value, array);
      var rv;
      if ((rv = i >= 0)) {
        ArrayUtil.removeAt(array, i);
      }
      return rv;
    },
    /**
     * 移除指定位置的记录
     * @param  {Array} array 数组
     * @param  {Number} index 索引值
     * @return {Boolean}   是否移除成功
     */
    removeAt: function(array, index) {
      return ArrayUtil.splice(array, index, 1).length == 1;
    },
    /**
     * @private
     */
    slice: function(arr, start, opt_end) {
      if (arguments.length <= 2) {
        return Array.prototype.slice.call(arr, start);
      } else {
        return Array.prototype.slice.call(arr, start, opt_end);
      }
    },
    /**
     * @private
     */
    splice: function(arr, index, howMany, var_args) {
      return Array.prototype.splice.apply(arr, ArrayUtil.slice(arguments, 1))
    }
  };
  module.exports = ArrayUtil;
});
define("bui/common/keycode", [], function(require, exports, module) {
  /**
   * @fileOverview 键盘值
   * @ignore
   */
  /**
   * 键盘按键对应的数字值
   * @class BUI.KeyCode
   * @singleton
   */
  var keyCode = {
    /** Key constant @type Number */
    BACKSPACE: 8,
    /** Key constant @type Number */
    TAB: 9,
    /** Key constant @type Number */
    NUM_CENTER: 12,
    /** Key constant @type Number */
    ENTER: 13,
    /** Key constant @type Number */
    RETURN: 13,
    /** Key constant @type Number */
    SHIFT: 16,
    /** Key constant @type Number */
    CTRL: 17,
    /** Key constant @type Number */
    ALT: 18,
    /** Key constant @type Number */
    PAUSE: 19,
    /** Key constant @type Number */
    CAPS_LOCK: 20,
    /** Key constant @type Number */
    ESC: 27,
    /** Key constant @type Number */
    SPACE: 32,
    /** Key constant @type Number */
    PAGE_UP: 33,
    /** Key constant @type Number */
    PAGE_DOWN: 34,
    /** Key constant @type Number */
    END: 35,
    /** Key constant @type Number */
    HOME: 36,
    /** Key constant @type Number */
    LEFT: 37,
    /** Key constant @type Number */
    UP: 38,
    /** Key constant @type Number */
    RIGHT: 39,
    /** Key constant @type Number */
    DOWN: 40,
    /** Key constant @type Number */
    PRINT_SCREEN: 44,
    /** Key constant @type Number */
    INSERT: 45,
    /** Key constant @type Number */
    DELETE: 46,
    /** Key constant @type Number */
    ZERO: 48,
    /** Key constant @type Number */
    ONE: 49,
    /** Key constant @type Number */
    TWO: 50,
    /** Key constant @type Number */
    THREE: 51,
    /** Key constant @type Number */
    FOUR: 52,
    /** Key constant @type Number */
    FIVE: 53,
    /** Key constant @type Number */
    SIX: 54,
    /** Key constant @type Number */
    SEVEN: 55,
    /** Key constant @type Number */
    EIGHT: 56,
    /** Key constant @type Number */
    NINE: 57,
    /** Key constant @type Number */
    A: 65,
    /** Key constant @type Number */
    B: 66,
    /** Key constant @type Number */
    C: 67,
    /** Key constant @type Number */
    D: 68,
    /** Key constant @type Number */
    E: 69,
    /** Key constant @type Number */
    F: 70,
    /** Key constant @type Number */
    G: 71,
    /** Key constant @type Number */
    H: 72,
    /** Key constant @type Number */
    I: 73,
    /** Key constant @type Number */
    J: 74,
    /** Key constant @type Number */
    K: 75,
    /** Key constant @type Number */
    L: 76,
    /** Key constant @type Number */
    M: 77,
    /** Key constant @type Number */
    N: 78,
    /** Key constant @type Number */
    O: 79,
    /** Key constant @type Number */
    P: 80,
    /** Key constant @type Number */
    Q: 81,
    /** Key constant @type Number */
    R: 82,
    /** Key constant @type Number */
    S: 83,
    /** Key constant @type Number */
    T: 84,
    /** Key constant @type Number */
    U: 85,
    /** Key constant @type Number */
    V: 86,
    /** Key constant @type Number */
    W: 87,
    /** Key constant @type Number */
    X: 88,
    /** Key constant @type Number */
    Y: 89,
    /** Key constant @type Number */
    Z: 90,
    /** Key constant @type Number */
    CONTEXT_MENU: 93,
    /** Key constant @type Number */
    NUM_ZERO: 96,
    /** Key constant @type Number */
    NUM_ONE: 97,
    /** Key constant @type Number */
    NUM_TWO: 98,
    /** Key constant @type Number */
    NUM_THREE: 99,
    /** Key constant @type Number */
    NUM_FOUR: 100,
    /** Key constant @type Number */
    NUM_FIVE: 101,
    /** Key constant @type Number */
    NUM_SIX: 102,
    /** Key constant @type Number */
    NUM_SEVEN: 103,
    /** Key constant @type Number */
    NUM_EIGHT: 104,
    /** Key constant @type Number */
    NUM_NINE: 105,
    /** Key constant @type Number */
    NUM_MULTIPLY: 106,
    /** Key constant @type Number */
    NUM_PLUS: 107,
    /** Key constant @type Number */
    NUM_MINUS: 109,
    /** Key constant @type Number */
    NUM_PERIOD: 110,
    /** Key constant @type Number */
    NUM_DIVISION: 111,
    /** Key constant @type Number */
    F1: 112,
    /** Key constant @type Number */
    F2: 113,
    /** Key constant @type Number */
    F3: 114,
    /** Key constant @type Number */
    F4: 115,
    /** Key constant @type Number */
    F5: 116,
    /** Key constant @type Number */
    F6: 117,
    /** Key constant @type Number */
    F7: 118,
    /** Key constant @type Number */
    F8: 119,
    /** Key constant @type Number */
    F9: 120,
    /** Key constant @type Number */
    F10: 121,
    /** Key constant @type Number */
    F11: 122,
    /** Key constant @type Number */
    F12: 123
  };
  module.exports = keyCode;
});
define("bui/common/observable", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 观察者模式实现事件
   * @ignore
   */
  var $ = require('jquery');
  var BUI = require("bui/common/util"),
    ArrayUtil = require("bui/common/array");
  /**
   * @private
   * @class BUI.Observable.Callbacks
   * jquery 1.7 时存在 $.Callbacks,但是fireWith的返回结果是$.Callbacks 对象，
   * 而我们想要的效果是：当其中有一个函数返回为false时，阻止后面的执行，并返回false
   */
  var Callbacks = function() {
    this._init();
  };
  BUI.augment(Callbacks, {
    _functions: null,
    _init: function() {
      var _self = this;
      _self._functions = [];
    },
    /**
     * 添加回调函数
     * @param {Function} fn 回调函数
     */
    add: function(fn) {
      this._functions.push(fn);
    },
    /**
     * 移除回调函数
     * @param  {Function} fn 回调函数
     */
    remove: function(fn) {
      var functions = this._functions;
      index = ArrayUtil.indexOf(fn, functions);
      if (index >= 0) {
        functions.splice(index, 1);
      }
    },
    /**
     * 清空事件
     */
    empty: function() {
      var length = this._functions.length; //ie6,7下，必须指定需要删除的数量
      this._functions.splice(0, length);
    },
    /**
     * 暂停事件
     */
    pause: function() {
      this._paused = true;
    },
    /**
     * 唤醒事件
     */
    resume: function() {
      this._paused = false;
    },
    /**
     * 触发回调
     * @param  {Object} scope 上下文
     * @param  {Array} args  回调函数的参数
     * @return {Boolean|undefined} 当其中有一个函数返回为false时，阻止后面的执行，并返回false
     */
    fireWith: function(scope, args) {
      var _self = this,
        rst;
      if (_self._paused) {
        return;
      }
      BUI.each(_self._functions, function(fn) {
        rst = fn.apply(scope, args);
        if (rst === false) {
          return false;
        }
      });
      return rst;
    }
  });

  function getCallbacks() {
      return new Callbacks();
    }
    /**
     * 支持事件的对象，参考观察者模式
     *  - 此类提供事件绑定
     *  - 提供事件冒泡机制
     *
     * <pre><code>
     *   var control = new Control();
     *   control.on('click',function(ev){
     *
     *   });
     *
     *   control.off();  //移除所有事件
     * </code></pre>
     * @class BUI.Observable
     * @abstract
     * @param {Object} config 配置项键值对
     */
  var Observable = function(config) {
    this._events = [];
    this._eventMap = {};
    this._bubblesEvents = [];
    this._initEvents(config);
  };
  BUI.augment(Observable, {
    /**
     * @cfg {Object} listeners
     *  初始化事件,快速注册事件
     *  <pre><code>
     *    var list = new BUI.List.SimpleList({
     *      listeners : {
     *        itemclick : function(ev){},
     *        itemrendered : function(ev){}
     *      },
     *      items : []
     *    });
     *    list.render();
     *  </code></pre>
     */
    /**
     * @cfg {Function} handler
     * 点击事件的处理函数，快速配置点击事件而不需要写listeners属性
     * <pre><code>
     *    var list = new BUI.List.SimpleList({
     *      handler : function(ev){} //click 事件
     *    });
     *    list.render();
     *  </code></pre>
     */
    /**
     * 支持的事件名列表
     * @private
     */
    _events: [],
    /**
     * 绑定的事件
     * @private
     */
    _eventMap: {},
    _bubblesEvents: [],
    _bubbleTarget: null,
    //获取回调集合
    _getCallbacks: function(eventType) {
      var _self = this,
        eventMap = _self._eventMap;
      return eventMap[eventType];
    },
    //初始化事件列表
    _initEvents: function(config) {
      var _self = this,
        listeners = null;
      if (!config) {
        return;
      }
      listeners = config.listeners || {};
      if (config.handler) {
        listeners.click = config.handler;
      }
      if (listeners) {
        for (var name in listeners) {
          if (listeners.hasOwnProperty(name)) {
            _self.on(name, listeners[name]);
          }
        };
      }
    },
    //事件是否支持冒泡
    _isBubbles: function(eventType) {
      return ArrayUtil.indexOf(eventType, this._bubblesEvents) >= 0;
    },
    /**
     * 添加冒泡的对象
     * @protected
     * @param {Object} target  冒泡的事件源
     */
    addTarget: function(target) {
      this._bubbleTarget = target;
    },
    /**
     * 添加支持的事件
     * @protected
     * @param {String|String[]} events 事件
     */
    addEvents: function(events) {
      var _self = this,
        existEvents = _self._events,
        eventMap = _self._eventMap;

      function addEvent(eventType) {
        if (ArrayUtil.indexOf(eventType, existEvents) === -1) {
          eventMap[eventType] = getCallbacks();
          existEvents.push(eventType);
        }
      }
      if (BUI.isArray(events)) {
        BUI.each(events, function(eventType) {
          addEvent(eventType);
        });
      } else {
        addEvent(events);
      }
    },
    /**
     * 移除所有绑定的事件
     * @protected
     */
    clearListeners: function() {
      var _self = this,
        eventMap = _self._eventMap;
      for (var name in eventMap) {
        if (eventMap.hasOwnProperty(name)) {
          eventMap[name].empty();
        }
      }
    },
    /**
     * 触发事件
     * <pre><code>
     *   //绑定事件
     *   list.on('itemclick',function(ev){
     *     alert('21');
     *   });
     *   //触发事件
     *   list.fire('itemclick');
     * </code></pre>
     * @param  {String} eventType 事件类型
     * @param  {Object} eventData 事件触发时传递的数据
     * @return {Boolean|undefined}  如果其中一个事件处理器返回 false , 则返回 false, 否则返回最后一个事件处理器的返回值
     */
    fire: function(eventType, eventData) {
      var _self = this,
        callbacks = _self._getCallbacks(eventType),
        args = $.makeArray(arguments),
        result;
      if (!eventData) {
        eventData = {};
        args.push(eventData);
      }
      if (!eventData.target) {
        eventData.target = _self;
      }
      if (callbacks) {
        result = callbacks.fireWith(_self, Array.prototype.slice.call(args, 1));
      }
      if (_self._isBubbles(eventType)) {
        var bubbleTarget = _self._bubbleTarget;
        if (bubbleTarget && bubbleTarget.fire) {
          bubbleTarget.fire(eventType, eventData);
        }
      }
      return result;
    },
    /**
     * 暂停事件的执行
     * <pre><code>
     *  list.pauseEvent('itemclick');
     * </code></pre>
     * @param  {String} eventType 事件类型
     */
    pauseEvent: function(eventType) {
      var _self = this,
        callbacks = _self._getCallbacks(eventType);
      callbacks && callbacks.pause();
    },
    /**
     * 唤醒事件
     * <pre><code>
     *  list.resumeEvent('itemclick');
     * </code></pre>
     * @param  {String} eventType 事件类型
     */
    resumeEvent: function(eventType) {
      var _self = this,
        callbacks = _self._getCallbacks(eventType);
      callbacks && callbacks.resume();
    },
    /**
     * 添加绑定事件
     * <pre><code>
     *   //绑定单个事件
     *   list.on('itemclick',function(ev){
     *     alert('21');
     *   });
     *   //绑定多个事件
     *   list.on('itemrendered itemupdated',function(){
     *     //列表项创建、更新时触发操作
     *   });
     * </code></pre>
     * @param  {String}   eventType 事件类型
     * @param  {Function} fn        回调函数
     */
    on: function(eventType, fn) {
      //一次监听多个事件
      var arr = eventType.split(' '),
        _self = this,
        callbacks = null;
      if (arr.length > 1) {
        BUI.each(arr, function(name) {
          _self.on(name, fn);
        });
      } else {
        callbacks = _self._getCallbacks(eventType);
        if (callbacks) {
          callbacks.add(fn);
        } else {
          _self.addEvents(eventType);
          _self.on(eventType, fn);
        }
      }
      return _self;
    },
    /**
     * 移除绑定的事件
     * <pre><code>
     *  //移除所有事件
     *  list.off();
     *
     *  //移除特定事件
     *  function callback(ev){}
     *  list.on('click',callback);
     *
     *  list.off('click',callback);//需要保存回调函数的引用
     *
     * </code></pre>
     * @param  {String}   eventType 事件类型
     * @param  {Function} fn        回调函数
     */
    off: function(eventType, fn) {
      if (!eventType && !fn) {
        this.clearListeners();
        return this;
      }
      var _self = this,
        callbacks = _self._getCallbacks(eventType);
      if (callbacks) {
        if (fn) {
          callbacks.remove(fn);
        } else {
          callbacks.empty();
        }
      }
      return _self;
    },
    /**
     * 配置事件是否允许冒泡
     * @protected
     * @param  {String} eventType 支持冒泡的事件
     * @param  {Object} cfg 配置项
     * @param {Boolean} cfg.bubbles 是否支持冒泡
     */
    publish: function(eventType, cfg) {
      var _self = this,
        bubblesEvents = _self._bubblesEvents;
      if (cfg.bubbles) {
        if (BUI.Array.indexOf(eventType, bubblesEvents) === -1) {
          bubblesEvents.push(eventType);
        }
      } else {
        var index = BUI.Array.indexOf(eventType, bubblesEvents);
        if (index !== -1) {
          bubblesEvents.splice(index, 1);
        }
      }
    }
  });
  module.exports = Observable;
});
define("bui/common/base", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview  Base UI控件的最基础的类
   * @author yiminghe@gmail.com
   * copied by dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery');
  var INVALID = {},
    Observable = require("bui/common/observable");

  function ensureNonEmpty(obj, name, create) {
    var ret = obj[name] || {};
    if (create) {
      obj[name] = ret;
    }
    return ret;
  }

  function normalFn(host, method) {
    if (BUI.isString(method)) {
      return host[method];
    }
    return method;
  }

  function __fireAttrChange(self, when, name, prevVal, newVal) {
    var attrName = name;
    return self.fire(when + BUI.ucfirst(name) + 'Change', {
      attrName: attrName,
      prevVal: prevVal,
      newVal: newVal
    });
  }

  function setInternal(self, name, value, opts, attrs) {
    opts = opts || {};
    var ret,
      subVal,
      prevVal;
    prevVal = self.get(name);
    //如果未改变值不进行修改
    if (!$.isPlainObject(value) && !BUI.isArray(value) && prevVal === value) {
      return undefined;
    }
    // check before event
    if (!opts['silent']) {
      if (false === __fireAttrChange(self, 'before', name, prevVal, value)) {
        return false;
      }
    }
    // set it
    ret = self._set(name, value, opts);
    if (ret === false) {
      return ret;
    }
    // fire after event
    if (!opts['silent']) {
      value = self.__attrVals[name];
      __fireAttrChange(self, 'after', name, prevVal, value);
    }
    return self;
  }

  function initClassAttrs(c) {
      if (c._attrs || c == Base) {
        return;
      }
      var superCon = c.superclass.constructor;
      if (superCon && !superCon._attrs) {
        initClassAttrs(superCon);
      }
      c._attrs = {};
      BUI.mixAttrs(c._attrs, superCon._attrs);
      BUI.mixAttrs(c._attrs, c.ATTRS);
    }
    /**
     * 基础类，此类提供以下功能
     *  - 提供设置获取属性
     *  - 提供事件支持
     *  - 属性变化时会触发对应的事件
     *  - 将配置项自动转换成属性
     *
     * ** 创建类，继承BUI.Base类 **
     * <pre><code>
     *   var Control = function(cfg){
     *     Control.superclass.constructor.call(this,cfg); //调用BUI.Base的构造方法，将配置项变成属性
     *   };
     *
     *   BUI.extend(Control,BUI.Base);
     * </code></pre>
     *
     * ** 声明默认属性 **
     * <pre><code>
     *   Control.ATTRS = {
     *     id : {
     *       value : 'id' //value 是此属性的默认值
     *     },
     *     renderTo : {
     *
     *     },
     *     el : {
     *       valueFn : function(){                 //第一次调用的时候将renderTo的DOM转换成el属性
     *         return $(this.get('renderTo'));
     *       }
     *     },
     *     text : {
     *       getter : function(){ //getter 用于获取值，而不是设置的值
     *         return this.get('el').val();
     *       },
     *       setter : function(v){ //不仅仅是设置值，可以进行相应的操作
     *         this.get('el').val(v);
     *       }
     *     }
     *   };
     * </code></pre>
     *
     * ** 声明类的方法 **
     * <pre><code>
     *   BUI.augment(Control,{
     *     getText : function(){
     *       return this.get('text');   //可以用get方法获取属性值
     *     },
     *     setText : function(txt){
     *       this.set('text',txt);      //使用set 设置属性值
     *     }
     *   });
     * </code></pre>
     *
     * ** 创建对象 **
     * <pre><code>
     *   var c = new Control({
     *     id : 'oldId',
     *     text : '测试文本',
     *     renderTo : '#t1'
     *   });
     *
     *   var el = c.get(el); //$(#t1);
     *   el.val(); //text的值 ： '测试文本'
     *   c.set('text','修改的值');
     *   el.val();  //'修改的值'
     *
     *   c.set('id','newId') //会触发2个事件： beforeIdChange,afterIdChange 2个事件 ev.newVal 和ev.prevVal标示新旧值
     * </code></pre>
     * @class BUI.Base
     * @abstract
     * @extends BUI.Observable
     * @param {Object} config 配置项
     */
  var Base = function(config) {
    var _self = this,
      c = _self.constructor,
      constructors = [];
    this.__attrs = {};
    this.__attrVals = {};
    Observable.apply(this, arguments);
    // define
    while (c) {
      constructors.push(c);
      if (c.extensions) { //延迟执行mixin
        BUI.mixin(c, c.extensions);
        delete c.extensions;
      }
      //_self.addAttrs(c['ATTRS']);
      c = c.superclass ? c.superclass.constructor : null;
    }
    //以当前对象的属性最终添加到属性中，覆盖之前的属性
    /*for (var i = constructors.length - 1; i >= 0; i--) {
          _self.addAttrs(constructors[i]['ATTRS'],true);
        };*/
    var con = _self.constructor;
    initClassAttrs(con);
    _self._initStaticAttrs(con._attrs);
    _self._initAttrs(config);
  };
  Base.INVALID = INVALID;
  BUI.extend(Base, Observable);
  BUI.augment(Base, {
    _initStaticAttrs: function(attrs) {
      var _self = this,
        __attrs;
      __attrs = _self.__attrs = {};
      for (var p in attrs) {
        if (attrs.hasOwnProperty(p)) {
          var attr = attrs[p];
          /*if(BUI.isObject(attr.value) || BUI.isArray(attr.value) || attr.valueFn){*/
          if (attr.shared === false || attr.valueFn) {
            __attrs[p] = {};
            BUI.mixAttr(__attrs[p], attrs[p]);
          } else {
            __attrs[p] = attrs[p];
          }
        }
      };
    },
    /**
     * 添加属性定义
     * @protected
     * @param {String} name       属性名
     * @param {Object} attrConfig 属性定义
     * @param {Boolean} overrides 是否覆盖字段
     */
    addAttr: function(name, attrConfig, overrides) {
      var _self = this,
        attrs = _self.__attrs,
        attr = attrs[name];
      if (!attr) {
        attr = attrs[name] = {};
      }
      for (var p in attrConfig) {
        if (attrConfig.hasOwnProperty(p)) {
          if (p == 'value') {
            if (BUI.isObject(attrConfig[p])) {
              attr[p] = attr[p] || {};
              BUI.mix( /*true,*/ attr[p], attrConfig[p]);
            } else if (BUI.isArray(attrConfig[p])) {
              attr[p] = attr[p] || [];
              BUI.mix( /*true,*/ attr[p], attrConfig[p]);
            } else {
              attr[p] = attrConfig[p];
            }
          } else {
            attr[p] = attrConfig[p];
          }
        }
      };
      return _self;
    },
    /**
     * 添加属性定义
     * @protected
     * @param {Object} attrConfigs  An object with attribute name/configuration pairs.
     * @param {Object} initialValues user defined initial values
     * @param {Boolean} overrides 是否覆盖字段
     */
    addAttrs: function(attrConfigs, initialValues, overrides) {
      var _self = this;
      if (!attrConfigs) {
        return _self;
      }
      if (typeof(initialValues) === 'boolean') {
        overrides = initialValues;
        initialValues = null;
      }
      BUI.each(attrConfigs, function(attrConfig, name) {
        _self.addAttr(name, attrConfig, overrides);
      });
      if (initialValues) {
        _self.set(initialValues);
      }
      return _self;
    },
    /**
     * 是否包含此属性
     * @protected
     * @param  {String}  name 值
     * @return {Boolean} 是否包含
     */
    hasAttr: function(name) {
      return name && this.__attrs.hasOwnProperty(name);
    },
    /**
     * 获取默认的属性值
     * @protected
     * @return {Object} 属性值的键值对
     */
    getAttrs: function() {
      return this.__attrs; //ensureNonEmpty(this, '__attrs', true);
    },
    /**
     * 获取属性名/属性值键值对
     * @protected
     * @return {Object} 属性对象
     */
    getAttrVals: function() {
      return this.__attrVals; //ensureNonEmpty(this, '__attrVals', true);
    },
    /**
     * 获取属性值，所有的配置项和属性都可以通过get方法获取
     * <pre><code>
     *  var control = new Control({
     *   text : 'control text'
     *  });
     *  control.get('text'); //control text
     *
     *  control.set('customValue','value'); //临时变量
     *  control.get('customValue'); //value
     * </code></pre>
     * ** 属性值/配置项 **
     * <pre><code>
     *   Control.ATTRS = { //声明属性值
     *     text : {
     *       valueFn : function(){},
     *       value : 'value',
     *       getter : function(v){}
     *     }
     *   };
     *   var c = new Control({
     *     text : 'text value'
     *   });
     *   //get 函数取的顺序为：是否有修改值（配置项、set)、默认值（第一次调用执行valueFn)，如果有getter，则将值传入getter返回
     *
     *   c.get('text') //text value
     *   c.set('text','new text');//修改值
     *   c.get('text');//new text
     * </code></pre>
     * @param  {String} name 属性名
     * @return {Object} 属性值
     */
    get: function(name) {
      var _self = this,
        //declared = _self.hasAttr(name),
        attrVals = _self.__attrVals,
        attrConfig,
        getter,
        ret;
      attrConfig = ensureNonEmpty(_self.__attrs, name);
      getter = attrConfig['getter'];
      // get user-set value or default value
      //user-set value takes privilege
      ret = name in attrVals ? attrVals[name] : _self._getDefAttrVal(name);
      // invoke getter for this attribute
      if (getter && (getter = normalFn(_self, getter))) {
        ret = getter.call(_self, ret, name);
      }
      return ret;
    },
    /**
     * @清理所有属性值
     * @protected
     */
    clearAttrVals: function() {
      this.__attrVals = {};
    },
    /**
     * 移除属性定义
     * @protected
     */
    removeAttr: function(name) {
      var _self = this;
      if (_self.hasAttr(name)) {
        delete _self.__attrs[name];
        delete _self.__attrVals[name];
      }
      return _self;
    },
    /**
     * 设置属性值，会触发before+Name+Change,和 after+Name+Change事件
     * <pre><code>
     *  control.on('beforeTextChange',function(ev){
     *    var newVal = ev.newVal,
     *      attrName = ev.attrName,
     *      preVal = ev.prevVal;
     *
     *    //TO DO
     *  });
     *  control.set('text','new text');  //此时触发 beforeTextChange,afterTextChange
     *  control.set('text','modify text',{silent : true}); //此时不触发事件
     * </code></pre>
     * @param {String|Object} name  属性名
     * @param {Object} value 值
     * @param {Object} opts 配置项
     * @param {Boolean} opts.silent  配置属性时，是否不触发事件
     */
    set: function(name, value, opts) {
      var _self = this;
      if ($.isPlainObject(name)) {
        opts = value;
        var all = Object(name),
          attrs = [];
        for (name in all) {
          if (all.hasOwnProperty(name)) {
            setInternal(_self, name, all[name], opts);
          }
        }
        return _self;
      }
      return setInternal(_self, name, value, opts);
    },
    /**
     * 设置属性，不触发事件
     * <pre><code>
     *  control.setInternal('text','text');//此时不触发事件
     * </code></pre>
     * @param  {String} name  属性名
     * @param  {Object} value 属性值
     * @return {Boolean|undefined}   如果值无效则返回false,否则返回undefined
     */
    setInternal: function(name, value, opts) {
      return this._set(name, value, opts);
    },
    //获取属性默认值
    _getDefAttrVal: function(name) {
      var _self = this,
        attrs = _self.__attrs,
        attrConfig = ensureNonEmpty(attrs, name),
        valFn = attrConfig.valueFn,
        val;
      if (valFn && (valFn = normalFn(_self, valFn))) {
        val = valFn.call(_self);
        if (val !== undefined) {
          attrConfig.value = val;
        }
        delete attrConfig.valueFn;
        attrs[name] = attrConfig;
      }
      return attrConfig.value;
    },
    //仅仅设置属性值
    _set: function(name, value, opts) {
      var _self = this,
        setValue,
        // if host does not have meta info corresponding to (name,value)
        // then register on demand in order to collect all data meta info
        // 一定要注册属性元数据，否则其他模块通过 _attrs 不能枚举到所有有效属性
        // 因为属性在声明注册前可以直接设置值
        attrConfig = ensureNonEmpty(_self.__attrs, name, true),
        setter = attrConfig['setter'];
      // if setter has effect
      if (setter && (setter = normalFn(_self, setter))) {
        setValue = setter.call(_self, value, name);
      }
      if (setValue === INVALID) {
        return false;
      }
      if (setValue !== undefined) {
        value = setValue;
      }
      // finally set
      _self.__attrVals[name] = value;
      return _self;
    },
    //初始化属性
    _initAttrs: function(config) {
      var _self = this;
      if (config) {
        for (var attr in config) {
          if (config.hasOwnProperty(attr)) {
            // 用户设置会调用 setter/validator 的，但不会触发属性变化事件
            _self._set(attr, config[attr]);
          }
        }
      }
    }
  });
  module.exports = Base;
});
define("bui/common/component/component", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview Component命名空间的入口文件
   * @ignore
   */
  /**
   * @class BUI.Component
   * <p>
   * <img src="../assets/img/class-common.jpg"/>
   * </p>
   * 控件基类的命名空间
   */
  var Component = {};
  BUI.mix(Component, {
    Manager: require("bui/common/component/manage"),
    UIBase: require("bui/common/component/uibase/uibase"),
    View: require("bui/common/component/view"),
    Controller: require("bui/common/component/controller")
  });

  function create(component, self) {
      var childConstructor, xclass;
      if (component && (xclass = component.xclass)) {
        if (self && !component.prefixCls) {
          component.prefixCls = self.get('prefixCls');
        }
        childConstructor = Component.Manager.getConstructorByXClass(xclass);
        if (!childConstructor) {
          BUI.error('can not find class by xclass desc : ' + xclass);
        }
        component = new childConstructor(component);
      }
      return component;
    }
    /**
     * 根据Xclass创建对象
     * @method
     * @static
     * @param  {Object} component 控件的配置项或者控件
     * @param  {Object} self      父类实例
     * @return {Object} 实例对象
     */
  Component.create = create;
  module.exports = Component;
});
define("bui/common/component/manage", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview  Base UI控件的管理类
   * @author yiminghe@gmail.com
   * copied by dxq613@gmail.com
   * @ignore
   */
  //控件类的管理器
  var $ = require('jquery');
  var uis = {
    // 不带前缀 prefixCls
    /*
           "menu" :{
           priority:0,
           constructor:Menu
           }
           */
  };

  function getConstructorByXClass(cls) {
    var cs = cls.split(/\s+/),
      p = -1,
      t,
      ui = null;
    for (var i = 0; i < cs.length; i++) {
      var uic = uis[cs[i]];
      if (uic && (t = uic.priority) > p) {
        p = t;
        ui = uic.constructor;
      }
    }
    return ui;
  }

  function getXClassByConstructor(constructor) {
    for (var u in uis) {
      var ui = uis[u];
      if (ui.constructor == constructor) {
        return u;
      }
    }
    return 0;
  }

  function setConstructorByXClass(cls, uic) {
    if (BUI.isFunction(uic)) {
      uis[cls] = {
        constructor: uic,
        priority: 0
      };
    } else {
      uic.priority = uic.priority || 0;
      uis[cls] = uic;
    }
  }

  function getCssClassWithPrefix(cls) {
    var cs = $.trim(cls).split(/\s+/);
    for (var i = 0; i < cs.length; i++) {
      if (cs[i]) {
        cs[i] = this.get('prefixCls') + cs[i];
      }
    }
    return cs.join(' ');
  }
  var componentInstances = {};
  /**
   * Manage component metadata.
   * @class BUI.Component.Manager
   * @singleton
   */
  var Manager = {
    __instances: componentInstances,
    /**
     * 每实例化一个控件，就注册到管理器上
     * @param {String} id  控件 id
     * @param {BUI.Component.Controller} component 控件对象
     */
    addComponent: function(id, component) {
      componentInstances[id] = component;
    },
    /**
     * 移除注册的控件
     * @param  {String} id 控件 id
     */
    removeComponent: function(id) {
      delete componentInstances[id];
    },
    /**
     * 遍历所有的控件
     * @param  {Function} fn 遍历函数
     */
    eachComponent: function(fn) {
      BUI.each(componentInstances, fn);
    },
    /**
     * 根据Id获取控件
     * @param  {String} id 编号
     * @return {BUI.Component.UIBase}   继承 UIBase的类对象
     */
    getComponent: function(id) {
      return componentInstances[id];
    },
    getCssClassWithPrefix: getCssClassWithPrefix,
    /**
     * 通过构造函数获取xclass.
     * @param {Function} constructor 控件的构造函数.
     * @type {Function}
     * @return {String}
     * @method
     */
    getXClassByConstructor: getXClassByConstructor,
    /**
     * 通过xclass获取控件的构造函数
     * @param {String} classNames Class names separated by space.
     * @type {Function}
     * @return {Function}
     * @method
     */
    getConstructorByXClass: getConstructorByXClass,
    /**
     * 将 xclass 同构造函数相关联.
     * @type {Function}
     * @param {String} className 控件的xclass名称.
     * @param {Function} componentConstructor 构造函数
     * @method
     */
    setConstructorByXClass: setConstructorByXClass
  };
  module.exports = Manager;
});
define("bui/common/component/uibase/uibase", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview uibase的入口文件
   * @ignore
   */
  var UIBase = require("bui/common/component/uibase/base");
  BUI.mix(UIBase, {
    Align: require("bui/common/component/uibase/align"),
    AutoShow: require("bui/common/component/uibase/autoshow"),
    AutoHide: require("bui/common/component/uibase/autohide"),
    Close: require("bui/common/component/uibase/close"),
    Collapsable: require("bui/common/component/uibase/collapsable"),
    Drag: require("bui/common/component/uibase/drag"),
    KeyNav: require("bui/common/component/uibase/keynav"),
    List: require("bui/common/component/uibase/list"),
    ListItem: require("bui/common/component/uibase/listitem"),
    Mask: require("bui/common/component/uibase/mask"),
    Position: require("bui/common/component/uibase/position"),
    Selection: require("bui/common/component/uibase/selection"),
    StdMod: require("bui/common/component/uibase/stdmod"),
    Decorate: require("bui/common/component/uibase/decorate"),
    Tpl: require("bui/common/component/uibase/tpl"),
    ChildCfg: require("bui/common/component/uibase/childcfg"),
    Bindable: require("bui/common/component/uibase/bindable"),
    Depends: require("bui/common/component/uibase/depends")
  });
  BUI.mix(UIBase, {
    CloseView: UIBase.Close.View,
    CollapsableView: UIBase.Collapsable.View,
    ChildList: UIBase.List.ChildList,
    /*DomList : UIBase.List.DomList,
    DomListView : UIBase.List.DomList.View,*/
    ListItemView: UIBase.ListItem.View,
    MaskView: UIBase.Mask.View,
    PositionView: UIBase.Position.View,
    StdModView: UIBase.StdMod.View,
    TplView: UIBase.Tpl.View
  });
  module.exports = UIBase;
});
define("bui/common/component/uibase/base", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview  UI控件的流程控制
   * @author yiminghe@gmail.com
   * copied by dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery');
  var Manager = require("bui/common/component/manage"),
    UI_SET = '_uiSet',
    ATTRS = 'ATTRS',
    ucfirst = BUI.ucfirst,
    noop = $.noop,
    Base = require("bui/common/base");
  /**
   * 模拟多继承
   * init attr using constructors ATTRS meta info
   * @ignore
   */
  function initHierarchy(host, config) {
    callMethodByHierarchy(host, 'initializer', 'constructor');
  }

  function callMethodByHierarchy(host, mainMethod, extMethod) {
      var c = host.constructor,
        extChains = [],
        ext,
        main,
        exts,
        t;
      // define
      while (c) {
        // 收集扩展类
        t = [];
        if (exts = c.mixins) {
          for (var i = 0; i < exts.length; i++) {
            ext = exts[i];
            if (ext) {
              if (extMethod != 'constructor') {
                //只调用真正自己构造器原型的定义，继承原型链上的不要管
                if (ext.prototype.hasOwnProperty(extMethod)) {
                  ext = ext.prototype[extMethod];
                } else {
                  ext = null;
                }
              }
              ext && t.push(ext);
            }
          }
        }
        // 收集主类
        // 只调用真正自己构造器原型的定义，继承原型链上的不要管 !important
        // 所以不用自己在 renderUI 中调用 superclass.renderUI 了，UIBase 构造器自动搜寻
        // 以及 initializer 等同理
        if (c.prototype.hasOwnProperty(mainMethod) && (main = c.prototype[mainMethod])) {
          t.push(main);
        }
        // 原地 reverse
        if (t.length) {
          extChains.push.apply(extChains, t.reverse());
        }
        c = c.superclass && c.superclass.constructor;
      }
      // 初始化函数
      // 顺序：父类的所有扩展类函数 -> 父类对应函数 -> 子类的所有扩展函数 -> 子类对应函数
      for (i = extChains.length - 1; i >= 0; i--) {
        extChains[i] && extChains[i].call(host);
      }
    }
    /**
     * 销毁组件顺序： 子类 destructor -> 子类扩展 destructor -> 父类 destructor -> 父类扩展 destructor
     * @ignore
     */
  function destroyHierarchy(host) {
      var c = host.constructor,
        extensions,
        d,
        i;
      while (c) {
        // 只触发该类真正的析构器，和父亲没关系，所以不要在子类析构器中调用 superclass
        if (c.prototype.hasOwnProperty('destructor')) {
          c.prototype.destructor.apply(host);
        }
        if ((extensions = c.mixins)) {
          for (i = extensions.length - 1; i >= 0; i--) {
            d = extensions[i] && extensions[i].prototype.__destructor;
            d && d.apply(host);
          }
        }
        c = c.superclass && c.superclass.constructor;
      }
    }
    /**
     * 构建 插件
     * @ignore
     */
  function constructPlugins(plugins) {
      if (!plugins) {
        return;
      }
      BUI.each(plugins, function(plugin, i) {
        if (BUI.isFunction(plugin)) {
          plugins[i] = new plugin();
        }
      });
    }
    /**
     * 调用插件的方法
     * @ignore
     */
  function actionPlugins(self, plugins, action) {
      if (!plugins) {
        return;
      }
      BUI.each(plugins, function(plugin, i) {
        if (plugin[action]) {
          plugin[action](self);
        }
      });
    }
    /**
     * 根据属性变化设置 UI
     * @ignore
     */
  function bindUI(self) {
      /*var attrs = self.getAttrs(),
              attr,
              m;

          for (attr in attrs) {
              if (attrs.hasOwnProperty(attr)) {
                  m = UI_SET + ucfirst(attr);
                  if (self[m]) {
                      // 自动绑定事件到对应函数
                      (function (attr, m) {
                          self.on('after' + ucfirst(attr) + 'Change', function (ev) {
                              // fix! 防止冒泡过来的
                              if (ev.target === self) {
                                  self[m](ev.newVal, ev);
                              }
                          });
                      })(attr, m);
                  }
              }
          }
          */
    }
    /**
     * 根据当前（初始化）状态来设置 UI
     * @ignore
     */
  function syncUI(self) {
      var v,
        f,
        attrs = self.getAttrs();
      for (var a in attrs) {
        if (attrs.hasOwnProperty(a)) {
          var m = UI_SET + ucfirst(a);
          //存在方法，并且用户设置了初始值或者存在默认值，就同步状态
          if ((f = self[m])
            // 用户如果设置了显式不同步，就不同步，比如一些值从 html 中读取，不需要同步再次设置
            && attrs[a].sync !== false && (v = self.get(a)) !== undefined) {
            f.call(self, v);
          }
        }
      }
    }
    /**
     * 控件库的基类，包括控件的生命周期,下面是基本的扩展类
     * <p>
     * <img src="https://dxq613.github.io/assets/img/class-mixins.jpg"/>
     * </p>
     * @class BUI.Component.UIBase
     * @extends BUI.Base
     * @param  {Object} config 配置项
     */
  var UIBase = function(config) {
    var _self = this,
      id;
    // 读取用户设置的属性值并设置到自身
    Base.apply(_self, arguments);
    //保存用户传入的配置项
    _self.setInternal('userConfig', config);
    // 按照类层次执行初始函数，主类执行 initializer 函数，扩展类执行构造器函数
    initHierarchy(_self, config);
    var listener,
      n,
      plugins = _self.get('plugins')
      /*,
            listeners = _self.get('listeners')*/
    ;
    constructPlugins(plugins);
    var xclass = _self.get('xclass');
    if (xclass) {
      _self.__xclass = xclass; //debug 方便
    }
    actionPlugins(_self, plugins, 'initializer');
    // 是否自动渲染
    config && config.autoRender && _self.render();
  };
  UIBase.ATTRS = {
    /**
     * 用户传入的配置项
     * @type {Object}
     * @readOnly
     * @protected
     */
    userConfig: {},
    /**
     * 是否自动渲染,如果不自动渲染，需要用户调用 render()方法
     * <pre><code>
     *  //默认状态下创建对象，并没有进行render
     *  var control = new Control();
     *  control.render(); //需要调用render方法
     *
     *  //设置autoRender后，不需要调用render方法
     *  var control = new Control({
     *   autoRender : true
     *  });
     * </code></pre>
     * @cfg {Boolean} autoRender
     */
    /**
     * 是否自动渲染,如果不自动渲染，需要用户调用 render()方法
     * @type {Boolean}
     * @ignore
     */
    autoRender: {
      value: false
    },
    /**
     * @type {Object}
     * 事件处理函数:
     *      {
     *        'click':function(e){}
     *      }
     *  @ignore
     */
    listeners: {
      value: {}
    },
    /**
     * 插件集合
     * <pre><code>
     *  var grid = new Grid({
     *    columns : [{},{}],
     *    plugins : [Grid.Plugins.RadioSelection]
     *  });
     * </code></pre>
     * @cfg {Array} plugins
     */
    /**
     * 插件集合
     * @type {Array}
     * @readOnly
     */
    plugins: {
      //value : []
    },
    /**
     * 是否已经渲染完成
     * @type {Boolean}
     * @default  false
     * @readOnly
     */
    rendered: {
      value: false
    },
    /**
     * 获取控件的 xclass
     * @readOnly
     * @type {String}
     * @protected
     */
    xclass: {
      valueFn: function() {
        return Manager.getXClassByConstructor(this.constructor);
      }
    }
  };
  BUI.extend(UIBase, Base);
  BUI.augment(UIBase, {
    /**
     * 创建DOM结构
     * @protected
     */
    create: function() {
      var self = this;
      // 是否生成过节点
      if (!self.get('created')) {
        /**
         * @event beforeCreateDom
         * fired before root node is created
         * @param e
         */
        self.fire('beforeCreateDom');
        callMethodByHierarchy(self, 'createDom', '__createDom');
        self._set('created', true);
        /**
         * @event afterCreateDom
         * fired when root node is created
         * @param e
         */
        self.fire('afterCreateDom');
        actionPlugins(self, self.get('plugins'), 'createDom');
      }
      return self;
    },
    /**
     * 渲染
     */
    render: function() {
      var _self = this;
      // 是否已经渲染过
      if (!_self.get('rendered')) {
        var plugins = _self.get('plugins');
        _self.create(undefined);
        _self.set('created', true);
        /**
         * @event beforeRenderUI
         * fired when root node is ready
         * @param e
         */
        _self.fire('beforeRenderUI');
        callMethodByHierarchy(_self, 'renderUI', '__renderUI');
        /**
         * @event afterRenderUI
         * fired after root node is rendered into dom
         * @param e
         */
        _self.fire('afterRenderUI');
        actionPlugins(_self, plugins, 'renderUI');
        /**
         * @event beforeBindUI
         * fired before UIBase 's internal event is bind.
         * @param e
         */
        _self.fire('beforeBindUI');
        bindUI(_self);
        callMethodByHierarchy(_self, 'bindUI', '__bindUI');
        _self.set('binded', true);
        /**
         * @event afterBindUI
         * fired when UIBase 's internal event is bind.
         * @param e
         */
        _self.fire('afterBindUI');
        actionPlugins(_self, plugins, 'bindUI');
        /**
         * @event beforeSyncUI
         * fired before UIBase 's internal state is synchronized.
         * @param e
         */
        _self.fire('beforeSyncUI');
        syncUI(_self);
        callMethodByHierarchy(_self, 'syncUI', '__syncUI');
        /**
         * @event afterSyncUI
         * fired after UIBase 's internal state is synchronized.
         * @param e
         */
        _self.fire('afterSyncUI');
        actionPlugins(_self, plugins, 'syncUI');
        _self._set('rendered', true);
      }
      return _self;
    },
    /**
     * 子类可继承此方法，当DOM创建时调用
     * @protected
     * @method
     */
    createDom: noop,
    /**
     * 子类可继承此方法，渲染UI时调用
     * @protected
     *  @method
     */
    renderUI: noop,
    /**
     * 子类可继承此方法,绑定事件时调用
     * @protected
     * @method
     */
    bindUI: noop,
    /**
     * 同步属性值到UI上
     * @protected
     * @method
     */
    syncUI: noop,
    /**
     * 析构函数
     */
    destroy: function() {
      var _self = this;
      if (_self.destroyed) { //防止返回销毁
        return _self;
      }
      /**
       * @event beforeDestroy
       * fired before UIBase 's destroy.
       * @param e
       */
      _self.fire('beforeDestroy');
      actionPlugins(_self, _self.get('plugins'), 'destructor');
      destroyHierarchy(_self);
      /**
       * @event afterDestroy
       * fired before UIBase 's destroy.
       * @param e
       */
      _self.fire('afterDestroy');
      _self.off();
      _self.clearAttrVals();
      _self.destroyed = true;
      return _self;
    }
  });
  //延时处理构造函数
  function initConstuctor(c) {
    var constructors = [];
    while (c.base) {
      constructors.push(c);
      c = c.base;
    }
    for (var i = constructors.length - 1; i >= 0; i--) {
      var C = constructors[i];
      //BUI.extend(C,C.base,C.px,C.sx);
      BUI.mix(C.prototype, C.px);
      BUI.mix(C, C.sx);
      C.base = null;
      C.px = null;
      C.sx = null;
    }
  }
  BUI.mix(UIBase, {
    /**
     * 定义一个类
     * @static
     * @param  {Function} base   基类构造函数
     * @param  {Array} extensions 扩展
     * @param  {Object} px  原型链上的扩展
     * @param  {Object} sx
     * @return {Function} 继承与基类的构造函数
     */
    define: function(base, extensions, px, sx) {
      if ($.isPlainObject(extensions)) {
        sx = px;
        px = extensions;
        extensions = [];
      }

      function C() {
        var c = this.constructor;
        if (c.base) {
          initConstuctor(c);
        }
        UIBase.apply(this, arguments);
      }
      BUI.extend(C, base); //无法延迟
      C.base = base;
      C.px = px; //延迟复制原型链上的函数
      C.sx = sx; //延迟复制静态属性
      //BUI.mixin(C,extensions);
      if (extensions.length) { //延迟执行mixin
        C.extensions = extensions;
      }
      return C;
    },
    /**
     * 扩展一个类，基类就是类本身
     * @static
     * @param  {Array} extensions 扩展
     * @param  {Object} px  原型链上的扩展
     * @param  {Object} sx
     * @return {Function} 继承与基类的构造函数
     */
    extend: function extend(extensions, px, sx) {
      var args = $.makeArray(arguments),
        ret,
        last = args[args.length - 1];
      args.unshift(this);
      if (last.xclass) {
        args.pop();
        args.push(last.xclass);
      }
      ret = UIBase.define.apply(UIBase, args);
      if (last.xclass) {
        var priority = last.priority || (this.priority ? (this.priority + 1) : 1);
        Manager.setConstructorByXClass(last.xclass, {
          constructor: ret,
          priority: priority
        });
        //方便调试
        ret.__xclass = last.xclass;
        ret.priority = priority;
        ret.toString = function() {
          return last.xclass;
        }
      }
      ret.extend = extend;
      return ret;
    }
  });
  module.exports = UIBase;
});
define("bui/common/component/uibase/align", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 跟指定的元素项对齐的方式
   * @author yiminghe@gmail.com
   * copied by dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    UA = require("bui/common/ua"),
    CLS_ALIGN_PREFIX = 'x-align-',
    win = window;
  // var ieMode = document.documentMode || UA.ie;
  /*
   inspired by closure library by Google
   see http://yiminghe.iteye.com/blog/1124720
   */
  /**
   * 得到会导致元素显示不全的祖先元素
   * @ignore
   */
  function getOffsetParent(element) {
      // ie 这个也不是完全可行
      /**
       <div style="width: 50px;height: 100px;overflow: hidden">
       <div style="width: 50px;height: 100px;position: relative;" id="d6">
       元素 6 高 100px 宽 50px<br/>
       </div>
       </div>
       @ignore
       **/
      // element.offsetParent does the right thing in ie7 and below. Return parent with layout!
      //  In other browsers it only includes elements with position absolute, relative or
      // fixed, not elements with overflow set to auto or scroll.
      //    if (UA.ie && ieMode < 8) {
      //      return element.offsetParent;
      //    }
      // 统一的 offsetParent 方法
      var doc = element.ownerDocument,
        body = doc.body,
        parent,
        positionStyle = $(element).css('position'),
        skipStatic = positionStyle == 'fixed' || positionStyle == 'absolute';
      if (!skipStatic) {
        return element.nodeName.toLowerCase() == 'html' ? null : element.parentNode;
      }
      for (parent = element.parentNode; parent && parent != body; parent = parent.parentNode) {
        positionStyle = $(parent).css('position');
        if (positionStyle != 'static') {
          return parent;
        }
      }
      return null;
    }
    /**
     * 获得元素的显示部分的区域
     * @private
     * @ignore
     */
  function getVisibleRectForElement(element) {
    var visibleRect = {
        left: 0,
        right: Infinity,
        top: 0,
        bottom: Infinity
      },
      el,
      scrollX,
      scrollY,
      winSize,
      doc = element.ownerDocument,
      body = doc.body,
      documentElement = doc.documentElement;
    // Determine the size of the visible rect by climbing the dom accounting for
    // all scrollable containers.
    for (el = element; el = getOffsetParent(el);) {
      // clientWidth is zero for inline block elements in ie.
      if ((!UA.ie || el.clientWidth != 0) &&
        // body may have overflow set on it, yet we still get the entire
        // viewport. In some browsers, el.offsetParent may be
        // document.documentElement, so check for that too.
        (el != body && el != documentElement && $(el).css('overflow') != 'visible')) {
        var pos = $(el).offset();
        // add border
        pos.left += el.clientLeft;
        pos.top += el.clientTop;
        visibleRect.top = Math.max(visibleRect.top, pos.top);
        visibleRect.right = Math.min(visibleRect.right,
          // consider area without scrollBar
          pos.left + el.clientWidth);
        visibleRect.bottom = Math.min(visibleRect.bottom, pos.top + el.clientHeight);
        visibleRect.left = Math.max(visibleRect.left, pos.left);
      }
    }
    // Clip by window's viewport.
    scrollX = $(win).scrollLeft();
    scrollY = $(win).scrollTop();
    visibleRect.left = Math.max(visibleRect.left, scrollX);
    visibleRect.top = Math.max(visibleRect.top, scrollY);
    winSize = {
      width: BUI.viewportWidth(),
      height: BUI.viewportHeight()
    };
    visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
    visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
    return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null;
  }

  function getElFuturePos(elRegion, refNodeRegion, points, offset) {
    var xy,
      diff,
      p1,
      p2;
    xy = {
      left: elRegion.left,
      top: elRegion.top
    };
    p1 = getAlignOffset(refNodeRegion, points[0]);
    p2 = getAlignOffset(elRegion, points[1]);
    diff = [p2.left - p1.left, p2.top - p1.top];
    return {
      left: xy.left - diff[0] + (+offset[0]),
      top: xy.top - diff[1] + (+offset[1])
    };
  }

  function isFailX(elFuturePos, elRegion, visibleRect) {
    return elFuturePos.left < visibleRect.left || elFuturePos.left + elRegion.width > visibleRect.right;
  }

  function isFailY(elFuturePos, elRegion, visibleRect) {
    return elFuturePos.top < visibleRect.top || elFuturePos.top + elRegion.height > visibleRect.bottom;
  }

  function adjustForViewport(elFuturePos, elRegion, visibleRect, overflow) {
    var pos = BUI.cloneObject(elFuturePos),
      size = {
        width: elRegion.width,
        height: elRegion.height
      };
    if (overflow.adjustX && pos.left < visibleRect.left) {
      pos.left = visibleRect.left;
    }
    // Left edge inside and right edge outside viewport, try to resize it.
    if (overflow['resizeWidth'] && pos.left >= visibleRect.left && pos.left + size.width > visibleRect.right) {
      size.width -= (pos.left + size.width) - visibleRect.right;
    }
    // Right edge outside viewport, try to move it.
    if (overflow.adjustX && pos.left + size.width > visibleRect.right) {
      // 保证左边界和可视区域左边界对齐
      pos.left = Math.max(visibleRect.right - size.width, visibleRect.left);
    }
    // Top edge outside viewport, try to move it.
    if (overflow.adjustY && pos.top < visibleRect.top) {
      pos.top = visibleRect.top;
    }
    // Top edge inside and bottom edge outside viewport, try to resize it.
    if (overflow['resizeHeight'] && pos.top >= visibleRect.top && pos.top + size.height > visibleRect.bottom) {
      size.height -= (pos.top + size.height) - visibleRect.bottom;
    }
    // Bottom edge outside viewport, try to move it.
    if (overflow.adjustY && pos.top + size.height > visibleRect.bottom) {
      // 保证上边界和可视区域上边界对齐
      pos.top = Math.max(visibleRect.bottom - size.height, visibleRect.top);
    }
    return BUI.mix(pos, size);
  }

  function flip(points, reg, map) {
    var ret = [];
    $.each(points, function(index, p) {
      ret.push(p.replace(reg, function(m) {
        return map[m];
      }));
    });
    return ret;
  }

  function flipOffset(offset, index) {
      offset[index] = -offset[index];
      return offset;
    }
    /**
     * @class BUI.Component.UIBase.Align
     * Align extension class.
     * Align component with specified element.
     * <img src="http://images.cnitblog.com/blog/111279/201304/09180221-201343d4265c46e7987e6b1c46d5461a.jpg"/>
     */
  function Align() {}
  Align.__getOffsetParent = getOffsetParent;
  Align.__getVisibleRectForElement = getVisibleRectForElement;
  Align.ATTRS = {
    /**
     * 对齐配置，详细说明请参看： <a href="http://www.cnblogs.com/zaohe/archive/2013/04/09/3010651.html">JS控件 对齐</a>
     * @cfg {Object} align
     * <pre><code>
     *  var overlay = new Overlay( {
     *     align :{
     *     node: null,     // 参考元素, falsy 或 window 为可视区域, 'trigger' 为触发元素, 其他为指定元素
     *     points: ['cc','cc'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
     *     offset: [0, 0]    // 有效值为 [n, m]
     *     }
     *   });
     * </code></pre>
     */
    /**
     * 设置对齐属性
     * @type {Object}
     * @field
     * <code>
     *   var align =  {
     *    node: null,     // 参考元素, falsy 或 window 为可视区域, 'trigger' 为触发元素, 其他为指定元素
     *    points: ['cc','cc'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
     *    offset: [0, 0]    // 有效值为 [n, m]
     *   };
     *   overlay.set('align',align);
     * </code>
     */
    align: {
      shared: false,
      value: {}
    }
  };

  function getRegion(node) {
      var offset, w, h;
      if (node.length && !$.isWindow(node[0])) {
        offset = node.offset();
        w = node.outerWidth();
        h = node.outerHeight();
      } else {
        offset = {
          left: BUI.scrollLeft(),
          top: BUI.scrollTop()
        };
        w = BUI.viewportWidth();
        h = BUI.viewportHeight();
      }
      offset.width = w;
      offset.height = h;
      return offset;
    }
    /**
     * 获取 node 上的 align 对齐点 相对于页面的坐标
     * @param region
     * @param align
     */
  function getAlignOffset(region, align) {
      var V = align.charAt(0),
        H = align.charAt(1),
        w = region.width,
        h = region.height,
        x, y;
      x = region.left;
      y = region.top;
      if (V === 'c') {
        y += h / 2;
      } else if (V === 'b') {
        y += h;
      }
      if (H === 'c') {
        x += w / 2;
      } else if (H === 'r') {
        x += w;
      }
      return {
        left: x,
        top: y
      };
    }
    //清除对齐的css样式
  function clearAlignCls(el) {
    var cls = el.attr('class'),
      regex = new RegExp('\s?' + CLS_ALIGN_PREFIX + '[a-z]{2}-[a-z]{2}', 'ig'),
      arr = regex.exec(cls);
    if (arr) {
      el.removeClass(arr.join(' '));
    }
  }
  Align.prototype = {
    _uiSetAlign: function(v, ev) {
      var alignCls = '',
        el,
        selfAlign; //points 的第二个参数，是自己对齐于其他节点的的方式
      if (v && v.points) {
        this.align(v.node, v.points, v.offset, v.overflow);
        this.set('cachePosition', null);
        el = this.get('el');
        clearAlignCls(el);
        selfAlign = v.points.join('-');
        alignCls = CLS_ALIGN_PREFIX + selfAlign;
        el.addClass(alignCls);
        /**/
      }
    },
    __bindUI: function() {
      var _self = this;
      var fn = BUI.wrapBehavior(_self, 'handleWindowResize');
      _self.on('show', function() {
        $(window).on('resize', fn);
      });
      _self.on('hide', function() {
        $(window).off('resize', fn);
      });
    },
    //处理window resize事件
    handleWindowResize: function() {
      var _self = this,
        align = _self.get('align');
      _self.set('align', align);
    },
    /*
     对齐 Overlay 到 node 的 points 点, 偏移 offset 处
     @method
     @ignore
     @param {Element} node 参照元素, 可取配置选项中的设置, 也可是一元素
     @param {String[]} points 对齐方式
     @param {Number[]} [offset] 偏移
     */
    align: function(refNode, points, offset, overflow) {
      refNode = $(refNode || win);
      offset = offset && [].concat(offset) || [0, 0];
      overflow = overflow || {};
      var self = this,
        el = self.get('el'),
        fail = 0,
        // 当前节点可以被放置的显示区域
        visibleRect = getVisibleRectForElement(el[0]),
        // 当前节点所占的区域, left/top/width/height
        elRegion = getRegion(el),
        // 参照节点所占的区域, left/top/width/height
        refNodeRegion = getRegion(refNode),
        // 当前节点将要被放置的位置
        elFuturePos = getElFuturePos(elRegion, refNodeRegion, points, offset),
        // 当前节点将要所处的区域
        newElRegion = BUI.merge(elRegion, elFuturePos);
      // 如果可视区域不能完全放置当前节点时允许调整
      if (visibleRect && (overflow.adjustX || overflow.adjustY)) {
        // 如果横向不能放下
        if (isFailX(elFuturePos, elRegion, visibleRect)) {
          fail = 1;
          // 对齐位置反下
          points = flip(points, /[lr]/ig, {
            l: 'r',
            r: 'l'
          });
          // 偏移量也反下
          offset = flipOffset(offset, 0);
        }
        // 如果纵向不能放下
        if (isFailY(elFuturePos, elRegion, visibleRect)) {
          fail = 1;
          // 对齐位置反下
          points = flip(points, /[tb]/ig, {
            t: 'b',
            b: 't'
          });
          // 偏移量也反下
          offset = flipOffset(offset, 1);
        }
        // 如果失败，重新计算当前节点将要被放置的位置
        if (fail) {
          elFuturePos = getElFuturePos(elRegion, refNodeRegion, points, offset);
          BUI.mix(newElRegion, elFuturePos);
        }
        var newOverflowCfg = {};
        // 检查反下后的位置是否可以放下了
        // 如果仍然放不下只有指定了可以调整当前方向才调整
        newOverflowCfg.adjustX = overflow.adjustX && isFailX(elFuturePos, elRegion, visibleRect);
        newOverflowCfg.adjustY = overflow.adjustY && isFailY(elFuturePos, elRegion, visibleRect);
        // 确实要调整，甚至可能会调整高度宽度
        if (newOverflowCfg.adjustX || newOverflowCfg.adjustY) {
          newElRegion = adjustForViewport(elFuturePos, elRegion, visibleRect, newOverflowCfg);
        }
      }
      // 新区域位置发生了变化
      if (newElRegion.left != elRegion.left) {
        self.setInternal('x', null);
        self.get('view').setInternal('x', null);
        self.set('x', newElRegion.left);
      }
      if (newElRegion.top != elRegion.top) {
        // https://github.com/kissyteam/kissy/issues/190
        // 相对于屏幕位置没变，而 left/top 变了
        // 例如 <div 'relative'><el absolute></div>
        // el.align(div)
        self.setInternal('y', null);
        self.get('view').setInternal('y', null);
        self.set('y', newElRegion.top);
      }
      // 新区域高宽发生了变化
      if (newElRegion.width != elRegion.width) {
        el.width(el.width() + newElRegion.width - elRegion.width);
      }
      if (newElRegion.height != elRegion.height) {
        el.height(el.height() + newElRegion.height - elRegion.height);
      }
      return self;
    },
    /**
     * 对齐到元素的中间，查看属性 {@link BUI.Component.UIBase.Align#property-align} .
     * <pre><code>
     *  control.center('#t1'); //控件处于容器#t1的中间位置
     * </code></pre>
     * @param {undefined|String|HTMLElement|jQuery} node
     *
     */
    center: function(node) {
      var self = this;
      self.set('align', {
        node: node,
        points: ['cc', 'cc'],
        offset: [0, 0]
      });
      return self;
    }
  };
  module.exports = Align;
});
define("bui/common/component/uibase/autoshow", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview click，focus,hover等引起控件显示，并且定位
   * @ignore
   */
  var $ = require('jquery');
  /**
   * 处理自动显示控件的扩展，一般用于显示menu,picker,tip等
   * @class BUI.Component.UIBase.AutoShow
   */
  function autoShow() {}
  autoShow.ATTRS = {
    /**
     * 触发显示控件的DOM选择器
     * <pre><code>
     *  var overlay = new Overlay({ //点击#t1时显示，点击#t1,overlay之外的元素隐藏
     *    trigger : '#t1',
     *    autoHide : true,
     *    content : '悬浮内容'
     *  });
     *  overlay.render();
     * </code></pre>
     * @cfg {HTMLElement|String|jQuery} trigger
     */
    /**
     * 触发显示控件的DOM选择器
     * @type {HTMLElement|String|jQuery}
     */
    trigger: {},
    delegateTigger: {
      getter: function() {
        this.get('delegateTrigger'); //兼容之前的版本
      },
      setter: function(v) {
        this.set('delegateTrigger', v);
      }
    },
    /**
     * 是否使用代理的方式触发显示控件,如果tigger不是字符串，此属性无效
     * <pre><code>
     *  var overlay = new Overlay({ //点击.t1(无论创建控件时.t1是否存在)时显示，点击.t1,overlay之外的元素隐藏
     *    trigger : '.t1',
     *    autoHide : true,
     *    delegateTrigger : true, //使用委托的方式触发显示控件
     *    content : '悬浮内容'
     *  });
     *  overlay.render();
     * </code></pre>
     * @cfg {Boolean} [delegateTrigger = false]
     */
    /**
     * 是否使用代理的方式触发显示控件,如果tigger不是字符串，此属性无效
     * @type {Boolean}
     * @ignore
     */
    delegateTrigger: {
      value: false
    },
    /**
     * 选择器是否始终跟随触发器对齐
     * @cfg {Boolean} autoAlign
     * @ignore
     */
    /**
     * 选择器是否始终跟随触发器对齐
     * @type {Boolean}
     * @protected
     */
    autoAlign: {
      value: true
    },
    /**
     * 显示时是否默认获取焦点
     * @type {Boolean}
     */
    autoFocused: {
      value: true
    },
    /**
     * 如果设置了这个样式，那么触发显示（overlay）时trigger会添加此样式
     * @type {Object}
     */
    triggerActiveCls: {},
    /**
     * 控件显示时由此trigger触发，当配置项 trigger 选择器代表多个DOM 对象时，
     * 控件可由多个DOM对象触发显示。
     * <pre><code>
     *  overlay.on('show',function(){
     *    var curTrigger = overlay.get('curTrigger');
     *    //TO DO
     *  });
     * </code></pre>
     * @type {jQuery}
     * @readOnly
     */
    curTrigger: {},
    /**
     * 触发显示时的回调函数
     * @cfg {Function} triggerCallback
     * @ignore
     */
    /**
     * 触发显示时的回调函数
     * @type {Function}
     * @ignore
     */
    triggerCallback: {},
    /**
     * 显示菜单的事件
     *  <pre><code>
     *    var overlay = new Overlay({ //移动到#t1时显示，移动出#t1,overlay之外控件隐藏
     *      trigger : '#t1',
     *      autoHide : true,
     *      triggerEvent :'mouseover',
     *      autoHideType : 'leave',
     *      content : '悬浮内容'
     *    });
     *    overlay.render();
     *
     *  </code></pre>
     * @cfg {String} [triggerEvent='click']
     * @default 'click'
     */
    /**
     * 显示菜单的事件
     * @type {String}
     * @default 'click'
     * @ignore
     */
    triggerEvent: {
      value: 'click'
    },
    /**
     * 因为触发元素发生改变而导致控件隐藏
     * @cfg {String} triggerHideEvent
     * @ignore
     */
    /**
     * 因为触发元素发生改变而导致控件隐藏
     * @type {String}
     * @ignore
     */
    triggerHideEvent: {},
    events: {
      value: {
        /**
         * 当触发器（触发选择器出现）发生改变时，经常用于一个选择器对应多个触发器的情况
         * <pre><code>
         *  overlay.on('triggerchange',function(ev){
         *    var curTrigger = ev.curTrigger;
         *    overlay.set('content',curTrigger.html());
         *  });
         * </code></pre>
         * @event
         * @param {Object} e 事件对象
         * @param {jQuery} e.prevTrigger 之前触发器，可能为null
         * @param {jQuery} e.curTrigger 当前的触发器
         */
        'triggerchange': false
      }
    }
  };
  autoShow.prototype = {
    __createDom: function() {
      this._setTrigger();
    },
    __bindUI: function() {
      var _self = this,
        triggerActiveCls = _self.get('triggerActiveCls');
      if (triggerActiveCls) {
        _self.on('hide', function() {
          var curTrigger = _self.get('curTrigger');
          if (curTrigger) {
            curTrigger.removeClass(triggerActiveCls);
          }
        });
      }
    },
    _setTrigger: function() {
      var _self = this,
        triggerEvent = _self.get('triggerEvent'),
        triggerHideEvent = _self.get('triggerHideEvent'),
        triggerCallback = _self.get('triggerCallback'),
        triggerActiveCls = _self.get('triggerActiveCls') || '',
        trigger = _self.get('trigger'),
        isDelegate = _self.get('delegateTrigger'),
        triggerEl = $(trigger);
      //触发显示
      function tiggerShow(ev) {
          if (_self.get('disabled')) { //如果禁用则中断
            return;
          }
          var prevTrigger = _self.get('curTrigger'),
            curTrigger = isDelegate ? $(ev.currentTarget) : $(this),
            align = _self.get('align');
          if (!prevTrigger || prevTrigger[0] != curTrigger[0]) {
            if (prevTrigger) {
              prevTrigger.removeClass(triggerActiveCls);
            }
            _self.set('curTrigger', curTrigger);
            _self.fire('triggerchange', {
              prevTrigger: prevTrigger,
              curTrigger: curTrigger
            });
          }
          curTrigger.addClass(triggerActiveCls);
          if (_self.get('autoAlign')) {
            align.node = curTrigger;
          }
          _self.set('align', align);
          _self.show();
          triggerCallback && triggerCallback(ev);
        }
        //触发隐藏
      function tiggerHide(ev) {
        var toElement = ev.toElement || ev.relatedTarget;
        if (!toElement || !_self.containsElement(toElement)) { //mouseleave时，如果移动到当前控件上，取消消失
          _self.hide();
        }
      }
      if (triggerEvent) {
        if (isDelegate && BUI.isString(trigger)) {
          $(document).delegate(trigger, triggerEvent, tiggerShow);
        } else {
          triggerEl.on(triggerEvent, tiggerShow);
        }
      }
      if (triggerHideEvent) {
        if (isDelegate && BUI.isString(trigger)) {
          $(document).delegate(trigger, triggerHideEvent, tiggerHide);
        } else {
          triggerEl.on(triggerHideEvent, tiggerHide);
        }
      }
    },
    __renderUI: function() {
      var _self = this,
        align = _self.get('align');
      //如果控件显示时不是由trigger触发，则同父元素对齐
      if (align && !align.node) {
        align.node = _self.get('render') || _self.get('trigger');
      }
    }
  };
  module.exports = autoShow;
});
define("bui/common/component/uibase/autohide", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 点击或移出控件外部，控件隐藏
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    wrapBehavior = BUI.wrapBehavior,
    getWrapBehavior = BUI.getWrapBehavior;

  function isExcept(self, elem) {
      var hideExceptNode = self.get('hideExceptNode');
      if (hideExceptNode && hideExceptNode.length) {
        return $.contains(hideExceptNode[0], elem);
      }
      return false;
    }
    /**
     * 点击隐藏控件的扩展
     * @class BUI.Component.UIBase.AutoHide
     */
  function autoHide() {}
  autoHide.ATTRS = {
    /**
     * 控件自动隐藏的事件，这里支持2种：
     *  - 'click'
     *  - 'leave'
     *  <pre><code>
     *    var overlay = new Overlay({ //点击#t1时显示，点击#t1之外的元素隐藏
     *      trigger : '#t1',
     *      autoHide : true,
     *      content : '悬浮内容'
     *    });
     *    overlay.render();
     *
     *    var overlay = new Overlay({ //移动到#t1时显示，移动出#t1,overlay之外控件隐藏
     *      trigger : '#t1',
     *      autoHide : true,
     *      triggerEvent :'mouseover',
     *      autoHideType : 'leave',
     *      content : '悬浮内容'
     *    });
     *    overlay.render();
     *
     *  </code></pre>
     * @cfg {String} [autoHideType = 'click']
     */
    /**
     * 控件自动隐藏的事件，这里支持2种：
     * 'click',和'leave',默认为'click'
     * @type {String}
     */
    autoHideType: {
      value: 'click'
    },
    /**
     * 是否自动隐藏
     * <pre><code>
     *
     *  var overlay = new Overlay({ //点击#t1时显示，点击#t1,overlay之外的元素隐藏
     *    trigger : '#t1',
     *    autoHide : true,
     *    content : '悬浮内容'
     *  });
     *  overlay.render();
     * </code></pre>
     * @cfg {Object} autoHide
     */
    /**
     * 是否自动隐藏
     * @type {Object}
     * @ignore
     */
    autoHide: {
      value: false
    },
    /**
     * 点击或者移动到此节点时不触发自动隐藏
     * <pre><code>
     *
     *  var overlay = new Overlay({ //点击#t1时显示，点击#t1,#t2,overlay之外的元素隐藏
     *    trigger : '#t1',
     *    autoHide : true,
     *    hideExceptNode : '#t2',
     *    content : '悬浮内容'
     *  });
     *  overlay.render();
     * </code></pre>
     * @cfg {Object} hideExceptNode
     */
    hideExceptNode: {},
    events: {
      value: {
        /**
         * @event autohide
         * 点击控件外部时触发，只有在控件设置自动隐藏(autoHide = true)有效
         * 可以阻止控件隐藏，通过在事件监听函数中 return false
         * <pre><code>
         *  overlay.on('autohide',function(){
         *    var curTrigger = overlay.curTrigger; //当前触发的项
         *    if(condtion){
         *      return false; //阻止隐藏
         *    }
         *  });
         * </code></pre>
         */
        autohide: false
      }
    }
  };
  autoHide.prototype = {
    __bindUI: function() {
      var _self = this;
      _self.on('afterVisibleChange', function(ev) {
        var visible = ev.newVal;
        if (_self.get('autoHide')) {
          if (visible) {
            _self._bindHideEvent();
          } else {
            _self._clearHideEvent();
          }
        }
      });
    },
    /**
     * 处理鼠标移出事件，不影响{BUI.Component.Controller#handleMouseLeave}事件
     * @param  {jQuery.Event} ev 事件对象
     */
    handleMoveOuter: function(ev) {
      var _self = this,
        target = ev.toElement || ev.relatedTarget;
      if (!_self.containsElement(target) && !isExcept(_self, target)) {
        if (_self.fire('autohide') !== false) {
          _self.hide();
        }
      }
    },
    /**
     * 点击页面时的处理函数
     * @param {jQuery.Event} ev 事件对象
     * @protected
     */
    handleDocumentClick: function(ev) {
      var _self = this,
        target = ev.target;
      if (!_self.containsElement(target) && !isExcept(_self, target)) {
        if (_self.fire('autohide') !== false) {
          _self.hide();
        }
      }
    },
    _bindHideEvent: function() {
      var _self = this,
        trigger = _self.get('curTrigger'),
        autoHideType = _self.get('autoHideType');
      if (autoHideType === 'click') {
        $(document).on('mousedown', wrapBehavior(_self, 'handleDocumentClick'));
      } else {
        _self.get('el').on('mouseleave', wrapBehavior(_self, 'handleMoveOuter'));
        if (trigger) {
          $(trigger).on('mouseleave', wrapBehavior(_self, 'handleMoveOuter'))
        }
      }
    },
    //清除绑定的隐藏事件
    _clearHideEvent: function() {
      var _self = this,
        trigger = _self.get('curTrigger'),
        autoHideType = _self.get('autoHideType');
      if (autoHideType === 'click') {
        $(document).off('mousedown', getWrapBehavior(_self, 'handleDocumentClick'));
      } else {
        _self.get('el').off('mouseleave', getWrapBehavior(_self, 'handleMoveOuter'));
        if (trigger) {
          $(trigger).off('mouseleave', getWrapBehavior(_self, 'handleMoveOuter'))
        }
      }
    }
  };
  module.exports = autoHide;
});
define("bui/common/component/uibase/close", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview close 关闭或隐藏控件
   * @author yiminghe@gmail.com
   * copied and modified by dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery');
  var CLS_PREFIX = BUI.prefix + 'ext-';

  function getCloseRenderBtn(self) {
      return $(self.get('closeTpl'));
    }
    /**
     * 关闭按钮的视图类
     * @class BUI.Component.UIBase.CloseView
     * @private
     */
  function CloseView() {}
  CloseView.ATTRS = {
    closeTpl: {
      value: '<a ' + 'tabindex="0" ' + "href='javascript:void(\"关闭\")' " + 'role="button" ' + 'class="' + CLS_PREFIX + 'close' + '">' + '<span class="' + CLS_PREFIX + 'close-x' + '">关闭<' + '/span>' + '<' + '/a>'
    },
    closeable: {
      value: true
    },
    closeBtn: {}
  };
  CloseView.prototype = {
    _uiSetCloseable: function(v) {
      var self = this,
        btn = self.get('closeBtn');
      if (v) {
        if (!btn) {
          self.setInternal('closeBtn', btn = getCloseRenderBtn(self));
        }
        btn.appendTo(self.get('el'), undefined);
      } else {
        if (btn) {
          btn.remove();
        }
      }
    }
  };
  /**
   * @class BUI.Component.UIBase.Close
   * Close extension class.
   * Represent a close button.
   */
  function Close() {}
  var HIDE = 'hide';
  Close.ATTRS = {
    /**
     * 关闭按钮的默认模版
     * <pre><code>
     *   var overlay = new Overlay({
     *     closeTpl : '<a href="#" title="close">x</a>',
     *     closeable : true,
     *     trigger : '#t1'
     *   });
     *   overlay.render();
     * </code></pre>
     * @cfg {String} closeTpl
     */
    /**
     * 关闭按钮的默认模版
     * @type {String}
     * @protected
     */
    closeTpl: {
      view: true
    },
    /**
     * 是否出现关闭按钮
     * @cfg {Boolean} [closeable = false]
     */
    /**
     * 是否出现关闭按钮
     * @type {Boolean}
     */
    closeable: {
      view: 1
    },
    /**
     * 关闭按钮.
     * @protected
     * @type {jQuery}
     */
    closeBtn: {
      view: 1
    },
    /**
     * 关闭时隐藏还是移除DOM结构<br/>
     *
     *  - "hide" : default 隐藏.
     *  - "destroy"：当点击关闭按钮时移除（destroy)控件
     *  - 'remove' : 当存在父控件时使用remove，同时从父元素中删除
     * @cfg {String} [closeAction = 'hide']
     */
    /**
     * 关闭时隐藏还是移除DOM结构
     * default "hide".可以设置 "destroy" ，当点击关闭按钮时移除（destroy)控件
     * @type {String}
     * @protected
     */
    closeAction: {
      value: HIDE
    }
    /**
     * @event closing
     * 正在关闭，可以通过return false 阻止关闭事件
     * @param {Object} e 关闭事件
     * @param {String} e.action 关闭执行的行为，hide,destroy,remove
     */
    /**
     * @event beforeclosed
     * 关闭前，发生在closing后，closed前，用于处理关闭前的一些工作
     * @param {Object} e 关闭事件
     * @param {String} e.action 关闭执行的行为，hide,destroy,remove
     */
    /**
     * @event closed
     * 已经关闭
     * @param {Object} e 关闭事件
     * @param {String} e.action 关闭执行的行为，hide,destroy,remove
     */
    /**
     * @event closeclick
     * 触发点击关闭按钮的事件,return false 阻止关闭
     * @param {Object} e 关闭事件
     * @param {String} e.domTarget 点击的关闭按钮节点
     */
  };
  var actions = {
    hide: HIDE,
    destroy: 'destroy',
    remove: 'remove'
  };
  Close.prototype = {
    _uiSetCloseable: function(v) {
      var self = this;
      if (v && !self.__bindCloseEvent) {
        self.__bindCloseEvent = 1;
        self.get('closeBtn').on('click', function(ev) {
          if (self.fire('closeclick', {
              domTarget: ev.target
            }) !== false) {
            self.close();
          }
          ev.preventDefault();
        });
      }
    },
    __destructor: function() {
      var btn = this.get('closeBtn');
      btn && btn.detach();
    },
    /**
     * 关闭弹出框，如果closeAction = 'hide'那么就是隐藏，如果 closeAction = 'destroy'那么就是释放,'remove'从父控件中删除，并释放
     */
    close: function() {
      var self = this,
        action = actions[self.get('closeAction') || HIDE];
      if (self.fire('closing', {
          action: action
        }) !== false) {
        self.fire('beforeclosed', {
          action: action
        });
        if (action == 'remove') { //移除时同时destroy
          self[action](true);
        } else {
          self[action]();
        }
        self.fire('closed', {
          action: action
        });
      }
    }
  };
  Close.View = CloseView;
  module.exports = Close;
});
define("bui/common/component/uibase/collapsable", [], function(require, exports, module) {
  /**
   * @fileOverview 可以展开折叠的控件
   * @ignore
   */
  /**
   * 控件展开折叠的视图类
   * @class BUI.Component.UIBase.CollapsableView
   * @private
   */
  var collapsableView = function() {};
  collapsableView.ATTRS = {
    collapsed: {}
  }
  collapsableView.prototype = {
      //设置收缩样式
      _uiSetCollapsed: function(v) {
        var _self = this,
          cls = _self.getStatusCls('collapsed'),
          el = _self.get('el');
        if (v) {
          el.addClass(cls);
        } else {
          el.removeClass(cls);
        }
      }
    }
    /**
     * 控件展开折叠的扩展
     * @class BUI.Component.UIBase.Collapsable
     */
  var collapsable = function() {};
  collapsable.ATTRS = {
    /**
     * 是否可折叠
     * @type {Boolean}
     */
    collapsable: {
      value: false
    },
    /**
     * 是否已经折叠 collapsed
     * @cfg {Boolean} collapsed
     */
    /**
     * 是否已经折叠
     * @type {Boolean}
     */
    collapsed: {
      view: true,
      value: false
    },
    events: {
      value: {
        /**
         * 控件展开
         * @event
         * @param {Object} e 事件对象
         * @param {BUI.Component.Controller} target 控件
         */
        'expanded': true,
        /**
         * 控件折叠
         * @event
         * @param {Object} e 事件对象
         * @param {BUI.Component.Controller} target 控件
         */
        'collapsed': true
      }
    }
  };
  collapsable.prototype = {
    _uiSetCollapsed: function(v) {
      var _self = this;
      if (v) {
        _self.fire('collapsed');
      } else {
        _self.fire('expanded');
      }
    }
  };
  collapsable.View = collapsableView;
  module.exports = collapsable;
});
define("bui/common/component/uibase/drag", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 拖拽
   * @author by dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    dragBackId = BUI.guid('drag');
  /**
   * 拖拽控件的扩展
   * <pre><code>
   *  var Control = Overlay.extend([UIBase.Drag],{
   *
   *  });
   *
   *  var c = new Contol({ //拖动控件时，在#t2内
   *      content : '<div id="header"></div><div></div>',
   *      dragNode : '#header',
   *      constraint : '#t2'
   *  });
   * </code></pre>
   * @class BUI.Component.UIBase.Drag
   */
  var drag = function() {};
  drag.ATTRS = {
    /**
     * 点击拖动的节点
     * <pre><code>
     *  var Control = Overlay.extend([UIBase.Drag],{
     *
     *  });
     *
     *  var c = new Contol({ //拖动控件时，在#t2内
     *      content : '<div id="header"></div><div></div>',
     *      dragNode : '#header',
     *      constraint : '#t2'
     *  });
     * </code></pre>
     * @cfg {jQuery} dragNode
     */
    /**
     * 点击拖动的节点
     * @type {jQuery}
     * @ignore
     */
    dragNode: {},
    /**
     * 是否正在拖动
     * @type {Boolean}
     * @protected
     */
    draging: {
      setter: function(v) {
        if (v === true) {
          return {};
        }
      },
      value: null
    },
    /**
     * 拖动的限制范围
     * <pre><code>
     *  var Control = Overlay.extend([UIBase.Drag],{
     *
     *  });
     *
     *  var c = new Contol({ //拖动控件时，在#t2内
     *      content : '<div id="header"></div><div></div>',
     *      dragNode : '#header',
     *      constraint : '#t2'
     *  });
     * </code></pre>
     * @cfg {jQuery} constraint
     */
    /**
     * 拖动的限制范围
     * @type {jQuery}
     * @ignore
     */
    constraint: {},
    /**
     * @private
     * @type {jQuery}
     */
    dragBackEl: {
      /** @private **/
      getter: function() {
        return $('#' + dragBackId);
      }
    }
  };
  var dragTpl = '<div id="' + dragBackId + '" style="background-color: red; position: fixed; left: 0px; width: 100%; height: 100%; top: 0px; cursor: move; z-index: 999999; display: none; "></div>';

  function initBack() {
    var el = $(dragTpl).css('opacity', 0).prependTo('body');
    return el;
  }
  drag.prototype = {
    __bindUI: function() {
      var _self = this,
        constraint = _self.get('constraint'),
        dragNode = _self.get('dragNode');
      if (!dragNode) {
        return;
      }
      dragNode.on('mousedown', function(e) {
        if (e.which == 1) {
          e.preventDefault();
          _self.set('draging', {
            elX: _self.get('x'),
            elY: _self.get('y'),
            startX: e.pageX,
            startY: e.pageY
          });
          registEvent();
        }
      });
      /**
       * @private
       */
      function mouseMove(e) {
          var draging = _self.get('draging');
          if (draging) {
            e.preventDefault();
            _self._dragMoveTo(e.pageX, e.pageY, draging, constraint);
          }
        }
        /**
         * @private
         */
      function mouseUp(e) {
          if (e.which == 1) {
            _self.set('draging', false);
            var dragBackEl = _self.get('dragBackEl');
            if (dragBackEl) {
              dragBackEl.hide();
            }
            unregistEvent();
          }
        }
        /**
         * @private
         */
      function registEvent() {
          $(document).on('mousemove', mouseMove);
          $(document).on('mouseup', mouseUp);
        }
        /**
         * @private
         */
      function unregistEvent() {
        $(document).off('mousemove', mouseMove);
        $(document).off('mouseup', mouseUp);
      }
    },
    _dragMoveTo: function(x, y, draging, constraint) {
      var _self = this,
        dragBackEl = _self.get('dragBackEl'),
        draging = draging || _self.get('draging'),
        offsetX = draging.startX - x,
        offsetY = draging.startY - y;
      if (!dragBackEl.length) {
        dragBackEl = initBack();
      }
      dragBackEl.css({
        cursor: 'move',
        display: 'block'
      });
      _self.set('xy', [_self._getConstrainX(draging.elX - offsetX, constraint),
        _self._getConstrainY(draging.elY - offsetY, constraint)
      ]);
    },
    _getConstrainX: function(x, constraint) {
      var _self = this,
        width = _self.get('el').outerWidth(),
        endX = x + width,
        curX = _self.get('x');
      //如果存在约束
      if (constraint) {
        var constraintOffset = constraint.offset();
        if (constraintOffset.left >= x) {
          return constraintOffset.left;
        }
        if (constraintOffset.left + constraint.width() < endX) {
          return constraintOffset.left + constraint.width() - width;
        }
        return x;
      }
      //当左右顶点都在视图内，移动到此点
      if (BUI.isInHorizontalView(x) && BUI.isInHorizontalView(endX)) {
        return x;
      }
      return curX;
    },
    _getConstrainY: function(y, constraint) {
      var _self = this,
        height = _self.get('el').outerHeight(),
        endY = y + height,
        curY = _self.get('y');
      //如果存在约束
      if (constraint) {
        var constraintOffset = constraint.offset();
        if (constraintOffset.top > y) {
          return constraintOffset.top;
        }
        if (constraintOffset.top + constraint.height() < endY) {
          return constraintOffset.top + constraint.height() - height;
        }
        return y;
      }
      //当左右顶点都在视图内，移动到此点
      if (BUI.isInVerticalView(y) && BUI.isInVerticalView(endY)) {
        return y;
      }
      return curY;
    }
  };
  module.exports = drag;
});
define("bui/common/component/uibase/keynav", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 使用键盘导航
   * @ignore
   */
  var $ = require('jquery'),
    KeyCode = require("bui/common/keycode"),
    wrapBehavior = BUI.wrapBehavior,
    getWrapBehavior = BUI.getWrapBehavior;
  /**
   * 键盘导航
   * @class BUI.Component.UIBase.KeyNav
   */
  var keyNav = function() {};
  keyNav.ATTRS = {
    /**
     * 是否允许键盘导航
     * @cfg {Boolean} [allowKeyNav = true]
     */
    allowKeyNav: {
      value: true
    },
    /**
     * 导航使用的事件
     * @cfg {String} [navEvent = 'keydown']
     */
    navEvent: {
      value: 'keydown'
    },
    /**
     * 当获取事件的DOM是 input,textarea,select等时，不处理键盘导航
     * @cfg {Object} [ignoreInputFields='true']
     */
    ignoreInputFields: {
      value: true
    }
  };
  keyNav.prototype = {
    __bindUI: function() {},
    _uiSetAllowKeyNav: function(v) {
      var _self = this,
        eventName = _self.get('navEvent'),
        el = _self.get('el');
      if (v) {
        el.on(eventName, wrapBehavior(_self, '_handleKeyDown'));
      } else {
        el.off(eventName, getWrapBehavior(_self, '_handleKeyDown'));
      }
    },
    /**
     * 处理键盘导航
     * @private
     */
    _handleKeyDown: function(ev) {
      var _self = this,
        ignoreInputFields = _self.get('ignoreInputFields'),
        code = ev.which;
      if (ignoreInputFields && $(ev.target).is('input,select,textarea')) {
        return;
      }
      switch (code) {
        case KeyCode.UP:
          //ev.preventDefault();
          _self.handleNavUp(ev);
          break;
        case KeyCode.DOWN:
          //ev.preventDefault();
          _self.handleNavDown(ev);
          break;
        case KeyCode.RIGHT:
          // ev.preventDefault();
          _self.handleNavRight(ev);
          break;
        case KeyCode.LEFT:
          //ev.preventDefault();
          _self.handleNavLeft(ev);
          break;
        case KeyCode.ENTER:
          _self.handleNavEnter(ev);
          break;
        case KeyCode.ESC:
          _self.handleNavEsc(ev);
          break;
        case KeyCode.TAB:
          _self.handleNavTab(ev);
          break;
        default:
          break;
      }
    },
    /**
     * 处理向上导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavUp: function(ev) {
      // body...
    },
    /**
     * 处理向下导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavDown: function(ev) {
      // body...
    },
    /**
     * 处理向左导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavLeft: function(ev) {
      // body...
    },
    /**
     * 处理向右导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavRight: function(ev) {
      // body...
    },
    /**
     * 处理确认键
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavEnter: function(ev) {
      // body...
    },
    /**
     * 处理 esc 键
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavEsc: function(ev) {
      // body...
    },
    /**
     * 处理Tab键
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavTab: function(ev) {}
  };
  module.exports = keyNav;
});
define("bui/common/component/uibase/list", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 所有子元素都是同一类的集合
   * @ignore
   */
  var $ = require('jquery'),
    Selection = require("bui/common/component/uibase/selection");
  /**
   * 列表一类的控件的扩展，list,menu,grid都是可以从此类扩展
   * @class BUI.Component.UIBase.List
   */
  var list = function() {};
  list.ATTRS = {
    /**
     * 选择的数据集合
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
     *   idField : 'value',
     *   render : '#t1',
     *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
     * });
     * list.render();
     * </code></pre>
     * @cfg {Array} items
     */
    /**
     * 选择的数据集合
     * <pre><code>
     *  list.set('items',items); //列表会直接替换内容
     *  //等同于
     *  list.clearItems();
     *  list.addItems(items);
     * </code></pre>
     * @type {Array}
     */
    items: {
      shared: false,
      view: true
    },
    /**
     * 选项的默认key值
     * @cfg {String} [idField = 'id']
     */
    idField: {
      value: 'id'
    },
    /**
     * 列表项的默认模板,仅在初始化时传入。
     * @type {String}
     * @ignore
     */
    itemTpl: {
      view: true
    },
    /**
     * 列表项的渲染函数，应对列表项之间有很多差异时
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTplRender : function(item){
     *     if(item.type == '1'){
     *       return '&lt;li&gt;&lt;img src="xxx.jpg"/&gt;'+item.text+'&lt;/li&gt;'
     *     }else{
     *       return '&lt;li&gt;item.text&lt;/li&gt;'
     *     }
     *   },
     *   idField : 'value',
     *   render : '#t1',
     *   items : [{value : '1',text : '1',type : '0'},{value : '2',text : '2',type : '1'}]
     * });
     * list.render();
     * </code></pre>
     * @type {Function}
     */
    itemTplRender: {
      view: true
    },
    /**
     * 子控件各个状态默认采用的样式
     * <pre><code>
     * var list = new List.SimpleList({
     *   render : '#t1',
     *   itemStatusCls : {
     *     selected : 'active', //默认样式为list-item-selected,现在变成'active'
     *     hover : 'hover' //默认样式为list-item-hover,现在变成'hover'
     *   },
     *   items : [{id : '1',text : '1',type : '0'},{id : '2',text : '2',type : '1'}]
     * });
     * list.render();
     * </code></pre>
     * see {@link BUI.Component.Controller#property-statusCls}
     * @type {Object}
     */
    itemStatusCls: {
      view: true,
      value: {}
    },
    events: {
      value: {
        /**
         * 选项点击事件
         * @event
         * @param {Object} e 事件对象
         * @param {BUI.Component.UIBase.ListItem} e.item 点击的选项
         * @param {HTMLElement} e.element 选项代表的DOM对象
         * @param {HTMLElement} e.domTarget 点击的DOM对象
         * @param {HTMLElement} e.domEvent 点击的原生事件对象
         */
        'itemclick': true
      }
    }
  };
  list.prototype = {
    /**
     * 获取选项的数量
     * <pre><code>
     *   var count = list.getItemCount();
     * </code></pre>
     * @return {Number} 选项数量
     */
    getItemCount: function() {
      return this.getItems().length;
    },
    /**
     * 获取字段的值
     * @param {*} item 字段名
     * @param {String} field 字段名
     * @return {*} 字段的值
     * @protected
     */
    getValueByField: function(item, field) {},
    /**
     * 获取所有选项值，如果选项是子控件，则是所有子控件
     * <pre><code>
     *   var items = list.getItems();
     *   //等同
     *   list.get(items);
     * </code></pre>
     * @return {Array} 选项值集合
     */
    getItems: function() {},
    /**
     * 获取第一项
     * <pre><code>
     *   var item = list.getFirstItem();
     *   //等同
     *   list.getItemAt(0);
     * </code></pre>
     * @return {Object|BUI.Component.Controller} 选项值（子控件）
     */
    getFirstItem: function() {
      return this.getItemAt(0);
    },
    /**
     * 获取最后一项
     * <pre><code>
     *   var item = list.getLastItem();
     *   //等同
     *   list.getItemAt(list.getItemCount()-1);
     * </code></pre>
     * @return {Object|BUI.Component.Controller} 选项值（子控件）
     */
    getLastItem: function() {
      return this.getItemAt(this.getItemCount() - 1);
    },
    /**
     * 通过索引获取选项值（子控件）
     * <pre><code>
     *   var item = list.getItemAt(0); //获取第1个
     *   var item = list.getItemAt(2); //获取第3个
     * </code></pre>
     * @param  {Number} index 索引值
     * @return {Object|BUI.Component.Controller}  选项（子控件）
     */
    getItemAt: function(index) {
      return this.getItems()[index] || null;
    },
    /**
     * 通过Id获取选项，如果是改变了idField则通过改变的idField来查找选项
     * <pre><code>
     *   //如果idField = 'id'
     *   var item = list.getItem('2');
     *   //等同于
     *   list.findItemByField('id','2');
     *
     *   //如果idField = 'value'
     *   var item = list.getItem('2');
     *   //等同于
     *   list.findItemByField('value','2');
     * </code></pre>
     * @param {String} id 编号
     * @return {Object|BUI.Component.Controller} 选项（子控件）
     */
    getItem: function(id) {
      var field = this.get('idField');
      return this.findItemByField(field, id);
    },
    /**
     * 返回指定项的索引
     * <pre><code>
     * var index = list.indexOf(item); //返回索引，不存在则返回-1
     * </code></pre>
     * @param  {Object|BUI.Component.Controller} item 选项
     * @return {Number}   项的索引值
     */
    indexOfItem: function(item) {
      return BUI.Array.indexOf(item, this.getItems());
    },
    /**
     * 添加多条选项
     * <pre><code>
     * var items = [{id : '1',text : '1'},{id : '2',text : '2'}];
     * list.addItems(items);
     * </code></pre>
     * @param {Array} items 记录集合（子控件配置项）
     */
    addItems: function(items) {
      var _self = this;
      BUI.each(items, function(item) {
        _self.addItem(item);
      });
    },
    /**
     * 插入多条记录
     * <pre><code>
     * var items = [{id : '1',text : '1'},{id : '2',text : '2'}];
     * list.addItemsAt(items,0); // 在最前面插入
     * list.addItemsAt(items,2); //第三个位置插入
     * </code></pre>
     * @param  {Array} items 多条记录
     * @param  {Number} start 起始位置
     */
    addItemsAt: function(items, start) {
      var _self = this;
      BUI.each(items, function(item, index) {
        _self.addItemAt(item, start + index);
      });
    },
    /**
     * 更新列表项，修改选项值后，DOM跟随变化
     * <pre><code>
     *   var item = list.getItem('2');
     *   list.text = '新内容'; //此时对应的DOM不会变化
     *   list.updateItem(item); //DOM进行相应的变化
     * </code></pre>
     * @param  {Object} item 选项值
     */
    updateItem: function(item) {},
    /**
     * 添加选项,添加在控件最后
     *
     * <pre><code>
     * list.addItem({id : '3',text : '3',type : '0'});
     * </code></pre>
     *
     * @param {Object|BUI.Component.Controller} item 选项，子控件配置项、子控件
     * @return {Object|BUI.Component.Controller} 子控件或者选项记录
     */
    addItem: function(item) {
      return this.addItemAt(item, this.getItemCount());
    },
    /**
     * 在指定位置添加选项
     * <pre><code>
     * list.addItemAt({id : '3',text : '3',type : '0'},0); //第一个位置
     * </code></pre>
     * @param {Object|BUI.Component.Controller} item 选项，子控件配置项、子控件
     * @param {Number} index 索引
     * @return {Object|BUI.Component.Controller} 子控件或者选项记录
     */
    addItemAt: function(item, index) {},
    /**
     * 根据字段查找指定的项
     * @param {String} field 字段名
     * @param {Object} value 字段值
     * @return {Object} 查询出来的项（传入的记录或者子控件）
     * @protected
     */
    findItemByField: function(field, value) {},
    /**
     *
     * 获取此项显示的文本
     * @param {Object} item 获取记录显示的文本
     * @protected
     */
    getItemText: function(item) {},
    /**
     * 清除所有选项,不等同于删除全部，此时不会触发删除事件
     * <pre><code>
     * list.clearItems();
     * //等同于
     * list.set('items',items);
     * </code></pre>
     */
    clearItems: function() {
      var _self = this,
        items = _self.getItems();
      items.splice(0);
      _self.clearControl();
    },
    /**
     * 删除选项
     * <pre><code>
     * var item = list.getItem('1');
     * list.removeItem(item);
     * </code></pre>
     * @param {Object|BUI.Component.Controller} item 选项（子控件）
     */
    removeItem: function(item) {},
    /**
     * 移除选项集合
     * <pre><code>
     * var items = list.getSelection();
     * list.removeItems(items);
     * </code></pre>
     * @param  {Array} items 选项集合
     */
    removeItems: function(items) {
      var _self = this;
      BUI.each(items, function(item) {
        _self.removeItem(item);
      });
    },
    /**
     * 通过索引删除选项
     * <pre><code>
     * list.removeItemAt(0); //删除第一个
     * </code></pre>
     * @param  {Number} index 索引
     */
    removeItemAt: function(index) {
      this.removeItem(this.getItemAt(index));
    },
    /**
     * @protected
     * @template
     * 清除所有的子控件或者列表项的DOM
     */
    clearControl: function() {}
  }

  function clearSelected(item) {
    if (item.selected) {
      item.selected = false;
    }
    if (item.set) {
      item.set('selected', false);
    }
  }

  function beforeAddItem(self, item) {
    var c = item.isController ? item.getAttrVals() : item,
      defaultTpl = self.get('itemTpl'),
      defaultStatusCls = self.get('itemStatusCls'),
      defaultTplRender = self.get('itemTplRender');
    //配置默认模板
    if (defaultTpl && !c.tpl) {
      setItemAttr(item, 'tpl', defaultTpl);
      //  c.tpl = defaultTpl;
    }
    //配置默认渲染函数
    if (defaultTplRender && !c.tplRender) {
      setItemAttr(item, 'tplRender', defaultTplRender);
      //c.tplRender = defaultTplRender;
    }
    //配置默认状态样式
    if (defaultStatusCls) {
      var statusCls = c.statusCls || item.isController ? item.get('statusCls') : {};
      BUI.each(defaultStatusCls, function(v, k) {
        if (v && !statusCls[k]) {
          statusCls[k] = v;
        }
      });
      setItemAttr(item, 'statusCls', statusCls)
        //item.statusCls = statusCls;
    }
    // clearSelected(item);
  }

  function setItemAttr(item, name, val) {
      if (item.isController) {
        item.set(name, val);
      } else {
        item[name] = val;
      }
    }
    /**
     * @class BUI.Component.UIBase.ChildList
     * 选中其中的DOM结构
     * @extends BUI.Component.UIBase.List
     * @mixins BUI.Component.UIBase.Selection
     */
  var childList = function() {
    this.__init();
  };
  childList.ATTRS = BUI.merge(true, list.ATTRS, Selection.ATTRS, {
    items: {
      sync: false
    },
    /**
     * 配置的items 项是在初始化时作为children
     * @protected
     * @type {Boolean}
     */
    autoInitItems: {
      value: true
    },
    /**
     * 使用srcNode时，是否将内部的DOM转换成子控件
     * @type {Boolean}
     */
    isDecorateChild: {
      value: true
    },
    /**
     * 默认的加载控件内容的配置,默认值：
     * <pre>
     *  {
     *   property : 'children',
     *   dataType : 'json'
     * }
     * </pre>
     * @type {Object}
     */
    defaultLoaderCfg: {
      value: {
        property: 'children',
        dataType: 'json'
      }
    }
  });
  BUI.augment(childList, list, Selection, {
    //初始化，将items转换成children
    __init: function() {
      var _self = this,
        items = _self.get('items');
      if (items && _self.get('autoInitItems')) {
        _self.addItems(items);
      }
      _self.on('beforeRenderUI', function() {
        _self._beforeRenderUI();
      });
    },
    _uiSetItems: function(items) {
      var _self = this;
      //清理子控件
      _self.clearControl();
      _self.addItems(items);
    },
    //渲染子控件
    _beforeRenderUI: function() {
      var _self = this,
        children = _self.get('children'),
        items = _self.get('items');
      BUI.each(children, function(item) {
        beforeAddItem(_self, item);
      });
    },
    //绑定事件
    __bindUI: function() {
      var _self = this,
        selectedEvent = _self.get('selectedEvent');
      _self.on(selectedEvent, function(e) {
        var item = e.target;
        if (item.get('selectable')) {
          if (!item.get('selected')) {
            _self.setSelected(item);
          } else if (_self.get('multipleSelect')) {
            _self.clearSelected(item);
          }
        }
      });
      _self.on('click', function(e) {
        if (e.target !== _self) {
          _self.fire('itemclick', {
            item: e.target,
            domTarget: e.domTarget,
            domEvent: e
          });
        }
      });
      _self.on('beforeAddChild', function(ev) {
        beforeAddItem(_self, ev.child);
      });
      _self.on('beforeRemoveChild', function(ev) {
        var item = ev.child,
          selected = item.get('selected');
        //清理选中状态
        if (selected) {
          if (_self.get('multipleSelect')) {
            _self.clearSelected(item);
          } else {
            _self.setSelected(null);
          }
        }
        item.set('selected', false);
      });
    },
    /**
     * @protected
     * @override
     * 清除者列表项的DOM
     */
    clearControl: function() {
      this.removeChildren(true);
    },
    /**
     * 获取所有子控件
     * @return {Array} 子控件集合
     * @override
     */
    getItems: function() {
      return this.get('children');
    },
    /**
     * 更新列表项
     * @param  {Object} item 选项值
     */
    updateItem: function(item) {
      var _self = this,
        idField = _self.get('idField'),
        element = _self.findItemByField(idField, item[idField]);
      if (element) {
        element.setTplContent();
      }
      return element;
    },
    /**
     * 删除项,子控件作为选项
     * @param  {Object} element 子控件
     */
    removeItem: function(item) {
      var _self = this,
        idField = _self.get('idField');
      if (!(item instanceof BUI.Component.Controller)) {
        item = _self.findItemByField(idField, item[idField]);
      }
      this.removeChild(item, true);
    },
    /**
     * 在指定位置添加选项,此处选项指子控件
     * @param {Object|BUI.Component.Controller} item 子控件配置项、子控件
     * @param {Number} index 索引
     * @return {Object|BUI.Component.Controller} 子控件
     */
    addItemAt: function(item, index) {
      return this.addChild(item, index);
    },
    findItemByField: function(field, value, root) {
      root = root || this;
      var _self = this,
        children = root.get('children'),
        result = null;
      $(children).each(function(index, item) {
        if (item.get(field) == value) {
          result = item;
        } else if (item.get('children').length) {
          result = _self.findItemByField(field, value, item);
        }
        if (result) {
          return false;
        }
      });
      return result;
    },
    getItemText: function(item) {
      return item.get('el').text();
    },
    getValueByField: function(item, field) {
      return item && item.get(field);
    },
    /**
     * @protected
     * @ignore
     */
    setItemSelectedStatus: function(item, selected) {
      var _self = this,
        method = selected ? 'addClass' : 'removeClass',
        element = null;
      if (item) {
        item.set('selected', selected);
        element = item.get('el');
      }
      _self.afterSelected(item, selected, element);
    },
    /**
     * 选项是否被选中
     * @override
     * @param  {*}  item 选项
     * @return {Boolean}  是否选中
     */
    isItemSelected: function(item) {
      return item ? item.get('selected') : false;
    },
    /**
     * 设置所有选项选中
     * @override
     */
    setAllSelection: function() {
      var _self = this,
        items = _self.getItems();
      _self.setSelection(items);
    },
    /**
     * 获取选中的项的值
     * @return {Array}
     * @override
     * @ignore
     */
    getSelection: function() {
      var _self = this,
        items = _self.getItems(),
        rst = [];
      BUI.each(items, function(item) {
        if (_self.isItemSelected(item)) {
          rst.push(item);
        }
      });
      return rst;
    }
  });
  list.ChildList = childList;
  module.exports = list;
  /**
   * @ignore
   * 2013-1-22
   *   更改显示数据的方式，使用 _uiSetItems
   */
});
define("bui/common/component/uibase/selection", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 单选或者多选
   * @author  dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery');
  var SINGLE_SELECTED = 'single';
  /**
   * @class BUI.Component.UIBase.Selection
   * 选中控件中的项（子元素或者DOM），此类选择的内容有2种
   * <ol>
   *     <li>子控件</li>
   *     <li>DOM元素</li>
   * </ol>
   * ** 当选择是子控件时，element 和 item 都是指 子控件；**
   * ** 当选择的是DOM元素时，element 指DOM元素，item 指DOM元素对应的记录 **
   * @abstract
   */
  var selection = function() {};
  selection.ATTRS = {
    /**
     * 选中的事件
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
     *   idField : 'value',
     *   selectedEvent : 'mouseenter',
     *   render : '#t1',
     *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
     * });
     * </code></pre>
     * @cfg {String} [selectedEvent = 'click']
     */
    selectedEvent: {
      value: 'click'
    },
    events: {
      value: {
        /**
         * 选中的菜单改变时发生，
         * 多选时，选中，取消选中都触发此事件，单选时，只有选中时触发此事件
         * @name  BUI.Component.UIBase.Selection#selectedchange
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.item 当前选中的项
         * @param {HTMLElement} e.domTarget 当前选中的项的DOM结构
         * @param {Boolean} e.selected 是否选中
         */
        'selectedchange': false,
        /**
         * 选择改变前触发，可以通过return false，阻止selectedchange事件
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.item 当前选中的项
         * @param {Boolean} e.selected 是否选中
         */
        'beforeselectedchange': false,
        /**
         * 菜单选中
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.item 当前选中的项
         * @param {HTMLElement} e.domTarget 当前选中的项的DOM结构
         */
        'itemselected': false,
        /**
         * 菜单取消选中
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.item 当前选中的项
         * @param {HTMLElement} e.domTarget 当前选中的项的DOM结构
         */
        'itemunselected': false
      }
    },
    /**
     * 数据的id字段名称，通过此字段查找对应的数据
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
     *   idField : 'value',
     *   render : '#t1',
     *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
     * });
     * </code></pre>
     * @cfg {String} [idField = 'id']
     */
    /**
     * 数据的id字段名称，通过此字段查找对应的数据
     * @type {String}
     * @ignore
     */
    idField: {
      value: 'id'
    },
    /**
     * 是否多选
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
     *   idField : 'value',
     *   render : '#t1',
     *   multipleSelect : true,
     *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
     * });
     * </code></pre>
     * @cfg {Boolean} [multipleSelect=false]
     */
    /**
     * 是否多选
     * @type {Boolean}
     * @default false
     */
    multipleSelect: {
      value: false
    }
  };
  selection.prototype = {
    /**
     * 清理选中的项
     * <pre><code>
     *  list.clearSelection();
     * </code></pre>
     *
     */
    clearSelection: function() {
      var _self = this,
        selection = _self.getSelection();
      BUI.each(selection, function(item) {
        _self.clearSelected(item);
      });
    },
    /**
     * 获取选中的项的值
     * @template
     * @return {Array}
     */
    getSelection: function() {},
    /**
     * 获取选中的第一项
     * <pre><code>
     * var item = list.getSelected(); //多选模式下第一条
     * </code></pre>
     * @return {Object} 选中的第一项或者为undefined
     */
    getSelected: function() {
      return this.getSelection()[0];
    },
    /**
     * 根据 idField 获取到的值
     * @protected
     * @return {Object} 选中的值
     */
    getSelectedValue: function() {
      var _self = this,
        field = _self.get('idField'),
        item = _self.getSelected();
      return _self.getValueByField(item, field);
    },
    /**
     * 获取选中的值集合
     * @protected
     * @return {Array} 选中值得集合
     */
    getSelectionValues: function() {
      var _self = this,
        field = _self.get('idField'),
        items = _self.getSelection();
      return $.map(items, function(item) {
        return _self.getValueByField(item, field);
      });
    },
    /**
     * 获取选中的文本
     * @protected
     * @return {Array} 选中的文本集合
     */
    getSelectionText: function() {
      var _self = this,
        items = _self.getSelection();
      return $.map(items, function(item) {
        return _self.getItemText(item);
      });
    },
    /**
     * 移除选中
     * <pre><code>
     *    var item = list.getItem('id'); //通过id 获取选项
     *    list.setSelected(item); //选中
     *
     *    list.clearSelected();//单选模式下清除所选，多选模式下清除选中的第一项
     *    list.clearSelected(item); //清除选项的选中状态
     * </code></pre>
     * @param {Object} [item] 清除选项的选中状态，如果未指定则清除选中的第一个选项的选中状态
     */
    clearSelected: function(item) {
      var _self = this;
      item = item || _self.getSelected();
      if (item) {
        _self.setItemSelected(item, false);
      }
    },
    /**
     * 获取选项显示的文本
     * @protected
     */
    getSelectedText: function() {
      var _self = this,
        item = _self.getSelected();
      return _self.getItemText(item);
    },
    /**
     * 设置选中的项
     * <pre><code>
     *  var items = list.getItemsByStatus('active'); //获取某种状态的选项
     *  list.setSelection(items);
     * </code></pre>
     * @param {Array} items 项的集合
     */
    setSelection: function(items) {
      var _self = this;
      items = BUI.isArray(items) ? items : [items];
      BUI.each(items, function(item) {
        _self.setSelected(item);
      });
    },
    /**
     * 设置选中的项
     * <pre><code>
     *   var item = list.getItem('id');
     *   list.setSelected(item);
     * </code></pre>
     * @param {Object} item 记录或者子控件
     */
    setSelected: function(item) {
      var _self = this,
        multipleSelect = _self.get('multipleSelect');
      if (!_self.isItemSelectable(item)) {
        return;
      }
      if (!multipleSelect) {
        var selectedItem = _self.getSelected();
        if (item != selectedItem) {
          //如果是单选，清除已经选中的项
          _self.clearSelected(selectedItem);
        }
      }
      _self.setItemSelected(item, true);
    },
    /**
     * 选项是否被选中
     * @template
     * @param  {*}  item 选项
     * @return {Boolean}  是否选中
     */
    isItemSelected: function(item) {},
    /**
     * 选项是否可以选中
     * @protected
     * @param {*} item 选项
     * @return {Boolean} 选项是否可以选中
     */
    isItemSelectable: function(item) {
      return true;
    },
    /**
     * 设置选项的选中状态
     * @param {*} item 选项
     * @param {Boolean} selected 选中或者取消选中
     * @protected
     */
    setItemSelected: function(item, selected) {
      var _self = this,
        isSelected;
      //当前状态等于要设置的状态时，不触发改变事件
      if (item) {
        isSelected = _self.isItemSelected(item);
        if (isSelected == selected) {
          return;
        }
      }
      if (_self.fire('beforeselectedchange', {
          item: item,
          selected: selected
        }) !== false) {
        _self.setItemSelectedStatus(item, selected);
      }
    },
    /**
     * 设置选项的选中状态
     * @template
     * @param {*} item 选项
     * @param {Boolean} selected 选中或者取消选中
     * @protected
     */
    setItemSelectedStatus: function(item, selected) {},
    /**
     * 设置所有选项选中
     * <pre><code>
     *  list.setAllSelection(); //选中全部，多选状态下有效
     * </code></pre>
     * @template
     */
    setAllSelection: function() {},
    /**
     * 设置项选中，通过字段和值
     * @param {String} field 字段名,默认为配置项'idField',所以此字段可以不填写，仅填写值
     * @param {Object} value 值
     * @example
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTpl : '&lt;li id="{id}"&gt;{text}&lt;/li&gt;',
     *   idField : 'id', //id 字段作为key
     *   render : '#t1',
     *   items : [{id : '1',text : '1'},{id : '2',text : '2'}]
     * });
     *
     *   list.setSelectedByField('123'); //默认按照id字段查找
     *   //或者
     *   list.setSelectedByField('id','123');
     *
     *   list.setSelectedByField('value','123');
     * </code></pre>
     */
    setSelectedByField: function(field, value) {
      if (!value) {
        value = field;
        field = this.get('idField');
      }
      var _self = this,
        item = _self.findItemByField(field, value);
      _self.setSelected(item);
    },
    /**
     * 设置多个选中，根据字段和值
     * <pre><code>
     * var list = new List.SimpleList({
     *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;',
     *   idField : 'value', //value 字段作为key
     *   render : '#t1',
     *   multipleSelect : true,
     *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
     * });
     *   var values = ['1','2','3'];
     *   list.setSelectionByField(values);//
     *
     *   //等于
     *   list.setSelectionByField('value',values);
     * </code></pre>
     * @param {String} field 默认为idField
     * @param {Array} values 值得集合
     */
    setSelectionByField: function(field, values) {
      if (!values) {
        values = field;
        field = this.get('idField');
      }
      var _self = this;
      BUI.each(values, function(value) {
        _self.setSelectedByField(field, value);
      });
    },
    /**
     * 选中完成后，触发事件
     * @protected
     * @param  {*} item 选项
     * @param  {Boolean} selected 是否选中
     * @param  {jQuery} element
     */
    afterSelected: function(item, selected, element) {
      var _self = this;
      if (selected) {
        _self.fire('itemselected', {
          item: item,
          domTarget: element
        });
        _self.fire('selectedchange', {
          item: item,
          domTarget: element,
          selected: selected
        });
      } else {
        _self.fire('itemunselected', {
          item: item,
          domTarget: element
        });
        if (_self.get('multipleSelect')) { //只有当多选时，取消选中才触发selectedchange
          _self.fire('selectedchange', {
            item: item,
            domTarget: element,
            selected: selected
          });
        }
      }
    }
  }
  module.exports = selection;
});
define("bui/common/component/uibase/listitem", [], function(require, exports, module) {
  /**
   * @fileOverview 可选中的控件,父控件支持selection扩展
   * @ignore
   */
  /**
   * 列表项控件的视图层
   * @class BUI.Component.UIBase.ListItemView
   * @private
   */
  function listItemView() {
    // body...
  }
  listItemView.ATTRS = {
    /**
     * 是否选中
     * @type {Boolean}
     */
    selected: {}
  };
  listItemView.prototype = {
    _uiSetSelected: function(v) {
      var _self = this,
        cls = _self.getStatusCls('selected'),
        el = _self.get('el');
      if (v) {
        el.addClass(cls);
      } else {
        el.removeClass(cls);
      }
    }
  };
  /**
   * 列表项的扩展
   * @class BUI.Component.UIBase.ListItem
   */
  function listItem() {}
  listItem.ATTRS = {
    /**
     * 是否可以被选中
     * @cfg {Boolean} [selectable=true]
     */
    /**
     * 是否可以被选中
     * @type {Boolean}
     */
    selectable: {
      value: true
    },
    /**
     * 是否选中,只能通过设置父类的选中方法来实现选中
     * @type {Boolean}
     * @readOnly
     */
    selected: {
      view: true,
      sync: false,
      value: false
    }
  };
  listItem.prototype = {};
  listItem.View = listItemView;
  module.exports = listItem;
});
define("bui/common/component/uibase/mask", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview mask 遮罩层
   * @author yiminghe@gmail.com
   * copied and modified by dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    UA = require("bui/common/ua"),
    /**
     * 每组相同 prefixCls 的 position 共享一个遮罩
     * @ignore
     */
    maskMap = {
      /**
       * @ignore
       * {
       *  node:
       *  num:
       * }
       */
    },
    ie6 = UA.ie == 6;

  function getMaskCls(self) {
    return self.get('prefixCls') + 'ext-mask';
  }

  function docWidth() {
    return ie6 ? BUI.docWidth() + 'px' : '100%';
  }

  function docHeight() {
    return ie6 ? BUI.docHeight() + 'px' : '100%';
  }

  function initMask(maskCls) {
      var mask = $('<div ' + ' style="width:' + docWidth() + ';' + 'left:0;' + 'top:0;' + 'height:' + docHeight() + ';' + 'position:' + (ie6 ? 'absolute' : 'fixed') + ';"' + ' class="' + maskCls + '">' + (ie6 ? '<' + 'iframe ' + 'style="position:absolute;' + 'left:' + '0' + ';' + 'top:' + '0' + ';' + 'background:white;' + 'width: expression(this.parentNode.offsetWidth);' + 'height: expression(this.parentNode.offsetHeight);' + 'filter:alpha(opacity=0);' + 'z-index:-1;"></iframe>' : '') + '</div>').prependTo('body');
      /**
       * 点 mask 焦点不转移
       * @ignore
       */
      // mask.unselectable();
      mask.on('mousedown', function(e) {
        e.preventDefault();
      });
      return mask;
    }
    /**
     * 遮罩层的视图类
     * @class BUI.Component.UIBase.MaskView
     * @private
     */
  function MaskView() {}
  MaskView.ATTRS = {
    maskShared: {
      value: true
    }
  };
  MaskView.prototype = {
    _maskExtShow: function() {
      var self = this,
        zIndex,
        maskCls = getMaskCls(self),
        maskDesc = maskMap[maskCls],
        maskShared = self.get('maskShared'),
        mask = self.get('maskNode');
      if (!mask) {
        if (maskShared) {
          if (maskDesc) {
            mask = maskDesc.node;
          } else {
            mask = initMask(maskCls);
            maskDesc = maskMap[maskCls] = {
              num: 0,
              node: mask
            };
          }
        } else {
          mask = initMask(maskCls);
        }
        self.setInternal('maskNode', mask);
      }
      if (zIndex = self.get('zIndex')) {
        mask.css('z-index', zIndex - 1);
      }
      if (maskShared) {
        maskDesc.num++;
      }
      if (!maskShared || maskDesc.num == 1) {
        mask.show();
      }
      $('body').addClass('x-masked-relative');
    },
    _maskExtHide: function() {
      var self = this,
        maskCls = getMaskCls(self),
        maskDesc = maskMap[maskCls],
        maskShared = self.get('maskShared'),
        mask = self.get('maskNode');
      if (maskShared && maskDesc) {
        maskDesc.num = Math.max(maskDesc.num - 1, 0);
        if (maskDesc.num == 0) {
          mask.hide();
        }
      } else if (mask) {
        mask.hide();
      }
      $('body').removeClass('x-masked-relative');
    },
    __destructor: function() {
      var self = this,
        maskShared = self.get('maskShared'),
        mask = self.get('maskNode');
      if (self.get('maskNode')) {
        if (maskShared) {
          if (self.get('visible')) {
            self._maskExtHide();
          }
        } else {
          mask.remove();
        }
      }
    }
  };
  /**
   * @class BUI.Component.UIBase.Mask
   * Mask extension class.
   * Make component to be able to show with mask.
   */
  function Mask() {}
  Mask.ATTRS = {
    /**
     * 控件显示时，是否显示屏蔽层
     * <pre><code>
     *   var overlay = new Overlay({ //显示overlay时，屏蔽body
     *     mask : true,
     *     maskNode : 'body',
     *     trigger : '#t1'
     *   });
     *   overlay.render();
     * </code></pre>
     * @cfg {Boolean} [mask = false]
     */
    /**
     * 控件显示时，是否显示屏蔽层
     * @type {Boolean}
     * @protected
     */
    mask: {
      value: false
    },
    /**
     * 屏蔽的内容
     * <pre><code>
     *   var overlay = new Overlay({ //显示overlay时，屏蔽body
     *     mask : true,
     *     maskNode : 'body',
     *     trigger : '#t1'
     *   });
     *   overlay.render();
     * </code></pre>
     * @cfg {jQuery} maskNode
     */
    /**
     * 屏蔽的内容
     * @type {jQuery}
     * @protected
     */
    maskNode: {
      view: 1
    },
    /**
     * Whether to share mask with other overlays.
     * @default true.
     * @type {Boolean}
     * @protected
     */
    maskShared: {
      view: 1
    }
  };
  Mask.prototype = {
    __bindUI: function() {
      var self = this,
        view = self.get('view'),
        _maskExtShow = view._maskExtShow,
        _maskExtHide = view._maskExtHide;
      if (self.get('mask')) {
        self.on('show', function() {
          view._maskExtShow();
        });
        self.on('hide', function() {
          view._maskExtHide();
        });
      }
    }
  };
  Mask = Mask;
  Mask.View = MaskView;
  module.exports = Mask;
});
define("bui/common/component/uibase/position", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 位置，控件绝对定位
   * @author yiminghe@gmail.com
   * copied by dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery');
  /**
   * 对齐的视图类
   * @class BUI.Component.UIBase.PositionView
   * @private
   */
  function PositionView() {}
  PositionView.ATTRS = {
    x: {
      /**
       * 水平方向绝对位置
       * @private
       * @ignore
       */
      valueFn: function() {
        var self = this;
        // 读到这里时，el 一定是已经加到 dom 树中了，否则报未知错误
        // el 不在 dom 树中 offset 报错的
        // 最早读就是在 syncUI 中，一点重复设置(读取自身 X 再调用 _uiSetX)无所谓了
        return self.get('el') && self.get('el').offset().left;
      }
    },
    y: {
      /**
       * 垂直方向绝对位置
       * @private
       * @ignore
       */
      valueFn: function() {
        var self = this;
        return self.get('el') && self.get('el').offset().top;
      }
    },
    zIndex: {},
    /**
     * @private
     * see {@link BUI.Component.UIBase.Box#visibleMode}.
     * @default "visibility"
     * @ignore
     */
    visibleMode: {
      value: 'visibility'
    }
  };
  PositionView.prototype = {
    __createDom: function() {
      this.get('el').addClass(BUI.prefix + 'ext-position');
    },
    _uiSetZIndex: function(x) {
      this.get('el').css('z-index', x);
    },
    _uiSetX: function(x) {
      if (x != null) {
        this.get('el').offset({
          left: x
        });
      }
    },
    _uiSetY: function(y) {
      if (y != null) {
        this.get('el').offset({
          top: y
        });
      }
    },
    _uiSetLeft: function(left) {
      if (left != null) {
        this.get('el').css({
          left: left
        });
      }
    },
    _uiSetTop: function(top) {
      if (top != null) {
        this.get('el').css({
          top: top
        });
      }
    }
  };
  /**
   * @class BUI.Component.UIBase.Position
   * Position extension class.
   * Make component positionable
   */
  function Position() {}
  Position.ATTRS = {
    /**
     * 水平坐标
     * @cfg {Number} x
     */
    /**
     * 水平坐标
     * <pre><code>
     *     overlay.set('x',100);
     * </code></pre>
     * @type {Number}
     */
    x: {
      view: 1
    },
    /**
     * 垂直坐标
     * @cfg {Number} y
     */
    /**
     * 垂直坐标
     * <pre><code>
     *     overlay.set('y',100);
     * </code></pre>
     * @type {Number}
     */
    y: {
      view: 1
    },
    /**
     * 相对于父元素的水平位置
     * @type {Number}
     * @protected
     */
    left: {
      view: 1
    },
    /**
     * 相对于父元素的垂直位置
     * @type {Number}
     * @protected
     */
    top: {
      view: 1
    },
    /**
     * 水平和垂直坐标
     * <pre><code>
     * var overlay = new Overlay({
     *   xy : [100,100],
     *   trigger : '#t1',
     *   srcNode : '#c1'
     * });
     * </code></pre>
     * @cfg {Number[]} xy
     */
    /**
     * 水平和垂直坐标
     * <pre><code>
     *     overlay.set('xy',[100,100]);
     * </code></pre>
     * @type {Number[]}
     */
    xy: {
      // 相对 page 定位, 有效值为 [n, m], 为 null 时, 选 align 设置
      setter: function(v) {
        var self = this,
          xy = $.makeArray(v);
        /*
                 属性内分发特别注意：
                 xy -> x,y
                 */
        if (xy.length) {
          xy[0] && self.set('x', xy[0]);
          xy[1] && self.set('y', xy[1]);
        }
        return v;
      },
      /**
       * xy 纯中转作用
       * @ignore
       */
      getter: function() {
        return [this.get('x'), this.get('y')];
      }
    },
    /**
     * z-index value.
     * <pre><code>
     *   var overlay = new Overlay({
     *       zIndex : '1000'
     *   });
     * </code></pre>
     * @cfg {Number} zIndex
     */
    /**
     * z-index value.
     * <pre><code>
     *   overlay.set('zIndex','1200');
     * </code></pre>
     * @type {Number}
     */
    zIndex: {
      view: 1
    },
    /**
     * Positionable element is by default visible false.
     * For compatibility in overlay and PopupMenu.
     * @default false
     * @ignore
     */
    visible: {
      view: true,
      value: true
    }
  };
  Position.prototype = {
    /**
     * Move to absolute position.
     * @param {Number|Number[]} x
     * @param {Number} [y]
     * @example
     * <pre><code>
     * move(x, y);
     * move(x);
     * move([x,y])
     * </code></pre>
     */
    move: function(x, y) {
      var self = this;
      if (BUI.isArray(x)) {
        y = x[1];
        x = x[0];
      }
      self.set('xy', [x, y]);
      return self;
    },
    //设置 x 坐标时，重置 left
    _uiSetX: function(v) {
      if (v != null) {
        var _self = this,
          el = _self.get('el');
        _self.setInternal('left', el.position().left);
        if (v != -999) {
          this.set('cachePosition', null);
        }
      }
    },
    //设置 y 坐标时，重置 top
    _uiSetY: function(v) {
      if (v != null) {
        var _self = this,
          el = _self.get('el');
        _self.setInternal('top', el.position().top);
        if (v != -999) {
          this.set('cachePosition', null);
        }
      }
    },
    //设置 left时，重置 x
    _uiSetLeft: function(v) {
      var _self = this,
        el = _self.get('el');
      if (v != null) {
        _self.setInternal('x', el.offset().left);
      }
      /*else{ //如果lef 为null,同时设置过left和top，那么取对应的值
                _self.setInternal('left',el.position().left);
            }*/
    },
    //设置top 时，重置y
    _uiSetTop: function(v) {
      var _self = this,
        el = _self.get('el');
      if (v != null) {
        _self.setInternal('y', el.offset().top);
      }
      /*else{ //如果lef 为null,同时设置过left和top，那么取对应的值
                _self.setInternal('top',el.position().top);
            }*/
    }
  };
  Position.View = PositionView;
  module.exports = Position;
});
define("bui/common/component/uibase/stdmod", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview
   * 控件包含头部（head)、内容(content)和尾部（foot)
   * @ignore
   */
  var $ = require('jquery'),
    CLS_PREFIX = BUI.prefix + 'stdmod-';
  /**
   * 标准模块组织的视图类
   * @class BUI.Component.UIBase.StdModView
   * @private
   */
  function StdModView() {}
  StdModView.ATTRS = {
    header: {},
    body: {},
    footer: {},
    bodyStyle: {},
    footerStyle: {},
    headerStyle: {},
    headerContent: {},
    bodyContent: {},
    footerContent: {}
  };
  StdModView.PARSER = {
    header: function(el) {
      return el.one("." + CLS_PREFIX + "header");
    },
    body: function(el) {
      return el.one("." + CLS_PREFIX + "body");
    },
    footer: function(el) {
      return el.one("." + CLS_PREFIX + "footer");
    }
  }; /**/
  function createUI(self, part) {
    var el = self.get('contentEl'),
      partEl = self.get(part);
    if (!partEl) {
      partEl = $('<div class="' + CLS_PREFIX + part + '"' + ' ' + ' >' + '</div>');
      partEl.appendTo(el);
      self.setInternal(part, partEl);
    }
  }

  function _setStdModRenderContent(self, part, v) {
    part = self.get(part);
    if (BUI.isString(v)) {
      part.html(v);
    } else {
      part.html('').append(v);
    }
  }
  StdModView.prototype = {
    __renderUI: function() { //createDom
      createUI(this, 'header');
      createUI(this, 'body');
      createUI(this, 'footer');
    },
    _uiSetBodyStyle: function(v) {
      this.get('body').css(v);
    },
    _uiSetHeaderStyle: function(v) {
      this.get('header').css(v);
    },
    _uiSetFooterStyle: function(v) {
      this.get('footer').css(v);
    },
    _uiSetBodyContent: function(v) {
      _setStdModRenderContent(this, 'body', v);
    },
    _uiSetHeaderContent: function(v) {
      _setStdModRenderContent(this, 'header', v);
    },
    _uiSetFooterContent: function(v) {
      _setStdModRenderContent(this, 'footer', v);
    }
  };
  /**
   * @class BUI.Component.UIBase.StdMod
   * StdMod extension class.
   * Generate head, body, foot for component.
   */
  function StdMod() {}
  StdMod.ATTRS = {
    /**
     * 控件的头部DOM. Readonly
     * @readOnly
     * @type {jQuery}
     */
    header: {
      view: 1
    },
    /**
     * 控件的内容DOM. Readonly
     * @readOnly
     * @type {jQuery}
     */
    body: {
      view: 1
    },
    /**
     * 控件的底部DOM. Readonly
     * @readOnly
     * @type {jQuery}
     */
    footer: {
      view: 1
    },
    /**
     * 应用到控件内容的css属性，键值对形式
     * @cfg {Object} bodyStyle
     */
    /**
     * 应用到控件内容的css属性，键值对形式
     * @type {Object}
     * @protected
     */
    bodyStyle: {
      view: 1
    },
    /**
     * 应用到控件底部的css属性，键值对形式
     * @cfg {Object} footerStyle
     */
    /**
     * 应用到控件底部的css属性，键值对形式
     * @type {Object}
     * @protected
     */
    footerStyle: {
      view: 1
    },
    /**
     * 应用到控件头部的css属性，键值对形式
     * @cfg {Object} headerStyle
     */
    /**
     * 应用到控件头部的css属性，键值对形式
     * @type {Object}
     * @protected
     */
    headerStyle: {
      view: 1
    },
    /**
     * 控件头部的html
     * <pre><code>
     * var dialog = new Dialog({
     *     headerContent: '&lt;div class="header"&gt;&lt;/div&gt;',
     *     bodyContent : '#c1',
     *     footerContent : '&lt;div class="footer"&gt;&lt;/div&gt;'
     * });
     * dialog.show();
     * </code></pre>
     * @cfg {jQuery|String} headerContent
     */
    /**
     * 控件头部的html
     * @type {jQuery|String}
     */
    headerContent: {
      view: 1
    },
    /**
     * 控件内容的html
     * <pre><code>
     * var dialog = new Dialog({
     *     headerContent: '&lt;div class="header"&gt;&lt;/div&gt;',
     *     bodyContent : '#c1',
     *     footerContent : '&lt;div class="footer"&gt;&lt;/div&gt;'
     * });
     * dialog.show();
     * </code></pre>
     * @cfg {jQuery|String} bodyContent
     */
    /**
     * 控件内容的html
     * @type {jQuery|String}
     */
    bodyContent: {
      view: 1
    },
    /**
     * 控件底部的html
     * <pre><code>
     * var dialog = new Dialog({
     *     headerContent: '&lt;div class="header"&gt;&lt;/div&gt;',
     *     bodyContent : '#c1',
     *     footerContent : '&lt;div class="footer"&gt;&lt;/div&gt;'
     * });
     * dialog.show();
     * </code></pre>
     * @cfg {jQuery|String} footerContent
     */
    /**
     * 控件底部的html
     * @type {jQuery|String}
     */
    footerContent: {
      view: 1
    }
  };
  StdMod.View = StdModView;
  module.exports = StdMod;
});
define("bui/common/component/uibase/decorate", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 使用wrapper
   * @ignore
   */
  var $ = require('jquery'),
    ArrayUtil = require("bui/common/array"),
    JSON = require("bui/common/json"),
    prefixCls = BUI.prefix,
    FIELD_PREFIX = 'data-',
    FIELD_CFG = FIELD_PREFIX + 'cfg',
    PARSER = 'PARSER',
    Manager = require("bui/common/component/manage"),
    RE_DASH_WORD = /-([a-z])/g,
    regx = /^[\{\[]/;

  function isConfigField(name, cfgFields) {
      if (cfgFields[name]) {
        return true;
      }
      var reg = new RegExp("^" + FIELD_PREFIX);
      if (name !== FIELD_CFG && reg.test(name)) {
        return true;
      }
      return false;
    }
    // 收集单继承链，子类在前，父类在后
  function collectConstructorChains(self) {
    var constructorChains = [],
      c = self.constructor;
    while (c) {
      constructorChains.push(c);
      c = c.superclass && c.superclass.constructor;
    }
    return constructorChains;
  }

  function camelCase(str) {
      return str.toLowerCase().replace(RE_DASH_WORD, function(all, letter) {
        return (letter + '').toUpperCase()
      })
    }
    //如果属性为对象或者数组，则进行转换
  function parseFieldValue(value) {
    value = $.trim(value);
    if (value.toLowerCase() === 'false') {
      value = false
    } else if (value.toLowerCase() === 'true') {
      value = true
    } else if (regx.test(value)) {
      value = JSON.looseParse(value);
    } else if (/\d/.test(value) && /[^a-z]/i.test(value)) {
      var number = parseFloat(value)
      if (number + '' === value) {
        value = number
      }
    }
    return value;
  }

  function setConfigFields(self, cfg) {
    var userConfig = self.userConfig || {};
    for (var p in cfg) {
      // 用户设置过那么这里不从 dom 节点取
      // 用户设置 > html parser > default value
      if (!(p in userConfig)) {
        self.setInternal(p, cfg[p]);
      }
    }
  }

  function applyParser(srcNode, parser) {
    var self = this,
      p, v,
      userConfig = self.userConfig || {};
    // 从 parser 中，默默设置属性，不触发事件
    for (p in parser) {
      // 用户设置过那么这里不从 dom 节点取
      // 用户设置 > html parser > default value
      if (!(p in userConfig)) {
        v = parser[p];
        // 函数
        if (BUI.isFunction(v)) {
          self.setInternal(p, v.call(self, srcNode));
        }
        // 单选选择器
        else if (typeof v == 'string') {
          self.setInternal(p, srcNode.find(v));
        }
        // 多选选择器
        else if (BUI.isArray(v) && v[0]) {
          self.setInternal(p, srcNode.find(v[0]))
        }
      }
    }
  }

  function initParser(self, srcNode) {
    var c = self.constructor,
      len,
      p,
      constructorChains;
    constructorChains = collectConstructorChains(self);
    // 从父类到子类开始从 html 读取属性
    for (len = constructorChains.length - 1; len >= 0; len--) {
      c = constructorChains[len];
      if (p = c[PARSER]) {
        applyParser.call(self, srcNode, p);
      }
    }
  }

  function initDecorate(self) {
      var _self = self,
        srcNode = _self.get('srcNode'),
        userConfig,
        decorateCfg;
      if (srcNode) {
        srcNode = $(srcNode);
        _self.setInternal('el', srcNode);
        _self.setInternal('srcNode', srcNode);
        userConfig = _self.get('userConfig');
        decorateCfg = _self.getDecorateConfig(srcNode);
        setConfigFields(self, decorateCfg);
        //如果从DOM中读取子控件
        if (_self.get('isDecorateChild') && _self.decorateInternal) {
          _self.decorateInternal(srcNode);
        }
        initParser(self, srcNode);
      }
    }
    /**
     * @class BUI.Component.UIBase.Decorate
     * 将DOM对象封装成控件
     */
  function decorate() {
    initDecorate(this);
  }
  decorate.ATTRS = {
    /**
     * 配置控件的根节点的DOM
     * <pre><code>
     * new Form.Form({
     *   srcNode : '#J_Form'
     * }).render();
     * </code></pre>
     * @cfg {jQuery} srcNode
     */
    /**
     * 配置控件的根节点的DOM
     * @type {jQuery}
     */
    srcNode: {
      view: true
    },
    /**
     * 是否根据DOM生成子控件
     * @type {Boolean}
     * @protected
     */
    isDecorateChild: {
      value: false
    },
    /**
     * 此配置项配置使用那些srcNode上的节点作为配置项
     *  - 当时用 decorate 时，取 srcNode上的节点的属性作为控件的配置信息
     *  - 默认id,name,value,title 都会作为属性传入
     *  - 使用 'data-cfg' 作为整体的配置属性
     *  <pre><code>
     *     <input id="c1" type="text" name="txtName" id="id",data-cfg="{allowBlank:false}" />
     *     //会生成以下配置项：
     *     {
     *         name : 'txtName',
     *         id : 'id',
     *         allowBlank:false
     *     }
     *     new Form.Field({
     *        src:'#c1'
     *     }).render();
     *  </code></pre>
     * @type {Object}
     * @protected
     */
    decorateCfgFields: {
      value: {
        'id': true,
        'name': true,
        'value': true,
        'title': true
      }
    }
  };
  decorate.prototype = {
    /**
     * 获取控件的配置信息
     * @protected
     */
    getDecorateConfig: function(el) {
      if (!el.length) {
        return null;
      }
      var _self = this,
        dom = el[0],
        attributes = dom.attributes,
        decorateCfgFields = _self.get('decorateCfgFields'),
        config = {},
        statusCfg = _self._getStautsCfg(el);
      BUI.each(attributes, function(attr) {
        var name = attr.nodeName;
        try {
          if (name === FIELD_CFG) {
            var cfg = parseFieldValue(attr.nodeValue);
            BUI.mix(config, cfg);
          } else if (isConfigField(name, decorateCfgFields)) {
            var value = attr.nodeValue;
            if (name.indexOf(FIELD_PREFIX) !== -1) {
              name = name.replace(FIELD_PREFIX, '');
              name = camelCase(name);
              value = parseFieldValue(value);
            }
            if (config[name] && BUI.isObject(value)) {
              BUI.mix(config[name], value);
            } else {
              config[name] = value;
            }
          }
        } catch (e) {
          BUI.log('parse field error,the attribute is:' + name);
        }
      });
      return BUI.mix(config, statusCfg);
    },
    //根据css class获取状态属性
    //如： selected,disabled等属性
    _getStautsCfg: function(el) {
      var _self = this,
        rst = {},
        statusCls = _self.get('statusCls');
      BUI.each(statusCls, function(v, k) {
        if (el.hasClass(v)) {
          rst[k] = true;
        }
      });
      return rst;
    },
    /**
     * 获取封装成子控件的节点集合
     * @protected
     * @return {Array} 节点集合
     */
    getDecorateElments: function() {
      var _self = this,
        el = _self.get('el'),
        contentContainer = _self.get('childContainer');
      if (contentContainer) {
        return el.find(contentContainer).children();
      } else {
        return el.children();
      }
    },
    /**
     * 封装所有的子控件
     * @protected
     * @param {jQuery} el Root element of current component.
     */
    decorateInternal: function(el) {
      var self = this;
      self.decorateChildren(el);
    },
    /**
     * 获取子控件的xclass类型
     * @protected
     * @param {jQuery} childNode 子控件的根节点
     */
    findXClassByNode: function(childNode, ignoreError) {
      var _self = this,
        cls = childNode.attr("class") || '',
        childClass = _self.get('defaultChildClass'); //如果没有样式或者查找不到对应的类，使用默认的子控件类型
      // 过滤掉特定前缀
      cls = cls.replace(new RegExp("\\b" + prefixCls, "ig"), "");
      var UI = Manager.getConstructorByXClass(cls) || Manager.getConstructorByXClass(childClass);
      if (!UI && !ignoreError) {
        BUI.log(childNode);
        BUI.error("can not find ui " + cls + " from this markup");
      }
      return Manager.getXClassByConstructor(UI);
    },
    // 生成一个组件
    decorateChildrenInternal: function(xclass, c) {
      var _self = this,
        children = _self.get('children');
      children.push({
        xclass: xclass,
        srcNode: c
      });
    },
    /**
     * 封装子控件
     * @private
     * @param {jQuery} el component's root element.
     */
    decorateChildren: function(el) {
      var _self = this,
        children = _self.getDecorateElments();
      BUI.each(children, function(c) {
        var xclass = _self.findXClassByNode($(c));
        _self.decorateChildrenInternal(xclass, $(c));
      });
    }
  };
  module.exports = decorate;
});
define("bui/common/component/uibase/tpl", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 控件模板
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery');
  /**
   * @private
   * 控件模板扩展类的渲染类(view)
   * @class BUI.Component.UIBase.TplView
   */
  function tplView() {}
  tplView.ATTRS = {
    /**
     * 模板
     * @protected
     * @type {String}
     */
    tpl: {},
    tplEl: {}
  };
  tplView.prototype = {
      __renderUI: function() {
        var _self = this,
          contentContainer = _self.get('childContainer'),
          contentEl;
        if (contentContainer) {
          contentEl = _self.get('el').find(contentContainer);
          if (contentEl.length) {
            _self.set('contentEl', contentEl);
          }
        }
      },
      /**
       * 获取生成控件的模板
       * @protected
       * @param  {Object} attrs 属性值
       * @return {String} 模板
       */
      getTpl: function(attrs) {
        var _self = this,
          tpl = _self.get('tpl'),
          tplRender = _self.get('tplRender');
        attrs = attrs || _self.getAttrVals();
        if (tplRender) {
          return tplRender(attrs);
        }
        if (tpl) {
          return BUI.substitute(tpl, attrs);
        }
        return '';
      },
      /**
       * 如果控件设置了模板，则根据模板和属性值生成DOM
       * 如果设置了content属性，此模板不应用
       * @protected
       * @param  {Object} attrs 属性值，默认为初始化时传入的值
       */
      setTplContent: function(attrs) {
        var _self = this,
          el = _self.get('el'),
          content = _self.get('content'),
          tplEl = _self.get('tplEl'),
          tpl = _self.getTpl(attrs);
        //tplEl.remove();
        if (!content && tpl) { //替换掉原先的内容
          el.empty();
          el.html(tpl);
          /*if(tplEl){
              var node = $(tpl).insertBefore(tplEl);
              tplEl.remove();
              tplEl = node;
            }else{
              tplEl = $(tpl).appendTo(el);
            }
            _self.set('tplEl',tplEl)
            */
        }
      }
    }
    /**
     * 控件的模板扩展
     * @class BUI.Component.UIBase.Tpl
     */
  function tpl() {}
  tpl.ATTRS = {
    /**
     * 控件的模版，用于初始化
     * <pre><code>
     * var list = new List.List({
     *   tpl : '&lt;div class="toolbar"&gt;&lt;/div&gt;&lt;ul&gt;&lt;/ul&gt;',
     *   childContainer : 'ul'
     * });
     * //用于统一子控件模板
     * var list = new List.List({
     *   defaultChildCfg : {
     *     tpl : '&lt;span&gt;{text}&lt;/span&gt;'
     *   }
     * });
     * list.render();
     * </code></pre>
     * @cfg {String} tpl
     */
    /**
     * 控件的模板
     * <pre><code>
     *   list.set('tpl','&lt;div class="toolbar"&gt;&lt;/div&gt;&lt;ul&gt;&lt;/ul&gt;&lt;div class="bottom"&gt;&lt;/div&gt;')
     * </code></pre>
     * @type {String}
     */
    tpl: {
      view: true,
      sync: false
    },
    /**
     * <p>控件的渲染函数，应对一些简单模板解决不了的问题，例如有if,else逻辑，有循环逻辑,
     * 函数原型是function(data){},其中data是控件的属性值</p>
     * <p>控件模板的加强模式，此属性会覆盖@see {BUI.Component.UIBase.Tpl#property-tpl}属性</p>
     * //用于统一子控件模板
     * var list = new List.List({
     *   defaultChildCfg : {
     *     tplRender : funciton(item){
     *       if(item.type == '1'){
     *         return 'type1 html';
     *       }else{
     *         return 'type2 html';
     *       }
     *     }
     *   }
     * });
     * list.render();
     * @cfg {Function} tplRender
     */
    tplRender: {
      view: true,
      value: null
    },
    /**
     * 这是一个选择器，使用了模板后，子控件可能会添加到模板对应的位置,
     *  - 默认为null,此时子控件会将控件最外层 el 作为容器
     * <pre><code>
     * var list = new List.List({
     *   tpl : '&lt;div class="toolbar"&gt;&lt;/div&gt;&lt;ul&gt;&lt;/ul&gt;',
     *   childContainer : 'ul'
     * });
     * </code></pre>
     * @cfg {String} childContainer
     */
    childContainer: {
      view: true
    }
  };
  tpl.prototype = {
    __renderUI: function() {
      //使用srcNode时，不使用模板
      if (!this.get('srcNode')) {
        this.setTplContent();
      }
    },
    /**
     * 控件信息发生改变时，控件内容跟模板相关时需要调用这个函数，
     * 重新通过模板和控件信息构造内容
     */
    updateContent: function() {
      this.setTplContent();
    },
    /**
     * 根据控件的属性和模板生成控件内容
     * @protected
     */
    setTplContent: function() {
      var _self = this,
        attrs = _self.getAttrVals();
      _self.get('view').setTplContent(attrs);
    },
    //模板发生改变
    _uiSetTpl: function() {
      this.setTplContent();
    }
  };
  tpl.View = tplView;
  module.exports = tpl;
});
define("bui/common/component/uibase/childcfg", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 子控件的默认配置项
   * @ignore
   */
  var $ = require('jquery');
  /**
   * @class BUI.Component.UIBase.ChildCfg
   * 子控件默认配置项的扩展类
   */
  var childCfg = function(config) {
    this._init();
  };
  childCfg.ATTRS = {
    /**
     * 默认的子控件配置项,在初始化控件时配置
     *
     *  - 如果控件已经渲染过，此配置项无效，
     *  - 控件生成后，修改此配置项无效。
     * <pre><code>
     *   var control = new Control({
     *     defaultChildCfg : {
     *       tpl : '&lt;li&gt;{text}&lt;/li&gt;',
     *       xclass : 'a-b'
     *     }
     *   });
     * </code></pre>
     * @cfg {Object} defaultChildCfg
     */
    /**
     * @ignore
     */
    defaultChildCfg: {}
  };
  childCfg.prototype = {
    _init: function() {
      var _self = this,
        defaultChildCfg = _self.get('defaultChildCfg');
      if (defaultChildCfg) {
        _self.on('beforeAddChild', function(ev) {
          var child = ev.child;
          if ($.isPlainObject(child)) {
            BUI.each(defaultChildCfg, function(v, k) {
              if (child[k] == null) { //如果未在配置项中设置，则使用默认值
                child[k] = v;
              }
            });
          }
        });
      }
    }
  };
  module.exports = childCfg;
});
define("bui/common/component/uibase/bindable", [], function(require, exports, module) {
  /**
   * @fileOverview bindable extension class.
   * @author dxq613@gmail.com
   * @ignore
   */
  /**
   * bindable extension class.
   * <pre><code>
   *   BUI.use(['bui/list','bui/data','bui/mask'],function(List,Data,Mask){
   *     var store = new Data.Store({
   *       url : 'data/xx.json'
   *     });
   *   	var list = new List.SimpleList({
   *  	    render : '#l1',
   *  	    store : store,
   *  	    loadMask : new Mask.LoadMask({el : '#t1'})
   *     });
   *
   *     list.render();
   *     store.load();
   *   });
   * </code></pre>
   * 使控件绑定store，处理store的事件 {@link BUI.Data.Store}
   * @class BUI.Component.UIBase.Bindable
   */
  function bindable() {}
  bindable.ATTRS = {
    /**
     * 绑定 {@link BUI.Data.Store}的事件
     * <pre><code>
     *  var store = new Data.Store({
     *   url : 'data/xx.json',
     *   autoLoad : true
     *  });
     *
     *  var list = new List.SimpleList({
     *  	 render : '#l1',
     *  	 store : store
     *  });
     *
     *  list.render();
     * </code></pre>
     * @cfg {BUI.Data.Store} store
     */
    /**
     * 绑定 {@link BUI.Data.Store}的事件
     * <pre><code>
     *  var store = list.get('store');
     * </code></pre>
     * @type {BUI.Data.Store}
     */
    store: {},
    /**
     * 加载数据时，是否显示等待加载的屏蔽层
     * <pre><code>
     *   BUI.use(['bui/list','bui/data','bui/mask'],function(List,Data,Mask){
     *     var store = new Data.Store({
     *       url : 'data/xx.json'
     *     });
     *   	var list = new List.SimpleList({
     *  	    render : '#l1',
     *  	    store : store,
     *  	    loadMask : new Mask.LoadMask({el : '#t1'})
     *     });
     *
     *     list.render();
     *     store.load();
     *   });
     * </code></pre>
     * @cfg {Boolean|Object} loadMask
     */
    /**
     * 加载数据时，是否显示等待加载的屏蔽层
     * @type {Boolean|Object}
     * @ignore
     */
    loadMask: {
      value: false
    }
  };
  BUI.augment(bindable, {
    __bindUI: function() {
      var _self = this,
        store = _self.get('store'),
        loadMask = _self.get('loadMask');
      if (!store) {
        return;
      }
      store.on('beforeload', function(e) {
        _self.onBeforeLoad(e);
        if (loadMask && loadMask.show) {
          loadMask.show();
        }
      });
      store.on('load', function(e) {
        _self.onLoad(e);
        if (loadMask && loadMask.hide) {
          loadMask.hide();
        }
      });
      store.on('exception', function(e) {
        _self.onException(e);
        if (loadMask && loadMask.hide) {
          loadMask.hide();
        }
      });
      store.on('add', function(e) {
        _self.onAdd(e);
      });
      store.on('remove', function(e) {
        _self.onRemove(e);
      });
      store.on('update', function(e) {
        _self.onUpdate(e);
      });
      store.on('localsort', function(e) {
        _self.onLocalSort(e);
      });
      store.on('filtered', function(e) {
        _self.onFiltered(e);
      });
    },
    __syncUI: function() {
      var _self = this,
        store = _self.get('store');
      if (!store) {
        return;
      }
      if (store.hasData()) {
        _self.onLoad();
      }
    },
    /**
     * @protected
     * @template
     * before store load data
     * @param {Object} e The event object
     * @see {@link BUI.Data.Store#event-beforeload}
     */
    onBeforeLoad: function(e) {},
    /**
     * @protected
     * @template
     * after store load data
     * @param {Object} e The event object
     * @see {@link BUI.Data.Store#event-load}
     */
    onLoad: function(e) {},
    /**
     * @protected
     * @template
     * occurred exception when store is loading data
     * @param {Object} e The event object
     * @see {@link BUI.Data.Store#event-exception}
     */
    onException: function(e) {},
    /**
     * @protected
     * @template
     * after added data to store
     * @param {Object} e The event object
     * @see {@link BUI.Data.Store#event-add}
     */
    onAdd: function(e) {},
    /**
     * @protected
     * @template
     * after remvoed data to store
     * @param {Object} e The event object
     * @see {@link BUI.Data.Store#event-remove}
     */
    onRemove: function(e) {},
    /**
     * @protected
     * @template
     * after updated data to store
     * @param {Object} e The event object
     * @see {@link BUI.Data.Store#event-update}
     */
    onUpdate: function(e) {},
    /**
     * @protected
     * @template
     * after local sorted data to store
     * @param {Object} e The event object
     * @see {@link BUI.Data.Store#event-localsort}
     */
    onLocalSort: function(e) {},
    /**
     * @protected
     * @template
     * after filter data to store
     * @param {Object} e The event object
     * @see {@link BUI.Data.Store#event-filtered}
     */
    onFiltered: function(e) {}
  });
  module.exports = bindable;
});
define("bui/common/component/uibase/depends", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 依赖扩展，用于观察者模式中的观察者
   * @ignore
   */
  var $ = require('jquery'),
    regexp = /^#(.*):(.*)$/,
    Manager = require("bui/common/component/manage");
  //获取依赖信息
  function getDepend(name) {
      var arr = regexp.exec(name),
        id = arr[1],
        eventType = arr[2],
        source = getSource(id);
      return {
        source: source,
        eventType: eventType
      };
    }
    //绑定依赖
  function bindDepend(self, name, action) {
      var depend = getDepend(name),
        source = depend.source,
        eventType = depend.eventType,
        callbak;
      if (source && action && eventType) {
        if (BUI.isFunction(action)) { //如果action是一个函数
          callbak = action;
        } else if (BUI.isArray(action)) { //如果是一个数组，构建一个回调函数
          callbak = function() {
            BUI.each(action, function(methodName) {
              if (self[methodName]) {
                self[methodName]();
              }
            });
          }
        }
      }
      if (callbak) {
        depend.callbak = callbak;
        source.on(eventType, callbak);
        return depend;
      }
      return null;
    }
    //去除依赖
  function offDepend(depend) {
      var source = depend.source,
        eventType = depend.eventType,
        callbak = depend.callbak;
      source.off(eventType, callbak);
    }
    //获取绑定的事件源
  function getSource(id) {
      var control = Manager.getComponent(id);
      if (!control) {
        control = $('#' + id);
        if (!control.length) {
          control = null;
        }
      }
      return control;
    }
    /**
     * @class BUI.Component.UIBase.Depends
     * 依赖事件源的扩展
     * <pre><code>
     *       var control = new Control({
     *         depends : {
     *           '#btn:click':['toggle'],//当点击id为'btn'的按钮时，执行 control 的toggle方法
     *           '#checkbox1:checked':['show'],//当勾选checkbox时，显示控件
     *           '#menu:click',function(){}
     *         }
     *       });
     * </code></pre>
     */
  function Depends() {};
  Depends.ATTRS = {
    /**
     * 控件的依赖事件，是一个数组集合，每一条记录是一个依赖关系<br/>
     * 一个依赖是注册一个事件，所以需要在一个依赖中提供：
     * <ol>
     * <li>绑定源：为了方便配置，我们使用 #id来指定绑定源，可以使控件的ID（只支持继承{BUI.Component.Controller}的控件），也可以是DOM的id</li>
     * <li>事件名：事件名是一个使用":"为前缀的字符串，例如 "#id:change",即监听change事件</li>
     * <li>触发的方法：可以是一个数组，如["disable","clear"],数组里面是控件的方法名，也可以是一个回调函数</li>
     * </ol>
     * <pre><code>
     *       var control = new Control({
     *         depends : {
     *           '#btn:click':['toggle'],//当点击id为'btn'的按钮时，执行 control 的toggle方法
     *           '#checkbox1:checked':['show'],//当勾选checkbox时，显示控件
     *           '#menu:click',function(){}
     *         }
     *       });
     * </code></pre>
     * ** 注意：** 这些依赖项是在控件渲染（render）后进行的。
     * @type {Object}
     */
    depends: {},
    /**
     * @private
     * 依赖的映射集合
     * @type {Object}
     */
    dependencesMap: {
      shared: false,
      value: {}
    }
  };
  Depends.prototype = {
    __syncUI: function() {
      this.initDependences();
    },
    /**
     * 初始化依赖项
     * @protected
     */
    initDependences: function() {
      var _self = this,
        depends = _self.get('depends');
      BUI.each(depends, function(action, name) {
        _self.addDependence(name, action);
      });
    },
    /**
     * 添加依赖，如果已经有同名的事件，则移除，再添加
     * <pre><code>
     *  form.addDependence('#btn:click',['toggle']); //当按钮#btn点击时，表单交替显示隐藏
     *
     *  form.addDependence('#btn:click',function(){//当按钮#btn点击时，表单交替显示隐藏
     *   //TO DO
     *  });
     * </code></pre>
     * @param {String} name 依赖项的名称
     * @param {Array|Function} action 依赖项的事件
     */
    addDependence: function(name, action) {
      var _self = this,
        dependencesMap = _self.get('dependencesMap'),
        depend;
      _self.removeDependence(name);
      depend = bindDepend(_self, name, action)
      if (depend) {
        dependencesMap[name] = depend;
      }
    },
    /**
     * 移除依赖
     * <pre><code>
     *  form.removeDependence('#btn:click'); //当按钮#btn点击时，表单不在监听
     * </code></pre>
     * @param  {String} name 依赖名称
     */
    removeDependence: function(name) {
      var _self = this,
        dependencesMap = _self.get('dependencesMap'),
        depend = dependencesMap[name];
      if (depend) {
        offDepend(depend);
        delete dependencesMap[name];
      }
    },
    /**
     * 清除所有的依赖
     * <pre><code>
     *  form.clearDependences();
     * </code></pre>
     */
    clearDependences: function() {
      var _self = this,
        map = _self.get('dependencesMap');
      BUI.each(map, function(depend, name) {
        offDepend(depend);
      });
      _self.set('dependencesMap', {});
    },
    __destructor: function() {
      this.clearDependences();
    }
  };
  module.exports = Depends;
});
define("bui/common/component/view", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview  控件的视图层
   * @author yiminghe@gmail.com
   * copied by dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    win = window,
    Manager = require("bui/common/component/manage"),
    UIBase = require("bui/common/component/uibase/uibase"), //BUI.Component.UIBase,
    doc = document;
  /**
   * 控件的视图层基类
   * @class BUI.Component.View
   * @protected
   * @extends BUI.Component.UIBase
   * @mixins BUI.Component.UIBase.TplView
   */
  var View = UIBase.extend([UIBase.TplView], {
    /**
     * Get all css class name to be applied to the root element of this component for given state.
     * the css class names are prefixed with component name.
     * @param {String} [state] This component's state info.
     */
    getComponentCssClassWithState: function(state) {
      var self = this,
        componentCls = self.get('ksComponentCss');
      state = state || '';
      return self.getCssClassWithPrefix(componentCls.split(/\s+/).join(state + ' ') + state);
    },
    /**
     * Get full class name (with prefix) for current component
     * @param classes {String} class names without prefixCls. Separated by space.
     * @method
     * @return {String} class name with prefixCls
     * @private
     */
    getCssClassWithPrefix: Manager.getCssClassWithPrefix,
    /**
     * Returns the dom element which is responsible for listening keyboard events.
     * @return {jQuery}
     */
    getKeyEventTarget: function() {
      return this.get('el');
    },
    /**
     * Return the dom element into which child component to be rendered.
     * @return {jQuery}
     */
    getContentElement: function() {
      return this.get('contentEl') || this.get('el');
    },
    /**
     * 获取状态对应的css样式
     * @param  {String} name 状态名称 例如：hover,disabled等等
     * @return {String} 状态样式
     */
    getStatusCls: function(name) {
      var self = this,
        statusCls = self.get('statusCls'),
        cls = statusCls[name];
      if (!cls) {
        cls = self.getComponentCssClassWithState('-' + name);
      }
      return cls;
    },
    /**
     * 渲染控件
     * @protected
     */
    renderUI: function() {
      var self = this;
      // 新建的节点才需要摆放定位,不支持srcNode模式
      if (!self.get('srcNode')) {
        var render = self.get('render'),
          el = self.get('el'),
          renderBefore = self.get('elBefore');
        if (renderBefore) {
          el.insertBefore(renderBefore, undefined);
        } else if (render) {
          el.appendTo(render, undefined);
        } else {
          el.appendTo(doc.body, undefined);
        }
      }
    },
    /**
     * 只负责建立节点，如果是 decorate 过来的，甚至内容会丢失
     * @protected
     * 通过 render 来重建原有的内容
     */
    createDom: function() {
      var self = this,
        contentEl = self.get('contentEl'),
        el = self.get('el');
      if (!self.get('srcNode')) {
        el = $('<' + self.get('elTagName') + '>');
        if (contentEl) {
          el.append(contentEl);
        }
        self.setInternal('el', el);
      }
      el.addClass(self.getComponentCssClassWithState());
      if (!contentEl) {
        // 没取到,这里设下值, uiSet 时可以 set('content')  取到
        self.setInternal('contentEl', el);
      }
    },
    /**
     * 设置高亮显示
     * @protected
     */
    _uiSetHighlighted: function(v) {
      var self = this,
        componentCls = self.getStatusCls('hover'),
        el = self.get('el');
      el[v ? 'addClass' : 'removeClass'](componentCls);
    },
    /**
     * 设置禁用
     * @protected
     */
    _uiSetDisabled: function(v) {
      var self = this,
        componentCls = self.getStatusCls('disabled'),
        el = self.get('el');
      el[v ? 'addClass' : 'removeClass'](componentCls).attr('aria-disabled', v);
      //如果禁用控件时，处于hover状态，则清除
      if (v && self.get('highlighted')) {
        self.set('highlighted', false);
      }
      if (self.get('focusable')) {
        //不能被 tab focus 到
        self.getKeyEventTarget().attr('tabIndex', v ? -1 : 0);
      }
    },
    /**
     * 设置激活状态
     * @protected
     */
    _uiSetActive: function(v) {
      var self = this,
        componentCls = self.getStatusCls('active');
      self.get('el')[v ? 'addClass' : 'removeClass'](componentCls).attr('aria-pressed', !!v);
    },
    /**
     * 设置获得焦点
     * @protected
     */
    _uiSetFocused: function(v) {
      var self = this,
        el = self.get('el'),
        componentCls = self.getStatusCls('focused');
      el[v ? 'addClass' : 'removeClass'](componentCls);
    },
    /**
     * 设置控件最外层DOM的属性
     * @protected
     */
    _uiSetElAttrs: function(attrs) {
      this.get('el').attr(attrs);
    },
    /**
     * 设置应用到控件最外层DOM的css class
     * @protected
     */
    _uiSetElCls: function(cls) {
      this.get('el').addClass(cls);
    },
    /**
     * 设置应用到控件最外层DOM的css style
     * @protected
     */
    _uiSetElStyle: function(style) {
      this.get('el').css(style);
    },
    //设置role
    _uiSetRole: function(role) {
      if (role) {
        this.get('el').attr('role', role);
      }
    },
    /**
     * 设置应用到控件宽度
     * @protected
     */
    _uiSetWidth: function(w) {
      this.get('el').width(w);
    },
    /**
     * 设置应用到控件高度
     * @protected
     */
    _uiSetHeight: function(h) {
      var self = this;
      self.get('el').height(h);
    },
    /**
     * 设置应用到控件的内容
     * @protected
     */
    _uiSetContent: function(c) {
      var self = this,
        el;
      // srcNode 时不重新渲染 content
      // 防止内部有改变，而 content 则是老的 html 内容
      if (self.get('srcNode') && !self.get('rendered')) {} else {
        el = self.get('contentEl');
        if (typeof c == 'string') {
          el.html(c);
        } else if (c) {
          el.empty().append(c);
        }
      }
    },
    /**
     * 设置应用到控件是否可见
     * @protected
     */
    _uiSetVisible: function(isVisible) {
      var self = this,
        el = self.get('el'),
        visibleMode = self.get('visibleMode');
      if (visibleMode === 'visibility') {
        el.css('visibility', isVisible ? 'visible' : 'hidden');
      } else {
        el.css('display', isVisible ? '' : 'none');
      }
    },
    set: function(name, value) {
      var _self = this,
        attr = _self.__attrs[name],
        ev,
        ucName,
        m;
      if (!attr || !_self.get('binded')) { //未初始化view或者没用定义属性
        View.superclass.set.call(this, name, value);
        return _self;
      }
      var prevVal = View.superclass.get.call(this, name);
      //如果未改变值不进行修改
      if (!$.isPlainObject(value) && !BUI.isArray(value) && prevVal === value) {
        return _self;
      }
      View.superclass.set.call(this, name, value);
      value = _self.__attrVals[name];
      ev = {
        attrName: name,
        prevVal: prevVal,
        newVal: value
      };
      ucName = BUI.ucfirst(name);
      m = '_uiSet' + ucName;
      if (_self[m]) {
        _self[m](value, ev);
      }
      return _self;
    },
    /**
     * 析构函数
     * @protected
     */
    destructor: function() {
      var el = this.get('el');
      if (el) {
        el.remove();
      }
    }
  }, {
    xclass: 'view',
    priority: 0
  });
  View.ATTRS = {
    /**
     * 控件根节点
     * @readOnly
     * see {@link BUI.Component.Controller#property-el}
     */
    el: {
      /**
       * @private
       */
      setter: function(v) {
        return $(v);
      }
    },
    /**
     * 控件根节点样式
     * see {@link BUI.Component.Controller#property-elCls}
     */
    elCls: {},
    /**
     * 控件根节点样式属性
     * see {@link BUI.Component.Controller#property-elStyle}
     */
    elStyle: {},
    /**
     * ARIA 标准中的role
     * @type {String}
     */
    role: {},
    /**
     * 控件宽度
     * see {@link BUI.Component.Controller#property-width}
     */
    width: {},
    /**
     * 控件高度
     * see {@link BUI.Component.Controller#property-height}
     */
    height: {},
    /**
     * 状态相关的样式,默认情况下会使用 前缀名 + xclass + '-' + 状态名
     * see {@link BUI.Component.Controller#property-statusCls}
     * @type {Object}
     */
    statusCls: {
      value: {}
    },
    /**
     * 控件根节点使用的标签
     * @type {String}
     */
    elTagName: {
      // 生成标签名字
      value: 'div'
    },
    /**
     * 控件根节点属性
     * see {@link BUI.Component.Controller#property-elAttrs}
     * @ignore
     */
    elAttrs: {},
    /**
     * 控件内容，html,文本等
     * see {@link BUI.Component.Controller#property-content}
     */
    content: {},
    /**
     * 控件插入到指定元素前
     * see {@link BUI.Component.Controller#property-tpl}
     */
    elBefore: {
      // better named to renderBefore, too late !
    },
    /**
     * 控件在指定元素内部渲染
     * see {@link BUI.Component.Controller#property-render}
     * @ignore
     */
    render: {},
    /**
     * 是否可见
     * see {@link BUI.Component.Controller#property-visible}
     */
    visible: {
      value: true
    },
    /**
     * 可视模式
     * see {@link BUI.Component.Controller#property-visibleMode}
     */
    visibleMode: {
      value: 'display'
    },
    /**
     * @private
     * 缓存隐藏时的位置，对应visibleMode = 'visiblity' 的场景
     * @type {Object}
     */
    cachePosition: {},
    /**
     * content 设置的内容节点,默认根节点
     * @type {jQuery}
     * @default  el
     */
    contentEl: {
      valueFn: function() {
        return this.get('el');
      }
    },
    /**
     * 样式前缀
     * see {@link BUI.Component.Controller#property-prefixCls}
     */
    prefixCls: {
      value: BUI.prefix
    },
    /**
     * 可以获取焦点
     * @protected
     * see {@link BUI.Component.Controller#property-focusable}
     */
    focusable: {
      value: true
    },
    /**
     * 获取焦点
     * see {@link BUI.Component.Controller#property-focused}
     */
    focused: {},
    /**
     * 激活
     * see {@link BUI.Component.Controller#property-active}
     */
    active: {},
    /**
     * 禁用
     * see {@link BUI.Component.Controller#property-disabled}
     */
    disabled: {},
    /**
     * 高亮显示
     * see {@link BUI.Component.Controller#property-highlighted}
     */
    highlighted: {}
  };
  module.exports = View;
});
define("bui/common/component/controller", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview  控件可以实例化的基类
   * @ignore
   * @author yiminghe@gmail.com
   * copied by dxq613@gmail.com
   */
  /**
   * jQuery 事件
   * @class jQuery.Event
   * @private
   */
  'use strict';
  var $ = require('jquery'),
    UIBase = require("bui/common/component/uibase/uibase"),
    Manager = require("bui/common/component/manage"),
    View = require("bui/common/component/view"),
    Loader = require("bui/common/component/loader"),
    wrapBehavior = BUI.wrapBehavior,
    getWrapBehavior = BUI.getWrapBehavior;
  /**
   * @ignore
   */
  function wrapperViewSetter(attrName) {
      return function(ev) {
        var self = this;
        // in case bubbled from sub component
        if (self === ev.target) {
          var value = ev.newVal,
            view = self.get('view');
          if (view) {
            view.set(attrName, value);
          }
        }
      };
    }
    /**
     * @ignore
     */
  function wrapperViewGetter(attrName) {
      return function(v) {
        var self = this,
          view = self.get('view');
        return v === undefined ? view.get(attrName) : v;
      };
    }
    /**
     * @ignore
     */
  function initChild(self, c, renderBefore) {
      // 生成父组件的 dom 结构
      self.create();
      var contentEl = self.getContentElement(),
        defaultCls = self.get('defaultChildClass');
      //配置默认 xclass
      if (!c.xclass && !(c instanceof Controller)) {
        if (!c.xtype) {
          c.xclass = defaultCls;
        } else {
          c.xclass = defaultCls + '-' + c.xtype;
        }
      }
      c = BUI.Component.create(c, self);
      c.setInternal('parent', self);
      // set 通知 view 也更新对应属性
      c.set('render', contentEl);
      c.set('elBefore', renderBefore);
      // 如果 parent 也没渲染，子组件 create 出来和 parent 节点关联
      // 子组件和 parent 组件一起渲染
      // 之前设好属性，view ，logic 同步还没 bind ,create 不是 render ，还没有 bindUI
      c.create(undefined);
      return c;
    }
    /**
     * 不使用 valueFn，
     * 只有 render 时需要找到默认，其他时候不需要，防止莫名其妙初始化
     * @ignore
     */
  function constructView(self) {
    // 逐层找默认渲染器
    var attrs,
      attrCfg,
      attrName,
      cfg = {},
      v,
      Render = self.get('xview');
    //将渲染层初始化所需要的属性，直接构造器设置过去
    attrs = self.getAttrs();
    // 整理属性，对纯属于 view 的属性，添加 getter setter 直接到 view
    for (attrName in attrs) {
      if (attrs.hasOwnProperty(attrName)) {
        attrCfg = attrs[attrName];
        if (attrCfg.view) {
          // 先取后 getter
          // 防止死循环
          if ((v = self.get(attrName)) !== undefined) {
            cfg[attrName] = v;
          }
          // setter 不应该有实际操作，仅用于正规化比较好
          // attrCfg.setter = wrapperViewSetter(attrName);
          // 不更改attrCfg的定义，可以多个实例公用一份attrCfg
          /*self.on('after' + BUI.ucfirst(attrName) + 'Change',
            wrapperViewSetter(attrName));
          */
          // 逻辑层读值直接从 view 层读
          // 那么如果存在默认值也设置在 view 层
          // 逻辑层不要设置 getter
          //attrCfg.getter = wrapperViewGetter(attrName);
        }
      }
    }
    // does not autoRender for view
    delete cfg.autoRender;
    cfg.ksComponentCss = getComponentCss(self);
    return new Render(cfg);
  }

  function getComponentCss(self) {
    var constructor = self.constructor,
      cls,
      re = [];
    while (constructor && constructor !== Controller) {
      cls = Manager.getXClassByConstructor(constructor);
      if (cls) {
        re.push(cls);
      }
      constructor = constructor.superclass && constructor.superclass.constructor;
    }
    return re.join(' ');
  }

  function isMouseEventWithinElement(e, elem) {
      var relatedTarget = e.relatedTarget;
      // 在里面或等于自身都不算 mouseenter/leave
      return relatedTarget && (relatedTarget === elem[0] || $.contains(elem, relatedTarget));
    }
    /**
     * 可以实例化的控件，作为最顶层的控件类，一切用户控件都继承此控件
     * xclass: 'controller'.
     * ** 创建子控件 **
     * <pre><code>
     * var Control = Controller.extend([mixin1,mixin2],{ //原型链上的函数
     *   renderUI : function(){ //创建DOM
     *
     *   },
     *   bindUI : function(){  //绑定事件
     *
     *   },
     *   destructor : funciton(){ //析构函数
     *
     *   }
     * },{
     *   ATTRS : { //默认的属性
     *     text : {
     *
     *     }
     *   }
     * },{
     *   xclass : 'a' //用于把对象解析成类
     * });
     * </code></pre>
     *
     * ** 创建对象 **
     * <pre><code>
     * var c1 = new Control({
     *   render : '#t1', //在t1上创建
     *   text : 'text1',
     *   children : [{xclass : 'a',text : 'a1'},{xclass : 'b',text : 'b1'}]
     * });
     *
     * c1.render();
     * </code></pre>
     * @extends BUI.Component.UIBase
     * @mixins BUI.Component.UIBase.Tpl
     * @mixins BUI.Component.UIBase.Decorate
     * @mixins BUI.Component.UIBase.Depends
     * @mixins BUI.Component.UIBase.ChildCfg
     * @class BUI.Component.Controller
     */
  var Controller = UIBase.extend([UIBase.Decorate, UIBase.Tpl, UIBase.ChildCfg, UIBase.KeyNav, UIBase.Depends], {
    /**
     * 是否是控件，标示对象是否是一个UI 控件
     * @type {Boolean}
     */
    isController: true,
    /**
     * 使用前缀获取类的名字
     * @param classes {String} class names without prefixCls. Separated by space.
     * @method
     * @protected
     * @return {String} class name with prefixCls
     */
    getCssClassWithPrefix: Manager.getCssClassWithPrefix,
    /**
     * From UIBase, Initialize this component.       *
     * @protected
     */
    initializer: function() {
      var self = this;
      if (!self.get('id')) {
        self.set('id', self.getNextUniqueId());
      }
      Manager.addComponent(self.get('id'), self);
      // initialize view
      var view = constructView(self);
      self.setInternal('view', view);
      self.__view = view;
    },
    /**
     * 返回新的唯一的Id,结果是 'xclass' + number
     * @protected
     * @return {String} 唯一id
     */
    getNextUniqueId: function() {
      var self = this,
        xclass = Manager.getXClassByConstructor(self.constructor);
      return BUI.guid(xclass);
    },
    /**
     * From UIBase. Constructor(or get) view object to create ui elements.
     * @protected
     *
     */
    createDom: function() {
      var self = this,
        //el,
        view = self.get('view');
      view.create(undefined);
      //el = view.getKeyEventTarget();
      /*if (!self.get('allowTextSelection')) {
        //el.unselectable(undefined);
      }*/
    },
    /**
     * From UIBase. Call view object to render ui elements.
     * @protected
     *
     */
    renderUI: function() {
      var self = this,
        loader = self.get('loader');
      self.get('view').render();
      self._initChildren();
      if (loader) {
        self.setInternal('loader', loader);
      }
      /**/
    },
    _initChildren: function(children) {
      var self = this,
        i,
        children,
        child;
      // then render my children
      children = children || self.get('children').concat();
      self.get('children').length = 0;
      for (i = 0; i < children.length; i++) {
        child = self.addChild(children[i]);
        child.render();
      }
    },
    /**
     * bind ui for box
     * @private
     */
    bindUI: function() {
      var self = this,
        events = self.get('events');
      this.on('afterVisibleChange', function(e) {
        this.fire(e.newVal ? 'show' : 'hide');
      });
      //处理控件事件，设置事件是否冒泡
      BUI.each(events, function(v, k) {
        self.publish(k, {
          bubbles: v
        });
      });
    },
    /**
     * 控件是否包含指定的DOM元素,包括根节点
     * <pre><code>
     *   var control = new Control();
     *   $(document).on('click',function(ev){
     *   var target = ev.target;
     *
     *   if(!control.containsElement(elem)){ //未点击在控件内部
     *     control.hide();
     *   }
     *   });
     * </code></pre>
     * @param  {HTMLElement} elem DOM 元素
     * @return {Boolean}  是否包含
     */
    containsElement: function(elem) {
      var _self = this,
        el = _self.get('el'),
        children = _self.get('children'),
        result = false;
      if (!_self.get('rendered')) {
        return false;
      }
      if ($.contains(el[0], elem) || el[0] === elem) {
        result = true;
      } else {
        BUI.each(children, function(item) {
          if (item.containsElement(elem)) {
            result = true;
            return false;
          }
        });
      }
      return result;
    },
    /**
     * 是否是子控件的DOM元素
     * @protected
     * @return {Boolean} 是否子控件的DOM元素
     */
    isChildrenElement: function(elem) {
      var _self = this,
        children = _self.get('children'),
        rst = false;
      BUI.each(children, function(child) {
        if (child.containsElement(elem)) {
          rst = true;
          return false;
        }
      });
      return rst;
    },
    /**
     * 显示控件
     */
    show: function() {
      var self = this;
      self.render();
      self.set('visible', true);
      return self;
    },
    /**
     * 隐藏控件
     */
    hide: function() {
      var self = this;
      self.set('visible', false);
      return self;
    },
    /**
     * 交替显示或者隐藏
     * <pre><code>
     *  control.show(); //显示
     *  control.toggle(); //隐藏
     *  control.toggle(); //显示
     * </code></pre>
     */
    toggle: function() {
      this.set('visible', !this.get('visible'));
      return this;
    },
    _uiSetFocusable: function(focusable) {
      var self = this,
        t,
        el = self.getKeyEventTarget();
      if (focusable) {
        el.attr('tabIndex', 0)
          // remove smart outline in ie
          // set outline in style for other standard browser
          .attr('hideFocus', true).on('focus', wrapBehavior(self, 'handleFocus')).on('blur', wrapBehavior(self, 'handleBlur')).on('keydown', wrapBehavior(self, 'handleKeydown')).on('keyup', wrapBehavior(self, 'handleKeyUp'));
      } else {
        el.removeAttr('tabIndex');
        if (t = getWrapBehavior(self, 'handleFocus')) {
          el.off('focus', t);
        }
        if (t = getWrapBehavior(self, 'handleBlur')) {
          el.off('blur', t);
        }
        if (t = getWrapBehavior(self, 'handleKeydown')) {
          el.off('keydown', t);
        }
        if (t = getWrapBehavior(self, 'handleKeyUp')) {
          el.off('keyup', t);
        }
      }
    },
    _uiSetHandleMouseEvents: function(handleMouseEvents) {
      var self = this,
        el = self.get('el'),
        t;
      if (handleMouseEvents) {
        el.on('mouseenter', wrapBehavior(self, 'handleMouseEnter')).on('mouseleave', wrapBehavior(self, 'handleMouseLeave')).on('contextmenu', wrapBehavior(self, 'handleContextMenu')).on('mousedown', wrapBehavior(self, 'handleMouseDown')).on('mouseup', wrapBehavior(self, 'handleMouseUp')).on('dblclick', wrapBehavior(self, 'handleDblClick'));
      } else {
        t = getWrapBehavior(self, 'handleMouseEnter') && el.off('mouseenter', t);
        t = getWrapBehavior(self, 'handleMouseLeave') && el.off('mouseleave', t);
        t = getWrapBehavior(self, 'handleContextMenu') && el.off('contextmenu', t);
        t = getWrapBehavior(self, 'handleMouseDown') && el.off('mousedown', t);
        t = getWrapBehavior(self, 'handleMouseUp') && el.off('mouseup', t);
        t = getWrapBehavior(self, 'handleDblClick') && el.off('dblclick', t);
      }
    },
    _uiSetFocused: function(v) {
      if (v) {
        this.getKeyEventTarget()[0].focus();
      }
    },
    //当使用visiblity显示隐藏时，隐藏时把DOM移除出视图内，显示时回复原位置
    _uiSetVisible: function(isVisible) {
      var self = this,
        el = self.get('el'),
        visibleMode = self.get('visibleMode');
      if (visibleMode === 'visibility') {
        if (isVisible) {
          var position = self.get('cachePosition');
          if (position) {
            self.set('xy', position);
          }
        }
        if (!isVisible) {
          var position = [
            self.get('x'), self.get('y')
          ];
          self.set('cachePosition', position);
          self.set('xy', [-999, -999]);
        }
      }
    },
    //设置children时
    _uiSetChildren: function(v) {
      var self = this,
        children = BUI.cloneObject(v);
      //self.removeChildren(true);
      self._initChildren(children);
    },
    /**
     * 使控件可用
     */
    enable: function() {
      this.set('disabled', false);
      return this;
    },
    /**
     * 使控件不可用，控件不可用时，点击等事件不会触发
     * <pre><code>
     *  control.disable(); //禁用
     *  control.enable(); //解除禁用
     * </code></pre>
     */
    disable: function() {
      this.set('disabled', true);
      return this;
    },
    /**
     * 控件获取焦点
     */
    focus: function() {
      if (this.get('focusable')) {
        this.set('focused', true);
      }
    },
    /**
     * 子组件将要渲染到的节点，在 render 类上覆盖对应方法
     * @protected
     * @ignore
     */
    getContentElement: function() {
      return this.get('view').getContentElement();
    },
    /**
     * 焦点所在元素即键盘事件处理元素，在 render 类上覆盖对应方法
     * @protected
     * @ignore
     */
    getKeyEventTarget: function() {
      return this.get('view').getKeyEventTarget();
    },
    /**
     * 添加控件的子控件，索引值为 0-based
     * <pre><code>
     *  control.add(new Control());//添加controller对象
     *  control.add({xclass : 'a'});//添加xclass 为a 的一个对象
     *  control.add({xclass : 'b'},2);//插入到第三个位置
     * </code></pre>
     * @param {BUI.Component.Controller|Object} c 子控件的实例或者配置项
     * @param {String} [c.xclass] 如果c为配置项，设置c的xclass
     * @param {Number} [index]  0-based  如果未指定索引值，则插在控件的最后
     */
    addChild: function(c, index) {
      var self = this,
        children = self.get('children'),
        renderBefore;
      if (index === undefined) {
        index = children.length;
      }
      /**
       * 添加子控件前触发
       * @event beforeAddChild
       * @param {Object} e
       * @param {Object} e.child 添加子控件时传入的配置项或者子控件
       * @param {Number} e.index 添加的位置
       */
      self.fire('beforeAddChild', {
        child: c,
        index: index
      });
      renderBefore = children[index] && children[index].get('el') || null;
      c = initChild(self, c, renderBefore);
      children.splice(index, 0, c);
      // 先 create 占位 再 render
      // 防止 render 逻辑里读 parent.get('children') 不同步
      // 如果 parent 已经渲染好了子组件也要立即渲染，就 创建 dom ，绑定事件
      if (self.get('rendered')) {
        c.render();
      }
      /**
       * 添加子控件后触发
       * @event afterAddChild
       * @param {Object} e
       * @param {Object} e.child 添加子控件
       * @param {Number} e.index 添加的位置
       */
      self.fire('afterAddChild', {
        child: c,
        index: index
      });
      return c;
    },
    /**
     * 将自己从父控件中移除
     * <pre><code>
     *  control.remove(); //将控件从父控件中移除，并未删除
     *  parent.addChild(control); //还可以添加回父控件
     *
     *  control.remove(true); //从控件中移除并调用控件的析构函数
     * </code></pre>
     * @param  {Boolean} destroy 是否删除DON节点
     * @return {BUI.Component.Controller} 删除的子对象.
     */
    remove: function(destroy) {
      var self = this,
        parent = self.get('parent');
      if (parent) {
        parent.removeChild(self, destroy);
      } else if (destroy) {
        self.destroy();
      }
      return self;
    },
    /**
     * 移除子控件，并返回移除的控件
     *
     * ** 如果 destroy=true,调用移除控件的 {@link BUI.Component.UIBase#destroy} 方法,
     * 同时删除对应的DOM **
     * <pre><code>
     *  var child = control.getChild(id);
     *  control.removeChild(child); //仅仅移除
     *
     *  control.removeChild(child,true); //移除，并调用析构函数
     * </code></pre>
     * @param {BUI.Component.Controller} c 要移除的子控件.
     * @param {Boolean} [destroy=false] 如果是true,
     * 调用控件的方法 {@link BUI.Component.UIBase#destroy} .
     * @return {BUI.Component.Controller} 移除的子控件.
     */
    removeChild: function(c, destroy) {
      var self = this,
        children = self.get('children'),
        index = BUI.Array.indexOf(c, children);
      if (index === -1) {
        return;
      }
      /**
       * 删除子控件前触发
       * @event beforeRemoveChild
       * @param {Object} e
       * @param {Object} e.child 子控件
       * @param {Boolean} e.destroy 是否清除DOM
       */
      self.fire('beforeRemoveChild', {
        child: c,
        destroy: destroy
      });
      if (index !== -1) {
        children.splice(index, 1);
      }
      if (destroy &&
        // c is still json
        c.destroy) {
        c.destroy();
      }
      /**
       * 删除子控件前触发
       * @event afterRemoveChild
       * @param {Object} e
       * @param {Object} e.child 子控件
       * @param {Boolean} e.destroy 是否清除DOM
       */
      self.fire('afterRemoveChild', {
        child: c,
        destroy: destroy
      });
      return c;
    },
    /**
     * 删除当前控件的子控件
     * <pre><code>
     *   control.removeChildren();//删除所有子控件
     *   control.removeChildren(true);//删除所有子控件，并调用子控件的析构函数
     * </code></pre>
     * @see Component.Controller#removeChild
     * @param {Boolean} [destroy] 如果设置 true,
     * 调用子控件的 {@link BUI.Component.UIBase#destroy}方法.
     */
    removeChildren: function(destroy) {
      var self = this,
        i,
        t = [].concat(self.get('children'));
      for (i = 0; i < t.length; i++) {
        self.removeChild(t[i], destroy);
      }
    },
    /**
     * 根据索引获取子控件
     * <pre><code>
     *  control.getChildAt(0);//获取第一个子控件
     *  control.getChildAt(2); //获取第三个子控件
     * </code></pre>
     * @param {Number} index 0-based 索引值.
     * @return {BUI.Component.Controller} 子控件或者null
     */
    getChildAt: function(index) {
      var children = this.get('children');
      return children[index] || null;
    },
    /**
     * 根据Id获取子控件
     * <pre><code>
     *  control.getChild('id'); //从控件的直接子控件中查找
     *  control.getChild('id',true);//递归查找所有子控件，包含子控件的子控件
     * </code></pre>
     * @param  {String} id 控件编号
     * @param  {Boolean} deep 是否继续查找在子控件中查找
     * @return {BUI.Component.Controller} 子控件或者null
     */
    getChild: function(id, deep) {
      return this.getChildBy(function(item) {
        return item.get('id') === id;
      }, deep);
    },
    /**
     * 通过匹配函数查找子控件，返回第一个匹配的对象
     * <pre><code>
     *  control.getChildBy(function(child){//从控件的直接子控件中查找
     *  return child.get('id') = '1243';
     *  });
     *
     *  control.getChild(function(child){//递归查找所有子控件，包含子控件的子控件
     *  return child.get('id') = '1243';
     *  },true);
     * </code></pre>
     * @param  {Function} math 查找的匹配函数
     * @param  {Boolean} deep 是否继续查找在子控件中查找
     * @return {BUI.Component.Controller} 子控件或者null
     */
    getChildBy: function(math, deep) {
      return this.getChildrenBy(math, deep)[0] || null;
    },
    /**
     * 获取控件的附加高度 = control.get('el').outerHeight() - control.get('el').height()
     * @protected
     * @return {Number} 附加宽度
     */
    getAppendHeight: function() {
      var el = this.get('el');
      return el.outerHeight() - el.height();
    },
    /**
     * 获取控件的附加宽度 = control.get('el').outerWidth() - control.get('el').width()
     * @protected
     * @return {Number} 附加宽度
     */
    getAppendWidth: function() {
      var el = this.get('el');
      return el.outerWidth() - el.width();
    },
    /**
     * 查找符合条件的子控件
     * <pre><code>
     *  control.getChildrenBy(function(child){//从控件的直接子控件中查找
     *  return child.get('type') = '1';
     *  });
     *
     *  control.getChildrenBy(function(child){//递归查找所有子控件，包含子控件的子控件
     *  return child.get('type') = '1';
     *  },true);
     * </code></pre>
     * @param  {Function} math 查找的匹配函数
     * @param  {Boolean} deep 是否继续查找在子控件中查找，如果符合上面的匹配函数，则不再往下查找
     * @return {BUI.Component.Controller[]} 子控件数组
     */
    getChildrenBy: function(math, deep) {
      var self = this,
        results = [];
      if (!math) {
        return results;
      }
      self.eachChild(function(child) {
        if (math(child)) {
          results.push(child);
        } else if (deep) {
          results = results.concat(child.getChildrenBy(math, deep));
        }
      });
      return results;
    },
    /**
     * 遍历子元素
     * <pre><code>
     *  control.eachChild(function(child,index){ //遍历子控件
     *
     *  });
     * </code></pre>
     * @param  {Function} func 迭代函数，函数原型function(child,index)
     */
    eachChild: function(func) {
      BUI.each(this.get('children'), func);
    },
    /**
     * Handle dblclick events. By default, this performs its associated action by calling
     * {@link BUI.Component.Controller#performActionInternal}.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleDblClick: function(ev) {
      this.performActionInternal(ev);
      if (!this.isChildrenElement(ev.target)) {
        this.fire('dblclick', {
          domTarget: ev.target,
          domEvent: ev
        });
      }
    },
    /**
     * Called by it's container component to dispatch mouseenter event.
     * @private
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleMouseOver: function(ev) {
      var self = this,
        el = self.get('el');
      if (!isMouseEventWithinElement(ev, el)) {
        self.handleMouseEnter(ev);
      }
    },
    /**
     * Called by it's container component to dispatch mouseleave event.
     * @private
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleMouseOut: function(ev) {
      var self = this,
        el = self.get('el');
      if (!isMouseEventWithinElement(ev, el)) {
        self.handleMouseLeave(ev);
      }
    },
    /**
     * Handle mouseenter events. If the component is not disabled, highlights it.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleMouseEnter: function(ev) {
      var self = this;
      this.set('highlighted', !!ev);
      self.fire('mouseenter', {
        domTarget: ev.target,
        domEvent: ev
      });
    },
    /**
     * Handle mouseleave events. If the component is not disabled, de-highlights it.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleMouseLeave: function(ev) {
      var self = this;
      self.set('active', false);
      self.set('highlighted', !ev);
      self.fire('mouseleave', {
        domTarget: ev.target,
        domEvent: ev
      });
    },
    /**
     * Handles mousedown events. If the component is not disabled,
     * If the component is activeable, then activate it.
     * If the component is focusable, then focus it,
     * else prevent it from receiving keyboard focus.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleMouseDown: function(ev) {
      var self = this,
        n,
        target = $(ev.target),
        isMouseActionButton = ev['which'] === 1,
        el;
      if (isMouseActionButton) {
        el = self.getKeyEventTarget();
        if (self.get('activeable')) {
          self.set('active', true);
        }
        if (self.get('focusable')) {
          //如果不是input,select,area等可以获取焦点的控件，那么设置此控件的focus
          /*if(target[0] == el[0] || (!target.is('input,select,area') && !target.attr('tabindex'))){
            el[0].focus(); 
            
          }*/
          self.setInternal('focused', true);
        }
        if (!self.get('allowTextSelection')) {
          // firefox /chrome 不会引起焦点转移
          n = ev.target.nodeName;
          n = n && n.toLowerCase();
          // do not prevent focus when click on editable element
          if (n !== 'input' && n !== 'textarea') {
            ev.preventDefault();
          }
        }
        if (!self.isChildrenElement(ev.target)) {
          self.fire('mousedown', {
            domTarget: ev.target,
            domEvent: ev
          });
        }
      }
    },
    /**
     * Handles mouseup events.
     * If this component is not disabled, performs its associated action by calling
     * {@link BUI.Component.Controller#performActionInternal}, then deactivates it.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleMouseUp: function(ev) {
      var self = this,
        isChildrenElement = self.isChildrenElement(ev.target);
      // 左键
      if (self.get('active') && ev.which === 1) {
        self.performActionInternal(ev);
        self.set('active', false);
        if (!isChildrenElement) {
          self.fire('click', {
            domTarget: ev.target,
            domEvent: ev
          });
        }
      }
      if (!isChildrenElement) {
        self.fire('mouseup', {
          domTarget: ev.target,
          domEvent: ev
        });
      }
    },
    /**
     * Handles context menu.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleContextMenu: function(ev) {},
    /**
     * Handles focus events. Style focused class.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleFocus: function(ev) {
      this.set('focused', !!ev);
      this.fire('focus', {
        domEvent: ev,
        domTarget: ev.target
      });
    },
    /**
     * Handles blur events. Remove focused class.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleBlur: function(ev) {
      this.set('focused', !ev);
      this.fire('blur', {
        domEvent: ev,
        domTarget: ev.target
      });
    },
    /**
     * Handle enter keydown event to {@link BUI.Component.Controller#performActionInternal}.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleKeyEventInternal: function(ev) {
      var self = this,
        isChildrenElement = self.isChildrenElement(ev.target);
      if (ev.which === 13) {
        if (!isChildrenElement) {
          self.fire('click', {
            domTarget: ev.target,
            domEvent: ev
          });
        }
        return this.performActionInternal(ev);
      }
      if (!isChildrenElement) {
        self.fire('keydown', {
          domTarget: ev.target,
          domEvent: ev
        });
      }
    },
    /**
     * Handle keydown events.
     * If the component is not disabled, call {@link BUI.Component.Controller#handleKeyEventInternal}
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    handleKeydown: function(ev) {
      var self = this;
      if (self.handleKeyEventInternal(ev)) {
        ev.halt();
        return true;
      }
    },
    handleKeyUp: function(ev) {
      var self = this;
      if (!self.isChildrenElement(ev.target)) {
        self.fire('keyup', {
          domTarget: ev.target,
          domEvent: ev
        });
      }
    },
    /**
     * Performs the appropriate action when this component is activated by the user.
     * @protected
     * @param {jQuery.Event} ev DOM event to handle.
     */
    performActionInternal: function(ev) {},
    /**
     * 析构函数
     * @protected
     */
    destructor: function() {
      var self = this,
        id,
        i,
        view,
        children = self.get('children');
      id = self.get('id');
      for (i = 0; i < children.length; i++) {
        children[i].destroy && children[i].destroy();
      }
      self.get('view').destroy();
      Manager.removeComponent(id);
    },
    //覆写set方法
    set: function(name, value, opt) {
      var _self = this,
        view = _self.__view,
        attr = _self.__attrs[name],
        ucName,
        ev,
        m;
      if (BUI.isObject(name)) {
        opt = value;
        BUI.each(name, function(v, k) {
          _self.set(k, v, opt);
        });
      }
      if (!view || !attr || (opt && opt.silent)) { //未初始化view或者没用定义属性
        Controller.superclass.set.call(this, name, value, opt);
        return _self;
      }
      var prevVal = Controller.superclass.get.call(this, name);
      //如果未改变值不进行修改
      if (!$.isPlainObject(value) && !BUI.isArray(value) && prevVal === value) {
        return _self;
      }
      ucName = BUI.ucfirst(name);
      m = '_uiSet' + ucName;
      //触发before事件
      _self.fire('before' + ucName + 'Change', {
        attrName: name,
        prevVal: prevVal,
        newVal: value
      });
      _self.setInternal(name, value);
      value = _self.__attrVals[name];
      if (view && attr.view) {
        view.set(name, value);
        //return _self;
      }
      ev = {
        attrName: name,
        prevVal: prevVal,
        newVal: value
      };
      //触发before事件
      _self.fire('after' + ucName + 'Change', ev);
      if (_self.get('binded') && _self[m]) {
        _self[m](value, ev);
      }
      return _self;
    },
    //覆写get方法，改变时同时改变view的值
    get: function(name) {
      var _self = this,
        view = _self.__view,
        attr = _self.__attrs[name],
        value = Controller.superclass.get.call(this, name);
      if (value !== undefined) {
        return value;
      }
      if (view && attr && attr.view) {
        return view.get(name);
      }
      return value;
    }
  }, {
    ATTRS: {
      /**
       * 控件的Html 内容
       * <pre><code>
       *  new Control({
       *   content : '内容',
       *   render : '#c1'
       *  });
       * </code></pre>
       * @cfg {String|jQuery} content
       */
      /**
       * 控件的Html 内容
       * @type {String|jQuery}
       */
      content: {
        view: 1
      },
      /**
       * 控件根节点使用的标签
       * <pre><code>
       *  new Control({
       *   elTagName : 'ul',
       *    content : '<li>内容</li>',  //控件的DOM &lt;ul&gt;&lt;li&gt;内容&lt;/li&gt;&lt;/ul&gt;
       *   render : '#c1'
       *  });
       * </code></pre>
       * @cfg {String} elTagName
       */
      elTagName: {
        // 生成标签名字
        view: true,
        value: 'div'
      },
      /**
       * 子元素的默认 xclass,配置child的时候没必要每次都填写xclass
       * @type {String}
       */
      defaultChildClass: {},
      /**
       * 如果控件未设置 xclass，同时父元素设置了 defaultChildClass，那么
       * xclass = defaultChildClass + '-' + xtype
       * <pre><code>
       *  A.ATTRS = {
       *  defaultChildClass : {
       *    value : 'b'
       *  }
       *  }
       *  //类B 的xclass = 'b'类 B1的xclass = 'b-1',类 B2的xclass = 'b-2',那么
       *  var a = new A({
       *  children : [
       *    {content : 'b'}, //B类
       *    {content : 'b1',xtype:'1'}, //B1类
       *    {content : 'b2',xtype:'2'}, //B2类
       *  ]
       *  });
       * </code></pre>
       * @type {String}
       */
      xtype: {},
      /**
       * 标示控件的唯一编号，默认会自动生成
       * @cfg {String} id
       */
      /**
       * 标示控件的唯一编号，默认会自动生成
       * @type {String}
       */
      id: {
        view: true
      },
      /**
       * 控件宽度
       * <pre><code>
       * new Control({
       *   width : 200 // 200,'200px','20%'
       * });
       * </code></pre>
       * @cfg {Number|String} width
       */
      /**
       * 控件宽度
       * <pre><code>
       *  control.set('width',200);
       *  control.set('width','200px');
       *  control.set('width','20%');
       * </code></pre>
       * @type {Number|String}
       */
      width: {
        view: 1
      },
      /**
       * 控件宽度
       * <pre><code>
       * new Control({
       *   height : 200 // 200,'200px','20%'
       * });
       * </code></pre>
       * @cfg {Number|String} height
       */
      /**
       * 控件宽度
       * <pre><code>
       *  control.set('height',200);
       *  control.set('height','200px');
       *  control.set('height','20%');
       * </code></pre>
       * @type {Number|String}
       */
      height: {
        view: 1
      },
      /**
       * 控件根节点应用的样式
       * <pre><code>
       *  new Control({
       *   elCls : 'test',
       *   content : '内容',
       *   render : '#t1'   //&lt;div id='t1'&gt;&lt;div class="test"&gt;内容&lt;/div&gt;&lt;/div&gt;
       *  });
       * </code></pre>
       * @cfg {String} elCls
       */
      /**
       * 控件根节点应用的样式 css class
       * @type {String}
       */
      elCls: {
        view: 1
      },
      /**
       * @cfg {Object} elStyle
       * 控件根节点应用的css属性
       *  <pre><code>
       *  var cfg = {elStyle : {width:'100px', height:'200px'}};
       *  </code></pre>
       */
      /**
       * 控件根节点应用的css属性，以键值对形式
       * @type {Object}
       *  <pre><code>
       *	 control.set('elStyle',	{
       *		width:'100px',
       *		height:'200px'
       *   });
       *  </code></pre>
       */
      elStyle: {
        view: 1
      },
      /**
       * @cfg {Object} elAttrs
       * 控件根节点应用的属性，以键值对形式:
       * <pre><code>
       *  new Control({
       *  elAttrs :{title : 'tips'}
       *  });
       * </code></pre>
       */
      /**
       * @type {Object}
       * 控件根节点应用的属性，以键值对形式:
       * { title : 'tips'}
       * @ignore
       */
      elAttrs: {
        view: 1
      },
      /**
       * 将控件插入到指定元素前
       * <pre><code>
       *  new Control({
       *    elBefore : '#t1'
       *  });
       * </code></pre>
       * @cfg {jQuery} elBefore
       */
      /**
       * 将控件插入到指定元素前
       * @type {jQuery}
       * @ignore
       */
      elBefore: {
        // better named to renderBefore, too late !
        view: 1
      },
      /**
       * 只读属性，根节点DOM
       * @type {jQuery}
       */
      el: {
        view: 1
      },
      /**
       * 控件支持的事件
       * @type {Object}
       * @protected
       */
      events: {
        value: {
          /**
           * 点击事件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'click': true,
          /**
           * 双击事件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'dblclick': true,
          /**
           * 鼠标移入控件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'mouseenter': true,
          /**
           * 鼠标移出控件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'mouseleave': true,
          /**
           * 键盘按下按键事件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'keydown': true,
          /**
           * 键盘按键抬起控件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'keyup': true,
          /**
           * 控件获取焦点事件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'focus': false,
          /**
           * 控件丢失焦点事件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'blur': false,
          /**
           * 鼠标按下控件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'mousedown': true,
          /**
           * 鼠标抬起控件，此事件会冒泡，所以可以在父元素上监听所有子元素的此事件
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Component.Controller} e.target 触发事件的对象
           * @param {jQuery.Event} e.domEvent DOM触发的事件
           * @param {HTMLElement} e.domTarget 触发事件的DOM节点
           */
          'mouseup': true,
          /**
           * 控件显示
           * @event
           */
          'show': false,
          /**
           * 控件隐藏
           * @event
           */
          'hide': false
        }
      },
      /**
       * 指定控件的容器
       * <pre><code>
       *  new Control({
       *  render : '#t1',
       *  elCls : 'test',
       *  content : '<span>123</span>'  //&lt;div id="t1"&gt;&lt;div class="test bui-xclass"&gt;&lt;span&gt;123&lt;/span&gt;&lt;/div&gt;&lt;/div&gt;
       *  });
       * </code></pre>
       * @cfg {jQuery} render
       */
      /**
       * 指定控件的容器
       * @type {jQuery}
       * @ignore
       */
      render: {
        view: 1
      },
      /**
       * ARIA 标准中的role,不要更改此属性
       * @type {String}
       * @protected
       */
      role: {
        view: 1
      },
      /**
       * 状态相关的样式,默认情况下会使用 前缀名 + xclass + '-' + 状态名
       * <ol>
       *   <li>hover</li>
       *   <li>focused</li>
       *   <li>active</li>
       *   <li>disabled</li>
       * </ol>
       * @type {Object}
       */
      statusCls: {
        view: true,
        value: {}
      },
      /**
       * 控件的可视方式,值为：
       *  - 'display'
       *  - 'visibility'
       *  <pre><code>
       *   new Control({
       *   visibleMode: 'visibility'
       *   });
       *  </code></pre>
       * @cfg {String} [visibleMode = 'display']
       */
      /**
       * 控件的可视方式,使用 css
       *  - 'display' 或者
       *  - 'visibility'
       * <pre><code>
       *  control.set('visibleMode','display')
       * </code></pre>
       * @type {String}
       */
      visibleMode: {
        view: 1,
        value: 'display'
      },
      /**
       * 控件是否可见
       * <pre><code>
       *  new Control({
       *  visible : false   //隐藏
       *  });
       * </code></pre>
       * @cfg {Boolean} [visible = true]
       */
      /**
       * 控件是否可见
       * <pre><code>
       *  control.set('visible',true); //control.show();
       *  control.set('visible',false); //control.hide();
       * </code></pre>
       * @type {Boolean}
       * @default true
       */
      visible: {
        value: true,
        view: 1
      },
      /**
       * 是否允许处理鼠标事件
       * @default true.
       * @type {Boolean}
       * @protected
       */
      handleMouseEvents: {
        value: true
      },
      /**
       * 控件是否可以获取焦点
       * @default true.
       * @protected
       * @type {Boolean}
       */
      focusable: {
        value: false,
        view: 1
      },
      /**
       * 一旦使用loader的默认配置
       * @protected
       * @type {Object}
       */
      defaultLoaderCfg: {
        value: {
          property: 'content',
          autoLoad: true
        }
      },
      /**
       * 控件内容的加载器
       * @type {BUI.Component.Loader}
       */
      loader: {
        getter: function(v) {
          var _self = this,
            defaultCfg;
          if (v && !v.isLoader) {
            v.target = _self;
            defaultCfg = _self.get('defaultLoaderCfg')
            v = new Loader(BUI.merge(defaultCfg, v));
            _self.setInternal('loader', v);
          }
          return v;
        }
      },
      /**
       * 1. Whether allow select this component's text.<br/>
       * 2. Whether not to lose last component's focus if click current one (set false).
       *
       * Defaults to: false.
       * @type {Boolean}
       * @property allowTextSelection
       * @protected
       */
      /**
       * @ignore
       */
      allowTextSelection: {
        // 和 focusable 分离
        // grid 需求：容器允许选择里面内容
        value: true
      },
      /**
       * 控件是否可以激活
       * @default true.
       * @type {Boolean}
       * @protected
       */
      activeable: {
        value: true
      },
      /**
       * 控件是否获取焦点
       * @type {Boolean}
       * @readOnly
       */
      focused: {
        view: 1
      },
      /**
       * 控件是否处于激活状态，按钮按下还未抬起
       * @type {Boolean}
       * @default false
       * @protected
       */
      active: {
        view: 1
      },
      /**
       * 控件是否高亮
       * @cfg {Boolean} highlighted
       * @ignore
       */
      /**
       * 控件是否高亮
       * @type {Boolean}
       * @protected
       */
      highlighted: {
        view: 1
      },
      /**
       * 子控件集合
       * @cfg {BUI.Component.Controller[]} children
       */
      /**
       * 子控件集合
       * @type {BUI.Component.Controller[]}
       */
      children: {
        sync: false,
        shared: false,
        value: [] /**/
      },
      /**
       * 控件的CSS前缀
       * @cfg {String} [prefixCls = BUI.prefix]
       */
      /**
       * 控件的CSS前缀
       * @type {String}
       * @default BUI.prefix
       */
      prefixCls: {
        value: BUI.prefix, // box srcNode need
        view: 1
      },
      /**
       * 父控件
       * @cfg {BUI.Component.Controller} parent
       * @ignore
       */
      /**
       * 父控件
       * @type {BUI.Component.Controller}
       */
      parent: {
        setter: function(p) {
          // 事件冒泡源
          this.addTarget(p);
        }
      },
      /**
       * 禁用控件
       * @cfg {Boolean} [disabled = false]
       */
      /**
       * 禁用控件
       * <pre><code>
       *  control.set('disabled',true); //==  control.disable();
       *  control.set('disabled',false); //==  control.enable();
       * </code></pre>
       * @type {Boolean}
       * @default false
       */
      disabled: {
        view: 1,
        value: false
      },
      /**
       * 渲染控件的View类.
       * @protected
       * @cfg {BUI.Component.View} [xview = BUI.Component.View]
       */
      /**
       * 渲染控件的View类.
       * @protected
       * @type {BUI.Component.View}
       */
      xview: {
        value: View
      }
    },
    PARSER: {
      visible: function(el) {
        var _self = this,
          display = el.css('display'),
          visibility = el.css('visibility'),
          visibleMode = _self.get('visibleMode');
        if ((display == 'none' && visibleMode == 'display') || (visibility == 'hidden' && visibleMode == 'visibility')) {
          return false;
        }
        return true;
      },
      disabled: function(el) {
        var _self = this,
          cls = _self.get('prefixCls') + _self.get('xclass') + '-disabled';
        return el.hasClass(cls);
      }
    }
  }, {
    xclass: 'controller',
    priority: 0
  });
  module.exports = Controller;
});
define("bui/common/component/loader", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 加载控件内容
   * @ignore
   */
  'use strict';
  var $ = require('jquery'),
    BUI = require("bui/common/util"),
    Base = require("bui/common/base"),
    /**
     * @class BUI.Component.Loader
     * @extends BUI.Base
     * ** 控件的默认Loader属性是：**
     * <pre><code>
     *
     *   defaultLoader : {
     *     value : {
     *       property : 'content',
     *       autoLoad : true
     *     }
     *   }
     * </code></pre>
     * ** 一般的控件默认读取html，作为控件的content值 **
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     *
     * ** 可以修改Loader的默认属性，加载children **
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/children.json',
     *       property : 'children',
     *       dataType : 'json'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * 加载控件内容的类，一般不进行实例化
     */
    Loader = function(config) {
      Loader.superclass.constructor.call(this, config);
      this._init();
    };
  Loader.ATTRS = {
    /**
     * 加载内容的地址
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {String} url
     */
    url: {},
    /**
     * 对应的控件，加载完成后设置属性到对应的控件
     * @readOnly
     * @type {BUI.Component.Controller}
     */
    target: {},
    /**
     * @private
     * 是否load 过
     */
    hasLoad: {
      value: false
    },
    /**
     * 是否自动加载数据
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       autoLoad : false
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Boolean} [autoLoad = true]
     */
    autoLoad: {},
    /**
     * 延迟加载
     *
     *   - event : 触发加载的事件
     *   - repeat ：是否重复加载
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       lazyLoad : {
     *         event : 'show',
     *         repeat : true
     *       }
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Object} [lazyLoad = null]
     */
    lazyLoad: {},
    /**
     * 加载返回的数据作为控件的那个属性
     * <pre><code>
     *   var control = new BUI.List.SimpleList({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       dataType : 'json',
     *       property : 'items'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {String} property
     */
    property: {},
    /**
     * 格式化返回的数据
     * @cfg {Function} renderer
     */
    renderer: {
      value: function(value) {
        return value;
      }
    },
    /**
     * 加载数据时是否显示屏蔽层和加载提示 {@link BUI.Mask.LoadMask}
     *
     *  -  loadMask : true时使用loadMask 默认的配置信息
     *  -  loadMask : {msg : '正在加载，请稍后。。'} LoadMask的配置信息
     *   <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       loadMask : true
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Boolean|Object} [loadMask = false]
     */
    loadMask: {
      value: false
    },
    /**
     * ajax 请求返回数据的类型
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       dataType : 'json',
     *       property : 'items'
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {String} [dataType = 'text']
     */
    dataType: {
      value: 'text'
    },
    /**
     * Ajax请求的配置项,会覆盖 url,dataType数据
     * @cfg {Object} ajaxOptions
     */
    ajaxOptions: {
      //shared : false,
      value: {
        type: 'get',
        cache: false
      }
    },
    /**
     * 初始化的请求参数
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       params : {
     *         a : 'a',
     *         b : 'b'
     *       }
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Object} params
     * @default null
     */
    params: {},
    /**
     * 附加参数，每次请求都带的参数
     * @cfg {Object} appendParams
     */
    appendParams: {},
    /**
     * 最后一次请求的参数
     * @readOnly
     * @private
     * @type {Object}
     */
    lastParams: {
      shared: false,
      value: {}
    },
    /**
     * 加载数据，并添加属性到控件后的回调函数
     *   - data : 加载的数据
     *   - params : 加载的参数
     * <pre><code>
     *   var control = new BUI.Component.Controller({
     *     render : '#c1',
     *     loader : {
     *       url : 'data/text.json',
     *       callback : function(text){
     *         var target = this.get('target');//control
     *         //TO DO
     *       }
     *     }
     *   });
     *
     *   control.render();
     * </code></pre>
     * @cfg {Function} callback
     */
    callback: {},
    /**
     * 失败的回调函数
     *   - response : 返回的错误对象
     *   - params : 加载的参数
     * @cfg {Function} failure
     */
    failure: {}
  };
  BUI.extend(Loader, Base);
  BUI.augment(Loader, {
    /**
     * @protected
     * 是否是Loader
     * @type {Boolean}
     */
    isLoader: true,
    //初始化
    _init: function() {
      var _self = this,
        autoLoad = _self.get('autoLoad'),
        params = _self.get('params');
      _self._initMask();
      if (autoLoad) {
        _self.load(params);
      } else {
        _self._initParams();
        _self._initLazyLoad();
      }
    },
    //初始化延迟加载
    _initLazyLoad: function() {
      var _self = this,
        target = _self.get('target'),
        lazyLoad = _self.get('lazyLoad');
      if (target && lazyLoad && lazyLoad.event) {
        target.on(lazyLoad.event, function() {
          if (!_self.get('hasLoad') || lazyLoad.repeat) {
            _self.load();
          }
        });
      }
    },
    /**
     * 初始化mask
     * @private
     */
    _initMask: function() {
      var _self = this,
        target = _self.get('target'),
        loadMask = _self.get('loadMask');
      if (target && loadMask) {
        require.async('bui/mask', function(Mask) {
          var cfg = $.isPlainObject(loadMask) ? loadMask : {};
          loadMask = new Mask.LoadMask(BUI.mix({
            el: target.get('el')
          }, cfg));
          _self.set('loadMask', loadMask);
        });
      }
    },
    //初始化查询参数
    _initParams: function() {
      var _self = this,
        lastParams = _self.get('lastParams'),
        params = _self.get('params');
      //初始化 参数
      BUI.mix(lastParams, params);
    },
    /**
     * 加载内容
     * @param {Object} params 加载数据的参数
     */
    load: function(params) {
      var _self = this,
        url = _self.get('url'),
        ajaxOptions = _self.get('ajaxOptions'),
        lastParams = _self.get('lastParams'),
        appendParams = _self.get('appendParams');
      //BUI.mix(true,lastParams,appendParams,params);
      params = params || lastParams;
      params = BUI.merge(appendParams, params); //BUI.cloneObject(lastParams);
      _self.set('lastParams', params);
      //未提供加载地址，阻止加载
      if (!url) {
        return;
      }
      _self.onBeforeLoad();
      _self.set('hasLoad', true);
      $.ajax(BUI.mix({
        dataType: _self.get('dataType'),
        data: params,
        url: url,
        success: function(data) {
          _self.onload(data, params);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          _self.onException({
            jqXHR: jqXHR,
            textStatus: textStatus,
            errorThrown: errorThrown
          }, params);
        }
      }, ajaxOptions));
    },
    /**
     * @private
     * 加载前
     */
    onBeforeLoad: function() {
      var _self = this,
        loadMask = _self.get('loadMask');
      if (loadMask && loadMask.show) {
        loadMask.show();
      }
    },
    /**
     * @private
     * 加载完毕
     */
    onload: function(data, params) {
      var _self = this,
        loadMask = _self.get('loadMask'),
        property = _self.get('property'),
        callback = _self.get('callback'),
        renderer = _self.get('renderer'),
        target = _self.get('target');
      if (BUI.isString(data)) {
        target.set(property, ''); //防止2次返回的数据一样
      }
      target.set(property, renderer.call(_self, data));
      /**/
      if (loadMask && loadMask.hide) {
        loadMask.hide();
      }
      if (callback) {
        callback.call(this, data, params);
      }
    },
    /**
     * @private
     * 加载出错
     */
    onException: function(response, params) {
      var _self = this,
        failure = _self.get('failure');
      if (failure) {
        failure.call(this, response, params);
      }
    }
  });
  module.exports = Loader;
});
define("bui/data", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview Data 命名空间的入口文件
   * @ignore
   */
  var BUI = require("bui/common"),
    Data = BUI.namespace('Data');
  BUI.mix(Data, {
    Sortable: require("bui/data/sortable"),
    Proxy: require("bui/data/proxy"),
    AbstractStore: require("bui/data/abstractstore"),
    Store: require("bui/data/store"),
    Node: require("bui/data/node"),
    TreeStore: require("bui/data/treestore")
  });
  module.exports = Data;
});
define("bui/data/sortable", [], function(require, exports, module) {
  /**
   * @fileOverview 可排序扩展类
   * @ignore
   */
  var ASC = 'ASC',
    DESC = 'DESC';
  /**
   * 排序扩展方法，无法直接使用
   * 请在继承了 {@link BUI.Base}的类上使用
   * @class BUI.Data.Sortable
   * @extends BUI.Base
   */
  var sortable = function() {};
  sortable.ATTRS = {
    /**
     * 比较函数
     * @cfg {Function} compareFunction
     * 函数原型 function(v1,v2)，比较2个字段是否相等
     * 如果是字符串则按照本地比较算法，否则使用 > ,== 验证
     */
    compareFunction: {
      value: function(v1, v2) {
        if (v1 === undefined) {
          v1 = '';
        }
        if (v2 === undefined) {
          v2 = '';
        }
        if (BUI.isString(v1)) {
          return v1.localeCompare(v2);
        }
        if (v1 > v2) {
          return 1;
        } else if (v1 === v2) {
          return 0;
        } else {
          return -1;
        }
      }
    },
    /**
     * 排序字段
     * @cfg {String} sortField
     */
    /**
     * 排序字段
     * @type {String}
     */
    sortField: {},
    /**
     * 排序方向,'ASC'、'DESC'
     * @cfg {String} [sortDirection = 'ASC']
     */
    /**
     * 排序方向,'ASC'、'DESC'
     * @type {String}
     */
    sortDirection: {
      value: 'ASC'
    },
    /**
     * 排序信息
     * <ol>
     * <li>field: 排序字段</li>
     * <li>direction: 排序方向,ASC(默认),DESC</li>
     * </ol>
     * @cfg {Object} sortInfo
     */
    /**
     * 排序信息
     * <ol>
     * <li>field: 排序字段</li>
     * <li>direction: 排序方向,ASC(默认),DESC</li>
     * </ol>
     * @type {Object}
     */
    sortInfo: {
      getter: function() {
        var _self = this,
          field = _self.get('sortField');
        return {
          field: field,
          direction: _self.get('sortDirection')
        };
      },
      setter: function(v) {
        var _self = this;
        _self.set('sortField', v.field);
        _self.set('sortDirection', v.direction);
      }
    }
  };
  BUI.augment(sortable, {
    compare: function(obj1, obj2, field, direction) {
      var _self = this,
        dir;
      field = field || _self.get('sortField');
      direction = direction || _self.get('sortDirection');
      //如果未指定排序字段，或方向，则按照默认顺序
      if (!field || !direction) {
        return 1;
      }
      dir = direction === ASC ? 1 : -1;
      return _self.get('compareFunction')(obj1[field], obj2[field]) * dir;
    },
    /**
     * 获取排序的集合
     * @protected
     * @return {Array} 排序集合
     */
    getSortData: function() {},
    /**
     * 排序数据
     * @param  {String|Array} field   排序字段或者数组
     * @param  {String} direction 排序方向
     * @param {Array} records 排序
     * @return {Array}
     */
    sortData: function(field, direction, records) {
      var _self = this,
        records = records || _self.getSortData();
      if (BUI.isArray(field)) {
        records = field;
        field = null;
      }
      field = field || _self.get('sortField');
      direction = direction || _self.get('sortDirection');
      _self.set('sortField', field);
      _self.set('sortDirection', direction);
      if (!field || !direction) {
        return records;
      }
      records.sort(function(obj1, obj2) {
        return _self.compare(obj1, obj2, field, direction);
      });
      return records;
    }
  });
  module.exports = sortable;
});
define("bui/data/proxy", ["jquery"], function(require, exports, module) {
  var $ = require('jquery'),
    Sortable = require("bui/data/sortable");
  /**
   * 数据代理对象，加载数据,
   * 一般不直接使用，在store里面决定使用什么类型的数据代理对象
   * @class BUI.Data.Proxy
   * @extends BUI.Base
   * @abstract
   */
  var proxy = function(config) {
    proxy.superclass.constructor.call(this, config);
  };
  proxy.ATTRS = {};
  BUI.extend(proxy, BUI.Base);
  BUI.augment(proxy, {
    /**
     * @protected
     * 读取数据的方法，在子类中覆盖
     */
    _read: function(params, callback) {},
    /**
     * 读数据
     * @param  {Object} params 键值对形式的参数
     * @param {Function} callback 回调函数，函数原型 function(data){}
     * @param {Object} scope 回调函数的上下文
     */
    read: function(params, callback, scope) {
      var _self = this;
      scope = scope || _self;
      _self._read(params, function(data) {
        callback.call(scope, data);
      });
    },
    /**
     * @protected
     * 保存数据的方法，在子类中覆盖
     */
    _save: function(ype, data, callback) {},
    /**
     * 保存数据
     * @param {String} type 类型，包括，add,update,remove,all几种类型
     * @param  {Object} saveData 键值对形式的参数
     * @param {Function} callback 回调函数，函数原型 function(data){}
     * @param {Object} scope 回调函数的上下文
     */
    save: function(type, saveData, callback, scope) {
      var _self = this;
      scope = scope || _self;
      _self._save(type, saveData, function(data) {
        callback.call(scope, data);
      });
    }
  });
  var TYPE_AJAX = {
    READ: 'read',
    ADD: 'add',
    UPDATE: 'update',
    REMOVE: 'remove',
    SAVE_ALL: 'all'
  };
  /**
   * 异步加载数据的代理
   * @class BUI.Data.Proxy.Ajax
   * @extends BUI.Data.Proxy
   */
  var ajaxProxy = function(config) {
    ajaxProxy.superclass.constructor.call(this, config);
  };
  ajaxProxy.ATTRS = BUI.mix(true, proxy.ATTRS, {
    /**
     * 限制条数
     * @cfg {String} [limitParam='limit']
     */
    /**
     * 限制条数
     * @type {String}
     * @default 'limit'
     */
    limitParam: {
      value: 'limit'
    },
    /**
     * 起始纪录代表的字段
     * @cfg {String} [startParam='start']
     */
    /**
     * 起始纪录代表的字段
     * @type {String}
     */
    startParam: {
      value: 'start'
    },
    /**
     * 页码的字段名
     * @cfg {String} [pageIndexParam='pageIndex']
     */
    /**
     * 页码的字段名
     * @type {String}
     * @default 'pageIndex'
     */
    pageIndexParam: {
      value: 'pageIndex'
    },
    /**
     * 保存类型的字段名,如果每种保存类型未设置对应的Url，则附加参数
     * @type {Object}
     */
    saveTypeParam: {
      value: 'saveType'
    },
    /**
     * 保存数据放到的字段名称
     * @type {String}
     */
    saveDataParam: {},
    /**
     * 传递到后台，分页开始的页码，默认从0开始
     * @type {Number}
     */
    pageStart: {
      value: 0
    },
    /**
     * 加载数据时，返回的格式,目前只支持"json、jsonp"格式<br>
     * @cfg {String} [dataType='json']
     */
    /**
     * 加载数据时，返回的格式,目前只支持"json、jsonp"格式<br>
     * @type {String}
     * @default "json"
     */
    dataType: {
      value: 'json'
    },
    /**
     * 获取数据的方式,'GET'或者'POST',默认为'GET'
     * @cfg {String} [method='GET']
     */
    /**
     * 获取数据的方式,'GET'或者'POST',默认为'GET'
     * @type {String}
     * @default 'GET'
     */
    method: {
      value: 'GET'
    },
    /**
     * 异步请求的所有自定义参数，开放的其他属性用于快捷使用，如果有特殊参数配置，可以使用这个属性,<br>
     * 不要使用success和error的回调函数，会覆盖默认的处理数据的函数
     * @cfg {Object} ajaxOptions
     */
    /**
     * 异步请求的所有自定义参数
     * @type {Object}
     */
    ajaxOptions: {
      value: {}
    },
    /**
     * 是否使用Cache
     * @type {Boolean}
     */
    cache: {
      value: false
    },
    /**
     * 保存数据的配置信息
     * @type {Object}
     */
    save: {},
    /**
     * 加载数据的链接
     * @cfg {String} url
     * @required
     */
    /**
     * 加载数据的链接
     * @type {String}
     * @required
     */
    url: {}
  });
  BUI.extend(ajaxProxy, proxy);
  BUI.augment(ajaxProxy, {
    _processParams: function(params) {
      var _self = this,
        pageStart = _self.get('pageStart'),
        arr = ['start', 'limit', 'pageIndex'];
      if (params.pageIndex != null) {
        params.pageIndex = params.pageIndex + pageStart;
      }
      BUI.each(arr, function(field) {
        var fieldParam = _self.get(field + 'Param');
        if (fieldParam !== field) {
          params[fieldParam] = params[field];
          delete params[field];
        }
      });
    },
    //获取异步请求的url
    _getUrl: function(type) {
      var _self = this,
        save = _self.get('save'),
        url;
      if (type === TYPE_AJAX.READ) { //获取数据，直接返回 url
        return _self.get('url');
      }
      //如果不存在保存参数，则返回 url
      if (!save) {
        return _self.get('url')
      }
      if (BUI.isString(save)) {
        return save;
      }
      url = save[type + 'Url'];
      if (!url) {
        url = _self.get('url');
      }
      return url;
    },
    //根据类型附加额外的参数
    _getAppendParams: function(type) {
      var _self = this,
        save,
        saveTypeParam,
        rst = null;
      if (type == TYPE_AJAX.READ) {
        return rst;
      }
      save = _self.get('save');
      saveTypeParam = _self.get('saveTypeParam');
      if (save && !save[type + 'Url']) {
        rst = {};
        rst[saveTypeParam] = type;
      }
      return rst;
    },
    /**
     * @protected
     * @private
     */
    _read: function(params, callback) {
      var _self = this,
        cfg;
      params = BUI.cloneObject(params);
      _self._processParams(params);
      cfg = _self._getAjaxOptions(TYPE_AJAX.READ, params);
      _self._ajax(cfg, callback);
    },
    //获取异步请求的选项
    _getAjaxOptions: function(type, params) {
      var _self = this,
        ajaxOptions = _self.get('ajaxOptions'),
        url = _self._getUrl(type),
        cfg;
      BUI.mix(params, _self._getAppendParams(type));
      cfg = BUI.merge({
        url: url,
        type: _self.get('method'),
        dataType: _self.get('dataType'),
        data: params,
        cache: _self.get('cache')
      }, ajaxOptions);
      return cfg;
    },
    //异步请求
    _ajax: function(cfg, callback) {
      var _self = this,
        success = cfg.success,
        error = cfg.error;
      //复写success
      cfg.success = function(data) {
        success && success(data);
        callback(data);
      };
      //复写错误
      cfg.error = function(jqXHR, textStatus, errorThrown) {
        error && error(jqXHR, textStatus, errorThrown);
        var result = {
          exception: {
            status: textStatus,
            errorThrown: errorThrown,
            jqXHR: jqXHR
          }
        };
        callback(result);
      }
      $.ajax(cfg);
    },
    _save: function(type, data, callback) {
      var _self = this,
        cfg;
      cfg = _self._getAjaxOptions(type, data);
      _self._ajax(cfg, callback);
    }
  });
  /**
   * 读取缓存的代理
   * @class BUI.Data.Proxy.Memery
   * @extends BUI.Data.Proxy
   * @mixins BUI.Data.Sortable
   */
  var memeryProxy = function(config) {
    memeryProxy.superclass.constructor.call(this, config);
  };
  memeryProxy.ATTRS = {
    /**
     * 匹配的字段名
     * @type {Array}
     */
    matchFields: {
      value: []
    }
  };
  BUI.extend(memeryProxy, proxy);
  BUI.mixin(memeryProxy, [Sortable]);
  BUI.augment(memeryProxy, {
    /**
     * @protected
     * @ignore
     */
    _read: function(params, callback) {
      var _self = this,
        pageable = params.pageable,
        start = params.start,
        sortField = params.sortField,
        sortDirection = params.sortDirection,
        limit = params.limit,
        data = _self.get('data'),
        rows = [];
      data = _self._getMatches(params);
      _self.sortData(sortField, sortDirection);
      if (limit) { //分页时
        rows = data.slice(start, start + limit);
        callback({
          rows: rows,
          results: data.length
        });
      } else { //不分页时
        rows = data.slice(start);
        callback(rows);
      }
    },
    //获取匹配函数
    _getMatchFn: function(params, matchFields) {
      var _self = this;
      return function(obj) {
        var result = true;
        BUI.each(matchFields, function(field) {
          if (params[field] != null && !(params[field] === obj[field])) {
            result = false;
            return false;
          }
        });
        return result;
      }
    },
    //获取匹配的值
    _getMatches: function(params) {
      var _self = this,
        matchFields = _self.get('matchFields'),
        matchFn,
        data = _self.get('data') || [];
      if (params && matchFields.length) {
        matchFn = _self._getMatchFn(params, matchFields);
        data = BUI.Array.filter(data, matchFn);
      }
      return data;
    },
    /**
     * @protected
     * 保存修改的数据
     */
    _save: function(type, saveData, callback) {
      var _self = this,
        data = _self.get('data');
      if (type == TYPE_AJAX.ADD) {
        data.push(saveData);
      } else if (type == TYPE_AJAX.REMOVE) {
        BUI.Array.remove(data, saveData);
      } else if (type == TYPE_AJAX.SAVE_ALL) {
        BUI.each(saveData.add, function(item) {
          data.push(item);
        });
        BUI.each(saveData.remove, function(item) {
          BUI.Array.remove(data, item);
        });
      }
    }
  });
  proxy.Ajax = ajaxProxy;
  proxy.Memery = memeryProxy;
  module.exports = proxy;
});
define("bui/data/abstractstore", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 抽象数据缓冲类
   * @ignore
   */
  var BUI = require("bui/common"),
    Proxy = require("bui/data/proxy");
  /**
   * @class BUI.Data.AbstractStore
   * 数据缓冲抽象类,此类不进行实例化
   * @extends BUI.Base
   */
  function AbstractStore(config) {
    AbstractStore.superclass.constructor.call(this, config);
    this._init();
  }
  AbstractStore.ATTRS = {
    /**
     * 创建对象时是否自动加载
     * <pre><code>
     *   var store = new Data.Store({
     *     url : 'data.php',  //设置加载数据的URL
     *     autoLoad : true    //创建Store时自动加载数据
     *   });
     * </code></pre>
     * @cfg {Boolean} [autoLoad=false]
     */
    autoLoad: {
      value: false
    },
    /**
     * 是否服务器端过滤数据，如果设置此属性，当调用filter()函数时发送请求
     * @type {Object}
     */
    remoteFilter: {
      value: false
    },
    /**
     * 上次查询的参数
     * @type {Object}
     * @readOnly
     */
    lastParams: {
      shared: false,
      value: {}
    },
    /**
     * 初始化时查询的参数，在初始化时有效
     * <pre><code>
     * var store = new Data.Store({
     *     url : 'data.php',  //设置加载数据的URL
     *     autoLoad : true,    //创建Store时自动加载数据
     *     params : {         //设置请求时的参数
     *       id : '1',
     *       type : '1'
     *     }
     *   });
     * </code></pre>
     * @cfg {Object} params
     */
    params: {},
    /**
     * 错误字段,包含在返回信息中表示错误信息的字段
     * <pre><code>
     *   //可以修改接收的后台参数的含义
     *   var store = new Store({
     *     url : 'data.json',
     *     errorProperty : 'errorMsg', //存放错误信息的字段(error)
     *     hasErrorProperty : 'isError', //是否错误的字段（hasError)
     *     root : 'data',               //存放数据的字段名(rows)
     *     totalProperty : 'total'     //存放记录总数的字段名(results)
     *   });
     * </code></pre>
     * @cfg {String} [errorProperty='error']
     */
    /**
     * 错误字段
     * @type {String}
     * @ignore
     */
    errorProperty: {
      value: 'error'
    },
    /**
     * 是否存在错误,加载数据时如果返回错误，此字段表示有错误发生
     * <pre><code>
     *   //可以修改接收的后台参数的含义
     *   var store = new Store({
     *     url : 'data.json',
     *     errorProperty : 'errorMsg', //存放错误信息的字段(error)
     *     hasErrorProperty : 'isError', //是否错误的字段（hasError)
     *     root : 'data',               //存放数据的字段名(rows)
     *     totalProperty : 'total'     //存放记录总数的字段名(results)
     *   });
     * </code></pre>
     * @cfg {String} [hasErrorProperty='hasError']
     */
    /**
     * 是否存在错误
     * @type {String}
     * @default 'hasError'
     * @ignore
     */
    hasErrorProperty: {
      value: 'hasError'
    },
    /**
     * 数据代理对象,用于加载数据的ajax配置，{@link BUI.Data.Proxy}
     * <pre><code>
     *   var store = new Data.Store({
     *     url : 'data.php',  //设置加载数据的URL
     *     autoLoad : true,    //创建Store时自动加载数据
     *     proxy : {
     *       method : 'post',
     *       dataType : 'jsonp'
     *     }
     *   });
     * </code></pre>
     * @cfg {Object|BUI.Data.Proxy} proxy
     */
    proxy: {
      shared: false,
      value: {}
    },
    /**
     * 请求数据的地址，通过ajax加载数据，
     * 此参数设置则加载远程数据
     * ** 你可以设置在proxy外部 **
     * <pre><code>
     *   var store = new Data.Store({
     *     url : 'data.php',  //设置加载数据的URL
     *     autoLoad : true,    //创建Store时自动加载数据
     *     proxy : {
     *       method : 'post',
     *       dataType : 'jsonp'
     *     }
     *   });
     * </code></pre>
     * ** 你也可以设置在proxy上 **
     * <pre><code>
     *   var store = new Data.Store({
     *     autoLoad : true,    //创建Store时自动加载数据
     *     proxy : {
     *       url : 'data.php',  //设置加载数据的URL
     *       method : 'post',
     *       dataType : 'jsonp'
     *     }
     *   });
     * </code></pre>
     * 否则把 {BUI.Data.Store#cfg-data}作为本地缓存数据加载
     * @cfg {String} url
     */
    /**
     * 请求数据的url
     * <pre><code>
     *   //更改url
     *   store.get('proxy').set('url',url);
     * </code></pre>
     * @type {String}
     */
    url: {},
    events: {
      value: [
        /**  
         * 数据接受改变，所有增加、删除、修改的数据记录清空
         * @name BUI.Data.Store#acceptchanges
         * @event
         */
        'acceptchanges',
        /**  
         * 当数据加载完成后
         * @name BUI.Data.Store#load
         * @event
         * @param {jQuery.Event} e  事件对象，包含加载数据时的参数
         */
        'load',
        /**  
         * 当数据加载前
         * @name BUI.Data.Store#beforeload
         * @event
         */
        'beforeload',
        /**  
         * 发生在，beforeload和load中间，数据已经获取完成，但是还未触发load事件，用于获取返回的原始数据
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.data 从服务器端返回的数据
         */
        'beforeprocessload',
        /**  
         * 当添加数据时触发该事件
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.record 添加的数据
         */
        'add',
        /**
         * 加载数据发生异常时触发
         * @event
         * @name BUI.Data.Store#exception
         * @param {jQuery.Event} e 事件对象
         * @param {String|Object} e.error 加载数据时返回的错误信息或者加载数据失败，浏览器返回的信息（httpResponse 对象 的textStatus）
         * @param {String} e.responseText 网络或者浏览器加载数据发生错误是返回的httpResponse 对象的responseText
         */
        'exception',
        /**  
         * 当删除数据是触发该事件
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.data 删除的数据
         */
        'remove',
        /**  
         * 当更新数据指定字段时触发该事件
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.record 更新的数据
         * @param {Object} e.field 更新的字段
         * @param {Object} e.value 更新的值
         */
        'update',
        /**  
         * 前端发生排序时触发
         * @name BUI.Data.Store#localsort
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.field 排序的字段
         * @param {Object} e.direction 排序的方向 'ASC'，'DESC'
         */
        'localsort',
        /**  
         * 前端发生过滤时触发
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Array} e.data 过滤完成的数据
         * @param {Function} e.filter 过滤器
         */
        'filtered'
      ]
    },
    /**
     * 本地数据源,使用本地数据源时会使用{@link BUI.Data.Proxy.Memery}
     * @cfg {Array} data
     */
    /**
     * 本地数据源
     * @type {Array}
     */
    data: {
      setter: function(data) {
        var _self = this,
          proxy = _self.get('proxy');
        if (proxy.set) {
          proxy.set('data', data);
        } else {
          proxy.data = data;
        }
        //设置本地数据时，把autoLoad置为true
        _self.set('autoLoad', true);
      }
    }
  };
  BUI.extend(AbstractStore, BUI.Base);
  BUI.augment(AbstractStore, {
    /**
     * 是否是数据缓冲对象，用于判断对象
     * @type {Boolean}
     */
    isStore: true,
    /**
     * @private
     * 初始化
     */
    _init: function() {
      var _self = this;
      _self.beforeInit();
      //初始化结果集
      _self._initParams();
      _self._initProxy();
      _self._initData();
    },
    /**
     * @protected
     * 初始化之前
     */
    beforeInit: function() {},
    //初始化数据,如果默认加载数据，则加载数据
    _initData: function() {
      var _self = this,
        autoLoad = _self.get('autoLoad');
      if (autoLoad) {
        _self.load();
      }
    },
    //初始化查询参数
    _initParams: function() {
      var _self = this,
        lastParams = _self.get('lastParams'),
        params = _self.get('params');
      //初始化 参数
      BUI.mix(lastParams, params);
    },
    /**
     * @protected
     * 初始化数据代理类
     */
    _initProxy: function() {
      var _self = this,
        url = _self.get('url'),
        proxy = _self.get('proxy');
      if (!(proxy instanceof Proxy)) {
        if (url) {
          proxy.url = url;
        }
        //异步请求的代理类
        if (proxy.type === 'ajax' || proxy.url) {
          proxy = new Proxy.Ajax(proxy);
        } else {
          proxy = new Proxy.Memery(proxy);
        }
        _self.set('proxy', proxy);
      }
    },
    /**
     * 加载数据
     * <pre><code>
     *  //一般调用
     *  store.load(params);
     *
     *  //使用回调函数
     *  store.load(params,function(data){
     *
     *  });
     *
     *  //load有记忆参数的功能
     *  store.load({id : '123',type="1"});
     *  //下一次调用
     *  store.load();默认使用上次的参数，可以对对应的参数进行覆盖
     * </code></pre>
     * @param  {Object} params 参数键值对
     * @param {Function} fn 回调函数，默认为空
     */
    load: function(params, callback) {
      var _self = this,
        proxy = _self.get('proxy'),
        lastParams = _self.get('lastParams');
      BUI.mix(lastParams, _self.getAppendParams(), params);
      _self.fire('beforeload', {
        params: lastParams
      });
      //防止异步请求未结束，又发送新请求回调参数错误
      params = BUI.cloneObject(lastParams);
      proxy.read(lastParams, function(data) {
        _self.onLoad(data, params);
        if (callback) {
          callback(data, params);
        }
      }, _self);
    },
    /**
     * 触发过滤
     * @protected
     */
    onFiltered: function(data, filter) {
      var _self = this;
      _self.fire('filtered', {
        data: data,
        filter: filter
      });
    },
    /**
     * 加载完数据
     * @protected
     * @template
     */
    onLoad: function(data, params) {
      var _self = this;
      var processResult = _self.processLoad(data, params);
      //如果处理成功，返回错误时，不进行后面的处理
      if (processResult) {
        _self.afterProcessLoad(data, params);
      }
    },
    /**
     * 获取当前缓存的纪录
     */
    getResult: function() {},
    /**
     * 过滤数据，此函数的执行同属性 remoteFilter关联密切
     *
     *  - remoteFilter == true时：此函数只接受字符串类型的过滤参数，将{filter : filterStr}参数传输到服务器端
     *  - remoteFilter == false时：此函数接受比对函数，只有当函数返回true时生效
     *
     * @param {Function|String} fn 过滤函数
     * @return {Array} 过滤结果
     */
    filter: function(filter) {
      var _self = this,
        remoteFilter = _self.get('remoteFilter'),
        result;
      filter = filter || _self.get('filter');
      if (remoteFilter) {
        _self.load({
          filter: filter
        });
      } else if (filter) {
        _self.set('filter', filter);
        //如果result有值时才会进行filter
        if (_self.getResult().length > 0) {
          result = _self._filterLocal(filter);
          _self.onFiltered(result, filter);
        }
      }
    },
    /**
     * @protected
     * 过滤缓存的数据
     * @param  {Function} fn 过滤函数
     * @return {Array} 过滤结果
     */
    _filterLocal: function(fn) {},
    /**
     * 获取过滤后的数据，仅当本地过滤(remoteFilter = false)时有效
     * @return {Array} 过滤过的数据
     */
    getFilterResult: function() {
      var filter = this.get('filter');
      if (filter) {
        return this._filterLocal(filter);
      } else {
        return this.getResult();
      }
    },
    _clearLocalFilter: function() {
      this.set('filter', null);
    },
    /**
     * 清理过滤
     */
    clearFilter: function() {
      var _self = this,
        remoteFilter = _self.get('remoteFilter'),
        result;
      if (remoteFilter) {
        _self.load({
          filter: ''
        });
      } else {
        _self._clearLocalFilter();
        result = _self.getFilterResult();
        _self.onFiltered(result, null);
      }
    },
    /**
     * @private
     * 加载完数据处理数据
     */
    processLoad: function(data, params) {
      var _self = this,
        hasErrorField = _self.get('hasErrorProperty');
      _self.fire('beforeprocessload', {
        data: data
      });
      //获取的原始数据
      _self.fire('beforeProcessLoad', data);
      if (BUI.getValue(data, hasErrorField) || data.exception) {
        _self.onException(data);
        return false;
      }
      return true;
    },
    /**
     * @protected
     * @template
     * 处理数据后
     */
    afterProcessLoad: function(data, params) {},
    /**
     * @protected
     * 处理错误函数
     * @param  {*} data 出错对象
     */
    onException: function(data) {
      var _self = this,
        errorProperty = _self.get('errorProperty'),
        obj = {};
      //网络异常、转码错误之类，发生在json获取或转变时
      if (data.exception) {
        obj.type = 'exception';
        obj.error = data.exception;
      } else { //用户定义的错误
        obj.type = 'error';
        obj.error = BUI.getValue(data, errorProperty);
      }
      _self.fire('exception', obj);
    },
    /**
     * 是否包含数据
     * @return {Boolean}
     */
    hasData: function() {},
    /**
     * 获取附加的参数
     * @template
     * @protected
     * @return {Object} 附加的参数
     */
    getAppendParams: function() {
      return {};
    }
  });
  module.exports = AbstractStore;
});
define("bui/data/store", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 数据缓冲对象
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    Proxy = require("bui/data/proxy"),
    AbstractStore = require("bui/data/abstractstore"),
    Sortable = require("bui/data/sortable");
  //移除数据
  function removeAt(index, array) {
    if (index < 0) {
      return;
    }
    var records = array,
      record = records[index];
    records.splice(index, 1);
    return record;
  }

  function removeFrom(record, array) {
    var index = BUI.Array.indexOf(record, array);
    if (index >= 0) {
      removeAt(index, array);
    }
  }

  function contains(record, array) {
      return BUI.Array.indexOf(record, array) !== -1;
    }
    /**
     * 用于加载数据，缓冲数据的类
     * <p>
     * <img src="../assets/img/class-data.jpg"/>
     * </p>
     * ** 缓存静态数据 **
     * <pre><code>
     *  var store = new Store({
     *    data : [{},{}]
     *  });
     * </code></pre>
     * ** 异步加载数据 **
     * <pre><code>
     *  var store = new Store({
     *    url : 'data.json',
     *    autoLoad : true,
     *    params : {id : '123'},
     *    sortInfo : {
     *      field : 'id',
     *      direction : 'ASC' //ASC,DESC
     *    }
     *  });
     * </code></pre>
     *
     * @class BUI.Data.Store
     * @extends BUI.Data.AbstractStore
     * @mixins BUI.Data.Sortable
     */
  var store = function(config) {
    store.superclass.constructor.call(this, config);
    //this._init();
  };
  store.ATTRS = {
    /**
     * 保存数据时，是否自动更新数据源的数据，常用于添加、删除、更改数据后重新加载数据。
     * @cfg {Boolean} autoSync
     */
    autoSync: {
      value: false
    },
    /**
     * 当前页码
     * @cfg {Number} [currentPage=0]
     * @ignore
     */
    /**
     * 当前页码
     * @type {Number}
     * @ignore
     * @readOnly
     */
    currentPage: {
      value: 0
    },
    /**
     * 删除掉的纪录
     * @readOnly
     * @private
     * @type {Array}
     */
    deletedRecords: {
      shared: false,
      value: []
    },
    /**
     * 对比2个对象是否相当，在去重、更新、删除，查找数据时使用此函数
     * @default
     * function(obj1,obj2){
     *   return obj1 == obj2;
     * }
     * @type {Object}
     * @example
     * function(obj1 ,obj2){
     *   //如果id相等，就认为2个数据相等，可以在添加对象时去重
     *   //更新对象时，仅提供改变的字段
     *   return obj1.id == obj2.id;
     * }
     *
     */
    matchFunction: {
      value: function(obj1, obj2) {
        return obj1 == obj2;
      }
    },
    /**
     * 更改的纪录集合
     * @type {Array}
     * @private
     * @readOnly
     */
    modifiedRecords: {
      shared: false,
      value: []
    },
    /**
     * 新添加的纪录集合，只读
     * @type {Array}
     * @private
     * @readOnly
     */
    newRecords: {
      shared: false,
      value: []
    },
    /**
     * 是否远程排序，默认状态下内存排序
     *   - 由于当前Store存储的不一定是数据源的全集，所以此配置项需要重新读取数据
     *   - 在分页状态下，进行远程排序，会进行全集数据的排序，并返回首页的数据
     *   - remoteSort为 false的情况下，仅对当前页的数据进行排序
     * @cfg {Boolean} [remoteSort=false]
     */
    remoteSort: {
      value: false
    },
    /**
     * 缓存的数据，包含以下几个字段
     * <ol>
     * <li>rows: 数据集合</li>
     * <li>results: 总的数据条数</li>
     * </ol>
     * @type {Object}
     * @private
     * @readOnly
     */
    resultMap: {
      shared: false,
      value: {}
    },
    /**
     * 加载数据时，返回数据的根目录
     * @cfg {String} [root='rows']
     * <pre><code>
     *    //默认返回数据类型：
     *    '{"rows":[{"name":"abc"},{"name":"bcd"}],"results":100}'
     *   //可以修改接收的后台参数的含义
     *   var store = new Store({
     *     url : 'data.json',
     *     errorProperty : 'errorMsg', //存放错误信息的字段(error)
     *     hasErrorProperty : 'isError', //是否错误的字段（hasError)
     *     root : 'data',               //存放数据的字段名(rows)
     *     totalProperty : 'total'     //存放记录总数的字段名(results)
     *   });
     * </code></pre>
     *
     */
    root: {
      value: 'rows'
    },
    /**
     * 当前Store缓存的数据条数
     * @type {Number}
     * @private
     * @readOnly
     */
    rowCount: {
      value: 0
    },
    /**
     * 加载数据时，返回记录的总数的字段，用于分页
     * @cfg {String} [totalProperty='results']
     *<pre><code>
     *    //默认返回数据类型：
     *    '{"rows":[{"name":"abc"},{"name":"bcd"}],"results":100}'
     *   //可以修改接收的后台参数的含义
     *   var store = new Store({
     *     url : 'data.json',
     *     errorProperty : 'errorMsg', //存放错误信息的字段(error)
     *     hasErrorProperty : 'isError', //是否错误的字段（hasError)
     *     root : 'data',               //存放数据的字段名(rows)
     *     totalProperty : 'total'     //存放记录总数的字段名(results)
     *   });
     * </code></pre>
     */
    totalProperty: {
      value: 'results'
    },
    /**
     * 加载数据的起始位置
     * <pre><code>
     *  //初始化时，可以在params中配置
     *  var store = new Store({
     *    url : 'data.json',
     *    params : {
     *      start : 100
     *    }
     *  });
     * </code></pre>
     * @type {Object}
     */
    start: {
      value: 0
    },
    /**
     * 每页多少条记录,默认为null,此时不分页，当指定了此值时分页
     * <pre><code>
     *  //当请求的数据分页时
     *  var store = new Store({
     *    url : 'data.json',
     *    pageSize : 30
     *  });
     * </code></pre>
     * @cfg {Number} pageSize
     */
    pageSize: {}
  };
  BUI.extend(store, AbstractStore);
  BUI.mixin(store, [Sortable]);
  BUI.augment(store, {
    /**
     * 添加记录,默认添加在后面
     * <pre><code>
     *  //添加记录
     *  store.add({id : '2',text: 'new data'});
     *  //是否去重，重复数据不能添加
     *  store.add(obj,true); //不能添加重复数据，此时用obj1 === obj2判断
     *  //使用匹配函去重
     *  store.add(obj,true,function(obj1,obj2){
     *    return obj1.id == obj2.id;
     *  });
     *
     * </code></pre>
     * @param {Array|Object} data 添加的数据，可以是数组，可以是单条记录
     * @param {Boolean} [noRepeat = false] 是否去重,可以为空，默认： false
     * @param {Function} [match] 匹配函数，可以为空，
     * @default 配置项中 matchFunction 属性传入的函数，默认是：<br>
     *  function(obj1,obj2){
     *    return obj1 == obj2;
     *  }
     *
     */
    add: function(data, noRepeat, match) {
      var _self = this,
        count = _self.getCount();
      _self.addAt(data, count, noRepeat, match)
    },
    /**
     * 添加记录,指定索引值
     * <pre><code>
     *  //使用方式跟类似于add,增加了index参数
     *  store.add(obj,0);//添加在最前面
     * </code></pre>
     * @param {Array|Object} data 添加的数据，可以是数组，可以是单条记录
     * @param {Number} index 开始添加数据的位置
     * @param {Boolean} [noRepeat = false] 是否去重,可以为空，默认： false
     * @param {Function} [match] 匹配函数，可以为空，
     */
    addAt: function(data, index, noRepeat, match) {
      var _self = this;
      match = match || _self._getDefaultMatch();
      if (!BUI.isArray(data)) {
        data = [data];
      }
      $.each(data, function(pos, element) {
        if (!noRepeat || !_self.contains(element, match)) {
          _self._addRecord(element, pos + index);
          _self.get('newRecords').push(element);
          removeFrom(element, _self.get('deletedRecords'));
          removeFrom(element, _self.get('modifiedRecords'));
        }
      });
    },
    /**
     * 验证是否存在指定记录
     * <pre><code>
     *  store.contains(obj); //是否包含指定的记录
     *
     *  store.contains(obj,function(obj1,obj2){ //使用匹配函数
     *    return obj1.id == obj2.id;
     *  });
     * </code></pre>
     * @param {Object} record 指定的记录
     * @param {Function} [match = function(obj1,obj2){return obj1 == obj2}] 默认为比较2个对象是否相同
     * @return {Boolean}
     */
    contains: function(record, match) {
      return this.findIndexBy(record, match) !== -1;
    },
    /**
     * 查找记录，仅返回第一条
     * <pre><code>
     *  var record = store.find('id','123');
     * </code></pre>
     * @param {String} field 字段名
     * @param {String} value 字段值
     * @return {Object|null}
     */
    find: function(field, value) {
      var _self = this,
        result = null,
        records = _self.getResult();
      $.each(records, function(index, record) {
        if (record[field] === value) {
          result = record;
          return false;
        }
      });
      return result;
    },
    /**
     * 查找记录，返回所有符合查询条件的记录
     * <pre><code>
     *   var records = store.findAll('type','0');
     * </code></pre>
     * @param {String} field 字段名
     * @param {String} value 字段值
     * @return {Array}
     */
    findAll: function(field, value) {
      var _self = this,
        result = [],
        records = _self.getResult();
      $.each(records, function(index, record) {
        if (record[field] === value) {
          result.push(record);
        }
      });
      return result;
    },
    /**
     * 根据索引查找记录
     * <pre><code>
     *  var record = store.findByIndex(1);
     * </code></pre>
     * @param {Number} index 索引
     * @return {Object} 查找的记录
     */
    findByIndex: function(index) {
      return this.getResult()[index];
    },
    /**
     * 查找数据所在的索引位置,若不存在返回-1
     * <pre><code>
     *  var index = store.findIndexBy(obj);
     *
     *  var index = store.findIndexBy(obj,function(obj1,obj2){
     *    return obj1.id == obj2.id;
     *  });
     * </code></pre>
     * @param {Object} target 指定的记录
     * @param {Function} [match = matchFunction] @see {BUI.Data.Store#matchFunction}默认为比较2个对象是否相同
     * @return {Number}
     */
    findIndexBy: function(target, match) {
      var _self = this,
        position = -1,
        records = _self.getResult();
      match = match || _self._getDefaultMatch();
      if (target === null || target === undefined) {
        return -1;
      }
      $.each(records, function(index, record) {
        if (match(target, record)) {
          position = index;
          return false;
        }
      });
      return position;
    },
    /**
     * 获取下一条记录
     * <pre><code>
     *  var record = store.findNextRecord(obj);
     * </code></pre>
     * @param {Object} record 当前记录
     * @return {Object} 下一条记录
     */
    findNextRecord: function(record) {
      var _self = this,
        index = _self.findIndexBy(record);
      if (index >= 0) {
        return _self.findByIndex(index + 1);
      }
      return;
    },
    /**
     * 获取缓存的记录数
     * <pre><code>
     *  var count = store.getCount(); //缓存的数据数量
     *
     *  var totalCount = store.getTotalCount(); //数据的总数，如果有分页时，totalCount != count
     * </code></pre>
     * @return {Number} 记录数
     */
    getCount: function() {
      return this.getResult().length;
    },
    /**
     * 获取数据源的数据总数，分页时，当前仅缓存当前页数据
     * <pre><code>
     *  var count = store.getCount(); //缓存的数据数量
     *
     *  var totalCount = store.getTotalCount(); //数据的总数，如果有分页时，totalCount != count
     * </code></pre>
     * @return {Number} 记录的总数
     */
    getTotalCount: function() {
      var _self = this,
        resultMap = _self.get('resultMap'),
        total = _self.get('totalProperty'),
        totalVal = BUI.getValue(resultMap, total);
      return parseInt(totalVal, 10) || 0;
    },
    /**
     * 获取当前缓存的纪录
     * <pre><code>
     *   var records = store.getResult();
     * </code></pre>
     * @return {Array} 纪录集合
     */
    getResult: function() {
      var _self = this,
        resultMap = _self.get('resultMap'),
        root = _self.get('root');
      return BUI.getValue(resultMap, root);
    },
    /**
     * 是否包含数据
     * @return {Boolean}
     */
    hasData: function() {
      return this.getCount() !== 0;
    },
    /**
     * 设置数据源,非异步加载时，设置缓存的数据
     * <pre><code>
     *   store.setResult([]); //清空数据
     *
     *   var data = [{},{}];
     *   store.setResult(data); //重设数据
     * </code></pre>
     */
    setResult: function(data) {
      var _self = this,
        proxy = _self.get('proxy');
      if (proxy instanceof Proxy.Memery) {
        _self.set('data', data);
        _self.load({
          start: 0
        });
      } else {
        _self._setResult(data);
        //如果有filter则进行过滤
        if (_self.get('filter')) {
          _self.filter();
        }
      }
    },
    /**
     * 删除一条或多条记录触发 remove 事件.
     * <pre><code>
     *  store.remove(obj);  //删除一条记录
     *
     *  store.remove([obj1,obj2...]); //删除多个条记录
     *
     *  store.remvoe(obj,funciton(obj1,obj2){ //使用匹配函数
     *    return obj1.id == obj2.id;
     *  });
     * </code></pre>
     * @param {Array|Object} data 添加的数据，可以是数组，可以是单条记录
     * @param {Function} [match = function(obj1,obj2){return obj1 == obj2}] 匹配函数，可以为空
     */
    remove: function(data, match) {
      var _self = this,
        delData = [];
      match = match || _self._getDefaultMatch();
      if (!BUI.isArray(data)) {
        data = [data];
      }
      $.each(data, function(index, element) {
        var index = _self.findIndexBy(element, match),
          record = removeAt(index, _self.getResult());
        //添加到已删除队列中,如果是新添加的数据，不计入删除的数据集合中
        if (!contains(record, _self.get('newRecords')) && !contains(record, _self.get('deletedRecords'))) {
          _self.get('deletedRecords').push(record);
        }
        removeFrom(record, _self.get('newRecords'));
        removeFrom(record, _self.get('modifiedRecords'));
        _self.fire('remove', {
          record: record
        });
      });
    },
    /**
     * 保存数据，有几种类型：
     *
     *  - add 保存添加的记录,
     *  - remove 保存删除,
     *  - update 保存更新,
     *  - all 保存store从上次加载到目前更改的记录
     *
     *
     * @param {String} type 保存的类型
     * @param {Object} saveData 数据
     * @param {Function} callback
     */
    save: function(type, saveData, callback) {
      var _self = this,
        proxy = _self.get('proxy');
      if (BUI.isFunction(type)) { //只有回调函数
        callback = type;
        type = undefined;
      }
      if (BUI.isObject(type)) { //未指定类型
        callback = saveData;
        saveData = type;
        type = undefined;
      }
      if (!type) {
        type = _self._getSaveType(saveData);
      }
      if (type == 'all' && !saveData) { //如果保存全部，同时未提供保存的数据，自动获取
        saveData = _self._getDirtyData();
      }
      _self.fire('beforesave', {
        type: type,
        saveData: saveData
      });
      proxy.save(type, saveData, function(data) {
        _self.onSave(type, saveData, data);
        if (callback) {
          callback(data, saveData);
        }
      }, _self);
    },
    //根据保存的数据获取保存的类型
    _getSaveType: function(saveData) {
      var _self = this;
      if (!saveData) {
        return 'all';
      }
      if (BUI.Array.contains(saveData, _self.get('newRecords'))) {
        return 'add';
      }
      if (BUI.Array.contains(saveData, _self.get('modifiedRecords'))) {
        return 'update';
      }
      if (BUI.Array.contains(saveData, _self.get('deletedRecords'))) {
        return 'remove';
      }
      return 'custom';
    },
    //获取未保存的数据
    _getDirtyData: function() {
      var _self = this,
        proxy = _self.get('proxy');
      if (proxy.get('url')) {
        return {
          add: BUI.JSON.stringify(_self.get('newRecords')),
          update: BUI.JSON.stringify(_self.get('modifiedRecords')),
          remove: BUI.JSON.stringify(_self.get('deletedRecords'))
        };
      } else {
        return {
          add: _self.get('newRecords'),
          update: _self.get('modifiedRecords'),
          remove: _self.get('deletedRecords')
        };
      }
    },
    /**
     * 保存完成后
     * @private
     */
    onSave: function(type, saveData, data) {
      var _self = this,
        hasErrorField = _self.get('hasErrorProperty');
      if (BUI.getValue(data, hasErrorField) || data.exception) { //如果失败
        _self.onException(data);
        return;
      }
      _self._clearDirty(type, saveData);
      _self.fire('saved', {
        type: type,
        saveData: saveData,
        data: data
      });
      if (_self.get('autoSync')) {
        _self.load();
      }
    },
    //清除脏数据
    _clearDirty: function(type, saveData) {
      var _self = this;
      switch (type) {
        case 'all':
          _self._clearChanges();
          break;
        case 'add':
          removeFrom(saveData, 'newRecords');
          break;
        case 'update':
          removeFrom(saveData, 'modifiedRecords');
          break;
        case 'remove':
          removeFrom(saveData, 'deletedRecords');
          break;
        default:
          break;
      }

      function removeFrom(obj, name) {
        BUI.Array.remove(_self.get(name), obj);
      }
    },
    /**
     * 排序，如果remoteSort = true,发送请求，后端排序
     * <pre><code>
     *   store.sort('id','DESC'); //以id为排序字段，倒序排序
     * </code></pre>
     * @param  {String} field     排序字段
     * @param  {String} direction 排序方向
     */
    sort: function(field, direction) {
      var _self = this,
        remoteSort = _self.get('remoteSort');
      if (!remoteSort) {
        _self._localSort(field, direction);
      } else {
        _self.set('sortField', field);
        _self.set('sortDirection', direction);
        _self.load(_self.get('sortInfo'));
      }
    },
    /**
     * 计算指定字段的和
     * <pre><code>
     *   var sum = store.sum('number');
     * </code></pre>
     * @param  {String} field 字段名
     * @param  {Array} [data] 计算的集合，默认为Store中的数据集合
     * @return {Number} 汇总和
     */
    sum: function(field, data) {
      var _self = this,
        records = data || _self.getResult(),
        sum = 0;
      BUI.each(records, function(record) {
        var val = record[field];
        if (!isNaN(val)) {
          sum += parseFloat(val);
        }
      });
      return sum;
    },
    /**
     * 设置记录的值 ，触发 update 事件
     * <pre><code>
     *  store.setValue(obj,'value','new value');
     * </code></pre>
     * @param {Object} obj 修改的记录
     * @param {String} field 修改的字段名
     * @param {Object} value 修改的值
     */
    setValue: function(obj, field, value) {
      var record = obj,
        _self = this;
      record[field] = value;
      if (!contains(record, _self.get('newRecords')) && !contains(record, _self.get('modifiedRecords'))) {
        _self.get('modifiedRecords').push(record);
      }
      _self.fire('update', {
        record: record,
        field: field,
        value: value
      });
    },
    /**
     * 更新记录 ，触发 update事件
     * <pre><code>
     *   var record = store.find('id','12');
     *   record.value = 'new value';
     *   record.text = 'new text';
     *   store.update(record); //触发update事件，引起绑定了store的控件更新
     * </code></pre>
     * @param {Object} obj 修改的记录
     * @param {Boolean} [isMatch = false] 是否需要进行匹配，检测指定的记录是否在集合中
     * @param {Function} [match = matchFunction] 匹配函数
     */
    update: function(obj, isMatch, match) {
      var record = obj,
        _self = this,
        match = null,
        index = null;
      if (isMatch) {
        match = match || _self._getDefaultMatch();
        index = _self.findIndexBy(obj, match);
        if (index >= 0) {
          record = _self.getResult()[index];
        }
      }
      record = BUI.mix(record, obj);
      if (!contains(record, _self.get('newRecords')) && !contains(record, _self.get('modifiedRecords'))) {
        _self.get('modifiedRecords').push(record);
      }
      _self.fire('update', {
        record: record
      });
    },
    //添加纪录
    _addRecord: function(record, index) {
      var records = this.getResult();
      if (index == undefined) {
        index = records.length;
      }
      records.splice(index, 0, record);
      this.fire('add', {
        record: record,
        index: index
      });
    },
    //清除改变的数据记录
    _clearChanges: function() {
      var _self = this;
      BUI.Array.empty(_self.get('newRecords'));
      BUI.Array.empty(_self.get('modifiedRecords'));
      BUI.Array.empty(_self.get('deletedRecords'));
    },
    /**
     * @protected
     * 过滤缓存的数据
     * @param  {Function} fn 过滤函数
     * @return {Array} 过滤结果
     */
    _filterLocal: function(fn, data) {
      var _self = this,
        rst = [];
      data = data || _self.getResult();
      if (!fn) { //没有过滤器时直接返回
        return data;
      }
      BUI.each(data, function(record) {
        if (fn(record)) {
          rst.push(record);
        }
      });
      return rst;
    },
    //获取默认的匹配函数
    _getDefaultMatch: function() {
      return this.get('matchFunction');
    },
    //获取分页相关的信息
    _getPageParams: function() {
      var _self = this,
        sortInfo = _self.get('sortInfo'),
        start = _self.get('start'),
        limit = _self.get('pageSize'),
        pageIndex = _self.get('pageIndex') || (limit ? start / limit : 0);
      params = {
        start: start,
        limit: limit,
        pageIndex: pageIndex //一般而言，pageIndex = start/limit
      };
      if (_self.get('remoteSort')) {
        BUI.mix(params, sortInfo);
      }
      return params;
    },
    /**
     * 获取附加的参数,分页信息，排序信息
     * @override
     * @protected
     * @return {Object} 附加的参数
     */
    getAppendParams: function() {
      return this._getPageParams();
    },
    /**
     * @protected
     * 初始化之前
     */
    beforeInit: function() {
      //初始化结果集
      this._setResult([]);
    },
    //本地排序
    _localSort: function(field, direction) {
      var _self = this;
      _self._sortData(field, direction);
      _self.fire('localsort', {
        field: field,
        direction: direction
      });
    },
    _sortData: function(field, direction, data) {
      var _self = this;
      data = data || _self.getResult();
      _self.sortData(field, direction, data);
    },
    //处理数据
    afterProcessLoad: function(data, params) {
      var _self = this,
        root = _self.get('root'),
        start = params.start,
        limit = params.limit,
        totalProperty = _self.get('totalProperty');
      if (BUI.isArray(data)) {
        _self._setResult(data);
      } else {
        _self._setResult(BUI.getValue(data, root), BUI.getValue(data, totalProperty));
      }
      _self.set('start', start);
      if (limit) {
        _self.set('pageIndex', start / limit);
      }
      //如果本地排序,则排序
      if (!_self.get('remoteSort')) {
        _self._sortData();
      }
      _self.fire('load', {
        params: params
      });
      //如果有本地过滤，则本地过滤
      if (!_self.get('remoteFilter') && _self.get('filter')) {
        _self.filter(_self.get('filter'));
      }
    },
    //设置结果集
    _setResult: function(rows, totalCount) {
      var _self = this,
        resultMap = _self.get('resultMap');
      totalCount = totalCount || rows.length;
      BUI.setValue(resultMap, _self.get('root'), rows);
      BUI.setValue(resultMap, _self.get('totalProperty'), totalCount);
      //清理之前发生的改变
      _self._clearChanges();
    }
  });
  module.exports = store;
});
define("bui/data/node", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 树形数据结构的节点类，无法直接使用数据作为节点，所以进行一层封装
   * 可以直接作为TreeNode控件的配置项
   * @ignore
   */
  var BUI = require("bui/common");

  function mapNode(cfg, map) {
      var rst = {};
      if (map) {
        BUI.each(cfg, function(v, k) {
          var name = map[k] || k;
          rst[name] = v;
        });
        rst.record = cfg;
      } else {
        rst = cfg;
      }
      return rst;
    }
    /**
     * @class BUI.Data.Node
     * 树形数据结构的节点类
     */
  function Node(cfg, map) {
    var _self = this;
    cfg = mapNode(cfg, map);
    BUI.mix(this, cfg);
  }
  BUI.augment(Node, {
    /**
     * 是否根节点
     * @type {Boolean}
     */
    root: false,
    /**
     * 是否叶子节点
     * @type {Boolean}
     */
    leaf: null,
    /**
     * 显示节点时显示的文本
     * @type {Object}
     */
    text: '',
    /**
     * 代表节点的编号
     * @type {String}
     */
    id: null,
    /**
     * 子节点是否已经加载过
     * @type {Boolean}
     */
    loaded: false,
    /**
     * 从根节点到此节点的路径，id的集合如： ['0','1','12'],
     * 便于快速定位节点
     * @type {Array}
     */
    path: null,
    /**
     * 父节点
     * @type {BUI.Data.Node}
     */
    parent: null,
    /**
     * 树节点的等级
     * @type {Number}
     */
    level: 0,
    /**
     * 节点是否由一条记录封装而成
     * @type {Object}
     */
    record: null,
    /**
     * 子节点集合
     * @type {BUI.Data.Node[]}
     */
    children: null,
    /**
     * 是否是Node对象
     * @type {Object}
     */
    isNode: true
  });
  module.exports = Node;
});
define("bui/data/treestore", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 树形对象缓冲类
   * @ignore
   */
  var BUI = require("bui/common"),
    Node = require("bui/data/node"),
    Proxy = require("bui/data/proxy"),
    AbstractStore = require("bui/data/abstractstore");
  /**
   * @class BUI.Data.TreeStore
   * 树形数据缓冲类
   * <p>
   * <img src="../assets/img/class-data.jpg"/>
   * </p>
   * <pre><code>
   *   //加载静态数据
   *   var store = new TreeStore({
   *     root : {
   *       text : '根节点',
   *       id : 'root'
   *     },
   *     data : [{id : '1',text : 1},{id : '2',text : 2}] //会加载成root的children
   *   });
   *   //异步加载数据，自动加载数据时，会调用store.load({id : 'root'}); //root为根节点的id
   *   var store = new TreeStore({
   *     root : {
   *       text : '根节点',
   *       id : 'root'
   *     },
   *     url : 'data/nodes.php',
   *     autoLoad : true  //设置自动加载，初始化后自动加载数据
   *   });
   *
   *   //加载指定节点
   *   var node = store.findNode('1');
   *   store.loadNode(node);
   *   //或者
   *   store.load({id : '1'});//可以配置自定义参数，返回值附加到指定id的节点上
   * </code></pre>
   * @extends BUI.Data.AbstractStore
   */
  function TreeStore(config) {
    TreeStore.superclass.constructor.call(this, config);
  }
  TreeStore.ATTRS = {
    /**
     * 根节点
     * <pre><code>
     *  var store = new TreeStore({
     *    root : {text : '根节点',id : 'rootId',children : [{id : '1',text : '1'}]}
     *  });
     * </code></pre>
     * @cfg {Object} root
     */
    /**
     * 根节点,初始化后不要更改对象，可以更改属性值
     * <pre><code>
     *  var root = store.get('root');
     *  root.text = '修改的文本'；
     *  store.update(root);
     * </code></pre>
     * @type {Object}
     * @readOnly
     */
    root: {},
    /**
     * 数据映射，用于设置的数据跟@see {BUI.Data.Node} 不一致时，进行匹配。
     * 如果此属性为null,那么假设设置的对象是Node对象
     * <pre><code>
     *   //例如原始数据为 {name : '123',value : '文本123',isLeaf: false,nodes : []}
     *   var store = new TreeStore({
     *     map : {
     *       'name' : 'id',
     *       'value' : 'text',
     *       'isLeaf' : 'leaf' ,
     *       'nodes' : 'children'
     *     }
     *   });
     *   //映射后，记录会变成  {id : '123',text : '文本123',leaf: false,children : []};
     *   //此时原始记录会作为对象的 record属性
     *   var node = store.findNode('123'),
     *     record = node.record;
     * </code></pre>
     * **Notes:**
     * 使用数据映射的记录仅做于展示数据，不作为可更改的数据，add,update不会更改数据的原始数据
     * @cfg {Object} map
     */
    map: {},
    /**
     * 标示父元素id的字段名称
     * @type {String}
     */
    pidField: {},
    /**
     * 返回数据标示数据的字段<br/>
     * 异步加载数据时，返回数据可以使数组或者对象
     * - 如果返回的是对象,可以附加其他信息,那么取对象对应的字段 {nodes : [],hasError:false}
     * - 如何获取附加信息参看 @see {BUI.Data.AbstractStore-event-beforeprocessload}
     * <pre><code>
     *  //返回数据为数组 [{},{}]，会直接附加到加载的节点后面
     *
     *  var node = store.loadNode('123');
     *  store.loadNode(node);
     *
     * </code></pre>
     * @cfg {Object} [dataProperty = 'nodes']
     */
    dataProperty: {
      value: 'nodes'
    },
    events: {
      value: [
        /**  
         * 当添加数据时触发该事件
         * @event
         * <pre><code>
         *  store.on('add',function(ev){
         *    list.addItem(e.node,index);
         *  });
         * </code></pre>
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.node 添加的节点
         * @param {Number} index 添加的位置
         */
        'add',
        /**  
         * 当更新数据指定字段时触发该事件
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.node 更新的节点
         */
        'update',
        /**  
         * 当删除数据时触发该事件
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.node 删除的节点
         * @param {Number} index 删除节点的索引
         */
        'remove',
        /**  
         * 节点加载完毕触发该事件
         * <pre><code>
         *   //异步加载节点,此时节点已经附加到加载节点的后面
         *   store.on('load',function(ev){
         *     var params = ev.params,
         *       id = params.id,
         *       node = store.findNode(id),
         *       children = node.children;  //节点的id
         *     //TO DO
         *   });
         * </code></pre>
         *
         * @event
         * @param {jQuery.Event} e  事件对象
         * @param {Object} e.node 加载的节点
         * @param {Object} e.params 加载节点时的参数
         */
        'load'
      ]
    }
  }
  BUI.extend(TreeStore, AbstractStore);
  BUI.augment(TreeStore, {
    /**
     * @protected
     * @override
     * 初始化前
     */
    beforeInit: function() {
      this.initRoot();
    },
    //初始化数据,如果默认加载数据，则加载数据
    _initData: function() {
      var _self = this,
        autoLoad = _self.get('autoLoad'),
        pidField = _self.get('pidField'),
        proxy = _self.get('proxy'),
        root = _self.get('root');
      //添加默认的匹配父元素的字段
      if (!proxy.get('url') && pidField) {
        proxy.get('matchFields').push(pidField);
      }
      if (autoLoad && !root.children) {
        //params = root.id ? {id : root.id}: {};
        _self.loadNode(root);
      }
    },
    /**
     * @protected
     * 初始化根节点
     */
    initRoot: function() {
      var _self = this,
        map = _self.get('map'),
        root = _self.get('root');
      if (!root) {
        root = {};
      }
      if (!root.isNode) {
        root = new Node(root, map);
        //root.children= [];
      }
      root.path = [root.id];
      root.level = 0;
      if (root.children) {
        _self.setChildren(root, root.children);
      }
      _self.set('root', root);
    },
    /**
     * 添加节点，触发{@link BUI.Data.TreeStore#event-add} 事件
     * <pre><code>
     *  //添加到根节点下
     *  store.add({id : '1',text : '1'});
     *  //添加到指定节点
     *  var node = store.findNode('1'),
     *    subNode = store.add({id : '11',text : '11'},node);
     *  //插入到节点的指定位置
     *  var node = store.findNode('1'),
     *    subNode = store.add({id : '12',text : '12'},node,0);
     * </code></pre>
     * @param {BUI.Data.Node|Object} node 节点或者数据对象
     * @param {BUI.Data.Node} [parent] 父节点,如果未指定则为根节点
     * @param {Number} [index] 添加节点的位置
     * @return {BUI.Data.Node} 添加完成的节点
     */
    add: function(node, parent, index) {
      var _self = this;
      node = _self._add(node, parent, index);
      _self.fire('add', {
        node: node,
        record: node,
        index: index
      });
      return node;
    },
    //
    _add: function(node, parent, index) {
      parent = parent || this.get('root'); //如果未指定父元素，添加到跟节点
      var _self = this,
        map = _self.get('map'),
        nodes = parent.children,
        nodeChildren;
      if (!node.isNode) {
        node = new Node(node, map);
      }
      nodeChildren = node.children || []
      if (nodeChildren.length == 0 && node.leaf == null) {
        node.leaf = true;
      }
      if (parent) {
        parent.leaf = false;
      }
      node.parent = parent;
      node.level = parent.level + 1;
      node.path = parent.path.concat(node.id);
      index = index == null ? parent.children.length : index;
      BUI.Array.addAt(nodes, node, index);
      _self.setChildren(node, nodeChildren);
      return node;
    },
    /**
     * 移除节点，触发{@link BUI.Data.TreeStore#event-remove} 事件
     *
     * <pre><code>
     *  var node = store.findNode('1'); //根据节点id 获取节点
     *  store.remove(node);
     * </code></pre>
     *
     * @param {BUI.Data.Node} node 节点或者数据对象
     * @return {BUI.Data.Node} 删除的节点
     */
    remove: function(node) {
      var parent = node.parent || _self.get('root'),
        index = BUI.Array.indexOf(node, parent.children);
      BUI.Array.remove(parent.children, node);
      if (parent.children.length === 0) {
        parent.leaf = true;
      }
      this.fire('remove', {
        node: node,
        record: node,
        index: index
      });
      node.parent = null;
      return node;
    },
    /**
     * 设置记录的值 ，触发 update 事件
     * <pre><code>
     *  store.setValue(obj,'value','new value');
     * </code></pre>
     * @param {Object} obj 修改的记录
     * @param {String} field 修改的字段名
     * @param {Object} value 修改的值
     */
    setValue: function(node, field, value) {
      var _self = this;
      node[field] = value;
      _self.fire('update', {
        node: node,
        record: node,
        field: field,
        value: value
      });
    },
    /**
     * 更新节点
     * <pre><code>
     *  var node = store.findNode('1'); //根据节点id 获取节点
     *  node.text = 'modify text'; //修改文本
     *  store.update(node);        //此时会触发update事件，绑定了store的控件会更新对应的DOM
     * </code></pre>
     * @return {BUI.Data.Node} 更新节点
     */
    update: function(node) {
      this.fire('update', {
        node: node,
        record: node
      });
    },
    /**
     * 返回缓存的数据，根节点的直接子节点集合
     * <pre><code>
     *   //获取根节点的所有子节点
     *   var data = store.getResult();
     *   //获取根节点
     *   var root = store.get('root');
     * </code></pre>
     * @return {Array} 根节点下面的数据
     */
    getResult: function() {
      return this.get('root').children;
    },
    /**
     * 设置缓存的数据，设置为根节点的数据
     *   <pre><code>
     *     var data = [
     *       {id : '1',text : '文本1'},
     *       {id : '2',text : '文本2',children:[
     *         {id : '21',text : '文本21'}
     *       ]},
     *       {id : '3',text : '文本3'}
     *     ];
     *     store.setResult(data); //会对数据进行格式化，添加leaf等字段：
     *                            //[{id : '1',text : '文本1',leaf : true},{id : '2',text : '文本2',leaf : false,children:[...]}....]
     *   </code></pre>
     * @param {Array} data 缓存的数据
     */
    setResult: function(data) {
      var _self = this,
        proxy = _self.get('proxy'),
        root = _self.get('root');
      if (proxy instanceof Proxy.Memery) {
        _self.set('data', data);
        _self.load({
          id: root.id
        });
      } else {
        _self.setChildren(root, data);
      }
    },
    /**
     * 设置子节点
     * @protected
     * @param {BUI.Data.Node} node  节点
     * @param {Array} children 子节点
     */
    setChildren: function(node, children) {
      var _self = this;
      node.children = [];
      if (!children.length) {
        return;
      }
      BUI.each(children, function(item) {
        _self._add(item, node);
      });
    },
    /**
     * 查找节点
     * <pre><code>
     *  var node = store.findNode('1');//从根节点开始查找节点
     *
     *  var subNode = store.findNode('123',node); //从指定节点开始查找
     * </code></pre>
     * @param  {String} id 节点Id
     * @param  {BUI.Data.Node} [parent] 父节点
     * @param {Boolean} [deep = true] 是否递归查找
     * @return {BUI.Data.Node} 节点
     */
    findNode: function(id, parent, deep) {
      return this.findNodeBy(function(node) {
        return node.id === id;
      }, parent, deep);
    },
    /**
     * 根据匹配函数查找节点
     * @param  {Function} fn  匹配函数
     * @param  {BUI.Data.Node} [parent] 父节点
     * @param {Boolean} [deep = true] 是否递归查找
     * @return {BUI.Data.Node} 节点
     */
    findNodeBy: function(fn, parent, deep) {
      var _self = this;
      deep = deep == null ? true : deep;
      if (!parent) {
        var root = _self.get('root');
        if (fn(root)) {
          return root;
        }
        return _self.findNodeBy(fn, root);
      }
      var children = parent.children,
        rst = null;
      BUI.each(children, function(item) {
        if (fn(item)) {
          rst = item;
        } else if (deep) {
          rst = _self.findNodeBy(fn, item);
        }
        if (rst) {
          return false;
        }
      });
      return rst;
    },
    /**
     * 查找节点,根据匹配函数查找
     * <pre><code>
     *  var nodes = store.findNodesBy(function(node){
     *   if(node.status == '0'){
     *     return true;
     *   }
     *   return false;
     *  });
     * </code></pre>
     * @param  {Function} func 匹配函数
     * @param  {BUI.Data.Node} [parent] 父元素，如果不存在，则从根节点查找
     * @return {Array} 节点数组
     */
    findNodesBy: function(func, parent) {
      var _self = this,
        root,
        rst = [];
      if (!parent) {
        parent = _self.get('root');
      }
      BUI.each(parent.children, function(item) {
        if (func(item)) {
          rst.push(item);
        }
        rst = rst.concat(_self.findNodesBy(func, item));
      });
      return rst;
    },
    /**
     * 根据path查找节点
     * @return {BUI.Data.Node} 节点
     * @ignore
     */
    findNodeByPath: function(path) {
      if (!path) {
        return null;
      }
      var _self = this,
        root = _self.get('root'),
        pathArr = path.split(','),
        node,
        i,
        tempId = pathArr[0];
      if (!tempId) {
        return null;
      }
      if (root.id == tempId) {
        node = root;
      } else {
        node = _self.findNode(tempId, root, false);
      }
      if (!node) {
        return;
      }
      for (i = 1; i < pathArr.length; i = i + 1) {
        var tempId = pathArr[i];
        node = _self.findNode(tempId, node, false);
        if (!node) {
          break;
        }
      }
      return node;
    },
    /**
     * 是否包含指定节点，如果未指定父节点，从根节点开始搜索
     * <pre><code>
     *  store.contains(node); //是否存在节点
     *
     *  store.contains(subNode,node); //节点是否存在指定子节点
     * </code></pre>
     * @param  {BUI.Data.Node} node 节点
     * @param  {BUI.Data.Node} parent 父节点
     * @return {Boolean} 是否包含指定节点
     */
    contains: function(node, parent) {
      var _self = this,
        findNode = _self.findNode(node.id, parent);
      return !!findNode;
    },
    /**
     * 加载完数据
     * @protected
     * @override
     */
    afterProcessLoad: function(data, params) {
      var _self = this,
        pidField = _self.get('pidField'),
        id = params.id || params[pidField],
        dataProperty = _self.get('dataProperty'),
        node = _self.findNode(id) || _self.get('root'); //如果找不到父元素，则放置在跟节点
      if (BUI.isArray(data)) {
        _self.setChildren(node, data);
      } else {
        _self.setChildren(node, BUI.getValue(data, dataProperty));
      }
      node.loaded = true; //标识已经加载过
      _self.fire('load', {
        node: node,
        params: params
      });
    },
    /**
     * 是否包含数据
     * @return {Boolean}
     */
    hasData: function() {
      //return true;
      return this.get('root').children && this.get('root').children.length !== 0;
    },
    /**
     * 是否已经加载过，叶子节点或者存在字节点的节点
     * @param   {BUI.Data.Node} node 节点
     * @return {Boolean}  是否加载过
     */
    isLoaded: function(node) {
      var root = this.get('root');
      if (node == root && !root.children) {
        return false;
      }
      if (!this.get('url') && !this.get('pidField')) { //如果不从远程加载数据,默认已经加载
        return true;
      }
      return node.loaded || node.leaf || !!(node.children && node.children.length);
    },
    /**
     * 加载节点的子节点
     * @param  {BUI.Data.Node} node 节点
     * @param {Boolean} forceLoad 是否强迫重新加载节点，如果设置成true，不判断是否加载过
     */
    loadNode: function(node, forceLoad) {
      var _self = this,
        pidField = _self.get('pidField'),
        params;
      //如果已经加载过，或者节点是叶子节点
      if (!forceLoad && _self.isLoaded(node)) {
        return;
      }
      params = {
        id: node.id
      };
      if (pidField) {
        params[pidField] = node.id;
      }
      _self.load(params);
    },
    /**
     * 重新加载节点
     * @param  {BUI.Data.Node} node node节点
     */
    reloadNode: function(node) {
      var _self = this;
      node = node || _self.get('root');
      node.loaded = false;
      //node.children = [];
      _self.loadNode(node, true);
    },
    /**
     * 加载节点，根据path
     * @param  {String} path 加载路径
     * @ignore
     */
    loadPath: function(path) {
      var _self = this,
        arr = path.split(','),
        id = arr[0];
      if (_self.findNodeByPath(path)) { //加载过
        return;
      }
      _self.load({
        id: id,
        path: path
      });
    }
  });
  module.exports = TreeStore;
});
define("bui/list", ["bui/common", "jquery", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 列表模块入口文件
   * @ignore
   */
  var BUI = require("bui/common"),
    List = BUI.namespace('List');
  BUI.mix(List, {
    List: require("bui/list/list"),
    ListItem: require("bui/list/listitem"),
    SimpleList: require("bui/list/simplelist"),
    Listbox: require("bui/list/listbox")
  });
  BUI.mix(List, {
    ListItemView: List.ListItem.View,
    SimpleListView: List.SimpleList.View
  });
  module.exports = List;
});
define("bui/list/list", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 列表
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    UIBase = Component.UIBase;
  /**
   * 列表
   * <p>
   * <img src="../assets/img/class-list.jpg"/>
   * </p>
   * xclass:'list'
   * @class BUI.List.List
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ChildList
   */
  var list = Component.Controller.extend([UIBase.ChildList], {}, {
    ATTRS: {
      elTagName: {
        view: true,
        value: 'ul'
      },
      idField: {
        value: 'id'
      },
      /**
       * 子类的默认类名，即类的 xclass
       * @type {String}
       * @override
       * @default 'list-item'
       */
      defaultChildClass: {
        value: 'list-item'
      }
    }
  }, {
    xclass: 'list'
  });
  module.exports = list;
});
define("bui/list/listitem", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 列表项
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    UIBase = Component.UIBase;
  /**
   * @private
   * @class BUI.List.ItemView
   * @extends BUI.Component.View
   * @mixins BUI.Component.UIBase.ListItemView
   * 列表项的视图层对象
   */
  var itemView = Component.View.extend([UIBase.ListItemView], {});
  /**
   * 列表项
   * @private
   * @class BUI.List.ListItem
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ListItem
   */
  var item = Component.Controller.extend([UIBase.ListItem], {}, {
    ATTRS: {
      elTagName: {
        view: true,
        value: 'li'
      },
      xview: {
        value: itemView
      },
      tpl: {
        view: true,
        value: '<span>{text}</span>'
      }
    }
  }, {
    xclass: 'list-item'
  });
  item.View = itemView;
  module.exports = item;
});
define("bui/list/simplelist", ["jquery", "bui/common", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 简单列表，直接使用DOM作为列表项
   * @ignore
   */
  /**
   * @name BUI.List
   * @namespace 列表命名空间
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    UIBase = BUI.Component.UIBase,
    UA = BUI.UA,
    DomList = require("bui/list/domlist"),
    KeyNav = require("bui/list/keynav"),
    Sortable = require("bui/list/sortable"),
    CLS_ITEM = BUI.prefix + 'list-item';
  /**
   * @class BUI.List.SimpleListView
   * 简单列表视图类
   * @extends BUI.Component.View
   */
  var simpleListView = BUI.Component.View.extend([DomList.View], {
    setElementHover: function(element, hover) {
      var _self = this;
      _self.setItemStatusCls('hover', element, hover);
    }
  }, {
    ATTRS: {
      itemContainer: {
        valueFn: function() {
          return this.get('el').find(this.get('listSelector'));
        }
      }
    }
  }, {
    xclass: 'simple-list-view'
  });
  /**
   * 简单列表，用于显示简单数据
   * <p>
   * <img src="../assets/img/class-list.jpg"/>
   * </p>
   * xclass:'simple-list'
   * ## 显示静态数组的数据
   *
   * ** 最简单的列表 **
   * <pre><code>
   *
   * BUI.use('bui/list',function(List){
   *   var list = new List.SimpleList({
   *     render : '#t1',
   *     items : [{value : '1',text : '1'},{value : '2',text : '2'}]
   *   });
   *   list.render();
   * });
   *
   * </code></pre>
   *
   * ** 自定义模板的列表 **
   *<pre><code>
   *
   * BUI.use('bui/list',function(List){
   *   var list = new List.SimpleList({
   *     render : '#t1',
   *     items : [{value : '1',text : '1'},{value : '2',text : '2'}]
   *   });
   *   list.render();
   * });
   *
   * </code></pre>
   *
   * @class BUI.List.SimpleList
   * @extends BUI.Component.Controller
   * @mixins BUI.List.DomList
   * @mixins BUI.List.KeyNav
   * @mixins BUI.Component.UIBase.Bindable
   */
  var simpleList = BUI.Component.Controller.extend([DomList, UIBase.Bindable, KeyNav, Sortable], {
    /**
     * @protected
     * @ignore
     */
    bindUI: function() {
      var _self = this,
        itemCls = _self.get('itemCls'),
        itemContainer = _self.get('view').getItemContainer();
      itemContainer.delegate('.' + itemCls, 'mouseover', function(ev) {
        if (_self.get('disabled')) { //控件禁用后，阻止事件
          return;
        }
        var element = ev.currentTarget,
          item = _self.getItemByElement(element);
        if (_self.isItemDisabled(ev.item, ev.currentTarget)) { //如果禁用
          return;
        }
        if (!(UA.ie && UA.ie < 8) && _self.get('focusable') && _self.get('highlightedStatus') === 'hover') {
          _self.setHighlighted(item, element)
        } else {
          _self.setItemStatus(item, 'hover', true, element);
        }
        /*_self.get('view').setElementHover(element,true);*/
      }).delegate('.' + itemCls, 'mouseout', function(ev) {
        if (_self.get('disabled')) { //控件禁用后，阻止事件
          return;
        }
        var sender = $(ev.currentTarget);
        _self.get('view').setElementHover(sender, false);
      });
    },
    /**
     * 添加
     * @protected
     */
    onAdd: function(e) {
      var _self = this,
        store = _self.get('store'),
        item = e.record;
      if (_self.getCount() == 0) { //初始为空时，列表跟Store不同步
        _self.setItems(store.getResult());
      } else {
        _self.addItemToView(item, e.index);
      }
    },
    handleContextMenu: function(ev) {
      var _self = this,
        target = ev.target,
        itemCls = _self.get('itemCls'),
        element = $(target).closest('.' + itemCls),
        item = _self.getItemByElement(element);
      var result = _self.fire('itemcontextmenu', {
        element: element,
        item: item,
        pageX: ev.pageX,
        pageY: ev.pageY,
        domTarget: ev.target,
        domEvent: ev
      });
      if (result === false) {
        ev.preventDefault();
      }
    },
    /**
     * 删除
     * @protected
     */
    onRemove: function(e) {
      var _self = this,
        item = e.record;
      _self.removeItem(item);
    },
    /**
     * 更新
     * @protected
     */
    onUpdate: function(e) {
      this.updateItem(e.record);
    },
    /**
     * 本地排序
     * @protected
     */
    onLocalSort: function(e) {
      if (this.get('frontSortable')) {
        this.sort(e.field, e.direction);
      } else {
        this.onLoad(e);
      }
    },
    /**
     * 加载数据
     * @protected
     */
    onLoad: function() {
      var _self = this,
        store = _self.get('store'),
        items = store.getResult();
      _self.set('items', items);
    },
    /**
     * 过滤数据
     * @protected
     */
    onFiltered: function(e) {
      var _self = this,
        items = e.data;
      _self.set('items', items);
    }
  }, {
    ATTRS: {
      /**
       * 排序的时候是否直接进行DOM的排序，不重新生成DOM，<br>
       * 在可展开的表格插件，TreeGrid等控件中不要使用此属性
       * @type {Boolean}
       * cfg {Boolean} frontSortable
       */
      frontSortable: {
        value: false
      },
      focusable: {
        value: false
      },
      /**
       * 选项集合
       * @protected
       * @type {Array}
       */
      items: {
        view: true,
        value: []
      },
      /**
       * 选项的样式，用来获取子项
       * <pre><code>
       * var list = new List.SimpleList({
       *   render : '#t1',
       *   itemCls : 'my-item', //自定义样式名称
       *   items : [{id : '1',text : '1',type : '0'},{id : '2',text : '2',type : '1'}]
       * });
       * list.render();
       * </code></pre>
       * @cfg {Object} [itemCl='list-item']
       */
      itemCls: {
        view: true,
        value: CLS_ITEM
      },
      /**
       * 选项的默认id字段
       * <pre><code>
       * var list = new List.SimpleList({
       *   render : '#t1',
       *   idField : 'id', //自定义选项 id 字段
       *   items : [{id : '1',text : '1',type : '0'},{id : '2',text : '2',type : '1'}]
       * });
       * list.render();
       *
       * list.getItem('1'); //使用idField指定的字段进行查找
       * </code></pre>
       * @cfg {String} [idField = 'value']
       */
      idField: {
        value: 'value'
      },
      /**
       * 列表的选择器，将列表项附加到此节点
       * @protected
       * @type {Object}
       */
      listSelector: {
        view: true,
        value: 'ul'
      },
      /**
       * 列表项的默认模板。
       *<pre><code>
       * var list = new List.SimpleList({
       *   itemTpl : '&lt;li id="{value}"&gt;{text}&lt;/li&gt;', //列表项的模板
       *   idField : 'value',
       *   render : '#t1',
       *   items : [{value : '1',text : '1'},{value : '2',text : '2'}]
       * });
       * list.render();
       * </code></pre>
       * @cfg {String} [itemTpl ='&lt;li role="option" class="bui-list-item" data-value="{value}"&gt;{text}&lt;/li&gt;']
       */
      itemTpl: {
        view: true,
        value: '<li role="option" class="' + CLS_ITEM + '">{text}</li>'
      },
      tpl: {
        value: '<ul></ul>'
      },
      xview: {
        value: simpleListView
      }
    }
  }, {
    xclass: 'simple-list',
    prority: 0
  });
  simpleList.View = simpleListView;
  module.exports = simpleList;
});
define("bui/list/domlist", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 使用DOM元素作为选项的扩展类
   * @author dxq613@gmail.com
   * @ignore
   */
  'use strict';
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Selection = BUI.Component.UIBase.Selection,
    FIELD_PREFIX = 'data-',
    List = BUI.Component.UIBase.List;

  function getItemStatusCls(name, self) {
      var _self = self,
        itemCls = _self.get('itemCls'),
        itemStatusCls = _self.get('itemStatusCls');
      if (itemStatusCls && itemStatusCls[name]) {
        return itemStatusCls[name];
      }
      return itemCls + '-' + name;
    }
    /**
     * 选项是DOM的列表的视图类
     * @private
     * @class BUI.List.DomList.View
     */
  var domListView = function() {};
  domListView.ATTRS = {
    items: {}
  };
  domListView.prototype = {
    /**
     * @protected
     * 清除者列表项的DOM
     */
    clearControl: function() {
      var _self = this,
        listEl = _self.getItemContainer(),
        itemCls = _self.get('itemCls');
      listEl.find('.' + itemCls).remove();
    },
    /**
     * 添加选项
     * @param {Object} item  选项值
     * @param {Number} index 索引
     */
    addItem: function(item, index) {
      return this._createItem(item, index);
    },
    /**
     * 获取所有的记录
     * @return {Array} 记录集合
     */
    getItems: function() {
      var _self = this,
        elements = _self.getAllElements(),
        rst = [];
      BUI.each(elements, function(elem) {
        rst.push(_self.getItemByElement(elem));
      });
      return rst;
    },
    /**
     * 更新列表项
     * @param  {Object} item 选项值
     * @ignore
     */
    updateItem: function(item) {
      var _self = this,
        items = _self.getItems(),
        index = BUI.Array.indexOf(item, items),
        element = null,
        tpl;
      if (index >= 0) {
        element = _self.findElement(item);
        tpl = _self.getItemTpl(item, index);
        if (element) {
          $(element).html($(tpl).html());
        }
      }
      return element;
    },
    /**
     * 移除选项
     * @param  {jQuery} element
     * @ignore
     */
    removeItem: function(item, element) {
      element = element || this.findElement(item);
      $(element).remove();
    },
    /**
     * 获取列表项的容器
     * @return {jQuery} 列表项容器
     * @protected
     */
    getItemContainer: function() {
      var container = this.get('itemContainer');
      if (container.length) {
        return container;
      }
      return this.get('el');
    },
    /**
     * 获取记录的模板,itemTpl 和 数据item 合并产生的模板
     * @protected
     */
    getItemTpl: function(item, index) {
      var _self = this,
        render = _self.get('itemTplRender'),
        itemTpl = _self.get('itemTpl');
      if (render) {
        return render(item, index);
      }
      return BUI.substitute(itemTpl, item);
    },
    //创建项
    _createItem: function(item, index) {
      var _self = this,
        listEl = _self.getItemContainer(),
        itemCls = _self.get('itemCls'),
        dataField = _self.get('dataField'),
        tpl = _self.getItemTpl(item, index),
        node = $(tpl);
      if (index !== undefined) {
        var target = listEl.find('.' + itemCls)[index];
        if (target) {
          node.insertBefore(target);
        } else {
          node.appendTo(listEl);
        }
      } else {
        node.appendTo(listEl);
      }
      node.addClass(itemCls);
      node.data(dataField, item);
      return node;
    },
    /**
     * 获取列表项对应状态的样式
     * @param  {String} name 状态名称
     * @return {String} 状态的样式
     */
    getItemStatusCls: function(name) {
      return getItemStatusCls(name, this);
    },
    /**
     * 设置列表项选中
     * @protected
     * @param {*} name 状态名称
     * @param {HTMLElement} element DOM结构
     * @param {Boolean} value 设置或取消此状态
     */
    setItemStatusCls: function(name, element, value) {
      var _self = this,
        cls = _self.getItemStatusCls(name),
        method = value ? 'addClass' : 'removeClass';
      if (element) {
        $(element)[method](cls);
      }
    },
    /**
     * 是否有某个状态
     * @param {*} name 状态名称
     * @param {HTMLElement} element DOM结构
     * @return {Boolean} 是否具有状态
     */
    hasStatus: function(name, element) {
      var _self = this,
        cls = _self.getItemStatusCls(name);
      return $(element).hasClass(cls);
    },
    /**
     * 设置列表项选中
     * @param {*} item   记录
     * @param {Boolean} selected 是否选中
     * @param {HTMLElement} element DOM结构
     */
    setItemSelected: function(item, selected, element) {
      var _self = this;
      element = element || _self.findElement(item);
      _self.setItemStatusCls('selected', element, selected);
    },
    /**
     * 获取所有列表项的DOM结构
     * @return {Array} DOM列表
     */
    getAllElements: function() {
      var _self = this,
        itemCls = _self.get('itemCls'),
        el = _self.get('el');
      return el.find('.' + itemCls);
    },
    /**
     * 获取DOM结构中的数据
     * @param {HTMLElement} element DOM 结构
     * @return {Object} 该项对应的值
     */
    getItemByElement: function(element) {
      var _self = this,
        dataField = _self.get('dataField');
      return $(element).data(dataField);
    },
    /**
     * 根据状态获取第一个DOM 节点
     * @param {String} name 状态名称
     * @return {HTMLElement} Dom 节点
     */
    getFirstElementByStatus: function(name) {
      var _self = this,
        cls = _self.getItemStatusCls(name),
        el = _self.get('el');
      return el.find('.' + cls)[0];
    },
    /**
     * 根据状态获取DOM
     * @return {Array} DOM数组
     */
    getElementsByStatus: function(status) {
      var _self = this,
        cls = _self.getItemStatusCls(status),
        el = _self.get('el');
      return el.find('.' + cls);
    },
    /**
     * 通过样式查找DOM元素
     * @param {String} css样式
     * @return {jQuery} DOM元素的数组对象
     */
    getSelectedElements: function() {
      var _self = this,
        cls = _self.getItemStatusCls('selected'),
        el = _self.get('el');
      return el.find('.' + cls);
    },
    /**
     * 查找指定的项的DOM结构
     * @param  {Object} item
     * @return {HTMLElement} element
     */
    findElement: function(item) {
      var _self = this,
        elements = _self.getAllElements(),
        result = null;
      BUI.each(elements, function(element) {
        if (_self.getItemByElement(element) == item) {
          result = element;
          return false;
        }
      });
      return result;
    },
    /**
     * 列表项是否选中
     * @param  {HTMLElement}  element 是否选中
     * @return {Boolean}  是否选中
     */
    isElementSelected: function(element) {
      var _self = this,
        cls = _self.getItemStatusCls('selected');
      return element && $(element).hasClass(cls);
    }
  };
  //转换成Object
  function parseItem(element, self) {
      var attrs = element.attributes,
        itemStatusFields = self.get('itemStatusFields'),
        item = {};
      BUI.each(attrs, function(attr) {
        var name = attr.nodeName;
        if (name.indexOf(FIELD_PREFIX) !== -1) {
          name = name.replace(FIELD_PREFIX, '');
          item[name] = attr.nodeValue;
        }
      });
      item.text = $(element).text();
      //获取状态对应的值
      BUI.each(itemStatusFields, function(v, k) {
        var cls = getItemStatusCls(k, self);
        if ($(element).hasClass(cls)) {
          item[v] = true;
        }
      });
      return item;
    }
    /**
     * @class BUI.List.DomList
     * 选项是DOM结构的列表
     * @extends BUI.Component.UIBase.List
     * @mixins BUI.Component.UIBase.Selection
     */
  var domList = function() {};
  domList.ATTRS = BUI.merge(true, List.ATTRS, Selection.ATTRS, {
    /**
     * 在DOM节点上存储数据的字段
     * @type {String}
     * @protected
     */
    dataField: {
      view: true,
      value: 'data-item'
    },
    /**
     * 选项所在容器，如果未设定，使用 el
     * @type {jQuery}
     * @protected
     */
    itemContainer: {
      view: true
    },
    /**
     * 选项状态对应的选项值
     *
     *   - 此字段用于将选项记录的值跟显示的DOM状态相对应
     *   - 例如：下面记录中 <code> checked : true </code>，可以使得此记录对应的DOM上应用对应的状态(默认为 'list-item-checked')
     *     <pre><code>{id : '1',text : 1,checked : true}</code></pre>
     *   - 当更改DOM的状态时，记录中对应的字段属性也会跟着变化
     * <pre><code>
     *   var list = new List.SimpleList({
     *   render : '#t1',
     *   idField : 'id', //自定义样式名称
     *   itemStatusFields : {
     *     checked : 'checked',
     *     disabled : 'disabled'
     *   },
     *   items : [{id : '1',text : '1',checked : true},{id : '2',text : '2',disabled : true}]
     * });
     * list.render(); //列表渲染后，会自动带有checked,和disabled对应的样式
     *
     * var item = list.getItem('1');
     * list.hasStatus(item,'checked'); //true
     *
     * list.setItemStatus(item,'checked',false);
     * list.hasStatus(item,'checked');  //false
     * item.checked;                    //false
     *
     * </code></pre>
     * ** 注意 **
     * 此字段跟 {@link #itemStatusCls} 一起使用效果更好，可以自定义对应状态的样式
     * @cfg {Object} itemStatusFields
     */
    itemStatusFields: {
      value: {}
    },
    /**
     * 项的样式，用来获取子项
     * @cfg {Object} itemCls
     */
    itemCls: {
      view: true
    },
    /**
     * 是否允许取消选中，在多选情况下默认允许取消，单选情况下不允许取消,注意此属性只有单选情况下生效
     * @type {Boolean}
     */
    cancelSelected: {
      value: false
    },
    /**
     * 获取项的文本，默认获取显示的文本
     * @type {Object}
     * @protected
     */
    textGetter: {},
    /**
     * 默认的加载控件内容的配置,默认值：
     * <pre>
     *  {
     *   property : 'items',
     *   dataType : 'json'
     * }
     * </pre>
     * @type {Object}
     */
    defaultLoaderCfg: {
      value: {
        property: 'items',
        dataType: 'json'
      }
    },
    events: {
      value: {
        /**
         * 选项对应的DOM创建完毕
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.item 渲染DOM对应的选项
         * @param {HTMLElement} e.element 渲染的DOM对象
         */
        'itemrendered': true,
        /**
         * @event
         * 删除选项
         * @param {Object} e 事件对象
         * @param {Object} e.item 删除DOM对应的选项
         * @param {HTMLElement} e.element 删除的DOM对象
         */
        'itemremoved': true,
        /**
         * @event
         * 更新选项
         * @param {Object} e 事件对象
         * @param {Object} e.item 更新DOM对应的选项
         * @param {HTMLElement} e.element 更新的DOM对象
         */
        'itemupdated': true,
        /**
         * 设置记录时，所有的记录显示完毕后触发
         * @event
         */
        'itemsshow': false,
        /**
         * 设置记录后，所有的记录显示前触发
         * @event:
         */
        'beforeitemsshow': false,
        /**
         * 清空所有记录，DOM清理完成后
         * @event
         */
        'itemsclear': false,
        /**
         * 双击是触发
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.item DOM对应的选项
         * @param {HTMLElement} e.element 选项的DOM对象
         * @param {HTMLElement} e.domTarget 点击的元素
         */
        'itemdblclick': false,
        /**
         * 清空所有Dom前触发
         * @event
         */
        'beforeitemsclear': false
      }
    }
  });
  domList.PARSER = {
    items: function(el) {
      var _self = this,
        rst = [],
        itemCls = _self.get('itemCls'),
        dataField = _self.get('dataField'),
        elements = el.find('.' + itemCls);
      if (!elements.length) {
        elements = el.children();
        elements.addClass(itemCls);
      }
      BUI.each(elements, function(element) {
        var item = parseItem(element, _self);
        rst.push(item);
        $(element).data(dataField, item);
      });
      //_self.setInternal('items',rst);
      return rst;
    }
  };
  BUI.augment(domList, List, Selection, {
    //设置记录
    _uiSetItems: function(items) {
      var _self = this;
      //使用srcNode 的方式，不同步
      if (_self.get('srcNode') && !_self.get('rendered')) {
        return;
      }
      this.setItems(items);
    },
    __bindUI: function() {
      var _self = this,
        selectedEvent = _self.get('selectedEvent'),
        itemCls = _self.get('itemCls'),
        itemContainer = _self.get('view').getItemContainer();
      itemContainer.delegate('.' + itemCls, 'click', function(ev) {
        if (_self.get('disabled')) { //控件禁用后，阻止事件
          return;
        }
        var itemEl = $(ev.currentTarget),
          item = _self.getItemByElement(itemEl);
        if (_self.isItemDisabled(item, itemEl)) { //禁用状态下阻止选中
          return;
        }
        var rst = _self.fire('itemclick', {
          item: item,
          element: itemEl[0],
          domTarget: ev.target,
          domEvent: ev
        });
        if (rst !== false && selectedEvent == 'click' && _self.isItemSelectable(item)) {
          setItemSelectedStatus(item, itemEl);
        }
      });
      if (selectedEvent !== 'click') { //如果选中事件不等于click，则进行监听选中
        itemContainer.delegate('.' + itemCls, selectedEvent, function(ev) {
          if (_self.get('disabled')) { //控件禁用后，阻止事件
            return;
          }
          var itemEl = $(ev.currentTarget),
            item = _self.getItemByElement(itemEl);
          if (_self.isItemDisabled(item, itemEl)) { //禁用状态下阻止选中
            return;
          }
          if (_self.isItemSelectable(item)) {
            setItemSelectedStatus(item, itemEl);
          }
        });
      }
      itemContainer.delegate('.' + itemCls, 'dblclick', function(ev) {
        if (_self.get('disabled')) { //控件禁用后，阻止事件
          return;
        }
        var itemEl = $(ev.currentTarget),
          item = _self.getItemByElement(itemEl);
        if (_self.isItemDisabled(item, itemEl)) { //禁用状态下阻止选中
          return;
        }
        _self.fire('itemdblclick', {
          item: item,
          element: itemEl[0],
          domTarget: ev.target
        });
      });

      function setItemSelectedStatus(item, itemEl) {
        var multipleSelect = _self.get('multipleSelect'),
          isSelected;
        isSelected = _self.isItemSelected(item, itemEl);
        if (!isSelected) {
          if (!multipleSelect) {
            _self.clearSelected();
          }
          _self.setItemSelected(item, true, itemEl);
        } else if (multipleSelect) {
          _self.setItemSelected(item, false, itemEl);
        } else if (_self.get('cancelSelected')) {
          _self.setSelected(null); //选中空记录
        }
      }
      _self.on('itemrendered itemupdated', function(ev) {
        var item = ev.item,
          element = ev.element;
        _self._syncItemStatus(item, element);
      });
    },
    //获取值，通过字段
    getValueByField: function(item, field) {
      return item && item[field];
    },
    //同步选项状态
    _syncItemStatus: function(item, element) {
      var _self = this,
        itemStatusFields = _self.get('itemStatusFields');
      BUI.each(itemStatusFields, function(v, k) {
        if (item[v] != null) {
          _self.get('view').setItemStatusCls(k, element, item[v]);
        }
      });
    },
    /**
     * @protected
     * 获取记录中的状态值，未定义则为undefined
     * @param  {Object} item  记录
     * @param  {String} status 状态名
     * @return {Boolean|undefined}
     */
    getStatusValue: function(item, status) {
      var _self = this,
        itemStatusFields = _self.get('itemStatusFields'),
        field = itemStatusFields[status];
      return item[field];
    },
    /**
     * 获取选项数量
     * @return {Number} 选项数量
     */
    getCount: function() {
      var items = this.getItems();
      return items ? items.length : 0;
    },
    /**
     * 更改状态值对应的字段
     * @protected
     * @param  {String} status 状态名
     * @return {String} 状态对应的字段
     */
    getStatusField: function(status) {
      var _self = this,
        itemStatusFields = _self.get('itemStatusFields');
      return itemStatusFields[status];
    },
    /**
     * 设置记录状态值
     * @protected
     * @param  {Object} item  记录
     * @param  {String} status 状态名
     * @param {Boolean} value 状态值
     */
    setStatusValue: function(item, status, value) {
      var _self = this,
        itemStatusFields = _self.get('itemStatusFields'),
        field = itemStatusFields[status];
      if (field) {
        item[field] = value;
      }
    },
    /**
     * @ignore
     * 获取选项文本
     */
    getItemText: function(item) {
      var _self = this,
        textGetter = _self.get('textGetter');
      if (!item) {
        return '';
      }
      if (textGetter) {
        return textGetter(item);
      } else {
        return $(_self.findElement(item)).text();
      }
    },
    /**
     * 删除项
     * @param  {Object} item 选项记录
     * @ignore
     */
    removeItem: function(item) {
      var _self = this,
        items = _self.get('items'),
        element = _self.findElement(item),
        index;
      index = BUI.Array.indexOf(item, items);
      if (index !== -1) {
        items.splice(index, 1);
      }
      _self.get('view').removeItem(item, element);
      _self.fire('itemremoved', {
        item: item,
        domTarget: $(element)[0],
        element: element
      });
    },
    /**
     * 在指定位置添加选项,选项值为一个对象
     * @param {Object} item 选项
     * @param {Number} index 索引
     * @ignore
     */
    addItemAt: function(item, index) {
      var _self = this,
        items = _self.get('items');
      if (index === undefined) {
        index = items.length;
      }
      items.splice(index, 0, item);
      _self.addItemToView(item, index);
      return item;
    },
    /**
     * @protected
     * 直接在View上显示
     * @param {Object} item 选项
     * @param {Number} index 索引
     *
     */
    addItemToView: function(item, index) {
      var _self = this,
        element = _self.get('view').addItem(item, index);
      _self.fire('itemrendered', {
        item: item,
        domTarget: $(element)[0],
        element: element
      });
      return element;
    },
    /**
     * 更新列表项
     * @param  {Object} item 选项值
     * @ignore
     */
    updateItem: function(item) {
      var _self = this,
        element = _self.get('view').updateItem(item);
      _self.fire('itemupdated', {
        item: item,
        domTarget: $(element)[0],
        element: element
      });
    },
    /**
     * 设置列表记录
     * <pre><code>
     *   list.setItems(items);
     *   //等同
     *   list.set('items',items);
     * </code></pre>
     * @param {Array} items 列表记录
     */
    setItems: function(items) {
      var _self = this;
      if (items != _self.getItems()) {
        _self.setInternal('items', items);
      }
      //清理子控件
      _self.clearControl();
      _self.fire('beforeitemsshow');
      BUI.each(items, function(item, index) {
        _self.addItemToView(item, index);
      });
      _self.fire('itemsshow');
    },
    /**
     * 获取所有选项
     * @return {Array} 选项集合
     * @override
     * @ignore
     */
    getItems: function() {
      return this.get('items');
    },
    /**
     * 获取DOM结构中的数据
     * @protected
     * @param {HTMLElement} element DOM 结构
     * @return {Object} 该项对应的值
     */
    getItemByElement: function(element) {
      return this.get('view').getItemByElement(element);
    },
    /**
     * 获取选中的第一项,
     * <pre><code>
     * var item = list.getSelected(); //多选模式下第一条
     * </code></pre>
     * @return {Object} 选中的第一项或者为null
     */
    getSelected: function() { //this.getSelection()[0] 的方式效率太低
      var _self = this,
        element = _self.get('view').getFirstElementByStatus('selected');
      return _self.getItemByElement(element) || null;
    },
    /**
     * 根据状态获取选项
     * <pre><code>
     *   //设置状态
     *   list.setItemStatus(item,'active');
     *
     *   //获取'active'状态的选项
     *   list.getItemsByStatus('active');
     * </code></pre>
     * @param  {String} status 状态名
     * @return {Array}  选项组集合
     */
    getItemsByStatus: function(status) {
      var _self = this,
        elements = _self.get('view').getElementsByStatus(status),
        rst = [];
      BUI.each(elements, function(element) {
        rst.push(_self.getItemByElement(element));
      });
      return rst;
    },
    /**
     * 查找指定的项的DOM结构
     * <pre><code>
     *   var item = list.getItem('2'); //获取选项
     *   var element = list.findElement(item);
     *   $(element).addClass('xxx');
     * </code></pre>
     * @param  {Object} item
     * @return {HTMLElement} element
     */
    findElement: function(item) {
      var _self = this;
      if (BUI.isString(item)) {
        item = _self.getItem(item);
      }
      return this.get('view').findElement(item);
    },
    findItemByField: function(field, value) {
      var _self = this,
        items = _self.get('items'),
        result = null;
      BUI.each(items, function(item) {
        if (item[field] != null && item[field] == value) { //会出现false == '','0' == false的情况
          result = item;
          return false;
        }
      });
      return result;
    },
    /**
     * @override
     * @ignore
     */
    setItemSelectedStatus: function(item, selected, element) {
      var _self = this;
      element = element || _self.findElement(item);
      //_self.get('view').setItemSelected(item,selected,element);
      _self.setItemStatus(item, 'selected', selected, element);
      //_self.afterSelected(item,selected,element);
    },
    /**
     * 设置所有选项选中
     * @ignore
     */
    setAllSelection: function() {
      var _self = this,
        items = _self.getItems();
      _self.setSelection(items);
    },
    /**
     * 选项是否被选中
     * <pre><code>
     *   var item = list.getItem('2');
     *   if(list.isItemSelected(item)){
     *     //do something
     *   }
     * </code></pre>
     * @override
     * @param  {Object}  item 选项
     * @return {Boolean}  是否选中
     */
    isItemSelected: function(item, element) {
      var _self = this;
      element = element || _self.findElement(item);
      return _self.get('view').isElementSelected(element);
    },
    /**
     * 是否选项被禁用
     * <pre><code>
     * var item = list.getItem('2');
     * if(list.isItemDisabled(item)){ //如果选项禁用
     *   //do something
     * }
     * </code></pre>
     * @param {Object} item 选项
     * @return {Boolean} 选项是否禁用
     */
    isItemDisabled: function(item, element) {
      return this.hasStatus(item, 'disabled', element);
    },
    /**
     * 设置选项禁用
     * <pre><code>
     * var item = list.getItem('2');
     * list.setItemDisabled(item,true);//设置选项禁用，会在DOM上添加 itemCls + 'disabled'的样式
     * list.setItemDisabled(item,false); //取消禁用，可以用{@link #itemStatusCls} 来替换样式
     * </code></pre>
     * @param {Object} item 选项
     */
    setItemDisabled: function(item, disabled) {
      var _self = this;
      /*if(disabled){
        //清除选择
        _self.setItemSelected(item,false);
      }*/
      _self.setItemStatus(item, 'disabled', disabled);
    },
    /**
     * 获取选中的项的值
     * @override
     * @return {Array}
     * @ignore
     */
    getSelection: function() {
      var _self = this,
        elements = _self.get('view').getSelectedElements(),
        rst = [];
      BUI.each(elements, function(elem) {
        rst.push(_self.getItemByElement(elem));
      });
      return rst;
    },
    /**
     * @protected
     * @override
     * 清除者列表项的DOM
     */
    clearControl: function() {
      this.fire('beforeitemsclear');
      this.get('view').clearControl();
      this.fire('itemsclear');
    },
    /**
     * 选项是否存在某种状态
     * <pre><code>
     * var item = list.getItem('2');
     * list.setItemStatus(item,'active',true);
     * list.hasStatus(item,'active'); //true
     *
     * list.setItemStatus(item,'active',false);
     * list.hasStatus(item,'false'); //true
     * </code></pre>
     * @param {*} item 选项
     * @param {String} status 状态名称，如selected,hover,open等等
     * @param {HTMLElement} [element] 选项对应的Dom，放置反复查找
     * @return {Boolean} 是否具有某种状态
     */
    hasStatus: function(item, status, element) {
      if (!item) {
        return false;
      }
      var _self = this,
        field = _self.getStatusField(status);
      /*if(field){
        return _self.getStatusValue(item,status);
      }*/
      element = element || _self.findElement(item);
      return _self.get('view').hasStatus(status, element);
    },
    /**
     * 设置选项状态,可以设置任何自定义状态
     * <pre><code>
     * var item = list.getItem('2');
     * list.setItemStatus(item,'active',true);
     * list.hasStatus(item,'active'); //true
     *
     * list.setItemStatus(item,'active',false);
     * list.hasStatus(item,'false'); //true
     * </code></pre>
     * @param {*} item 选项
     * @param {String} status 状态名称
     * @param {Boolean} value 状态值，true,false
     * @param {HTMLElement} [element] 选项对应的Dom，放置反复查找
     */
    setItemStatus: function(item, status, value, element) {
      var _self = this;
      if (item) {
        element = element || _self.findElement(item);
      }
      if (!_self.isItemDisabled(item, element) || status === 'disabled') { //禁用后，阻止添加任何状态变化
        if (item) {
          if (status === 'disabled' && value) { //禁用，同时清理其他状态
            _self.clearItemStatus(item);
          }
          _self.setStatusValue(item, status, value);
          _self.get('view').setItemStatusCls(status, element, value);
          _self.fire('itemstatuschange', {
            item: item,
            status: status,
            value: value,
            element: element
          });
        }
        if (status === 'selected') { //处理选中
          _self.afterSelected(item, value, element);
        }
      }
    },
    /**
     * 清除所有选项状态,如果指定清除的状态名，则清除指定的，否则清除所有状态
     * @param {Object} item 选项
     */
    clearItemStatus: function(item, status, element) {
      var _self = this,
        itemStatusFields = _self.get('itemStatusFields');
      element = element || _self.findElement(item);
      if (status) {
        _self.setItemStatus(item, status, false, element);
      } else {
        BUI.each(itemStatusFields, function(v, k) {
          _self.setItemStatus(item, k, false, element);
        });
        if (!itemStatusFields['selected']) {
          _self.setItemSelected(item, false);
        }
        //移除hover状态
        _self.setItemStatus(item, 'hover', false);
      }
    }
  });
  domList.View = domListView;
  module.exports = domList;
});
define("bui/list/keynav", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 列表选项，使用键盘导航
   * @author dxq613@gmail.com
   * @ignore
   */
  'use strict';
  /**
   * @class BUI.List.KeyNav
   * 列表导航扩展类
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    KeyNav = function() {};
  KeyNav.ATTRS = {
    /**
     * 选项高亮使用的状态,有些场景下，使用selected更合适
     * @cfg {String} [highlightedStatus='hover']
     */
    highlightedStatus: {
      value: 'hover'
    }
  };
  BUI.augment(KeyNav, {
    /**
     * 设置选项高亮，默认使用 'hover' 状态
     * @param  {Object} item 选项
     * @param  {Boolean} value 状态值，true,false
     * @protected
     */
    setHighlighted: function(item, element) {
      if (this.hasStatus(item, 'hover', element)) {
        return;
      }
      var _self = this,
        highlightedStatus = _self.get('highlightedStatus'),
        lightedElement = _self._getHighLightedElement(),
        lightedItem = lightedElement ? _self.getItemByElement(lightedElement) : null;
      if (lightedItem !== item) {
        if (lightedItem) {
          this.setItemStatus(lightedItem, highlightedStatus, false, lightedElement);
        }
        this.setItemStatus(item, highlightedStatus, true, element);
        _self._scrollToItem(item, element);
      }
    },
    _getHighLightedElement: function() {
      var _self = this,
        highlightedStatus = _self.get('highlightedStatus'),
        element = _self.get('view').getFirstElementByStatus(highlightedStatus);
      return element;
    },
    /**
     * 获取高亮的选项
     * @return {Object} item
     * @protected
     */
    getHighlighted: function() {
      var _self = this,
        highlightedStatus = _self.get('highlightedStatus'),
        element = _self.get('view').getFirstElementByStatus(highlightedStatus);
      return _self.getItemByElement(element) || null;
    },
    /**
     * 获取列数
     * @return {Number} 选项的列数,默认为1列
     * @protected
     */
    getColumnCount: function() {
      var _self = this,
        firstItem = _self.getFirstItem(),
        element = _self.findElement(firstItem),
        node = $(element);
      if (element) {
        return parseInt(node.parent().width() / node.outerWidth(), 10);
      }
      return 1;
    },
    /**
     * 获取选项的行数 ，总数/列数 = list.getCount / column
     * @protected
     * @return {Number} 选项行数
     */
    getRowCount: function(columns) {
      var _self = this;
      columns = columns || _self.getColumnCount();
      return (this.getCount() + columns - 1) / columns;
    },
    _getNextItem: function(forward, skip, count) {
      var _self = this,
        currentIndx = _self._getCurrentIndex(), //默认第一行
        itemCount = _self.getCount(),
        factor = forward ? 1 : -1,
        nextIndex;
      if (currentIndx === -1) {
        return forward ? _self.getFirstItem() : _self.getLastItem();
      }
      if (!forward) {
        skip = skip * factor;
      }
      nextIndex = (currentIndx + skip + count) % count;
      if (nextIndex > itemCount - 1) { //如果位置超出索引位置
        if (forward) {
          nextIndex = nextIndex - (itemCount - 1);
        } else {
          nextIndex = nextIndex + skip;
        }
      }
      return _self.getItemAt(nextIndex);
    },
    //获取左边一项
    _getLeftItem: function() {
      var _self = this,
        count = _self.getCount(),
        column = _self.getColumnCount();
      if (!count || column <= 1) { //单列时,或者为0时
        return null;
      }
      return _self._getNextItem(false, 1, count);
    },
    //获取当前项
    _getCurrentItem: function() {
      return this.getHighlighted();
    },
    //获取当前项
    _getCurrentIndex: function() {
      var _self = this,
        item = _self._getCurrentItem();
      return this.indexOfItem(item);
    },
    //获取右边一项
    _getRightItem: function() {
      var _self = this,
        count = _self.getCount(),
        column = _self.getColumnCount();
      if (!count || column <= 1) { //单列时,或者为0时
        return null;
      }
      return this._getNextItem(true, 1, count);
    },
    //获取下面一项
    _getDownItem: function() {
      var _self = this,
        columns = _self.getColumnCount(),
        rows = _self.getRowCount(columns);
      if (rows <= 1) { //单行或者为0时
        return null;
      }
      return this._getNextItem(true, columns, columns * rows);
    },
    getScrollContainer: function() {
      return this.get('el');
    },
    /**
     * @protected
     * 只处理上下滚动，不处理左右滚动
     * @return {Boolean} 是否可以上下滚动
     */
    isScrollVertical: function() {
      var _self = this,
        el = _self.get('el'),
        container = _self.get('view').getItemContainer();
      return el.height() < container.height();
    },
    _scrollToItem: function(item, element) {
      var _self = this;
      if (_self.isScrollVertical()) {
        element = element || _self.findElement(item);
        var container = _self.getScrollContainer(),
          top = $(element).position().top,
          ctop = container.position().top,
          cHeight = container.height(),
          distance = top - ctop,
          height = $(element).height(),
          scrollTop = container.scrollTop();
        if (distance < 0 || distance > cHeight - height) {
          container.scrollTop(scrollTop + distance);
        }
      }
    },
    //获取上面一项
    _getUpperItem: function() {
      var _self = this,
        columns = _self.getColumnCount(),
        rows = _self.getRowCount(columns);
      if (rows <= 1) { //单行或者为0时
        return null;
      }
      return this._getNextItem(false, columns, columns * rows);
    },
    /**
     * 处理向上导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavUp: function(ev) {
      var _self = this,
        upperItem = _self._getUpperItem();
      _self.setHighlighted(upperItem);
    },
    /**
     * 处理向下导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavDown: function(ev) {
      this.setHighlighted(this._getDownItem());
    },
    /**
     * 处理向左导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavLeft: function(ev) {
      this.setHighlighted(this._getLeftItem());
    },
    /**
     * 处理向右导航
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavRight: function(ev) {
      this.setHighlighted(this._getRightItem());
    },
    /**
     * 处理确认键
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavEnter: function(ev) {
      var _self = this,
        current = _self._getCurrentItem(),
        element;
      if (current) {
        element = _self.findElement(current);
        //_self.setSelected(current);
        $(element).trigger('click');
      }
    },
    /**
     * 处理 esc 键
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavEsc: function(ev) {
      this.setHighlighted(null); //移除
    },
    /**
     * 处理Tab键
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavTab: function(ev) {
      this.setHighlighted(this._getRightItem());
    }
  });
  module.exports = KeyNav;
});
define("bui/list/sortable", ["jquery", "bui/common", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 列表排序
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    DataSortable = require("bui/data").Sortable;
  /**
   * @class BUI.List.Sortable
   * 列表排序的扩展
   * @extends BUI.Data.Sortable
   */
  var Sortable = function() {};
  Sortable.ATTRS = BUI.merge(true, DataSortable.ATTRS, {});
  BUI.augment(Sortable, DataSortable, {
    /**
     * @protected
     * @override
     * @ignore
     * 覆写比较方法
     */
    compare: function(obj1, obj2, field, direction) {
      var _self = this,
        dir;
      field = field || _self.get('sortField');
      direction = direction || _self.get('sortDirection');
      //如果未指定排序字段，或方向，则按照默认顺序
      if (!field || !direction) {
        return 1;
      }
      dir = direction === 'ASC' ? 1 : -1;
      if (!$.isPlainObject(obj1)) {
        obj1 = _self.getItemByElement(obj1);
      }
      if (!$.isPlainObject(obj2)) {
        obj2 = _self.getItemByElement(obj2);
      }
      return _self.get('compareFunction')(obj1[field], obj2[field]) * dir;
    },
    /**
     * 获取排序的集合
     * @protected
     * @return {Array} 排序集合
     */
    getSortData: function() {
      return $.makeArray(this.get('view').getAllElements());
    },
    /**
     * 列表排序
     * @param  {string} field  字段名
     * @param  {string} direction 排序方向 ASC,DESC
     */
    sort: function(field, direction) {
      var _self = this,
        sortedElements = _self.sortData(field, direction),
        itemContainer = _self.get('view').getItemContainer();
      if (!_self.get('store')) {
        _self.sortData(field, direction, _self.get('items'));
      }
      BUI.each(sortedElements, function(el) {
        $(el).appendTo(itemContainer);
      });
    }
  });
  module.exports = Sortable;
});
define("bui/list/listbox", ["jquery", "bui/common", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 可选择的列表
   * @author dengbin
   * @ignore
   */
  var $ = require('jquery'),
    SimpleList = require("bui/list/simplelist");
  /**
   * 列表选择框
   * @extends BUI.List.SimpleList
   * @class BUI.List.Listbox
   */
  var listbox = SimpleList.extend({
    bindUI: function() {
      var _self = this;
      _self.on('selectedchange', function(e) {
        var item = e.item,
          sender = $(e.domTarget),
          checkbox = sender.find('input');
        if (item) {
          checkbox.attr('checked', e.selected);
        }
      });
    }
  }, {
    ATTRS: {
      /**
       * 选项模板
       * @override
       * @type {String}
       */
      itemTpl: {
        value: '<li><span class="x-checkbox"></span>{text}</li>'
      },
      /**
       * 选项模板
       * @override
       * @type {Boolean}
       */
      multipleSelect: {
        value: true
      }
    }
  }, {
    xclass: 'listbox'
  });
  module.exports = listbox;
});
define("bui/menu", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 菜单命名空间入口文件
   * @ignore
   */
  var BUI = require("bui/common"),
    Menu = BUI.namespace('Menu');
  BUI.mix(Menu, {
    Menu: require("bui/menu/menu"),
    MenuItem: require("bui/menu/menuitem"),
    ContextMenu: require("bui/menu/contextmenu"),
    PopMenu: require("bui/menu/popmenu"),
    SideMenu: require("bui/menu/sidemenu")
  });
  Menu.ContextMenuItem = Menu.ContextMenu.Item;
  module.exports = Menu;
});
define("bui/menu/menu", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 菜单基类
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    Component = BUI.Component,
    UIBase = Component.UIBase;
  /**
   * 菜单
   * xclass:'menu'
   * <img src="../assets/img/class-menu.jpg"/>
   * @class BUI.Menu.Menu
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ChildList
   */
  var Menu = Component.Controller.extend([UIBase.ChildList], {
    /**
     * 绑定事件
     * @protected
     */
    bindUI: function() {
      var _self = this;
      _self.on('click', function(e) {
        var item = e.target,
          multipleSelect = _self.get('multipleSelect');
        if (_self != item) {
          //单选情况下，允许自动隐藏，且没有子菜单的情况下，菜单隐藏
          if (!multipleSelect && _self.get('clickHide') && !item.get('subMenu')) {
            _self.getTopAutoHideMenu().hide();
          }
        }
      });
      _self.on('afterOpenChange', function(ev) {
        var target = ev.target,
          opened = ev.newVal,
          children = _self.get('children');
        if (opened) {
          BUI.each(children, function(item) {
            if (item !== target && item.get('open')) {
              item.set('open', false);
            }
          });
        }
      });
      _self.on('afterVisibleChange', function(ev) {
        var visible = ev.newVal,
          parent = _self.get('parentMenu');
        _self._clearOpen();
      });
    },
    //点击自动隐藏时
    getTopAutoHideMenu: function() {
      var _self = this,
        parentMenu = _self.get('parentMenu'),
        topHideMenu;
      if (parentMenu && parentMenu.get('autoHide')) {
        return parentMenu.getTopAutoHideMenu();
      }
      if (_self.get('autoHide')) {
        return _self;
      }
      return null;
    },
    //清除菜单项的激活状态
    _clearOpen: function() {
      var _self = this,
        children = _self.get('children');
      BUI.each(children, function(item) {
        if (item.set) {
          item.set('open', false);
        }
      });
    },
    /**
     * 根据ID查找菜单项
     * @param  {String} id 编号
     * @return {BUI.Menu.MenuItem} 菜单项
     */
    findItemById: function(id) {
      return this.findItemByField('id', id);
    },
    _uiSetSelectedItem: function(item) {
      if (item) {
        _self.setSelected(item);
      }
    }
  }, {
    ATTRS: {
      elTagName: {
        view: true,
        value: 'ul'
      },
      idField: {
        value: 'id'
      },
      /**
       * @protected
       * 是否根据DOM生成子控件
       * @type {Boolean}
       */
      isDecorateChild: {
        value: true
      },
      /**
       * 子类的默认类名，即类的 xclass
       * @type {String}
       * @default 'menu-item'
       */
      defaultChildClass: {
        value: 'menu-item'
      },
      /**
       * 选中的菜单项
       * @type {Object}
       */
      selectedItem: {},
      /**
       * 上一级菜单
       * @type {BUI.Menu.Menu}
       * @readOnly
       */
      parentMenu: {}
    }
  }, {
    xclass: 'menu',
    priority: 0
  });
  module.exports = Menu;
});
define("bui/menu/menuitem", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 菜单项
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    UIBase = Component.UIBase,
    PREFIX = BUI.prefix,
    CLS_OPEN = PREFIX + 'menu-item-open',
    CLS_CARET = 'x-caret',
    CLS_COLLAPSE = PREFIX + 'menu-item-collapsed',
    DATA_ID = 'data-id';
  /**
   * @private
   * @class BUI.Menu.MenuItemView
   * @mixins BUI.Component.UIBase.ListItemView
   * @mixins BUI.Component.UIBase.CollapsableView
   * 菜单项的视图类
   */
  var menuItemView = Component.View.extend([UIBase.ListItemView, UIBase.CollapsableView], {
    _uiSetOpen: function(v) {
      var _self = this,
        cls = _self.getStatusCls('open');
      if (v) {
        _self.get('el').addClass(cls);
      } else {
        _self.get('el').removeClass(cls);
      }
    }
  }, {
    ATTRS: {}
  }, {
    xclass: 'menu-item-view'
  });
  /**
   * 菜单项
   * @class BUI.Menu.MenuItem
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ListItem
   */
  var menuItem = Component.Controller.extend([UIBase.ListItem, UIBase.Collapsable], {
    /**
     * 渲染
     * @protected
     */
    renderUI: function() {
      var _self = this,
        el = _self.get('el'),
        id = _self.get('id'),
        temp = null;
      //未设置id时自动生成
      if (!id) {
        id = BUI.guid('menu-item');
        _self.set('id', id);
      }
      el.attr(DATA_ID, id);
    },
    /**
     * 处理鼠标移入
     * @protected
     */
    handleMouseEnter: function(ev) {
      var _self = this;
      if (this.get('subMenu') && this.get('openable')) {
        this.set('open', true);
      }
      menuItem.superclass.handleMouseEnter.call(this, ev);
    },
    /**
     * 处理鼠标移出
     * @protected
     */
    handleMouseLeave: function(ev) {
      if (this.get('openable')) {
        var _self = this,
          subMenu = _self.get('subMenu'),
          toElement = ev.toElement || ev.relatedTarget;;
        if (toElement && subMenu && subMenu.containsElement(toElement)) {
          _self.set('open', true);
        } else {
          _self.set('open', false);
        }
      }
      menuItem.superclass.handleMouseLeave.call(this, ev);
    },
    /**
     * 自己和子菜单是否包含
     * @override
     */
    containsElement: function(elem) {
      var _self = this,
        subMenu,
        contains = menuItem.superclass.containsElement.call(_self, elem);
      if (!contains) {
        subMenu = _self.get('subMenu');
        contains = subMenu && subMenu.containsElement(elem);
      }
      return contains;
    },
    //设置打开子菜单 
    _uiSetOpen: function(v) {
      if (this.get('openable')) {
        var _self = this,
          subMenu = _self.get('subMenu'),
          subMenuAlign = _self.get('subMenuAlign');
        if (subMenu) {
          if (v) {
            subMenuAlign.node = _self.get('el');
            subMenu.set('align', subMenuAlign);
            subMenu.show();
          } else {
            var menuAlign = subMenu.get('align');
            //防止子菜单被公用时
            if (!menuAlign || menuAlign.node == _self.get('el')) {
              subMenu.hide();
            }
          }
        }
      }
    },
    //设置下级菜单
    _uiSetSubMenu: function(subMenu) {
      if (subMenu) {
        var _self = this,
          el = _self.get('el'),
          parent = _self.get('parent');
        //设置菜单项所属的菜单为上一级菜单
        if (!subMenu.get('parentMenu')) {
          subMenu.set('parentMenu', parent);
          if (parent.get('autoHide')) {
            if (parent.get('autoHideType') == 'click') {
              subMenu.set('autoHide', false);
            } else {
              subMenu.set('autoHideType', 'leave');
            }
          } /**/
        }
        $(_self.get('arrowTpl')).appendTo(el);
      }
    },
    /** 
     * 析构函数
     * @protected
     */
    destructor: function() {
      var _self = this,
        subMenu = _self.get('subMenu');
      if (subMenu) {
        subMenu.destroy();
      }
    }
  }, {
    ATTRS: {
      /**
       * 默认的Html 标签
       * @type {String}
       */
      elTagName: {
        value: 'li'
      },
      xview: {
        value: menuItemView
      },
      /**
       * 菜单项是否展开，显示子菜单
       * @cfg {Boolean} [open=false]
       */
      /**
       * 菜单项是否展开，显示子菜单
       * @type {Boolean}
       * @default false
       */
      open: {
        view: true,
        value: false
      },
      /**
       * 是否可以展开
       * @type {Boolean}
       */
      openable: {
        value: true
      },
      /**
       * 下级菜单
       * @cfg {BUI.Menu.Menu} subMenu
       */
      /**
       * 下级菜单
       * @type {BUI.Menu.Menu}
       */
      subMenu: {
        view: true
      },
      /**
       * 下级菜单和菜单项的对齐方式
       * @type {Object}
       * @default 默认在下面显示
       */
      subMenuAlign: {
        valueFn: function(argument) {
          return {
            //node: this.get('el'), // 参考元素, falsy 或 window 为可视区域, 'trigger' 为触发元素, 其他为指定元素
            points: ['tr', 'tl'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
            offset: [-5, 0] // 有效值为 [n, m]
          }
        }
      },
      /**
       * 当存在子菜单时的箭头模版
       * @protected
       * @type {String}
       */
      arrowTpl: {
        value: '<span class="' + CLS_CARET + ' ' + CLS_CARET + '-left"></span>'
      },
      events: {
        value: {
          'afterOpenChange': true
        }
      },
      subMenuType: {
        value: 'pop-menu'
      }
    },
    PARSER: {
      subMenu: function(el) {
        var subList = el.find('ul'),
          type = this.get('subMenuType'),
          sub;
        if (subList && subList.length) {
          sub = BUI.Component.create({
            srcNode: subList,
            xclass: type
          });
          if (type == 'pop-menu') {
            subList.appendTo('body');
            sub.setInternal({
              autoHide: true,
              autoHideType: 'leave'
            });
          } else {
            this.get('children').push(sub);
          }
        }
        return sub;
      }
    }
  }, {
    xclass: 'menu-item',
    priority: 0
  });
  var separator = menuItem.extend({}, {
    ATTRS: {
      focusable: {
        value: false
      },
      selectable: {
        value: false
      },
      handleMouseEvents: {
        value: false
      }
    }
  }, {
    xclass: 'menu-item-sparator'
  });
  menuItem.View = menuItemView;
  menuItem.Separator = separator;
  module.exports = menuItem;
});
define("bui/menu/contextmenu", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 弹出菜单，一般用于右键菜单
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    MenuItem = require("bui/menu/menuitem"),
    PopMenu = require("bui/menu/popmenu"),
    PREFIX = BUI.prefix,
    CLS_Link = PREFIX + 'menu-item-link',
    CLS_ITEM_ICON = PREFIX + 'menu-item-icon',
    Component = BUI.Component,
    UIBase = Component.UIBase;
  /**
   * 上下文菜单项
   * xclass:'context-menu-item'
   * @class BUI.Menu.ContextMenuItem
   * @extends BUI.Menu.MenuItem
   */
  var contextMenuItem = MenuItem.extend({
    bindUI: function() {
      var _self = this;
      _self.get('el').delegate('.' + CLS_Link, 'click', function(ev) {
        ev.preventDefault();
      });
    },
    //设置图标样式
    _uiSetIconCls: function(v, ev) {
      var _self = this,
        preCls = ev.prevVal,
        iconEl = _self.get('el').find('.' + CLS_ITEM_ICON);
      iconEl.removeClass(preCls);
      iconEl.addClass(v);
    }
  }, {
    ATTRS: {
      /**
       * 显示的文本
       * @type {String}
       */
      text: {
        veiw: true,
        value: ''
      },
      /**
       * 菜单项图标的样式
       * @type {String}
       */
      iconCls: {
        sync: false,
        value: ''
      },
      tpl: {
        value: '<a class="' + CLS_Link + '" href="#">\
      <span class="' + CLS_ITEM_ICON + ' {iconCls}"></span><span class="' + PREFIX + 'menu-item-text">{text}</span></a>'
      }
    }
  }, {
    xclass: 'context-menu-item'
  });
  /**
   * 上下文菜单，一般用于弹出菜单
   * xclass:'context-menu'
   * @class BUI.Menu.ContextMenu
   * @extends BUI.Menu.PopMenu
   */
  var contextMenu = PopMenu.extend({}, {
    ATTRS: {
      /**
       * 子类的默认类名，即类的 xclass
       * @type {String}
       * @override
       * @default 'menu-item'
       */
      defaultChildClass: {
        value: 'context-menu-item'
      },
      align: {
        value: null
      }
    }
  }, {
    xclass: 'context-menu'
  });
  contextMenu.Item = contextMenuItem;
  module.exports = contextMenu;
});
define("bui/menu/popmenu", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 下拉菜单，一般用于下拉显示菜单
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    UIBase = BUI.Component.UIBase,
    Menu = require("bui/menu/menu");
  var popMenuView = BUI.Component.View.extend([UIBase.PositionView], {});
  /**
   * @class BUI.Menu.PopMenu
   * 上下文菜单，一般用于弹出菜单
   * xclass:'pop-menu'
   * @extends BUI.Menu.Menu
   * @mixins BUI.Component.UIBase.AutoShow
   * @mixins BUI.Component.UIBase.Position
   * @mixins BUI.Component.UIBase.Align
   * @mixins BUI.Component.UIBase.AutoHide
   */
  var popMenu = Menu.extend([UIBase.Position, UIBase.Align, UIBase.AutoShow, UIBase.AutoHide], {}, {
    ATTRS: {
      /** 点击菜单项，如果菜单不是多选，菜单隐藏
       * @type {Boolean}
       * @default true
       */
      clickHide: {
        value: true
      },
      align: {
        value: {
          points: ['bl', 'tl'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
          offset: [0, 0] // 有效值为 [n, m]
        }
      },
      visibleMode: {
        value: 'visibility'
      },
      /**
       * 点击菜单外面，菜单隐藏
       * 点击菜单项，如果菜单不是多选，菜单隐藏
       * @type {Boolean}
       * @default true
       */
      autoHide: {
        value: true
      },
      visible: {
        value: false
      },
      xview: {
        value: popMenuView
      }
    }
  }, {
    xclass: 'pop-menu'
  });
  module.exports = popMenu;
});
define("bui/menu/sidemenu", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 侧边栏菜单
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Menu = require("bui/menu/menu"),
    Component = BUI.Component,
    CLS_MENU_TITLE = BUI.prefix + 'menu-title',
    CLS_MENU_LEAF = 'menu-leaf';
  /**
   * 侧边栏菜单
   * xclass:'side-menu'
   * @class BUI.Menu.SideMenu
   * @extends BUI.Menu.Menu
   */
  var sideMenu = Menu.extend({
    //初始化配置项
    initializer: function() {
      var _self = this,
        items = _self.get('items'),
        children = _self.get('children');
      BUI.each(items, function(item) {
        var menuCfg = _self._initMenuCfg(item);
        children.push(menuCfg);
      });
    },
    bindUI: function() {
      var _self = this,
        children = _self.get('children');
      BUI.each(children, function(item) {
        var menu = item.get('children')[0];
        if (menu) {
          menu.publish('click', {
            bubbles: 1
          });
        }
      });
      //防止链接跳转
      _self.get('el').delegate('a', 'click', function(ev) {
        ev.preventDefault();
      });
      //处理点击事件，展开、折叠、选中
      _self.on('itemclick', function(ev) {
        var item = ev.item,
          titleEl = $(ev.domTarget).closest('.' + _self.get('collapsedCls'));
        if (titleEl.length) {
          var collapsed = item.get('collapsed');
          item.set('collapsed', !collapsed);
        } else if (item.get('el').hasClass(CLS_MENU_LEAF)) {
          _self.fire('menuclick', {
            item: item
          });
          _self.clearSelection();
          _self.setSelected(item);
        }
      });
    },
    /**
     * @protected
     * @ignore
     */
    getItems: function() {
      var _self = this,
        items = [],
        children = _self.get('children');
      BUI.each(children, function(item) {
        var menu = item.get('children')[0];
        items = items.concat(menu.get('children'));
      });
      return items;
    },
    //初始化菜单配置项
    _initMenuCfg: function(item) {
      var _self = this,
        items = item.items,
        subItems = [],
        cfg = {
          selectable: false,
          children: [{
            xclass: 'menu',
            children: subItems
          }]
        };
      BUI.mix(cfg, {
        xclass: 'menu-item',
        elCls: 'menu-second'
      }, item);
      BUI.each(items, function(subItem) {
        var subItemCfg = _self._initSubMenuCfg(subItem);
        subItems.push(subItemCfg);
      });
      return cfg;
    },
    //初始化二级菜单
    _initSubMenuCfg: function(subItem) {
      var _self = this,
        cfg = {
          xclass: 'menu-item',
          elCls: 'menu-leaf',
          tpl: _self.get('subMenuItemTpl')
        };
      return BUI.mix(cfg, subItem);
    }
  }, {
    ATTRS: {
      defaultChildCfg: {
        value: {
          subMenuType: 'menu',
          openable: false,
          arrowTpl: ''
        }
      },
      /**
       * 配置的items 项是在初始化时作为children
       * @protected
       * @type {Boolean}
       */
      autoInitItems: {
        value: false
      },
      /**
       * 菜单项的模板
       * @type {String}
       */
      itemTpl: {
        value: '<div class="' + CLS_MENU_TITLE + '"><s></s><span class="' + CLS_MENU_TITLE + '-text">{text}</span></div>'
      },
      /**
       * 子菜单的选项模板
       * @cfg {String} subMenuTpl
       */
      subMenuItemTpl: {
        value: '<a href="{href}"><em>{text}</em></a>'
      },
      /**
       * 展开收缩的样式，用来触发展开折叠事件,默认是 'bui-menu-title'
       * @type {String}
       */
      collapsedCls: {
        value: CLS_MENU_TITLE
      },
      events: {
        value: {
          /**
           * 点击菜单项
           * @name BUI.Menu.SideMenu#menuclick
           * @event
           * @param {Object} e 事件对象
           * @param {Object} e.item 当前选中的项
           */
          'menuclick': false
        }
      }
    }
  }, {
    xclass: 'side-menu'
  });
  module.exports = sideMenu;
});
define("bui/tab", ["bui/common", "jquery", "bui/menu"], function(require, exports, module) {
  /**
   * @fileOverview 切换标签入口
   * @ignore
   */
  var BUI = require("bui/common"),
    Tab = BUI.namespace('Tab');
  BUI.mix(Tab, {
    Tab: require("bui/tab/tab"),
    TabItem: require("bui/tab/tabitem"),
    NavTabItem: require("bui/tab/navtabitem"),
    NavTab: require("bui/tab/navtab"),
    TabPanel: require("bui/tab/tabpanel"),
    TabPanelItem: require("bui/tab/tabpanelitem")
  });
  module.exports = Tab;
});
define("bui/tab/tab", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 切换标签
   * @ignore
   */
  var BUI = require("bui/common"),
    Component = BUI.Component,
    UIBase = Component.UIBase;
  /**
   * 列表
   * xclass:'tab'
   * <pre><code>
   * BUI.use('bui/tab',function(Tab){
   *
   *     var tab = new Tab.Tab({
   *         render : '#tab',
   *         elCls : 'nav-tabs',
   *         autoRender: true,
   *         children:[
   *           {text:'标签一',value:'1'},
   *           {text:'标签二',value:'2'},
   *           {text:'标签三',value:'3'}
   *         ]
   *       });
   *     tab.on('selectedchange',function (ev) {
   *       var item = ev.item;
   *       $('#log').text(item.get('text') + ' ' + item.get('value'));
   *     });
   *     tab.setSelected(tab.getItemAt(0)); //设置选中第一个
   *
   *   });
   *  </code></pre>
   * @class BUI.Tab.Tab
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ChildList
   */
  var tab = Component.Controller.extend([UIBase.ChildList], {}, {
    ATTRS: {
      elTagName: {
        view: true,
        value: 'ul'
      },
      /**
       * 子类的默认类名，即类的 xclass
       * @type {String}
       * @override
       * @default 'tab-item'
       */
      defaultChildClass: {
        value: 'tab-item'
      }
    }
  }, {
    xclass: 'tab'
  });
  module.exports = tab;
});
define("bui/tab/tabitem", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview
   * @ignore
   */
  var BUI = require("bui/common"),
    Component = BUI.Component,
    UIBase = Component.UIBase;
  /**
   * @private
   * @class BUI.Tab.TabItemView
   * @extends BUI.Component.View
   * @mixins BUI.Component.UIBase.ListItemView
   * 标签项的视图层对象
   */
  var itemView = Component.View.extend([UIBase.ListItemView], {}, {
    xclass: 'tab-item-view'
  });
  /**
   * 标签项
   * @class BUI.Tab.TabItem
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ListItem
   */
  var item = Component.Controller.extend([UIBase.ListItem], {}, {
    ATTRS: {
      elTagName: {
        view: true,
        value: 'li'
      },
      xview: {
        value: itemView
      },
      tpl: {
        view: true,
        value: '<span class="bui-tab-item-text">{text}</span>'
      }
    }
  }, {
    xclass: 'tab-item'
  });
  item.View = itemView;
  module.exports = item;
});
define("bui/tab/navtabitem", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 导航项
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    CLS_ITEM_TITLE = 'tab-item-title',
    CLS_ITEM_CLOSE = 'tab-item-close',
    CLS_ITEM_INNER = 'tab-item-inner',
    CLS_NAV_ACTIVED = 'tab-nav-actived',
    CLS_CONTENT = 'tab-content';
  /**
   * 导航标签项的视图类
   * @class BUI.Tab.NavTabItemView
   * @extends BUI.Component.View
   * @private
   */
  var navTabItemView = Component.View.extend({
    renderUI: function() {
      var _self = this,
        contentContainer = _self.get('tabContentContainer'),
        contentTpl = _self.get('tabContentTpl');
      if (contentContainer) {
        var tabContentEl = $(contentTpl).appendTo(contentContainer);
        _self.set('tabContentEl', tabContentEl);
      }
    },
    //设置链接地址
    _uiSetHref: function(v) {
      this._setHref(v);
    },
    _setHref: function(href) {
      var _self = this,
        tabContentEl = _self.get('tabContentEl');
      href = href || _self.get('href');
      if (tabContentEl) {
        $('iframe', tabContentEl).attr('src', href);
      }
    },
    resetHref: function() {
      this._setHref();
    },
    //设置标题
    _uiSetTitle: function(v) {
      var _self = this,
        el = _self.get('el');
      //el.attr('title',v);
      $('.' + CLS_ITEM_TITLE, el).html(v);
    },
    _uiSetActived: function(v) {
      var _self = this,
        el = _self.get('el');
      _self.setTabContentVisible(v);
      if (v) {
        el.addClass(CLS_NAV_ACTIVED);
      } else {
        el.removeClass(CLS_NAV_ACTIVED);
      }
    },
    //析构函数
    destructor: function() {
      var _self = this,
        tabContentEl = _self.get('tabContentEl');
      if (tabContentEl) {
        tabContentEl.remove();
      }
    },
    //设置标签内容是否可见
    setTabContentVisible: function(v) {
      var _self = this,
        tabContentEl = _self.get('tabContentEl');
      if (tabContentEl) {
        if (v) {
          tabContentEl.show();
        } else {
          tabContentEl.hide();
        }
      }
    }
  }, {
    ATTRS: {
      tabContentContainer: {},
      tabContentEl: {},
      title: {},
      href: {}
    }
  });
  /**
   * 导航标签项
   * xclass : 'nav-tab-item'
   * @class BUI.Tab.NavTabItem
   * @extends BUI.Component.Controller
   */
  var navTabItem = Component.Controller.extend({
    /**
     * 创建DOM
     * @protected
     */
    createDom: function() {
      var _self = this,
        parent = _self.get('parent');
      if (parent) {
        _self.set('tabContentContainer', parent.getTabContentContainer());
      }
    },
    /**
     * 绑定事件
     * @protected
     */
    bindUI: function() {
      var _self = this,
        el = _self.get('el'),
        events = _self.get('events');
      el.on('click', function(ev) {
        var sender = $(ev.target);
        if (sender.hasClass(CLS_ITEM_CLOSE)) {
          if (_self.fire('closing') !== false) {
            _self.close();
          }
        }
      });
    },
    /**
     * 处理双击
     * @protected
     */
    handleDblClick: function(ev) {
      var _self = this;
      if (_self.get('closeable') && _self.fire('closing') !== false) {
        _self.close();
      }
      _self.fire('dblclick', {
        domTarget: ev.target,
        domEvent: ev
      });
    },
    /**
     * 处理右键
     * @protected
     */
    handleContextMenu: function(ev) {
      ev.preventDefault();
      this.fire('showmenu', {
        position: {
          x: ev.pageX,
          y: ev.pageY
        }
      });
    },
    /**
     * 设置标题
     * @param {String} title 标题
     */
    setTitle: function(title) {
      this.set('title', title);
    },
    /**
     * 关闭
     */
    close: function() {
      this.fire('closed');
    },
    /**
     * 重新加载页面
     */
    reload: function() {
      this.get('view').resetHref();
    },
    /**
     * @protected
     * @ignore
     */
    show: function() {
      var _self = this;
      _self.get('el').show(500, function() {
        _self.set('visible', true);
      });
    },
    /**
     * @protected
     * @ignore
     */
    hide: function(callback) {
      var _self = this;
      this.get('el').hide(500, function() {
        _self.set('visible', false);
        callback && callback();
      });
    },
    _uiSetActived: function(v) {
      var _self = this,
        parent = _self.get('parent');
      if (parent && v) {
        parent._setItemActived(_self);
      }
    },
    _uiSetCloseable: function(v) {
      var _self = this,
        el = _self.get('el'),
        closeEl = el.find('.' + CLS_ITEM_CLOSE);
      if (v) {
        closeEl.show();
      } else {
        closeEl.hide();
      }
    }
  }, {
    ATTRS: {
      elTagName: {
        value: 'li'
      },
      /**
       * 标签是否选中
       * @type {Boolean}
       */
      actived: {
        view: true,
        value: false
      },
      /**
       * 是否可关闭
       * @type {Boolean}
       */
      closeable: {
        value: true
      },
      allowTextSelection: {
        view: false,
        value: false
      },
      events: {
        value: {
          /**
           * 点击菜单项
           * @name BUI.Tab.NavTabItem#click
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.target 正在点击的标签
           */
          'click': true,
          /**
           * 正在关闭，返回false可以阻止关闭事件发生
           * @name BUI.Tab.NavTabItem#closing
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.target 正在关闭的标签
           */
          'closing': true,
          /**
           * 关闭事件
           * @name BUI.Tab.NavTabItem#closed
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.target 关闭的标签
           */
          'closed': true,
          /**
           * @name BUI.Tab.NavTabItem#showmenu
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.target 显示菜单的标签
           */
          'showmenu': true,
          'afterVisibleChange': true
        }
      },
      /**
       * @private
       * @type {Object}
       */
      tabContentContainer: {
        view: true
      },
      /**
       * @private
       * @type {Object}
       */
      tabContentTpl: {
        view: true,
        value: '<div class="' + CLS_CONTENT + '" style="display:none;"><iframe src="" width="100%" height="100%" frameborder="0"></iframe></div>'
      },
      /**
       * 标签页指定的URL
       * @cfg {String} href
       */
      /**
       * 标签页指定的URL
       * @type {String}
       */
      href: {
        view: true,
        value: ''
      },
      visible: {
        view: true,
        value: true
      },
      /**
       * 标签文本
       * @cfg {String} title
       */
      /**
       * 标签文本
       * tab.getItem('id').set('title','new title');
       * @type {String}
       * @default ''
       */
      title: {
        view: true,
        value: ''
      },
      tpl: {
        view: true,
        value: '<s class="l"></s><div class="' + CLS_ITEM_INNER + '">{icon}<span class="' + CLS_ITEM_TITLE + '"></span><s class="' + CLS_ITEM_CLOSE + '"></s></div><s class="r"></s>'
      },
      xview: {
        value: navTabItemView
      }
    }
  }, {
    xclass: 'nav-tab-item',
    priority: 0
  });
  navTabItem.View = navTabItemView;
  module.exports = navTabItem;
});
define("bui/tab/navtab", ["bui/common", "jquery", "bui/menu"], function(require, exports, module) {
  /**
   * @fileOverview 导航标签
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    Menu = require("bui/menu"),
    Component = BUI.Component,
    CLS_NAV_LIST = 'tab-nav-list',
    CLS_ARROW_LEFT = 'arrow-left',
    CLS_ARROW_RIGHT = 'arrow-right',
    CLS_FORCE_FIT = BUI.prefix + 'tab-force',
    ID_CLOSE = 'm_close',
    ITEM_WIDTH = 140;
  /**
   * 导航标签的视图类
   * @class BUI.Tab.NavTabView
   * @extends BUI.Component.View
   * @private
   */
  var navTabView = Component.View.extend({
    renderUI: function() {
      var _self = this,
        el = _self.get('el'),
        listEl = null;
      listEl = el.find('.' + CLS_NAV_LIST);
      _self.setInternal('listEl', listEl);
    },
    getContentElement: function() {
      return this.get('listEl');
    },
    getTabContentContainer: function() {
      return this.get('el').find('.tab-content-container');
    },
    _uiSetHeight: function(v) {
      var _self = this,
        el = _self.get('el'),
        barEl = el.find('.tab-nav-bar'),
        containerEl = _self.getTabContentContainer();
      if (v) {
        containerEl.height(v - barEl.height());
      }
      el.height(v);
    },
    //设置自动适应宽度
    _uiSetForceFit: function(v) {
      var _self = this,
        el = _self.get('el');
      if (v) {
        el.addClass(CLS_FORCE_FIT);
      } else {
        el.removeClass(CLS_FORCE_FIT);
      }
    }
  }, {
    ATTRS: {
      forceFit: {}
    }
  }, {
    xclass: 'nav-tab-view',
    priority: 0
  });
  /**
   * 导航标签
   * @class BUI.Tab.NavTab
   * @extends BUI.Component.Controller
   */
  var navTab = Component.Controller.extend({
    /**
     * 添加标签项
     * @param {Object} config 菜单项的配置项
     * @param {Boolean} reload 如果标签页已存在，则重新加载
     */
    addTab: function(config, reload) {
      var _self = this,
        id = config.id || BUI.guid('tab-item'),
        forceFit = _self.get('forceFit'),
        item = _self.getItemById(id);
      if (item) {
        var hrefChage = false;
        if (config.href && item.get('href') != config.href) {
          item.set('href', config.href);
          hrefChage = true;
        }
        _self._setItemActived(item);
        if (reload && !hrefChage) {
          item.reload();
        }
      } else {
        config = BUI.mix({
          id: id,
          visible: false,
          actived: true,
          xclass: 'nav-tab-item'
        }, config);
        item = _self.addChild(config);
        if (forceFit) {
          _self.forceFit();
        }
        item.show();
        _self._resetItemList();
      }
      return item;
    },
    /**
     * 获取导航标签，存放内容的节点
     * @return {jQuery} 导航内容的容器
     */
    getTabContentContainer: function() {
      return this.get('view').getTabContentContainer();
    },
    //绑定事件
    bindUI: function() {
      var _self = this,
        forceFit = _self.get('forceFit');
      if (!forceFit) {
        _self._bindScrollEvent();
        _self.on('afterVisibleChange', function(ev) {
          var item = ev.target;
          if (item.get('actived')) {
            _self._scrollToItem(item);
          }
        });
      }
      //监听点击标签
      _self.on('click', function(ev) {
        var item = ev.target;
        if (item != _self) {
          _self._setItemActived(item);
          _self.fire('itemclick', {
            item: item
          });
        }
      });
      //关闭标签
      _self.on('closed', function(ev) {
        var item = ev.target;
        _self._closeItem(item);
      });
      _self.on('showmenu', function(ev) {
        _self._showMenu(ev.target, ev.position);
      });
    },
    //绑定滚动事件
    _bindScrollEvent: function() {
      var _self = this,
        el = _self.get('el');
      el.find('.arrow-left').on('click', function() {
        if (el.hasClass(CLS_ARROW_LEFT + '-active')) {
          _self._scrollLeft();
        }
      });
      el.find('.arrow-right').on('click', function() {
        if (el.hasClass(CLS_ARROW_RIGHT + '-active')) {
          _self._scrllRight();
        }
      });
    },
    _showMenu: function(item, position) {
      var _self = this,
        menu = _self._getMenu(),
        closeable = item.get('closeable'),
        closeItem;
      _self.set('showMenuItem', item);
      menu.set('xy', [position.x, position.y]);
      menu.show();
      closeItem = menu.getItem(ID_CLOSE);
      if (closeItem) {
        closeItem.set('disabled', !closeable);
      }
    },
    /**
     * 通过id,设置选中的标签项
     * @param {String} id 标签编号
     */
    setActived: function(id) {
      var _self = this,
        item = _self.getItemById(id);
      _self._setItemActived(item);
    },
    /**
     * 获取当前选中的标签项
     * @return {BUI.Tab.NavTabItem} 选中的标签对象
     */
    getActivedItem: function() {
      var _self = this,
        children = _self.get('children'),
        result = null;
      BUI.each(children, function(item) {
        if (item.get('actived')) {
          result = item;
          return false;
        }
      });
      return result;
    },
    /**
     * 通过编号获取标签项
     * @param  {String} id 标签项的编号
     * @return {BUI.Tab.NavTabItem} 标签项对象
     */
    getItemById: function(id) {
      var _self = this,
        children = _self.get('children'),
        result = null;
      BUI.each(children, function(item) {
        if (item.get('id') === id) {
          result = item;
          return false;
        }
      });
      return result;
    },
    _getMenu: function() {
      var _self = this;
      return _self.get('menu') || _self._initMenu();
    },
    _initMenu: function() {
      var _self = this,
        menu = new Menu.ContextMenu({
          children: [{
            xclass: 'context-menu-item',
            iconCls: 'icon icon-refresh',
            text: '刷新',
            listeners: {
              'click': function() {
                var item = _self.get('showMenuItem');
                if (item) {
                  item.reload();
                }
              }
            }
          }, {
            id: ID_CLOSE,
            xclass: 'context-menu-item',
            iconCls: 'icon icon-remove',
            text: '关闭',
            listeners: {
              'click': function() {
                var item = _self.get('showMenuItem');
                if (item) {
                  item.close();
                }
              }
            }
          }, {
            xclass: 'context-menu-item',
            iconCls: 'icon icon-remove-sign',
            text: '关闭其他',
            listeners: {
              'click': function() {
                var item = _self.get('showMenuItem');
                if (item) {
                  _self.closeOther(item);
                }
              }
            }
          }, {
            xclass: 'context-menu-item',
            iconCls: 'icon icon-remove-sign',
            text: '关闭所有',
            listeners: {
              'click': function() {
                _self.closeAll();
              }
            }
          }]
        });
      _self.set('menu', menu);
      return menu;
    },
    //关闭标签项
    _closeItem: function(item) {
      var _self = this,
        index = _self._getIndex(item),
        activedItem = _self.getActivedItem(),
        preItem = _self.get('preItem') || _self._getItemByIndex(index - 1),
        nextItem = _self._getItemByIndex(index + 1);
      item.hide(function() {
        _self.removeChild(item, true);
        _self._resetItemList();
        if (activedItem === item) {
          if (preItem) {
            _self._setItemActived(preItem);
          } else {
            _self._setItemActived(nextItem);
          }
        } else { //删除标签项时，可能会引起滚动按钮状态的改变
          _self._scrollToItem(activedItem);;
        }
        _self.forceFit();
      });
    },
    closeAll: function() {
      var _self = this,
        children = _self.get('children');
      BUI.each(children, function(item) {
        if (item.get('closeable')) {
          item.close();
        }
      });
    },
    closeOther: function(curItem) {
      var _self = this,
        children = _self.get('children');
      BUI.each(children, function(item) {
        if (curItem !== item) {
          item.close();
        }
      });
    },
    //通过位置查找标签项
    _getItemByIndex: function(index) {
      var _self = this,
        children = _self.get('children');
      return children[index];
    },
    //获取标签项的位置
    _getIndex: function(item) {
      var _self = this,
        children = _self.get('children');
      return BUI.Array.indexOf(item, children);
    },
    //重新计算标签项容器的宽度位置
    _resetItemList: function() {
      if (this.get('forceFit')) {
        return;
      }
      var _self = this,
        container = _self.getContentElement();
      container.width(_self._getTotalWidth());
    },
    //获取选项的总宽度，以默认宽度为基数
    _getTotalWidth: function() {
      var _self = this,
        children = _self.get('children');
      return children.length * _self.get('itemWidth');
    },
    _getForceItemWidth: function() {
      var _self = this,
        width = _self.getContentElement().width(),
        children = _self.get('children'),
        totalWidth = _self._getTotalWidth(),
        itemWidth = _self.get(itemWidth);
      if (totalWidth > width) {
        itemWidth = width / children.length;
      }
      return itemWidth;
    },
    forceFit: function() {
      var _self = this;
      _self._forceItemWidth(_self._getForceItemWidth());
    },
    //设置平均宽度
    _forceItemWidth: function(width) {
      width = width || this.get('itemWidth');
      var _self = this,
        children = _self.get('children');
      BUI.each(children, function(item) {
        item.set('width', width);
      });
    },
    //使指定标签项在用户可视区域内
    _scrollToItem: function(item) {
      if (this.get('forceFit')) { //自适应后，不进行滚动
        return;
      }
      var _self = this,
        container = _self.getContentElement(),
        containerPosition = container.position(),
        disWidth = _self._getDistanceToEnd(item, container, containerPosition),
        disBegin = _self._getDistanceToBegin(item, containerPosition); //当前活动的项距离最右端的距离
      //如果标签项列表小于整个标签容器的大小，则左对齐
      if (container.width() < container.parent().width()) {
        _self._scrollTo(container, 0);
      } else if (disBegin < 0) { //如果左边被遮挡，向右移动
        _self._scrollTo(container, containerPosition.left - (disBegin));
      } else if (disWidth > 0) { //如果当前节点被右端遮挡，则向左滚动到显示位置
        _self._scrollTo(container, containerPosition.left + (disWidth) * -1);
      } else if (containerPosition.left < 0) { //将左边移动，使最后一个标签项离右边最近
        var lastDistance = _self._getLastDistance(container, containerPosition),
          toLeft = 0;
        if (lastDistance < 0) {
          toLeft = containerPosition.left - lastDistance;
          toLeft = toLeft < 0 ? toLeft : 0;
          _self._scrollTo(container, toLeft);
        }
      }
    },
    //获取标签到最左端的距离
    _getDistanceToBegin: function(item, containerPosition) {
      var position = item.get('el').position();
      return position.left + containerPosition.left;
    },
    /**
     * 获取标签到最右端的距离
     * @return  {Number} 像素
     * @private
     */
    _getDistanceToEnd: function(item, container, containerPosition) {
      var _self = this,
        container = container || _self.getContentElement(),
        wraperWidth = container.parent().width(),
        containerPosition = containerPosition || container.position(),
        offsetLeft = _self._getDistanceToBegin(item, containerPosition),
        disWidth = offsetLeft + _self.get('itemWidth') - wraperWidth;
      return disWidth;
    },
    //获取最后一个标签项离右边的间距
    _getLastDistance: function(container, containerPosition) {
      var _self = this,
        children = _self.get('children'),
        lastItem = children[children.length - 1];
      if (lastItem) {
        return _self._getDistanceToEnd(lastItem, container, containerPosition);
      }
      return 0;
    },
    _scrollTo: function(el, left, callback) {
      var _self = this;
      el.animate({
        left: left
      }, 500, function() {
        _self._setArrowStatus(el);
      });
    },
    _scrollLeft: function() {
      var _self = this,
        container = _self.getContentElement(),
        position = container.position(),
        disWidth = _self._getLastDistance(container, position),
        toLeft;
      if (disWidth > 0) {
        toLeft = disWidth > _self.get('itemWidth') ? _self.get('itemWidth') : disWidth;
        _self._scrollTo(container, position.left - toLeft);
      }
    },
    //向右滚动
    _scrllRight: function() {
      var _self = this,
        container = _self.getContentElement(),
        position = container.position(),
        toRight;
      if (position.left < 0) {
        toRight = position.left + _self.get('itemWidth');
        toRight = toRight < 0 ? toRight : 0;
        _self._scrollTo(container, toRight);
      }
    },
    //设置向左，向右的箭头是否可用
    _setArrowStatus: function(container, containerPosition) {
      container = container || this.getContentElement();
      var _self = this,
        wapperEl = _self.get('el'),
        position = containerPosition || container.position(),
        disWidth = _self._getLastDistance(container, containerPosition);
      //可以向左边滚动
      if (position.left < 0) {
        wapperEl.addClass(CLS_ARROW_RIGHT + '-active');
      } else {
        wapperEl.removeClass(CLS_ARROW_RIGHT + '-active');
      }
      if (disWidth > 0) {
        wapperEl.addClass(CLS_ARROW_LEFT + '-active');
      } else {
        wapperEl.removeClass(CLS_ARROW_LEFT + '-active');
      }
    },
    //设置当前选中的标签
    _setItemActived: function(item) {
      var _self = this,
        preActivedItem = _self.getActivedItem();
      if (item === preActivedItem) {
        return;
      }
      if (preActivedItem) {
        preActivedItem.set('actived', false);
      }
      _self.set('preItem', preActivedItem);
      if (item) {
        if (!item.get('actived')) {
          item.set('actived', true);
        }
        //当标签项可见时，否则无法计算位置信息
        if (item.get('visible')) {
          _self._scrollToItem(item);
        }
        //为了兼容原先代码
        _self.fire('activeChange', {
          item: item
        });
        _self.fire('activedchange', {
          item: item
        });
      }
    }
  }, {
    ATTRS: {
      defaultChildClass: {
        value: 'nav-tab-item'
      },
      /**
       * @private
       * 右键菜单
       * @type {Object}
       */
      menu: {},
      /**
       * 设置此参数时，标签选项的宽度会进行自适应
       * @cfg {Boolean} forceFit
       */
      forceFit: {
        view: true,
        value: false
      },
      /**
       * 标签的默认宽度,140px，设置forceFit:true后，此宽度为最宽宽度
       * @type {Number}
       */
      itemWidth: {
        value: ITEM_WIDTH
      },
      /**
       * 渲染标签的模版
       * @type {String}
       */
      tpl: {
        view: true,
        value: '<div class="tab-nav-bar">' + '<s class="tab-nav-arrow arrow-left"></s><div class="tab-nav-wrapper"><div class="tab-nav-inner"><ul class="' + CLS_NAV_LIST + '"></ul></div></div><s class="tab-nav-arrow arrow-right"></s>' + '</div>' + '<div class="tab-content-container"></div>'
      },
      xview: {
        value: navTabView
      },
      events: {
        value: {
          /**
           * 点击标签项
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.item 标签项
           */
          'itemclick': false,
          /**
           * 标签项激活改变
           * @event
           * @param {Object} e 事件对象
           * @param {BUI.Tab.NavTabItem} e.item 标签项
           */
          activedchange: false
        }
      }
    }
  }, {
    xclass: 'nav-tab',
    priority: 0
  });
  module.exports = navTab;
});
define("bui/tab/tabpanel", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 每个标签对应一个面板
   * @ignore
   */
  var BUI = require("bui/common"),
    Tab = require("bui/tab/tab"),
    Panels = require("bui/tab/panels");
  /**
   * 带有面板的切换标签
   * <pre><code>
   * BUI.use('bui/tab',function(Tab){
   *
   *     var tab = new Tab.TabPanel({
   *       render : '#tab',
   *       elCls : 'nav-tabs',
   *       panelContainer : '#panel',
   *       autoRender: true,
   *       children:[
   *         {text:'源代码',value:'1'},
   *         {text:'HTML',value:'2'},
   *         {text:'JS',value:'3'}
   *       ]
   *     });
   *     tab.setSelected(tab.getItemAt(0));
   *   });
   * </code></pre>
   * @class BUI.Tab.TabPanel
   * @extends BUI.Tab.Tab
   * @mixins BUI.Tab.Panels
   */
  var tabPanel = Tab.extend([Panels], {
    bindUI: function() {
      var _self = this;
      //关闭标签
      _self.on('beforeclosed', function(ev) {
        var item = ev.target;
        _self._beforeClosedItem(item);
      });
    },
    //关闭标签选项前
    _beforeClosedItem: function(item) {
      if (!item.get('selected')) { //如果未选中不执行下面的选中操作
        return;
      }
      var _self = this,
        index = _self.indexOfItem(item),
        count = _self.getItemCount(),
        preItem,
        nextItem;
      if (index !== count - 1) { //不是最后一个，则激活最后一个
        nextItem = _self.getItemAt(index + 1);
        _self.setSelected(nextItem);
      } else if (index !== 0) {
        preItem = _self.getItemAt(index - 1);
        _self.setSelected(preItem);
      }
    }
  }, {
    ATTRS: {
      elTagName: {
        value: 'div'
      },
      childContainer: {
        value: 'ul'
      },
      tpl: {
        value: '<div class="tab-panel-inner"><ul></ul><div class="tab-panels"></div></div>'
      },
      panelTpl: {
        value: '<div></div>'
      },
      /**
       * 默认的面板容器
       * @cfg {String} [panelContainer='.tab-panels']
       */
      panelContainer: {
        value: '.tab-panels'
      },
      /**
       * 默认子控件的xclass
       * @type {String}
       */
      defaultChildClass: {
        value: 'tab-panel-item'
      }
    }
  }, {
    xclass: 'tab-panel'
  });
  module.exports = tabPanel;
});
define("bui/tab/panels", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 拥有多个面板的容器
   * @ignore
   */
  var $ = require('jquery');
  /**
   * @class BUI.Tab.Panels
   * 包含面板的标签的扩展类
   */
  var Panels = function() {
    //this._initPanels();
  };
  Panels.ATTRS = {
    /**
     * 面板的模板
     * @type {String}
     */
    panelTpl: {},
    /**
     * 面板的容器，如果是id直接通过id查找，如果是非id，那么从el开始查找,例如：
     *   -#id ： 通过$('#id')查找
     *   -.cls : 通过 this.get('el').find('.cls') 查找
     *   -DOM/jQuery ：不需要查找
     * @type {String|HTMLElement|jQuery}
     */
    panelContainer: {},
    /**
     * panel 面板使用的样式，如果初始化时，容器内已经存在有该样式的DOM，则作为面板使用
     * 对应同一个位置的标签项,如果为空，默认取面板容器的子元素
     * @type {String}
     */
    panelCls: {}
  };
  BUI.augment(Panels, {
    __renderUI: function() {
      var _self = this,
        children = _self.get('children'),
        panelContainer = _self._initPanelContainer(),
        panelCls = _self.get('panelCls'),
        panels = panelCls ? panelContainer.find('.' + panels) : panelContainer.children();
      BUI.each(children, function(item, index) {
        var panel = panels[index];
        _self._initPanelItem(item, panel);
      });
    },
    __bindUI: function() {
      var _self = this;
      _self.on('beforeAddChild', function(ev) {
        var item = ev.child;
        _self._initPanelItem(item);
      });
    },
    //初始化容器
    _initPanelContainer: function() {
      var _self = this,
        panelContainer = _self.get('panelContainer');
      if (panelContainer && BUI.isString(panelContainer)) {
        if (panelContainer.indexOf('#') == 0) { //如果是id
          panelContainer = $(panelContainer);
        } else {
          panelContainer = _self.get('el').find(panelContainer);
        }
        _self.setInternal('panelContainer', panelContainer);
      }
      return panelContainer;
    },
    //初始化面板配置信息
    _initPanelItem: function(item, panel) {
      var _self = this;
      if (item.set) {
        if (!item.get('panel')) {
          panel = panel || _self._getPanel(item.get('userConfig'));
          item.set('panel', panel);
        }
      } else {
        if (!item.panel) {
          panel = panel || _self._getPanel(item);
          item.panel = panel;
        }
      }
    },
    //获取面板
    _getPanel: function(item) {
      var _self = this,
        panelContainer = _self.get('panelContainer'),
        panelTpl = BUI.substitute(_self.get('panelTpl'), item);
      return $(panelTpl).appendTo(panelContainer);
    }
  });
  module.exports = Panels;
});
define("bui/tab/tabpanelitem", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview
   * @ignore
   */
  var BUI = require("bui/common"),
    TabItem = require("bui/tab/tabitem"),
    PanelItem = require("bui/tab/panelitem"),
    CLS_TITLE = 'bui-tab-item-text',
    Component = BUI.Component;
  /**
   * @private
   * @class BUI.Tab.TabPanelItemView
   * @extends BUI.Tab.TabItemView
   * 存在面板的标签项视图层对象
   */
  var itemView = TabItem.View.extend([Component.UIBase.Close.View], {
    _uiSetTitle: function(v) {
      var _self = this,
        el = _self.get('el'),
        titleEl = el.find('.' + CLS_TITLE);
      titleEl.text(v);
    }
  }, {
    xclass: 'tab-panel-item-view'
  });
  /**
   * 标签项
   * @class BUI.Tab.TabPanelItem
   * @extends BUI.Tab.TabItem
   * @mixins BUI.Tab.PanelItem
   * @mixins BUI.Component.UIBase.Close
   */
  var item = TabItem.extend([PanelItem, Component.UIBase.Close], {}, {
    ATTRS: {
      /**
       * 关闭时直接销毁标签项，执行remove方法
       * @type {String}
       */
      closeAction: {
        value: 'remove'
      },
      /**
       * 标题
       * @cfg {String} title
       */
      /**
       * 标题
       * @type {String}
       * <code>
       *   tab.getItem('id').set('title','new title');
       * </code>
       */
      title: {
        view: true,
        sync: false
      },
      /**
       * 标签项的模板,因为之前没有title属性，所以默认用text，所以也兼容text，但是在最好直接使用title，方便更改
       * @type {String}
       */
      tpl: {
        value: '<span class="' + CLS_TITLE + '">{text}{title}</span>'
      },
      closeable: {
        value: false
      },
      events: {
        value: {
          beforeclosed: true
        }
      },
      xview: {
        value: itemView
      }
    }
  }, {
    xclass: 'tab-panel-item'
  });
  item.View = itemView;
  module.exports = item;
});
define("bui/tab/panelitem", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 拥有内容的标签项的扩展类，每个标签项都有一个分离的容器作为面板
   * @ignore
   */
  var $ = require('jquery');
  /**
   * @class BUI.Tab.PanelItem
   * 包含面板的标签项的扩展
   */
  var PanelItem = function() {};
  PanelItem.ATTRS = {
    /**
     * 标签项对应的面板容器，当标签选中时，面板显示
     * @cfg {String|HTMLElement|jQuery} panel
     * @internal 面板属性一般由 tabPanel设置而不应该由用户手工设置
     */
    /**
     * 标签项对应的面板容器，当标签选中时，面板显示
     * @type {String|HTMLElement|jQuery}
     * @readOnly
     */
    panel: {},
    /**
     * 面板的内容
     * @type {String}
     */
    panelContent: {},
    /**
     * 关联面板显示隐藏的属性名
     * @protected
     * @type {string}
     */
    panelVisibleStatus: {
      value: 'selected'
    },
    /**
     * 默认的加载控件内容的配置,默认值：
     * <pre>
     *  {
     *   property : 'panelContent',
     *   lazyLoad : {
     *       event : 'active'
     *   },
     *     loadMask : {
     *       el : _self.get('panel')
     *   }
     * }
     * </pre>
     * @type {Object}
     */
    defaultLoaderCfg: {
      valueFn: function() {
        var _self = this,
          eventName = _self._getVisibleEvent();
        return {
          property: 'panelContent',
          autoLoad: false,
          lazyLoad: {
            event: eventName
          },
          loadMask: {
            el: _self.get('panel')
          }
        }
      }
    },
    /**
     * 面板是否跟随标签一起释放
     * @type {Boolean}
     */
    panelDestroyable: {
      value: true
    }
  }
  BUI.augment(PanelItem, {
    __renderUI: function() {
      this._resetPanelVisible();
    },
    __bindUI: function() {
      var _self = this,
        eventName = _self._getVisibleEvent();
      _self.on(eventName, function(ev) {
        _self._setPanelVisible(ev.newVal);
      });
    },
    _resetPanelVisible: function() {
      var _self = this,
        status = _self.get('panelVisibleStatus'),
        visible = _self.get(status);
      _self._setPanelVisible(visible);
    },
    //获取显示隐藏的事件
    _getVisibleEvent: function() {
      var _self = this,
        status = _self.get('panelVisibleStatus');
      return 'after' + BUI.ucfirst(status) + 'Change';;
    },
    /**
     * @private
     * 设置面板的可见
     * @param {Boolean} visible 显示或者隐藏
     */
    _setPanelVisible: function(visible) {
      var _self = this,
        panel = _self.get('panel'),
        method = visible ? 'show' : 'hide';
      if (panel) {
        $(panel)[method]();
      }
    },
    __destructor: function() {
      var _self = this,
        panel = _self.get('panel');
      if (panel && _self.get('panelDestroyable')) {
        $(panel).remove();
      }
    },
    _setPanelContent: function(panel, content) {
      var panelEl = $(panel);
      $(panel).html(content);
    },
    _uiSetPanelContent: function(v) {
      var _self = this,
        panel = _self.get('panel');
      //$(panel).html(v);
      _self._setPanelContent(panel, v);
    },
    //设置panel
    _uiSetPanel: function(v) {
      var _self = this,
        content = _self.get('panelContent');
      if (content) {
        _self._setPanelContent(v, content);
      }
      _self._resetPanelVisible();
    }
  });
  module.exports = PanelItem;
});
define("bui/mask", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview Mask的入口文件
   * @ignore
   */
  var BUI = require("bui/common"),
    Mask = require("bui/mask/mask");
  Mask.LoadMask = require("bui/mask/loadmask");
  module.exports = Mask;
});
define("bui/mask/mask", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview Mask屏蔽层
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Mask = BUI.namespace('Mask'),
    UA = BUI.UA,
    CLS_MASK = BUI.prefix + 'ext-mask',
    CLS_MASK_MSG = CLS_MASK + '-msg';
  BUI.mix(Mask,
    /**
     * 屏蔽层
     * <pre><code>
     * BUI.use('bui/mask',function(Mask){
     *   Mask.maskElement('#domId'); //屏蔽dom
     *   Mask.unmaskElement('#domId'); //解除DOM屏蔽
     * });
     * </code></pre>
     * @class BUI.Mask
     * @singleton
     */
    {
      /**
       * @description 屏蔽指定元素
       * @param {String|HTMLElement} element 被屏蔽的元素
       * @param {String} [msg] 屏蔽元素时显示的文本
       * @param {String} [msgCls] 显示文本应用的样式
       * <pre><code>
       *   BUI.Mask.maskElement('#domId');
       *   BUI.Mask.maskElement('body'); //屏蔽整个窗口
       * </code></pre>
       */
      maskElement: function(element, msg, msgCls) {
        var maskedEl = $(element),
          maskDiv = maskedEl.children('.' + CLS_MASK),
          tpl = null,
          msgDiv = null,
          top = null,
          left = null;
        if (!maskDiv.length) {
          maskDiv = $('<div class="' + CLS_MASK + '"></div>').appendTo(maskedEl);
          maskedEl.addClass('x-masked-relative x-masked');
          //屏蔽整个窗口
          if (element == 'body') {
            if (UA.ie == 6) {
              maskDiv.height(BUI.docHeight());
            } else {
              maskDiv.css('position', 'fixed');
            }
          } else {
            if (UA.ie === 6) {
              maskDiv.height(maskedEl.height());
            }
          }
          if (msg) {
            tpl = ['<div class="' + CLS_MASK_MSG + '"><div>', msg, '</div></div>'].join('');
            msgDiv = $(tpl).appendTo(maskedEl);
            if (msgCls) {
              msgDiv.addClass(msgCls);
            }
            try {
              //屏蔽整个窗口
              if (element == 'body' && UA.ie != 6) {
                top = '50%',
                  left = '50%';
                msgDiv.css('position', 'fixed');
              } else {
                top = (maskDiv.height() - msgDiv.height()) / 2;
                left = (maskDiv.width() - msgDiv.width()) / 2;
              }
              msgDiv.css({
                left: left,
                top: top
              });
            } catch (ex) {
              BUI.log('mask error occurred');
            }
          }
        }
        return maskDiv;
      },
      /**
       * @description 解除元素的屏蔽
       * @param {String|HTMLElement} element 屏蔽的元素
       * <pre><code>
       * BUI.Mask.unmaskElement('#domId');
       * </code></pre>
       */
      unmaskElement: function(element) {
        var maskedEl = $(element),
          msgEl = maskedEl.children('.' + CLS_MASK_MSG),
          maskDiv = maskedEl.children('.' + CLS_MASK);
        if (msgEl) {
          msgEl.remove();
        }
        if (maskDiv) {
          maskDiv.remove();
        }
        maskedEl.removeClass('x-masked-relative x-masked');
      }
    });
  module.exports = Mask;
});
define("bui/mask/loadmask", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 加载数据时屏蔽层
   * @ignore
   */
  var $ = require('jquery'),
    Mask = require("bui/mask/mask");
  /**
   * 屏蔽指定元素，并显示加载信息
   * <pre><code>
   * BUI.use('bui/mask',function(Mask){
   *  var loadMask = new Mask.LoadMask({
   *    el : '#domId',
   *    msg : 'loading ....'
   *  });
   *
   *  $('#btn').on('click',function(){
   *    loadMask.show();
   *  });
   *
   *  $('#btn1').on('click',function(){
   *    loadMask.hide();
   *  });
   * });
   * </code></pre>
   * @class BUI.Mask.LoadMask
   * @extends BUI.Base
   */
  function LoadMask(config) {
    var _self = this;
    LoadMask.superclass.constructor.call(_self, config);
  }
  BUI.extend(LoadMask, BUI.Base);
  LoadMask.ATTRS = {
    /**
     * 屏蔽的元素
     * <pre><code>
     *  var loadMask = new Mask.LoadMask({
     *    el : '#domId'
     *  });
     * </code></pre>
     * @cfg {jQuery} el
     */
    el: {},
    /**
     * 加载时显示的加载信息
     * <pre><code>
     *  var loadMask = new Mask.LoadMask({
     *    el : '#domId',
     *    msg : '正在加载，请稍后。。。'
     *  });
     * </code></pre>
     * @cfg {String} msg [msg = 'Loading...']
     */
    msg: {
      value: 'Loading...'
    },
    /**
     * 加载时显示的加载信息的样式
     * <pre><code>
     *  var loadMask = new Mask.LoadMask({
     *    el : '#domId',
     *    msgCls : 'custom-cls'
     *  });
     * </code></pre>
     * @cfg {String} [msgCls = 'x-mask-loading']
     */
    msgCls: {
      value: 'x-mask-loading'
    },
    /**
     * 加载控件是否禁用
     * @type {Boolean}
     * @field
     * @default false
     * @ignore
     */
    disabled: {
      value: false
    }
  };
  //对象原型
  BUI.augment(LoadMask, {
    /**
     * 设置控件不可用
     */
    disable: function() {
      this.set('disabled', true);
    },
    /**
     * @private 加载已经完毕，解除屏蔽
     */
    onLoad: function() {
      Mask.unmaskElement(this.get('el'));
    },
    /**
     * @private 开始加载，屏蔽当前元素
     */
    onBeforeLoad: function() {
      var _self = this;
      if (!_self.get('disabled')) {
        Mask.maskElement(_self.get('el'), _self.get('msg'), this.get('msgCls'));
      }
    },
    /**
     * 显示加载条，并遮盖元素
     */
    show: function() {
      this.onBeforeLoad();
    },
    /**
     * 隐藏加载条，并解除遮盖元素
     */
    hide: function() {
      this.onLoad();
    },
    /*
     * 清理资源
     */
    destroy: function() {
      this.hide();
      this.clearAttrVals();
      this.off();
    }
  });
  module.exports = LoadMask;
});
define("bui/overlay", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview Overlay 模块的入口
   * @ignore
   */
  var BUI = require("bui/common"),
    Overlay = BUI.namespace('Overlay');
  BUI.mix(Overlay, {
    Overlay: require("bui/overlay/overlay"),
    Dialog: require("bui/overlay/dialog"),
    Message: require("bui/overlay/message")
  });
  BUI.mix(Overlay, {
    OverlayView: Overlay.Overlay.View,
    DialogView: Overlay.Dialog.View
  });
  BUI.Message = BUI.Overlay.Message;
  module.exports = Overlay;
});
define("bui/overlay/overlay", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 悬浮层
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    CLS_ARROW = 'x-align-arrow',
    UIBase = Component.UIBase;
  /**
   * 悬浮层的视图类
   * @class BUI.Overlay.OverlayView
   * @extends BUI.Component.View
   * @mixins BUI.Component.UIBase.PositionView
   * @mixins BUI.Component.UIBase.CloseView
   * @private
   */
  var overlayView = Component.View.extend([
    UIBase.PositionView,
    UIBase.CloseView
  ]);
  /**
   * 悬浮层，显示悬浮信息，Message、Dialog的基类
   * <p>
   * <img src="../assets/img/class-overlay.jpg"/>
   * </p>
   * xclass : 'overlay'
   * ** 一般来说，overlay的子类，Dialog 、Message、ToolTip已经能够满足日常应用，但是使用overay更适合一些更加灵活的地方 **
   * ## 简单overlay
   * <pre><code>
   *   BUI.use('bui/overlay',function(Overlay){
   *     //点击#btn，显示overlay
   *     var overlay = new Overlay.Overlay({
   *       trigger : '#btn',
   *       content : '这是内容',
   *       align : {
   *         points : ['bl','tl']
   *       }, //对齐方式
   *       elCls : 'custom-cls', //自定义样式
   *       autoHide : true //点击overlay外面，overlay 会自动隐藏
   *     });
   *
   *     overlay.render();
   *   });
   * </code></pre>
   *
   *
   * @class BUI.Overlay.Overlay
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.Position
   * @mixins BUI.Component.UIBase.Align
   * @mixins BUI.Component.UIBase.Close
   * @mixins BUI.Component.UIBase.AutoShow
   * @mixins BUI.Component.UIBase.AutoHide
   */
  var overlay = Component.Controller.extend([UIBase.Position, UIBase.Align, UIBase.Close, UIBase.AutoShow, UIBase.AutoHide], {
    renderUI: function() {
      var _self = this,
        el = _self.get('el'),
        arrowContainer = _self.get('arrowContainer'),
        container = arrowContainer ? el.one(arrowContainer) : el;
      if (_self.get('showArrow')) {
        $(_self.get('arrowTpl')).appendTo(container);
      }
    },
    show: function() {
      var _self = this,
        effectCfg = _self.get('effect'),
        el = _self.get('el'),
        visibleMode = _self.get('visibleMode'),
        effect = effectCfg.effect,
        duration = effectCfg.duration;
      //如果还未渲染，则先渲染控件
      if (!_self.get('rendered')) {
        _self.set('visible', true);
        _self.render();
        _self.set('visible', false);
        el = _self.get('el');
      }
      if (visibleMode === 'visibility') {
        _self.set('visible', true);
        el.css({
          display: 'none'
        });
      }
      switch (effect) {
        case 'linear':
          el.show(duration, callback);
          break;
        case 'fade':
          el.fadeIn(duration, callback);
          break;
        case 'slide':
          el.slideDown(duration, callback);
          break;
        default:
          callback();
          break;
      }

      function callback() {
        if (visibleMode === 'visibility') {
          el.css({
            display: 'block'
          });
        } else {
          _self.set('visible', true);
        }
        if (effectCfg.callback) {
          effectCfg.callback.call(_self);
        }
        //自动隐藏
        var delay = _self.get('autoHideDelay'),
          delayHandler = _self.get('delayHandler');
        if (delay) {
          delayHandler && clearTimeout(delayHandler);
          delayHandler = setTimeout(function() {
            _self.hide();
            _self.set('delayHandler', null);
          }, delay);
          _self.set('delayHandler', delayHandler);
        }
      }
    },
    hide: function() {
      var _self = this,
        effectCfg = _self.get('effect'),
        el = _self.get('el'),
        effect = effectCfg.effect,
        duration = effectCfg.duration;
      switch (effect) {
        case 'linear':
          el.hide(duration, callback);
          break;
        case 'fade':
          el.fadeOut(duration, callback);
          break;
        case 'slide':
          el.slideUp(duration, callback);
          break;
        default:
          callback();
          break;
      }

      function callback() {
        if (_self.get('visibleMode') === 'visibility') {
          el.css({
            display: 'block'
          });
        }
        _self.set('visible', false);
        if (effectCfg.callback) {
          effectCfg.callback.call(_self);
        }
      }
    }
  }, {
    ATTRS: {
      /**
       * {Object} - 可选, 显示或隐藏时的特效支持, 对象包含以下配置
       * <ol>
       * <li>effect:特效效果，'none(默认无特效)','linear(线性)',fade(渐变)','slide(滑动出现)'</li>
       * <li>duration:时间间隔 </li>
       * </ol>
       * @type {Object}
       */
      effect: {
        value: {
          effect: 'none',
          duration: 0,
          callback: null
        }
      },
      /**
       * 显示后间隔多少秒自动隐藏
       * @type {Number}
       */
      autoHideDelay: {},
      /**
       * whether this component can be closed.
       * @default false
       * @type {Boolean}
       * @protected
       */
      closeable: {
        value: false
      },
      /**
       * 是否显示指向箭头，跟align属性的points相关
       * @cfg {Boolean} [showArrow = false]
       */
      showArrow: {
        value: false
      },
      /**
       * 箭头放置在的位置，是一个选择器，例如 .arrow-wraper
       *     new Tip({ //可以设置整个控件的模板
       *       arrowContainer : '.arrow-wraper',
       *       tpl : '<div class="arrow-wraper"></div>'
       *     });
       *
       * @cfg {String} arrowContainer
       */
      arrowContainer: {
        view: true
      },
      /**
       * 指向箭头的模板
       * @cfg {Object} arrowTpl
       */
      arrowTpl: {
        value: '<s class="' + CLS_ARROW + '"><s class="' + CLS_ARROW + '-inner"></s></s>'
      },
      visibleMode: {
        value: 'visibility'
      },
      visible: {
        value: false
      },
      xview: {
        value: overlayView
      }
    }
  }, {
    xclass: 'overlay'
  });
  overlay.View = overlayView;
  module.exports = overlay;
});
define("bui/overlay/dialog", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 弹出框
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    Overlay = require("bui/overlay/overlay"),
    UIBase = BUI.Component.UIBase,
    CLS_TITLE = 'header-title',
    PREFIX = BUI.prefix,
    HEIGHT_PADDING = 20;
  /**
   * dialog的视图类
   * @class BUI.Overlay.DialogView
   * @extends BUI.Overlay.OverlayView
   * @mixins BUI.Component.UIBase.StdModView
   * @mixins BUI.Component.UIBase.MaskView
   * @private
   */
  var dialogView = Overlay.View.extend([UIBase.StdModView, UIBase.MaskView], {
    /**
     * 子组件将要渲染到的节点，在 render 类上覆盖对应方法
     * @protected
     * @ignore
     */
    getContentElement: function() {
      return this.get('body');
    },
    _uiSetTitle: function(v) {
      var _self = this,
        el = _self.get('el');
      el.find('.' + CLS_TITLE).html(v);
    },
    _uiSetContentId: function(v) {
      var _self = this,
        body = _self.get('body'),
        children = $('#' + v).children();
      children.appendTo(body);
    },
    _uiSetHeight: function(v) {
      var _self = this,
        bodyHeight = v,
        header = _self.get('header'),
        body = _self.get('body'),
        footer = _self.get('footer');
      bodyHeight -= header.outerHeight() + footer.outerHeight();
      bodyHeight -= HEIGHT_PADDING * 2;
      body.height(bodyHeight);
    },
    _removeContent: function() {
      var _self = this,
        body = _self.get('body'),
        contentId = _self.get('contentId');
      if (contentId) {
        body.children().appendTo($('#' + contentId));
      } else {
        body.children().remove();
      }
    }
  }, {
    xclass: 'dialog-view'
  });
  /**
   * 弹出框 xclass:'dialog'
   * <p>
   * <img src="../assets/img/class-overlay.jpg"/>
   * </p>
   * ** 普通弹出框 **
   * <pre><code>
   *  BUI.use('bui/overlay',function(Overlay){
   *      var dialog = new Overlay.Dialog({
   *        title:'非模态窗口',
   *        width:500,
   *        height:300,
   *        mask:false,  //设置是否模态
   *        buttons:[],
   *        bodyContent:'<p>这是一个非模态窗口,并且不带按钮</p>'
   *      });
   *    dialog.show();
   *    $('#btnShow').on('click',function () {
   *      dialog.show();
   *    });
   *  });
   * </code></pre>
   *
   * ** 使用现有的html结构 **
   * <pre><code>
   *  BUI.use('bui/overlay',function(Overlay){
   *      var dialog = new Overlay.Dialog({
   *        title:'配置DOM',
   *        width:500,
   *        height:250,
   *        contentId:'content',//配置DOM容器的编号
   *        success:function () {
   *          alert('确认');
   *          this.hide();
   *        }
   *      });
   *    dialog.show();
   *    $('#btnShow').on('click',function () {
   *      dialog.show();
   *    });
   *  });
   * </code></pre>
   * @class BUI.Overlay.Dialog
   * @extends BUI.Overlay.Overlay
   * @mixins BUI.Component.UIBase.StdMod
   * @mixins BUI.Component.UIBase.Mask
   * @mixins BUI.Component.UIBase.Drag
   */
  var dialog = Overlay.extend([UIBase.StdMod, UIBase.Mask, UIBase.Drag], {
    show: function() {
      var _self = this;
      align = _self.get('align');
      dialog.superclass.show.call(this);
      _self.set('align', align);
    },
    /**/
    //绑定事件
    bindUI: function() {
      var _self = this;
      _self.on('closeclick', function() {
        return _self.onCancel();
      });
    },
    /**
     * @protected
     * 取消
     */
    onCancel: function() {
      var _self = this,
        cancel = _self.get('cancel');
      return cancel.call(this);
    },
    //设置按钮
    _uiSetButtons: function(buttons) {
      var _self = this,
        footer = _self.get('footer');
      footer.children().remove();
      BUI.each(buttons, function(conf) {
        _self._createButton(conf, footer);
      });
    },
    //创建按钮
    _createButton: function(conf, parent) {
      var _self = this,
        temp = '<button class="' + conf.elCls + '">' + conf.text + '</button>',
        btn = $(temp).appendTo(parent);
      btn.on('click', function() {
        conf.handler.call(_self, _self, this);
      });
    },
    destructor: function() {
      var _self = this,
        contentId = _self.get('contentId'),
        body = _self.get('body'),
        closeAction = _self.get('closeAction');
      if (closeAction == 'destroy') {
        _self.hide();
        if (contentId) {
          body.children().appendTo('#' + contentId);
        }
      }
    }
  }, {
    ATTRS: {
      closeTpl: {
        view: true,
        value: '<a tabindex="0" href=javascript:void("关闭") role="button" class="' + PREFIX + 'ext-close" style=""><span class="' + PREFIX + 'ext-close-x x-icon x-icon-normal">×</span></a>'
      },
      /**
       * 弹出库的按钮，可以有多个,有3个参数
       * var dialog = new Overlay.Dialog({
       *     title:'自定义按钮',
       *     width:500,
       *     height:300,
       *     mask:false,
       *     buttons:[
       *       {
       *         text:'自定义',
       *         elCls : 'button button-primary',
       *         handler : function(){
       *           //do some thing
       *           this.hide();
       *         }
       *       },{
       *         text:'关闭',
       *         elCls : 'button',
       *         handler : function(){
       *           this.hide();
       *         }
       *       }
       *     ],
       *
       *     bodyContent:'<p>这是一个自定义按钮窗口,可以配置事件和文本样式</p>'
       *   });
       *  dialog.show();
       * <ol>
       *   <li>text:按钮文本</li>
       *   <li>elCls:按钮样式</li>
       *   <li>handler:点击按钮的回调事件</li>
       * </ol>
       * @cfg {Array} buttons
       * @default '确定'、'取消'2个按钮
       *
       */
      buttons: {
        value: [{
          text: '确定',
          elCls: 'button button-primary',
          handler: function() {
            var _self = this,
              success = _self.get('success');
            if (success) {
              success.call(_self);
            }
          }
        }, {
          text: '取消',
          elCls: 'button button-primary',
          handler: function(dialog, btn) {
            if (this.onCancel() !== false) {
              this.close();
            }
          }
        }]
      },
      /**
       * 弹出框显示内容的DOM容器ID
       * @cfg {Object} contentId
       */
      contentId: {
        view: true
      },
      /**
       * 点击成功时的回调函数
       * @cfg {Function} success
       */
      success: {
        value: function() {
          this.close();
        }
      },
      /**
       * 用户取消时调用，如果return false则阻止窗口关闭
       * @cfg {Function} cancel
       */
      cancel: {
        value: function() {}
      },
      dragNode: {
        /**
         * @private
         */
        valueFn: function() {
          return this.get('header');
        }
      },
      /**
       * 默认的加载控件内容的配置,默认值：
       * <pre>
       *  {
       *    property : 'bodyContent',
       *    autoLoad : false,
       *    lazyLoad : {
       *      event : 'show'
       *    },
       *    loadMask : {
       *      el : _self.get('body')
       *    }
       *  }
       * </pre>
       * @type {Object}
       */
      defaultLoaderCfg: {
        valueFn: function() {
          var _self = this;
          return {
            property: 'bodyContent',
            autoLoad: false,
            lazyLoad: {
              event: 'show'
            },
            loadMask: {
              el: _self.get('body')
            }
          }
        }
      },
      /**
       * 弹出框标题
       * @cfg {String} title
       */
      /**
       * 弹出框标题
       * <pre><code>
       *  dialog.set('title','new title');
       * </code></pre>
       * @type {String}
       */
      title: {
        view: true,
        value: ''
      },
      align: {
        value: {
          node: window,
          points: ['cc', 'cc']
        }
      },
      mask: {
        value: true
      },
      maskShared: {
        value: false
      },
      headerContent: {
        value: '<div class="' + CLS_TITLE + '">标题</div>'
      },
      footerContent: {},
      closeable: {
        value: true
      },
      xview: {
        value: dialogView
      }
    }
  }, {
    xclass: 'dialog'
  });
  dialog.View = dialogView;
  module.exports = dialog;
});
define("bui/overlay/message", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 消息框，警告、确认
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    Dialog = require("bui/overlay/dialog"),
    PREFIX = BUI.prefix,
    iconText = {
      info: 'i',
      error: '×',
      success: '<i class="icon-ok icon-white"></i>',
      question: '?',
      warning: '!'
    };
  /**
   * 消息框类，一般不直接创建对象，而是调用其Alert和Confirm方法
   * <pre><code>
   ** BUI.use('bui/overlay',function(overlay){
   *
   *    BUI.Message.Alert('这只是简单的提示信息','info');
   *    BUI.Message.Alert('这只是简单的成功信息','success');
   *    BUI.Message.Alert('这只是简单的警告信息','warning');
   *    BUI.Message.Alert('这只是简单的错误信息','error');
   *    BUI.Message.Alert('这只是简单的询问信息','question');
   *
   *    //回调函数
   *    BUI.Message.Alert('点击触发回调函数',function() {
   *         alert('执行回调');
   *       },'error');
   *
   *    //复杂的提示信息
   *    var msg = '&lt;h2&gt;上传失败，请上传10M以内的文件&lt;/h2&gt;'+
   *       '&lt;p class="auxiliary-text"&gt;如连续上传失败，请及时联系客服热线：0511-23883767834&lt;/p&gt;'+
   *       '&lt;p&gt;&lt;a href="#"&gt;返回list页面&lt;/a&gt; &lt;a href="#"&gt;查看详情&lt;/a&gt;&lt;/p&gt;';
   *     BUI.Message.Alert(msg,'error');
   *    //确认信息
   *    BUI.Message.Confirm('确认要更改么？',function(){
   *       alert('确认');
   *     },'question');
   * });
   * </code></pre>
   * @class BUI.Overlay.Message
   * @private
   * @extends BUI.Overlay.Dialog
   */
  var message = Dialog.extend({
    /**
     * @protected
     * @ignore
     */
    renderUI: function() {
      this._setContent();
    },
    bindUI: function() {
      var _self = this,
        body = _self.get('body');
      _self.on('afterVisibleChange', function(ev) {
        if (ev.newVal) {
          if (BUI.UA.ie < 8) {
            /**
             * fix ie6,7 bug
             * @ignore
             */
            var outerWidth = body.outerWidth();
            if (BUI.UA.ie == 6) {
              outerWidth = outerWidth > 350 ? 350 : outerWidth;
            }
            _self.get('header').width(outerWidth - 20);
            _self.get('footer').width(outerWidth);
          }
        }
      });
    },
    //根据模版设置内容
    _setContent: function() {
      var _self = this,
        body = _self.get('body'),
        contentTpl = BUI.substitute(_self.get('contentTpl'), {
          msg: _self.get('msg'),
          iconTpl: _self.get('iconTpl')
        });
      body.empty();
      $(contentTpl).appendTo(body);
    },
    //设置类型
    _uiSetIcon: function(v) {
      if (!this.get('rendered')) {
        return;
      }
      this._setContent();
    },
    //设置文本
    _uiSetMsg: function(v) {
      if (!this.get('rendered')) {
        return;
      }
      this._setContent();
    }
  }, {
    ATTRS: {
      /**
       * 图标类型
       * <ol>
       * <li>提示信息，类型参数<code>info</code></li>
       * <li>成功信息，类型参数<code>success</code></li>
       * <li>警告信息，类型参数<code>warning</code></li>
       * <li>错误信息，类型参数<code>error</code></li>
       * <li>确认信息，类型参数<code>question</code></li>
       * </ol>
       * @type {String}
       */
      icon: {},
      /**
       * 提示消息，可以是文本或者html
       * @cfg {String} msg
       */
      /**
       * 提示消息，可以是文本或者html
       * @type {String}
       */
      msg: {},
      /**
       * @private
       */
      iconTpl: {
        /**
         * @private
         */
        getter: function() {
          var _self = this,
            type = _self.get('icon');
          return '<div class="x-icon x-icon-' + type + '">' + iconText[type] + '</div>';
        }
      },
      /**
       * 内容的模版
       * @type {String}
       * @protected
       */
      contentTpl: {
        value: '{iconTpl}<div class="' + PREFIX + 'message-content">{msg}</div>'
      }
    }
  }, {
    xclass: 'message',
    priority: 0
  });
  var singlelon;

  function messageFun(buttons, defaultIcon) {
    return function(msg, callback, icon) {
      if (BUI.isString(callback)) {
        icon = callback;
        callback = null;
      }
      icon = icon || defaultIcon;
      callback = callback || hide;
      showMessage({
        'buttons': buttons,
        'icon': icon,
        'msg': msg,
        'success': callback
      });
      return singlelon;
    };
  }

  function showMessage(config) {
    if (!singlelon) {
      singlelon = new message({
        icon: 'info',
        title: ''
      });
    }
    singlelon.set(config);
    singlelon.show();
  }

  function success() {
    var _self = this,
      success = _self.get('success');
    if (success) {
      success.call(_self);
      _self.hide();
    }
  }

  function hide() {
    this.hide();
  }
  var Alert = messageFun([{
      text: '确定',
      elCls: 'button button-primary',
      handler: success
    }], 'info'),
    Confirm = messageFun([{
      text: '确定',
      elCls: 'button button-primary',
      handler: success
    }, {
      text: '取消',
      elCls: 'button',
      handler: hide
    }], 'question');
  /**
   * 提示框静态类
   * @class BUI.Message
   */
  /**
   * 显示提示信息框
   * @static
   * @method
   * @member BUI.Message
   * @param  {String}   msg      提示信息
   * @param  {Function} callback 确定的回调函数
   * @param  {String}   icon     图标，提供以下几种图标：info,error,success,question,warning
   */
  message.Alert = Alert;
  /**
   * 显示确认框
   * <pre><code>
   * BUI.Message.Confirm('确认要更改么？',function(){
   *       alert('确认');
   * },'question');
   * </code></pre>
   * @static
   * @method
   * @member BUI.Message
   * @param  {String}   msg      提示信息
   * @param  {Function} callback 确定的回调函数
   * @param  {String}   icon     图标，提供以下几种图标：info,error,success,question,warning
   */
  message.Confirm = Confirm;
  /**
   * 自定义消息框，传入配置信息 {@link BUI.Overlay.Dialog} 和 {@link BUI.Overlay.Message}
   * @static
   * @method
   * @member BUI.Message
   * @param  {Object}   config  配置信息
   */
  message.Show = showMessage;
  module.exports = message;
});
define("bui/picker", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview Picker的入口
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    Picker = BUI.namespace('Picker');
  BUI.mix(Picker, {
    Mixin: require("bui/picker/mixin"),
    Picker: require("bui/picker/picker"),
    ListPicker: require("bui/picker/listpicker")
  });
  module.exports = Picker;
});
define("bui/picker/mixin", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview picker的扩展
   * @ignore
   */
  var $ = require('jquery');
  /**
   * @class BUI.Picker.Mixin
   */
  var Mixin = function() {};
  Mixin.ATTRS = {
    /**
     * 用于选择的控件，默认为第一个子元素,此控件实现 @see {BUI.Component.UIBase.Selection} 接口
     * @protected
     * @type {Object|BUI.Component.Controller}
     */
    innerControl: {
      getter: function() {
        return this.get('children')[0];
      }
    },
    /**
     * 显示选择器的事件
     * @cfg {String} [triggerEvent='click']
     */
    /**
     * 显示选择器的事件
     * @type {String}
     * @default 'click'
     */
    triggerEvent: {
      value: 'click'
    },
    /**
     * 选择器选中的项，是否随着触发器改变
     * @cfg {Boolean} [autoSetValue=true]
     */
    /**
     * 选择器选中的项，是否随着触发器改变
     * @type {Boolean}
     */
    autoSetValue: {
      value: true
    },
    /**
     * 选择发生改变的事件
     * @cfg {String} [changeEvent='selectedchange']
     */
    /**
     * 选择发生改变的事件
     * @type {String}
     */
    changeEvent: {
      value: 'selectedchange'
    },
    /**
     * 自动隐藏
     * @type {Boolean}
     * @override
     */
    autoHide: {
      value: true
    },
    /**
     * 隐藏选择器的事件
     * @protected
     * @type {String}
     */
    hideEvent: {
      value: 'itemclick'
    },
    /**
     * 返回的文本放在的DOM，一般是input
     * @cfg {String|HTMLElement|jQuery} textField
     */
    /**
     * 返回的文本放在的DOM，一般是input
     * @type {String|HTMLElement|jQuery}
     */
    textField: {},
    align: {
      value: {
        points: ['bl', 'tl'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
        offset: [0, 0] // 有效值为 [n, m]
      }
    },
    /**
     * 返回的值放置DOM ,一般是input
     * @cfg {String|HTMLElement|jQuery} valueField
     */
    /**
     * 返回的值放置DOM ,一般是input
     * @type {String|HTMLElement|jQuery}
     */
    valueField: {}
    /**
     * @event selectedchange
     * 选中值改变事件
     * @param {Object} e 事件对象
     * @param {String} text 选中的文本
     * @param {string} value 选中的值
     * @param {jQuery} curTrigger 当前触发picker的元素
     */
  }
  Mixin.prototype = {
    __bindUI: function() {
      var _self = this,
        //innerControl = _self.get('innerControl'),
        hideEvent = _self.get('hideEvent'),
        trigger = $(_self.get('trigger'));
      _self.on('show', function(ev) {
        //trigger.on(_self.get('triggerEvent'),function(e){
        if (!_self.get('isInit')) {
          _self._initControl();
        }
        if (_self.get('autoSetValue')) {
          var valueField = _self.get('valueField') || _self.get('textField') || _self.get('curTrigger'),
            val = $(valueField).val();
          _self.setSelectedValue(val);
        }
      });
      //_self.initControlEvent();
    },
    _initControl: function() {
      var _self = this;
      if (_self.get('isInit')) { //已经初始化过
        return;
      }
      if (!_self.get('innerControl')) {
        var control = _self.createControl();
        _self.get('children').push(control);
      }
      _self.initControlEvent();
      _self.set('isInit', true);
    },
    /**
     * 初始化内部控件，绑定事件
     */
    initControl: function() {
      this._initControl();
    },
    /**
     * @protected
     * 初始化内部控件
     */
    createControl: function() {},
    //初始化内部控件的事件
    initControlEvent: function() {
      var _self = this,
        innerControl = _self.get('innerControl'),
        trigger = $(_self.get('trigger')),
        hideEvent = _self.get('hideEvent');
      innerControl.on(_self.get('changeEvent'), function(e) {
        var curTrigger = _self.get('curTrigger'),
          textField = _self.get('textField') || curTrigger || trigger,
          valueField = _self.get('valueField'),
          selValue = _self.getSelectedValue(),
          isChange = false;
        if (textField) {
          var selText = _self.getSelectedText(),
            preText = $(textField).val();
          if (selText != preText) {
            $(textField).val(selText);
            isChange = true;
            $(textField).trigger('change');
          }
        }
        if (valueField && _self.get('autoSetValue')) {
          var preValue = $(valueField).val();
          if (valueField != preValue) {
            $(valueField).val(selValue);
            isChange = true;
            $(valueField).trigger('change');
          }
        }
        if (isChange) {
          _self.onChange(selText, selValue, e);
        }
      });
      if (hideEvent) {
        innerControl.on(_self.get('hideEvent'), function() {
          var curTrigger = _self.get('curTrigger');
          try { //隐藏时，在ie6,7下会报错
            if (curTrigger) {
              curTrigger.focus();
            }
          } catch (e) {
            BUI.log(e);
          }
          _self.hide();
        });
      }
    },
    /**
     * 设置选中的值
     * @template
     * @protected
     * @param {String} val 设置值
     */
    setSelectedValue: function(val) {},
    /**
     * 获取选中的值，多选状态下，值以','分割
     * @template
     * @protected
     * @return {String} 选中的值
     */
    getSelectedValue: function() {},
    /**
     * 获取选中项的文本，多选状态下，文本以','分割
     * @template
     * @protected
     * @return {String} 选中的文本
     */
    getSelectedText: function() {},
    /**
     * 选择器获取焦点时，默认选中内部控件
     */
    focus: function() {
      this.get('innerControl').focus();
    },
    /**
     * @protected
     * 发生改变
     */
    onChange: function(selText, selValue, ev) {
      var _self = this,
        curTrigger = _self.get('curTrigger');
      //curTrigger && curTrigger.trigger('change'); //触发改变事件
      _self.fire('selectedchange', {
        value: selValue,
        text: selText,
        curTrigger: curTrigger
      });
    },
    /**
     * 处理 esc 键
     * @protected
     * @param  {jQuery.Event} ev 事件对象
     */
    handleNavEsc: function(ev) {
      this.hide();
    },
    _uiSetValueField: function(v) {
      var _self = this;
      if (v != null && v !== '' && _self.get('autoSetValue')) { //if(v)问题太多
        _self.setSelectedValue($(v).val());
      }
    },
    _getTextField: function() {
      var _self = this;
      return _self.get('textField') || _self.get('curTrigger');
    }
  }
  module.exports = Mixin;
});
define("bui/picker/picker", ["jquery", "bui/overlay", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 选择器
   * @ignore
   */
  var $ = require('jquery'),
    Overlay = require("bui/overlay").Overlay,
    Mixin = require("bui/picker/mixin");
  /**
   * 选择器控件的基类，弹出一个层来选择数据，不要使用此类创建控件，仅用于继承实现控件
   * xclass : 'picker'
   * <pre><code>
   * BUI.use(['bui/picker','bui/list'],function(Picker,List){
   *
   * var items = [
   *       {text:'选项1',value:'a'},
   *       {text:'选项2',value:'b'},
   *      {text:'选项3',value:'c'}
   *     ],
   *   list = new List.SimpleList({
   *     elCls:'bui-select-list',
   *     items : items
   *   }),
   *   picker = new Picker.ListPicker({
   *     trigger : '#show',
   *     valueField : '#hide', //如果需要列表返回的value，放在隐藏域，那么指定隐藏域
   *     width:100,  //指定宽度
   *     children : [list] //配置picker内的列表
   *   });
   * picker.render();
   * });
   * </code></pre>
   * @abstract
   * @class BUI.Picker.Picker
   * @mixins BUI.Picker.Mixin
   * @extends BUI.Overlay.Overlay
   */
  var picker = Overlay.extend([Mixin], {}, {
    ATTRS: {}
  }, {
    xclass: 'picker'
  });
  module.exports = picker;
});
define("bui/picker/listpicker", ["jquery", "bui/list", "bui/common", "bui/data", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 列表项的选择器
   * @ignore
   */
  var $ = require('jquery'),
    List = require("bui/list"),
    Picker = require("bui/picker/picker"),
    /**
     * 列表选择器,xclass = 'list-picker'
     * <pre><code>
     * BUI.use(['bui/picker'],function(Picker){
     *
     * var items = [
     *       {text:'选项1',value:'a'},
     *       {text:'选项2',value:'b'},
     *      {text:'选项3',value:'c'}
     *     ],
     *   picker = new Picker.ListPicker({
     *     trigger : '#show',
     *     valueField : '#hide', //如果需要列表返回的value，放在隐藏域，那么指定隐藏域
     *     width:100,  //指定宽度
     *     children : [{
     *        elCls:'bui-select-list',
     *        items : items
     *     }] //配置picker内的列表
     *   });
     * picker.render();
     * });
     * </code></pre>
     * @class BUI.Picker.ListPicker
     * @extends BUI.Picker.Picker
     */
    listPicker = Picker.extend({
      initializer: function() {
        var _self = this,
          children = _self.get('children'),
          list = _self.get('list');
        if (!list) {
          children.push({});
        }
      },
      /**
       * 设置选中的值
       * @override
       * @param {String} val 设置值
       */
      setSelectedValue: function(val) {
        val = val ? val.toString() : '';
        if (!this.get('isInit')) {
          this._initControl();
        }
        var _self = this,
          list = _self.get('list'),
          selectedValue = _self.getSelectedValue();
        if (val !== selectedValue && list.getCount()) {
          if (list.get('multipleSelect')) {
            list.clearSelection();
          }
          list.setSelectionByField(val.split(','));
        }
      },
      /**
       * @protected
       * @ignore
       */
      onChange: function(selText, selValue, ev) {
        var _self = this,
          curTrigger = _self.get('curTrigger');
        //curTrigger && curTrigger.trigger('change'); //触发改变事件
        _self.fire('selectedchange', {
          value: selValue,
          text: selText,
          curTrigger: curTrigger,
          item: ev.item
        });
      },
      /**
       * 获取选中的值，多选状态下，值以','分割
       * @return {String} 选中的值
       */
      getSelectedValue: function() {
        if (!this.get('isInit')) {
          this._initControl();
        }
        return this.get('list').getSelectionValues().join(',');
      },
      /**
       * 获取选中项的文本，多选状态下，文本以','分割
       * @return {String} 选中的文本
       */
      getSelectedText: function() {
        if (!this.get('isInit')) {
          this._initControl();
        }
        return this.get('list').getSelectionText().join(',');
      }
    }, {
      ATTRS: {
        /**
         * 默认子控件的样式,默认为'simple-list'
         * @type {String}
         * @override
         */
        defaultChildClass: {
          value: 'simple-list'
        },
        /**
         * 选择的列表
         * <pre><code>
         *  var list = picker.get('list');
         *  list.getSelected();
         * </code></pre>
         * @type {BUI.List.SimpleList}
         * @readOnly
         */
        list: {
          getter: function() {
            return this.get('children')[0];
          }
        }
        /**
         * @event selectedchange
         * 选择发生改变事件
         * @param {Object} e 事件对象
         * @param {String} e.text 选中的文本
         * @param {string} e.value 选中的值
         * @param {Object} e.item 发生改变的选项
         * @param {jQuery} e.curTrigger 当前触发picker的元素
         */
      }
    }, {
      xclass: 'list-picker'
    });
  module.exports = listPicker;
});
define("bui/toolbar", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 工具栏命名空间入口
   * @ignore
   */
  var BUI = require("bui/common"),
    Toolbar = BUI.namespace('Toolbar');
  BUI.mix(Toolbar, {
    BarItem: require("bui/toolbar/baritem"),
    Bar: require("bui/toolbar/bar"),
    PagingBar: require("bui/toolbar/pagingbar"),
    NumberPagingBar: require("bui/toolbar/numberpagingbar")
  });
  module.exports = Toolbar;
});
define("bui/toolbar/baritem", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview buttons or controls of toolbar
   * @author dxq613@gmail.com, yiminghe@gmail.com
   * @ignore
   */
  /**
   * @name BUI.Toolbar
   * @namespace 工具栏命名空间
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    Component = BUI.Component,
    UIBase = Component.UIBase;
  /**
   * barItem的视图类
   * @class BUI.Toolbar.BarItemView
   * @extends BUI.Component.View
   * @mixins BUI.Component.UIBase.ListItemView
   * @private
   */
  var BarItemView = Component.View.extend([UIBase.ListItemView]);
  /**
   * 工具栏的子项，包括按钮、文本、链接和分隔符等
   * @class BUI.Toolbar.BarItem
   * @extends BUI.Component.Controller
   */
  var BarItem = Component.Controller.extend([UIBase.ListItem], {
    /**
     * render baritem 's dom
     * @protected
     */
    renderUI: function() {
      var el = this.get('el');
      el.addClass(PREFIX + 'inline-block');
      if (!el.attr('id')) {
        el.attr('id', this.get('id'));
      }
    }
  }, {
    ATTRS: {
      elTagName: {
        view: true,
        value: 'li'
      },
      /**
       * 是否可选择
       * <pre><code>
       *
       * </code></pre>
       * @cfg {Object} [selectable = false]
       */
      selectable: {
        value: false
      },
      /**
       * 是否获取焦点
       * @default {boolean} false
       */
      focusable: {
        value: false
      },
      xview: {
        value: BarItemView
      }
    }
  }, {
    xclass: 'bar-item',
    priority: 1
  });
  /**
   * 工具栏的子项，添加按钮
   * xclass : 'bar-item-button'
   * @extends  BUI.Toolbar.BarItem
   * @class BUI.Toolbar.BarItem.Button
   */
  var ButtonBarItem = BarItem.extend({
    _uiSetDisabled: function(value) {
      var _self = this,
        el = _self.get('el'),
        method = value ? 'addClass' : 'removeClass';
      el.find('button').attr('disabled', value)[method](PREFIX + 'button-disabled');
    },
    _uiSetChecked: function(value) {
      var _self = this,
        el = _self.get('el'),
        method = value ? 'addClass' : 'removeClass';
      el.find('button')[method](PREFIX + 'button-checked');
    },
    _uiSetText: function(v) {
      var _self = this,
        el = _self.get('el');
      el.find('button').text(v);
    },
    _uiSetbtnCls: function(v) {
      var _self = this,
        el = _self.get('el');
      el.find('button').addClass(v);
    }
  }, {
    ATTRS: {
      /**
       * 是否选中
       * @type {Boolean}
       */
      checked: {
        value: false
      },
      /**
       * 模板
       * @type {String}
       */
      tpl: {
        view: true,
        value: '<button type="button" class="{btnCls}">{text}</button>'
      },
      /**
       * 按钮的样式
       * @cfg {String} btnCls
       */
      /**
       * 按钮的样式
       * @type {String}
       */
      btnCls: {
        sync: false
      },
      /**
       * The text to be used as innerHTML (html tags are accepted).
       * @cfg {String} text
       */
      /**
       * The text to be used as innerHTML (html tags are accepted).
       * @type {String}
       */
      text: {
        sync: false,
        value: ''
      }
    }
  }, {
    xclass: 'bar-item-button',
    priority: 2
  });
  /**
   * 工具栏项之间的分隔符
   * xclass:'bar-item-separator'
   * @extends  BUI.Toolbar.BarItem
   * @class BUI.Toolbar.BarItem.Separator
   */
  var SeparatorBarItem = BarItem.extend({
    /* render separator's dom
     * @protected
     *
     */
    renderUI: function() {
      var el = this.get('el');
      el.attr('role', 'separator');
    }
  }, {
    xclass: 'bar-item-separator',
    priority: 2
  });
  /**
   * 工具栏项之间的空白
   * xclass:'bar-item-spacer'
   * @extends  BUI.Toolbar.BarItem
   * @class BUI.Toolbar.BarItem.Spacer
   */
  var SpacerBarItem = BarItem.extend({}, {
    ATTRS: {
      /**
       * 空白宽度
       * @type {Number}
       */
      width: {
        view: true,
        value: 2
      }
    }
  }, {
    xclass: 'bar-item-spacer',
    priority: 2
  });
  /**
   * 显示文本的工具栏项
   * xclass:'bar-item-text'
   * @extends  BUI.Toolbar.BarItem
   * @class BUI.Toolbar.BarItem.Text
   */
  var TextBarItem = BarItem.extend({
    _uiSetText: function(text) {
      var _self = this,
        el = _self.get('el');
      el.html(text);
    }
  }, {
    ATTRS: {
      /**
       * 文本用作 innerHTML (html tags are accepted).
       * @cfg {String} text
       */
      /**
       * 文本用作 innerHTML (html tags are accepted).
       * @default {String} ""
       */
      text: {
        value: ''
      }
    }
  }, {
    xclass: 'bar-item-text',
    priority: 2
  });
  BarItem.types = {
    'button': ButtonBarItem,
    'separator': SeparatorBarItem,
    'spacer': SpacerBarItem,
    'text': TextBarItem
  };
  module.exports = BarItem;
});
define("bui/toolbar/bar", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview A collection of commonly used function buttons or controls represented in compact visual form.
   * @author dxq613@gmail.com, yiminghe@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    UIBase = Component.UIBase;
  /**
   * bar的视图类
   * @class BUI.Toolbar.BarView
   * @extends BUI.Component.View
   * @private
   */
  var barView = Component.View.extend({
    renderUI: function() {
      var el = this.get('el');
      el.attr('role', 'toolbar');
      if (!el.attr('id')) {
        el.attr('id', BUI.guid('bar'));
      }
    }
  });
  /**
   * 工具栏
   * 可以放置按钮、文本、链接等，是分页栏的基类
   * xclass : 'bar'
   * <p>
   * <img src="../assets/img/class-toolbar.jpg"/>
   * </p>
   * ## 按钮组
   * <pre><code>
   *   BUI.use('bui/toolbar',function(Toolbar){
   *     var buttonGroup = new Toolbar.Bar({
   *       elCls : 'button-group',
   *       defaultChildCfg : {
   *         elCls : 'button button-small'
   *       },
   *       children : [{content : '增加'},{content : '修改'},{content : '删除'}],
   *
   *       render : '#b1'
   *     });
   *
   *     buttonGroup.render();
   *   });
   * </code></pre>
   * @class BUI.Toolbar.Bar
   * @extends BUI.Component.Controller
   * @mixins BUI.Component.UIBase.ChildList
   */
  var Bar = Component.Controller.extend([UIBase.ChildList], {
    /**
     * 通过id 获取项
     * @param {String|Number} id the id of item
     * @return {BUI.Toolbar.BarItem}
     */
    getItem: function(id) {
      return this.getChild(id);
    }
  }, {
    ATTRS: {
      elTagName: {
        view: true,
        value: 'ul'
      },
      /**
       * 默认子项的样式
       * @type {String}
       * @override
       */
      defaultChildClass: {
        value: 'bar-item'
      },
      /**
       * 获取焦点
       * @protected
       * @ignore
       */
      focusable: {
        value: false
      },
      /**
       * @private
       * @ignore
       */
      xview: {
        value: barView
      }
    }
  }, {
    xclass: 'bar',
    priority: 1
  });
  module.exports = Bar;
});
define("bui/toolbar/pagingbar", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview  a specialized toolbar that is bound to a Grid.Store and provides automatic paging control.
   * @author dxq613@gmail.com, yiminghe@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Bar = require("bui/toolbar/bar"),
    Component = BUI.Component,
    Bindable = Component.UIBase.Bindable;
  var PREFIX = BUI.prefix,
    ID_FIRST = 'first',
    ID_PREV = 'prev',
    ID_NEXT = 'next',
    ID_LAST = 'last',
    ID_SKIP = 'skip',
    ID_REFRESH = 'refresh',
    ID_TOTAL_PAGE = 'totalPage',
    ID_CURRENT_PAGE = 'curPage',
    ID_TOTAL_COUNT = 'totalCount',
    ID_BUTTONS = [ID_FIRST, ID_PREV, ID_NEXT, ID_LAST, ID_SKIP, ID_REFRESH],
    ID_TEXTS = [ID_TOTAL_PAGE, ID_CURRENT_PAGE, ID_TOTAL_COUNT];
  /**
   * 分页栏
   * xclass:'pagingbar'
   * @extends BUI.Toolbar.Bar
   * @mixins BUI.Component.UIBase.Bindable
   * @class BUI.Toolbar.PagingBar
   */
  var PagingBar = Bar.extend([Bindable], {
    /**
     * From Bar, Initialize this paging bar items.
     *
     * @protected
     */
    initializer: function() {
      var _self = this,
        children = _self.get('children'),
        items = _self.get('items'),
        store = _self.get('store');
      if (!items) {
        items = _self._getItems();
        BUI.each(items, function(item) {
          children.push(item); //item
        });
      } else {
        BUI.each(items, function(item, index) { //转换对应的分页栏
          if (BUI.isString(item)) {
            if (BUI.Array.contains(item, ID_BUTTONS)) {
              item = _self._getButtonItem(item);
            } else if (BUI.Array.contains(item, ID_TEXTS)) {
              item = _self._getTextItem(item);
            } else {
              item = {
                xtype: item
              };
            }
          }
          children.push(item);
        });
      }
      if (store && store.get('pageSize')) {
        _self.set('pageSize', store.get('pageSize'));
      }
    },
    /**
     * bind page change and store events
     *
     * @protected
     */
    bindUI: function() {
      var _self = this;
      _self._bindButtonEvent();
      //_self._bindStoreEvents();
    },
    /**
     * skip to page
     * this method can fire "beforepagechange" event,
     * if you return false in the handler the action will be canceled
     * @param {Number} page target page
     */
    jumpToPage: function(page) {
      if (page <= 0 || page > this.get('totalPage')) {
        return;
      }
      var _self = this,
        store = _self.get('store'),
        pageSize = _self.get('pageSize'),
        index = page - 1,
        start = index * pageSize;
      var result = _self.fire('beforepagechange', {
        from: _self.get('curPage'),
        to: page
      });
      if (store && result !== false) {
        store.load({
          start: start,
          limit: pageSize,
          pageIndex: index
        });
      }
    },
    //after store loaded data,reset the information of paging bar and buttons state
    _afterStoreLoad: function(store, params) {
      var _self = this,
        pageSize = _self.get('pageSize'),
        start = 0, //页面的起始记录
        end, //页面的结束记录
        totalCount, //记录的总数
        curPage, //当前页
        totalPage; //总页数;
      start = store.get('start');
      //设置加载数据后翻页栏的状态
      totalCount = store.getTotalCount();
      end = totalCount - start > pageSize ? start + store.getCount() - 1 : totalCount;
      totalPage = parseInt((totalCount + pageSize - 1) / pageSize, 10);
      totalPage = totalPage > 0 ? totalPage : 1;
      curPage = parseInt(start / pageSize, 10) + 1;
      _self.set('start', start);
      _self.set('end', end);
      _self.set('totalCount', totalCount);
      _self.set('curPage', curPage);
      _self.set('totalPage', totalPage);
      //设置按钮状态
      _self._setAllButtonsState();
      _self._setNumberPages();
    },
    //bind page change events
    _bindButtonEvent: function() {
      var _self = this;
      //first page handler
      _self._bindButtonItemEvent(ID_FIRST, function() {
        _self.jumpToPage(1);
      });
      //previous page handler
      _self._bindButtonItemEvent(ID_PREV, function() {
        _self.jumpToPage(_self.get('curPage') - 1);
      });
      //previous page next
      _self._bindButtonItemEvent(ID_NEXT, function() {
        _self.jumpToPage(_self.get('curPage') + 1);
      });
      //previous page next
      _self._bindButtonItemEvent(ID_LAST, function() {
        _self.jumpToPage(_self.get('totalPage'));
      });
      //skip to one page
      _self._bindButtonItemEvent(ID_SKIP, function() {
        handleSkip();
      });
      //refresh
      _self._bindButtonItemEvent(ID_REFRESH, function() {
        _self.jumpToPage(_self.get('curPage'));
      });
      //input page number and press key "enter"
      var curPage = _self.getItem(ID_CURRENT_PAGE);
      if (curPage) {
        curPage.get('el').on('keyup', function(event) {
          event.stopPropagation();
          if (event.keyCode === 13) {
            handleSkip();
          }
        });
      }
      //when click skip button or press key "enter",cause an action of skipping page
      /**
       * @private
       * @ignore
       */
      function handleSkip() {
        var value = parseInt(_self._getCurrentPageValue(), 10);
        if (_self._isPageAllowRedirect(value)) {
          _self.jumpToPage(value);
        } else {
          _self._setCurrentPageValue(_self.get('curPage'));
        }
      }
    },
    // bind button item event
    _bindButtonItemEvent: function(id, func) {
      var _self = this,
        item = _self.getItem(id);
      if (item) {
        item.on('click', func);
      }
    },
    onLoad: function(params) {
      var _self = this,
        store = _self.get('store');
      _self._afterStoreLoad(store, params);
    },
    //get the items of paging bar
    _getItems: function() {
      var _self = this,
        items = _self.get('items');
      if (items && items.length) {
        return items;
      }
      //default items
      items = [];
      //first item
      items.push(_self._getButtonItem(ID_FIRST));
      //previous item
      items.push(_self._getButtonItem(ID_PREV));
      //separator item
      items.push(_self._getSeparator());
      //total page of store
      items.push(_self._getTextItem(ID_TOTAL_PAGE));
      //current page of store
      items.push(_self._getTextItem(ID_CURRENT_PAGE));
      //button for skip to
      items.push(_self._getButtonItem(ID_SKIP));
      //separator item
      items.push(_self._getSeparator());
      //next item
      items.push(_self._getButtonItem(ID_NEXT));
      //last item
      items.push(_self._getButtonItem(ID_LAST));
      //separator item
      items.push(_self._getSeparator());
      //current page of store
      items.push(_self._getTextItem(ID_TOTAL_COUNT));
      return items;
    },
    //get item which the xclass is button
    _getButtonItem: function(id) {
      var _self = this;
      return {
        id: id,
        xclass: 'bar-item-button',
        text: _self.get(id + 'Text'),
        disabled: true,
        elCls: _self.get(id + 'Cls')
      };
    },
    //get separator item
    _getSeparator: function() {
      return {
        xclass: 'bar-item-separator'
      };
    },
    //get text item
    _getTextItem: function(id) {
      var _self = this;
      return {
        id: id,
        xclass: 'bar-item-text',
        text: _self._getTextItemTpl(id)
      };
    },
    //get text item's template
    _getTextItemTpl: function(id) {
      var _self = this,
        obj = _self.getAttrVals();
      return BUI.substitute(this.get(id + 'Tpl'), obj);
    },
    //Whether to allow jump, if it had been in the current page or not within the scope of effective page, not allowed to jump
    _isPageAllowRedirect: function(value) {
      var _self = this;
      return value && value > 0 && value <= _self.get('totalPage') && value !== _self.get('curPage');
    },
    //when page changed, reset all buttons state
    _setAllButtonsState: function() {
      var _self = this,
        store = _self.get('store');
      if (store) {
        _self._setButtonsState([ID_PREV, ID_NEXT, ID_FIRST, ID_LAST, ID_SKIP], true);
      }
      if (_self.get('curPage') === 1) {
        _self._setButtonsState([ID_PREV, ID_FIRST], false);
      }
      if (_self.get('curPage') === _self.get('totalPage')) {
        _self._setButtonsState([ID_NEXT, ID_LAST], false);
      }
    },
    //if button id in the param buttons,set the button state
    _setButtonsState: function(buttons, enable) {
      var _self = this,
        children = _self.get('children');
      BUI.each(children, function(child) {
        if (BUI.Array.indexOf(child.get('id'), buttons) !== -1) {
          child.set('disabled', !enable);
        }
      });
    },
    //show the information of current page , total count of pages and total count of records
    _setNumberPages: function() {
      var _self = this,
        items = _self.getItems();
      /*,
                      totalPageItem = _self.getItem(ID_TOTAL_PAGE),
                      totalCountItem = _self.getItem(ID_TOTAL_COUNT);
                  if (totalPageItem) {
                      totalPageItem.set('content', _self._getTextItemTpl(ID_TOTAL_PAGE));
                  }
                  _self._setCurrentPageValue(_self.get(ID_CURRENT_PAGE));
                  if (totalCountItem) {
                      totalCountItem.set('content', _self._getTextItemTpl(ID_TOTAL_COUNT));
                  }*/
      BUI.each(items, function(item) {
        if (item.__xclass === 'bar-item-text') {
          item.set('content', _self._getTextItemTpl(item.get('id')));
        }
      });
    },
    _getCurrentPageValue: function(curItem) {
      var _self = this;
      curItem = curItem || _self.getItem(ID_CURRENT_PAGE);
      if (curItem) {
        var textEl = curItem.get('el').find('input');
        return textEl.val();
      }
    },
    //show current page in textbox
    _setCurrentPageValue: function(value, curItem) {
      var _self = this;
      curItem = curItem || _self.getItem(ID_CURRENT_PAGE);
      if (curItem) {
        var textEl = curItem.get('el').find('input');
        textEl.val(value);
      }
    }
  }, {
    ATTRS: {
      /**
       * the text of button for first page
       * @default {String} "首 页"
       */
      firstText: {
        value: '首 页'
      },
      /**
       * the cls of button for first page
       * @default {String} "bui-pb-first"
       */
      firstCls: {
        value: PREFIX + 'pb-first'
      },
      /**
       * the text for previous page button
       * @default {String} "前一页"
       */
      prevText: {
        value: '上一页'
      },
      /**
       * the cls for previous page button
       * @default {String} "bui-pb-prev"
       */
      prevCls: {
        value: PREFIX + 'pb-prev'
      },
      /**
       * the text for next page button
       * @default {String} "下一页"
       */
      nextText: {
        value: '下一页'
      },
      /**
       * the cls for next page button
       * @default {String} "bui-pb-next"
       */
      nextCls: {
        value: PREFIX + 'pb-next'
      },
      /**
       * the text for last page button
       * @default {String} "末 页"
       */
      lastText: {
        value: '末 页'
      },
      /**
       * the cls for last page button
       * @default {String} "bui-pb-last"
       */
      lastCls: {
        value: PREFIX + 'pb-last'
      },
      /**
       * the text for skip page button
       * @default {String} "跳 转"
       */
      skipText: {
        value: '确定'
      },
      /**
       * the cls for skip page button
       * @default {String} "bui-pb-last"
       */
      skipCls: {
        value: PREFIX + 'pb-skip'
      },
      refreshText: {
        value: '刷新'
      },
      refreshCls: {
        value: PREFIX + 'pb-refresh'
      },
      /**
       * the template of total page info
       * @default {String} '共 {totalPage} 页'
       */
      totalPageTpl: {
        value: '共 {totalPage} 页'
      },
      /**
       * the template of current page info
       * @default {String} '第 &lt;input type="text" autocomplete="off" class="bui-pb-page" size="20" name="inputItem"&gt; 页'
       */
      curPageTpl: {
        value: '第 <input type="text" ' + 'autocomplete="off" class="' + PREFIX + 'pb-page" size="20" value="{curPage}" name="inputItem"> 页'
      },
      /**
       * the template of total count info
       * @default {String} '共{totalCount}条记录'
       */
      totalCountTpl: {
        value: '共{totalCount}条记录'
      },
      autoInitItems: {
        value: false
      },
      /**
       * current page of the paging bar
       * @private
       * @default {Number} 0
       */
      curPage: {
        value: 0
      },
      /**
       * total page of the paging bar
       * @private
       * @default {Number} 0
       */
      totalPage: {
        value: 0
      },
      /**
       * total count of the store that the paging bar bind to
       * @private
       * @default {Number} 0
       */
      totalCount: {
        value: 0
      },
      /**
       * The number of records considered to form a 'page'.
       * if store set the property ,override this value by store's pageSize
       * @private
       */
      pageSize: {
        value: 30
      },
      /**
       * The {@link BUI.Data.Store} the paging toolbar should use as its data source.
       * @protected
       */
      store: {}
    },
    ID_FIRST: ID_FIRST,
    ID_PREV: ID_PREV,
    ID_NEXT: ID_NEXT,
    ID_LAST: ID_LAST,
    ID_SKIP: ID_SKIP,
    ID_REFRESH: ID_REFRESH,
    ID_TOTAL_PAGE: ID_TOTAL_PAGE,
    ID_CURRENT_PAGE: ID_CURRENT_PAGE,
    ID_TOTAL_COUNT: ID_TOTAL_COUNT
  }, {
    xclass: 'pagingbar',
    priority: 2
  });
  module.exports = PagingBar;
});
define("bui/toolbar/numberpagingbar", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview  a specialized toolbar that is bound to a Grid.Store and provides automatic paging control.
   * @author
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    PBar = require("bui/toolbar/pagingbar");
  var PREFIX = BUI.prefix,
    NUMBER_CONTAINER = 'numberContainer',
    CLS_NUMBER_BUTTON = PREFIX + 'button-number';
  /**
   * 数字分页栏
   * xclass:'pagingbar-number'
   * @extends BUI.Toolbar.PagingBar
   * @class BUI.Toolbar.NumberPagingBar
   */
  var NumberPagingBar = PBar.extend({
    /**
     * get the initial items of paging bar
     * @protected
     *
     */
    _getItems: function() {
      var _self = this,
        items = _self.get('items');
      if (items) {
        return items;
      }
      //default items
      items = [];
      //previous item
      items.push(_self._getButtonItem(PBar.ID_PREV));
      //next item
      items.push(_self._getButtonItem(PBar.ID_NEXT));
      return items;
    },
    _getButtonItem: function(id) {
      var _self = this;
      return {
        id: id,
        content: '<a href="javascript:;">' + _self.get(id + 'Text') + '</a>',
        disabled: true
      };
    },
    /**
     * bind buttons event
     * @protected
     *
     */
    _bindButtonEvent: function() {
      var _self = this,
        cls = _self.get('numberButtonCls');
      NumberPagingBar.superclass._bindButtonEvent.call(this);
      _self.get('el').delegate('a', 'click', function(ev) {
        ev.preventDefault();
      });
      _self.on('click', function(ev) {
        var item = ev.target;
        if (item && item.get('el').hasClass(cls)) {
          var page = item.get('id');
          _self.jumpToPage(page);
        }
      });
    },
    //设置页码信息，设置 页数 按钮
    _setNumberPages: function() {
      var _self = this;
      _self._setNumberButtons();
    },
    //设置 页数 按钮
    _setNumberButtons: function() {
      var _self = this,
        curPage = _self.get('curPage'),
        totalPage = _self.get('totalPage'),
        numberItems = _self._getNumberItems(curPage, totalPage),
        curItem;
      _self._clearNumberButtons();
      BUI.each(numberItems, function(item) {
        _self._appendNumberButton(item);
      });
      curItem = _self.getItem(curPage);
      if (curItem) {
        curItem.set('selected', true);
      }
    },
    _appendNumberButton: function(cfg) {
      var _self = this,
        count = _self.getItemCount();
      var item = _self.addItemAt(cfg, count - 1);
    },
    _clearNumberButtons: function() {
      var _self = this,
        items = _self.getItems(),
        count = _self.getItemCount();
      while (count > 2) {
        _self.removeItemAt(count - 2);
        count = _self.getItemCount();
      }
    },
    //获取所有页码按钮的配置项
    _getNumberItems: function(curPage, totalPage) {
      var _self = this,
        result = [],
        maxLimitCount = _self.get('maxLimitCount'),
        showRangeCount = _self.get('showRangeCount'),
        maxPage;

      function addNumberItem(from, to) {
        for (var i = from; i <= to; i++) {
          result.push(_self._getNumberItem(i));
        }
      }

      function addEllipsis() {
        result.push(_self._getEllipsisItem());
      }
      if (totalPage < maxLimitCount) {
        maxPage = totalPage;
        addNumberItem(1, totalPage);
      } else {
        var startNum = (curPage <= maxLimitCount) ? 1 : (curPage - showRangeCount),
          lastLimit = curPage + showRangeCount,
          endNum = lastLimit < totalPage ? (lastLimit > maxLimitCount ? lastLimit : maxLimitCount) : totalPage;
        if (startNum > 1) {
          addNumberItem(1, 1);
          if (startNum > 2) {
            addEllipsis();
          }
        }
        maxPage = endNum;
        addNumberItem(startNum, endNum);
      }
      if (maxPage < totalPage) {
        if (maxPage < totalPage - 1) {
          addEllipsis();
        }
        addNumberItem(totalPage, totalPage);
      }
      return result;
    },
    //获取省略号
    _getEllipsisItem: function() {
      var _self = this;
      return {
        disabled: true,
        content: _self.get('ellipsisTpl')
      };
    },
    //生成页面按钮配置项
    _getNumberItem: function(page) {
      var _self = this;
      return {
        id: page,
        elCls: _self.get('numberButtonCls')
      };
    }
  }, {
    ATTRS: {
      itemStatusCls: {
        value: {
          selected: 'active',
          disabled: 'disabled'
        }
      },
      itemTpl: {
        value: '<a href="">{id}</a>'
      },
      prevText: {
        value: '<<'
      },
      nextText: {
        value: '>>'
      },
      /**
       * 当页码超过该设置页码时候显示省略号
       * @default {Number} 4
       */
      maxLimitCount: {
        value: 4
      },
      showRangeCount: {
        value: 1
      },
      /**
       * the css used on number button
       */
      numberButtonCls: {
        value: CLS_NUMBER_BUTTON
      },
      /**
       * the template of ellipsis which represent the omitted pages number
       */
      ellipsisTpl: {
        value: '<a href="#">...</a>'
      }
    }
  }, {
    xclass: 'pagingbar-number',
    priority: 3
  });
  module.exports = NumberPagingBar;
});
define("bui/calendar", ["bui/common", "jquery", "bui/picker", "bui/overlay", "bui/list", "bui/data", "bui/toolbar"], function(require, exports, module) {
  /**
   * @fileOverview 日历命名空间入口
   * @ignore
   */
  var BUI = require("bui/common"),
    Calendar = BUI.namespace('Calendar');
  BUI.mix(Calendar, {
    Calendar: require("bui/calendar/calendar"),
    MonthPicker: require("bui/calendar/monthpicker"),
    DatePicker: require("bui/calendar/datepicker")
  });
  module.exports = Calendar;
});
define("bui/calendar/calendar", ["bui/common", "jquery", "bui/picker", "bui/overlay", "bui/list", "bui/data", "bui/toolbar"], function(require, exports, module) {
  /**
   * @fileOverview 日期控件
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    CLS_PICKER_TIME = 'x-datepicker-time',
    CLS_PICKER_HOUR = 'x-datepicker-hour',
    CLS_PICKER_MINUTE = 'x-datepicker-minute',
    CLS_PICKER_SECOND = 'x-datepicker-second',
    CLS_TIME_PICKER = 'x-timepicker',
    Picker = require("bui/picker").ListPicker,
    MonthPicker = require("bui/calendar/monthpicker"),
    Header = require("bui/calendar/header"),
    Panel = require("bui/calendar/panel"),
    Toolbar = require("bui/toolbar"),
    Component = BUI.Component,
    DateUtil = BUI.Date;

  function today() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function fixedNumber(n) {
    if (n < 10) {
      return '0' + n;
    }
    return n.toString();
  }

  function getNumberItems(end) {
    var items = [];
    for (var i = 0; i < end; i++) {
      items.push({
        text: fixedNumber(i),
        value: fixedNumber(i)
      });
    }
    return items;
  }

  function getTimeUnit(self, cls) {
    var inputEl = self.get('el').find('.' + cls);
    return parseInt(inputEl.val(), 10);
  }

  function setTimeUnit(self, cls, val) {
      var inputEl = self.get('el').find('.' + cls);
      if (BUI.isNumber(val)) {
        val = fixedNumber(val);
      }
      inputEl.val(val);
    }
    /**
     * 日期控件
     * <p>
     * <img src="../assets/img/class-calendar.jpg"/>
     * </p>
     * xclass:'calendar'
     * <pre><code>
     *  BUI.use('bui/calendar',function(Calendar){
     *    var calendar = new Calendar.Calendar({
     *      render:'#calendar'
     *    });
     *    calendar.render();
     *    calendar.on('selectedchange',function (ev) {
     *      alert(ev.date);
     *    });
     * });
     * </code></pre>
     * @class BUI.Calendar.Calendar
     * @extends BUI.Component.Controller
     */
  var calendar = Component.Controller.extend({
    //设置内容
    initializer: function() {
      var _self = this,
        children = _self.get('children'),
        header = new Header(),
        panel = new Panel(),
        footer = _self.get('footer') || _self._createFooter();
      /*,
            monthPicker = _self.get('monthPicker') || _self._createMonthPicker();*/
      //添加头
      children.push(header);
      //添加panel
      children.push(panel);
      children.push(footer);
      //children.push(monthPicker);
      _self.set('header', header);
      _self.set('panel', panel);
      _self.set('footer', footer);
      //_self.set('monthPicker',monthPicker);
    },
    renderUI: function() {
      var _self = this,
        children = _self.get('children');
      if (_self.get('showTime')) {
        var timepicker = _self.get('timepicker') || _self._initTimePicker();
        children.push(timepicker);
        _self.set('timepicker', timepicker);
      }
    },
    //绑定事件
    bindUI: function() {
      var _self = this,
        header = _self.get('header'),
        panel = _self.get('panel');
      panel.on('selectedchange', function(e) {
        var date = e.date;
        if (!DateUtil.isDateEquals(date, _self.get('selectedDate'))) {
          _self.set('selectedDate', date);
        }
      });
      if (!_self.get('showTime')) {
        panel.on('click', function() {
          _self.fire('accept');
        });
      } else {
        _self._initTimePickerEvent();
      }
      header.on('monthchange', function(e) {
        _self._setYearMonth(e.year, e.month);
      });
      header.on('headerclick', function() {
        var monthPicker = _self.get('monthpicker') || _self._createMonthPicker();
        monthPicker.set('year', header.get('year'));
        monthPicker.set('month', header.get('month'));
        monthPicker.show();
      });
    },
    _initTimePicker: function() {
      var _self = this,
        lockTime = _self.get('lockTime'),
        _timePickerEnum = {
          hour: CLS_PICKER_HOUR,
          minute: CLS_PICKER_MINUTE,
          second: CLS_PICKER_SECOND
        };
      if (lockTime) {
        for (var key in lockTime) {
          var noCls = _timePickerEnum[key.toLowerCase()];
          _self.set(key, lockTime[key]);
          if (!lockTime.editable) {
            _self.get('el').find("." + noCls).attr("disabled", "");
          }
        }
      }
      var picker = new Picker({
        elCls: CLS_TIME_PICKER,
        children: [{
          itemTpl: '<li><a href="#">{text}</a></li>'
        }],
        autoAlign: false,
        align: {
          node: _self.get('el').find('.bui-calendar-footer'),
          points: ['tl', 'bl'],
          offset: [-1, 1]
        },
        trigger: _self.get('el').find('.' + CLS_PICKER_TIME)
      });
      picker.render();
      _self._initTimePickerEvent(picker);
      return picker;
    },
    _initTimePickerEvent: function(picker) {
      var _self = this,
        picker = _self.get('timepicker');
      if (!picker) {
        return;
      }
      picker.get('el').delegate('a', 'click', function(ev) {
        ev.preventDefault();
      });
      picker.on('triggerchange', function(ev) {
        var curTrigger = ev.curTrigger;
        if (curTrigger.hasClass(CLS_PICKER_HOUR)) {
          picker.get('list').set('items', getNumberItems(24));
        } else {
          picker.get('list').set('items', getNumberItems(60));
        }
      });
      picker.on('selectedchange', function(ev) {
        var curTrigger = ev.curTrigger,
          val = ev.value;
        if (curTrigger.hasClass(CLS_PICKER_HOUR)) {
          _self.setInternal('hour', val);
        } else if (curTrigger.hasClass(CLS_PICKER_MINUTE)) {
          _self.setInternal('minute', val);
        } else {
          _self.setInternal('second', val);
        }
      });
    },
    //更改年和月
    _setYearMonth: function(year, month) {
      var _self = this,
        selectedDate = _self.get('selectedDate'),
        date = selectedDate.getDate();
      if (year !== selectedDate.getFullYear() || month !== selectedDate.getMonth()) {
        var newDate = new Date(year, month, date);
        if (newDate.getMonth() != month) { //下一个月没有对应的日期,定位到下一个月最后一天
          newDate = DateUtil.addDay(-1, new Date(year, month + 1));
        }
        _self.set('selectedDate', newDate);
      }
    },
    //创建选择月的控件
    _createMonthPicker: function() {
      var _self = this,
        monthpicker;
      monthpicker = new MonthPicker({
        render: _self.get('el'),
        effect: {
          effect: 'slide',
          duration: 300
        },
        visibleMode: 'display',
        success: function() {
          var picker = this;
          _self._setYearMonth(picker.get('year'), picker.get('month'));
          picker.hide();
        },
        cancel: function() {
          this.hide();
        }
      });
      _self.set('monthpicker', monthpicker);
      _self.get('children').push(monthpicker);
      return monthpicker;
    },
    //创建底部按钮栏
    _createFooter: function() {
      var _self = this,
        showTime = this.get('showTime'),
        items = [];
      if (showTime) {
        items.push({
          content: _self.get('timeTpl')
        });
        items.push({
          xclass: 'bar-item-button',
          text: '确定',
          btnCls: 'button button-small button-primary',
          listeners: {
            click: function() {
              _self.fire('accept');
            }
          }
        });
      } else {
        items.push({
          xclass: 'bar-item-button',
          text: '今天',
          btnCls: 'button button-small',
          id: 'todayBtn',
          listeners: {
            click: function() {
              var day = today();
              _self.set('selectedDate', day);
              _self.fire('accept');
            }
          }
        });
        items.push({
          xclass: 'bar-item-button',
          text: '清除',
          btnCls: 'button button-small',
          id: 'clsBtn',
          listeners: {
            click: function() {
              _self.fire('clear');
            }
          }
        });
      }
      return new Toolbar.Bar({
        elCls: PREFIX + 'calendar-footer',
        children: items
      });
    },
    //更新今天按钮的状态
    _updateTodayBtnAble: function() {
      var _self = this;
      if (!_self.get('showTime')) {
        var footer = _self.get("footer"),
          panelView = _self.get("panel").get("view"),
          now = today(),
          btn = footer.getItem("todayBtn");
        panelView._isInRange(now) ? btn.enable() : btn.disable();
      }
    },
    //设置所选日期
    _uiSetSelectedDate: function(v) {
      var _self = this,
        year = v.getFullYear(),
        month = v.getMonth();
      _self.get('header').setMonth(year, month);
      _self.get('panel').set('selected', v);
      _self.fire('datechange', {
        date: v
      });
    },
    _uiSetHour: function(v) {
      setTimeUnit(this, CLS_PICKER_HOUR, v);
    },
    _uiSetMinute: function(v) {
      setTimeUnit(this, CLS_PICKER_MINUTE, v);
    },
    _uiSetSecond: function(v) {
      setTimeUnit(this, CLS_PICKER_SECOND, v);
    },
    //设置最大值
    _uiSetMaxDate: function(v) {
      var _self = this;
      _self.get('panel').set('maxDate', v);
      _self._updateTodayBtnAble();
    },
    //设置最小值
    _uiSetMinDate: function(v) {
      var _self = this;
      _self.get('panel').set('minDate', v);
      _self._updateTodayBtnAble();
    }
  }, {
    ATTRS: {
      /**
       * 日历控件头部，选择年月
       * @private
       * @type {Object}
       */
      header: {},
      /**
       * 日历控件选择日
       * @private
       * @type {Object}
       */
      panel: {},
      /**
       * 最大日期
       * <pre><code>
       *   calendar.set('maxDate','2013-07-29');
       * </code></pre>
       * @type {Date}
       */
      maxDate: {},
      /**
       * 最小日期
       * <pre><code>
       *   calendar.set('minDate','2013-07-29');
       * </code></pre>
       * @type {Date}
       */
      minDate: {},
      /**
       * 选择月份控件
       * @private
       * @type {Object}
       */
      monthPicker: {},
      /**
       * 选择时间控件
       * @private
       * @type {Object}
       */
      timepicker: {},
      width: {
        value: 180
      },
      events: {
        value: {
          /**
           * @event
           * @name BUI.Calendar.Calendar#click
           * @param {Object} e 点击事件
           * @param {Date} e.date
           */
          'click': false,
          /**
           * 确认日期更改，如果不显示日期则当点击日期或者点击今天按钮时触发，如果显示日期，则当点击确认按钮时触发。
           * @event
           */
          'accept': false,
          /**
           * @event
           * @name BUI.Calendar.Calendar#datechange
           * @param {Object} e 选中的日期发生改变
           * @param {Date} e.date
           */
          'datechange': false,
          /**
           * @event
           * @name BUI.Calendar.Calendar#monthchange
           * @param {Object} e 月份发生改变
           * @param {Number} e.year
           * @param {Number} e.month
           */
          'monthchange': false
        }
      },
      /**
       * 是否选择时间,此选项决定是否可以选择时间
       *
       * @cfg {Boolean} showTime
       */
      showTime: {
        value: false
      },
      /**
       * 锁定时间选择
       *<pre><code>
       *  var calendar = new Calendar.Calendar({
       *  render:'#calendar',
       *  lockTime : {hour:00,minute:30} //表示锁定时为00,分为30分,秒无锁用户可选择
       * });
       * </code></pre>
       *
       * @type {Object}
       */
      lockTime: {},
      timeTpl: {
        value: '<input type="text" readonly class="' + CLS_PICKER_TIME + ' ' + CLS_PICKER_HOUR + '" />:<input type="text" readonly class="' + CLS_PICKER_TIME + ' ' + CLS_PICKER_MINUTE + '" />:<input type="text" readonly class="' + CLS_PICKER_TIME + ' ' + CLS_PICKER_SECOND + '" />'
      },
      /**
       * 选择的日期,默认为当天
       * <pre><code>
       *  var calendar = new Calendar.Calendar({
       *  render:'#calendar',
       *   selectedDate : new Date('2013/07/01') //不能使用字符串
       * });
       * </code></pre>
       * @cfg {Date} selectedDate
       */
      /**
       * 选择的日期
       * <pre><code>
       *   calendar.set('selectedDate',new Date('2013-9-01'));
       * </code></pre>
       * @type {Date}
       * @default today
       */
      selectedDate: {
        value: today()
      },
      /**
       * 小时,默认为当前小时
       * @type {Number}
       */
      hour: {
        value: new Date().getHours()
      },
      /**
       * 分,默认为当前分
       * @type {Number}
       */
      minute: {
        value: new Date().getMinutes()
      },
      /**
       * 秒,默认为当前秒
       * @type {Number}
       */
      second: {
        value: 0
      }
    }
  }, {
    xclass: 'calendar',
    priority: 0
  });
  module.exports = calendar;
});
define("bui/calendar/monthpicker", ["jquery", "bui/common", "bui/overlay", "bui/list", "bui/data", "bui/toolbar"], function(require, exports, module) {
  /**
   * @fileOverview 选择年月
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    Overlay = require("bui/overlay").Overlay,
    List = require("bui/list").SimpleList,
    Toolbar = require("bui/toolbar"),
    PREFIX = BUI.prefix,
    CLS_MONTH = 'x-monthpicker-month',
    DATA_MONTH = 'data-month',
    DATA_YEAR = 'data-year',
    CLS_YEAR = 'x-monthpicker-year',
    CLS_YEAR_NAV = 'x-monthpicker-yearnav',
    CLS_SELECTED = 'x-monthpicker-selected',
    CLS_ITEM = 'x-monthpicker-item',
    months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  function getMonths() {
    return $.map(months, function(month, index) {
      return {
        text: month,
        value: index
      };
    });
  }
  var MonthPanel = List.extend({
    bindUI: function() {
      var _self = this;
      _self.get('el').delegate('a', 'click', function(ev) {
        ev.preventDefault();
      }).delegate('.' + CLS_MONTH, 'dblclick', function() {
        _self.fire('monthdblclick');
      });
    }
  }, {
    ATTRS: {
      itemTpl: {
        view: true,
        value: '<li class="' + CLS_ITEM + ' x-monthpicker-month"><a href="#" hidefocus="on">{text}</a></li>'
      },
      itemCls: {
        value: CLS_ITEM
      },
      items: {
        view: true,
        value: getMonths()
      },
      elCls: {
        view: true,
        value: 'x-monthpicker-months'
      }
    }
  }, {
    xclass: 'calendar-month-panel'
  });
  var YearPanel = List.extend({
    bindUI: function() {
      var _self = this,
        el = _self.get('el');
      el.delegate('a', 'click', function(ev) {
        ev.preventDefault();
      });
      el.delegate('.' + CLS_YEAR, 'dblclick', function() {
        _self.fire('yeardblclick');
      });
      el.delegate('.x-icon', 'click', function(ev) {
        var sender = $(ev.currentTarget);
        if (sender.hasClass(CLS_YEAR_NAV + '-prev')) {
          _self._prevPage();
        } else if (sender.hasClass(CLS_YEAR_NAV + '-next')) {
          _self._nextPage();
        }
      });
      _self.on('itemselected', function(ev) {
        if (ev.item) {
          _self.setInternal('year', ev.item.value);
        }
      });
    },
    _prevPage: function() {
      var _self = this,
        start = _self.get('start'),
        yearCount = _self.get('yearCount');
      _self.set('start', start - yearCount);
    },
    _nextPage: function() {
      var _self = this,
        start = _self.get('start'),
        yearCount = _self.get('yearCount');
      _self.set('start', start + yearCount);
    },
    _uiSetStart: function() {
      var _self = this;
      _self._setYearsContent();
    },
    _uiSetYear: function(v) {
      var _self = this,
        item = _self.findItemByField('value', v);
      if (item) {
        _self.setSelectedByField(v);
      } else {
        _self.set('start', v);
      }
    },
    _setYearsContent: function() {
      var _self = this,
        year = _self.get('year'),
        start = _self.get('start'),
        yearCount = _self.get('yearCount'),
        items = [];
      for (var i = start; i < start + yearCount; i++) {
        var text = i.toString();
        items.push({
          text: text,
          value: i
        });
      }
      _self.set('items', items);
      _self.setSelectedByField(year);
    }
  }, {
    ATTRS: {
      items: {
        view: true,
        value: []
      },
      elCls: {
        view: true,
        value: 'x-monthpicker-years'
      },
      itemCls: {
        value: CLS_ITEM
      },
      year: {},
      /**
       * 起始年
       * @private
       * @ignore
       * @type {Number}
       */
      start: {
        value: new Date().getFullYear()
      },
      /**
       * 年数
       * @private
       * @ignore
       * @type {Number}
       */
      yearCount: {
        value: 10
      },
      itemTpl: {
        view: true,
        value: '<li class="' + CLS_ITEM + ' ' + CLS_YEAR + '"><a href="#" hidefocus="on">{text}</a></li>'
      },
      tpl: {
        view: true,
        value: '<div class="' + CLS_YEAR_NAV + '">' + '<span class="' + CLS_YEAR_NAV + '-prev x-icon x-icon-normal x-icon-small"><span class="icon icon-caret icon-caret-left"></span></span>' + '<span class="' + CLS_YEAR_NAV + '-next x-icon x-icon-normal x-icon-small"><span class="icon icon-caret icon-caret-right"></span></span>' + '</div>' + '<ul></ul>'
      }
    }
  }, {
    xclass: 'calendar-year-panel'
  });
  /**
   * 月份选择器
   * xclass : 'calendar-monthpicker'
   * @class BUI.Calendar.MonthPicker
   * @extends BUI.Overlay.Overlay
   */
  var monthPicker = Overlay.extend({
    initializer: function() {
      var _self = this,
        children = _self.get('children'),
        monthPanel = new MonthPanel(),
        yearPanel = new YearPanel(),
        footer = _self._createFooter();
      children.push(monthPanel);
      children.push(yearPanel);
      children.push(footer);
      _self.set('yearPanel', yearPanel);
      _self.set('monthPanel', monthPanel);
    },
    bindUI: function() {
      var _self = this;
      _self.get('monthPanel').on('itemselected', function(ev) {
        if (ev.item) {
          _self.setInternal('month', ev.item.value);
        }
      }).on('monthdblclick', function() {
        _self._successCall();
      });
      _self.get('yearPanel').on('itemselected', function(ev) {
        if (ev.item) {
          _self.setInternal('year', ev.item.value);
        }
      }).on('yeardblclick', function() {
        _self._successCall();
      });
    },
    _successCall: function() {
      var _self = this,
        callback = _self.get('success');
      if (callback) {
        callback.call(_self);
      }
    },
    _createFooter: function() {
      var _self = this;
      return new Toolbar.Bar({
        elCls: PREFIX + 'clear x-monthpicker-footer',
        children: [{
          xclass: 'bar-item-button',
          text: '确定',
          btnCls: 'button button-small button-primary',
          handler: function() {
            _self._successCall();
          }
        }, {
          xclass: 'bar-item-button',
          text: '取消',
          btnCls: 'button button-small last',
          handler: function() {
            var callback = _self.get('cancel');
            if (callback) {
              callback.call(_self);
            }
          }
        }]
      });
    },
    _uiSetYear: function(v) {
      this.get('yearPanel').set('year', v);
    },
    _uiSetMonth: function(v) {
      this.get('monthPanel').setSelectedByField(v);
    }
  }, {
    ATTRS: {
      /**
       * 下部工具栏
       * @private
       * @type {Object}
       */
      footer: {},
      align: {
        value: {}
      },
      /**
       * 选中的年
       * @type {Number}
       */
      year: {},
      /**
       * 成功的回调函数
       * @type {Function}
       */
      success: {
        value: function() {}
      },
      /**
       * 取消的回调函数
       * @type {Function}
       */
      cancel: {
        value: function() {}
      },
      width: {
        value: 180
      },
      /**
       * 选中的月
       * @type {Number}
       */
      month: {},
      /**
       * 选择年的控件
       * @private
       * @type {Object}
       */
      yearPanel: {},
      /**
       * 选择月的控件
       * @private
       * @type {Object}
       */
      monthPanel: {}
    }
  }, {
    xclass: 'monthpicker'
  });
  module.exports = monthPicker;
});
define("bui/calendar/header", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 日期控件来选择年月的部分
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    Component = BUI.Component,
    CLS_TEXT_YEAR = 'year-text',
    CLS_TEXT_MONTH = 'month-text',
    CLS_ARROW = 'x-datepicker-arrow',
    CLS_PREV = 'x-datepicker-prev',
    CLS_NEXT = 'x-datepicker-next';
  /**
   * 日历控件显示选择年月
   * xclass:'calendar-header'
   * @class BUI.Calendar.Header
   * @private
   * @extends BUI.Component.Controller
   */
  var header = Component.Controller.extend({
    bindUI: function() {
      var _self = this,
        el = _self.get('el');
      el.delegate('.' + CLS_ARROW, 'click', function(e) {
        e.preventDefault();
        var sender = $(e.currentTarget);
        if (sender.hasClass(CLS_NEXT)) {
          _self.nextMonth();
        } else if (sender.hasClass(CLS_PREV)) {
          _self.prevMonth();
        }
      });
      el.delegate('.x-datepicker-month', 'click', function() {
        _self.fire('headerclick');
      });
    },
    /**
     * 设置年月
     * @ignore
     * @param {Number} year  年
     * @param {Number} month 月
     */
    setMonth: function(year, month) {
      var _self = this,
        curYear = _self.get('year'),
        curMonth = _self.get('month');
      if (year !== curYear || month !== curMonth) {
        _self.set('year', year);
        _self.set('month', month);
        _self.fire('monthchange', {
          year: year,
          month: month
        });
      }
    },
    /**
     * 下一月
     * @ignore
     */
    nextMonth: function() {
      var _self = this,
        date = new Date(_self.get('year'), _self.get('month') + 1);
      _self.setMonth(date.getFullYear(), date.getMonth());
    },
    /**
     * 上一月
     * @ignore
     */
    prevMonth: function() {
      var _self = this,
        date = new Date(_self.get('year'), _self.get('month') - 1);
      _self.setMonth(date.getFullYear(), date.getMonth());
    },
    _uiSetYear: function(v) {
      var _self = this;
      _self.get('el').find('.' + CLS_TEXT_YEAR).text(v);
    },
    _uiSetMonth: function(v) {
      var _self = this;
      _self.get('el').find('.' + CLS_TEXT_MONTH).text(v + 1);
    }
  }, {
    ATTRS: {
      /**
       * 年
       * @type {Number}
       */
      year: {
        sync: false
      },
      /**
       * 月
       * @type {Number}
       */
      month: {
        sync: false,
        setter: function(v) {
          this.set('monthText', v + 1);
        }
      },
      /**
       * @private
       * @type {Object}
       */
      monthText: {},
      tpl: {
        view: true,
        value: '<div class="' + CLS_ARROW + ' ' + CLS_PREV + '"><span class="icon icon-white icon-caret  icon-caret-left"></span></div>' + '<div class="x-datepicker-month">' + '<div class="month-text-container">' + '<span><span class="year-text">{year}</span>年 <span class="month-text">{monthText}</span>月</span>' + '<span class="' + PREFIX + 'caret ' + PREFIX + 'caret-down"></span>' + '</div>' + '</div>' + '<div class="' + CLS_ARROW + ' ' + CLS_NEXT + '"><span class="icon icon-white icon-caret  icon-caret-right"></span></div>'
      },
      elCls: {
        view: true,
        value: 'x-datepicker-header'
      },
      events: {
        value: {
          /**
           * 月发生改变，年发生改变也意味着月发生改变
           * @event
           * @param {Object} e 事件对象
           * @param {Number} e.year 年
           * @param {Number} e.month 月
           */
          'monthchange': true
        }
      }
    }
  }, {
    xclass: 'calendar-header'
  });
  module.exports = header;
});
define("bui/calendar/panel", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 日历控件显示一月的日期
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    DateUtil = BUI.Date,
    CLS_DATE = 'x-datepicker-date',
    CLS_TODAY = 'x-datepicker-today',
    CLS_DISABLED = 'x-datepicker-disabled',
    CLS_ACTIVE = 'x-datepicker-active',
    DATA_DATE = 'data-date', //存储日期对象
    DATE_MASK = 'isoDate',
    CLS_SELECTED = 'x-datepicker-selected',
    SHOW_WEEKS = 6, //当前容器显示6周
    dateTypes = {
      deactive: 'prevday',
      active: 'active',
      disabled: 'disabled'
    },
    weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  /**
   * 日历面板的视图类
   * @class BUI.Calendar.PanelView
   * @extends BUI.Component.View
   * @private
   */
  var panelView = Component.View.extend({
    renderUI: function() {
      this.updatePanel();
    },
    //更新容器，当月、年发生改变时
    updatePanel: function() {
      var _self = this,
        el = _self.get('el'),
        bodyEl = el.find('tbody'),
        innerTem = _self._getPanelInnerTpl();
      bodyEl.empty();
      $(innerTem).appendTo(bodyEl);
    },
    //获取容器内容
    _getPanelInnerTpl: function() {
      var _self = this,
        startDate = _self._getFirstDate(),
        temps = [];
      for (var i = 0; i < SHOW_WEEKS; i++) {
        var weekStart = DateUtil.addWeek(i, startDate);
        temps.push(_self._getWeekTpl(weekStart));
      };
      return temps.join('');
    },
    //获取周模版
    _getWeekTpl: function(startDate) {
      var _self = this,
        weekTpl = _self.get('weekTpl'),
        daysTemps = [];
      for (var i = 0; i < weekDays.length; i++) {
        var date = DateUtil.addDay(i, startDate);
        daysTemps.push(_self._getDayTpl(date));
      }
      return BUI.substitute(weekTpl, {
        daysTpl: daysTemps.join('')
      });
    },
    //获取日模版
    _getDayTpl: function(date) {
      var _self = this,
        dayTpl = _self.get('dayTpl'),
        day = date.getDay(),
        todayCls = _self._isToday(date) ? CLS_TODAY : '',
        dayOfWeek = weekDays[day],
        dateNumber = date.getDate(),
        //不是本月则处于不活动状态
        //不在指定的最大最小范围内，禁止选中
        dateType = _self._isInRange(date) ? (_self._isCurrentMonth(date) ? dateTypes.active : dateTypes.deactive) : dateTypes.disabled;
      return BUI.substitute(dayTpl, {
        dayOfWeek: dayOfWeek,
        dateType: dateType,
        dateNumber: dateNumber,
        todayCls: todayCls,
        date: DateUtil.format(date, DATE_MASK)
      });
    },
    //获取当前容器的第一天
    _getFirstDate: function(year, month) {
      var _self = this,
        monthFirstDate = _self._getMonthFirstDate(year, month),
        day = monthFirstDate.getDay();
      return DateUtil.addDay(day * -1, monthFirstDate);
    },
    //获取当月的第一天
    _getMonthFirstDate: function(year, month) {
      var _self = this,
        year = year || _self.get('year'),
        month = month || _self.get('month');
      return new Date(year, month);
    },
    //是否是当前显示的月
    _isCurrentMonth: function(date) {
      return date.getMonth() === this.get('month');
    },
    //是否是今天
    _isToday: function(date) {
      var tody = new Date();
      return tody.getFullYear() === date.getFullYear() && tody.getMonth() === date.getMonth() && tody.getDate() === date.getDate();
    },
    //是否在允许的范围内
    _isInRange: function(date) {
      var _self = this,
        maxDate = _self.get('maxDate'),
        minDate = _self.get('minDate');
      if (minDate && date < minDate) {
        return false;
      }
      if (maxDate && date > maxDate) {
        return false;
      }
      return true;
    },
    //清除选中的日期
    _clearSelectedDate: function() {
      var _self = this;
      _self.get('el').find('.' + CLS_SELECTED).removeClass(CLS_SELECTED);
    },
    //查找日期对应的DOM节点
    _findDateElement: function(date) {
      var _self = this,
        dateStr = DateUtil.format(date, DATE_MASK),
        activeList = _self.get('el').find('.' + CLS_DATE),
        result = null;
      if (dateStr) {
        activeList.each(function(index, item) {
          if ($(item).attr('title') === dateStr) {
            result = $(item);
            return false;
          }
        });
      }
      return result;
    },
    //设置选中的日期
    _setSelectedDate: function(date) {
      var _self = this,
        dateEl = _self._findDateElement(date);
      _self._clearSelectedDate();
      if (dateEl) {
        dateEl.addClass(CLS_SELECTED);
      }
    }
  }, {
    ATTRS: {}
  });
  /**
   * 日历控件显示日期的容器
   * xclass:'calendar-panel'
   * @class BUI.Calendar.Panel
   * @private
   * @extends BUI.Component.Controller
   */
  var panel = Component.Controller.extend({
    /**
     * 设置默认年月
     * @protected
     */
    initializer: function() {
      var _self = this,
        now = new Date();
      if (!_self.get('year')) {
        _self.set('year', now.getFullYear());
      }
      if (!_self.get('month')) {
        _self.set('month', now.getMonth());
      }
    },
    /**
     * @protected
     * @ignore
     */
    bindUI: function() {
      var _self = this,
        el = _self.get('el');
      el.delegate('.' + CLS_DATE, 'click', function(e) {
        e.preventDefault();
      });
      //阻止禁用的日期被选择
      el.delegate('.' + CLS_DISABLED, 'mouseup', function(e) {
        e.stopPropagation();
      });
    },
    /**
     * @protected
     * @ignore
     */
    performActionInternal: function(ev) {
      var _self = this,
        sender = $(ev.target).closest('.' + CLS_DATE);
      if (sender) {
        var date = sender.attr('title');
        if (date) {
          date = DateUtil.parse(date);
          if (_self.get('view')._isInRange(date)) {
            _self.set('selected', date);
          }
          //_self.fire('click',{date:date});
        }
      }
    },
    /**
     * 设置年月
     * @param {Number} year  年
     * @param {Number} month 月
     */
    setMonth: function(year, month) {
      var _self = this,
        curYear = _self.get('year'),
        curMonth = _self.get('month');
      if (year !== curYear || month !== curMonth) {
        _self.set('year', year);
        _self.set('month', month);
        //if(_self.get('rendered')){
        _self.get('view').updatePanel();
        //}
      }
    },
    //选中日期
    _uiSetSelected: function(date, ev) {
      var _self = this;
      if (!(ev && ev.prevVal && DateUtil.isDateEquals(date, ev.prevVal))) {
        _self.setMonth(date.getFullYear(), date.getMonth());
        _self.get('view')._setSelectedDate(date);
        _self.fire('selectedchange', {
          date: date
        });
      }
    },
    //设置最日期
    _uiSetMaxDate: function(v) {
      if (v) {
        this.get('view').updatePanel();
      }
    },
    //设置最小日期
    _uiSetMinDate: function(v) {
      if (v) {
        this.get('view').updatePanel();
      }
    }
  }, {
    ATTRS: {
      /**
       * 展示的月所属年
       * @type {Number}
       */
      year: {
        view: true
      },
      /**
       * 展示的月
       * @type {Number}
       */
      month: {
        view: true
      },
      /**
       * 选中的日期
       * @type {Date}
       */
      selected: {},
      focusable: {
        value: true
      },
      /**
       * 日期的模板
       * @private
       * @type {Object}
       */
      dayTpl: {
        view: true,
        value: '<td class="x-datepicker-date x-datepicker-{dateType} {todayCls} day-{dayOfWeek}" title="{date}">' + '<a href="#" hidefocus="on" tabindex="1">' + '<em><span>{dateNumber}</span></em>' + '</a>' + '</td>'
      },
      events: {
        value: {
          /**
           * @event
           * @name BUI.Calendar.Panel#click
           * @param {Object} e 点击事件
           * @param {Date} e.date
           */
          'click': false,
          /**
           * @name BUI.Calendar.Panel#selectedchange
           * @param {Object} e 点击事件
           * @param {Date} e.date
           */
          'selectedchange': true
        }
      },
      /**
       * 最小日期
       * @type {Date | String}
       */
      maxDate: {
        view: true,
        setter: function(val) {
          if (val) {
            if (BUI.isString(val)) {
              return DateUtil.parse(val);
            }
            return val;
          }
        }
      },
      /**
       * 最小日期
       * @type {Date | String}
       */
      minDate: {
        view: true,
        setter: function(val) {
          if (val) {
            if (BUI.isString(val)) {
              return DateUtil.parse(val);
            }
            return val;
          }
        }
      },
      /**
       * 周的模板
       * @private
       * @type {Object}
       */
      weekTpl: {
        view: true,
        value: '<tr>{daysTpl}</tr>'
      },
      tpl: {
        view: true,
        value: '<table class="x-datepicker-inner" cellspacing="0">' + '<thead>' + '<tr>' + '<th  title="Sunday"><span>日</span></th>' + '<th  title="Monday"><span>一</span></th>' + '<th  title="Tuesday"><span>二</span></th>' + '<th  title="Wednesday"><span>三</span></th>' + '<th  title="Thursday"><span>四</span></th>' + '<th  title="Friday"><span>五</span></th>' + '<th  title="Saturday"><span>六</span></th>' + '</tr>' + '</thead>' + '<tbody class="x-datepicker-body">' + '</tbody>' + '</table>'
      },
      xview: {
        value: panelView
      }
    }
  }, {
    xclass: 'calendar-panel',
    priority: 0
  });
  module.exports = panel;
});
define("bui/calendar/datepicker", ["bui/common", "jquery", "bui/picker", "bui/overlay", "bui/list", "bui/data", "bui/toolbar"], function(require, exports, module) {
  /**
   * @fileOverview 日期选择器
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    Picker = require("bui/picker").Picker,
    Calendar = require("bui/calendar/calendar"),
    DateUtil = BUI.Date;
  /**
   * 日期选择器，可以由输入框等触发
   * <p>
   * <img src="../assets/img/class-calendar.jpg"/>
   * </p>
   * xclass : 'calendar-datepicker'
   * <pre><code>
   *   BUI.use('bui/calendar',function(Calendar){
   *      var datepicker = new Calendar.DatePicker({
   *        trigger:'.calendar',
   *        //delegateTrigger : true, //如果设置此参数，那么新增加的.calendar元素也会支持日历选择
   *        autoRender : true
   *      });
   *    });
   * </code></pre>
   * @class BUI.Calendar.DatePicker
   * @extends BUI.Picker.Picker
   */
  var datepicker = Picker.extend({
    initializer: function() {},
    /**
     * @protected
     * 初始化内部控件
     */
    createControl: function() {
      var _self = this,
        children = _self.get('children'),
        calendar = new Calendar({
          render: _self.get('el'),
          showTime: _self.get('showTime'),
          lockTime: _self.get('lockTime'),
          minDate: _self.get('minDate'),
          maxDate: _self.get('maxDate'),
          autoRender: true
        });
      calendar.on('clear', function() {
        var curTrigger = _self.get('curTrigger'),
          oldValue = curTrigger.val();
        if (oldValue) {
          curTrigger.val('');
          curTrigger.trigger('change');
        }
      });
      if (!_self.get('dateMask')) {
        if (_self.get('showTime')) {
          _self.set('dateMask', 'yyyy-mm-dd HH:MM:ss');
        } else {
          _self.set('dateMask', 'yyyy-mm-dd');
        }
      }
      children.push(calendar);
      _self.set('calendar', calendar);
      return calendar;
    },
    /**
     * 设置选中的值
     * <pre><code>
     *   datePicker.setSelectedValue('2012-01-1');
     * </code></pre>
     * @param {String} val 设置值
     * @protected
     */
    setSelectedValue: function(val) {
      if (!this.get('calendar')) {
        return;
      }
      var _self = this,
        calendar = this.get('calendar'),
        date = DateUtil.parse(val, _self.get("dateMask"));
      date = date || _self.get('selectedDate');
      calendar.set('selectedDate', DateUtil.getDate(date));
      if (_self.get('showTime')) {
        var lockTime = this.get("lockTime"),
          hour = date.getHours(),
          minute = date.getMinutes(),
          second = date.getSeconds();
        if (lockTime) {
          if (!val || !lockTime.editable) {
            hour = lockTime['hour'] != null ? lockTime['hour'] : hour;
            minute = lockTime['minute'] != null ? lockTime['minute'] : minute;
            second = lockTime['second'] != null ? lockTime['second'] : second;
          }
        }
        calendar.set('hour', hour);
        calendar.set('minute', minute);
        calendar.set('second', second);
      }
    },
    /**
     * 获取选中的值
     * @protected
     * @return {String} 选中的值
     */
    getSelectedValue: function() {
      if (!this.get('calendar')) {
        return null;
      }
      var _self = this,
        calendar = _self.get('calendar'),
        date = DateUtil.getDate(calendar.get('selectedDate'));
      if (_self.get('showTime')) {
        date = DateUtil.addHour(calendar.get('hour'), date);
        date = DateUtil.addMinute(calendar.get('minute'), date);
        date = DateUtil.addSecond(calendar.get('second'), date);
      }
      return date;
    },
    /**
     * 获取选中项的文本，多选状态下，文本以','分割
     * @protected
     * @return {String} 选中的文本
     */
    getSelectedText: function() {
      if (!this.get('calendar')) {
        return '';
      }
      return DateUtil.format(this.getSelectedValue(), this._getFormatType());
    },
    _getFormatType: function() {
      return this.get('dateMask');
    },
    //设置最大值
    _uiSetMaxDate: function(v) {
      if (!this.get('calendar')) {
        return null;
      }
      var _self = this;
      _self.get('calendar').set('maxDate', v);
    },
    //设置最小值
    _uiSetMinDate: function(v) {
      if (!this.get('calendar')) {
        return null;
      }
      var _self = this;
      _self.get('calendar').set('minDate', v);
    }
  }, {
    ATTRS: {
      /**
       * 是否显示日期
       * <pre><code>
       *  var datepicker = new Calendar.DatePicker({
       *    trigger:'.calendar',
       *    showTime : true, //可以选择日期
       *    autoRender : true
       *  });
       * </code></pre>
       * @type {Boolean}
       */
      showTime: {
        value: false
      },
      /**
       * 锁定时间选择，默认锁定的时间不能修改可以通过 editable : true 来允许修改锁定的时间
       *<pre><code>
       *  var calendar = new Calendar.Calendar({
       *  render:'#calendar',
       *  lockTime : {hour:00,minute:30} //表示锁定时为00,分为30分,秒无锁用户可选择
       * });
       * </code></pre>
       *
       * @type {Object}
       */
      lockTime: {},
      /**
       * 最大日期
       * <pre><code>
       *   var datepicker = new Calendar.DatePicker({
       *     trigger:'.calendar',
       *     maxDate : '2014-01-01',
       *     minDate : '2013-7-25',
       *     autoRender : true
       *   });
       * </code></pre>
       * @type {Date}
       */
      maxDate: {},
      /**
       * 最小日期
       * <pre><code>
       *   var datepicker = new Calendar.DatePicker({
       *     trigger:'.calendar',
       *     maxDate : '2014-01-01',
       *     minDate : '2013-7-25',
       *     autoRender : true
       *   });
       * </code></pre>
       * @type {Date}
       */
      minDate: {},
      /**
       * 返回日期格式，如果不设置默认为 yyyy-mm-dd，时间选择为true时为 yyyy-mm-dd HH:MM:ss
       * <pre><code>
       *   calendar.set('dateMask','yyyy-mm-dd');
       * </code></pre>
       * @type {String}
       */
      dateMask: {},
      changeEvent: {
        value: 'accept'
      },
      hideEvent: {
        value: 'accept clear'
      },
      /**
       * 日历对象,可以进行更多的操作，参看{@link BUI.Calendar.Calendar}
       * @type {BUI.Calendar.Calendar}
       */
      calendar: {},
      /**
       * 默认选中的日期
       * @type {Date}
       */
      selectedDate: {
        value: new Date(new Date().setSeconds(0))
      }
    }
  }, {
    xclass: 'datepicker',
    priority: 0
  });
  module.exports = datepicker;
});
define("bui/select", ["bui/common", "jquery", "bui/picker", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 选择框命名空间入口文件
   * @ignore
   */
  var BUI = require("bui/common"),
    Select = BUI.namespace('Select');
  BUI.mix(Select, {
    Select: require("bui/select/select"),
    Combox: require("bui/select/combox"),
    Suggest: require("bui/select/suggest")
  });
  module.exports = Select;
});
define("bui/select/select", ["jquery", "bui/common", "bui/picker", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 选择控件
   * @author dxq613@gmail.com
   * @ignore
   */
  'use strict';
  var $ = require('jquery'),
    BUI = require("bui/common"),
    ListPicker = require("bui/picker").ListPicker,
    PREFIX = BUI.prefix;

  function formatItems(items) {
    if ($.isPlainObject(items)) {
      var tmp = [];
      BUI.each(items, function(v, n) {
        tmp.push({
          value: n,
          text: v
        });
      });
      return tmp;
    }
    var rst = [];
    BUI.each(items, function(item, index) {
      if (BUI.isString(item)) {
        rst.push({
          value: item,
          text: item
        });
      } else {
        rst.push(item);
      }
    });
    return rst;
  }
  var Component = BUI.Component,
    Picker = ListPicker,
    CLS_INPUT = PREFIX + 'select-input',
    /**
     * 选择控件
     * xclass:'select'
     * <pre><code>
     *  BUI.use('bui/select',function(Select){
     *
     *   var items = [
     *         {text:'选项1',value:'a'},
     *         {text:'选项2',value:'b'},
     *         {text:'选项3',value:'c'}
     *       ],
     *       select = new Select.Select({
     *         render:'#s1',
     *         valueField:'#hide',
     *         //multipleSelect: true, //是否多选
     *         items:items
     *       });
     *   select.render();
     *   select.on('change', function(ev){
     *     //ev.text,ev.value,ev.item
     *   });
     *
     * });
     * </code></pre>
     * @class BUI.Select.Select
     * @extends BUI.Component.Controller
     */
    select = Component.Controller.extend({
      //初始化
      initializer: function() {
        var _self = this,
          multipleSelect = _self.get('multipleSelect'),
          xclass,
          picker = _self.get('picker'),
          list;
        if (!picker) {
          xclass = multipleSelect ? 'listbox' : 'simple-list';
          list = _self.get('list') || {};
          list = BUI.mix(list, {
            xclass: xclass,
            elCls: PREFIX + 'select-list',
            store: _self.get('store'),
            items: formatItems(_self.get('items')) /**/
          });
          picker = new Picker({
            children: [
              list
            ],
            valueField: _self.get('valueField')
          });
          _self.set('picker', picker);
        } else {
          if (_self.get('valueField')) {
            picker.set('valueField', _self.get('valueField'));
          }
        }
        if (multipleSelect) {
          picker.set('hideEvent', '');
        }
      },
      //渲染DOM以及选择器
      renderUI: function() {
        var _self = this,
          picker = _self.get('picker'),
          textEl = _self._getTextEl();
        picker.set('trigger', _self.getTrigger());
        picker.set('triggerEvent', _self.get('triggerEvent'));
        picker.set('autoSetValue', _self.get('autoSetValue'));
        picker.set('textField', textEl);
        picker.render();
        _self.set('list', picker.get('list'));
      },
      //绑定事件
      bindUI: function() {
        var _self = this,
          picker = _self.get('picker'),
          list = picker.get('list'),
          store = list.get('store');
        //选项发生改变时
        picker.on('selectedchange', function(ev) {
          if (ev.item) {
            _self.fire('change', {
              text: ev.text,
              value: ev.value,
              item: ev.item
            });
          }
        });
        if (_self.get('autoSetValue')) {
          list.on('itemsshow', function() {
            _self._syncValue();
          });
        }
        picker.on('show', function() {
          if (_self.get('forceFit')) {
            picker.set('width', _self.get('el').outerWidth());
          }
        });
      },
      /**
       * 是否包含元素
       * @override
       */
      containsElement: function(elem) {
        var _self = this,
          picker = _self.get('picker');
        return Component.Controller.prototype.containsElement.call(this, elem) || picker.containsElement(elem);
      },
      /**
       * @protected
       * 获取触发点
       */
      getTrigger: function() {
        return this.get('el');
      },
      //设置子项
      _uiSetItems: function(items) {
        if (!items) {
          return;
        }
        var _self = this,
          picker = _self.get('picker'),
          list = picker.get('list');
        list.set('items', formatItems(items));
        _self._syncValue();
      },
      _syncValue: function() {
        var _self = this,
          picker = _self.get('picker'),
          valueField = _self.get('valueField');
        if (valueField) {
          picker.setSelectedValue($(valueField).val());
        }
      },
      //设置Form表单中的名称
      _uiSetName: function(v) {
        var _self = this,
          textEl = _self._getTextEl();
        if (v) {
          textEl.attr('name', v);
        }
      },
      _uiSetWidth: function(v) {
        var _self = this;
        if (v != null) {
          if (_self.get('inputForceFit')) {
            var textEl = _self._getTextEl(),
              iconEl = _self.get('el').find('.x-icon'),
              appendWidth = textEl.outerWidth() - textEl.width(),
              width = v - iconEl.outerWidth() - appendWidth;
            textEl.width(width);
          }
          if (_self.get('forceFit')) {
            var picker = _self.get('picker');
            picker.set('width', v);
          }
        }
      },
      //禁用
      _uiSetDisabled: function(v) {
        var _self = this,
          picker = _self.get('picker'),
          textEl = _self._getTextEl();
        picker.set('disabled', v);
        textEl && textEl.attr('disabled', v);
      },
      _getTextEl: function() {
        var _self = this,
          el = _self.get('el');
        return el.is('input') ? el : el.find('input');
      },
      /**
       * 析构函数
       */
      destructor: function() {
        var _self = this,
          picker = _self.get('picker');
        if (picker) {
          picker.destroy();
        }
      },
      //获取List控件
      _getList: function() {
        var _self = this,
          picker = _self.get('picker'),
          list = picker.get('list');
        return list;
      },
      /**
       * 获取选中项的值，如果是多选则，返回的'1,2,3'形式的字符串
       * <pre><code>
       *  var value = select.getSelectedValue();
       * </code></pre>
       * @return {String} 选中项的值
       */
      getSelectedValue: function() {
        return this.get('picker').getSelectedValue();
      },
      /**
       * 设置选中的值
       * <pre><code>
       * select.setSelectedValue('1'); //单选模式下
       * select.setSelectedValue('1,2,3'); //多选模式下
       * </code></pre>
       * @param {String} value 选中的值
       */
      setSelectedValue: function(value) {
        var _self = this,
          picker = _self.get('picker');
        picker.setSelectedValue(value);
      },
      /**
       * 获取选中项的文本，如果是多选则，返回的'text1,text2,text3'形式的字符串
       * <pre><code>
       *  var value = select.getSelectedText();
       * </code></pre>
       * @return {String} 选中项的文本
       */
      getSelectedText: function() {
        return this.get('picker').getSelectedText();
      }
    }, {
      ATTRS: {
        /**
         * 选择器，浮动出现，供用户选择
         * @cfg {BUI.Picker.ListPicker} picker
         * <pre><code>
         * var columns = [
         *       {title : '表头1(30%)',dataIndex :'a', width:'30%'},
         *       {id: '123',title : '表头2(30%)',dataIndex :'b', width:'30%'},
         *       {title : '表头3(40%)',dataIndex : 'c',width:'40%'}
         *     ],
         *   data = [{a:'123',b:'选择文本1'},{a:'cdd',b:'选择文本2'},{a:'1333',b:'选择文本3',c:'eee',d:2}],
         *   grid = new Grid.SimpleGrid({
         *     idField : 'a', //设置作为key 的字段，放到valueField中
         *     columns : columns,
         *     textGetter: function(item){ //返回选中的文本
         *       return item.b;
         *     }
         *   }),
         *   picker = new Picker.ListPicker({
         *     width:300,  //指定宽度
         *     children : [grid] //配置picker内的列表
         *   }),
         *   select = new Select.Select({
         *     render:'#s1',
         *     picker : picker,
         *     forceFit:false, //不强迫列表跟选择器宽度一致
         *     valueField:'#hide',
         *     items : data
         *   });
         * select.render();
         * </code></pre>
         */
        /**
         * 选择器，浮动出现，供用户选择
         * @readOnly
         * @type {BUI.Picker.ListPicker}
         */
        picker: {},
        /**
         * Picker中的列表
         * <pre>
         *   var list = select.get('list');
         * </pre>
         * @readOnly
         * @type {BUI.List.SimpleList}
         */
        list: {},
        /**
         * 存放值得字段，一般是一个input[type='hidden'] ,用于存放选择框的值
         * @cfg {Object} valueField
         */
        /**
         * @ignore
         */
        valueField: {},
        /**
         * 数据缓冲类
         * <pre><code>
         *  var store = new Store({
         *    url : 'data.json',
         *    autoLoad : true
         *  });
         *  var select = new Select({
         *    render : '#s',
         *    store : store//设置了store后，不要再设置items，会进行覆盖
         *  });
         *  select.render();
         * </code></pre>
         * @cfg {BUI.Data.Store} Store
         */
        store: {},
        focusable: {
          value: true
        },
        /**
         * 是否跟valueField自动同步
         * @type {Boolean}
         */
        autoSetValue: {
          value: true
        },
        /**
         * 是否可以多选
         * @cfg {Boolean} [multipleSelect=false]
         */
        /**
         * 是否可以多选
         * @type {Boolean}
         */
        multipleSelect: {
          value: false
        },
        /**
         * 内部的input是否跟随宽度的变化而变化
         * @type {Object}
         */
        inputForceFit: {
          value: true
        },
        /**
         * 控件的name，用于存放选中的文本，便于表单提交
         * @cfg {Object} name
         */
        /**
         * 控件的name，便于表单提交
         * @type {Object}
         */
        name: {},
        /**
         * 选项
         * @cfg {Array} items
         * <pre><code>
         *  BUI.use('bui/select',function(Select){
         *
         *   var items = [
         *         {text:'选项1',value:'a'},
         *         {text:'选项2',value:'b'},
         *         {text:'选项3',value:'c'}
         *       ],
         *       select = new Select.Select({
         *         render:'#s1',
         *         valueField:'#hide',
         *         //multipleSelect: true, //是否多选
         *         items:items
         *       });
         *   select.render();
         *
         * });
         * </code></pre>
         */
        /**
         * 选项
         * @type {Array}
         */
        items: {
          sync: false
        },
        /**
         * 标示选择完成后，显示文本的DOM节点的样式
         * @type {String}
         * @protected
         * @default 'bui-select-input'
         */
        inputCls: {
          value: CLS_INPUT
        },
        /**
         * 是否使选择列表跟选择框同等宽度
         * <pre><code>
         *   picker = new Picker.ListPicker({
         *     width:300,  //指定宽度
         *     children : [grid] //配置picker内的列表
         *   }),
         *   select = new Select.Select({
         *     render:'#s1',
         *     picker : picker,
         *     forceFit:false, //不强迫列表跟选择器宽度一致
         *     valueField:'#hide',
         *     items : data
         *   });
         * select.render();
         * </code></pre>
         * @cfg {Boolean} [forceFit=true]
         */
        forceFit: {
          value: true
        },
        events: {
          value: {
            /**
             * 选择值发生改变时
             * @event
             * @param {Object} e 事件对象
             * @param {String} e.text 选中的文本
             * @param {String} e.value 选中的value
             * @param {Object} e.item 发生改变的选项
             */
            'change': false
          }
        },
        /**
         * 控件的默认模版
         * @type {String}
         * @default
         * '&lt;input type="text" readonly="readonly" class="bui-select-input"/&gt;&lt;span class="x-icon x-icon-normal"&gt;&lt;span class="bui-caret bui-caret-down"&gt;&lt;/span&gt;&lt;/span&gt;'
         */
        tpl: {
          view: true,
          value: '<input type="text" readonly="readonly" class="' + CLS_INPUT + '"/><span class="x-icon x-icon-normal"><i class="icon icon-caret icon-caret-down"></i></span>'
        },
        /**
         * 触发的事件
         * @cfg {String} triggerEvent
         * @default 'click'
         */
        triggerEvent: {
          value: 'click'
        }
      }
    }, {
      xclass: 'select'
    });
  module.exports = select;
});
define("bui/select/combox", ["jquery", "bui/common", "bui/picker", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 组合框可用于选择输入文本
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Select = require("bui/select/select"),
    Tag = require("bui/select/tag"),
    CLS_INPUT = BUI.prefix + 'combox-input';
  /**
   * 组合框 用于提示输入
   * xclass:'combox'
   * <pre><code>
   * BUI.use('bui/select',function(Select){
   *
   *  var select = new Select.Combox({
   *    render:'#c1',
   *    name:'combox',
   *    items:['选项1','选项2','选项3','选项4']
   *  });
   *  select.render();
   * });
   * </code></pre>
   * @class BUI.Select.Combox
   * @extends BUI.Select.Select
   */
  var combox = Select.extend([Tag], {
    renderUI: function() {
      var _self = this,
        picker = _self.get('picker');
      picker.set('autoFocused', false);
    },
    _uiSetItems: function(v) {
      var _self = this;
      for (var i = 0; i < v.length; i++) {
        var item = v[i];
        if (BUI.isString(item)) {
          v[i] = {
            value: item,
            text: item
          };
        }
      }
      combox.superclass._uiSetItems.call(_self, v);
    },
    bindUI: function() {
      var _self = this,
        picker = _self.get('picker'),
        list = picker.get('list'),
        textField = picker.get('textField');
      //修复手动清空textField里面的值，再选时不填充的bug
      $(textField).on('keyup', function(ev) {
        var item = list.getSelected();
        if (item) {
          list.clearItemStatus(item);
        }
      });
      picker.on('show', function() {
        list.clearSelected();
      });
    },
    //覆写此方法
    _uiSetValueField: function() {},
    /**
     * @protected
     * 获取触发点
     */
    getTrigger: function() {
      return this._getTextEl();
    }
  }, {
    ATTRS: {
      /*focusable : {
        value : false
      },*/
      /**
       * 控件的模版
       * @type {String}
       * @default
       * '&lt;input type="text" class="'+CLS_INPUT+'"/&gt;'
       */
      tpl: {
        view: true,
        value: '<input type="text" class="' + CLS_INPUT + '"/>'
      },
      /**
       * 显示选择回的文本DOM节点的样式
       * @type {String}
       * @protected
       * @default 'bui-combox-input'
       */
      inputCls: {
        value: CLS_INPUT
      },
      autoSetValue: {
        value: false
      }
    }
  }, {
    xclass: 'combox'
  });
  module.exports = combox;
});
define("bui/select/tag", ["jquery", "bui/common", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 输入、选择完毕后显示tag
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    List = require("bui/list"),
    KeyCode = BUI.KeyCode,
    WARN = 'warn';

  function html_decode(str) {
      var s = "";
      if (str.length == 0) return "";
      s = str.replace(/>/g, "&gt;");
      s = s.replace(/</g, "&lt;");
      return s;
    }
    /**
     * @class BUI.Select.Tag
     * 显示tag的扩展
     */
  var Tag = function() {};
  Tag.ATTRS = {
    /**
     * 显示tag
     * @type {Boolean}
     */
    showTag: {
      value: false
    },
    /**
     * tag的模板
     * @type {String}
     */
    tagItemTpl: {
      value: '<li>{text}<button>×</button></li>'
    },
    /**
     * @private
     * tag 的列表
     * @type {Object}
     */
    tagList: {
      value: null
    },
    limit: {
      value: null
    },
    forbitInput: {
      value: false
    },
    tagPlaceholder: {
      value: '输入标签'
    },
    tagFormatter: {
      value: null
    },
    /**
     * 默认的value分隔符，将值分割显示成tag
     * @type {String}
     */
    separator: {
      value: ';'
    }
  };
  BUI.augment(Tag, {
    __renderUI: function() {
      var _self = this,
        showTag = _self.get('showTag'),
        tagPlaceholder = _self.get('tagPlaceholder'),
        tagInput = _self.getTagInput();
      if (showTag && !tagInput.attr('placeholder')) {
        tagInput.attr('placeholder', tagPlaceholder);
        _self.set('inputForceFit', false);
      }
    },
    __bindUI: function() {
      var _self = this,
        showTag = _self.get('showTag'),
        tagInput = _self.getTagInput();
      if (showTag) {
        tagInput.on('keydown', function(ev) {
          if (!tagInput.val()) {
            var tagList = _self.get('tagList'),
              last = tagList.getLastItem(),
              picker = _self.get('picker');
            if (ev.which == KeyCode.DELETE || ev.which == KeyCode.BACKSPACE) {
              if (tagList.hasStatus(last, WARN)) {
                _self._delTag(last);
              } else {
                tagList.setItemStatus(last, WARN, true);
              }
              picker.hide();
            } else {
              tagList.setItemStatus(last, WARN, false);
            }
          }
        });
        var handler;

        function setTag() {
          var tagList = _self.get('tagList'),
            last = tagList.getLastItem();
          if (last && tagList.hasStatus(last, WARN)) { //如果最后一项处于警告状态
            tagList.setItemStatus(last, WARN, false);
          }
          var val = tagInput.val();
          if (val) {
            _self._addTag(val);
          }
        }
        if (!_self.get('forbitInput')) {
          tagInput.on('change', function() {
            handler = setTimeout(function() {
              setTag();
              handler = null;
            }, 50);
          });
        }
        _self.on('change', function(ev) {
          setTimeout(function() {
            if (handler) {
              clearTimeout(handler);
            }
            setTag();
          });
        });
      }
    },
    __syncUI: function() {
      var _self = this,
        showTag = _self.get('showTag'),
        valueField = _self.get('valueField');
      if (showTag && valueField) {
        _self._setTags($(valueField).val());
      }
    },
    //设置tags，初始化时处理
    _setTags: function(value) {
      var _self = this,
        tagList = _self.get('tagList'),
        separator = _self.get('separator'),
        formatter = _self.get('tagFormatter'),
        values = value.split(separator);
      if (!tagList) {
        tagList = _self._initTagList();
      }
      if (value) {
        BUI.each(values, function(val) {
          var text = val;
          if (formatter) {
            text = formatter(text);
          }
          tagList.addItem({
            value: val,
            text: text
          });
        });
      }
    },
    //添加tag
    _addTag: function(value) {
      value = html_decode(value);
      var _self = this,
        tagList = _self.get('tagList'),
        tagInput = _self.getTagInput(),
        limit = _self.get('limit'),
        formatter = _self.get('tagFormatter'),
        preItem = tagList.getItem(value);
      if (limit) {
        if (tagList.getItemCount() >= limit) {
          return;
        }
      }
      if (!preItem) {
        var text = value;
        if (formatter) {
          text = formatter(text);
        }
        tagList.addItem({
          value: value,
          text: text
        });
        _self._synTagsValue();
      } else {
        _self._blurItem(tagList, preItem);
      }
      tagInput.val('');
    },
    //提示用户选项已经存在
    _blurItem: function(list, item) {
      list.setItemStatus(item, 'active', true);
      setTimeout(function() {
        list.setItemStatus(item, 'active', false);
      }, 400);
    },
    //删除tag
    _delTag: function(item) {
      var _self = this,
        tagList = _self.get('tagList');
      tagList.removeItem(item);
      _self._synTagsValue();
    },
    /**
     * 获取tag 列表的值
     * @return {String} 列表对应的值
     */
    getTagsValue: function() {
      var _self = this,
        tagList = _self.get('tagList'),
        items = tagList.getItems(),
        vals = [];
      BUI.each(items, function(item) {
        vals.push(item.value);
      });
      return vals.join(_self.get('separator'));
    },
    //初始化tagList
    _initTagList: function() {
      var _self = this,
        tagInput = _self.getTagInput(),
        tagList = new List.SimpleList({
          elBefore: tagInput,
          itemTpl: _self.get('tagItemTpl'),
          idField: 'value'
        });
      tagList.render();
      _self._initTagEvent(tagList);
      _self.set('tagList', tagList);
      return tagList;
    },
    //初始化tag删除事件
    _initTagEvent: function(list) {
      var _self = this;
      list.on('itemclick', function(ev) {
        var sender = $(ev.domTarget);
        if (sender.is('button')) {
          _self._delTag(ev.item);
        }
      });
    },
    /**
     * 获取输入的文本框
     * @protected
     * @return {jQuery} 输入框
     */
    getTagInput: function() {
      var _self = this,
        el = _self.get('el');
      return el.is('input') ? el : el.find('input');
    },
    _synTagsValue: function() {
      var _self = this,
        valueEl = _self.get('valueField');
      valueEl && $(valueEl).val(_self.getTagsValue());
    }
  });
  module.exports = Tag;
});
define("bui/select/suggest", ["jquery", "bui/common", "bui/picker", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 组合框可用于选择输入文本
   * @ignore
   */
  'use strict';
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Combox = require("bui/select/combox"),
    TIMER_DELAY = 200,
    EMPTY = '';
  /**
   * 组合框 用于提示输入
   * xclass:'suggest'
   * ** 简单使用静态数据 **
   * <pre><code>
   * BUI.use('bui/select',function (Select) {
   *
   *  var suggest = new Select.Suggest({
   *     render:'#c2',
   *     name:'suggest', //形成输入框的name
   *     data:['1222224','234445','122','1111111']
   *   });
   *   suggest.render();
   *
   * });
   * </code></pre>
   * ** 查询服务器数据 **
   * <pre><code>
   * BUI.use('bui/select',function(Select){
   *
   *  var suggest = new Select.Suggest({
   *    render:'#s1',
   *    name:'suggest',
   *    url:'server-data.php'
   *  });
   *  suggest.render();
   *
   * });
   * </code></pre>
   * @class BUI.Select.Suggest
   * @extends BUI.Select.Combox
   */
  var suggest = Combox.extend({
    bindUI: function() {
      var _self = this,
        textEl = _self.get('el').find('input'),
        triggerEvent = (_self.get('triggerEvent') === 'keyup') ? 'keyup' : 'keyup click';
      //监听 keyup 事件
      textEl.on(triggerEvent, function() {
        _self._start();
      });
    },
    //启动计时器，开始监听用户输入
    _start: function() {
      var _self = this;
      _self._timer = _self.later(function() {
        _self._updateContent();
        // _self._timer = _self.later(arguments.callee, TIMER_DELAY);
      }, TIMER_DELAY);
    },
    //更新提示层的数据
    _updateContent: function() {
      var _self = this,
        isStatic = _self.get('data'),
        textEl = _self.get('el').find('input'),
        text;
      //检测是否需要更新。注意：加入空格也算有变化
      if (!isStatic && (textEl.val() === _self.get('query'))) {
        return;
      }
      _self.set('query', textEl.val());
      text = textEl.val();
      //输入为空时,直接返回
      if (!isStatic && !text) {
        /*        _self.set('items',EMPTY_ARRAY);
        picker.hide();*/
        return;
      }
      //3种加载方式选择
      var cacheable = _self.get('cacheable'),
        store = _self.get('store'),
        url = _self.get('url'),
        data = _self.get('data');
      if (cacheable && (url || store)) {
        var dataCache = _self.get('dataCache');
        if (dataCache[text] !== undefined) {
          //从缓存读取
          //BUI.log('use cache');
          _self._handleResponse(dataCache[text]);
        } else {
          //请求服务器数据
          //BUI.log('no cache, data from server');
          _self._requestData();
        }
      } else if (url || store) {
        //从服务器获取数据
        //BUI.log('no cache, data always from server');
        _self._requestData();
      } else if (data) {
        //使用静态数据源
        //BUI.log('use static datasource');
        _self._handleResponse(data, true);
      }
    },
    //如果存在数据源
    _getStore: function() {
      var _self = this,
        picker = _self.get('picker'),
        list = picker.get('list');
      if (list) {
        return list.get('store');
      }
    },
    //通过 script 元素异步加载数据
    _requestData: function() {
      var _self = this,
        textEl = _self.get('el').find('input'),
        callback = _self.get('callback'),
        store = _self.get('store'),
        param = {};
      param[textEl.attr('name')] = textEl.val();
      if (store) {
        param.start = 0; //回滚到第一页
        store.load(param, callback);
      } else {
        $.ajax({
          url: _self.get('url'),
          type: 'post',
          dataType: _self.get('dataType'),
          data: param,
          success: function(data) {
            _self._handleResponse(data);
            if (callback) {
              callback(data);
            }
          }
        });
      }
    },
    //处理获取的数据
    _handleResponse: function(data, filter) {
      var _self = this,
        items = filter ? _self._getFilterItems(data) : data;
      _self.set('items', items);
      if (_self.get('cacheable')) {
        _self.get('dataCache')[_self.get('query')] = items;
      }
    },
    //如果列表记录是对象获取显示的文本
    _getItemText: function(item) {
      var _self = this,
        picker = _self.get('picker'),
        list = picker.get('list');
      if (list) {
        return list.getItemText(item);
      }
      return '';
    },
    //获取过滤的文本
    _getFilterItems: function(data) {
      var _self = this,
        result = [],
        textEl = _self.get('el').find('input'),
        text = textEl.val(),
        isStatic = _self.get('data');
      data = data || [];
      /**
       * @private
       * @ignore
       */
      function push(str, item) {
        if (BUI.isString(item)) {
          result.push(str);
        } else {
          result.push(item);
        }
      }
      BUI.each(data, function(item) {
        var str = BUI.isString(item) ? item : _self._getItemText(item);
        if (isStatic) {
          if (str.indexOf($.trim(text)) !== -1) {
            push(str, item);
          }
        } else {
          push(str, item);
        }
      });
      return result;
    },
    /**
     * 延迟执行指定函数 fn
     * @protected
     * @return {Object} 操作定时器的对象
     */
    later: function(fn, when, periodic) {
      when = when || 0;
      var r = periodic ? setInterval(fn, when) : setTimeout(fn, when);
      return {
        id: r,
        interval: periodic,
        cancel: function() {
          if (this.interval) {
            clearInterval(r);
          } else {
            clearTimeout(r);
          }
        }
      };
    }
  }, {
    ATTRS: {
      /**
       * 用于显示提示的数据源
       * <pre><code>
       *   var suggest = new Select.Suggest({
       *     render:'#c2',
       *     name:'suggest', //形成输入框的name
       *     data:['1222224','234445','122','1111111']
       *   });
       * </code></pre>
       * @cfg {Array} data
       */
      /**
       * 用于显示提示的数据源
       * @type {Array}
       */
      data: {
        value: null
      },
      /**
       * 输入框的值
       * @type {String}
       * @private
       */
      query: {
        value: EMPTY
      },
      /**
       * 是否允许缓存
       * @cfg {Boolean} cacheable
       */
      /**
       * 是否允许缓存
       * @type {Boolean}
       */
      cacheable: {
        value: false
      },
      /**
       * 缓存的数据
       * @private
       */
      dataCache: {
        shared: false,
        value: {}
      },
      /**
       * 请求返回的数据格式默认为'jsonp'
       * <pre><code>
       *  var suggest = new Select.Suggest({
       *    render:'#s1',
       *    name:'suggest',
       *    dataType : 'json',
       *    url:'server-data.php'
       *  });
       * </code></pre>
       * @cfg {Object} [dataType = 'jsonp']
       */
      dataType: {
        value: 'jsonp'
      },
      /**
       * 请求数据的url
       * <pre><code>
       *  var suggest = new Select.Suggest({
       *    render:'#s1',
       *    name:'suggest',
       *    dataType : 'json',
       *    url:'server-data.php'
       *  });
       * </code></pre>
       * @cfg {String} url
       */
      url: {},
      /**
       * 请求完数据的回调函数
       * <pre><code>
       *  var suggest = new Select.Suggest({
       *    render:'#s1',
       *    name:'suggest',
       *    dataType : 'json',
       *    callback : function(data){
       *      //do something
       *    },
       *    url:'server-data.php'
       *  });
       * </code></pre>
       * @type {Function}
       */
      callback: {},
      /**
       * 触发的事件
       * @cfg {String} triggerEvent
       * @default 'click'
       */
      triggerEvent: {
        valueFn: function() {
          if (this.get('data')) {
            return 'click';
          }
          return 'keyup';
        }
      },
      /**
       * suggest不提供自动设置选中文本功能
       * @type {Boolean}
       */
      autoSetValue: {
        value: false
      }
    }
  }, {
    xclass: 'suggest'
  });
  module.exports = suggest;
});
define("bui/form", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview form 命名空间入口
   * @ignore
   */
  var BUI = require("bui/common"),
    Form = BUI.namespace('Form'),
    Tips = require("bui/form/tips");
  BUI.mix(Form, {
    Tips: Tips,
    TipItem: Tips.Item,
    FieldContainer: require("bui/form/fieldcontainer"),
    Form: require("bui/form/form"),
    Row: require("bui/form/row"),
    Group: require("bui/form/fieldgroup"),
    HForm: require("bui/form/hform"),
    Rules: require("bui/form/rules"),
    Field: require("bui/form/field"),
    FieldGroup: require("bui/form/fieldgroup")
  });
  module.exports = Form;
});
define("bui/form/tips", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 输入提示信息
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    prefix = BUI.prefix,
    Overlay = require("bui/overlay").Overlay,
    FIELD_TIP = 'data-tip',
    CLS_TIP_CONTAINER = prefix + 'form-tip-container';
  /**
   * 表单提示信息类
   * xclass:'form-tip'
   * @class BUI.Form.TipItem
   * @extends BUI.Overlay.Overlay
   */
  var tipItem = Overlay.extend({
    initializer: function() {
      var _self = this,
        render = _self.get('render');
      if (!render) {
        var parent = $(_self.get('trigger')).parent();
        _self.set('render', parent);
      }
    },
    renderUI: function() {
      var _self = this;
      _self.resetVisible();
    },
    /**
     * 重置是否显示
     */
    resetVisible: function() {
      var _self = this,
        triggerEl = $(_self.get('trigger'));
      if (triggerEl.val()) { //如果默认有文本则不显示，否则显示
        _self.set('visible', false);
      } else {
        _self.set('align', {
          node: $(_self.get('trigger')),
          points: ['cl', 'cl']
        });
        _self.set('visible', true);
      }
    },
    bindUI: function() {
      var _self = this,
        triggerEl = $(_self.get('trigger'));
      _self.get('el').on('click', function() {
        _self.hide();
        triggerEl.focus();
      });
      triggerEl.on('click focus', function() {
        _self.hide();
      });
      triggerEl.on('blur', function() {
        _self.resetVisible();
      });
    }
  }, {
    ATTRS: {
      /**
       * 提示的输入框
       * @cfg {String|HTMLElement|jQuery} trigger
       */
      /**
       * 提示的输入框
       * @type {String|HTMLElement|jQuery}
       */
      trigger: {},
      /**
       * 提示文本
       * @cfg {String} text
       */
      /**
       * 提示文本
       * @type {String}
       */
      text: {},
      /**
       * 提示文本上显示的icon样式
       * @cfg {String} iconCls
       *     iconCls : icon-ok
       */
      /**
       * 提示文本上显示的icon样式
       * @type {String}
       *     iconCls : icon-ok
       */
      iconCls: {},
      /**
       * 默认的模版
       * @type {String}
       * @default '<span class="{iconCls}"></span><span class="tip-text">{text}</span>'
       */
      tpl: {
        value: '<span class="{iconCls}"></span><span class="tip-text">{text}</span>'
      }
    }
  }, {
    xclass: 'form-tip'
  });
  /**
   * 表单提示信息的管理类
   * @class BUI.Form.Tips
   * @extends BUI.Base
   */
  var Tips = function(config) {
    if (this.constructor !== Tips) {
      return new Tips(config);
    }
    Tips.superclass.constructor.call(this, config);
    this._init();
  };
  Tips.ATTRS = {
    /**
     * 表单的选择器
     * @cfg {String|HTMLElement|jQuery} form
     */
    /**
     * 表单的选择器
     * @type {String|HTMLElement|jQuery}
     */
    form: {},
    /**
     * 表单提示项对象 {@link BUI.Form.TipItem}
     * @readOnly
     * @type {Array}
     */
    items: {
      valueFn: function() {
        return [];
      }
    }
  };
  BUI.extend(Tips, BUI.Base);
  BUI.augment(Tips, {
    _init: function() {
      var _self = this,
        form = $(_self.get('form'));
      if (form.length) {
        BUI.each($.makeArray(form[0].elements), function(elem) {
          var tipConfig = $(elem).attr(FIELD_TIP);
          if (tipConfig) {
            _self._initFormElement(elem, $.parseJSON(tipConfig));
          }
        });
        form.addClass(CLS_TIP_CONTAINER);
      }
    },
    _initFormElement: function(element, config) {
      if (config) {
        config.trigger = element;
        //config.render = this.get('form');
      }
      var _self = this,
        items = _self.get('items'),
        item = new tipItem(config);
      items.push(item);
    },
    /**
     * 获取提示项
     * @param {String} name 字段的名称
     * @return {BUI.Form.TipItem} 提示项
     */
    getItem: function(name) {
      var _self = this,
        items = _self.get('items'),
        result = null;
      BUI.each(items, function(item) {
        if ($(item.get('trigger')).attr('name') === name) {
          result = item;
          return false;
        }
      });
      return result;
    },
    /**
     * 重置所有提示的可视状态
     */
    resetVisible: function() {
      var _self = this,
        items = _self.get('items');
      BUI.each(items, function(item) {
        item.resetVisible();
      });
    },
    /**
     * 生成 表单提示
     */
    render: function() {
      var _self = this,
        items = _self.get('items');
      BUI.each(items, function(item) {
        item.render();
      });
    },
    /**
     * 删除所有提示
     */
    destroy: function() {
      var _self = this,
        items = _self.get(items);
      BUI.each(items, function(item) {
        item.destroy();
      });
    }
  });
  Tips.Item = tipItem;
  module.exports = Tips;
});
define("bui/form/fieldcontainer", ["jquery", "bui/common", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 表单字段的容器扩展
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Field = require("bui/form/field"),
    GroupValid = require("bui/form/groupvalid"),
    PREFIX = BUI.prefix;
  var FIELD_XCLASS = 'form-field',
    CLS_FIELD = PREFIX + FIELD_XCLASS,
    CLS_GROUP = PREFIX + 'form-group',
    FIELD_TAGS = 'input,select,textarea';

  function isField(node) {
      return node.is(FIELD_TAGS);
    }
    /**
     * 获取节点需要封装的子节点
     * @ignore
     */
  function getDecorateChilds(node, srcNode) {
    if (node != srcNode) {
      if (isField(node)) {
        return [node];
      }
      var cls = node.attr('class');
      if (cls && (cls.indexOf(CLS_GROUP) !== -1 || cls.indexOf(CLS_FIELD) !== -1)) {
        return [node];
      }
    }
    var rst = [],
      children = node.children();
    BUI.each(children, function(subNode) {
      rst = rst.concat(getDecorateChilds($(subNode), srcNode));
    });
    return rst;
  }
  var containerView = BUI.Component.View.extend([GroupValid.View]);
  /**
   * 表单字段容器的扩展类
   * @class BUI.Form.FieldContainer
   * @extends BUI.Component.Controller
   * @mixins BUI.Form.GroupValid
   */
  var container = BUI.Component.Controller.extend([GroupValid], {
    //同步数据
    syncUI: function() {
      var _self = this,
        fields = _self.getFields(),
        validators = _self.get('validators');
      BUI.each(fields, function(field) {
        var name = field.get('name');
        if (validators[name]) {
          field.set('validator', validators[name]);
        }
      });
      BUI.each(validators, function(item, key) {
        //按照ID查找
        if (key.indexOf('#') == 0) {
          var id = key.replace('#', ''),
            child = _self.getChild(id, true);
          if (child) {
            child.set('validator', item);
          }
        }
      });
    },
    /**
     * 获取封装的子控件节点
     * @protected
     * @override
     */
    getDecorateElments: function() {
      var _self = this,
        el = _self.get('el');
      var items = getDecorateChilds(el, el);
      return items;
    },
    /**
     * 根据子节点获取对应的子控件 xclass
     * @protected
     * @override
     */
    findXClassByNode: function(childNode, ignoreError) {
      if (childNode.attr('type') === 'checkbox') {
        return FIELD_XCLASS + '-checkbox';
      }
      if (childNode.attr('type') === 'radio') {
        return FIELD_XCLASS + '-radio';
      }
      if (childNode.attr('type') === 'number') {
        return FIELD_XCLASS + '-number';
      }
      if (childNode.hasClass('calendar')) {
        return FIELD_XCLASS + '-date';
      }
      if (childNode[0].tagName == "SELECT") {
        return FIELD_XCLASS + '-select';
      }
      if (isField(childNode)) {
        return FIELD_XCLASS;
      }
      return BUI.Component.Controller.prototype.findXClassByNode.call(this, childNode, ignoreError);
    },
    /**
     * 获取表单编辑的对象
     * @return {Object} 编辑的对象
     */
    getRecord: function() {
      var _self = this,
        rst = {},
        fields = _self.getFields();
      BUI.each(fields, function(field) {
        var name = field.get('name'),
          value = _self._getFieldValue(field);
        if (!rst[name]) { //没有值，直接赋值
          rst[name] = value;
        } else if (BUI.isArray(rst[name]) && value != null) { //已经存在值，并且是数组，加入数组
          rst[name].push(value);
        } else if (value != null) { //否则封装成数组，并加入数组
          var arr = [rst[name]]
          arr.push(value);
          rst[name] = arr;
        }
      });
      return rst;
    },
    /**
     * 获取表单字段
     * @return {Array} 表单字段
     */
    getFields: function(name) {
      var _self = this,
        rst = [],
        children = _self.get('children');
      BUI.each(children, function(item) {
        if (item instanceof Field) {
          if (!name || item.get('name') == name) {
            rst.push(item);
          }
        } else if (item.getFields) {
          rst = rst.concat(item.getFields(name));
        }
      });
      return rst;
    },
    /**
     * 根据name 获取表单字段
     * @param  {String} name 字段名
     * @return {BUI.Form.Field}  表单字段或者 null
     */
    getField: function(name) {
      var _self = this,
        fields = _self.getFields(),
        rst = null;
      BUI.each(fields, function(field) {
        if (field.get('name') === name) {
          rst = field;
          return false;
        }
      });
      return rst;
    },
    /**
     * 根据索引获取字段的name
     * @param  {Number} index 字段的索引
     * @return {String}   字段名称
     */
    getFieldAt: function(index) {
      return this.getFields()[index];
    },
    /**
     * 根据字段名
     * @param {String} name 字段名
     * @param {*} value 字段值
     */
    setFieldValue: function(name, value) {
      var _self = this,
        fields = _self.getFields(name);
      BUI.each(fields, function(field) {
        _self._setFieldValue(field, value);
      });
    },
    //设置字段域的值
    _setFieldValue: function(field, value) {
      //如果字段不可用，则不能设置值
      if (field.get('disabled')) {
        return;
      }
      //如果是可勾选的
      if (field instanceof Field.Check) {
        var fieldValue = field.get('value');
        if (value && (fieldValue === value || (BUI.isArray(value) && BUI.Array.contains(fieldValue, value)))) {
          field.set('checked', true);
        } else {
          field.set('checked', false);
        }
      } else {
        if (value == null) {
          value = '';
        }
        field.clearErrors(true); //清理错误
        field.set('value', value);
      }
    },
    /**
     * 获取字段值,不存在字段时返回null,多个同名字段时，checkbox返回一个数组
     * @param  {String} name 字段名
     * @return {*}  字段值
     */
    getFieldValue: function(name) {
      var _self = this,
        fields = _self.getFields(name),
        rst = [];
      BUI.each(fields, function(field) {
        var value = _self._getFieldValue(field);
        if (value) {
          rst.push(value);
        }
      });
      if (rst.length === 0) {
        return null;
      }
      if (rst.length === 1) {
        return rst[0]
      }
      return rst;
    },
    //获取字段域的值
    _getFieldValue: function(field) {
      if (!(field instanceof Field.Check) || field.get('checked')) {
        return field.get('value');
      }
      return null;
    },
    /**
     * 清除所有表单域的值
     */
    clearFields: function() {
      this.clearErrors(true);
      this.setRecord({})
    },
    /**
     * 设置表单编辑的对象
     * @param {Object} record 编辑的对象
     */
    setRecord: function(record) {
      var _self = this,
        fields = _self.getFields();
      BUI.each(fields, function(field) {
        var name = field.get('name');
        _self._setFieldValue(field, record[name]);
      });
    },
    /**
     * 更新表单编辑的对象
     * @param  {Object} record 编辑的对象
     */
    updateRecord: function(record) {
      var _self = this,
        fields = _self.getFields();
      BUI.each(fields, function(field) {
        var name = field.get('name');
        if (record.hasOwnProperty(name)) {
          _self._setFieldValue(field, record[name]);
        }
      });
    },
    /**
     * 设置控件获取焦点，设置第一个子控件获取焦点
     */
    focus: function() {
      var _self = this,
        fields = _self.getFields(),
        firstField = fields[0];
      if (firstField) {
        firstField.focus();
      }
    },
    //禁用控件
    _uiSetDisabled: function(v) {
      var _self = this,
        children = _self.get('children');
      BUI.each(children, function(item) {
        item.set('disabled', v);
      });
    }
  }, {
    ATTRS: {
      /**
       * 表单的数据记录，以键值对的形式存在
       * @type {Object}
       */
      record: {
        setter: function(v) {
          this.setRecord(v);
        },
        getter: function() {
          return this.getRecord();
        }
      },
      /**
       * 内部元素的验证函数，可以使用2中选择器
       * <ol>
       *   <li>id: 使用以'#'为前缀的选择器，可以查找字段或者分组，添加联合校验</li>
       *   <li>name: 不使用任何前缀，没查找表单字段</li>
       * </ol>
       * @type {Object}
       */
      validators: {
        value: {}
      },
      /**
       * 默认的加载控件内容的配置,默认值：
       * <pre>
       *  {
       *   property : 'children',
       *   dataType : 'json'
       * }
       * </pre>
       * @type {Object}
       */
      defaultLoaderCfg: {
        value: {
          property: 'children',
          dataType: 'json'
        }
      },
      disabled: {
        sync: false
      },
      isDecorateChild: {
        value: true
      },
      xview: {
        value: containerView
      }
    }
  }, {
    xclass: 'form-field-container'
  });
  container.View = containerView;
  module.exports = container;
});
define("bui/form/field", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 表单域的入口文件
   * @ignore
   */
  var BUI = require("bui/common"),
    Field = require("bui/form/fields/base");
  BUI.mix(Field, {
    Text: require("bui/form/fields/text"),
    Date: require("bui/form/fields/date"),
    Select: require("bui/form/fields/select"),
    Hidden: require("bui/form/fields/hidden"),
    Number: require("bui/form/fields/number"),
    Check: require("bui/form/fields/check"),
    Radio: require("bui/form/fields/radio"),
    Checkbox: require("bui/form/fields/checkbox"),
    Plain: require("bui/form/fields/plain"),
    List: require("bui/form/fields/list"),
    TextArea: require("bui/form/fields/textarea"),
    Uploader: require("bui/form/fields/uploader"),
    CheckList: require("bui/form/fields/checklist"),
    RadioList: require("bui/form/fields/radiolist")
  });
  module.exports = Field;
});
define("bui/form/fields/base", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 表单元素
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Component = BUI.Component,
    TipItem = require("bui/form/tips").Item,
    Valid = require("bui/form/valid"),
    Remote = require("bui/form/remote"),
    CLS_FIELD_ERROR = BUI.prefix + 'form-field-error',
    CLS_TIP_CONTAINER = 'bui-form-tip-container',
    DATA_ERROR = 'data-error';
  /**
   * 字段视图类
   * @class BUI.Form.FieldView
   * @private
   */
  var fieldView = Component.View.extend([Remote.View, Valid.View], {
    //渲染DOM
    renderUI: function() {
      var _self = this,
        control = _self.get('control');
      if (!control) {
        var controlTpl = _self.get('controlTpl'),
          container = _self.getControlContainer();
        if (controlTpl) {
          var control = $(controlTpl).appendTo(container);
          _self.set('control', control);
        }
      } else {
        //var controlContainer = control.parent();
        _self.set('controlContainer', control.parent());
      }
    },
    /**
     * 清理显示的错误信息
     * @protected
     */
    clearErrors: function() {
      var _self = this,
        msgEl = _self.get('msgEl');
      if (msgEl) {
        msgEl.remove();
        _self.set('msgEl', null);
      }
      _self.get('el').removeClass(CLS_FIELD_ERROR);
    },
    /**
     * 显示错误信息
     * @param {String} msg 错误信息
     * @protected
     */
    showError: function(msg, errorTpl) {
      var _self = this,
        control = _self.get('control'),
        errorMsg = BUI.substitute(errorTpl, {
          error: msg
        }),
        el = $(errorMsg);
      //_self.clearErrorMsg();
      el.appendTo(control.parent());
      _self.set('msgEl', el);
      _self.get('el').addClass(CLS_FIELD_ERROR);
    },
    /**
     * @internal 获取控件的容器
     * @return {jQuery} 控件容器
     */
    getControlContainer: function() {
      var _self = this,
        el = _self.get('el'),
        controlContainer = _self.get('controlContainer');
      if (controlContainer) {
        if (BUI.isString(controlContainer)) {
          controlContainer = el.find(controlContainer);
        }
      }
      return (controlContainer && controlContainer.length) ? controlContainer : el;
    },
    /**
     * 获取显示加载状态的容器
     * @protected
     * @override
     * @return {jQuery} 加载状态的容器
     */
    getLoadingContainer: function() {
      return this.getControlContainer();
    },
    //设置名称
    _uiSetName: function(v) {
      var _self = this;
      _self.get('control').attr('name', v);
    }
  }, {
    ATTRS: {
      error: {},
      controlContainer: {},
      msgEl: {},
      control: {}
    }
  });
  /**
   * 表单字段基类
   * @class BUI.Form.Field
   * @mixins BUI.Form.Remote
   * @mixins BUI.Form.Valid
   * @extends BUI.Component.Controller
   */
  var field = Component.Controller.extend([Remote, Valid], {
    isField: true,
    initializer: function() {
      var _self = this;
      _self.on('afterRenderUI', function() {
        var tip = _self.get('tip');
        if (tip) {
          var trigger = _self.getTipTigger();
          trigger && trigger.parent().addClass(CLS_TIP_CONTAINER);
          tip.trigger = trigger;
          tip.autoRender = true;
          tip = new TipItem(tip);
          _self.set('tip', tip);
        }
      });
    },
    //绑定事件
    bindUI: function() {
      var _self = this,
        validEvent = _self.get('validEvent'),
        changeEvent = _self.get('changeEvent'),
        firstValidEvent = _self.get('firstValidEvent'),
        innerControl = _self.getInnerControl();
      //选择框只使用 select事件
      if (innerControl.is('select')) {
        validEvent = 'change';
      }
      //验证事件
      innerControl.on(validEvent, function() {
        var value = _self.getControlValue(innerControl);
        _self.validControl(value);
      });
      if (firstValidEvent) {
        //未发生验证时，首次获取焦点/丢失焦点/点击，进行验证
        innerControl.on(firstValidEvent, function() {
          if (!_self.get('hasValid')) {
            var value = _self.getControlValue(innerControl);
            _self.validControl(value);
          }
        });
      }
      //本来是监听控件的change事件，但是，如果控件还未触发change,但是通过get('value')来取值，则会出现错误，
      //所以当通过验证时，即触发改变事件
      _self.on(changeEvent, function() {
        _self.onValid();
      });
      _self.on('remotecomplete', function(ev) {
        _self._setError(ev.error);
      });
    },
    /**
     * 验证成功后执行的操作
     * @protected
     */
    onValid: function() {
      var _self = this,
        value = _self.getControlValue();
      value = _self.parseValue(value);
      if (!_self.isCurrentValue(value)) {
        _self.setInternal('value', value);
        _self.onChange();
      }
    },
    onChange: function() {
      this.fire('change');
    },
    /**
     * @protected
     * 是否当前值，主要用于日期等特殊值的比较，不能用 == 进行比较
     * @param  {*}  value 进行比较的值
     * @return {Boolean}  是否当前值
     */
    isCurrentValue: function(value) {
      return value == this.get('value');
    },
    //清理错误信息
    _clearError: function() {
      this.set('error', null);
      this.get('view').clearErrors();
    },
    //设置错误信息
    _setError: function(msg) {
      this.set('error', msg);
      this.showErrors();
    },
    /**
     * 获取内部表单元素的值
     * @protected
     * @param  {jQuery} [innerControl] 内部表单元素
     * @return {String|Boolean} 表单元素的值,checkbox，radio的返回值为 true,false
     */
    getControlValue: function(innerControl) {
      var _self = this;
      innerControl = innerControl || _self.getInnerControl();
      return innerControl.val();
    },
    /**
     * @protected
     * 获取内部控件的容器
     */
    getControlContainer: function() {
      return this.get('view').getControlContainer();
    },
    /**
     * 获取异步验证的参数，对于表单字段域而言，是{[name] : [value]}
     * @protected
     * @override
     * @return {Object} 参数键值对
     */
    getRemoteParams: function() {
      var _self = this,
        rst = {};
      rst[_self.get('name')] = _self.getControlValue();
      return rst;
    },
    /**
     * 设置字段的值
     * @protected
     * @param {*} value 字段值
     */
    setControlValue: function(value) {
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.val(value);
    },
    /**
     * 将字符串等格式转换成
     * @protected
     * @param  {String} value 原始数据
     * @return {*}  该字段指定的类型
     */
    parseValue: function(value) {
      return value;
    },
    valid: function() {
      var _self = this;
      _self.validControl();
    },
    /**
     * 验证控件内容
     * @return {Boolean} 是否通过验证
     */
    validControl: function(value) {
      var _self = this,
        errorMsg;
      value = value || _self.getControlValue(),
        preError = _self.get('error');
      errorMsg = _self.getValidError(value);
      _self.setInternal('hasValid', true);
      if (errorMsg) {
        _self._setError(errorMsg);
        _self.fire('error', {
          msg: errorMsg,
          value: value
        });
        if (preError !== errorMsg) { //验证错误信息改变，说明验证改变
          _self.fire('validchange', {
            valid: false
          });
        }
      } else {
        _self._clearError();
        _self.fire('valid');
        if (preError) { //如果以前存在错误，那么验证结果改变
          _self.fire('validchange', {
            valid: true
          });
        }
      }
      return !errorMsg;
    },
    /**
     * 字段获得焦点
     */
    focus: function() {
      this.getInnerControl().focus();
    },
    /**
     * 字段发生改变
     */
    change: function() {
      var control = this.getInnerControl();
      control.change();
    },
    /**
     * 字段丢失焦点
     */
    blur: function() {
      this.getInnerControl().blur();
    },
    /**
     * 是否通过验证,如果未发生过校验，则进行校验，否则不进行校验，直接根据已校验的结果判断。
     * @return {Boolean} 是否通过验证
     */
    isValid: function() {
      var _self = this;
      if (!_self.get('hasValid')) {
        _self.validControl();
      }
      return !_self.get('error');
    },
    /**
     * 获取验证出错信息
     * @return {String} 出错信息
     */
    getError: function() {
      return this.get('error');
    },
    /**
     * 获取验证出错信息集合
     * @return {Array} 出错信息集合
     */
    getErrors: function() {
      var error = this.getError();
      if (error) {
        return [error];
      }
      return [];
    },
    /**
     * 清理出错信息，回滚到未出错状态
     * @param {Boolean} reset 清除错误时，是否回滚上次正确的值
     */
    clearErrors: function(reset) {
      var _self = this;
      _self._clearError();
      if (reset && _self.getControlValue() != _self.get('value')) {
        _self.setControlValue(_self.get('value'));
      }
    },
    /**
     * 获取内部的表单元素或者内部控件
     * @protected
     * @return {jQuery|BUI.Component.Controller}
     */
    getInnerControl: function() {
      return this.get('view').get('control');
    },
    /**
     * 提示信息按照此元素对齐
     * @protected
     * @return {HTMLElement}
     */
    getTipTigger: function() {
      return this.getInnerControl();
    },
    //析构函数
    destructor: function() {
      var _self = this,
        tip = _self.get('tip');
      if (tip && tip.destroy) {
        tip.destroy();
      }
    },
    /**
     * @protected
     * 设置内部元素宽度
     */
    setInnerWidth: function(width) {
      var _self = this,
        innerControl = _self.getInnerControl(),
        siblings = innerControl.siblings(),
        appendWidth = innerControl.outerWidth() - innerControl.width();
      BUI.each(siblings, function(dom) {
        appendWidth += $(dom).outerWidth();
      });
      innerControl.width(width - appendWidth);
    },
    //重置 提示信息是否可见
    _resetTip: function() {
      var _self = this,
        tip = _self.get('tip');
      if (tip) {
        tip.resetVisible();
      }
    },
    /**
     * 重置显示提示信息
     * field.resetTip();
     */
    resetTip: function() {
      this._resetTip();
    },
    //设置值
    _uiSetValue: function(v) {
      var _self = this;
      //v = v ? v.toString() : '';
      _self.setControlValue(v);
      if (_self.get('rendered')) {
        _self.validControl();
        _self.onChange();
      }
      _self._resetTip();
    },
    //禁用控件
    _uiSetDisabled: function(v) {
      var _self = this,
        innerControl = _self.getInnerControl(),
        children = _self.get('children');
      innerControl.attr('disabled', v);
      if (_self.get('rendered')) {
        if (v) { //控件不可用，清除错误
          _self.clearErrors();
        }
        if (!v) { //控件可用，执行重新验证
          _self.valid();
        }
      }
      BUI.each(children, function(child) {
        child.set('disabled', v);
      });
    },
    _uiSetWidth: function(v) {
      var _self = this;
      if (v != null && _self.get('forceFit')) {
        _self.setInnerWidth(v);
      }
    }
  }, {
    ATTRS: {
      /**
       * 是否发生过校验，初始值为空时，未进行赋值，不进行校验
       * @type {Boolean}
       */
      hasValid: {
        value: false
      },
      /**
       * 内部元素是否根据控件宽度调整宽度
       * @type {Boolean}
       */
      forceFit: {
        value: false
      },
      /**
       * 是否显示提示信息
       * @type {Object}
       */
      tip: {},
      /**
       * 表单元素或者控件内容改变的事件
       * @type {String}
       */
      changeEvent: {
        value: 'valid'
      },
      /**
       * 未发生验证时，首次获取/丢失焦点，进行验证
       */
      firstValidEvent: {
        value: 'blur'
      },
      /**
       * 表单元素或者控件触发此事件时，触发验证
       * @type {String}
       */
      validEvent: {
        value: 'keyup change'
      },
      /**
       * 字段的name值
       * @type {Object}
       */
      name: {
        view: true
      },
      /**
       * 是否显示错误
       * @type {Boolean}
       */
      showError: {
        view: true,
        value: true
      },
      /**
       * 字段的值,类型根据字段类型决定
       * @cfg {*} value
       */
      value: {
        view: true
      },
      /**
       * 标题
       * @type {String}
       */
      label: {},
      /**
       * 控件容器，如果为空直接添加在控件容器上
       * @type {String|HTMLElement}
       */
      controlContainer: {
        view: true
      },
      /**
       * 内部表单元素的控件
       * @protected
       * @type {jQuery}
       */
      control: {
        view: true
      },
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        view: true,
        value: '<input type="text"/>'
      },
      events: {
        value: {
          /**
           * 未通过验证
           * @event
           */
          error: false,
          /**
           * 通过验证
           * @event
           */
          valid: false,
          /**
           * @event
           * 值改变，仅当通过验证时触发
           */
          change: true,
          /**
           * @event
           * 验证改变
           * @param {Object} e 事件对象
           * @param {Object} e.target 触发事件的对象
           * @param {Boolean} e.valid 是否通过验证
           */
          validchange: true
        }
      },
      tpl: {
        value: '<label>{label}</label>'
      },
      xview: {
        value: fieldView
      }
    },
    PARSER: {
      control: function(el) {
        var control = el.find('input,select,textarea');
        if (control.length) {
          return control;
        }
        return el;
      },
      disabled: function(el) {
        return !!el.attr('disabled');
      },
      value: function(el) {
        var _self = this,
          selector = 'select,input,textarea',
          value = _self.get('value');
        if (!value) {
          if (el.is(selector)) {
            value = el.val();
            if (!value && el.is('select')) {
              value = el.attr('value');
            }
          } else {
            value = el.find(selector).val();
          }
        }
        return value;
      },
      name: function(el) {
        var _self = this,
          selector = 'select,input,textarea',
          name = _self.get('name');
        if (!name) {
          if (el.is(selector)) {
            name = el.attr('name');
          } else {
            name = el.find(selector).attr('name');
          }
        }
        return name;
      }
    }
  }, {
    xclass: 'form-field'
  });
  field.View = fieldView;
  module.exports = field;
});
define("bui/form/valid", ["bui/common", "jquery"], function(require, exports, module) {
  /**
   * @fileOverview 表单验证
   * @ignore
   */
  var BUI = require("bui/common"),
    Rules = require("bui/form/rules");
  /**
   * @class BUI.Form.ValidView
   * @private
   * 对控件内的字段域进行验证的视图
   */
  var ValidView = function() {};
  ValidView.prototype = {
    /**
     * 获取错误信息的容器
     * @protected
     * @return {jQuery}
     */
    getErrorsContainer: function() {
      var _self = this,
        errorContainer = _self.get('errorContainer');
      if (errorContainer) {
        if (BUI.isString(errorContainer)) {
          return _self.get('el').find(errorContainer);
        }
        return errorContainer;
      }
      return _self.getContentElement();
    },
    /**
     * 显示错误
     */
    showErrors: function(errors) {
      var _self = this,
        errorsContainer = _self.getErrorsContainer(),
        errorTpl = _self.get('errorTpl');
      _self.clearErrors();
      if (!_self.get('showError')) {
        return;
      }
      //如果仅显示第一条错误记录
      if (_self.get('showOneError')) {
        if (errors && errors.length) {
          _self.showError(errors[0], errorTpl, errorsContainer);
        }
        return;
      }
      BUI.each(errors, function(error) {
        if (error) {
          _self.showError(error, errorTpl, errorsContainer);
        }
      });
    },
    /**
     * 显示一条错误
     * @protected
     * @template
     * @param  {String} msg 错误信息
     */
    showError: function(msg, errorTpl, container) {},
    /**
     * @protected
     * @template
     * 清除错误
     */
    clearErrors: function() {}
  };
  /**
   * 对控件内的字段域进行验证
   * @class  BUI.Form.Valid
   */
  var Valid = function() {};
  Valid.ATTRS = {
    /**
     * 控件固有的验证规则，例如，日期字段域，有的date类型的验证
     * @protected
     * @type {Object}
     */
    defaultRules: {
      value: {}
    },
    /**
     * 控件固有的验证出错信息，例如，日期字段域，不是有效日期的验证字段
     * @protected
     * @type {Object}
     */
    defaultMessages: {
      value: {}
    },
    /**
     * 验证规则
     * @type {Object}
     */
    rules: {
      shared: false,
      value: {}
    },
    /**
     * 验证信息集合
     * @type {Object}
     */
    messages: {
      shared: false,
      value: {}
    },
    /**
     * 验证器 验证容器内的表单字段是否通过验证
     * @type {Function}
     */
    validator: {},
    /**
     * 存放错误信息容器的选择器，如果未提供则默认显示在控件中
     * @private
     * @type {String}
     */
    errorContainer: {
      view: true
    },
    /**
     * 显示错误信息的模板
     * @type {Object}
     */
    errorTpl: {
      view: true,
      value: '<span class="x-field-error"><span class="x-icon x-icon-mini x-icon-error">!</span><label class="x-field-error-text">{error}</label></span>'
    },
    /**
     * 显示错误
     * @type {Boolean}
     */
    showError: {
      view: true,
      value: true
    },
    /**
     * 是否仅显示一个错误
     * @type {Boolean}
     */
    showOneError: {},
    /**
     * 错误信息，这个验证错误不包含子控件的验证错误
     * @type {String}
     */
    error: {},
    /**
     * 暂停验证
     * <pre><code>
     *   field.set('pauseValid',true); //可以调用field.clearErrors()
     *   field.set('pauseValid',false); //可以同时调用field.valid()
     * </code></pre>
     * @type {Boolean}
     */
    pauseValid: {
      value: false
    }
  };
  Valid.prototype = {
    __bindUI: function() {
      var _self = this;
      //监听是否禁用
      _self.on('afterDisabledChange', function(ev) {
        var disabled = ev.newVal;
        if (disabled) {
          _self.clearErrors(false, false);
        } else {
          _self.valid();
        }
      });
    },
    /**
     * 是否通过验证
     * @template
     * @return {Boolean} 是否通过验证
     */
    isValid: function() {},
    /**
     * 进行验证
     */
    valid: function() {},
    /**
     * @protected
     * @template
     * 验证自身的规则和验证器
     */
    validControl: function() {},
    //验证规则
    validRules: function(rules, value) {
      if (!rules) {
        return null;
      }
      if (this.get('pauseValid')) {
        return null;
      }
      var _self = this,
        messages = _self._getValidMessages(),
        error = null;
      for (var name in rules) {
        if (rules.hasOwnProperty(name)) {
          var baseValue = rules[name];
          error = Rules.valid(name, value, baseValue, messages[name], _self);
          if (error) {
            break;
          }
        }
      }
      return error;
    },
    //获取验证错误信息
    _getValidMessages: function() {
      var _self = this,
        defaultMessages = _self.get('defaultMessages'),
        messages = _self.get('messages');
      return BUI.merge(defaultMessages, messages);
    },
    /**
     * @template
     * @protected
     * 控件本身是否通过验证，不考虑子控件
     * @return {String} 验证的错误
     */
    getValidError: function(value) {
      var _self = this,
        validator = _self.get('validator'),
        error = null;
      error = _self.validRules(_self.get('defaultRules'), value) || _self.validRules(_self.get('rules'), value);
      if (!error && !this.get('pauseValid')) {
        if (_self.parseValue) {
          value = _self.parseValue(value);
        }
        error = validator ? validator.call(this, value) : '';
      }
      return error;
    },
    /**
     * 获取验证出错信息，包括自身和子控件的验证错误信息
     * @return {Array} 出错信息
     */
    getErrors: function() {},
    /**
     * 显示错误
     * @param {Array} errors 显示错误
     */
    showErrors: function(errors) {
      var _self = this,
        errors = errors || _self.getErrors();
      _self.get('view').showErrors(errors);
    },
    /**
     * 清除错误
     * @param {Boolean} reset 清除错误时是否重置
     * @param {Boolean} [deep = true] 是否清理子控件的错误
     */
    clearErrors: function(reset, deep) {
      deep = deep == null ? true : deep;
      var _self = this,
        children = _self.get('children');
      if (deep) {
        BUI.each(children, function(item) {
          if (item.clearErrors) {
            if (item.field) {
              item.clearErrors(reset);
            } else {
              item.clearErrors(reset, deep);
            }
          }
        });
      }
      _self.set('error', null);
      _self.get('view').clearErrors();
    },
    /**
     * 添加验证规则
     * @param {String} name 规则名称
     * @param {*} [value] 规则进行校验的进行对比的值，如max : 10
     * @param {String} [message] 出错信息,可以使模板
     * <ol>
     *   <li>如果 value 是单个值，例如最大值 value = 10,那么模板可以写成： '输入值不能大于{0}!'</li>
     *   <li>如果 value 是个复杂对象，数组时，按照索引，对象时按照 key 阻止。如：value= {max:10,min:5} ，则'输入值不能大于{max},不能小于{min}'</li>
     * </ol>
     *         var field = form.getField('name');
     *         field.addRule('required',true);
     *
     *         field.addRule('max',10,'不能大于{0}');
     */
    addRule: function(name, value, message) {
      var _self = this,
        rules = _self.get('rules'),
        messages = _self.get('messages');
      rules[name] = value;
      if (message) {
        messages[name] = message;
      }
    },
    /**
     * 添加多个验证规则
     * @param {Object} rules 多个验证规则
     * @param {Object} [messages] 验证规则的出错信息
     *         var field = form.getField('name');
     *         field.addRules({
     *           required : true,
     *           max : 10
     *         });
     */
    addRules: function(rules, messages) {
      var _self = this;
      BUI.each(rules, function(value, name) {
        var msg = messages ? messages[name] : null;
        _self.addRule(name, value, msg);
      });
    },
    /**
     * 移除指定名称的验证规则
     * @param  {String} name 验证规则名称
     *         var field = form.getField('name');
     *         field.remove('required');
     */
    removeRule: function(name) {
      var _self = this,
        rules = _self.get('rules');
      delete rules[name];
    },
    /**
     * 清理验证规则
     */
    clearRules: function() {
      var _self = this;
      _self.set('rules', {});
    }
  };
  Valid.View = ValidView;
  module.exports = Valid;
});
define("bui/form/rules", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 验证集合
   * @ignore
   */
  var $ = require('jquery'),
    Rule = require("bui/form/rule");

  function toNumber(value) {
    return parseFloat(value);
  }

  function toDate(value) {
    return BUI.Date.parse(value);
  }
  var ruleMap = {};
  /**
   * @class BUI.Form.Rules
   * @singleton
   * 表单验证的验证规则管理器
   */
  var rules = {
    /**
     * 添加验证规则
     * @param {Object|BUI.Form.Rule} rule 验证规则配置项或者验证规则对象
     * @param  {String} name 规则名称
     */
    add: function(rule) {
      var name;
      if ($.isPlainObject(rule)) {
        name = rule.name;
        ruleMap[name] = new Rule(rule);
      } else if (rule.get) {
        name = rule.get('name');
        ruleMap[name] = rule;
      }
      return ruleMap[name];
    },
    /**
     * 删除验证规则
     * @param  {String} name 规则名称
     */
    remove: function(name) {
      delete ruleMap[name];
    },
    /**
     * 获取验证规则
     * @param  {String} name 规则名称
     * @return {BUI.Form.Rule}  验证规则
     */
    get: function(name) {
      return ruleMap[name];
    },
    /**
     * 验证指定的规则
     * @param  {String} name 规则类型
     * @param  {*} value 验证值
     * @param  {*} [baseValue] 用于验证的基础值
     * @param  {String} [msg] 显示错误的模板
     * @param  {BUI.Form.Field|BUI.Form.Group} [control] 显示错误的模板
     * @return {String} 通过验证返回 null,否则返回错误信息
     */
    valid: function(name, value, baseValue, msg, control) {
      var rule = rules.get(name);
      if (rule) {
        return rule.valid(value, baseValue, msg, control);
      }
      return null;
    },
    /**
     * 验证指定的规则
     * @param  {String} name 规则类型
     * @param  {*} values 验证值
     * @param  {*} [baseValue] 用于验证的基础值
     * @param  {BUI.Form.Field|BUI.Form.Group} [control] 显示错误的模板
     * @return {Boolean} 是否通过验证
     */
    isValid: function(name, value, baseValue, control) {
      return rules.valid(name, value, baseValue, control) == null;
    }
  };
  /**
   * 非空验证,会对值去除空格
   * <ol>
   *  <li>name: required</li>
   *  <li>msg: 不能为空！</li>
   *  <li>required: boolean 类型</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var required = rules.add({
    name: 'required',
    msg: '不能为空！',
    validator: function(value, required, formatedMsg) {
      if (required !== false && /^\s*$/.test(value)) {
        return formatedMsg;
      }
    }
  });
  /**
   * 相等验证
   * <ol>
   *  <li>name: equalTo</li>
   *  <li>msg: 两次输入不一致！</li>
   *  <li>equalTo: 一个字符串，id（#id_name) 或者 name</li>
   * </ol>
   *         {
   *           equalTo : '#password'
   *         }
   *         //或者
   *         {
   *           equalTo : 'password'
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var equalTo = rules.add({
    name: 'equalTo',
    msg: '两次输入不一致！',
    validator: function(value, equalTo, formatedMsg) {
      var el = $(equalTo);
      if (el.length) {
        equalTo = el.val();
      }
      return value === equalTo ? undefined : formatedMsg;
    }
  });
  /**
   * 不小于验证
   * <ol>
   *  <li>name: min</li>
   *  <li>msg: 输入值不能小于{0}！</li>
   *  <li>min: 数字，字符串</li>
   * </ol>
   *         {
   *           min : 5
   *         }
   *         //字符串
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var min = rules.add({
    name: 'min',
    msg: '输入值不能小于{0}！',
    validator: function(value, min, formatedMsg) {
      if (BUI.isString(value)) {
        value = value.replace(/\,/g, '');
      }
      if (value !== '' && toNumber(value) < toNumber(min)) {
        return formatedMsg;
      }
    }
  });
  /**
   * 不小于验证,用于数值比较
   * <ol>
   *  <li>name: max</li>
   *  <li>msg: 输入值不能大于{0}！</li>
   *  <li>max: 数字、字符串</li>
   * </ol>
   *         {
   *           max : 100
   *         }
   *         //字符串
   *         {
   *           max : '100'
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var max = rules.add({
    name: 'max',
    msg: '输入值不能大于{0}！',
    validator: function(value, max, formatedMsg) {
      if (BUI.isString(value)) {
        value = value.replace(/\,/g, '');
      }
      if (value !== '' && toNumber(value) > toNumber(max)) {
        return formatedMsg;
      }
    }
  });
  /**
   * 输入长度验证，必须是指定的长度
   * <ol>
   *  <li>name: length</li>
   *  <li>msg: 输入值长度为{0}！</li>
   *  <li>length: 数字</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var length = rules.add({
    name: 'length',
    msg: '输入值长度为{0}！',
    validator: function(value, len, formatedMsg) {
      if (value != null) {
        value = $.trim(value.toString());
        if (len != value.length) {
          return formatedMsg;
        }
      }
    }
  });
  /**
   * 最短长度验证,会对值去除空格
   * <ol>
   *  <li>name: minlength</li>
   *  <li>msg: 输入值长度不小于{0}！</li>
   *  <li>minlength: 数字</li>
   * </ol>
   *         {
   *           minlength : 5
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var minlength = rules.add({
    name: 'minlength',
    msg: '输入值长度不小于{0}！',
    validator: function(value, min, formatedMsg) {
      if (value != null) {
        value = $.trim(value.toString());
        var len = value.length;
        if (len < min) {
          return formatedMsg;
        }
      }
    }
  });
  /**
   * 最短长度验证,会对值去除空格
   * <ol>
   *  <li>name: maxlength</li>
   *  <li>msg: 输入值长度不大于{0}！</li>
   *  <li>maxlength: 数字</li>
   * </ol>
   *         {
   *           maxlength : 10
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var maxlength = rules.add({
    name: 'maxlength',
    msg: '输入值长度不大于{0}！',
    validator: function(value, max, formatedMsg) {
      if (value) {
        value = $.trim(value.toString());
        var len = value.length;
        if (len > max) {
          return formatedMsg;
        }
      }
    }
  });
  /**
   * 正则表达式验证,如果正则表达式为空，则不进行校验
   * <ol>
   *  <li>name: regexp</li>
   *  <li>msg: 输入值不符合{0}！</li>
   *  <li>regexp: 正则表达式</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var regexp = rules.add({
    name: 'regexp',
    msg: '输入值不符合{0}！',
    validator: function(value, regexp, formatedMsg) {
      if (regexp) {
        return regexp.test(value) ? undefined : formatedMsg;
      }
    }
  });
  /**
   * 邮箱验证,会对值去除空格，无数据不进行校验
   * <ol>
   *  <li>name: email</li>
   *  <li>msg: 不是有效的邮箱地址！</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var email = rules.add({
    name: 'email',
    msg: '不是有效的邮箱地址！',
    validator: function(value, baseValue, formatedMsg) {
      value = $.trim(value);
      if (value) {
        return /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(value) ? undefined : formatedMsg;
      }
    }
  });
  /**
   * 日期验证，会对值去除空格，无数据不进行校验，
   * 如果传入的值不是字符串，而是数字，则认为是有效值
   * <ol>
   *  <li>name: date</li>
   *  <li>msg: 不是有效的日期！</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var date = rules.add({
    name: 'date',
    msg: '不是有效的日期！',
    validator: function(value, baseValue, formatedMsg) {
      if (BUI.isNumber(value)) { //数字认为是日期
        return;
      }
      if (BUI.isDate(value)) {
        return;
      }
      value = $.trim(value);
      if (value) {
        return BUI.Date.isDateString(value) ? undefined : formatedMsg;
      }
    }
  });
  /**
   * 不小于验证
   * <ol>
   *  <li>name: minDate</li>
   *  <li>msg: 输入日期不能小于{0}！</li>
   *  <li>minDate: 日期，字符串</li>
   * </ol>
   *         {
   *           minDate : '2001-01-01';
   *         }
   *         //字符串
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var minDate = rules.add({
    name: 'minDate',
    msg: '输入日期不能小于{0}！',
    validator: function(value, minDate, formatedMsg) {
      if (value) {
        var date = toDate(value);
        if (date && date < toDate(minDate)) {
          return formatedMsg;
        }
      }
    }
  });
  /**
   * 不小于验证,用于数值比较
   * <ol>
   *  <li>name: maxDate</li>
   *  <li>msg: 输入值不能大于{0}！</li>
   *  <li>maxDate: 日期、字符串</li>
   * </ol>
   *         {
   *           maxDate : '2001-01-01';
   *         }
   *         //或日期
   *         {
   *           maxDate : new Date('2001-01-01');
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var maxDate = rules.add({
    name: 'maxDate',
    msg: '输入日期不能大于{0}！',
    validator: function(value, maxDate, formatedMsg) {
      if (value) {
        var date = toDate(value);
        if (date && date > toDate(maxDate)) {
          return formatedMsg;
        }
      }
    }
  });
  /**
   * 手机验证，11位手机数字
   * <ol>
   *  <li>name: mobile</li>
   *  <li>msg: 不是有效的手机号码！</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var mobile = rules.add({
    name: 'mobile',
    msg: '不是有效的手机号码！',
    validator: function(value, baseValue, formatedMsg) {
      value = $.trim(value);
      if (value) {
        return /^\d{11}$/.test(value) ? undefined : formatedMsg;
      }
    }
  });
  /**
   * 数字验证，会对值去除空格，无数据不进行校验
   * 允许千分符，例如： 12,000,000的格式
   * <ol>
   *  <li>name: number</li>
   *  <li>msg: 不是有效的数字！</li>
   * </ol>
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var number = rules.add({
    name: 'number',
    msg: '不是有效的数字！',
    validator: function(value, baseValue, formatedMsg) {
      if (BUI.isNumber(value)) {
        return;
      }
      value = value.replace(/\,/g, '');
      return !isNaN(value) ? undefined : formatedMsg;
    }
  });
  //测试范围
  function testRange(baseValue, curVal, prevVal) {
    var allowEqual = baseValue && (baseValue.equals !== false);
    if (allowEqual) {
      return prevVal <= curVal;
    }
    return prevVal < curVal;
  }

  function isEmpty(value) {
      return value == '' || value == null;
    }
    //测试是否后面的数据大于前面的
  function rangeValid(value, baseValue, formatedMsg, group) {
      var fields = group.getFields(),
        valid = true;
      for (var i = 1; i < fields.length; i++) {
        var cur = fields[i],
          prev = fields[i - 1],
          curVal,
          prevVal;
        if (cur && prev) {
          curVal = cur.get('value');
          prevVal = prev.get('value');
          if (!isEmpty(curVal) && !isEmpty(prevVal) && !testRange(baseValue, curVal, prevVal)) {
            valid = false;
            break;
          }
        }
      }
      if (!valid) {
        return formatedMsg;
      }
      return null;
    }
    /**
     * 起始结束日期验证，前面的日期不能大于后面的日期
     * <ol>
     *  <li>name: dateRange</li>
     *  <li>msg: 起始日期不能大于结束日期！</li>
     *  <li>dateRange: 可以使true或者{equals : fasle}，标示是否允许相等</li>
     * </ol>
     *         {
     *           dateRange : true
     *         }
     *         {
     *           dateRange : {equals : false}
     *         }
     * @member BUI.Form.Rules
     * @type {BUI.Form.Rule}
     */
  var dateRange = rules.add({
    name: 'dateRange',
    msg: '结束日期不能小于起始日期！',
    validator: rangeValid
  });
  /**
   * 数字范围
   * <ol>
   *  <li>name: numberRange</li>
   *  <li>msg: 起始数字不能大于结束数字！</li>
   *  <li>numberRange: 可以使true或者{equals : fasle}，标示是否允许相等</li>
   * </ol>
   *         {
   *           numberRange : true
   *         }
   *         {
   *           numberRange : {equals : false}
   *         }
   * @member BUI.Form.Rules
   * @type {BUI.Form.Rule}
   */
  var numberRange = rules.add({
    name: 'numberRange',
    msg: '结束数字不能小于开始数字！',
    validator: rangeValid
  });

  function getFieldName(self) {
    var firstField = self.getFieldAt(0);
    if (firstField) {
      return firstField.get('name');
    }
    return '';
  }

  function testCheckRange(value, range) {
      if (!BUI.isArray(range)) {
        range = [range];
      }
      //不存在值
      if (!value || !range.length) {
        return false;
      }
      var len = !value ? 0 : !BUI.isArray(value) ? 1 : value.length;
      //如果只有一个限定值
      if (range.length == 1) {
        var number = range[0];
        if (!number) { //range = [0],则不必选
          return true;
        }
        if (number > len) {
          return false;
        }
      } else {
        var min = range[0],
          max = range[1];
        if (min > len || max < len) {
          return false;
        }
      }
      return true;
    }
    /**
     * 勾选的范围
     * <ol>
     *  <li>name: checkRange</li>
     *  <li>msg: 必须选中{0}项！</li>
     *  <li>checkRange: 勾选的项范围</li>
     * </ol>
     *         //至少勾选一项
     *         {
     *           checkRange : 1
     *         }
     *         //只能勾选两项
     *         {
     *           checkRange : [2,2]
     *         }
     *         //可以勾选2-4项
     *         {
     *           checkRange : [2,4
     *           ]
     *         }
     * @member BUI.Form.Rules
     * @type {BUI.Form.Rule}
     */
  var checkRange = rules.add({
    name: 'checkRange',
    msg: '必须选中{0}项！',
    validator: function(record, baseValue, formatedMsg, group) {
      var name = getFieldName(group),
        value,
        range = baseValue;
      if (name && range) {
        value = record[name];
        if (!testCheckRange(value, range)) {
          return formatedMsg;
        }
      }
      return null;
    }
  });
  module.exports = rules;
});
define("bui/form/rule", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 验证规则
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common");
  /**
   * @class BUI.Form.Rule
   * 验证规则
   * @extends BUI.Base
   */
  var Rule = function(config) {
    Rule.superclass.constructor.call(this, config);
  }
  BUI.extend(Rule, BUI.Base);
  Rule.ATTRS = {
      /**
       * 规则名称
       * @type {String}
       */
      name: {},
      /**
       * 验证失败信息
       * @type {String}
       */
      msg: {},
      /**
       * 验证函数
       * @type {Function}
       */
      validator: {
        value: function(value, baseValue, formatedMsg, control) {}
      }
    }
    //是否通过验证
  function valid(self, value, baseValue, msg, control) {
    if (BUI.isArray(baseValue) && BUI.isString(baseValue[1])) {
      if (baseValue[1]) {
        msg = baseValue[1];
      }
      baseValue = baseValue[0];
    }
    var _self = self,
      validator = _self.get('validator'),
      formatedMsg = formatError(self, baseValue, msg),
      valid = true;
    value = value == null ? '' : value;
    return validator.call(_self, value, baseValue, formatedMsg, control);
  }

  function parseParams(values) {
    if (values == null) {
      return {};
    }
    if ($.isPlainObject(values)) {
      return values;
    }
    var ars = values,
      rst = {};
    if (BUI.isArray(values)) {
      for (var i = 0; i < ars.length; i++) {
        rst[i] = ars[i];
      }
      return rst;
    }
    return {
      '0': values
    };
  }

  function formatError(self, values, msg) {
    var ars = parseParams(values);
    msg = msg || self.get('msg');
    return BUI.substitute(msg, ars);
  }
  BUI.augment(Rule, {
    /**
     * 是否通过验证，该函数可以接收多个参数
     * @param  {*}  [value] 验证的值
     * @param  {*} [baseValue] 跟传入值相比较的值
     * @param {String} [msg] 验证失败后的错误信息，显示的错误中可以显示 baseValue中的信息
     * @param {BUI.Form.Field|BUI.Form.Group} [control] 发生验证的控件
     * @return {String}   通过验证返回 null ,未通过验证返回错误信息
     *
     *         var msg = '输入数据必须在{0}和{1}之间！',
     *           rangeRule = new Rule({
     *             name : 'range',
     *             msg : msg,
     *             validator :function(value,range,msg){
     *               var min = range[0], //此处我们把range定义为数组，也可以定义为{min:0,max:200},那么在传入校验时跟此处一致即可
     *                 max = range[1];   //在错误信息中，使用用 '输入数据必须在{min}和{max}之间！',验证函数中的字符串已经进行格式化
     *               if(value < min || value > max){
     *                 return false;
     *               }
     *               return true;
     *             }
     *           });
     *         var range = [0,200],
     *           val = 100,
     *           error = rangeRule.valid(val,range);//msg可以在此处重新传入
     *
     */
    valid: function(value, baseValue, msg, control) {
      var _self = this;
      return valid(_self, value, baseValue, msg, control);
    }
  });
  module.exports = Rule;
});
define("bui/form/remote", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 表单异步请求，异步校验、远程获取数据
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common");
  /**
   * @class BUI.Form.RemoteView
   * @private
   * 表单异步请求类的视图类
   */
  var RemoteView = function() {
    // body...
  };
  RemoteView.ATTRS = {
    isLoading: {},
    loadingEl: {}
  };
  RemoteView.prototype = {
    /**
     * 获取显示加载状态的容器
     * @protected
     * @template
     * @return {jQuery} 加载状态的容器
     */
    getLoadingContainer: function() {
      // body...
    },
    _setLoading: function() {
      var _self = this,
        loadingEl = _self.get('loadingEl'),
        loadingTpl = _self.get('loadingTpl');
      if (loadingTpl && !loadingEl) {
        loadingEl = $(loadingTpl).appendTo(_self.getLoadingContainer());
        _self.setInternal('loadingEl', loadingEl);
      }
    },
    _clearLoading: function() {
      var _self = this,
        loadingEl = _self.get('loadingEl');
      if (loadingEl) {
        loadingEl.remove();
        _self.setInternal('loadingEl', null);
      }
    },
    _uiSetIsLoading: function(v) {
      var _self = this;
      if (v) {
        _self._setLoading();
      } else {
        _self._clearLoading();
      }
    }
  };
  /**
   * @class  BUI.Form.Remote
   * 表单异步请求，所有需要实现异步校验、异步请求的类可以使用。
   */
  var Remote = function() {};
  Remote.ATTRS = {
    /**
     * 默认的异步请求配置项：
     * method : 'GET',
     * cache : true,
     * dataType : 'text'
     * @protected
     * @type {Object}
     */
    defaultRemote: {
      value: {
        method: 'GET',
        cache: true,
        callback: function(data) {
          return data;
        }
      }
    },
    /**
     * 异步请求延迟的时间，当字段验证通过后，不马上进行异步请求，等待继续输入，
     * 300（默认）毫秒后，发送请求，在这个过程中，继续输入，则取消异步请求。
     * @type {Object}
     */
    remoteDaly: {
      value: 500
    },
    /**
     * @private
     * 缓存验证结果，如果验证过对应的值，则直接返回
     * @type {Object}
     */
    cacheMap: {
      value: {}
    },
    /**
     * 加载的模板
     * @type {String}
     */
    loadingTpl: {
      view: true,
      value: '<img src="http://img02.taobaocdn.com/tps/i2/T1NU8nXCVcXXaHNz_X-16-16.gif" alt="loading"/>'
    },
    /**
     * 是否正在等待异步请求结果
     * @type {Boolean}
     */
    isLoading: {
      view: true,
      value: false
    },
    /**
     * 异步请求的配置项，参考jQuery的 ajax配置项，如果为字符串则为 url。
     * 请不要覆盖success属性，如果需要回调则使用 callback 属性
     *
     *        {
     *          remote : {
     *            url : 'test.php',
     *            dataType:'json',//默认为字符串
     *            callback : function(data){
     *              if(data.success){ //data为默认返回的值
     *                return ''  //返回值为空时，验证成功
     *              }else{
     *                return '验证失败，XX错误！' //显示返回的字符串为错误
     *              }
     *            }
     *          }
     *        }
     * @type {String|Object}
     */
    remote: {
      setter: function(v) {
        if (BUI.isString(v)) {
          v = {
            url: v
          }
        }
        return v;
      }
    },
    /**
     * 异步请求的函数指针，仅内部使用
     * @private
     * @type {Number}
     */
    remoteHandler: {},
    events: {
      value: {
        /**
         * 异步请求结束
         * @event
         * @param {Object} e 事件对象
         * @param {*} e.error 是否验证成功
         */
        remotecomplete: false,
        /**
         * 异步请求开始
         * @event
         * @param {Object} e 事件对象
         * @param {Object} e.data 发送的对象，是一个键值对，可以修改此对象，附加信息
         */
        remotestart: false
      }
    }
  };
  Remote.prototype = {
    __bindUI: function() {
      var _self = this;
      _self.on('valid', function(ev) {
        if (_self.get('remote') && _self.isValid() && !_self.get('pauseValid')) {
          var value = _self.getControlValue(),
            data = _self.getRemoteParams();
          _self._startRemote(data, value);
        }
      });
      _self.on('error', function(ev) {
        if (_self.get('remote')) {
          _self._cancelRemote();
        }
      });
    },
    //开始异步请求
    _startRemote: function(data, value) {
      var _self = this,
        remoteHandler = _self.get('remoteHandler'),
        cacheMap = _self.get('cacheMap'),
        remoteDaly = _self.get('remoteDaly');
      if (remoteHandler) {
        //如果前面已经发送过异步请求，取消掉
        _self._cancelRemote(remoteHandler);
      }
      if (cacheMap[value] != null) {
        _self._validResult(_self._getCallback(), cacheMap[value]);
        return;
      }
      //使用闭包进行异步请求
      function dalayFunc() {
        _self._remoteValid(data, remoteHandler, value);
        _self.set('isLoading', true);
      }
      remoteHandler = setTimeout(dalayFunc, remoteDaly);
      _self.setInternal('remoteHandler', remoteHandler);
    },
    _validResult: function(callback, data) {
      var _self = this,
        error = callback(data);
      _self.onRemoteComplete(error, data);
    },
    onRemoteComplete: function(error, data, remoteHandler) {
      var _self = this;
      //确认当前返回的错误是当前请求的结果，防止覆盖后面的请求
      if (remoteHandler == _self.get('remoteHandler')) {
        _self.fire('remotecomplete', {
          error: error,
          data: data
        });
        _self.set('isLoading', false);
        _self.setInternal('remoteHandler', null);
      }
    },
    _getOptions: function(data) {
      var _self = this,
        remote = _self.get('remote'),
        defaultRemote = _self.get('defaultRemote'),
        options = BUI.merge(defaultRemote, remote, {
          data: data
        });
      return options;
    },
    _getCallback: function() {
      return this._getOptions().callback;
    },
    //异步请求
    _remoteValid: function(data, remoteHandler, value) {
      var _self = this,
        cacheMap = _self.get('cacheMap'),
        options = _self._getOptions(data);
      options.success = function(data) {
        var callback = options.callback,
          error = callback(data);
        cacheMap[value] = data; //缓存异步结果
        _self.onRemoteComplete(error, data, remoteHandler);
      };
      options.error = function(jqXHR, textStatus, errorThrown) {
        _self.onRemoteComplete(errorThrown, null, remoteHandler);
      };
      _self.fire('remotestart', {
        data: data
      });
      $.ajax(options);
    },
    /**
     * 获取异步请求的键值对
     * @template
     * @protected
     * @return {Object} 远程验证的参数，键值对
     */
    getRemoteParams: function() {},
    /**
     * 清楚异步验证的缓存
     */
    clearCache: function() {
      this.set('cacheMap', {});
    },
    //取消异步请求
    _cancelRemote: function(remoteHandler) {
      var _self = this;
      remoteHandler = remoteHandler || _self.get('remoteHandler');
      if (remoteHandler) {
        clearTimeout(remoteHandler);
        _self.setInternal('remoteHandler', null);
      }
      _self.set('isLoading', false);
    }
  };
  Remote.View = RemoteView;
  module.exports = Remote;
});
define("bui/form/fields/text", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 表单文本域
   * @author dxq613@gmail.com
   * @ignore
   */
  var Field = require("bui/form/fields/base");
  /**
   * 表单文本域
   * @class BUI.Form.Field.Text
   * @extends BUI.Form.Field
   */
  var textField = Field.extend({}, {
    xclass: 'form-field-text'
  });
  module.exports = textField;
});
define("bui/form/fields/date", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 表单日历域
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Field = require("bui/form/fields/base"),
    DateUtil = BUI.Date;
  /*,
    DatePicker = require('bui-calendar').DatePicker*/
  /**
   * 表单文本域
   * @class BUI.Form.Field.Date
   * @extends BUI.Form.Field
   */
  var dateField = Field.extend({
    //生成日期控件
    renderUI: function() {
      var _self = this,
        datePicker = _self.get('datePicker');
      if ($.isPlainObject(datePicker)) {
        _self.initDatePicker(datePicker);
      }
      if ((datePicker.get && datePicker.get('showTime')) || datePicker.showTime) {
        _self.getInnerControl().addClass('calendar-time');
      }
    },
    //初始化日历控件
    initDatePicker: function(datePicker) {
      var _self = this;
      require.async('bui/calendar', function(Calendar) {
        datePicker.trigger = _self.getInnerControl();
        datePicker.autoRender = true;
        datePicker = new Calendar.DatePicker(datePicker);
        _self.set('datePicker', datePicker);
        _self.set('isCreatePicker', true);
        _self.get('children').push(datePicker);
      });
    },
    /**
     * 设置字段的值
     * @protected
     * @param {Date} value 字段值
     */
    setControlValue: function(value) {
      var _self = this,
        innerControl = _self.getInnerControl();
      if (BUI.isDate(value)) {
        value = DateUtil.format(value, _self._getFormatMask());
      }
      innerControl.val(value);
    },
    //获取格式化函数
    _getFormatMask: function() {
      var _self = this,
        datePicker = _self.get('datePicker');
      if (datePicker.showTime || (datePicker.get && datePicker.get('showTime'))) {
        return 'yyyy-mm-dd HH:MM:ss';
      }
      return 'yyyy-mm-dd';
    },
    /**
     * 将字符串等格式转换成日期
     * @protected
     * @override
     * @param  {String} value 原始数据
     * @return {Date}  该字段指定的类型
     */
    parseValue: function(value) {
      if (BUI.isNumber(value)) {
        return new Date(value);
      }
      return DateUtil.parse(value);
    },
    /**
     * @override
     * @protected
     * 是否当前值
     */
    isCurrentValue: function(value) {
      return DateUtil.isEquals(value, this.get('value'));
    },
    //设置最大值
    _uiSetMax: function(v) {
      this.addRule('max', v);
      var _self = this,
        datePicker = _self.get('datePicker');
      if (datePicker) {
        if (datePicker.set) {
          datePicker.set('maxDate', v);
        } else {
          datePicker.maxDate = v;
        }
      }
    },
    //设置最小值
    _uiSetMin: function(v) {
      this.addRule('min', v);
      var _self = this,
        datePicker = _self.get('datePicker');
      if (datePicker) {
        if (datePicker.set) {
          datePicker.set('minDate', v);
        } else {
          datePicker.minDate = v;
        }
      }
    }
  }, {
    ATTRS: {
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        value: '<input type="text" class="calendar"/>'
      },
      defaultRules: {
        value: {
          date: true
        }
      },
      /**
       * 最大值
       * @type {Date|String}
       */
      max: {},
      /**
       * 最小值
       * @type {Date|String}
       */
      min: {},
      value: {
        setter: function(v) {
          if (BUI.isNumber(v)) { //将数字转换成日期类型
            return new Date(v);
          }
          return v;
        }
      },
      /**
       * 时间选择控件
       * @type {Object|BUI.Calendar.DatePicker}
       */
      datePicker: {
        shared: false,
        value: {}
      },
      /**
       * 时间选择器是否是由此控件创建
       * @type {Boolean}
       * @readOnly
       */
      isCreatePicker: {
        value: true
      }
    },
    PARSER: {
      datePicker: function(el) {
        var _self = this,
          cfg = _self.get('datePicker') || {};
        if (el.hasClass('calendar-time')) {
          BUI.mix(cfg, {
            showTime: true
          });
        }
        return cfg;
      }
    }
  }, {
    xclass: 'form-field-date'
  });
  module.exports = dateField;
});
define("bui/form/fields/select", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 模拟选择框在表单中
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Field = require("bui/form/fields/base");

  function resetOptions(select, options, self) {
    select.children().remove();
    var emptyText = self.get('emptyText');
    if (emptyText && self.get('showBlank')) {
      appendItem('', emptyText, select);
    }
    BUI.each(options, function(option) {
      appendItem(option.value, option.text, select);
    });
  }

  function appendItem(value, text, select) {
      // var str = '<option value="' + value +'">'+text+'</option>'
      // $(str).appendTo(select);
      // 上面那种写法在ie6下会报一个奇怪的错误，使用new Option则不会有这个问题
      var option = new Option(text, value),
        options = select[0].options;
      options[options.length] = option;
    }
    /**
     * 表单选择域
     * @class BUI.Form.Field.Select
     * @extends BUI.Form.Field
     */
  var selectField = Field.extend({
    //生成select
    renderUI: function() {
      var _self = this,
        innerControl = _self.getInnerControl(),
        select = _self.get('select');
      if (_self.get('srcNode') && innerControl.is('select')) { //如果使用现有DOM生成，不使用自定义选择框控件
        return;
      }
      //select = select || {};
      if ($.isPlainObject(select)) {
        _self._initSelect(select);
      }
    },
    _initSelect: function(select) {
      var _self = this,
        items = _self.get('items');
      require.async('bui/select', function(Select) {
        select.render = _self.getControlContainer();
        select.valueField = _self.getInnerControl();
        select.autoRender = true;
        select = new Select.Select(select);
        _self.set('select', select);
        _self.set('isCreate', true);
        _self.get('children').push(select);
        select.on('change', function(ev) {
          var val = select.getSelectedValue();
          _self.set('value', val);
        });
      })
    },
    /**
     * 重新设置选项集合
     * @param {Array} items 选项集合
     */
    setItems: function(items) {
      var _self = this,
        select = _self.get('select');
      if ($.isPlainObject(items)) {
        var tmp = [];
        BUI.each(items, function(v, n) {
          tmp.push({
            value: n,
            text: v
          });
        });
        items = tmp;
      }
      var control = _self.getInnerControl();
      if (control.is('select')) {
        resetOptions(control, items, _self);
        _self.setControlValue(_self.get('value'));
        if (!_self.getControlValue()) {
          _self.setInternal('value', '');
        }
      }
      if (select) {
        if (select.set) {
          select.set('items', items);
        } else {
          select.items = items;
        }
      }
    },
    /**
     * 设置字段的值
     * @protected
     * @param {*} value 字段值
     */
    setControlValue: function(value) {
      var _self = this,
        select = _self.get('select'),
        innerControl = _self.getInnerControl();
      innerControl.val(value);
      if (select && select.set && select.getSelectedValue() !== value) {
        select.setSelectedValue(value);
      }
    },
    /**
     * 获取选中的文本
     * @return {String} 选中的文本
     */
    getSelectedText: function() {
      var _self = this,
        select = _self.get('select'),
        innerControl = _self.getInnerControl();
      if (innerControl.is('select')) {
        var dom = innerControl[0],
          item = dom.options[dom.selectedIndex];
        return item ? item.text : '';
      } else {
        return select.getSelectedText();
      }
    },
    /**
     * 获取tip显示对应的元素
     * @protected
     * @override
     * @return {HTMLElement}
     */
    getTipTigger: function() {
      var _self = this,
        select = _self.get('select');
      if (select && select.rendered) {
        return select.get('el').find('input');
      }
      return _self.get('el');
    },
    //设置选项
    _uiSetItems: function(v) {
      if (v) {
        this.setItems(v);
      }
    },
    /**
     * @protected
     * 设置内部元素宽度
     */
    setInnerWidth: function(width) {
      var _self = this,
        innerControl = _self.getInnerControl(),
        select = _self.get('select'),
        appendWidth = innerControl.outerWidth() - innerControl.width();
      innerControl.width(width - appendWidth);
      if (select && select.set) {
        select.set('width', width);
      }
    }
  }, {
    ATTRS: {
      /**
       * 选项
       * @type {Array}
       */
      items: {},
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        value: '<input type="hidden"/>'
      },
      /**
       * 是否显示为空的文本
       * @type {Boolean}
       */
      showBlank: {
        value: true
      },
      /**
       * 选择为空时的文本
       * @type {String}
       */
      emptyText: {
        value: '请选择'
      },
      /**
       * 内部的Select控件的配置项
       * @cfg {Object} select
       */
      /**
       * 内部的Select控件
       * @type {BUI.Select.Select}
       */
      select: {
        shared: false,
        value: {}
      }
    },
    PARSER: {
      emptyText: function(el) {
        if (!this.get('showBlank')) {
          return '';
        }
        var options = el.find('option'),
          rst = this.get('emptyText');
        if (options.length) {
          rst = $(options[0]).text();
        }
        return rst;
      }
    }
  }, {
    xclass: 'form-field-select'
  });
  module.exports = selectField;
});
define("bui/form/fields/hidden", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 隐藏字段
   * @ignore
   * @author dxq613@gmail.com
   */
  var Field = require("bui/form/fields/base");
  /**
   * 表单隐藏域
   * @class BUI.Form.Field.Hidden
   * @extends BUI.Form.Field
   */
  var hiddenField = Field.extend({}, {
    ATTRS: {
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        value: '<input type="hidden"/>'
      },
      tpl: {
        value: ''
      }
    }
  }, {
    xclass: 'form-field-hidden'
  });
  module.exports = hiddenField;
});
define("bui/form/fields/number", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 表单文本域
   * @author dxq613@gmail.com
   * @ignore
   */
  /**
   * 表单数字域
   * @class BUI.Form.Field.Number
   * @extends BUI.Form.Field
   */
  var Field = require("bui/form/fields/base"),
    numberField = Field.extend({
      /**
       * 将字符串等格式转换成数字
       * @protected
       * @param  {String} value 原始数据
       * @return {Number}  该字段指定的类型
       */
      parseValue: function(value) {
        if (value == '' || value == null) {
          return null;
        }
        if (BUI.isNumber(value)) {
          return value;
        }
        var _self = this,
          allowDecimals = _self.get('allowDecimals');
        value = value.replace(/\,/g, '');
        if (!allowDecimals) {
          return parseInt(value, 10);
        }
        return parseFloat(parseFloat(value).toFixed(_self.get('decimalPrecision')));
      },
      _uiSetMax: function(v) {
        this.addRule('max', v);
      },
      _uiSetMin: function(v) {
        this.addRule('min', v);
      }
    }, {
      ATTRS: {
        /**
         * 最大值
         * @type {Number}
         */
        max: {},
        /**
         * 最小值
         * @type {Number}
         */
        min: {},
        decorateCfgFields: {
          value: {
            min: true,
            max: true
          }
        },
        /**
         * 表单元素或者控件触发此事件时，触发验证
         * @type {String}
         */
        validEvent: {
          value: 'keyup change'
        },
        defaultRules: {
          value: {
            number: true
          }
        },
        /**
         * 是否允许小数，如果不允许，则最终结果转换成整数
         * @type {Boolean}
         */
        allowDecimals: {
          value: true
        },
        /**
         * 允许小数时的，小数位
         * @type {Number}
         */
        decimalPrecision: {
          value: 2
        },
        /**
         * 对数字进行微调时，每次增加或减小的数字
         * @type {Object}
         */
        step: {
          value: 1
        }
      }
    }, {
      xclass: 'form-field-number'
    });
  module.exports = numberField;
});
define("bui/form/fields/check", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview  可勾选字段
   * @ignore
   */
  var $ = require('jquery'),
    Field = require("bui/form/fields/base");
  /**
   * 可选中菜单域
   * @class BUI.Form.Field.Check
   * @extends BUI.Form.Field
   */
  var checkField = Field.extend({
    /**
     * 验证成功后执行的操作
     * @protected
     */
    onValid: function() {
      var _self = this,
        checked = _self._getControlChecked();
      _self.setInternal('checked', checked);
      _self.fire('change');
      if (checked) {
        _self.fire('checked');
      } else {
        _self.fire('unchecked');
      }
    },
    //设置是否勾选
    _setControlChecked: function(checked) {
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.attr('checked', !!checked);
    },
    //获取是否勾选
    _getControlChecked: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      return !!innerControl.attr('checked');
    },
    //覆盖 设置值的方法
    _uiSetValue: function(v) {
      this.setControlValue(v);
    },
    //覆盖不设置宽度
    _uiSetWidth: function(v) {},
    //设置是否勾选
    _uiSetChecked: function(v) {
      var _self = this;
      _self._setControlChecked(v);
      if (_self.get('rendered')) {
        _self.onValid();
      }
    }
  }, {
    ATTRS: {
      /**
       * 触发验证事件，进而引起change事件
       * @override
       * @type {String}
       */
      validEvent: {
        value: 'click'
      },
      /**
       * 是否选中
       * @cfg {String} checked
       */
      /**
       * 是否选中
       * @type {String}
       */
      checked: {
        value: false
      },
      events: {
        value: {
          /**
           * @event
           * 选中事件
           */
          'checked': false,
          /**
           * @event
           * 取消选中事件
           */
          'unchecked': false
        }
      }
    },
    PARSER: {
      checked: function(el) {
        return !!el.attr('checked');
      }
    }
  }, {
    xclass: 'form-check-field'
  });
  module.exports = checkField;
});
define("bui/form/fields/radio", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview  单选框表单域
   * @ignore
   */
  var CheckField = require("bui/form/fields/check");
  /**
   * 表单单选域
   * @class BUI.Form.Field.Radio
   * @extends BUI.Form.Field.Check
   */
  var RadioField = CheckField.extend({
    bindUI: function() {
      var _self = this,
        parent = _self.get('parent'),
        name = _self.get('name');
      if (parent) {
        _self.getInnerControl().on('click', function(ev) {
          var fields = parent.getFields(name);
          BUI.each(fields, function(field) {
            if (field != _self) {
              field.set('checked', false);
            }
          });
        });
      }
    }
  }, {
    ATTRS: {
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        view: true,
        value: '<input type="radio"/>'
      },
      /**
       * 控件容器，如果为空直接添加在控件容器上
       * @type {String|HTMLElement}
       */
      controlContainer: {
        value: '.radio'
      },
      tpl: {
        value: '<label><span class="radio"></span>{label}</label>'
      }
    }
  }, {
    xclass: 'form-field-radio'
  });
  module.exports = RadioField;
});
define("bui/form/fields/checkbox", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview  复选框表单域
   * @ignore
   */
  var CheckField = require("bui/form/fields/check");
  /**
   * 表单复选域
   * @class BUI.Form.Field.Checkbox
   * @extends BUI.Form.Field.Check
   */
  var CheckBoxField = CheckField.extend({}, {
    ATTRS: {
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        view: true,
        value: '<input type="checkbox"/>'
      },
      /**
       * 控件容器，如果为空直接添加在控件容器上
       * @type {String|HTMLElement}
       */
      controlContainer: {
        value: '.checkbox'
      },
      tpl: {
        value: '<label><span class="checkbox"></span>{label}</label>'
      }
    }
  }, {
    xclass: 'form-field-checkbox'
  });
  module.exports = CheckBoxField;
});
define("bui/form/fields/plain", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 仅仅用于显示文本，不能编辑的字段
   * @ignore
   */
  var $ = require('jquery'),
    Field = require("bui/form/fields/base");
  var PlainFieldView = Field.View.extend({
    _uiSetValue: function(v) {
      var _self = this,
        textEl = _self.get('textEl'),
        container = _self.getControlContainer(),
        renderer = _self.get('renderer'),
        text = renderer ? renderer(v) : v,
        width = _self.get('width'),
        appendWidth = 0,
        textTpl;
      if (textEl) {
        textEl.remove();
      }
      text = text || '&nbsp;';
      textTpl = BUI.substitute(_self.get('textTpl'), {
        text: text
      });
      textEl = $(textTpl).appendTo(container);
      appendWidth = textEl.outerWidth() - textEl.width();
      textEl.width(width - appendWidth);
      _self.set('textEl', textEl);
    }
  }, {
    ATTRS: {
      textEl: {},
      value: {}
    }
  }, {
    xclass: 'form-field-plain-view'
  });
  /**
   * 表单文本域，不能编辑
   * @class BUI.Form.Field.Plain
   * @extends BUI.Form.Field
   */
  var PlainField = Field.extend({}, {
    ATTRS: {
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        value: '<input type="hidden"/>'
      },
      /**
       * 显示文本的模板
       * @type {String}
       */
      textTpl: {
        view: true,
        value: '<span class="x-form-text">{text}</span>'
      },
      /**
       * 将字段的值格式化输出
       * @type {Function}
       */
      renderer: {
        view: true,
        value: function(value) {
          return value;
        }
      },
      tpl: {
        value: ''
      },
      xview: {
        value: PlainFieldView
      }
    }
  }, {
    xclass: 'form-field-plain'
  });
  module.exports = PlainField;
});
define("bui/form/fields/list", ["jquery", "bui/common", "bui/list", "bui/data", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 表单中的列表，每个列表后有个隐藏域用来存储数据
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    List = require("bui/list"),
    Field = require("bui/form/fields/base");

  function parseItems(items) {
      var rst = items;
      if ($.isPlainObject(items)) {
        rst = [];
        BUI.each(items, function(v, k) {
          rst.push({
            text: v,
            value: k
          });
        });
      }
      return rst;
    }
    /**
     * @class BUI.Form.Field.List
     * 表单中的列表
     * @extends BUI.Form.Field
     */
  var List = Field.extend({
    initializer: function() {
      var _self = this;
      //if(!_self.get('srcNode')){
      _self._initList();
      //}
    },
    _getList: function() {
      var _self = this,
        children = _self.get('children');
      return children[0];
    },
    bindUI: function() {
      var _self = this,
        list = _self._getList();
      if (list) {
        list.on('selectedchange', function() {
          var value = _self._getListValue(list);
          _self.set('value', value);
        });
      }
    },
    //获取列表值
    _getListValue: function(list) {
      var _self = this;
      list = list || _self._getList();
      return list.getSelectionValues().join(',');
    },
    /**
     * 设置字段的值
     * @protected
     * @param {*} value 字段值
     */
    setControlValue: function(value) {
      var _self = this,
        innerControl = _self.getInnerControl(),
        list = _self._getList();
      innerControl.val(value);
      if (_self._getListValue(list) !== value && list.getCount()) {
        if (list.get('multipleSelect')) {
          list.clearSelection();
        }
        list.setSelectionByField(value.split(','));
      }
    },
    //同步数据
    syncUI: function() {
      this.set('list', this._getList());
    },
    //初始化列表
    _initList: function() {
      var _self = this,
        defaultListCfg = _self.get('defaultListCfg'),
        children = _self.get('children'),
        list = _self.get('list') || {};
      if (children[0]) {
        return;
      }
      if ($.isPlainObject(list)) {
        BUI.mix(list, defaultListCfg);
      }
      children.push(list);
    },
    /**
     * 设置选项
     * @param {Array} items 选项记录
     */
    setItems: function(items) {
      var _self = this,
        value = _self.get('value'),
        list = _self._getList();
      list.set('items', parseItems(items));
      list.setSelectionByField(value.split(','));
    },
    //设置选项集合
    _uiSetItems: function(v) {
      if (v) {
        this.setItems(v);
      }
    }
  }, {
    ATTRS: {
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        value: '<input type="hidden"/>'
      },
      /**
       * @protected
       * 默认的列表配置
       * @type {Object}
       */
      defaultListCfg: {
        value: {
          xclass: 'simple-list'
        }
      },
      /**
       * 选项
       * @type {Array}
       */
      items: {
        setter: function(v) {
          if ($.isPlainObject(v)) {
            var rst = [];
            BUI.each(v, function(v, k) {
              rst.push({
                value: k,
                text: v
              });
            });
            v = rst;
          }
          return v;
        }
      },
      /**
       * 列表
       * @type {BUI.List.SimpleList}
       */
      list: {}
    },
    PARSER: {
      list: function(el) {
        var listEl = el.find('.bui-simple-list');
        if (listEl.length) {
          return {
            srcNode: listEl
          };
        }
      }
    }
  }, {
    xclass: 'form-field-list'
  });
  module.exports = List;
});
define("bui/form/fields/textarea", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 表单文本域
   * @author dxq613@gmail.com
   * @ignore
   */
  var Field = require("bui/form/fields/base");
  /**
   * 表单文本域
   * @class BUI.Form.Field.TextArea
   * @extends BUI.Form.Field
   */
  var TextAreaField = Field.extend({
    //设置行
    _uiSetRows: function(v) {
      var _self = this,
        innerControl = _self.getInnerControl();
      if (v) {
        innerControl.attr('rows', v);
      }
    },
    //设置列
    _uiSetCols: function(v) {
      var _self = this,
        innerControl = _self.getInnerControl();
      if (v) {
        innerControl.attr('cols', v);
      }
    }
  }, {
    ATTRS: {
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        value: '<textarea></textarea>'
      },
      /**
       * 行
       * @type {Number}
       */
      rows: {},
      /**
       * 列
       * @type {Number}
       */
      cols: {},
      decorateCfgFields: {
        value: {
          'rows': true,
          'cols': true
        }
      }
    }
  }, {
    xclass: 'form-field-textarea'
  });
  module.exports = TextAreaField;
});
define("bui/form/fields/uploader", ["bui/common", "jquery", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 模拟选择框在表单中
   * @ignore
   */
  var BUI = require("bui/common"),
    JSON = BUI.JSON,
    Field = require("bui/form/fields/base"),
    Rules = require("bui/form/rules");
  /**
   * 表单上传域
   * @class BUI.Form.Field.Upload
   * @extends BUI.Form.Field
   */
  var uploaderField = Field.extend({
    //生成upload
    renderUI: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      if (_self.get('srcNode') && innerControl.get(0).type === 'file') { //如果使用现有DOM生成，不使用上传组件
        return;
      }
      _self._initControlValue();
      _self._initUpload();
    },
    _initUpload: function() {
      var _self = this,
        children = _self.get('children'),
        uploader = _self.get('uploader') || {};
      require.async('bui/uploader', function(Uploader) {
        uploader.render = _self.getControlContainer();
        uploader.autoRender = true;
        uploader = new Uploader.Uploader(uploader);
        _self.set('uploader', uploader);
        _self.set('isCreate', true);
        _self.get('children').push(uploader);
        _self._initQueue(uploader.get('queue'));
        uploader.on('success', function(ev) {
          var result = _self._getUploaderResult();
          _self.setControlValue(result);
        });
        uploader.get('queue').on('itemremoved', function() {
          var result = _self._getUploaderResult();
          _self.setControlValue(result);
        })
      });
    },
    _getUploaderResult: function() {
      var _self = this,
        uploader = _self.get('uploader'),
        queue = uploader.get('queue'),
        items = queue.getItems(),
        result = [];
      BUI.each(items, function(item) {
        item.result && result.push(item.result);
      });
      return result;
    },
    setControlValue: function(items) {
      var _self = this,
        innerControl = _self.getInnerControl();
      // _self.fire('change');
      innerControl.val(JSON.stringify(items));
    },
    _initControlValue: function() {
      var _self = this,
        textValue = _self.getControlValue(),
        value;
      if (textValue) {
        value = BUI.JSON.parse(textValue);
        _self.set('value', value);
      }
    },
    _initQueue: function(queue) {
        var _self = this,
          value = _self.get('value'),
          result = [];
        //初始化对列默认成功
        BUI.each(value, function(item) {
          var newItem = BUI.cloneObject(item);
          newItem.success = true;
          newItem.result = item;
          result.push(newItem);
        });
        queue && queue.setItems(result);
      } //,
      // valid: function(){
      //   var _self = this,
      //     uploader = _self.get('uploader');
      //   uploaderField.superclass.valid.call(_self);
      //   uploader.valid();
      // }
  }, {
    ATTRS: {
      /**
       * 内部表单元素的容器
       * @type {String}
       */
      controlTpl: {
        value: '<input type="hidden"/>'
      },
      uploader: {
        setter: function(v) {
          var disabled = this.get('disabled');
          v && v.isController && v.set('disabled', disabled);
          return v;
        }
      },
      disabled: {
        setter: function(v) {
          var _self = this,
            uploader = _self.get('uploader');
          uploader && uploader.isController && uploader.set('disabled', v);
        }
      },
      value: {
        shared: false,
        value: []
      },
      defaultRules: function() {
        uploader: true
      }
    }
  }, {
    xclass: 'form-field-uploader'
  });
  Rules.add({
    name: 'uploader', //规则名称
    msg: '上传文件选择有误！', //默认显示的错误信息
    validator: function(value, baseValue, formatMsg, field) { //验证函数，验证值、基准值、格式化后的错误信息
      var uploader = field.get('uploader');
      if (uploader && !uploader.isValid()) {
        return formatMsg;
      }
    }
  });
  module.exports = uploaderField;
});
define("bui/form/fields/checklist", ["bui/common", "jquery", "bui/list", "bui/data", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 可勾选的列表，模拟多个checkbox
   * @ignore
   */
  'use strict';
  var BUI = require("bui/common"),
    ListField = require("bui/form/fields/list");
  /**
   * @class BUI.Form.Field.CheckList
   * 可勾选的列表，模拟多个checkbox
   * @extends BUI.Form.Field.List
   */
  var CheckList = ListField.extend({}, {
    ATTRS: {
      /**
       * @protected
       * 默认的列表配置
       * @type {Object}
       */
      defaultListCfg: {
        value: {
          itemTpl: '<li><span class="x-checkbox"></span>{text}</li>',
          multipleSelect: true,
          allowTextSelection: false
        }
      }
    }
  }, {
    xclass: 'form-field-checklist'
  });
  module.exports = CheckList;
});
define("bui/form/fields/radiolist", ["bui/common", "jquery", "bui/list", "bui/data", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 可勾选的列表，模拟多个radio
   * @ignore
   */
  'use strict';
  var BUI = require("bui/common"),
    ListField = require("bui/form/fields/list");
  /**
   * @class BUI.Form.Field.RadioList
   * 可勾选的列表，模拟多个radio
   * @extends BUI.Form.Field.List
   */
  var RadioList = ListField.extend({}, {
    ATTRS: {
      /**
       * @protected
       * 默认的列表配置
       * @type {Object}
       */
      defaultListCfg: {
        value: {
          itemTpl: '<li><span class="x-radio"></span>{text}</li>',
          allowTextSelection: false
        }
      }
    }
  }, {
    xclass: 'form-field-radiolist'
  });
  module.exports = RadioList;
});
define("bui/form/groupvalid", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 表单分组验证
   * @ignore
   */
  var $ = require('jquery'),
    CLS_ERROR = 'x-form-error',
    Valid = require("bui/form/valid");
  /**
   * @class BUI.Form.GroupValidView
   * @private
   * 表单分组验证视图
   * @extends BUI.Form.ValidView
   */
  function GroupValidView() {}
  BUI.augment(GroupValidView, Valid.View, {
    /**
     * 显示一条错误
     * @private
     * @param  {String} msg 错误信息
     */
    showError: function(msg, errorTpl, container) {
      var errorMsg = BUI.substitute(errorTpl, {
          error: msg
        }),
        el = $(errorMsg);
      el.appendTo(container);
      el.addClass(CLS_ERROR);
    },
    /**
     * 清除错误
     */
    clearErrors: function() {
      var _self = this,
        errorContainer = _self.getErrorsContainer();
      errorContainer.children('.' + CLS_ERROR).remove();
    }
  });
  /**
   * @class BUI.Form.GroupValid
   * 表单分组验证
   * @extends BUI.Form.Valid
   */
  function GroupValid() {}
  GroupValid.ATTRS = ATTRS = BUI.merge(true, Valid.ATTRS, {
    events: {
      value: {
        /**
         * @event
         * 验证结果发生改变，从true变成false或者相反
         * @param {Object} ev 事件对象
         * @param {Object} ev.target 触发事件的子控件
         * @param {Boolean} ev.valid 是否通过验证
         */
        validchange: true,
        /**
         * @event
         * 值改变，仅当通过验证时触发
         * @param {Object} ev 事件对象
         * @param {Object} ev.target 触发事件的子控件
         */
        change: true
      }
    }
  });
  BUI.augment(GroupValid, Valid, {
    __bindUI: function() {
      var _self = this,
        validEvent = 'validchange change';
      //当不需要显示子控件错误时，仅需要监听'change'事件即可
      _self.on(validEvent, function(ev) {
        var sender = ev.target;
        if (sender != this && _self.get('showError')) {
          var valid = sender.isValid();
          //是否所有的子节点都进行过验证
          if (_self._hasAllChildrenValid()) {
            valid = valid && _self.isChildrenValid();
            if (valid) {
              _self.validControl(_self.getRecord());
              valid = _self.isSelfValid();
            }
          }
          if (!valid) {
            _self.showErrors();
          } else {
            _self.clearErrors();
          }
        }
      });
    },
    /**
     * 是否通过验证
     */
    isValid: function() {
      if (this.get('disabled')) { //如果被禁用，则不进行验证，并且认为true
        return true;
      }
      var _self = this,
        isValid = _self.isChildrenValid();
      return isValid && _self.isSelfValid();
    },
    /**
     * 进行验证
     */
    valid: function() {
      var _self = this,
        children = _self.get('children');
      if (_self.get('disabled')) { //禁用时不进行验证
        return;
      }
      BUI.each(children, function(item) {
        if (!item.get('disabled')) {
          item.valid();
        }
      });
    },
    /**
     * 是否所有的子节点进行过校验,如果子节点
     * @private
     */
    _hasAllChildrenValid: function() {
      var _self = this,
        children = _self.get('children'),
        rst = true;
      BUI.each(children, function(item) {
        if (!item.get('disabled') && item.get('hasValid') === false) {
          rst = false;
          return false;
        }
      });
      return rst;
    },
    /**
     * 所有子控件是否通过验证
     * @protected
     * @return {Boolean} 所有子控件是否通过验证
     */
    isChildrenValid: function() {
      var _self = this,
        children = _self.get('children'),
        isValid = true;
      BUI.each(children, function(item) {
        if (!item.get('disabled') && !item.isValid()) {
          isValid = false;
          return false;
        }
      });
      return isValid;
    },
    isSelfValid: function() {
      return !this.get('error');
    },
    /**
     * 验证控件内容
     * @protected
     * @return {Boolean} 是否通过验证
     */
    validControl: function(record) {
      var _self = this,
        error = _self.getValidError(record);
      _self.set('error', error);
    },
    /**
     * 获取验证出错信息，包括自身和子控件的验证错误信息
     * @return {Array} 出错信息
     */
    getErrors: function() {
      var _self = this,
        children = _self.get('children'),
        showChildError = _self.get('showChildError'),
        validError = null,
        rst = [];
      if (showChildError) {
        BUI.each(children, function(child) {
          if (child.getErrors) {
            rst = rst.concat(child.getErrors());
          }
        });
      }
      //如果所有子控件通过验证，才显示自己的错误
      if (_self._hasAllChildrenValid() && _self.isChildrenValid()) {
        validError = _self.get('error');
        if (validError) {
          rst.push(validError);
        }
      }
      return rst;
    },
    //设置错误模板时，覆盖子控件设置的错误模板
    _uiSetErrorTpl: function(v) {
      var _self = this,
        children = _self.get('children');
      BUI.each(children, function(item) {
        if (!item.get('userConfig')['errorTpl']) { //未定义错误模板时
          item.set('errorTpl', v);
        }
      });
    }
  });
  GroupValid.View = GroupValidView;
  module.exports = GroupValid;
});
define("bui/form/form", ["jquery", "bui/common", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 创建表单
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    FieldContainer = require("bui/form/fieldcontainer"),
    Component = BUI.Component,
    TYPE_SUBMIT = {
      NORMAL: 'normal',
      AJAX: 'ajax',
      IFRAME: 'iframe'
    };
  var FormView = FieldContainer.View.extend({
    _uiSetMethod: function(v) {
      this.get('el').attr('method', v);
    },
    _uiSetAction: function(v) {
      this.get('el').attr('action', v);
    }
  }, {
    ATTRS: {
      method: {},
      action: {}
    }
  }, {
    xclass: 'form-view'
  });
  /**
   * @class BUI.Form.Form
   * 表单控件,表单相关的类图：
   * <img src="../assets/img/class-form.jpg"/>
   * @extends BUI.Form.FieldContainer
   */
  var Form = FieldContainer.extend({
    renderUI: function() {
      var _self = this,
        buttonBar = _self.get('buttonBar'),
        cfg;
      if ($.isPlainObject(buttonBar) && _self.get('buttons')) {
        cfg = BUI.merge(_self.getDefaultButtonBarCfg(), buttonBar);
        _self._initButtonBar(cfg);
      }
      _self._initSubmitMask();
    },
    _initButtonBar: function(cfg) {
      var _self = this;
      require.async('bui/toolbar', function(Toolbar) {
        buttonBar = new Toolbar.Bar(cfg);
        _self.set('buttonBar', buttonBar);
      });
    },
    bindUI: function() {
      var _self = this,
        formEl = _self.get('el');
      formEl.on('submit', function(ev) {
        _self.valid();
        if (!_self.isValid() || _self.onBeforeSubmit() === false) {
          ev.preventDefault();
          _self.focusError();
          return;
        }
        if (_self.isValid() && _self.get('submitType') === TYPE_SUBMIT.AJAX) {
          ev.preventDefault();
          _self.ajaxSubmit();
        }
      });
    },
    /**
     * 获取按钮栏默认的配置项
     * @protected
     * @return {Object}
     */
    getDefaultButtonBarCfg: function() {
      var _self = this,
        buttons = _self.get('buttons');
      return {
        autoRender: true,
        elCls: 'toolbar',
        render: _self.get('el'),
        items: buttons,
        defaultChildClass: 'bar-item-button'
      };
    },
    /**
     * 将焦点定位到第一个错误字段
     */
    focusError: function() {
      var _self = this,
        fields = _self.getFields();
      BUI.each(fields, function(field) {
        if (field.get('visible') && !field.get('disabled') && !field.isValid()) {
          try {
            field.focus();
          } catch (e) {
            BUI.log(e);
          }
          return false;
        }
      });
    },
    /**
     * 表单提交，如果未通过验证，则阻止提交
     */
    submit: function(options) {
      var _self = this,
        submitType = _self.get('submitType');
      _self.valid();
      if (_self.isValid()) {
        if (_self.onBeforeSubmit() == false) {
          return;
        }
        if (submitType === TYPE_SUBMIT.NORMAL) {
          _self.get('el')[0].submit();
        } else if (submitType === TYPE_SUBMIT.AJAX) {
          _self.ajaxSubmit(options);
        }
      } else {
        _self.focusError();
      }
    },
    /**
     * 异步提交表单
     */
    ajaxSubmit: function(options) {
      var _self = this,
        method = _self.get('method'),
        action = _self.get('action'),
        callback = _self.get('callback'),
        submitMask = _self.get('submitMask'),
        data = _self.serializeToObject(), //获取表单数据
        success,
        ajaxParams = BUI.merge(true, { //合并请求参数
          url: action,
          type: method,
          dataType: 'json',
          data: data
        }, options);
      if (options && options.success) {
        success = options.success;
      }
      ajaxParams.success = function(data) { //封装success方法
        if (submitMask && submitMask.hide) {
          submitMask.hide();
        }
        if (success) {
          success(data);
        }
        callback && callback.call(_self, data);
      }
      if (submitMask && submitMask.show) {
        submitMask.show();
      }
      $.ajax(ajaxParams);
    },
    //获取提交的屏蔽层
    _initSubmitMask: function() {
      var _self = this,
        submitType = _self.get('submitType'),
        submitMask = _self.get('submitMask');
      if (submitType === TYPE_SUBMIT.AJAX && submitMask) {
        require.async('bui/mask', function(Mask) {
          var cfg = $.isPlainObject(submitMask) ? submitMask : {};
          submitMask = new Mask.LoadMask(BUI.mix({
            el: _self.get('el')
          }, cfg));
          _self.set('submitMask', submitMask);
        });
      }
    },
    /**
     * 序列化表单成对象，所有的键值都是字符串
     * @return {Object} 序列化成对象
     */
    serializeToObject: function() {
      return BUI.FormHelper.serializeToObject(this.get('el')[0]);
    },
    /**
     * serializeToObject 的缩写，所有的键值都是字符串
     * @return {Object} 序列化成对象
     */
    toObject: function() {
      return this.serializeToObject();
    },
    /**
     * 表单提交前
     * @protected
     * @return {Boolean} 是否取消提交
     */
    onBeforeSubmit: function() {
      return this.fire('beforesubmit');
    },
    /**
     * 表单恢复初始值
     */
    reset: function() {
      var _self = this,
        initRecord = _self.get('initRecord');
      _self.setRecord(initRecord);
    },
    /**
     * 重置提示信息，因为在表单隐藏状态下，提示信息定位错误
     * <pre><code>
     * dialog.on('show',function(){
     *   form.resetTips();
     * });
     *
     * </code></pre>
     */
    resetTips: function() {
      var _self = this,
        fields = _self.getFields();
      BUI.each(fields, function(field) {
        field.resetTip();
      });
    },
    /**
     * @protected
     * @ignore
     */
    destructor: function() {
      var _self = this,
        buttonBar = _self.get('buttonBar'),
        submitMask = _self.get('submitMask');
      if (buttonBar && buttonBar.destroy) {
        buttonBar.destroy();
      }
      if (submitMask && submitMask.destroy) {
        submitMask.destroy();
      }
    },
    //设置表单的初始数据
    _uiSetInitRecord: function(v) {
      //if(v){
      this.setRecord(v);
      //}
    }
  }, {
    ATTRS: {
      /**
       * 提交的路径
       * @type {String}
       */
      action: {
        view: true,
        value: ''
      },
      allowTextSelection: {
        value: true
      },
      events: {
        value: {
          /**
           * @event
           * 表单提交前触发，如果返回false会阻止表单提交
           */
          beforesubmit: false
        }
      },
      /**
       * 提交的方式
       * @type {String}
       */
      method: {
        view: true,
        value: 'get'
      },
      /**
       * 默认的loader配置
       * <pre>
       * {
       *   autoLoad : true,
       *   property : 'record',
       *   dataType : 'json'
       * }
       * </pre>
       * @type {Object}
       */
      defaultLoaderCfg: {
        value: {
          autoLoad: true,
          property: 'record',
          dataType: 'json'
        }
      },
      /**
       * 异步提交表单时的屏蔽
       * @type {BUI.Mask.LoadMask|Object}
       */
      submitMask: {
        value: {
          msg: '正在提交。。。'
        }
      },
      /**
       * 提交表单的方式
       *
       *  - normal 普通方式，直接提交表单
       *  - ajax 异步提交方式，在submit指定参数
       *  - iframe 使用iframe提交,开发中。。。
       * @cfg {String} [submitType='normal']
       */
      submitType: {
        value: 'normal'
      },
      /**
       * 表单提交前，如果存在错误，是否将焦点定位到第一个错误
       * @type {Object}
       */
      focusError: {
        value: true
      },
      /**
       * 表单提交成功后的回调函数，普通提交方式 submitType = 'normal'，不会调用
       * @type {Object}
       */
      callback: {},
      decorateCfgFields: {
        value: {
          'method': true,
          'action': true
        }
      },
      /**
       * 默认的子控件时文本域
       * @type {String}
       */
      defaultChildClass: {
        value: 'form-field'
      },
      /**
       * 使用的标签，为form
       * @type {String}
       */
      elTagName: {
        value: 'form'
      },
      /**
       * 表单按钮
       * @type {Array}
       */
      buttons: {},
      /**
       * 按钮栏
       * @type {BUI.Toolbar.Bar}
       */
      buttonBar: {
        shared: false,
        value: {}
      },
      childContainer: {
        value: '.x-form-fields'
      },
      /**
       * 表单初始化的数据，用于初始化或者表单回滚
       * @type {Object}
       */
      initRecord: {},
      /**
       * 表单默认不显示错误，不影响表单分组和表单字段
       * @type {Boolean}
       */
      showError: {
        value: false
      },
      xview: {
        value: FormView
      },
      tpl: {
        value: '<div class="x-form-fields"></div>'
      }
    }
  }, {
    xclass: 'form'
  });
  Form.View = FormView;
  module.exports = Form;
});
define("bui/form/row", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 表单里的一行元素
   * @ignore
   */
  var BUI = require("bui/common"),
    FieldContainer = require("bui/form/fieldcontainer");
  /**
   * @class BUI.Form.Row
   * 表单行
   * @extends BUI.Form.FieldContainer
   */
  var Row = FieldContainer.extend({}, {
    ATTRS: {
      elCls: {
        value: 'row'
      },
      defaultChildCfg: {
        value: {
          tpl: ' <label class="control-label">{label}</label>\
              <div class="controls">\
              </div>',
          childContainer: '.controls',
          showOneError: true,
          controlContainer: '.controls',
          elCls: 'control-group span8',
          errorTpl: '<span class="valid-text"><span class="estate error"><span class="x-icon x-icon-mini x-icon-error">!</span><em>{error}</em></span></span>'
        }
      },
      defaultChildClass: {
        value: 'form-field-text'
      }
    }
  }, {
    xclass: 'form-row'
  });
  module.exports = Row;
});
define("bui/form/fieldgroup", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 表单文本域组，可以包含一个至多个字段
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    Group = require("bui/form/group/base");
  BUI.mix(Group, {
    Range: require("bui/form/group/range"),
    Check: require("bui/form/group/check"),
    Select: require("bui/form/group/select")
  });
  return Group;
});
define("bui/form/group/base", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 表单文本域组，可以包含一个至多个字段
   * @author dxq613@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    FieldContainer = require("bui/form/fieldcontainer");
  /**
   * @class BUI.Form.Group
   * 表单字段分组
   * @extends BUI.Form.FieldContainer
   */
  var Group = FieldContainer.extend({}, {
    ATTRS: {
      /**
       * 标题
       * @type {String}
       */
      label: {
        view: true
      },
      defaultChildClass: {
        value: 'form-field'
      }
    }
  }, {
    xclass: 'form-group'
  });
  module.exports = Group;
});
define("bui/form/group/range", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 范围的字段组，比如日期范围等
   * @ignore
   */
  var Group = require("bui/form/group/base");

  function testRange(self, curVal, prevVal) {
      var allowEqual = self.get('allowEqual');
      if (allowEqual) {
        return prevVal <= curVal;
      }
      return prevVal < curVal;
    }
    /**
     * @class BUI.Form.Group.Range
     * 字段范围分组，用于日期范围，数字范围等场景
     * @extends BUI.Form.Group
     */
  var Range = Group.extend({}, {
    ATTRS: {
      /**
       * 默认的验证函数失败后显示的文本。
       * @type {Object}
       */
      rangeText: {
        value: '开始不能大于结束！'
      },
      /**
       * 是否允许前后相等
       * @type {Boolean}
       */
      allowEqual: {
        value: true
      },
      /**
       * 验证器
       * @override
       * @type {Function}
       */
      validator: {
        value: function(record) {
          var _self = this,
            fields = _self.getFields(),
            valid = true;
          for (var i = 1; i < fields.length; i++) {
            var cur = fields[i],
              prev = fields[i - 1],
              curVal,
              prevVal;
            if (cur && prev) {
              curVal = cur.get('value');
              prevVal = prev.get('value');
              if (!testRange(_self, curVal, prevVal)) {
                valid = false;
                break;
              }
            }
          }
          if (!valid) {
            return _self.get('rangeText');
          }
          return null;
        }
      }
    }
  }, {
    xclass: 'form-group-range'
  });
  module.exports = Range;
});
define("bui/form/group/check", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 选择分组，包含，checkbox,radio
   * @ignore
   */
  var Group = require("bui/form/group/base");

  function getFieldName(self) {
      var firstField = self.getFieldAt(0);
      if (firstField) {
        return firstField.get('name');
      }
      return '';
    }
    /**
     * @class BUI.Form.Group.Check
     * 单选，复选分组，只能包含同name的checkbox,radio
     * @extends BUI.Form.Group
     */
  var Check = Group.extend({
    bindUI: function() {
      var _self = this;
      _self.on('change', function(ev) {
        var name = getFieldName(_self),
          range = _self.get('range'),
          record = _self.getRecord(),
          value = record[name],
          max = range[1];
        if (value && value.length >= max) {
          _self._setFieldsEnable(name, false);
        } else {
          _self._setFieldsEnable(name, true);
        }
      });
    },
    _setFieldsEnable: function(name, enable) {
      var _self = this,
        fields = _self.getFields(name);
      BUI.each(fields, function(field) {
        if (enable) {
          field.enable();
        } else {
          if (!field.get('checked')) {
            field.disable();
          }
        }
      });
    },
    _uiSetRange: function(v) {
      this.addRule('checkRange', v);
    }
  }, {
    ATTRS: {
      /**
       * 需要选中的字段,
       * <ol>
       *   <li>如果 range:1，range:2 最少勾选1个，2个。</li>
       *   <li>如果 range :0,可以全部不选中。</li>
       *   <li>如果 range:[1,2],则必须选中1-2个。</li>
       * </ol>
       * @type {Array|Number}
       */
      range: {
        setter: function(v) {
          if (BUI.isString(v) || BUI.isNumber(v)) {
            v = [parseInt(v, 10)];
          }
          return v;
        }
      }
    }
  }, {
    xclass: 'form-group-check'
  });
  module.exports = Check;
});
define("bui/form/group/select", ["bui/common", "jquery", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 选择框分组
   * @ignore
   */
  var Group = require("bui/form/group/base"),
    Data = require("bui/data"),
    Bindable = BUI.Component.UIBase.Bindable;

  function getItems(nodes) {
      var items = [];
      BUI.each(nodes, function(node) {
        items.push({
          text: node.text,
          value: node.id
        });
      });
      return items;
    }
    /**
     * @class BUI.Form.Group.Select
     * 级联选择框分组
     * @extends BUI.Form.Group
     * @mixins BUI.Component.UIBase.Bindable
     */
  var Select = Group.extend([Bindable], {
    initializer: function() {
      var _self = this,
        url = _self.get('url'),
        store = _self.get('store') || _self._getStore();
      if (!store.isStore) {
        store.autoLoad = true;
        if (url) {
          store.url = url;
        }
        store = new Data.TreeStore(store);
      }
      _self.set('store', store);
    },
    bindUI: function() {
      var _self = this;
      _self.on('change', function(ev) {
        var target = ev.target;
        if (target != _self) {
          var field = target,
            value = field.get('value'),
            level = _self._getFieldIndex(field) + 1;
          _self._valueChange(value, level);
        }
      });
    },
    onLoad: function(e) {
      var _self = this,
        node = e ? e.node : _self.get('store').get('root');
      _self._setFieldItems(node.level, node.children);
    },
    //获取store的配置项
    _getStore: function() {
      var _self = this,
        type = _self.get('type');
      if (type && TypeMap[type]) {
        return TypeMap[type];
      }
      return {};
    },
    _valueChange: function(value, level) {
      var _self = this,
        store = _self.get('store');
      if (value) {
        var node = store.findNode(value);
        if (!node) {
          return;
        }
        if (store.isLoaded(node)) {
          _self._setFieldItems(level, node.children);
        } else {
          store.loadNode(node);
        }
      } else {
        _self._setFieldItems(level, []);
      }
    },
    _setFieldItems: function(level, nodes) {
      var _self = this,
        field = _self.getFieldAt(level),
        items = getItems(nodes);
      if (field) {
        field.setItems(items);
        _self._valueChange(field.get('value'), level + 1);
      }
    },
    //获取字段的索引位置
    _getFieldIndex: function(field) {
      var _self = this,
        fields = _self.getFields();
      return BUI.Array.indexOf(field, fields);
    }
  }, {
    ATTRS: {
      /**
       * 级联选择框的类型,目前仅内置了 'city'一个类型，用于选择省、市、县,
       * 可以自定义添加类型
       *         Select.addType('city',{
       *           proxy : {
       *             url : 'http://lp.taobao.com/go/rgn/citydistrictdata.php',
       *             dataType : 'jsonp'
       *           },
       *           map : {
       *             isleaf : 'leaf',
       *             value : 'text'
       *           }
       *         });
       * @type {String}
       */
      type: {},
      store: {}
    }
  }, {
    xclass: 'form-group-select'
  });
  var TypeMap = {};
  /**
   * 添加一个类型的级联选择框，目前仅内置了 'city'一个类型，用于选择省、市、县
   * @static
   * @param {String} name 类型名称
   * @param {Object} cfg  配置项，详细信息请参看： @see{BUI.Data.TreeStore}
   */
  Select.addType = function(name, cfg) {
    TypeMap[name] = cfg;
  };
  Select.addType('city', {
    proxy: {
      url: 'http://lp.taobao.com/go/rgn/citydistrictdata.php',
      dataType: 'jsonp'
    },
    map: {
      isleaf: 'leaf',
      value: 'text'
    }
  });
  module.exports = Select;
});
define("bui/form/hform", ["jquery", "bui/common", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 垂直表单
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Form = require("bui/form/form");
  /**
   * @class BUI.Form.HForm
   * 水平表单，字段水平排列
   * @extends BUI.Form.Form
   *
   */
  var Horizontal = Form.extend({
    /**
     * 获取按钮栏默认的配置项
     * @protected
     * @return {Object}
     */
    getDefaultButtonBarCfg: function() {
      var _self = this,
        buttons = _self.get('buttons');
      return {
        autoRender: true,
        elCls: 'actions-bar toolbar row',
        tpl: '<div class="form-actions span21 offset3"></div>',
        childContainer: '.form-actions',
        render: _self.get('el'),
        items: buttons,
        defaultChildClass: 'bar-item-button'
      };
    }
  }, {
    ATTRS: {
      defaultChildClass: {
        value: 'form-row'
      },
      errorTpl: {
        value: '<span class="valid-text"><span class="estate error"><span class="x-icon x-icon-mini x-icon-error">!</span><em>{error}</em></span></span>'
      },
      elCls: {
        value: 'form-horizontal'
      }
    },
    PARSER: {}
  }, {
    xclass: 'form-horizontal'
  });
  module.exports = Horizontal;
});
define("bui/editor", ["bui/common", "jquery", "bui/form", "bui/overlay", "bui/list", "bui/data"], function(require, exports, module) {
  var BUI = require("bui/common"),
    Form = require("bui/form"),
    Editor = BUI.namespace('Editor');
  BUI.mix(Editor, {
    Editor: require("bui/editor/editor"),
    RecordEditor: require("bui/editor/record"),
    DialogEditor: require("bui/editor/dialog")
  });
  return Editor;
});
define("bui/editor/editor", ["bui/common", "jquery", "bui/overlay"], function(require, exports, module) {
  /**
   * @ignore
   * @fileOverview 编辑器
   * @author dxq613@gmail.com
   */
  var BUI = require("bui/common"),
    Overlay = require("bui/overlay").Overlay
  CLS_TIPS = 'x-editor-tips',
    Mixin = require("bui/editor/mixin");
  /**
   * @class BUI.Editor.Editor
   * @extends BUI.Overlay.Overlay
   * @mixins BUI.Editor.Mixin
   * 编辑器
   * <p>
   * <img src="../assets/img/class-editor.jpg"/>
   * </p>
   * <pre><code>
   * var editor = new Editor.Editor({
   *   trigger : '.edit-text',
   *   field : {
   *     rules : {
   *       required : true
   *     }
   *   }
   * });
   * </code></pre>
   */
  var editor = Overlay.extend([Mixin], {
    bindUI: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      _self.on('validchange', function(ev) {
        if (!_self.isValid() && _self.get('visible')) {
          _self._showError(_self.getErrors());
        } else {
          _self._hideError();
        }
      });
      _self.on('hide', function() {
        _self._hideError();
      });
      _self.on('show', function() {
        if (!_self.isValid()) {
          _self._showError(_self.getErrors());
        }
      });
    },
    _initOverlay: function() {
      var _self = this,
        tooltip = _self.get('tooltip'),
        overlay = new Overlay(tooltip);
      overlay.render();
      _self.set('overlay', overlay);
      return overlay;
    },
    //获取显示错误列表
    _getErrorList: function() {
      var _self = this,
        overlay = _self.get('overlay');
      return overlay && overlay.get('children')[0];
    },
    _showError: function(errors) {
      var _self = this,
        overlay = _self.get('overlay') || _self._initOverlay(),
        list = _self._getErrorList(),
        align = _self.get('errorAlign'),
        items = BUI.Array.map(errors, function(text) {
          return {
            error: text
          };
        });
      list.set('items', items);
      align.node = _self.get('el');
      overlay.set('align', align);
      overlay.show();
    },
    //隐藏错误
    _hideError: function() {
      var _self = this,
        overlay = _self.get('overlay');
      overlay && overlay.hide();
    },
    /**
     * 清除错误
     */
    clearErrors: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.clearErrors();
      _self._hideError();
    },
    /**
     * @protected
     * @override
     * 获取编辑的源数据
     * @return {String} 返回需要编辑的文本
     */
    getSourceValue: function() {
      var _self = this,
        trigger = _self.get('curTrigger'),
        parser = _self.get('parser'),
        text = trigger.text();
      if (parser) {
        text = parser.call(this, text, trigger);
      }
      return text;
    },
    /**
     * @protected
     * 更新文本
     * @param  {String} text 编辑器的值
     */
    updateSource: function(text) {
      var _self = this,
        trigger = _self.get('curTrigger');
      if (trigger && trigger.length) {
        text = _self._formatText(text);
        trigger.text(text);
      }
    },
    //格式化文本
    _formatText: function(text) {
      var _self = this,
        formatter = _self.get('formatter');
      if (formatter) {
        text = formatter.call(_self, text);
      }
      return text;
    },
    _uiSetWidth: function(v) {
      var _self = this;
      if (v != null) {
        var innerControl = _self.getInnerControl();
        if (innerControl.set) {
          innerControl.set('width', v);
        }
      }
    }
  }, {
    ATTRS: {
      /**
       * 内部控件的代表Value的字段
       * @protected
       * @override
       * @type {String}
       */
      innerValueField: {
        value: 'value'
      },
      /**
       * 空值的数据，清空编辑器时使用
       * @protected
       * @type {*}
       */
      emptyValue: {
        value: ''
      },
      /**
       * 是否自动隐藏
       * @override
       * @type {Boolean}
       */
      autoHide: {
        value: true
      },
      /**
       * 内部控件配置项的字段
       * @protected
       * @type {String}
       */
      controlCfgField: {
        value: 'field'
      },
      /**
       * 默认的字段域配置项
       * @type {Object}
       */
      defaultChildCfg: {
        value: {
          tpl: '',
          forceFit: true,
          errorTpl: '' //
        }
      },
      /**
       * 错误提示信息的配置信息
       * @cfg {Object} tooltip
       */
      tooltip: {
        valueFn: function() {
          return {
            children: [{
              xclass: 'simple-list',
              itemTpl: '<li><span class="x-icon x-icon-mini x-icon-error" title="{error}">!</span>&nbsp;<span>{error}</span></li>'
            }],
            elCls: CLS_TIPS
          };
        }
      },
      defaultChildClass: {
        value: 'form-field'
      },
      /**
       * 编辑器跟所编辑内容的对齐方式
       * @type {Object}
       */
      align: {
        value: {
          points: ['tl', 'tl']
        }
      },
      /**
       * 将编辑的文本转换成编辑器需要的格式,<br>
       * 函数原型：
       * function(text,trigger){}
       *
       * - text 编辑的文本
       * - trigger 编辑的DOM，有时候trigger.text()不等同于编辑的内容，可以在此处修改
       *
       * @cfg {Function} parser
       */
      parser: {},
      /**
       * 返回数据的格式化函数
       * @cfg {Object} formatter
       */
      formatter: {},
      /**
       * 错误信息的对齐方式
       * @type {Object}
       */
      errorAlign: {
        value: {
          points: ['bl', 'tl'],
          offset: [0, 10]
        }
      },
      /**
       * 显示错误的弹出层
       * @type {BUI.Overlay.Overlay}
       */
      overlay: {},
      /**
       * 编辑器中默认使用文本字段域来编辑数据
       * @type {Array}
       */
      field: {
        value: {}
      }
    }
  }, {
    xclass: 'editor'
  });
  module.exports = editor;
});
define("bui/editor/mixin", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 编辑器扩展类，引入这个扩展，控件可以支持编辑器功能。
   * @ignore
   */
  var $ = require('jquery');

  function initEditor(self) {
      var _self = self,
        controlCfgField = _self.get('controlCfgField'),
        control = _self.get(controlCfgField),
        c = _self.addChild(control);
      _self.setInternal(controlCfgField, c);
    }
    /**
     * @class BUI.Editor.Mixin
     * 编辑器扩展类
     */
  var Mixin = function() {
    initEditor(this);
  };
  Mixin.ATTRS = {
    /**
     * 接受更改的事件
     * @protected
     * @type {String}
     */
    acceptEvent: {
      value: 'autohide'
    },
    /**
     * 当发生错误时是否阻止编辑器消失
     * @type {Boolean}
     */
    preventHide: {
      value: true
    },
    /**
     * 重置数据时的事件
     * @type {String}
     */
    changeSourceEvent: {
      value: 'show triggerchange'
    },
    /**
     * 是否忽略掉输入框之类的键盘事件
     * @protected
     * @type {Boolean}
     */
    ignoreInputFields: {
      value: false
    },
    /**
     * 内部控件的代表Value的字段
     * @protected
     * @type {String}
     */
    innerValueField: {},
    /**
     * 空值的数据，清空编辑器时使用
     * @protected
     * @type {*}
     */
    emptyValue: {},
    /**
     * 内部控件配置项的字段
     * @protected
     * @type {String}
     */
    controlCfgField: {},
    focusable: {
      value: true
    },
    autoUpdate: {
      value: true
    },
    events: {
      value: {
        /**
         * @event
         * 接受更改
         */
        accept: false,
        /**
         * @event
         * 取消更改
         */
        cancel: false
      }
    }
  };
  Mixin.prototype = {
    //绑定事件
    __bindUI: function() {
      var _self = this,
        acceptEvent = _self.get('acceptEvent'),
        changeSourceEvent = _self.get('changeSourceEvent');
      if (acceptEvent) {
        _self.on(acceptEvent, function() {
          if (_self.accept()) {
            return;
          } else if (_self.get('preventHide')) {
            return false;
          } else {
            _self.cancel();
          }
        });
      }
      if (changeSourceEvent) {
        _self.on(changeSourceEvent, function() {
          _self.setValue(_self.getSourceValue());
          if (_self.get('visible')) {
            _self.focus();
          }
        });
      }
    },
    /**
     * @protected
     * 获取编辑器的内部控件
     * @return {BUI.Component.Controller} 用于编辑数据的内部数据
     */
    getInnerControl: function() {
      var _self = this,
        children = _self.get('children');
      return children[0];
    },
    /**
     * 设置值，值的类型取决于编辑器编辑的数据
     * @param {String|Object} value 编辑器显示的值
     * @param {Boolean} [hideError=true] 设置值时是否隐藏错误
     */
    setValue: function(value, hideError) {
      var _self = this,
        innerControl = _self.getInnerControl();
      _self.set('editValue', value);
      _self.clearControlValue();
      innerControl.set(_self.get('innerValueField'), value);
      if (!value) { //编辑的值等于空，则可能不会触发验证
        _self.valid();
      }
      if (hideError) {
        _self.clearErrors();
      }
    },
    /**
     * 获取编辑器的值
     * @return {String|Object} 编辑器的值
     */
    getValue: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      return innerControl.get(_self.get('innerValueField'));
    },
    /**
     * 编辑的内容是否通过验证
     * @return {Boolean} 是否通过验证
     */
    isValid: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      return innerControl.isValid ? innerControl.isValid() : true;
    },
    /**
     * 验证内容是否通过验证
     */
    valid: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.valid && innerControl.valid();
    },
    /**
     * 获取错误信息
     * @return {Array} 错误信息
     */
    getErrors: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      return innerControl.getErrors ? innerControl.getErrors() : [];
    },
    /**
     * 编辑的内容是否发生改变
     * @return {Boolean}
     */
    isChange: function() {
      var _self = this,
        editValue = _self.get('editValue'),
        value = _self.getValue();
      return editValue !== value;
    },
    /**
     * 清除编辑的值
     */
    clearValue: function() {
      this.clearControlValue();
      this.clearErrors();
    },
    /**
     * 清除编辑的控件的值
     * @protected
     * @template
     */
    clearControlValue: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.set(_self.get('innerValueField'), _self.get('emptyValue'));
    },
    /**
     * 清除错误
     */
    clearErrors: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.clearErrors();
    },
    /**
     * @protected
     * @template
     * 获取编辑的源数据
     */
    getSourceValue: function() {},
    /**
     * @protected
     * @template
     * 更新编辑的源数据
     */
    updateSource: function() {},
    /**
     * @protected
     * @override
     * 处理esc键
     */
    handleNavEsc: function() {
      this.cancel();
    },
    /**
     * @protected
     * @override
     * 处理enter键
     */
    handleNavEnter: function(ev) {
      var sender = ev.target;
      if (sender.tagName === 'TEXTAREA') { //文本输入框，不确定隐藏
        return;
      }
      if (sender.tagName === 'BUTTON') {
        $(sender).trigger('click');
      }
      this.accept();
    },
    /**
     * 设置获取焦点
     */
    focus: function() {
      var _self = this,
        innerControl = _self.getInnerControl();
      innerControl.focus && innerControl.focus()
    },
    /**
     * 接受编辑器的编辑结果
     * @return {Boolean} 是否成功接受编辑
     */
    accept: function() {
      var _self = this,
        value;
      _self.valid();
      if (!_self.isValid()) {
        return false;
      }
      value = _self.getValue();
      if (_self.get('autoUpdate')) {
        _self.updateSource(value);
      }
      if (_self.fire('beforeaccept', {
          value: value
        }) == false) {
        return;
      }
      _self.fire('accept', {
        value: value,
        editValue: _self.get('editValue')
      }); /**/
      _self.hide();
      return true;
    },
    /**
     * 取消编辑
     */
    cancel: function() {
      this.fire('cancel');
      this.clearValue();
      this.close();
    }
  };
  module.exports = Mixin;
});
define("bui/editor/record", ["bui/common", "jquery", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 对象编辑器
   * @ignore
   */
  var BUI = require("bui/common"),
    Editor = require("bui/editor/editor");
  /**
   * @class BUI.Editor.RecordEditor
   * @extends BUI.Editor.Editor
   * 编辑器
   */
  var editor = Editor.extend({
    /**
     * @protected
     * @override
     * 获取编辑的源数据
     * @return {String} 返回需要编辑的文本
     */
    getSourceValue: function() {
      return this.get('record');
    },
    /**
     * @protected
     * 更新文本
     * @param  {Object} value 编辑器的值
     */
    updateSource: function(value) {
      var _self = this,
        record = _self.get('record');
      BUI.mix(record, value);
    },
    _uiSetRecord: function(v) {
      this.setValue(v);
    }
  }, {
    ATTRS: {
      /**
       * 内部控件的代表Value的字段
       * @protected
       * @override
       * @type {String}
       */
      innerValueField: {
        value: 'record'
      },
      /**
       * 接受更改的事件
       * @type {String}
       */
      acceptEvent: {
        value: ''
      },
      /**
       * 空值的数据，清空编辑器时使用
       * @protected
       * @type {*}
       */
      emptyValue: {
        value: {}
      },
      /**
       * 是否自动隐藏
       * @override
       * @type {Boolean}
       */
      autoHide: {
        value: false
      },
      /**
       * 编辑的记录
       * @type {Object}
       */
      record: {
        value: {}
      },
      /**
       * 内部控件配置项的字段
       * @protected
       * @type {String}
       */
      controlCfgField: {
        value: 'form'
      },
      /**
       * 编辑器内表单的配置项
       * @type {Object}
       */
      form: {
        value: {}
      },
      /**
       * 错误信息的对齐方式
       * @type {Object}
       */
      errorAlign: {
        value: {
          points: ['tr', 'tl'],
          offset: [10, 0]
        }
      },
      /**
       * 默认的字段域配置项
       * @type {Object}
       */
      defaultChildCfg: {
        valueFn: function() {
          var _self = this;
          return {
            xclass: 'form',
            errorTpl: '',
            showError: true,
            showChildError: true,
            defaultChildCfg: {
              elCls: 'bui-inline-block',
              tpl: '',
              forceFit: true
            },
            buttons: [{
              btnCls: 'button button-primary',
              text: '确定',
              handler: function() {
                _self.accept();
              }
            }, {
              btnCls: 'button',
              text: '取消',
              handler: function() {
                _self.cancel();
              }
            }]
          }
        }
      }
    }
  }, {
    xclass: 'record-editor'
  });
  module.exports = editor;
});
define("bui/editor/dialog", ["jquery", "bui/overlay", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 使用弹出框作为编辑器
   * @ignore
   */
  var $ = require('jquery'),
    Dialog = require("bui/overlay").Dialog,
    Mixin = require("bui/editor/mixin");
  /**
   * @class BUI.Editor.DialogEditor
   * @extends BUI.Overlay.Dialog
   * @mixins BUI.Editor.Mixin
   * 编辑器
   */
  var editor = Dialog.extend([Mixin], {
    /**
     * @protected
     * @override
     * 获取编辑的源数据
     * @return {String} 返回需要编辑的文本
     */
    getSourceValue: function() {
      return this.get('record');
    },
    /**
     * @protected
     * @override
     * 处理enter键
     */
    handleNavEnter: function(ev) {
      var _self = this,
        success = _self.get('success'),
        sender = ev.target;
      if (sender.tagName === 'TEXTAREA') { //文本输入框，不确定隐藏
        return;
      }
      if (sender.tagName === 'BUTTON') {
        $(sender).trigger('click');
      }
      if (success) {
        success.call(_self);
      } else {
        this.accept();
      }
    },
    /**
     * 取消编辑
     */
    cancel: function() {
      //if(this.onCancel()!== false){
      this.fire('cancel');
      this.clearValue();
      this.close();
      //} 
    },
    /**
     * @protected
     * 更新文本
     * @param  {Object} value 编辑器的值
     */
    updateSource: function(value) {
      var _self = this,
        record = _self.get('record');
      BUI.mix(record, value);
    },
    _uiSetRecord: function(v) {
      this.setValue(v);
    }
  }, {
    ATTRS: {
      /*autoHide : {
        value : false
      },*/
      /**
       * 内部控件的代表Value的字段
       * @protected
       * @override
       * @type {String}
       */
      innerValueField: {
        value: 'record'
      },
      /**
       * 接受更改的事件
       * @type {String}
       */
      acceptEvent: {
        value: ''
      },
      /**
       * 编辑的记录
       * @type {Object}
       */
      record: {
        value: {}
      },
      /**
       * 空值的数据，清空编辑器时使用
       * @protected
       * @type {*}
       */
      emptyValue: {
        shared: false,
        value: {}
      },
      /**
       * 内部控件配置项的字段
       * @protected
       * @type {String}
       */
      controlCfgField: {
        value: 'form'
      },
      /**
       * dialog 编辑器一般由按钮触发，在触发时设置数据源
       * @override
       * @type {String}
       */
      changeSourceEvent: {
        value: ''
      },
      /**
       * 默认的字段域配置项
       * @type {Object}
       */
      defaultChildCfg: {
        value: {
          xclass: 'form-horizontal'
        }
      },
      /**
       * 设置可以获取交单
       * @type {Boolean}
       */
      focusable: {
        value: false
      },
      success: {
        value: function() {
          this.accept();
        }
      },
      cancel: {
        value: function() {
          this.cancel();
        }
      },
      /**
       * 编辑器内表单的配置项
       * @type {Object}
       */
      form: {
        value: {}
      }
    }
  }, {
    xclass: 'dialog-editor'
  });
  module.exports = editor;
});
define("bui/tooltip", ["bui/common", "jquery", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 提示的入口文件
   * @ignore
   */
  var BUI = require("bui/common"),
    Tooltip = BUI.namespace('Tooltip'),
    Tip = require("bui/tooltip/tip"),
    Tips = require("bui/tooltip/tips");
  BUI.mix(Tooltip, {
    Tip: Tip,
    Tips: Tips
  });
  module.exports = Tooltip;
});
define("bui/tooltip/tip", ["jquery", "bui/common", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 简单易用的提示信息
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Overlay = require("bui/overlay"),
    CLS_ALIGN_PREFIX = 'x-align-',
    MAP_TYPES = {
      left: ['cl', 'cr'], //居左
      right: ['cr', 'cl'], //居右
      top: ['tc', 'bc'], //居上
      bottom: ['bc', 'tc'], //居下
      'top-left': ['tl', 'bl'],
      'top-right': ['tr', 'br'],
      'bottom-left': ['bl', 'tl'],
      'bottom-right': ['br', 'tr']
    };
  //获取距离
  function getOffset(type, offset) {
    if (type === 'left') {
      return [-1 * offset, -4];
    }
    if (type === 'right') {
      return [offset, -4];
    }
    if (type.indexOf('top')) {
      return [0, offset];
    }
    if (type.indexOf('bottom')) {
      return [0, -1 * offset];
    }
  }
  var TipView = Overlay.OverlayView.extend({
    renderUI: function() {},
    //获取显示文本的容器
    _getTitleContainer: function() {
      return this.get('el');
    },
    //设置文本
    _uiSetTitle: function(title) {
      var _self = this,
        titleTpl = _self.get('titleTpl'),
        container = _self._getTitleContainer(),
        titleEl = _self.get('titleEl'),
        tem;
      if (titleEl) {
        titleEl.remove();
      }
      title = title || '';
      if (BUI.isString(title)) {
        title = {
          title: title
        };
      }
      tem = BUI.substitute(titleTpl, title);
      titleEl = $(tem).appendTo(container);
      _self.set('titleEl', titleEl);
    },
    //设置对齐样式
    _uiSetAlignType: function(type, ev) {
      var _self = this;
      if (ev && ev.prevVal) {
        _self.get('el').removeClass(CLS_ALIGN_PREFIX + ev.prevVal);
      }
      if (type) {
        _self.get('el').addClass(CLS_ALIGN_PREFIX + type);
      }
    }
  }, {
    ATTRS: {
      title: {},
      titleEl: {},
      alignType: {}
    }
  }, {
    xclass: 'tooltip-view'
  });
  /**
   * @class BUI.Tooltip.Tip
   * @extends BUI.Overlay.Overlay
   * 简易的提示信息
   *
   * ** 你可以简单的使用单个tip **
   * <pre><code>
   * BUI.use('bui/tooltip',function (Tooltip) {
   *  //不使用模板的，左侧显示
   *   var t1 = new Tooltip.Tip({
   *     trigger : '#t1',
   *     alignType : 'left', //方向
   *     showArrow : false, //不显示箭头
   *     offset : 5, //距离左边的距离
   *     title : '无任何样式，<br>左边的提示信息'
   *   });
   *   t1.render();
   *  });
   * </code></pre>
   *
   * ** 也可以配置模板 **
   * <pre><code>
   * BUI.use('bui/tooltip',function (Tooltip) {
   *  //使用模板的，左侧显示
   *   var t1 = new Tooltip.Tip({
   *     trigger : '#t1',
   *     alignType : 'left', //方向
   *     titleTpl : '&lt;span class="x-icon x-icon-small x-icon-success"&gt;&lt;i class="icon icon-white icon-question"&gt;&lt;/i&gt;&lt;/span&gt;\
   *     &lt;div class="tips-content"&gt;{title}&lt;/div&gt;',
   *     offset : 5, //距离左边的距离
   *     title : '无任何样式，&lt;br&gt;左边的提示信息'
   *   });
   *   t1.render();
   *  });
   * </code></pre>
   */
  var Tip = Overlay.Overlay.extend({
    //设置对齐方式
    _uiSetAlignType: function(type) {
      var _self = this,
        offset = _self.get('offset'),
        align = _self.get('align') || {},
        points = MAP_TYPES[type];
      if (points) {
        align.points = points;
        if (offset) {
          align.offset = getOffset(type, offset);
        }
        _self.set('align', align);
      }
    }
  }, {
    ATTRS: {
      //使用委托的方式显示提示信息
      delegateTrigger: {
        value: true
      },
      /**
       * 对齐类型，包括： top,left,right,bottom四种常用方式，其他对齐方式，可以使用@see{BUI.Tooltip.Tip#property-align}属性
       *
       * @type {String}
       */
      alignType: {
        view: true
      },
      /**
       * 显示的内容，文本或者键值对
       * <pre><code>
       *     var tip =  new Tip({
       *        title : {a : 'text a',b:'text b'}, //属性是对象
       *        titleTpl : '<p>this is {a},because {b}</p>' // <p>this is text a,because text b</p>
       *      });
       * </code></pre>
       * @cfg {String|Object} title
       */
      /**
       * 显示的内容
       * <pre><code>
       *  //设置文本
       *  tip.set('title','new title');
       *
       *  //设置对象
       *  tip.set('title',{a : 'a',b : 'b'})
       * </code></pre>
       * @type {Object}
       */
      title: {
        view: true
      },
      /**
       * 显示对齐箭头
       * @override
       * @default true
       * @cfg {Boolean} [showArrow = true]
       */
      showArrow: {
        value: true
      },
      /**
       * 箭头放置在的位置，是一个选择器，例如 .arrow-wraper
       * <pre><code>
       *     new Tip({ //可以设置整个控件的模板
       *       arrowContainer : '.arrow-wraper',
       *       tpl : '<div class="arrow-wraper"></div>'
       *     });
       *
       *     new Tip({ //也可以设置title的模板
       *       arrowContainer : '.arrow-wraper',
       *       titleTpl : '<div class="arrow-wraper">{title}</div>'
       *     });
       * </code></pre>
       * @cfg {String} arrowContainer
       */
      arrowContainer: {
        view: true
      },
      //自动显示
      autoHide: {
        value: true
      },
      //覆盖自动隐藏类型
      autoHideType: {
        value: 'leave'
      },
      /**
       * 显示的tip 距离触发器Dom的距离
       * <pre><code>
       *  var tip =  new Tip({
       *    title : {a : 'text a',b:'text b'}, //属性是对象
       *    offset : 10, //距离
       *    titleTpl : '<p>this is {a},because {b}</p>' // <p>this is text a,because text b</p>
       *  });
       * </code></pre>
       * @cfg {Number} offset
       */
      offset: {
        value: 0
      },
      /**
       * 触发显示tip的事件名称，默认为mouseover
       * @type {String}
       * @protected
       */
      triggerEvent: {
        value: 'mouseover'
      },
      /**
       * 显示文本的模板
       * <pre><code>
       *  var tip =  new Tip({
       *    title : {a : 'text a',b:'text b'}, //属性是对象
       *    offset : 10, //距离
       *    titleTpl : '<p>this is {a},because {b}</p>' // <p>this is text a,because text b</p>
       *  });
       * </code></pre>
       * @type {String}
       */
      titleTpl: {
        view: true,
        value: '<span>{title}</span>'
      },
      xview: {
        value: TipView
      }
    }
  }, {
    xclass: 'tooltip'
  });
  Tip.View = TipView;
  module.exports = Tip;
});
define("bui/tooltip/tips", ["bui/common", "jquery", "bui/overlay"], function(require, exports, module) {
  /**
   * @fileOverview 批量显示提示信息
   * @ignore
   */
  //是否json对象构成的字符串
  function isObjectString(str) {
    return /^{.*}$/.test(str);
  }
  var BUI = require("bui/common"),
    Tip = require("bui/tooltip/tip"),
    /**
     * @class BUI.Tooltip.Tips
     * 批量显示提示信息
     *  <pre><code>
     * BUI.use('bui/tooltip',function(){
     *   var tips = new Tooltip.Tips({
     *     tip : {
     *       trigger : '#t1 a', //出现此样式的元素显示tip
     *       alignType : 'top', //默认方向
     *       elCls : 'tips tips-no-icon tip1',
     *       titleTpl : '&lt;span class="x-icon x-icon-small x-icon-success"&gt;&lt;i class="icon icon-white icon-question"&gt;&lt;/i&gt;&lt;/span&gt;\
     *           &lt;div class="tips-content"&gt;{title}&lt;/div&gt;',
     *       offset : 10 //距离左边的距离
     *     }
     *   });
     *   tips.render();
     * })
     *
     * </code></pre>
     */
    Tips = function(config) {
      Tips.superclass.constructor.call(this, config);
    };
  Tips.ATTRS = {
    /**
     * 使用的提示控件或者配置信息 @see {BUI.Tooltip.Tip}
     * <pre><code>
     *    //不使用模板的，左侧显示
     * var tips = new Tooltip.Tips({
     *   tip : {
     *     trigger : '#t1 a', //出现此样式的元素显示tip
     *     alignType : 'top', //默认方向
     *     elCls : 'tips tips-no-icon tip1',
     *     offset : 10 //距离左边的距离
     *   }
     * });
     * tips.render();
     * </code></pre>
     * @cfg {BUI.Tooltip.Tip|Object} tip
     */
    /**
     * 使用的提示控件 @see {BUI.Tooltip.Tip}
     * <pre><code>
     *    var tip = tips.get('tip');
     * </code></pre>
     * @type {BUI.Tooltip.Tip}
     * @readOnly
     */
    tip: {},
    /**
     * 默认的对齐方式,如果不指定tip的对齐方式，那么使用此属性
     * <pre><code>
     * //不使用模板的，左侧显示
     * var tips = new Tooltip.Tips({
     *   tip : {
     *     trigger : '#t1 a', //出现此样式的元素显示tip
     *     defaultAlignType : 'top', //默认方向
     *     elCls : 'tips tips-no-icon tip1',
     *     offset : 10 //距离左边的距离
     *   }
     * });
     * tips.render();
     * </code></pre>
     * @cfg {Object} defaultAlignType
     */
    defaultAlignType: {}
  };
  BUI.extend(Tips, BUI.Base);
  BUI.augment(Tips, {
    //初始化
    _init: function() {
      this._initDom();
      this._initEvent();
    },
    //初始化DOM
    _initDom: function() {
      var _self = this,
        tip = _self.get('tip'),
        defaultAlignType;
      if (tip && !tip.isController) {
        defaultAlignType = tip.alignType; //设置默认的对齐方式
        tip = new Tip(tip);
        tip.render();
        _self.set('tip', tip);
        if (defaultAlignType) {
          _self.set('defaultAlignType', defaultAlignType);
        }
      }
    },
    //初始化事件
    _initEvent: function() {
      var _self = this,
        tip = _self.get('tip');
      tip.on('triggerchange', function(ev) {
        var curTrigger = ev.curTrigger;
        _self._replaceTitle(curTrigger);
        _self._setTitle(curTrigger, tip);
      });
    },
    //替换掉title
    _replaceTitle: function(triggerEl) {
      var title = triggerEl.attr('title');
      if (title) {
        triggerEl.attr('data-title', title);
        triggerEl[0].removeAttribute('title');
      }
    },
    //设置title
    _setTitle: function(triggerEl, tip) {
      var _self = this,
        title = triggerEl.attr('data-title'),
        alignType = triggerEl.attr('data-align') || _self.get('defaultAlignType');
      if (isObjectString(title)) {
        title = BUI.JSON.looseParse(title);
      }
      tip.set('title', title);
      if (alignType) {
        tip.set('alignType', alignType);
      }
    },
    /**
     * 渲染提示信息
     * @chainable
     */
    render: function() {
      this._init();
      return this;
    }
  });
  module.exports = Tips;
});
define("bui/grid", ["bui/common", "jquery", "bui/list", "bui/data", "bui/mask", "bui/toolbar", "bui/menu"], function(require, exports, module) {
  /**
   * @fileOverview 表格命名空间入口
   * @ignore
   */
  var BUI = require("bui/common"),
    Grid = BUI.namespace('Grid');
  BUI.mix(Grid, {
    SimpleGrid: require("bui/grid/simplegrid"),
    Grid: require("bui/grid/grid"),
    Column: require("bui/grid/column"),
    Header: require("bui/grid/header"),
    Format: require("bui/grid/format"),
    Plugins: require("bui/grid/plugins/base")
  });
  module.exports = Grid;
});
define("bui/grid/simplegrid", ["jquery", "bui/common", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 简单表格,仅用于展示数据
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    List = require("bui/list"),
    Component = BUI.Component,
    UIBase = Component.UIBase,
    PREFIX = BUI.prefix,
    CLS_GRID = PREFIX + 'grid',
    CLS_GRID_ROW = CLS_GRID + '-row',
    CLS_ROW_ODD = PREFIX + 'grid-row-odd',
    CLS_ROW_EVEN = PREFIX + 'grid-row-even',
    CLS_GRID_BORDER = PREFIX + 'grid-border',
    CLS_ROW_FIRST = PREFIX + 'grid-row-first';
  /**
   * 简单表格的视图类
   * @class BUI.Grid.SimpleGridView
   * @extends BUI.List.SimpleListView
   * @private
   */
  var simpleGridView = List.SimpleListView.extend({
    /**
     * 设置列
     * @internal
     * @param {Array} columns 列集合
     */
    setColumns: function(columns) {
      var _self = this,
        headerRowEl = _self.get('headerRowEl');
      columns = columns || _self.get('columns');
      //清空表头
      headerRowEl.empty();
      BUI.each(columns, function(column) {
        _self._createColumn(column, headerRowEl);
      });
    },
    //创建列
    _createColumn: function(column, parent) {
      var _self = this,
        columnTpl = BUI.substitute(_self.get('columnTpl'), column);
      $(columnTpl).appendTo(parent);
    },
    /**
     * 获取行模板
     * @ignore
     */
    getItemTpl: function(record, index) {
      var _self = this,
        columns = _self.get('columns'),
        rowTpl = _self.get('rowTpl'),
        oddCls = index % 2 === 0 ? CLS_ROW_ODD : CLS_ROW_EVEN,
        cellsTpl = [],
        rowEl;
      BUI.each(columns, function(column) {
        var dataIndex = column['dataIndex'];
        cellsTpl.push(_self._getCellTpl(column, dataIndex, record));
      });
      rowTpl = BUI.substitute(rowTpl, {
        cellsTpl: cellsTpl.join(''),
        oddCls: oddCls
      });
      return rowTpl;
    },
    //get cell template by config and record
    _getCellTpl: function(column, dataIndex, record) {
      var _self = this,
        renderer = column.renderer,
        text = renderer ? renderer(record[dataIndex], record) : record[dataIndex],
        cellTpl = _self.get('cellTpl');
      return BUI.substitute(cellTpl, {
        elCls: column.elCls,
        text: text
      });
    },
    /**
     * 清除数据
     * @ignore
     */
    clearData: function() {
      var _self = this,
        tbodyEl = _self.get('itemContainer');
      tbodyEl.empty();
    },
    showData: function(data) {
      var _self = this;
      BUI.each(data, function(record, index) {
        _self._createRow(record, index);
      });
    },
    //设置单元格边框
    _uiSetInnerBorder: function(v) {
      var _self = this,
        el = _self.get('el');
      if (v) {
        el.addClass(CLS_GRID_BORDER);
      } else {
        el.removeClass(CLS_GRID_BORDER);
      }
    },
    _uiSetTableCls: function(v) {
      var _self = this,
        tableEl = _self.get('el').find('table');
      tableEl.attr('class', v);
    }
  }, {
    ATTRS: {
      /**
       * @private
       * @ignore
       */
      headerRowEl: {
        valueFn: function() {
          var _self = this,
            thead = _self.get('el').find('thead');
          return thead.children('tr');
        }
      },
      /**
       * @private
       * @ignore
       * @type {Object}
       */
      itemContainer: {
        valueFn: function() {
          return this.get('el').find('tbody');
        }
      },
      tableCls: {}
    }
  }, {
    xclass: 'simple-grid-veiw'
  });
  /**
   * 简单表格
   * xclass:'simple-grid'
   * <pre><code>
   *  BUI.use('bui/grid',function(Grid){
   *
   *    var columns = [{
   *             title : '表头1(10%)',
   *             dataIndex :'a',
   *             width:'10%'
   *           },{
   *             id: '123',
   *             title : '表头2(20%)',
   *             dataIndex :'b',
   *             width:'20%'
   *           },{
   *             title : '表头3(70%)',
   *             dataIndex : 'c',
   *             width:'70%'
   *         }],
   *         data = [{a:'123'},{a:'cdd',b:'edd'},{a:'1333',c:'eee',d:2}];
   *
   *     var grid = new Grid.SimpleGrid({
   *       render:'#grid',
   *       columns : columns,
   *       items : data,
   *       idField : 'a'
   *     });
   *
   *     grid.render();
   *   });
   * </code></pre>
   * @class BUI.Grid.SimpleGrid
   * @extends BUI.List.SimpleList
   */
  var simpleGrid = BUI.List.SimpleList.extend({
    renderUI: function() {
      this.get('view').setColumns();
    },
    /**
     * 绑定事件
     * @protected
     */
    bindUI: function() {
      var _self = this,
        itemCls = _self.get('itemCls'),
        hoverCls = itemCls + '-hover',
        el = _self.get('el');
      el.delegate('.' + itemCls, 'mouseover', function(ev) {
        var sender = $(ev.currentTarget);
        sender.addClass(hoverCls);
      }).delegate('.' + itemCls, 'mouseout', function(ev) {
        var sender = $(ev.currentTarget);
        sender.removeClass(hoverCls);
      });
    },
    /**
     * 显示数据
     * <pre><code>
     *   var data = [{},{}];
     *   grid.showData(data);
     *
     *   //等同
     *   grid.set('items',data);
     * </code></pre>
     * @param  {Array} data 要显示的数据
     */
    showData: function(data) {
      this.clearData();
      //this.get('view').showData(data);
      this.set('items', data);
    },
    /**
     * 清除数据
     */
    clearData: function() {
      this.get('view').clearData();
    },
    _uiSetColumns: function(columns) {
      var _self = this;
      //重置列，先清空数据
      _self.clearData();
      _self.get('view').setColumns(columns);
    }
  }, {
    ATTRS: {
      /**
       * 表格可点击项的样式
       * @protected
       * @type {String}
       */
      itemCls: {
        view: true,
        value: CLS_GRID_ROW
      },
      /**
       * 表格应用的样式，更改此值，则不应用默认表格样式
       * <pre><code>
       * grid = new Grid.SimpleGrid({
       *   render:'#grid',
       *   columns : columns,
       *   innerBorder : false,
       *   tableCls:'table table-bordered table-striped',
       *   store : store
       * });
       * </code></pre>
       * @type {Object}
       */
      tableCls: {
        view: true,
        value: CLS_GRID + '-table'
      },
      /**
       * 列信息
       * @cfg {Array} columns
       */
      /**
       * 列信息，仅支持以下配置项：
       * <ol>
       *   <li>title：标题</li>
       *   <li>elCls: 应用到本列的样式</li>
       *   <li>width：宽度，数字或者百分比</li>
       *   <li>dataIndex: 字段名</li>
       *   <li>renderer: 渲染函数</li>
       * </ol>
       * 具体字段的解释清参看 ： {@link BUI.Grid.Column}
       * @type {Array}
       */
      columns: {
        view: true,
        sync: false,
        value: []
      },
      /**
       * 模板
       * @protected
       */
      tpl: {
        view: true,
        value: '<table cellspacing="0" class="{tableCls}" cellpadding="0"><thead><tr></tr></thead><tbody></tbody></table>'
      },
      /**
       * 单元格左右之间是否出现边框
       * <pre><code>
       * <pre><code>
       * grid = new Grid.SimpleGrid({
       *   render:'#grid',
       *   columns : columns,
       *   innerBorder : false,
       *   store : store
       * });
       * </code></pre>
       * </code></pre>
       * @cfg {Boolean} [innerBorder=true]
       */
      /**
       * 单元格左右之间是否出现边框
       * @type {Boolean}
       * @default true
       */
      innerBorder: {
        view: true,
        value: true
      },
      /**
       * 行模版
       * @type {Object}
       */
      rowTpl: {
        view: true,
        value: '<tr class="' + CLS_GRID_ROW + ' {oddCls}">{cellsTpl}</tr>'
      },
      /**
       * 单元格的模版
       * @type {String}
       */
      cellTpl: {
        view: true,
        value: '<td class="' + CLS_GRID + '-cell {elCls}"><div class="' + CLS_GRID + '-cell-inner"><span class="' + CLS_GRID + '-cell-text">{text}</span></div></td>'
      },
      /**
       * 列的配置模版
       * @type {String}
       */
      columnTpl: {
        view: true,
        value: '<th class="' + CLS_GRID + '-hd {elCls}" width="{width}"><div class="' + CLS_GRID + '-hd-inner"><span class="' + CLS_GRID + '-hd-title">{title}</span></div></th>'
      },
      /**
       * @private
       */
      events: {
        value: {}
      },
      xview: {
        value: simpleGridView
      }
    }
  }, {
    xclass: 'simple-grid'
  });
  simpleGrid.View = simpleGridView;
  module.exports = simpleGrid;
});
define("bui/grid/grid", ["jquery", "bui/common", "bui/mask", "bui/toolbar", "bui/list", "bui/data"], function(require, exports, module) {
  /**
   * @fileOverview 表格
   * @ignore
   * @author dxq613@gmail.com
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Mask = require("bui/mask"),
    UA = BUI.UA,
    Component = BUI.Component,
    toolbar = require("bui/toolbar"),
    List = require("bui/list"),
    Header = require("bui/grid/header"),
    Column = require("bui/grid/column");

  function isPercent(str) {
    if (BUI.isString(str)) {
      return str.indexOf('%') !== -1;
    }
    return false;
  }
  var PREFIX = BUI.prefix,
    CLS_GRID_HEADER_CONTAINER = PREFIX + 'grid-header-container',
    CLS_GRID_BODY = PREFIX + 'grid-body',
    CLS_GRID_WITH = PREFIX + 'grid-width',
    CLS_GRID_HEIGHT = PREFIX + 'grid-height',
    CLS_GRID_BORDER = PREFIX + 'grid-border',
    CLS_GRID_TBAR = PREFIX + 'grid-tbar',
    CLS_GRID_BBAR = PREFIX + 'grid-bbar',
    CLS_BUTTON_BAR = PREFIX + 'grid-button-bar',
    CLS_GRID_STRIPE = PREFIX + 'grid-strip',
    CLS_GRID_ROW = PREFIX + 'grid-row',
    CLS_ROW_ODD = PREFIX + 'grid-row-odd',
    CLS_ROW_EVEN = PREFIX + 'grid-row-even',
    CLS_ROW_FIRST = PREFIX + 'grid-row-first',
    CLS_GRID_CELL = PREFIX + 'grid-cell',
    CLS_GRID_CELL_INNER = PREFIX + 'grid-cell-inner',
    CLS_TD_PREFIX = 'grid-td-',
    CLS_CELL_TEXT = PREFIX + 'grid-cell-text',
    CLS_CELL_EMPTY = PREFIX + 'grid-cell-empty',
    CLS_SCROLL_WITH = '17',
    CLS_HIDE = PREFIX + 'hidden',
    ATTR_COLUMN_FIELD = 'data-column-field',
    WIDTH_BORDER = 2,
    HEIGHT_BAR_PADDING = 1;

  function getInnerWidth(width) {
      var _self = this;
      if (BUI.isNumber(width)) {
        width -= WIDTH_BORDER;
      }
      return width;
    }
    /**
     * @class BUI.Grid.GridView
     * @private
     * @extends BUI.List.SimpleListView
     * 表格的视图层
     */
  var gridView = List.SimpleListView.extend({
    //设置 body和table的标签
    renderUI: function() {
      var _self = this,
        el = _self.get('el'),
        bodyEl = el.find('.' + CLS_GRID_BODY);
      _self.set('bodyEl', bodyEl);
      _self._setTableTpl();
    },
    /**
     * 获取行模板
     * @ignore
     */
    getItemTpl: function(record, index) {
      var _self = this,
        columns = _self._getColumns(),
        tbodyEl = _self.get('tbodyEl'),
        rowTpl = _self.get('rowTpl'),
        oddCls = index % 2 === 0 ? CLS_ROW_ODD : CLS_ROW_EVEN,
        cellsTpl = [],
        rowEl;
      BUI.each(columns, function(column) {
        var dataIndex = column.get('dataIndex');
        cellsTpl.push(_self._getCellTpl(column, dataIndex, record, index));
      });
      if (_self.get('useEmptyCell') /*&& !_self.get('forceFit')*/ ) {
        cellsTpl.push(_self._getEmptyCellTpl());
      }
      rowTpl = BUI.substitute(rowTpl, {
        cellsTpl: cellsTpl.join(''),
        oddCls: oddCls
      });
      return rowTpl;
    },
    /**
     * find the dom by the record in this component
     * @param {Object} record the record used to find row dom
     * @return jQuery
     */
    findRow: function(record) {
      var _self = this;
      return $(_self.findElement(record));
    },
    /**
     * find the cell dom by record and column id
     * @param {String} id the column id
     * @param {jQuery} rowEl the dom that showed in this component
     * @return  {jQuery}
     */
    findCell: function(id, rowEl) {
      var cls = CLS_TD_PREFIX + id;
      return rowEl.find('.' + cls);
    },
    /**
     * 重新创建表格的首行，一般在表格初始化完成后，或者列发生改变时
     */
    resetHeaderRow: function() {
      if (!this.get('useHeaderRow')) {
        return;
      }
      var _self = this,
        headerRowEl = _self.get('headerRowEl'),
        tbodyEl = _self.get('tbodyEl');
      if (headerRowEl) {
        headerRowEl.remove();
      }
      headerRowEl = _self._createHeaderRow();
      headerRowEl.prependTo(tbodyEl);
      _self.set('headerRowEl', headerRowEl);
    },
    /**
     * when header's column width changed, column in this component changed followed
     * @ignore
     */
    resetColumnsWidth: function(column, width) {
      var _self = this,
        headerRowEl = _self.get('headerRowEl'),
        cell = _self.findCell(column.get('id'), headerRowEl);
      width = width || column.get('width');
      if (cell) {
        cell.width(width);
      }
      _self.setTableWidth();
    },
    //set table width
    setTableWidth: function(columnsWidth) {
      if (!columnsWidth && isPercent(this.get('width'))) {
        this.get('tableEl').width('100%');
        return;
      }
      var _self = this,
        width = _self._getInnerWidth(),
        height = _self.get('height'),
        tableEl = _self.get('tableEl'),
        forceFit = _self.get('forceFit'),
        headerRowEl = _self.get('headerRowEl');
      //使用百分比的宽度，不进行计算
      if (!isPercent(columnsWidth)) {
        columnsWidth = columnsWidth || _self._getColumnsWidth();
        if (!width) {
          return;
        }
        if (width >= columnsWidth) {
          columnsWidth = width;
          if (height) {
            var scrollWidth = (UA.ie == 6 || UA.ie == 7) ? CLS_SCROLL_WITH + 2 : CLS_SCROLL_WITH;
            columnsWidth = width - scrollWidth;
          }
        }
      }
      tableEl.width(columnsWidth);
    },
    /**
     * 表格表体的宽度
     * @param {Number} width 宽度
     */
    setBodyWidth: function(width) {
      var _self = this,
        bodyEl = _self.get('bodyEl');
      width = width || _self._getInnerWidth();
      bodyEl.width(width);
    },
    /**
     * 设置表体高度
     * @param {Number} height 高度
     */
    setBodyHeight: function(height) {
      var _self = this,
        bodyEl = _self.get('bodyEl'),
        bodyHeight = height,
        siblings = bodyEl.siblings();
      BUI.each(siblings, function(item) {
        if ($(item).css('display') !== 'none') {
          bodyHeight -= $(item).outerHeight();
        }
      });
      bodyEl.height(bodyHeight);
    },
    //show or hide column
    setColumnVisible: function(column) {
      var _self = this,
        hide = !column.get('visible'),
        colId = column.get('id'),
        tbodyEl = _self.get('tbodyEl'),
        cells = $('.' + CLS_TD_PREFIX + colId, tbodyEl);
      if (hide) {
        cells.hide();
      } else {
        cells.show();
      }
    },
    /**
     * 更新数据
     * @param  {Object} record 更新的数据
     */
    updateItem: function(record) {
      var _self = this,
        items = _self.getItems(),
        index = BUI.Array.indexOf(record, items),
        columns = _self._getColumns(),
        element = null,
        tpl;
      if (index >= 0) {
        element = _self.findElement(record);
        BUI.each(columns, function(column) {
          var cellEl = _self.findCell(column.get('id'), $(element)),
            innerEl = cellEl.find('.' + CLS_GRID_CELL_INNER),
            textTpl = _self._getCellText(column, record, index);
          innerEl.html(textTpl);
        });
        return element;
      }
    },
    /**
     * 显示没有数据时的提示信息
     */
    showEmptyText: function() {
      var _self = this,
        bodyEl = _self.get('bodyEl'),
        emptyDataTpl = _self.get('emptyDataTpl'),
        emptyEl = _self.get('emptyEl');
      if (emptyEl) {
        emptyEl.remove();
      }
      var emptyEl = $(emptyDataTpl).appendTo(bodyEl);
      _self.set('emptyEl', emptyEl);
    },
    /**
     * 清除没有数据时的提示信息
     */
    clearEmptyText: function() {
      var _self = this,
        emptyEl = _self.get('emptyEl');
      if (emptyEl) {
        emptyEl.remove();
      }
    },
    //设置第一行空白行，不显示任何数据，仅用于设置列的宽度
    _createHeaderRow: function() {
      var _self = this,
        columns = _self._getColumns(),
        tbodyEl = _self.get('tbodyEl'),
        rowTpl = _self.get('headerRowTpl'),
        rowEl,
        cellsTpl = [];
      $.each(columns, function(index, column) {
        cellsTpl.push(_self._getHeaderCellTpl(column));
      });
      //if this component set width,add a empty column to fit row width
      if (_self.get('useEmptyCell') /* && !_self.get('forceFit')*/ ) {
        cellsTpl.push(_self._getEmptyCellTpl());
      }
      rowTpl = BUI.substitute(rowTpl, {
        cellsTpl: cellsTpl.join('')
      });
      rowEl = $(rowTpl).appendTo(tbodyEl);
      return rowEl;
    },
    //get the sum of the columns' width
    _getColumnsWidth: function() {
      var _self = this,
        columns = _self.get('columns'),
        totalWidth = 0;
      BUI.each(columns, function(column) {
        if (column.get('visible')) {
          totalWidth += column.get('el').outerWidth();
        }
      });
      return totalWidth;
    },
    //获取列集合
    _getColumns: function() {
      return this.get('columns');
    },
    //get cell text by record and column
    _getCellText: function(column, record, index) {
      var _self = this,
        dataIndex = column.get('dataIndex'),
        textTpl = column.get('cellTpl') || _self.get('cellTextTpl'),
        text = _self._getCellInnerText(column, dataIndex, record, index);
      return BUI.substitute(textTpl, {
        text: text,
        tips: _self._getTips(column, dataIndex, record)
      });
    },
    _getCellInnerText: function(column, dataIndex, record, index) {
      //renderer 时发生错误可能性很高
      try {
        var _self = this,
          renderer = column.get('renderer'),
          text = renderer ? renderer(record[dataIndex], record, index) : record[dataIndex];
        return text == null ? '' : text;
      } catch (ex) {
        throw 'column:' + column.get('title') + ' fomat error!';
      }
    },
    //get cell template by config and record
    _getCellTpl: function(column, dataIndex, record, index) {
      var _self = this,
        cellText = _self._getCellText(column, record, index),
        cellTpl = _self.get('cellTpl');
      return BUI.substitute(cellTpl, {
        elCls: column.get('elCls'),
        id: column.get('id'),
        dataIndex: dataIndex,
        cellText: cellText,
        hideCls: !column.get('visible') ? CLS_HIDE : ''
      });
    },
    //获取空白单元格的模板
    _getEmptyCellTpl: function() {
      return '<td class="' + CLS_GRID_CELL + ' ' + CLS_CELL_EMPTY + '">&nbsp;</td>';
    },
    //获取空白行单元格模板
    _getHeaderCellTpl: function(column) {
      var _self = this,
        headerCellTpl = _self.get('headerCellTpl');
      return BUI.substitute(headerCellTpl, {
        id: column.get('id'),
        width: column.get('width'),
        hideCls: !column.get('visible') ? CLS_HIDE : ''
      });
    },
    //获取表格内宽度
    _getInnerWidth: function() {
      return getInnerWidth(this.get('width'));
    },
    //get cell tips
    _getTips: function(column, dataIndex, record) {
      var showTip = column.get('showTip'),
        value = '';
      if (showTip) {
        value = record[dataIndex];
        if (BUI.isFunction(showTip)) {
          value = showTip(value, record);
        }
      }
      return value;
    },
    //设置单元格边框
    _uiSetInnerBorder: function(v) {
      var _self = this,
        el = _self.get('el');
      if (v) {
        el.addClass(CLS_GRID_BORDER);
      } else {
        el.removeClass(CLS_GRID_BORDER);
      }
    },
    //设置表格模板
    _setTableTpl: function(tpl) {
      var _self = this,
        bodyEl = _self.get('bodyEl');
      tpl = tpl || _self.get('tableTpl');
      $(tpl).appendTo(bodyEl);
      var tableEl = bodyEl.find('table'),
        tbodyEl = bodyEl.find('tbody');
      //headerRowEl = _self._createHeaderRow();
      _self.set('tableEl', tableEl);
      _self.set('tbodyEl', tbodyEl);
      //_self.set('headerRowEl', headerRowEl);
      _self.set('itemContainer', tbodyEl);
      _self._setTableCls(_self.get('tableCls'));
    },
    //设置table上的样式
    _uiSetTableCls: function(v) {
      this._setTableCls(v);
    },
    //when set grid's height,the scroll can effect the width of its body and header
    _uiSetHeight: function(h) {
      var _self = this,
        bodyEl = _self.get('bodyEl');
      _self.get('el').height(h);
      _self.get('el').addClass(CLS_GRID_HEIGHT);
    },
    _uiSetWidth: function(w) {
      var _self = this;
      _self.get('el').width(w);
      _self.setBodyWidth(_self._getInnerWidth(w));
      _self.get('el').addClass(CLS_GRID_WITH);
    },
    _uiSetStripeRows: function(v) {
      var _self = this,
        method = v ? 'addClass' : 'removeClass';
      _self.get('el')[method](CLS_GRID_STRIPE);
    },
    _setTableCls: function(cls) {
      var _self = this,
        tableEl = _self.get('tableEl');
      tableEl.attr('class', cls);
    }
  }, {
    ATTRS: {
      tableCls: {},
      bodyEl: {},
      tbodyEl: {},
      headerRowEl: {},
      tableEl: {},
      emptyEl: {}
    }
  }, {
    xclass: 'grid-view'
  });
  /**
   * @class BUI.Grid.Grid
   *
   * 表格控件,表格控件类图，一般情况下配合{@link BUI.Data.Store} 一起使用
   * <p>
   * <img src="../assets/img/class-grid.jpg"/>
   * </p>
   * <p>表格插件的类图：</p>
   * <p>
   * <img src="../assets/img/class-grid-plugins.jpg"/>
   * </p>
   *
   * <pre><code>
   *  BUI.use(['bui/grid','bui/data'],function(Grid,Data){
   *    var Grid = Grid,
   *      Store = Data.Store,
   *      columns = [{  //声明列模型
   *          title : '表头1(20%)',
   *          dataIndex :'a',
   *          width:'20%'
   *        },{
   *          id: '123',
   *          title : '表头2(30%)',
   *          dataIndex :'b',
   *          width:'30%'
   *        },{
   *          title : '表头3(50%)',
   *          dataIndex : 'c',
   *          width:'50%'
   *      }],
   *      data = [{a:'123'},{a:'cdd',b:'edd'},{a:'1333',c:'eee',d:2}]; //显示的数据
   *
   *    var store = new Store({
   *        data : data,
   *        autoLoad:true
   *      }),
   *       grid = new Grid.Grid({
   *         render:'#grid',
   *         width:'100%',//这个属性一定要设置
   *         columns : columns,
   *         idField : 'a',
   *         store : store
   *       });
   *
   *     grid.render();
   *   });
   * </code></pre>
   * @extends BUI.List.SimpleList
   */
  var grid = List.SimpleList.extend({
    /**
     * @protected
     * @ignore
     */
    createDom: function() {
      var _self = this,
        render = _self.get('render'),
        outerWidth = $(render).width(),
        width = _self.get('width');
      if (!width && outerWidth) {
        var appendWidth = _self.getAppendWidth();
        _self.set('width', outerWidth - appendWidth);
      }
      // 提前,中途设置宽度时会失败！！
      if (_self.get('width')) {
        _self.get('el').addClass(CLS_GRID_WITH);
      }
      if (_self.get('height')) {
        _self.get('el').addClass(CLS_GRID_HEIGHT);
      }
      //因为内部的边距影响header的forceFit计算，所以必须在header计算forceFit前置此项
      if (_self.get('innerBorder')) {
        _self.get('el').addClass(CLS_GRID_BORDER);
      }
    },
    /**
     * @protected
     * @ignore
     */
    renderUI: function() {
      var _self = this;
      _self._initHeader();
      _self._initBars();
      _self._initLoadMask();
      _self.get('view').resetHeaderRow();
    },
    /**
     * @private
     */
    bindUI: function() {
      var _self = this;
      _self._bindHeaderEvent();
      _self._bindBodyEvent();
      _self._bindItemsEvent();
    },
    /**
     * 添加列
     * <pre><code>
     *   //添加到最后
     *   grid.addColumn({title : 'new column',dataIndex : 'new',width:100});
     *   //添加到最前
     *   grid.addColumn({title : 'new column',dataIndex : 'new',width:100},0);
     * </code></pre>
     * @param {Object|BUI.Grid.Column} column 列的配置，列类的定义 {@link BUI.Grid.Column}
     * @param {Number} index 添加到的位置
     * @return {BUI.Grid.Column}
     */
    addColumn: function(column, index) {
      var _self = this,
        header = _self.get('header');
      if (header) {
        column = header.addColumn(column, index);
      } else {
        column = new Column(column);
        _self.get('columns').splice(index, 0, column);
      }
      return column;
    },
    /**
     * 清除显示的数据
     * <pre><code>
     *   grid.clearData();
     * </code></pre>
     */
    clearData: function() {
      this.clearItems();
    },
    /**
     * 当前显示在表格中的数据
     * @return {Array} 纪录集合
     * @private
     */
    getRecords: function() {
      return this.getItems();
    },
    /**
     * 使用索引或者id查找列
     * <pre><code>
     *  //设置列的id,否则会自动生成
     *  {id : '1',title : '表头',dataIndex : 'a'}
     *  //获取列
     *  var column = grid.findColumn('id');
     *  //操作列
     *  column.set('visible',false);
     * </code></pre>
     * @param {String|Number} id|index  文本值代表编号，数字代表索引
     */
    findColumn: function(id) {
      var _self = this,
        header = _self.get('header');
      if (BUI.isNumber(id)) {
        return header.getColumnByIndex(id);
      } else {
        return header.getColumnById(id);
      }
    },
    /**
     * 使用字段名查找列
     * <pre><code>
     * //设置列dataIndex
     *  {id : '1',title : '表头',dataIndex : 'a'}
     *  //获取列
     *  var column = grid.findColumnByField('a');
     *  //操作列
     *  column.set('visible',false);
     * </code></pre>
     * @param {String} field 列的字段名 dataIndex
     */
    findColumnByField: function(field) {
      var _self = this,
        header = _self.get('header');
      return header.getColumn(function(column) {
        return column.get('dataIndex') === field;
      });
    },
    /**
     * 根据列的Id查找对应的单元格
     * @param {String|Number} id 列id
     * @param {Object|jQuery} record 本行对应的记录，或者是本行的ＤＯＭ对象
     * @protected
     * @return  {jQuery}
     */
    findCell: function(id, record) {
      var _self = this,
        rowEl = null;
      if (record instanceof $) {
        rowEl = record;
      } else {
        rowEl = _self.findRow(record);
      }
      if (rowEl) {
        return _self.get('view').findCell(id, rowEl);
      }
      return null;
    },
    /**
     * find the dom by the record in this component
     * @param {Object} record the record used to find row dom
     * @protected
     * @return jQuery
     */
    findRow: function(record) {
      var _self = this;
      return _self.get('view').findRow(record);
    },
    /**
     * 移除列
     * <pre><code>
     *   var column = grid.findColumn('id');
     *   grid.removeColumn(column);
     * </code></pre>
     * @param {BUI.Grid.Column} column 要移除的列
     */
    removeColumn: function(column) {
      var _self = this;
      _self.get('header').removeColumn(column);
    },
    /**
     * 显示数据,当不使用store时，可以单独显示数据
     * <pre><code>
     *   var data = [{},{}];
     *   grid.showData(data);
     * </code></pre>
     * @param  {Array} data 显示的数据集合
     */
    showData: function(data) {
      var _self = this;
      _self.set('items', data);
    },
    /**
     * 重置列，当列发生改变时同步DOM和数据
     * @protected
     */
    resetColumns: function() {
      var _self = this,
        store = _self.get('store');
      //recreate the header row
      _self.get('view').resetHeaderRow();
      //show data
      if (store) {
        _self.onLoad();
      }
    },
    //when body scrolled,the other component of grid also scrolled
    _bindScrollEvent: function() {
      var _self = this,
        el = _self.get('el'),
        bodyEl = el.find('.' + CLS_GRID_BODY),
        header = _self.get('header');
      bodyEl.on('scroll', function() {
        var left = bodyEl.scrollLeft(),
          top = bodyEl.scrollTop();
        header.scrollTo({
          left: left,
          top: top
        });
        _self.fire('scroll', {
          scrollLeft: left,
          scrollTop: top,
          bodyWidth: bodyEl.width(),
          bodyHeight: bodyEl.height()
        });
      });
    },
    //bind header event,when column changed,followed this component
    _bindHeaderEvent: function() {
      var _self = this,
        header = _self.get('header'),
        view = _self.get('view'),
        store = _self.get('store');
      header.on('afterWidthChange', function(e) {
        var sender = e.target;
        if (sender !== header) {
          view.resetColumnsWidth(sender);
        }
      });
      header.on('afterSortStateChange', function(e) {
        var column = e.target,
          val = e.newVal;
        if (val && store) {
          store.sort(column.get('dataIndex'), column.get('sortState'));
        }
      });
      header.on('afterVisibleChange', function(e) {
        var sender = e.target;
        if (sender !== header) {
          view.setColumnVisible(sender);
          _self.fire('columnvisiblechange', {
            column: sender
          });
        }
      });
      header.on('click', function(e) {
        var sender = e.target;
        if (sender !== header) {
          _self.fire('columnclick', {
            column: sender,
            domTarget: e.domTarget
          });
        }
      });
      header.on('forceFitWidth', function() {
        if (_self.get('rendered')) {
          _self.resetColumns();
        }
      });
      header.on('add', function(e) {
        if (_self.get('rendered')) {
          _self.fire('columnadd', {
            column: e.column,
            index: e.index
          });
          _self.resetColumns();
        }
      });
      header.on('remove', function(e) {
        if (_self.get('rendered')) {
          _self.resetColumns();
          _self.fire('columnremoved', {
            column: e.column,
            index: e.index
          });
        }
      });
    },
    //when body scrolled, header can followed
    _bindBodyEvent: function() {
      var _self = this;
      _self._bindScrollEvent();
    },
    //绑定记录DOM相关的事件
    _bindItemsEvent: function() {
      var _self = this,
        store = _self.get('store');
      _self.on('itemsshow', function() {
        _self.fire('aftershow');
      });
      _self.on('itemsclear', function() {
        _self.fire('clear');
      });
      _self.on('itemclick', function(ev) {
        var target = ev.domTarget,
          record = ev.item,
          cell = $(target).closest('.' + CLS_GRID_CELL),
          rowEl = $(target).closest('.' + CLS_GRID_ROW),
          rst; //用于是否阻止事件触发
        if (cell.length) {
          rst = _self.fire('cellclick', {
            record: record,
            row: rowEl[0],
            cell: cell[0],
            field: cell.attr(ATTR_COLUMN_FIELD),
            domTarget: target,
            domEvent: ev.domEvent
          });
        }
        if (rst === false) {
          return rst;
        }
        return _self.fire('rowclick', {
          record: record,
          row: rowEl[0],
          domTarget: target
        });
      });
      _self.on('itemunselected', function(ev) {
        _self.fire('rowunselected', getEventObj(ev));
      });
      _self.on('itemselected', function(ev) {
        _self.fire('rowselected', getEventObj(ev));
      });
      _self.on('itemrendered', function(ev) {
        _self.fire('rowcreated', getEventObj(ev));
      });
      _self.on('itemremoved', function(ev) {
        _self.fire('rowremoved', getEventObj(ev));
      });
      _self.on('itemupdated', function(ev) {
        _self.fire('rowupdated', getEventObj(ev));
      });

      function getEventObj(ev) {
        return {
          record: ev.item,
          row: ev.domTarget,
          domTarget: ev.domTarget
        };
      }
    },
    //获取表格内部的宽度，受边框的影响，
    //内部的宽度不能等于表格宽度
    _getInnerWidth: function(width) {
      width = width || this.get('width');
      return getInnerWidth(width);
    },
    //init header,if there is not a header property in config,instance it
    _initHeader: function() {
      var _self = this,
        header = _self.get('header'),
        container = _self.get('el').find('.' + CLS_GRID_HEADER_CONTAINER);
      if (!header) {
        header = new Header({
          columns: _self.get('columns'),
          tableCls: _self.get('tableCls'),
          forceFit: _self.get('forceFit'),
          width: _self._getInnerWidth(),
          render: container,
          parent: _self
        }).render();
        //_self.addChild(header);
        _self.set('header', header);
      }
    },
    //初始化 上下工具栏
    _initBars: function() {
      var _self = this,
        bbar = _self.get('bbar'),
        tbar = _self.get('tbar');
      _self._initBar(bbar, CLS_GRID_BBAR, 'bbar');
      _self._initBar(tbar, CLS_GRID_TBAR, 'tbar');
    },
    //set bar's elCls to identify top bar or bottom bar
    _initBar: function(bar, cls, name) {
      var _self = this,
        store = null,
        pagingBarCfg = null;
      if (bar) {
        //未指定xclass,同时不是Controller时
        if (!bar.xclass && !(bar instanceof Component.Controller)) {
          bar.xclass = 'bar';
          bar.children = bar.children || [];
          if (bar.items) {
            bar.children.push({
              xclass: 'bar',
              defaultChildClass: "bar-item-button",
              elCls: CLS_BUTTON_BAR,
              children: bar.items
            });
            bar.items = null;
          }
          // modify by fuzheng
          if (bar.pagingBar) {
            store = _self.get('store');
            pagingBarCfg = {
              xclass: 'pagingbar',
              store: store,
              pageSize: store.pageSize
            };
            if (bar.pagingBar !== true) {
              pagingBarCfg = BUI.merge(pagingBarCfg, bar.pagingBar);
            }
            bar.children.push(pagingBarCfg);
          }
        }
        if (bar.xclass) {
          var barContainer = _self.get('el').find('.' + cls);
          barContainer.show();
          bar.render = barContainer;
          //bar.parent=_self;
          bar.elTagName = 'div';
          bar.autoRender = true;
          bar = _self.addChild(bar); //Component.create(bar).create();
        }
        _self.set(name, bar);
      }
      return bar;
    },
    //when set 'loadMask = true' ,create a loadMask instance
    _initLoadMask: function() {
      var _self = this,
        loadMask = _self.get('loadMask');
      if (loadMask && !loadMask.show) {
        loadMask = new BUI.Mask.LoadMask({
          el: _self.get('el')
        });
        _self.set('loadMask', loadMask);
      }
    },
    //调整宽度时，调整内部控件宽度
    _uiSetWidth: function(w) {
      var _self = this;
      if (_self.get('rendered')) {
        if (!isPercent(w)) {
          _self.get('header').set('width', _self._getInnerWidth(w));
        } else {
          _self.get('header').set('width', '100%');
        }
      }
      _self.get('view').setTableWidth();
    },
    //设置自适应宽度
    _uiSetForceFit: function(v) {
      var _self = this;
      _self.get('header').set('forceFit', v);
    },
    //when set grid's height,the scroll can effect the width of its body and header
    _uiSetHeight: function(h, obj) {
      var _self = this,
        header = _self.get('header');
      _self.get('view').setBodyHeight(h);
      if (_self.get('rendered')) {
        if (_self.get('forceFit') && !obj.prevVal) {
          header.forceFitColumns();
          //强迫对齐时，由未设置高度改成设置高度，增加了17像素的滚动条宽度，所以重置表格宽度
          _self.get('view').setTableWidth();
        }
        header.setTableWidth();
      }
    },
    /**
     * 加载数据
     * @protected
     */
    onLoad: function() {
      var _self = this,
        store = _self.get('store');
      grid.superclass.onLoad.call(this);
      if (_self.get('emptyDataTpl')) { //初始化的时候不显示空白数据的文本
        if (store && store.getCount() == 0) {
          _self.get('view').showEmptyText();
        } else {
          _self.get('view').clearEmptyText();
        }
      }
    }
  }, {
    ATTRS: {
      /**
       * 表头对象
       * @type {BUI.Grid.Header}
       * @protected
       */
      header: {},
      /**
       * @see {BUI.Grid.Grid#tbar}
       * <pre><code>
       * grid = new Grid.Grid({
       *    render:'#grid',
       *    columns : columns,
       *    width : 700,
       *    forceFit : true,
       *    tbar:{ //添加、删除
       *        items : [{
       *          btnCls : 'button button-small',
       *          text : '<i class="icon-plus"></i>添加',
       *          listeners : {
       *            'click' : addFunction
       *          }
       *        },
       *        {
       *          btnCls : 'button button-small',
       *          text : '<i class="icon-remove"></i>删除',
       *          listeners : {
       *            'click' : delFunction
       *          }
       *        }]
       *    },
       *    store : store
       *  });
       *
       * grid.render();
       * </code></pre>
       * @cfg {Object|BUI.Toolbar.Bar} bbar
       */
      /**
       * @see {BUI.Grid.Grid#tbar}
       * @type {Object}
       * @ignore
       */
      bbar: {},
      itemCls: {
        value: CLS_GRID_ROW
      },
      /**
       * 列的配置 用来配置 表头 和 表内容。{@link BUI.Grid.Column}
       * @cfg {Array} columns
       */
      columns: {
        view: true,
        value: []
      },
      /**
       * 强迫列自适应宽度，如果列宽度大于Grid整体宽度，等比例缩减，否则等比例增加
       * <pre><code>
       *  var grid = new Grid.Grid({
       *    render:'#grid',
       *    columns : columns,
       *    width : 700,
       *    forceFit : true, //自适应宽度
       *    store : store
       *  });
       * </code></pre>
       * @cfg {Boolean} [forceFit= false]
       */
      /**
       * 强迫列自适应宽度，如果列宽度大于Grid整体宽度，等比例缩减，否则等比例增加
       * <pre><code>
       *  grid.set('forceFit',true);
       * </code></pre>
       * @type {Boolean}
       * @default 'false'
       */
      forceFit: {
        sync: false,
        view: true,
        value: false
      },
      /**
       * 数据为空时，显示的提示内容
       * <pre><code>
       *  var grid = new Grid({
       *   render:'#J_Grid4',
       *   columns : columns,
       *   store : store,
       *   emptyDataTpl : '&lt;div class="centered"&gt;&lt;img alt="Crying" src="http://img03.taobaocdn.com/tps/i3/T1amCdXhXqXXXXXXXX-60-67.png"&gt;&lt;h2&gt;查询的数据不存在&lt;/h2&gt;&lt;/div&gt;',
       *   width:'100%'
       *
       * });
       *
       * grid.render();
       * </code></pre>
       ** @cfg {Object} emptyDataTpl
       */
      emptyDataTpl: {
        view: true
      },
      /**
       * 表格首行记录模板，首行记录，隐藏显示，用于确定表格各列的宽度
       * @type {String}
       * @protected
       */
      headerRowTpl: {
        view: true,
        value: '<tr class="' + PREFIX + 'grid-header-row">{cellsTpl}</tr>'
      },
      /**
       * 表格首行记录的单元格模板
       * @protected
       * @type {String}
       */
      headerCellTpl: {
        view: true,
        value: '<td class="{hideCls} ' + CLS_TD_PREFIX + '{id}" width="{width}" style="height:0"></td>'
      },
      /**
       * 表格数据行的模板
       * @type {String}
       * @default  <pre>'&lt;tr class="' + CLS_GRID_ROW + ' {{oddCls}}"&gt;{{cellsTpl}}&lt;/tr&gt;'</pre>
       */
      rowTpl: {
        view: true,
        value: '<tr class="' + CLS_GRID_ROW + ' {oddCls}">{cellsTpl}</tr>'
      },
      /**
       * 单元格的模板
       * @type {String}
       * <pre>
       *     '&lt;td  class="' + CLS_GRID_CELL + ' grid-td-{{id}}" data-column-id="{{id}}" data-column-field = {{dataIndex}}&gt;'+
       *        '&lt;div class="' + CLS_GRID_CELL_INNER + '" &gt;{{cellText}}&lt;/div&gt;'+
       *    '&lt;/td&gt;'
       *</pre>
       */
      cellTpl: {
        view: true,
        value: '<td  class="{elCls} {hideCls} ' + CLS_GRID_CELL + ' ' + CLS_TD_PREFIX + '{id}" data-column-id="{id}" data-column-field = "{dataIndex}" >' + '<div class="' + CLS_GRID_CELL_INNER + '" >{cellText}</div>' + '</td>'
      },
      /**
       * 单元格文本的模板
       * @default &lt;span class="' + CLS_CELL_TEXT + ' " title = "{{tips}}"&gt;{{text}}&lt;/span&gt;
       * @type {String}
       */
      cellTextTpl: {
        view: true,
        value: '<span class="' + CLS_CELL_TEXT + ' " title = "{tips}">{text}</span>'
      },
      /**
       * 事件集合
       * @type {Object}
       */
      events: {
        value: {
          /**
           * 显示完数据触发
           * @event
           */
          'aftershow': false,
          /**
           * 表格的数据清理完成后
           * @event
           */
          'clear': false,
          /**
           * 点击单元格时触发,如果return false,则会阻止 'rowclick' ,'rowselected','rowunselected'事件
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {String} e.field 点击单元格列对应的字段名称
           * @param {HTMLElement} e.row 点击行对应的DOM
           * @param {HTMLElement} e.cell 点击对应的单元格的DOM
           * @param {HTMLElement} e.domTarget 点击的DOM
           * @param {jQuery.Event} e.domEvent 点击的jQuery事件
           */
          'cellclick': false,
          /**
           * 点击表头
           * @event
           * @param {jQuery.Event} e 事件对象
           * @param {BUI.Grid.Column} e.column 列对象
           * @param {HTMLElement} e.domTarget 点击的DOM
           */
          'columnclick': false,
          /**
           * 点击行时触发，如果return false,则会阻止'rowselected','rowunselected'事件
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 点击行对应的DOM
           * @param {HTMLElement} e.domTarget 点击的DOM
           */
          'rowclick': false,
          /**
           * 当一行数据显示在表格中后触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 行对应的DOM
           * @param {HTMLElement} e.domTarget 此事件中等于行对应的DOM
           */
          'rowcreated': false,
          /**
           * 移除一行的DOM后触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 行对应的DOM
           * @param {HTMLElement} e.domTarget 此事件中等于行对应的DOM
           */
          'rowremoved': false,
          /**
           * 选中一行时触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 行对应的DOM
           * @param {HTMLElement} e.domTarget 此事件中等于行对应的DOM
           */
          'rowselected': false,
          /**
           * 清除选中一行时触发，只有多选情况下触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Object} e.record 此行的记录
           * @param {HTMLElement} e.row 行对应的DOM
           * @param {HTMLElement} e.domTarget 此事件中等于行对应的DOM
           */
          'rowunselected': false,
          /**
           * 表格内部发生滚动时触发
           * @event
           * @param {jQuery.Event} e  事件对象
           * @param {Number} e.scrollLeft 滚动到的横坐标
           * @param {Number} e.scrollTop 滚动到的纵坐标
           * @param {Number} e.bodyWidth 表格内部的宽度
           * @param {Number} e.bodyHeight 表格内部的高度
           */
          'scroll': false
        }
      },
      /**
       * 是否奇偶行添加分割色
       * @type {Boolean}
       * @default true
       */
      stripeRows: {
        view: true,
        value: true
      },
      /**
       * 顶层的工具栏，跟bbar结构一致,可以是工具栏对象@see {BUI.Toolbar.Bar},也可以是xclass形式的配置项，
       * 还可以是包含以下字段的配置项
       * <ol>
       * <li>items:工具栏的项，
       *    - 默认是按钮(xtype : button)、
       *    - 文本(xtype : text)、
       *    - 链接(xtype : link)、
       *    - 分隔符(bar-item-separator)以及自定义项
       * </li>
       * <li>pagingBar:表明包含分页栏</li>
       * </ol>
       * @type {Object|BUI.Toolbar.Bar}
       * @example
       * tbar:{
       *     items:[
       *         {
       *             text:'命令一' //默认是按钮
       *
       *         },
       *         {
       *             xtype:'text',
       *             text:'文本'
       *         }
       *     ],
       *     pagingBar:true
       * }
       */
      tbar: {},
      /**
       * 可以附加到表格上的样式.
       * @cfg {String} tableCls
       * @default 'bui-grid-table' this css cannot be overridden
       */
      tableCls: {
        view: true,
        sync: false,
        value: PREFIX + 'grid-table'
      },
      /**
       * 表体的模板
       * @protected
       * @type {String}
       */
      tableTpl: {
        view: true,
        value: '<table cellspacing="0" cellpadding="0" >' + '<tbody></tbody>' + '</table>'
      },
      tpl: {
        value: '<div class="' + CLS_GRID_TBAR + '" style="display:none"></div><div class="' + CLS_GRID_HEADER_CONTAINER + '"></div><div class="' + CLS_GRID_BODY + '"></div><div style="display:none" class="' + CLS_GRID_BBAR + '"></div>'
      },
      /**
       * 单元格左右之间是否出现边框
       *
       * @cfg {Boolean} [innerBorder=true]
       */
      /**
       * 单元格左右之间是否出现边框
       * <pre><code>
       *   var  grid = new Grid.Grid({
       *     render:'#grid',
       *     innerBorder: false, // 默认为true
       *     columns : columns,
       *     store : store
       *   });
       * </code></pre>
       * @type {Boolean}
       * @default true
       */
      innerBorder: {
        sync: false,
        value: true
      },
      /**
       * 是否使用空白单元格用于占位，使列宽等于设置的宽度
       * @type {Boolean}
       * @private
       */
      useEmptyCell: {
        view: true,
        value: true
      },
      /**
       * 是否首行使用空白行，用以确定表格列的宽度
       * @type {Boolean}
       * @private
       */
      useHeaderRow: {
        view: true,
        value: true
      },
      /**
       * Grid 的视图类型
       * @type {BUI.Grid.GridView}
       */
      xview: {
        value: gridView
      }
    }
  }, {
    xclass: 'grid'
  });
  grid.View = gridView;
  module.exports = grid;
  /**
   * @ignore
   * 2013.1.18
   *   这是一个重构的版本，将Body取消掉了，目的是为了可以将Grid和SimpleGrid联系起来，
   *   同时将selection 统一
   */
});
define("bui/grid/header", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 表格的头部
   * @author dxq613@gmail.com, yiminghe@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    Grid = BUI.namespace('Grid'),
    Column = require("bui/grid/column"),
    View = BUI.Component.View,
    Controller = BUI.Component.Controller,
    CLS_SCROLL_WITH = 17,
    UA = BUI.UA;
  /**
   * 表格控件中表头的视图类
   * @class BUI.Grid.HeaderView
   * @extends BUI.Component.View
   * @private
   */
  var headerView = View.extend({
    /**
     * @see {Component.Render#getContentElement}
     * @ignore
     */
    getContentElement: function() {
      return this.get('el').find('tr');
    },
    scrollTo: function(obj) {
      var _self = this,
        el = _self.get('el');
      if (obj.top !== undefined) {
        el.scrollTop(obj.top);
      }
      if (obj.left !== undefined) {
        el.scrollLeft(obj.left);
      }
    },
    _uiSetTableCls: function(v) {
      var _self = this,
        tableEl = _self.get('el').find('table');
      tableEl.attr('class', v);
    }
  }, {
    ATTRS: {
      emptyCellEl: {},
      tableCls: {}
    }
  }, {
    xclass: 'header-view'
  });
  /**
   * Container which holds headers and is docked at the top or bottom of a Grid.
   * The HeaderContainer drives resizing/moving/hiding of columns within the GridView.
   * As headers are hidden, moved or resized,
   * the header container is responsible for triggering changes within the view.
   * If you are not in the writing plugins, don't direct manipulation this control.
   * @class BUI.Grid.Header
   * @protected
   * xclass:'grid-header'
   * @extends BUI.Component.Controller
   */
  var header = Controller.extend({
    /**
     * add a columns to header
     * @param {Object|BUI.Grid.Column} c The column object or column config.
     * @index {Number} index The position of the column in a header,0 based.
     */
    addColumn: function(c, index) {
      var _self = this,
        insertIndex = index,
        columns = _self.get('columns');
      c = _self._createColumn(c);
      if (index === undefined) {
        index = columns.length;
        insertIndex = _self.get('children').length - 1;
      }
      columns.splice(index, 0, c);
      _self.addChild(c, insertIndex);
      _self.fire('add', {
        column: c,
        index: index
      });
      return c;
    },
    /**
     * remove a columns from header
     * @param {BUI.Grid.Column|Number} c is The column object or The position of the column in a header,0 based.
     */
    removeColumn: function(c) {
      var _self = this,
        columns = _self.get('columns'),
        index;
      c = BUI.isNumber(c) ? columns[c] : c;
      index = BUI.Array.indexOf(c, columns);
      columns.splice(index, 1);
      _self.fire('remove', {
        column: c,
        index: index
      });
      return _self.removeChild(c, true);
    },
    /**
     * For overridden.
     * @see Component.Controller#bindUI
     */
    bindUI: function() {
      var _self = this;
      _self._bindColumnsEvent();
    },
    /*
     * For overridden.
     * @protected
     *
     */
    initializer: function() {
      var _self = this,
        children = _self.get('children'),
        columns = _self.get('columns'),
        emptyColumn;
      $.each(columns, function(index, item) {
        var columnControl = _self._createColumn(item);
        children[index] = columnControl;
        columns[index] = columnControl;
      });
      //if(!_self.get('forceFit')){
      emptyColumn = _self._createEmptyColumn();
      children.push(emptyColumn);
      _self.set('emptyColumn', emptyColumn);
      //}
    },
    /**
     * get the columns of this header,the result equals the 'children' property .
     * @return {Array} columns
     * @example var columns = header.getColumns();
     *    <br>or<br>
     * var columns = header.get('children');
     */
    getColumns: function() {
      return this.get('columns');
    },
    /**
     * Obtain the sum of the width of all columns
     * @return {Number}
     */
    getColumnsWidth: function() {
      var _self = this,
        columns = _self.getColumns(),
        totalWidth = 0;
      $.each(columns, function(index, column) {
        if (column.get('visible')) {
          totalWidth += column.get('el').outerWidth(); //column.get('width')
        }
      });
      return totalWidth;
    },
    getColumnOriginWidth: function() {
      var _self = this,
        columns = _self.getColumns(),
        totalWidth = 0;
      $.each(columns, function(index, column) {
        if (column.get('visible')) {
          var width = column.get('originWidth') || column.get('width');
          totalWidth += width;
        }
      });
      return totalWidth;
    },
    /**
     * get {@link BUI.Grid.Column} instance by index,when column moved ,the index changed.
     * @param {Number} index The index of columns
     * @return {BUI.Grid.Column} the column in the header,if the index outof the range,the result is null
     */
    getColumnByIndex: function(index) {
      var _self = this,
        columns = _self.getColumns(),
        result = columns[index];
      return result;
    },
    /**
     * 查找列
     * @param  {Function} func 匹配函数，function(column){}
     * @return {BUI.Grid.Column}  查找到的列
     */
    getColumn: function(func) {
      var _self = this,
        columns = _self.getColumns(),
        result = null;
      $.each(columns, function(index, column) {
        if (func(column)) {
          result = column;
          return false;
        }
      });
      return result;
    },
    /**
     * get {@link BUI.Grid.Column} instance by id,when column rendered ,this id can't to be changed
     * @param {String|Number}id The id of columns
     * @return {BUI.Grid.Column} the column in the header,if the index out of the range,the result is null
     */
    getColumnById: function(id) {
      var _self = this;
      return _self.getColumn(function(column) {
        return column.get('id') === id;
      });
    },
    /**
     * get {@link BUI.Grid.Column} instance's index,when column moved ,the index changed.
     * @param {BUI.Grid.Column} column The instance of column
     * @return {Number} the index of column in the header,if the column not in the header,the index is -1
     */
    getColumnIndex: function(column) {
      var _self = this,
        columns = _self.getColumns();
      return BUI.Array.indexOf(column, columns);
    },
    /**
     * move the header followed by body's or document's scrolling
     * @param {Object} obj the scroll object which has two value:top(scrollTop),left(scrollLeft)
     */
    scrollTo: function(obj) {
      this.get('view').scrollTo(obj);
    },
    //when column's event fire ,this header must handle them.
    _bindColumnsEvent: function() {
      var _self = this;
      _self.on('afterWidthChange', function(e) {
        var sender = e.target;
        if (sender !== _self) {
          _self.setTableWidth();
        }
      });
      _self.on('afterVisibleChange', function(e) {
        var sender = e.target;
        if (sender !== _self) {
          _self.setTableWidth();
        }
      });
      _self.on('afterSortStateChange', function(e) {
        var sender = e.target,
          columns = _self.getColumns(),
          val = e.newVal;
        if (val) {
          $.each(columns, function(index, column) {
            if (column !== sender) {
              column.set('sortState', '');
            }
          });
        }
      });
      _self.on('add', function() {
        _self.setTableWidth();
      });
      _self.on('remove', function() {
        _self.setTableWidth();
      });
    },
    //create the column control
    _createColumn: function(cfg) {
      if (cfg instanceof Column) {
        return cfg;
      }
      if (!cfg.id) {
        cfg.id = BUI.guid('col');
      }
      return new Column(cfg);
    },
    _createEmptyColumn: function() {
      return new Column.Empty();
    },
    //when set grid's height, scroll bar emerged.
    _isAllowScrollLeft: function() {
      var _self = this,
        parent = _self.get('parent');
      return parent && !!parent.get('height');
    },
    /**
     * force every column fit the table's width
     */
    forceFitColumns: function() {
      var _self = this,
        columns = _self.getColumns(),
        width = _self.get('width'),
        totalWidth = width,
        totalColumnsWidth = _self.getColumnOriginWidth(),
        realWidth = 0,
        appendWidth = 0,
        lastShowColumn = null,
        allowScroll = _self._isAllowScrollLeft();
      /**
       * @private
       */
      function setColoumnWidthSilent(column, colWidth) {
          var columnEl = column.get('el');
          column.set('width', colWidth, {
            silent: 1
          });
          columnEl.width(colWidth);
        }
        //if there is not a width config of grid ,The forceFit action can't work
      if (width) {
        if (allowScroll) {
          width -= CLS_SCROLL_WITH;
          totalWidth = width;
        }
        var adjustCount = 0;
        $.each(columns, function(index, column) {
          if (column.get('visible') && column.get('resizable')) {
            adjustCount++;
          }
          if (column.get('visible') && !column.get('resizable')) {
            var colWidth = column.get('el').outerWidth();
            totalWidth -= colWidth;
            totalColumnsWidth -= colWidth;
          }
        });
        var colWidth = Math.floor(totalWidth / adjustCount),
          ratio = totalWidth / totalColumnsWidth;
        if (ratio === 1) {
          return;
        }
        $.each(columns, function(index, column) {
          if (column.get('visible') && column.get('resizable')) {
            var borderWidth = _self._getColumnBorderWith(column, index),
              originWidth = column.get('originWidth');
            if (!originWidth) {
              column.set('originWidth', column.get('width'));
              originWidth = column.get('width');
            }
            colWidth = Math.floor((originWidth + borderWidth) * ratio);
            /* parseInt(columnEl.css('border-left-width')) || 0 +
                 parseInt(columnEl.css('border-right-width')) || 0;*/
            // ！ note
            //
            // 会再调用 setTableWidth， 循环调用 || 
            setColoumnWidthSilent(column, colWidth - borderWidth);
            realWidth += colWidth;
            lastShowColumn = column;
          }
        });
        if (lastShowColumn) {
          appendWidth = totalWidth - realWidth;
          setColoumnWidthSilent(lastShowColumn, lastShowColumn.get('width') + appendWidth);
        }
        _self.fire('forceFitWidth');
      }
    },
    _getColumnBorderWith: function(column, index) {
      //chrome 下border-left-width取的值不小数，所以暂时使用固定边框
      //第一个边框无宽度，ie 下仍然存在Bug，所以做ie 的兼容
      var columnEl = column.get('el'),
        borderWidth = Math.round(parseFloat(columnEl.css('border-left-width')) || 0) + Math.round(parseFloat(columnEl.css('border-right-width')) || 0);
      borderWidth = UA.ie && UA.ie < 8 ? (index === 0 ? 1 : borderWidth) : borderWidth;
      return borderWidth;
    },
    /**
     * set the header's inner table's width
     */
    setTableWidth: function() {
      var _self = this,
        width = _self.get('width'),
        totalWidth = 0,
        emptyColumn = null;
      if (width == 'auto') {
        //_self.get('el').find('table').width()
        return;
      }
      if (_self.get('forceFit')) {
        _self.forceFitColumns();
      } else if (_self._isAllowScrollLeft()) {
        totalWidth = _self.getColumnsWidth();
        emptyColumn = _self.get('emptyColumn');
        if (width < totalWidth) {
          emptyColumn.get('el').width(CLS_SCROLL_WITH);
        } else {
          emptyColumn.get('el').width('auto');
        }
      }
    },
    //when header's width changed, it also effects its columns.
    _uiSetWidth: function() {
      var _self = this;
      _self.setTableWidth();
    },
    _uiSetForceFit: function(v) {
      var _self = this;
      if (v) {
        _self.setTableWidth();
      }
    }
  }, {
    ATTRS: {
      /**
       * 列集合
       * @type {Array}
       */
      columns: {
        value: []
      },
      /**
       * @private
       */
      emptyColumn: {},
      /**
       * 是否可以获取焦点
       * @protected
       */
      focusable: {
        value: false
      },
      /**
       * true to force the columns to fit into the available width. Headers are first sized according to configuration, whether that be a specific width, or flex.
       * Then they are all proportionally changed in width so that the entire content width is used.
       * @type {Boolean}
       * @default 'false'
       */
      forceFit: {
        sync: false,
        view: true,
        value: false
      },
      /**
       * 表头的模版
       * @type {String}
       */
      tpl: {
        view: true,
        value: '<table cellspacing="0" class="' + PREFIX + 'grid-table" cellpadding="0">' + '<thead><tr></tr></thead>' + '</table>'
      },
      /**
       * 表格应用的样式.
       */
      tableCls: {
        view: true
      },
      /**
       * @private
       */
      xview: {
        value: headerView
      },
      /**
       * the collection of header's events
       * @type {Array}
       * @protected
       */
      events: {
        value: {
          /**
           * @event
           * 添加列时触发
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} e.column which column added
           * @param {Number} index the add column's index in this header
           *
           */
          'add': false,
          /**
           * @event
           * 移除列时触发
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} e.column which column removed
           * @param {Number} index the removed column's index in this header
           */
          'remove': false
        }
      }
    }
  }, {
    xclass: 'grid-header',
    priority: 1
  });
  module.exports = header;
});
define("bui/grid/column", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview This class specifies the definition for a column of a grid.
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    CLS_HD_TITLE = PREFIX + 'grid-hd-title',
    CLS_OPEN = PREFIX + 'grid-hd-open',
    SORT_PREFIX = 'sort-',
    SORT_ASC = 'ASC',
    SORT_DESC = 'DESC',
    CLS_TRIGGER = PREFIX + 'grid-hd-menu-trigger',
    CLS_HD_TRIGGER = 'grid-hd-menu-trigger';
  /**
   * 表格列的视图类
   * @class BUI.Grid.ColumnView
   * @extends BUI.Component.View
   * @private
   */
  var columnView = BUI.Component.View.extend({
    /**
     * @protected
     * @ignore
     */
    setTplContent: function(attrs) {
      var _self = this,
        sortTpl = _self.get('sortTpl'),
        triggerTpl = _self.get('triggerTpl'),
        el = _self.get('el'),
        titleEl;
      columnView.superclass.setTplContent.call(_self, attrs);
      titleEl = el.find('.' + CLS_HD_TITLE);
      $(sortTpl).insertAfter(titleEl);
      $(triggerTpl).insertAfter(titleEl);
    },
    //use template to fill the column
    _setContent: function() {
      this.setTplContent();
    },
    _uiSetShowMenu: function(v) {
      var _self = this,
        triggerTpl = _self.get('triggerTpl'),
        el = _self.get('el'),
        titleEl = el.find('.' + CLS_HD_TITLE);
      if (v) {
        $(triggerTpl).insertAfter(titleEl);
      } else {
        el.find('.' + CLS_TRIGGER).remove();
      }
    },
    //set the title of column
    _uiSetTitle: function(title) {
      if (!this.get('rendered')) {
        return;
      }
      this._setContent();
    },
    //set the draggable of column
    _uiSetDraggable: function(v) {
      if (!this.get('rendered')) {
        return;
      }
      this._setContent();
    },
    //set the sortableof column
    _uiSetSortable: function(v) {
      if (!this.get('rendered')) {
        return;
      }
      this._setContent();
    },
    //set the template of column
    _uiSetTpl: function(v) {
      if (!this.get('rendered')) {
        return;
      }
      this._setContent();
    },
    //set the sort state of column
    _uiSetSortState: function(v) {
      var _self = this,
        el = _self.get('el'),
        method = v ? 'addClass' : 'removeClass',
        ascCls = SORT_PREFIX + 'asc',
        desCls = SORT_PREFIX + 'desc';
      el.removeClass(ascCls + ' ' + desCls);
      if (v === 'ASC') {
        el.addClass(ascCls);
      } else if (v === 'DESC') {
        el.addClass(desCls);
      }
    },
    //展开表头
    _uiSetOpen: function(v) {
      var _self = this,
        el = _self.get('el');
      if (v) {
        el.addClass(CLS_OPEN);
      } else {
        el.removeClass(CLS_OPEN);
      }
    }
  }, {
    ATTRS: {
      /**
       * @private
       */
      sortTpl: {
        view: true,
        getter: function() {
          var _self = this,
            sortable = _self.get('sortable');
          if (sortable) {
            return '<span class="' + PREFIX + 'grid-sort-icon">&nbsp;</span>';
          }
          return '';
        }
      },
      tpl: {}
    }
  });
  /**
   * 表格的列对象，存储列信息，此对象不会由用户创建，而是配置在Grid中
   * xclass:'grid-column'
   * <pre><code>
   * columns = [{
   *        title : '表头1',
   *        dataIndex :'a',
   *        width:100
   *      },{
   *        title : '表头2',
   *        dataIndex :'b',
   *        visible : false, //隐藏
   *        width:200
   *      },{
   *        title : '表头3',
   *        dataIndex : 'c',
   *        width:200
   *    }];
   * </code></pre>
   * @class BUI.Grid.Column
   * @extends BUI.Component.Controller
   */
  var column = BUI.Component.Controller.extend({ //toggle sort state of this column ,if no sort state set 'ASC',else toggle 'ASC' and 'DESC'
    _toggleSortState: function() {
      var _self = this,
        sortState = _self.get('sortState'),
        v = sortState ? (sortState === SORT_ASC ? SORT_DESC : SORT_ASC) : SORT_ASC;
      _self.set('sortState', v);
    },
    /**
     * {BUI.Component.Controller#performActionInternal}
     * @ignore
     */
    performActionInternal: function(ev) {
      var _self = this,
        sender = $(ev.target),
        prefix = _self.get('prefixCls');
      if (sender.hasClass(prefix + CLS_HD_TRIGGER)) {} else {
        if (_self.get('sortable')) {
          _self._toggleSortState();
        }
      }
      //_self.fire('click',{domTarget:ev.target});
    },
    _uiSetWidth: function(v) {
      if (v) {
        this.set('originWidth', v);
      }
    }
  }, {
    ATTRS: {
      /**
       * The tag name of the rendered column
       * @private
       */
      elTagName: {
        value: 'th'
      },
      /**
       * 表头展开显示菜单，
       * @type {Boolean}
       * @protected
       */
      open: {
        view: true,
        value: false
      },
      /**
       * 此列对应显示数据的字段名称
       * <pre><code>
       * {
       *     title : '表头1',
       *     dataIndex :'a', //对应的数据的字段名称，如 ： {a:'123',b:'456'}
       *     width:100
       * }
       * </code></pre>
       * @cfg {String} dataIndex
       */
      /**
       * 此列对应显示数据的字段名称
       * @type {String}
       * @default {String} empty string
       */
      dataIndex: {
        view: true,
        value: ''
      },
      /**
       * 是否可拖拽，暂时未支持
       * @private
       * @type {Boolean}
       * @defalut true
       */
      draggable: {
        sync: false,
        view: true,
        value: true
      },
      /**
       * 编辑器,用于可编辑表格中<br>
       * ** 常用编辑器 **
       *  - xtype 指的是表单字段的类型 {@link BUI.Form.Field}
       *  - 其他的配置项对应于表单字段的配置项
       * <pre><code>
       * columns = [
       *   {title : '文本',dataIndex :'a',editor : {xtype : 'text'}},
       *   {title : '数字', dataIndex :'b',editor : {xtype : 'number',rules : {required : true}}},
       *   {title : '日期',dataIndex :'c', editor : {xtype : 'date'},renderer : Grid.Format.dateRenderer},
       *   {title : '单选',dataIndex : 'd', editor : {xtype :'select',items : enumObj},renderer : Grid.Format.enumRenderer(enumObj)},
       *   {title : '多选',dataIndex : 'e', editor : {xtype :'select',select:{multipleSelect : true},items : enumObj},
       *       renderer : Grid.Format.multipleItemsRenderer(enumObj)
       *   }
       * ]
       * </code></pre>
       * @type {Object}
       */
      editor: {},
      /**
       * 是否可以获取焦点
       * @protected
       */
      focusable: {
        value: false
      },
      /**
       * 固定列,主要用于在首行显示一些特殊内容，如单选框，复选框，序号等。插件不能对此列进行特殊操作，如：移动位置，隐藏等
       * @cfg {Boolean} fixed
       */
      fixed: {
        value: false
      },
      /**
       * 控件的编号
       * @cfg {String} id
       */
      id: {},
      /**
       * 渲染表格单元格的格式化函数
       * "function(value,obj,index){return value;}"
       * <pre><code>
       * {title : '操作',renderer : function(){
       *     return '<span class="grid-command btn-edit">编辑</span>'
       *   }}
       * </code></pre>
       * @cfg {Function} renderer
       */
      renderer: {},
      /**
       * 是否可以调整宽度，应用于拖拽或者自适应宽度时
       * @type {Boolean}
       * @protected
       * @default true
       */
      resizable: {
        value: true
      },
      /**
       * 是否可以按照此列排序，如果设置true,那么点击列头时
       * <pre><code>
       *     {title : '数字', dataIndex :'b',sortable : false},
       * </code></pre>
       * @cfg {Boolean} [sortable=true]
       */
      sortable: {
        sync: false,
        view: true,
        value: true
      },
      /**
       * 排序状态，当前排序是按照升序、降序。有3种值 null, 'ASC','DESC'
       * @type {String}
       * @protected
       * @default null
       */
      sortState: {
        view: true,
        value: null
      },
      /**
       * 列标题
       * @cfg {String} [title=&#160;]
       */
      /**
       * 列标题
       * <pre><code>
       * var column = grid.findColumn('id');
       * column.get('title');
       * </code></pre>
       * Note: to have a clickable header with no text displayed you can use the default of &#160; aka &nbsp;.
       * @type {String}
       * @default {String} &#160;
       */
      title: {
        sync: false,
        view: true,
        value: '&#160;'
      },
      /**
       * 列的宽度,可以使数字或者百分比,不要使用 width : '100'或者width : '100px'
       * <pre><code>
       *  {title : '文本',width:100,dataIndex :'a',editor : {xtype : 'text'}}
       *
       *  {title : '文本',width:'10%',dataIndex :'a',editor : {xtype : 'text'}}
       * </code></pre>
       * @cfg {Number} [width = 80]
       */
      /**
       * 列宽度
       * <pre><code>
       *  grid.findColumn(id).set('width',200);
       * </code></pre>
       *
       * @type {Number}
       */
      width: {
        value: 100
      },
      /**
       * 是否显示菜单
       * @cfg {Boolean} [showMenu=false]
       */
      /**
       * 是否显示菜单
       * @type {Boolean}
       * @default false
       */
      showMenu: {
        view: true,
        value: false
      },
      /**
       * @private
       * @type {Object}
       */
      triggerTpl: {
        view: true,
        value: '<span class="' + CLS_TRIGGER + '"></span>'
      },
      /**
       * An template used to create the internal structure inside this Component's encapsulating Element.
       * User can use the syntax of KISSY 's template component.
       * Only in the configuration of the column can set this property.
       * @type {String}
       */
      tpl: {
        sync: false,
        view: true,
        value: '<div class="' + PREFIX + 'grid-hd-inner">' + '<span class="' + CLS_HD_TITLE + '">{title}</span>' + '</div>'
      },
      /**
       * 单元格的模板，在列上设置单元格的模板，可以在渲染单元格时使用，更改单元格的内容
       * @cfg {String} cellTpl
       */
      /**
       * 单元格的模板，在列上设置单元格的模板，可以在渲染单元格时使用，更改单元格的内容
       * @type {String}
       */
      cellTpl: {
        value: ''
      },
      /**
       * the collection of column's events
       * @protected
       * @type {Array}
       */
      events: {
        value: {
          /**
           * @event
           * Fires when this column's width changed
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} target
           */
          'afterWidthChange': true,
          /**
           * @event
           * Fires when this column's sort changed
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} e.target
           */
          'afterSortStateChange': true,
          /**
           * @event
           * Fires when this column's hide or show
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} e.target
           */
          'afterVisibleChange': true,
          /**
           * @event
           * Fires when use clicks the column
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} e.target
           * @param {HTMLElement} domTarget the dom target of this event
           */
          'click': true,
          /**
           * @event
           * Fires after the component is resized.
           * @param {BUI.Grid.Column} target
           * @param {Number} adjWidth The box-adjusted width that was set
           * @param {Number} adjHeight The box-adjusted height that was set
           */
          'resize': true,
          /**
           * @event
           * Fires after the component is moved.
           * @param {jQuery.Event} e the event object
           * @param {BUI.Grid.Column} e.target
           * @param {Number} x The new x position
           * @param {Number} y The new y position
           */
          'move': true
        }
      },
      /**
       * @private
       */
      xview: {
        value: columnView
      }
    }
  }, {
    xclass: 'grid-hd',
    priority: 1
  });
  column.Empty = column.extend({}, {
    ATTRS: {
      type: {
        value: 'empty'
      },
      sortable: {
        view: true,
        value: false
      },
      width: {
        view: true,
        value: null
      },
      tpl: {
        view: true,
        value: '<div class="' + PREFIX + 'grid-hd-inner"></div>'
      }
    }
  }, {
    xclass: 'grid-hd-empty',
    priority: 1
  });
  module.exports = column;
});
define("bui/grid/format", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview this class details some util tools of grid,like loadMask, formatter for grid's cell render
   * @author dxq613@gmail.com, yiminghe@gmail.com
   * @ignore
   */
  var $ = require('jquery');

  function formatTimeUnit(v) {
      if (v < 10) {
        return '0' + v;
      }
      return v;
    }
    /**
     * This class specifies some formatter for grid's cell renderer
     * @class BUI.Grid.Format
     * @singleton
     */
  var Format = {
    /**
     * 日期格式化函数
     * @param {Number|Date} d 格式话的日期，一般为1970 年 1 月 1 日至今的毫秒数
     * @return {String} 格式化后的日期格式为 2011-10-31
     * @example
     * 一般用法：<br>
     * BUI.Grid.Format.dateRenderer(1320049890544);输出：2011-10-31 <br>
     * 表格中用于渲染列：<br>
     * {title:"出库日期",dataIndex:"date",renderer:BUI.Grid.Format.dateRenderer}
     */
    dateRenderer: function(d) {
      if (!d) {
        return '';
      }
      if (BUI.isString(d)) {
        return d;
      }
      var date = null;
      try {
        date = new Date(d);
      } catch (e) {
        return '';
      }
      if (!date || !date.getFullYear) {
        return '';
      }
      return date.getFullYear() + '-' + formatTimeUnit(date.getMonth() + 1) + '-' + formatTimeUnit(date.getDate());
    },
    /**
     * @description 日期时间格式化函数
     * @param {Number|Date} d 格式话的日期，一般为1970 年 1 月 1 日至今的毫秒数
     * @return {String} 格式化后的日期格式时间为 2011-10-31 16 : 41 : 02
     */
    datetimeRenderer: function(d) {
      if (!d) {
        return '';
      }
      if (BUI.isString(d)) {
        return d;
      }
      var date = null;
      try {
        date = new Date(d);
      } catch (e) {
        return '';
      }
      if (!date || !date.getFullYear) {
        return '';
      }
      return date.getFullYear() + '-' + formatTimeUnit(date.getMonth() + 1) + '-' + formatTimeUnit(date.getDate()) + ' ' + formatTimeUnit(date.getHours()) + ':' + formatTimeUnit(date.getMinutes()) + ':' + formatTimeUnit(date.getSeconds());
    },
    /**
     * 文本截取函数，当文本超出一定数字时，会截取文本，添加...
     * @param {Number} length 截取多少字符
     * @return {Function} 返回处理函数 返回截取后的字符串，如果本身小于指定的数字，返回原字符串。如果大于，则返回截断后的字符串，并附加...
     */
    cutTextRenderer: function(length) {
      return function(value) {
        value = value || '';
        if (value.toString().length > length) {
          return value.toString().substring(0, length) + '...';
        }
        return value;
      };
    },
    /**
     * 枚举格式化函数
     * @param {Object} enumObj 键值对的枚举对象 {"1":"大","2":"小"}
     * @return {Function} 返回指定枚举的格式化函数
     * @example
     * //Grid 的列定义
     *  {title:"状态",dataIndex:"status",renderer:BUI.Grid.Format.enumRenderer({"1":"入库","2":"出库"})}
     */
    enumRenderer: function(enumObj) {
      return function(value) {
        return enumObj[value] || '';
      };
    },
    /**
     * 将多个值转换成一个字符串
     * @param {Object} enumObj 键值对的枚举对象 {"1":"大","2":"小"}
     * @return {Function} 返回指定枚举的格式化函数
     * @example
     * <code>
     *  //Grid 的列定义
     *  {title:"状态",dataIndex:"status",renderer:BUI.Grid.Format.multipleItemsRenderer({"1":"入库","2":"出库","3":"退货"})}
     *  //数据源是[1,2] 时，则返回 "入库,出库"
     * </code>
     */
    multipleItemsRenderer: function(enumObj) {
      var enumFun = Format.enumRenderer(enumObj);
      return function(values) {
        var result = [];
        if (!values) {
          return '';
        }
        if (!BUI.isArray(values)) {
          values = values.toString().split(',');
        }
        $.each(values, function(index, value) {
          result.push(enumFun(value));
        });
        return result.join(',');
      };
    },
    /**
     * 将财务数据分转换成元
     * @param {Number|String} enumObj 键值对的枚举对象 {"1":"大","2":"小"}
     * @return {Number} 返回将分转换成元的数字
     */
    moneyCentRenderer: function(v) {
      if (BUI.isString(v)) {
        v = parseFloat(v);
      }
      if ($.isNumberic(v)) {
        return (v * 0.01).toFixed(2);
      }
      return v;
    }
  };
  module.exports = Format;
});
define("bui/grid/plugins/base", ["bui/common", "jquery", "bui/menu"], function(require, exports, module) {
  /**
   * @fileOverview 表格插件的入口
   * @author dxq613@gmail.com, yiminghe@gmail.com
   * @ignore
   */
  var BUI = require("bui/common"),
    Selection = require("bui/grid/plugins/selection"),
    Plugins = {};
  BUI.mix(Plugins, {
    CheckSelection: Selection.CheckSelection,
    RadioSelection: Selection.RadioSelection,
    Cascade: require("bui/grid/plugins/cascade"),
    CellEditing: require("bui/grid/plugins/cellediting"),
    RowEditing: require("bui/grid/plugins/rowediting"),
    DialogEditing: require("bui/grid/plugins/dialog"),
    AutoFit: require("bui/grid/plugins/autofit"),
    GridMenu: require("bui/grid/plugins/gridmenu"),
    Summary: require("bui/grid/plugins/summary"),
    RowNumber: require("bui/grid/plugins/rownumber"),
    ColumnGroup: require("bui/grid/plugins/columngroup"),
    RowGroup: require("bui/grid/plugins/rowgroup"),
    ColumnResize: require("bui/grid/plugins/columnresize"),
    ColumnChecked: require("bui/grid/plugins/columnchecked")
  });
  module.exports = Plugins;
});
define("bui/grid/plugins/selection", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 选择的插件
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    CLS_CHECKBOX = PREFIX + 'grid-checkBox',
    CLS_CHECK_ICON = 'x-grid-checkbox',
    CLS_RADIO = PREFIX + 'grid-radio';
  /**
   * 选择行插件
   * <pre><code>
   ** var store = new Store({
   *       data : data,
   *       autoLoad:true
   *     }),
   *     grid = new Grid.Grid({
   *       render:'#grid',
   *       columns : columns,
   *       itemStatusFields : { //设置数据跟状态的对应关系
   *         selected : 'selected',
   *         disabled : 'disabled'
   *       },
   *       store : store,
   *       plugins : [Grid.Plugins.CheckSelection] // 插件形式引入多选表格
   *      //multiSelect: true  // 控制表格是否可以多选，但是这种方式没有前面的复选框 默认为false
   *     });
   *
   *   grid.render();
   * </code></pre>
   * @class BUI.Grid.Plugins.CheckSelection
   * @extends BUI.Base
   */
  function checkSelection(config) {
    checkSelection.superclass.constructor.call(this, config);
  }
  BUI.extend(checkSelection, BUI.Base);
  checkSelection.ATTRS = {
    /**
     * column's width which contains the checkbox
     */
    width: {
      value: 40
    },
    /**
     * @private
     */
    column: {},
    /**
     * @private
     * <input  class="' + CLS_CHECKBOX + '" type="checkbox">
     */
    cellInner: {
      value: '<div class="' + CLS_CHECKBOX + '-container"><span class="' + CLS_CHECK_ICON + '"></span></div>'
    }
  };
  BUI.augment(checkSelection, {
    createDom: function(grid) {
      var _self = this;
      var cfg = {
          title: '',
          width: _self.get('width'),
          fixed: true,
          resizable: false,
          sortable: false,
          tpl: '<div class="' + PREFIX + 'grid-hd-inner">' + _self.get('cellInner') + '',
          cellTpl: _self.get('cellInner')
        },
        checkColumn = grid.addColumn(cfg, 0);
      grid.set('multipleSelect', true);
      _self.set('column', checkColumn);
    },
    /**
     * @private
     */
    bindUI: function(grid) {
      var _self = this,
        col = _self.get('column'),
        colEl = col.get('el'),
        checkBox = colEl.find('.' + CLS_CHECK_ICON);
      checkBox.on('click', function() {
        var checked = colEl.hasClass('checked');
        if (!checked) {
          grid.setAllSelection();
          colEl.addClass('checked');
        } else {
          grid.clearSelection();
          colEl.removeClass('checked');
        }
      });
      grid.on('rowunselected', function(e) {
        colEl.removeClass('checked');
      });
      //清除纪录时取全选
      grid.on('clear', function() {
        //checkBox.attr('checked',false);
        colEl.removeClass('checked');
      });
    }
  });
  /**
   * 表格单选插件
   * @class BUI.Grid.Plugins.RadioSelection
   * @extends BUI.Base
   */
  var radioSelection = function(config) {
    radioSelection.superclass.constructor.call(this, config);
  };
  BUI.extend(radioSelection, BUI.Base);
  radioSelection.ATTRS = {
    /**
     * column's width which contains the checkbox
     */
    width: {
      value: 40
    },
    /**
     * @private
     */
    column: {},
    /**
     * @private
     */
    cellInner: {
      value: '<div class="' + PREFIX + 'grid-radio-container"><input  class="' + CLS_RADIO + '" type="radio"></div>'
    }
  };
  BUI.augment(radioSelection, {
    createDom: function(grid) {
      var _self = this;
      var cfg = {
          title: '',
          width: _self.get('width'),
          resizable: false,
          fixed: true,
          sortable: false,
          cellTpl: _self.get('cellInner')
        },
        column = grid.addColumn(cfg, 0);
      grid.set('multipleSelect', false);
      _self.set('column', column);
    },
    /**
     * @private
     */
    bindUI: function(grid) {
      var _self = this;
      grid.on('rowselected', function(e) {
        _self._setRowChecked(e.row, true);
      });
      grid.on('rowunselected', function(e) {
        _self._setRowChecked(e.row, false);
      });
    },
    _setRowChecked: function(row, checked) {
      var rowEl = $(row),
        radio = rowEl.find('.' + CLS_RADIO);
      radio.attr('checked', checked);
    }
  });
  /**
   * @name BUI.Grid.Plugins
   * @namespace 表格插件命名空间
   * @ignore
   */
  var Selection = {
    CheckSelection: checkSelection,
    RadioSelection: radioSelection
  };
  module.exports = Selection;
});
define("bui/grid/plugins/cascade", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 级联表格
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    CLS_GRID_CASCADE = '',
    DATA_RECORD = 'data-record',
    CLS_CASCADE = PREFIX + 'grid-cascade',
    CLS_CASCADE_EXPAND = CLS_CASCADE + '-expand',
    CLS_CASCADE_ROW = CLS_CASCADE + '-row',
    CLS_CASCADE_CELL = CLS_CASCADE + '-cell',
    CLS_CASCADE_ROW_COLLAPSE = CLS_CASCADE + '-collapse';
  /**
   * 级联表格
   * <pre><code>
   *  // 实例化 Grid.Plugins.Cascade 插件
   *    var cascade = new Grid.Plugins.Cascade({
   *      renderer : function(record){
   *        return '<div style="padding: 10px 20px;"><h2>详情信息</h2><p>' + record.detail + '</p></div>';
   *      }
   *    });
   *    var store = new Store({
   *        data : data,
   *        autoLoad:true
   *      }),
   *      grid = new Grid.Grid({
   *        render:'#grid',
   *        columns : columns,
   *        store: store,
   *        plugins: [cascade]  // Grid.Plugins.Cascade 插件
   *      });
   *
   *    grid.render();
   *
   *    cascade.expandAll();//展开所有
   * </code></pre>
   * @class BUI.Grid.Plugins.Cascade
   * @extends BUI.Base
   */
  var cascade = function(config) {
    cascade.superclass.constructor.call(this, config);
  };
  BUI.extend(cascade, BUI.Base);
  cascade.ATTRS = {
    /**
     * 显示展开按钮列的宽度
     * @cfg {Number} width
     */
    /**
     * 显示展开按钮列的宽度
     * @type {Number}
     * @default 40
     */
    width: {
      value: 40
    },
    /**
     * 展开列的默认内容
     * @type {String}
     * @protected
     */
    cellInner: {
      value: '<span class="' + CLS_CASCADE + '"><i class="' + CLS_CASCADE + '-icon"></i></span>'
    },
    /**
     * 展开行的模版
     * @protected
     * @type {String}
     */
    rowTpl: {
      value: '<tr class="' + CLS_CASCADE_ROW + '"><td class="' + CLS_CASCADE_CELL + '"></td></tr>'
    },
    /**
     * 生成级联列时需要渲染的内容
     * @cfg {Function} renderer
     */
    /**
     * 生成级联列时需要渲染的内容
     * @type {Function}
     */
    renderer: {},
    events: [
      /**
       * 展开级联内容时触发
       * @name  BUI.Grid.Plugins.Cascade#expand
       * @event
       * @param {jQuery.Event} e  事件对象
       * @param {Object} e.record 级联内容对应的纪录
       * @param {HTMLElement} e.row 级联的行DOM
       */
      'expand',
      /**
       * 折叠级联内容时触发
       * @name  BUI.Grid.Plugins.Cascade#collapse
       * @event
       * @param {jQuery.Event} e  事件对象
       * @param {Object} e.record 级联内容对应的纪录
       * @param {HTMLElement} e.row 级联的行DOM
       */
      'collapse',
      /**
       * 删除级联内容时触发
       * @name  BUI.Grid.Plugins.Cascade#removed
       * @event
       * @param {jQuery.Event} e  事件对象
       * @param {Object} e.record 级联内容对应的纪录
       * @param {HTMLElement} e.row 级联的行DOM
       */
      'removed'
    ]
  };
  BUI.augment(cascade, {
    /**
     * 初始化
     * @protected
     */
    initializer: function(grid) {
      var _self = this;
      var cfg = {
          title: '',
          elCls: 'center', //居中对齐
          width: _self.get('width'),
          resizable: false,
          fixed: true,
          sortable: false,
          cellTpl: _self.get('cellInner')
        },
        expandColumn = grid.addColumn(cfg, 0);
      //列之间的线去掉
      grid.set('innerBorder', false);
      _self.set('grid', grid);
    },
    /**
     * 绑定事件
     * @protected
     */
    bindUI: function(grid) {
      var _self = this;
      grid.on('cellclick', function(ev) {
        var sender = $(ev.domTarget),
          cascadeEl = sender.closest('.' + CLS_CASCADE);
        //如果点击展开、折叠按钮
        if (cascadeEl.length) {
          if (!cascadeEl.hasClass(CLS_CASCADE_EXPAND)) {
            _self._onExpand(ev.record, ev.row, cascadeEl);
          } else {
            _self._onCollapse(ev.record, ev.row, cascadeEl);
          }
        }
      });
      grid.on('columnvisiblechange', function() {
        _self._resetColspan();
      });
      grid.on('rowremoved', function(ev) {
        _self.remove(ev.record);
      });
      grid.on('clear', function() {
        _self.removeAll();
      });
    },
    /**
     * 展开所有级联数据
     * <pre><code>
     *   cascade.expandAll();
     * </code></pre>
     */
    expandAll: function() {
      var _self = this,
        grid = _self.get('grid'),
        records = grid.getRecords();
      $.each(records, function(index, record) {
        _self.expand(record);
      });
    },
    /**
     * 展开某条纪录
     * <pre><code>
     *   var record = grid.getItem('a');
     *   cascade.expand(record);
     * </code></pre>
     * @param  {Object} record 纪录
     */
    expand: function(record) {
      var _self = this,
        grid = _self.get('grid');
      var row = grid.findRow(record);
      if (row) {
        _self._onExpand(record, row);
      }
    },
    /**
     * 折叠某条纪录
     * <pre><code>
     *   var record = grid.getItem('a');
     *   cascade.collapse(record);
     * </code></pre>
     * @param  {Object} record 纪录
     */
    collapse: function(record) {
      var _self = this,
        grid = _self.get('grid');
      var row = grid.findRow(record);
      if (row) {
        _self._onCollapse(record, row);
      }
    },
    /**
     * 移除所有级联数据的ＤＯＭ
     * @protected
     */
    removeAll: function() {
      var _self = this,
        rows = _self._getAllCascadeRows();
      rows.each(function(index, row) {
        _self._removeCascadeRow(row);
      });
    },
    /**
     * 根据纪录删除级联信息
     * @protected
     * @param  {Object} record 级联信息对应的纪录
     */
    remove: function(record) {
      var _self = this,
        cascadeRow = _self._findCascadeRow(record);
      if (cascadeRow) {
        _self._removeCascadeRow(cascadeRow);
      }
    },
    /**
     * 折叠所有级联数据
     * <pre><code>
     *  cascade.collapseAll();
     * </code></pre>
     */
    collapseAll: function() {
      var _self = this,
        grid = _self.get('grid'),
        records = grid.getRecords();
      $.each(records, function(index, record) {
        _self.collapse(record);
      });
    },
    //获取级联数据
    _getRowRecord: function(cascadeRow) {
      return $(cascadeRow).data(DATA_RECORD);
    },
    //移除级联行
    _removeCascadeRow: function(row) {
      this.fire('removed', {
        record: $(row).data(DATA_RECORD),
        row: row
      });
      $(row).remove();
    },
    //通过纪录查找
    _findCascadeRow: function(record) {
      var _self = this,
        rows = _self._getAllCascadeRows(),
        result = null;
      $.each(rows, function(index, row) {
        if (_self._getRowRecord(row) === record) {
          result = row;
          return false;
        }
      });
      return result;
    },
    _getAllCascadeRows: function() {
      var _self = this,
        grid = _self.get('grid');
      return grid.get('el').find('.' + CLS_CASCADE_ROW);
    },
    //获取生成的级联行
    _getCascadeRow: function(gridRow) {
      var nextRow = $(gridRow).next();
      if ((nextRow).hasClass(CLS_CASCADE_ROW)) {
        return nextRow;
      }
      return null;
      //return $(gridRow).next('.' + CLS_CASCADE_ROW);
    },
    //获取级联内容
    _getRowContent: function(record) {
      var _self = this,
        renderer = _self.get('renderer'),
        content = renderer ? renderer(record) : '';
      return content;
    },
    //创建级联行
    _createCascadeRow: function(record, gridRow) {
      var _self = this,
        rowTpl = _self.get('rowTpl'),
        content = _self._getRowContent(record),
        rowEl = $(rowTpl).insertAfter(gridRow);
      rowEl.find('.' + CLS_CASCADE_CELL).append($(content));
      rowEl.data(DATA_RECORD, record);
      return rowEl;
    },
    //展开
    _onExpand: function(record, row, cascadeEl) {
      var _self = this,
        cascadeRow = _self._getCascadeRow(row),
        colspan = _self._getColumnCount(row);
      cascadeEl = cascadeEl || $(row).find('.' + CLS_CASCADE);
      cascadeEl.addClass(CLS_CASCADE_EXPAND);
      if (!cascadeRow || !cascadeRow.length) {
        cascadeRow = _self._createCascadeRow(record, row);
      }
      $(cascadeRow).removeClass(CLS_CASCADE_ROW_COLLAPSE);
      _self._setColSpan(cascadeRow, row);
      _self.fire('expand', {
        record: record,
        row: cascadeRow[0]
      });
    },
    //折叠
    _onCollapse: function(record, row, cascadeEl) {
      var _self = this,
        cascadeRow = _self._getCascadeRow(row);
      cascadeEl = cascadeEl || $(row).find('.' + CLS_CASCADE);
      cascadeEl.removeClass(CLS_CASCADE_EXPAND);
      if (cascadeRow && cascadeRow.length) {
        $(cascadeRow).addClass(CLS_CASCADE_ROW_COLLAPSE);
        _self.fire('collapse', {
          record: record,
          row: cascadeRow[0]
        });
      }
    },
    //获取显示的列数
    _getColumnCount: function(row) {
      return $(row).children().filter(function() {
        return $(this).css('display') !== 'none';
      }).length;
    },
    //设置colspan
    _setColSpan: function(cascadeRow, gridRow) {
      gridRow = gridRow || $(cascadeRow).prev();
      var _self = this,
        colspan = _self._getColumnCount(gridRow);
      $(cascadeRow).find('.' + CLS_CASCADE_CELL).attr('colspan', colspan)
    },
    //重置所有的colspan
    _resetColspan: function() {
      var _self = this,
        cascadeRows = _self._getAllCascadeRows();
      $.each(cascadeRows, function(index, cascadeRow) {
        _self._setColSpan(cascadeRow);
      });
    },
    /**
     * 析构函数
     */
    destructor: function() {
      var _self = this;
      _self.removeAll();
      _self.off();
      _self.clearAttrVals();
    }
  });
  module.exports = cascade;
});
define("bui/grid/plugins/cellediting", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 表格单元格编辑
   * @ignore
   */
  var $ = require('jquery'),
    Editing = require("bui/grid/plugins/editing"),
    CLS_BODY = BUI.prefix + 'grid-body',
    CLS_CELL = BUI.prefix + 'grid-cell';
  /**
   * @class BUI.Grid.Plugins.CellEditing
   * @extends BUI.Grid.Plugins.Editing
   * 单元格编辑插件
   */
  var CellEditing = function(config) {
    CellEditing.superclass.constructor.call(this, config);
  };
  CellEditing.ATTRS = {
    /**
     * 触发编辑样式，为空时默认点击整行都会触发编辑
     * @cfg {String} [triggerCls = 'bui-grid-cell']
     */
    triggerCls: {
      value: CLS_CELL
    }
  };
  BUI.extend(CellEditing, Editing);
  BUI.augment(CellEditing, {
    /**
     * @protected
     * 获取编辑器的配置项
     * @param  {Array} fields 字段配置
     */
    getEditorCfgs: function(fields) {
      var _self = this,
        grid = _self.get('grid'),
        bodyNode = grid.get('el').find('.' + CLS_BODY),
        rst = [];
      BUI.each(fields, function(field) {
        var cfg = {
          field: field,
          changeSourceEvent: null,
          hideExceptNode: bodyNode,
          autoUpdate: false,
          preventHide: false,
          editableFn: field.editableFn
        };
        if (field.xtype === 'checkbox') {
          cfg.innerValueField = 'checked';
        }
        rst.push(cfg);
      });
      return rst;
    },
    /**
     * 获取编辑器
     * @protected
     * @param  {String} field 字段值
     * @return {BUI.Editor.Editor}  编辑器
     */
    getEditor: function(field) {
      if (!field) {
        return null;
      }
      var _self = this,
        editors = _self.get('editors'),
        editor = null;
      BUI.each(editors, function(item) {
        if (item.get('field').get('name') === field) {
          editor = item;
          return false;
        }
      });
      return editor;
    },
    /**
     * 显示编辑器前
     * @protected
     * @param  {BUI.Editor.Editor} editor
     * @param  {Object} options
     */
    beforeShowEditor: function(editor, options) {
      var _self = this,
        cell = $(options.cell);
      _self.resetWidth(editor, cell.outerWidth());
      _self._makeEnable(editor, options);
    },
    _makeEnable: function(editor, options) {
      var editableFn = editor.get('editableFn'),
        field,
        enable,
        record;
      if (BUI.isFunction(editableFn)) {
        field = options.field;
        record = options.record;
        if (record && field) {
          enable = editableFn(record[field], record);
          if (enable) {
            editor.get('field').enable();
          } else {
            editor.get('field').disable();
          }
        }
      }
    },
    resetWidth: function(editor, width) {
      editor.set('width', width);
    },
    /**
     * 更新数据
     * @protected
     * @param  {Object} record 编辑的数据
     * @param  {*} value  编辑值
     */
    updateRecord: function(store, record, editor) {
      var _self = this,
        value = editor.getValue(),
        fieldName = editor.get('field').get('name'),
        preValue = record[fieldName];
      value = BUI.isDate(value) ? value.getTime() : value;
      if (preValue !== value) {
        store.setValue(record, fieldName, value);
      }
    },
    /**
     * @protected
     * 获取对齐的节点
     * @override
     * @param  {Object} options 点击单元格的事件对象
     * @return {jQuery}
     */
    getAlignNode: function(options) {
      return $(options.cell);
    },
    /**
     * 获取编辑的字段
     * @protected
     * @return {Array}  字段集合
     */
    getFields: function() {
      var rst = [],
        _self = this,
        editors = _self.get('editors');
      BUI.each(editors, function(editor) {
        rst.push(editor.get('field'));
      });
      return rst;
    },
    /**
     * @protected
     * 获取要编辑的值
     * @param  {Object} options 点击单元格的事件对象
     * @return {*}   编辑的值
     */
    getEditValue: function(options) {
      if (options.record && options.field) {
        var value = options.record[options.field];
        return value == null ? '' : value;
      }
      return '';
    }
  });
  module.exports = CellEditing;
});
define("bui/grid/plugins/editing", ["jquery"], function(require, exports, module) {
  /**
   * @fileOverview 表格编辑插件
   * @ignore
   */
  var $ = require('jquery'),
    CLS_CELL_INNER = BUI.prefix + 'grid-cell-inner',
    CLS_CELL_ERROR = BUI.prefix + 'grid-cell-error';
  /**
   * 表格的编辑插件
   * @class BUI.Grid.Plugins.Editing
   */
  function Editing(config) {
    Editing.superclass.constructor.call(this, config);
  }
  BUI.extend(Editing, BUI.Base);
  Editing.ATTRS = {
    /**
     * @protected
     * 编辑器的对齐设置
     * @type {Object}
     */
    align: {
      value: {
        points: ['cl', 'cl']
      }
    },
    /**
     * 是否直接在表格上显示错误信息
     * @type {Boolean}
     */
    showError: {
      value: true
    },
    errorTpl: {
      value: '<span class="x-icon ' + CLS_CELL_ERROR + ' x-icon-mini x-icon-error" title="{error}">!</span>'
    },
    /**
     * 是否初始化过编辑器
     * @protected
     * @type {Boolean}
     */
    isInitEditors: {
      value: false
    },
    /**
     * 正在编辑的记录
     * @type {Object}
     */
    record: {},
    /**
     * 当前编辑的编辑器
     * @type {Object}
     */
    curEditor: {},
    /**
     * 是否发生过验证
     * @type {Boolean}
     */
    hasValid: {},
    /**
     * 编辑器
     * @protected
     * @type {Object}
     */
    editors: {
      shared: false,
      value: []
    },
    /**
     * 触发编辑样式，为空时默认点击整行都会触发编辑
     * @type {String}
     */
    triggerCls: {},
    /**
     * 进行编辑时是否触发选中
     * @type {Boolean}
     */
    triggerSelected: {
      value: true
    }
    /**
     * @event accept
     * 确认编辑
     * @param {Object} ev 事件对象
     * @param {Object} ev.record 编辑的数据
     * @param {BUI.Editor.Editor} ev.editor 编辑器
     */
    /**
     * @event cancel
     * 取消编辑
     * @param {Object} ev 事件对象
     * @param {Object} ev.record 编辑的数据
     * @param {BUI.Editor.Editor} ev.editor 编辑器
     */
    /**
     * @event editorshow
     * editor 显示
     * @param {Object} ev 事件对象
     * @param {Object} ev.record 编辑的数据
     * @param {BUI.Editor.Editor} ev.editor 编辑器
     */
    /**
     * @event editorready
     * editor 创建完成，因为editor延迟创建，所以创建完成grid，等待editor创建成功
     */
    /**
     * @event beforeeditorshow
     * editor显示前，可以更改editor的一些属性
     * @param {Object} ev 事件对象
     * @param {Object} ev.record 编辑的数据
     * @param {BUI.Editor.Editor} ev.editor 编辑器
     */
  };
  BUI.augment(Editing, {
    /**
     * 初始化
     * @protected
     */
    initializer: function(grid) {
      var _self = this;
      _self.set('grid', grid);
      _self.initEditing(grid);
    },
    renderUI: function() {
      var _self = this,
        grid = _self.get('grid');
      //延迟加载 editor模块
      require.async('bui/editor', function(Editor) {
        _self.initEditors(Editor);
        _self._initGridEvent(grid);
        _self.set('isInitEditors', true);
        _self.fire('editorready');
      });
    },
    /**
     * 初始化插件
     * @protected
     */
    initEditing: function(grid) {},
    _getCurEditor: function() {
      return this.get('curEditor');
    },
    _initGridEvent: function(grid) {
      var _self = this,
        header = grid.get('header');
      grid.on('cellclick', function(ev) {
        var editor = null,
          domTarget = ev.domTarget,
          triggerCls = _self.get('triggerCls'),
          curEditor = _self._getCurEditor();
        if (curEditor && curEditor.get('acceptEvent')) {
          curEditor.accept();
          curEditor.hide();
        } else {
          curEditor && curEditor.cancel();
        }
        //if(ev.field){
        editor = _self.getEditor(ev.field);
        //}
        if (editor && $(domTarget).closest('.' + triggerCls).length) {
          _self.showEditor(editor, ev);
          //if(curEditor && curEditor.get('acceptEvent')){
          if (!_self.get('triggerSelected')) {
            return false; //此时不触发选中事件
          }
          //}
        }
      });
      grid.on('rowcreated', function(ev) {
        validRow(ev.record, ev.row);
      });
      grid.on('rowremoved', function(ev) {
        if (_self.get('record') == ev.record) {
          _self.cancel();
        }
      });
      grid.on('rowupdated', function(ev) {
        validRow(ev.record, ev.row);
      });
      grid.on('scroll', function(ev) {
        var editor = _self._getCurEditor();
        if (editor) {
          var align = editor.get('align'),
            node = align.node,
            pos = node.position();
          if (pos.top < 0 || pos.top > ev.bodyHeight) {
            editor.hide();
          } else {
            editor.set('align', align);
            editor.show();
          }
        }
      });
      header.on('afterVisibleChange', function(ev) {
        if (ev.target && ev.target != header) {
          var column = ev.target;
          _self.onColumnVisibleChange(column);
        }
      });

      function validRow(record, row) {
        if (_self.get('hasValid')) {
          _self.validRecord(record, _self.getFields(), $(row));
        }
      }
    },
    /**
     * 初始化所有
     * @protected
     */
    initEditors: function(Editor) {
      var _self = this,
        grid = _self.get('grid'),
        fields = [],
        columns = grid.get('columns');
      BUI.each(columns, function(column) {
        var field = _self.getFieldConfig(column);
        if (field) {
          field.name = column.get('dataIndex');
          field.colId = column.get('id');
          if (field.validator) {
            field.validator = _self.wrapValidator(field.validator);
          }
          fields.push(field);
        }
      });
      var cfgs = _self.getEditorCfgs(fields);
      BUI.each(cfgs, function(cfg) {
        _self.initEidtor(cfg, Editor);
      });
    },
    /**
     * @protected
     * 获取列定义中的字段定义信息
     * @param  {BUI.Grid.Column} column 列定义
     * @return {Object}  字段定义
     */
    getFieldConfig: function(column) {
      return column.get('editor');
    },
    /**
     * 封装验证方法
     * @protected
     */
    wrapValidator: function(validator) {
      var _self = this;
      return function(value) {
        var record = _self.get('record');
        return validator(value, record);
      };
    },
    /**
     * @protected
     * 列显示隐藏时
     */
    onColumnVisibleChange: function(column) {},
    /**
     * @protected
     * 获取编辑器的配置
     * @template
     * @param  {Array} fields 字段配置
     * @return {Array} 编辑器的配置项
     */
    getEditorCfgs: function(fields) {},
    /**
     * 获取编辑器的构造函数
     * @param  {Object} Editor 命名空间
     * @return {Function}       构造函数
     */
    getEditorConstructor: function(Editor) {
      return Editor.Editor;
    },
    /**
     * 初始化编辑器
     * @private
     */
    initEidtor: function(cfg, Editor) {
      var _self = this,
        con = _self.getEditorConstructor(Editor),
        editor = new con(cfg);
      editor.render();
      _self.get('editors').push(editor);
      _self.bindEidtor(editor);
      return editor;
    },
    /**
     * @protected
     * 绑定编辑器事件
     * @param  {BUI.Editor.Editor} editor 编辑器
     */
    bindEidtor: function(editor) {
      var _self = this,
        grid = _self.get('grid'),
        store = grid.get('store');
      editor.on('accept', function() {
        var record = _self.get('record');
        _self.updateRecord(store, record, editor);
        _self.fire('accept', {
          editor: editor,
          record: record
        });
        _self.set('curEditor', null);
      });
      editor.on('cancel', function() {
        _self.fire('cancel', {
          editor: editor,
          record: _self.get('record')
        });
        _self.set('curEditor', null);
      });
    },
    /**
     * 获取编辑器
     * @protected
     * @param  {String} field 字段值
     * @return {BUI.Editor.Editor}  编辑器
     */
    getEditor: function(options) {},
    /**
     * @protected
     * 获取对齐的节点
     * @template
     * @param  {Object} options 点击单元格的事件对象
     * @return {jQuery}
     */
    getAlignNode: function(options) {},
    /**
     * @protected
     * 获取编辑的值
     * @param  {Object} options 点击单元格的事件对象
     * @return {*}   编辑的值
     */
    getEditValue: function(options) {},
    /**
     * 显示编辑器
     * @protected
     * @param  {BUI.Editor.Editor} editor
     */
    showEditor: function(editor, options) {
      var _self = this,
        value = _self.getEditValue(options),
        alignNode = _self.getAlignNode(options);
      _self.beforeShowEditor(editor, options);
      _self.set('record', options.record);
      _self.fire('beforeeditorshow', {
        editor: editor,
        record: options.record
      });
      editor.setValue(value);
      if (alignNode) {
        var align = _self.get('align');
        align.node = alignNode;
        editor.set('align', align);
      }
      editor.show();
      _self.focusEditor(editor, options.field);
      _self.set('curEditor', editor);
      _self.fire('editorshow', {
        editor: editor,
        record: options.record
      });
    },
    /**
     * @protected
     * 编辑器字段定位
     */
    focusEditor: function(editor, field) {
      editor.focus();
    },
    /**
     * 显示编辑器前
     * @protected
     * @template
     * @param  {BUI.Editor.Editor} editor
     * @param  {Object} options
     */
    beforeShowEditor: function(editor, options) {},
    //创建编辑的配置项
    _createEditOptions: function(record, field) {
      var _self = this,
        grid = _self.get('grid'),
        rowEl = grid.findRow(record),
        column = grid.findColumnByField(field),
        cellEl = grid.findCell(column.get('id'), rowEl);
      return {
        record: record,
        field: field,
        cell: cellEl[0],
        row: rowEl[0]
      };
    },
    /**
     * 验证表格是否通过验证
     */
    valid: function() {
      var _self = this,
        grid = _self.get('grid'),
        store = grid.get('store');
      if (store) {
        var records = store.getResult();
        BUI.each(records, function(record) {
          _self.validRecord(record, _self.getFields());
        });
      }
      _self.set('hasValid', true);
    },
    isValid: function() {
      var _self = this,
        grid = _self.get('grid');
      if (!_self.get('hasValid')) {
        _self.valid();
      }
      return !grid.get('el').find('.' + CLS_CELL_ERROR).length;
    },
    /**
     * 清理错误
     */
    clearErrors: function() {
      var _self = this,
        grid = _self.get('grid');
      grid.get('el').find('.' + CLS_CELL_ERROR).remove();
    },
    /**
     * 获取编辑的字段
     * @protected
     * @param  {Array} editors 编辑器
     * @return {Array}  字段集合
     */
    getFields: function(editors) {},
    /**
     * 校验记录
     * @protected
     * @param  {Object} record 校验的记录
     * @param  {Array} fields 字段的集合
     */
    validRecord: function(record, fields, row) {
      var _self = this,
        errors = [];
      _self.setInternal('record', record);
      fields = fields || _self.getFields();
      BUI.each(fields, function(field) {
        var name = field.get('name'),
          value = record[name] || '',
          error = field.getValidError(value);
        if (error) {
          errors.push({
            name: name,
            error: error,
            id: field.get('colId')
          });
        }
      });
      _self.showRecordError(record, errors, row);
    },
    showRecordError: function(record, errors, row) {
      var _self = this,
        grid = _self.get('grid');
      row = row || grid.findRow(record);
      if (row) {
        _self._clearRowError(row);
        BUI.each(errors, function(item) {
          var cell = grid.findCell(item.id, row);
          _self._showCellError(cell, item.error);
        });
      }
    },
    /**
     * 更新数据
     * @protected
     * @param  {Object} record 编辑的数据
     * @param  {*} value  编辑值
     */
    updateRecord: function(store, record, editor) {},
    _clearRowError: function(row) {
      row.find('.' + CLS_CELL_ERROR).remove();
    },
    _showCellError: function(cell, error) {
      var _self = this,
        errorTpl = BUI.substitute(_self.get('errorTpl'), {
          error: error
        }),
        innerEl = cell.find('.' + CLS_CELL_INNER);
      $(errorTpl).appendTo(innerEl);
    },
    /**
     * 编辑记录
     * @param  {Object} record 需要编辑的记录
     * @param  {String} field 编辑的字段
     */
    edit: function(record, field) {
      var _self = this,
        options = _self._createEditOptions(record, field),
        editor = _self.getEditor(field);
      _self.showEditor(editor, options);
    },
    /**
     * 取消编辑
     */
    cancel: function() {
      var _self = this,
        editors = _self.get('editors');
      BUI.each(editors, function(editor) {
        if (editor.get('visible')) {
          editor.cancel();
        }
      });
      _self.set('curEditor', null);
      _self.set('record', null);
    },
    /**
     * 析构函数
     * @protected
     */
    destructor: function() {
      var _self = this,
        editors = _self.get('editors');
      BUI.each(editors, function(editor) {
        editor.destroy && editor.destroy();
      });
      _self.off();
      _self.clearAttrVals();
    }
  });
  module.exports = Editing;
});
define("bui/grid/plugins/rowediting", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 表格行编辑
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Editing = require("bui/grid/plugins/editing"),
    CLS_ROW = BUI.prefix + 'grid-row';
  /**
   * @class BUI.Grid.Plugins.RowEditing
   * @extends BUI.Grid.Plugins.Editing
   * 单元格编辑插件
   *
   *  ** 注意 **
   *
   *  - 编辑器的定义在columns中，editor属性
   *  - editor里面的定义对应form-field的定义，xtype代表 form-field + xtype
   *  - validator 函数的函数原型 function(value,newRecord,originRecord){} //编辑的当前值，正在编辑的记录，原始记录
   */
  var RowEditing = function(config) {
    RowEditing.superclass.constructor.call(this, config);
  };
  RowEditing.ATTRS = {
    /**
     * 是否自动保存数据到数据源，通过store的save方法实现
     * @cfg {Object} [autoSave=false]
     */
    autoSave: {
      value: false
    },
    /**
     * @protected
     * 编辑器的对齐设置
     * @type {Object}
     */
    align: {
      value: {
        points: ['tl', 'tl'],
        offset: [-2, 0]
      }
    },
    /**
     * 触发编辑样式，为空时默认点击整行都会触发编辑
     * @cfg {String} [triggerCls = 'bui-grid-row']
     */
    triggerCls: {
      value: CLS_ROW
    },
    /**
     * 编辑器的默认配置信息
     * @type {Object}
     */
    editor: {}
  };
  BUI.extend(RowEditing, Editing);
  BUI.augment(RowEditing, {
    /**
     * @protected
     * 获取编辑器的配置项
     * @param  {Array} fields 字段配置
     */
    getEditorCfgs: function(fields) {
      var _self = this,
        editor = _self.get('editor'),
        rst = [],
        cfg = BUI.mix(true, {
          changeSourceEvent: null,
          autoUpdate: false,
          form: {
            children: fields,
            buttonBar: {
              elCls: 'centered toolbar'
            }
          }
        }, editor);
      rst.push(cfg);
      return rst;
    },
    /**
     * 封装验证方法
     * @protected
     */
    wrapValidator: function(validator) {
      var _self = this;
      return function(value) {
        var editor = _self.get('curEditor'),
          origin = _self.get('record'),
          record = editor ? editor.getValue() : origin;
        if (record) {
          return validator(value, record, origin);
        }
      };
    },
    /**
     * @protected
     * 编辑器字段定位
     */
    focusEditor: function(editor, field) {
      var form = editor.get('form'),
        control = form.getField(field);
      if (control) {
        control.focus();
      }
    },
    /**
     * @protected
     * 获取列定义中的字段定义信息
     * @param  {BUI.Grid.Column} column 列定义
     * @return {Object}  字段定义
     */
    getFieldConfig: function(column) {
      var editor = column.get('editor');
      if (editor) {
        if (editor.xtype === 'checkbox') {
          editor.innerValueField = 'checked';
        }
        return editor;
      }
      var cfg = {
        xtype: 'plain'
      };
      if (column.get('dataIndex') && column.get('renderer')) {
        cfg.renderer = column.get('renderer');
        //cfg.id = column.get('id');
      }
      return cfg;
    },
    /**
     * 更新数据
     * @protected
     * @param  {Object} record 编辑的数据
     * @param  {*} value  编辑值
     */
    updateRecord: function(store, record, editor) {
      var _self = this,
        value = editor.getValue();
      BUI.each(value, function(v, k) {
        if (BUI.isDate(v)) {
          value[k] = v.getTime();
        }
      });
      BUI.mix(record, value);
      store.update(record);
      if (_self.get('autoSave')) {
        store.save(record);
      }
    },
    /**
     * 获取编辑此行的编辑器
     * @protected
     * @param  {String} field 点击单元格的字段
     * @return {BUI.Editor.Editor}  编辑器
     */
    getEditor: function(field) {
      var _self = this,
        editors = _self.get('editors');
      return editors[0];
    },
    /**
     * @override
     * 列发生改变
     */
    onColumnVisibleChange: function(column) {
      var _self = this,
        id = column.get('id'),
        editor = _self.getEditor(),
        field = editor.getChild(id, true);
      if (field) {
        field.set('visible', column.get('visible'));
      }
    },
    /**
     * 显示编辑器前
     * @protected
     * @template
     * @param  {BUI.Editor.Editor} editor
     * @param  {Object} options
     */
    beforeShowEditor: function(editor, options) {
      var _self = this,
        grid = _self.get('grid'),
        columns = grid.get('columns'),
        form = editor.get('form'),
        row = $(options.row);
      editor.set('width', row.width());
      BUI.each(columns, function(column) {
        var fieldName = column.get('dataIndex'),
          field = form.getField(fieldName)
        if (!column.get('visible')) {
          field && field.set('visible', false);
        } else {
          var width = column.get('el').outerWidth() - field.getAppendWidth();
          field.set('width', width);
        }
      });
    },
    /**
     * @protected
     * 获取要编辑的值
     * @param  {Object} options 点击单元格的事件对象
     * @return {*}   编辑的值
     */
    getEditValue: function(options) {
      return options.record;
    },
    /**
     * 获取编辑器的构造函数
     * @param  {Object} Editor 命名空间
     * @return {Function}       构造函数
     */
    getEditorConstructor: function(Editor) {
      return Editor.RecordEditor;
    },
    /**
     * @protected
     * 获取对齐的节点
     * @override
     * @param  {Object} options 点击单元格的事件对象
     * @return {jQuery}
     */
    getAlignNode: function(options) {
      return $(options.row);
    },
    /**
     * 获取编辑的字段
     * @protected
     * @return {Array}  字段集合
     */
    getFields: function() {
      var _self = this,
        editors = _self.get('editors');
      return editors[0].get('form').get('children');
    }
  });
  module.exports = RowEditing;
});
define("bui/grid/plugins/dialog", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 表格跟表单联用
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    TYPE_ADD = 'add',
    TYPE_EDIT = 'edit';
  /**
   * 表格的编辑插件
   * @class BUI.Grid.Plugins.DialogEditing
   */
  function Dialog(config) {
    Dialog.superclass.constructor.call(this, config);
  }
  Dialog.ATTRS = {
    /**
     * 是否自动保存数据到数据源，通过store的save方法实现
     * @cfg {Object} [autoSave=false]
     */
    autoSave: {
      value: false
    },
    /**
     * 编辑的记录
     * @type {Object}
     * @readOnly
     */
    record: {},
    /**
     * @private
     * 编辑记录的index
     * @type {Object}
     */
    curIndex: {},
    /**
     * Dialog的内容，内部包含表单(form)
     * @cfg {String} contentId
     */
    /**
     * Dialog的内容，内部包含表单(form)
     * @type {String}
     */
    contentId: {},
    /**
     * 编辑器
     * @type {BUI.Editor.DialogEditor}
     * @readOnly
     */
    editor: {},
    /**
     * Dialog中的表单
     * @type {BUI.Form.Form}
     * @readOnly
     */
    form: {},
    events: {
      value: {
        /**
         * @event
         * 编辑的记录发生更改
         * @param {Object} e 事件对象
         * @param {Object} e.record 记录
         * @param {Object} e.editType 编辑的类型 add 或者 edit
         */
        recordchange: false
          /**
           * @event accept
           * 确认编辑
           * @param {Object} ev 事件对象
           * @param {Object} ev.record 编辑的数据
           * @param {BUI.Form.Form} form 表单
           * @param {BUI.Editor.Editor} ev.editor 编辑器
           */
          /**
           * @event cancel
           * 取消编辑
           * @param {Object} ev 事件对象
           * @param {Object} ev.record 编辑的数据
           * @param {BUI.Form.Form} form 表单
           * @param {BUI.Editor.Editor} ev.editor 编辑器
           */
          /**
           * @event editorshow
           * editor 显示
           * @param {Object} ev 事件对象
           * @param {Object} ev.record 编辑的数据
           * @param {BUI.Editor.Editor} ev.editor 编辑器
           */
          /**
           * @event editorready
           * editor 创建完成，因为editor延迟创建，所以创建完成grid，等待editor创建成功
           */
      }
    },
    editType: {}
  };
  BUI.extend(Dialog, BUI.Base);
  BUI.augment(Dialog, {
    /**
     * 初始化
     * @protected
     */
    initializer: function(grid) {
      var _self = this;
      _self.set('grid', grid);
      //延迟加载 editor模块
      require.async('bui/editor', function(Editor) {
        _self._initEditor(Editor);
        _self.fire('editorready');
      });
    },
    bindUI: function(grid) {
      var _self = this,
        triggerCls = _self.get('triggerCls');
      if (triggerCls) {
        grid.on('cellclick', function(ev) {
          var sender = $(ev.domTarget),
            editor = _self.get('editor');
          if (sender.hasClass(triggerCls) && editor) {
            _self.edit(ev.record);
            if (grid.get('multipleSelect')) {
              return false;
            }
          }
        });
      }
    },
    //初始化编辑器
    _initEditor: function(Editor) {
      var _self = this,
        contentId = _self.get('contentId'),
        formNode = $('#' + contentId).find('form'),
        editor = _self.get('editor'),
        cfg = BUI.merge(editor, {
          contentId: contentId,
          form: {
            srcNode: formNode
          }
        });
      editor = new Editor.DialogEditor(cfg);
      _self._bindEditor(editor);
      _self.set('editor', editor);
      _self.set('form', editor.get('form'));
    },
    //绑定编辑器事件
    _bindEditor: function(editor) {
      var _self = this;
      editor.on('accept', function() {
        var form = editor.get('form'),
          record = form.serializeToObject();
        _self.saveRecord(record);
        _self.fire('accept', {
          editor: editor,
          record: _self.get('record'),
          form: form
        });
      });
      editor.on('cancel', function() {
        _self.fire('cancel', {
          editor: editor,
          record: _self.get('record'),
          form: editor.get('form')
        });
      });
    },
    /**
     * 编辑记录
     * @param  {Object} record 记录
     */
    edit: function(record) {
      var _self = this;
      _self.set('editType', TYPE_EDIT);
      _self.showEditor(record);
    },
    /**
     * 添加记录
     * @param  {Object} record 记录
     * @param {Number} [index] 添加到的位置，默认添加在最后
     */
    add: function(record, index) {
      var _self = this;
      _self.set('editType', TYPE_ADD);
      _self.set('curIndex', index);
      _self.showEditor(record);
    },
    /**
     * @private
     * 保存记录
     */
    saveRecord: function(record) {
      var _self = this,
        grid = _self.get('grid'),
        editType = _self.get('editType'),
        curIndex = _self.get('curIndex'),
        store = grid.get('store'),
        curRecord = _self.get('record');
      BUI.mix(curRecord, record);
      if (editType == TYPE_ADD) {
        if (curIndex != null) {
          store.addAt(curRecord, curIndex);
        } else {
          store.add(curRecord);
        }
      } else {
        store.update(curRecord);
      }
      if (_self.get('autoSave')) {
        store.save(curRecord);
      }
    },
    /**
     * @private
     * 显示编辑器
     */
    showEditor: function(record) {
      var _self = this,
        editor = _self.get('editor');
      _self.set('record', record);
      editor.show();
      editor.setValue(record, true); //设置值，并且隐藏错误
      _self.fire('recordchange', {
        record: record,
        editType: _self.get('editType')
      });
      _self.fire('editorshow', {
        eidtor: editor,
        editType: _self.get('editType')
      });
    },
    /**
     * 取消编辑
     */
    cancel: function() {
      var _self = this,
        editor = _self.get('editor');
      editor.cancel();
    },
    destructor: function() {
      var _self = this,
        editor = _self.get('editor');
      editor && editor.destroy();
      _self.off();
      _self.clearAttrVals();
    }
  });
  module.exports = Dialog;
});
define("bui/grid/plugins/autofit", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 自动适应表格宽度的扩展
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    UA = BUI.UA;
  /**
   * 表格自适应宽度
   * @class BUI.Grid.Plugins.AutoFit
   * @extends BUI.Base
   */
  var AutoFit = function(cfg) {
    AutoFit.superclass.constructor.call(this, cfg);
  };
  BUI.extend(AutoFit, BUI.Base);
  AutoFit.ATTRS = {};
  BUI.augment(AutoFit, {
    //绑定事件
    bindUI: function(grid) {
      var _self = this,
        handler;
      $(window).on('resize', function() {
        function autoFit() {
          clearTimeout(handler); //防止resize短时间内反复调用
          handler = setTimeout(function() {
            _self._autoFit(grid);
          }, 100);
          _self.set('handler', handler);
        }
        autoFit();
      });
    },
    //自适应宽度
    _autoFit: function(grid) {
      var _self = this,
        render = $(grid.get('render')),
        docWidth = $(window).width(), //窗口宽度
        width,
        appendWidth = 0,
        parent = grid.get('el').parent();
      while (parent[0] && parent[0] != $('body')[0]) {
        appendWidth += parent.outerWidth() - parent.width();
        parent = parent.parent();
      }
      grid.set('width', docWidth - appendWidth);
    }
  });
  module.exports = AutoFit;
});
define("bui/grid/plugins/gridmenu", ["jquery", "bui/common", "bui/menu"], function(require, exports, module) {
  /**
   * @fileOverview Grid 菜单
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    Menu = require("bui/menu"),
    PREFIX = BUI.prefix,
    ID_SORT_ASC = 'sort-asc',
    ID_SORT_DESC = 'sort-desc',
    ID_COLUMNS_SET = 'column-setting',
    CLS_COLUMN_CHECKED = 'icon-check';
  /**
   * @class BUI.Grid.Plugins.GridMenu
   * @extends BUI.Base
   * 表格菜单插件
   */
  var gridMenu = function(config) {
    gridMenu.superclass.constructor.call(this, config);
  };
  BUI.extend(gridMenu, BUI.Base);
  gridMenu.ATTRS = {
    /**
     * 弹出菜单
     * @type {BUI.Menu.ContextMenu}
     */
    menu: {},
    /**
     * @private
     */
    activedColumn: {},
    triggerCls: {
      value: PREFIX + 'grid-hd-menu-trigger'
    },
    /**
     * 菜单的配置项
     * @type {Array}
     */
    items: {
      value: [{
        id: ID_SORT_ASC,
        text: '升序',
        iconCls: 'icon-arrow-up'
      }, {
        id: ID_SORT_DESC,
        text: '降序',
        iconCls: 'icon-arrow-down'
      }, {
        xclass: 'menu-item-sparator'
      }, {
        id: ID_COLUMNS_SET,
        text: '设置列',
        iconCls: 'icon-list-alt'
      }]
    }
  };
  BUI.augment(gridMenu, {
    /**
     * 初始化
     * @protected
     */
    initializer: function(grid) {
      var _self = this;
      _self.set('grid', grid);
    },
    /**
     * 渲染DOM
     */
    renderUI: function(grid) {
      var _self = this,
        columns = grid.get('columns');
      BUI.each(columns, function(column) {
        _self._addShowMenu(column);
      });
    },
    /**
     * 绑定表格
     * @protected
     */
    bindUI: function(grid) {
      var _self = this;
      grid.on('columnadd', function(ev) {
        _self._addShowMenu(ev.column);
      });
      grid.on('columnclick', function(ev) {
        var sender = $(ev.domTarget),
          column = ev.column,
          menu;
        _self.set('activedColumn', column);
        if (sender.hasClass(_self.get('triggerCls'))) {
          menu = _self.get('menu') || _self._initMenu();
          menu.set('align', {
            node: sender, // 参考元素, falsy 或 window 为可视区域, 'trigger' 为触发元素, 其他为指定元素
            points: ['bl', 'tl'], // ['tr', 'tl'] 表示 overlay 的 tl 与参考节点的 tr 对齐
            offset: [0, 0]
          });
          menu.show();
          _self._afterShow(column, menu);
        }
      });
    },
    _addShowMenu: function(column) {
      if (!column.get('fixed')) {
        column.set('showMenu', true);
      }
    },
    //菜单显示后
    _afterShow: function(column, menu) {
      var _self = this,
        grid = _self.get('grid');
      menu = menu || _self.get('menu');
      _self._resetSortMenuItems(column, menu);
      _self._resetColumnsVisible(menu);
    },
    //设置菜单项是否选中
    _resetColumnsVisible: function(menu) {
      var _self = this,
        settingItem = menu.findItemById(ID_COLUMNS_SET),
        subMenu = settingItem.get('subMenu') || _self._initColumnsMenu(settingItem),
        columns = _self.get('grid').get('columns');
      subMenu.removeChildren(true);
      $.each(columns, function(index, column) {
        if (!column.get('fixed')) {
          var config = {
              xclass: 'context-menu-item',
              text: column.get('title'),
              column: column,
              iconCls: 'icon'
            },
            menuItem = subMenu.addChild(config);
          if (column.get('visible')) {
            menuItem.set('selected', true);
          }
        }
      });
    },
    //设置排序菜单项是否可用
    _resetSortMenuItems: function(column, menu) {
      var ascItem = menu.findItemById(ID_SORT_ASC),
        descItem = menu.findItemById(ID_SORT_DESC);
      if (column.get('sortable')) {
        ascItem.set('disabled', false);
        descItem.set('disabled', false);
      } else {
        ascItem.set('disabled', true);
        descItem.set('disabled', true);
      }
    },
    //初始化菜单
    _initMenu: function() {
      var _self = this,
        menu = _self.get('menu'),
        menuItems;
      if (!menu) {
        menuItems = _self.get('items');
        $.each(menuItems, function(index, item) {
          if (!item.xclass) {
            item.xclass = 'context-menu-item'
          }
        });
        menu = new Menu.ContextMenu({
          children: menuItems,
          elCls: 'grid-menu'
        });
        _self._initMenuEvent(menu);
        _self.set('menu', menu)
      }
      return menu;
    },
    _initMenuEvent: function(menu) {
      var _self = this;
      menu.on('itemclick', function(ev) {
        var item = ev.item,
          id = item.get('id'),
          activedColumn = _self.get('activedColumn');
        if (id === ID_SORT_ASC) {
          activedColumn.set('sortState', 'ASC');
        } else if (id === ID_SORT_DESC) {
          activedColumn.set('sortState', 'DESC');
        }
      });
      menu.on('afterVisibleChange', function(ev) {
        var visible = ev.newVal,
          activedColumn = _self.get('activedColumn');
        if (visible && activedColumn) {
          activedColumn.set('open', true);
        } else {
          activedColumn.set('open', false);
        }
      });
    },
    _initColumnsMenu: function(settingItem) {
      var subMenu = new Menu.ContextMenu({
        multipleSelect: true,
        elCls: 'grid-column-menu'
      });
      settingItem.set('subMenu', subMenu);
      subMenu.on('itemclick', function(ev) {
        var item = ev.item,
          column = item.get('column'),
          selected = item.get('selected');
        if (selected) {
          column.set('visible', true);
        } else {
          column.set('visible', false);
        }
      });
      return subMenu;
    },
    destructor: function() {
      var _self = this,
        menu = _self.get('menu');
      if (menu) {
        menu.destroy();
      }
      _self.off();
      _self.clearAttrVals();
    }
  });
  module.exports = gridMenu;
});
define("bui/grid/plugins/summary", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 表格数据汇总
   * @author dxq613@gmail.com
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    CLS_GRID_ROW = PREFIX + 'grid-row',
    CLS_GRID_BODY = PREFIX + 'grid-body',
    CLS_SUMMARY_ROW = PREFIX + 'grid-summary-row',
    CLS_GRID_CELL_INNER = PREFIX + 'grid-cell-inner',
    CLS_COLUMN_PREFIX = 'grid-td-',
    CLS_GRID_CELL_TEXT = PREFIX + 'grid-cell-text',
    CLS_GRID_CELL = PREFIX + 'grid-cell';
  /**
   * @private
   * @ignore
   */
  function getEmptyCellTemplate(colspan) {
      if (colspan > 0) {
        return '<td class="' + CLS_GRID_CELL + '" colspan="' + colspan + '">&nbsp;</td>';
      }
      return '';
    }
    /**
     * @private
     * @ignore
     */
  function getCellTemplate(text, id) {
      return '<td class="' + CLS_GRID_CELL + ' ' + CLS_COLUMN_PREFIX + id + '">' + getInnerTemplate(text) + '</td>';
    }
    /**
     * @private
     * @ignore
     */
  function getInnerTemplate(text) {
      return '<div class="' + CLS_GRID_CELL_INNER + '" >' + '<span class="' + CLS_GRID_CELL_TEXT + ' ">' + text + '</span>' + '</div>';
    }
    /**
     * @private
     * @ignore
     */
  function getLastEmptyCell() {
      return '<td class="' + CLS_GRID_CELL + ' ' + CLS_GRID_CELL + '-empty">&nbsp;</td>';
    }
    /**
     * 表格菜单插件
     * <pre><code>
     * var store = new Store({
     *      url : 'data/summary.json',
     *      pageSize : 10,
     *      autoLoad:true
     *    }),
     *    grid = new Grid.Grid({
     *      render:'#grid',
     *      columns : columns,
     *      store: store,
     *      bbar : {pagingBar : true},
     *      plugins : [Grid.Plugins.Summary] // 插件形式引入单选表格
     *    });
     *
     *  grid.render();
     * </code></pre>
     * @class BUI.Grid.Plugins.Summary
     */
  var summary = function(config) {
    summary.superclass.constructor.call(this, config);
  };
  summary.ATTRS = {
    footerTpl: {
      value: '<tfoot></tfoot>'
    },
    footerEl: {},
    /**
     * 总汇总行的标题
     * @type {String}
     * @default '总汇总'
     */
    summaryTitle: {
      value: '查询合计'
    },
    /**
     * 本页汇总的标题
     * @type {String}
     */
    pageSummaryTitle: {
      value: '本页合计'
    },
    /**
     * 在列对象中配置的字段
     * @type {String}
     * @default 'summary'
     */
    field: {
      value: 'summary'
    },
    /**
     * 本页汇总值的记录
     * @type {String}
     */
    pageSummaryField: {
      value: 'pageSummary'
    },
    /**
     * 总汇总值的记录
     * @type {String}
     */
    summaryField: {
      value: 'summary'
    },
    /**
     * @private
     * 本页汇总值
     * @type {Object}
     */
    pageSummary: {},
    /**
     * @private
     * 总汇总
     * @type {Object}
     */
    summary: {}
  };
  BUI.extend(summary, BUI.Base);
  BUI.augment(summary, {
    //初始化
    initializer: function(grid) {
      var _self = this;
      _self.set('grid', grid);
    },
    //添加DOM结构
    renderUI: function(grid) {
      var _self = this,
        bodyEl = grid.get('el').find('.' + CLS_GRID_BODY),
        bodyTable = bodyEl.find('table'),
        footerEl = $(_self.get('footerTpl')).appendTo(bodyTable);
      _self.set('footerEl', footerEl);
    },
    //绑定事件
    bindUI: function(grid) {
      //绑定获取数据
      var _self = this,
        store = grid.get('store');
      if (store) {
        store.on('beforeprocessload', function(ev) {
          _self._processSummary(ev.data);
        });
        store.on('add', function() {
          _self.resetPageSummary();
        });
        store.on('remove', function() {
          _self.resetPageSummary();
        });
        store.on('update', function() {
          _self.resetPageSummary();
        });
      }
      grid.on('aftershow', function() {
        _self.resetSummary();
      });
      grid.get('header').on('afterVisibleChange', function() {
        _self.resetSummary();
      });
    },
    //处理汇总数据
    _processSummary: function(data) {
      var _self = this,
        footerEl = _self.get('footerEl');
      footerEl.empty();
      if (!data) {
        return;
      }
      var pageSummary = data[_self.get('pageSummaryField')],
        summary = data[_self.get('summaryField')];
      _self.set('pageSummary', pageSummary);
      _self.set('summary', summary);
    },
    /**
     * 重新设置本页汇总
     */
    resetPageSummary: function() {
      var _self = this,
        grid = _self.get('grid'),
        columns = grid.get('columns'),
        pageSummary = _self._calculatePageSummary(),
        pageEl = _self.get('pageEl');
      _self.set('pageSummary', pageSummary);
      if (pageEl) {
        BUI.each(columns, function(column) {
          if (column.get('summary') && column.get('visible')) {
            var id = column.get('id'),
              cellEl = pageEl.find('.' + CLS_COLUMN_PREFIX + id),
              text = _self._getSummaryCellText(column, pageSummary);
            cellEl.find('.' + CLS_GRID_CELL_TEXT).text(text);
          }
        });
        _self._updateFirstRow(pageEl, _self.get('pageSummaryTitle'));
      }
    },
    //重置汇总数据
    resetSummary: function(pageSummary, summary) {
      var _self = this,
        footerEl = _self.get('footerEl'),
        pageEl = null;
      footerEl.empty();
      pageSummary = pageSummary || _self.get('pageSummary');
      if (!pageSummary) {
        pageSummary = _self._calculatePageSummary();
        _self.set('pageSummary', pageSummary);
      }
      summary = summary || _self.get('summary');
      pageEl = _self._creatSummaryRow(pageSummary, _self.get('pageSummaryTitle'));
      _self.set('pageEl', pageEl);
      _self._creatSummaryRow(summary, _self.get('summaryTitle'));
    },
    //创建汇总
    _creatSummaryRow: function(summary, title) {
      if (!summary) {
        return null;
      }
      var _self = this,
        footerEl = _self.get('footerEl'),
        tpl = _self._getSummaryTpl(summary),
        rowEl = $(tpl).appendTo(footerEl);
      _self._updateFirstRow(rowEl, title);
      return rowEl;
    },
    _updateFirstRow: function(rowEl, title) {
      var firstCell = rowEl.find('td').first(),
        textEl = firstCell.find('.' + CLS_GRID_CELL_INNER);
      if (textEl.length) {
        var textPrefix = title + ': ';
        text = textEl.text();
        if (text.indexOf(textPrefix) === -1) {
          text = textPrefix + text;
        }
        firstCell.html(getInnerTemplate(text));
      } else {
        firstCell.html(getInnerTemplate(title + ':'));
      }
    },
    //获取汇总模板
    _getSummaryTpl: function(summary) {
      var _self = this,
        grid = _self.get('grid'),
        columns = grid.get('columns'),
        cellTempArray = [],
        prePosition = -1, //上次汇总列的位置
        currentPosition = -1, //当前位置
        rowTemplate = null;
      $.each(columns, function(colindex, column) {
        if (column.get('visible')) {
          currentPosition += 1;
          if (column.get('summary')) {
            cellTempArray.push(getEmptyCellTemplate(currentPosition - prePosition - 1));
            var text = _self._getSummaryCellText(column, summary),
              temp = getCellTemplate(text, column.get('id'));
            cellTempArray.push(temp);
            prePosition = currentPosition;
          }
        }
      });
      if (prePosition !== currentPosition) {
        cellTempArray.push(getEmptyCellTemplate(currentPosition - prePosition));
      }
      rowTemplate = ['<tr class="', CLS_SUMMARY_ROW, ' ', CLS_GRID_ROW, '">', cellTempArray.join(''), getLastEmptyCell(), '</tr>'].join('');
      return rowTemplate;
    },
    //获取汇总单元格内容
    _getSummaryCellText: function(column, summary) {
      var _self = this,
        val = summary[column.get('dataIndex')],
        value = val == null ? '' : val,
        renderer = column.get('renderer'),
        text = renderer ? renderer(value, summary) : value;
      return text;
    },
    _calculatePageSummary: function() {
      var _self = this,
        grid = _self.get('grid'),
        store = grid.get('store'),
        columns = grid.get('columns'),
        rst = {};
      BUI.each(columns, function(column) {
        if (column.get('summary')) {
          var dataIndex = column.get('dataIndex');
          rst[dataIndex] = store.sum(dataIndex);
        }
      });
      return rst;
    }
  });
  module.exports = summary;
});
define("bui/grid/plugins/rownumber", [], function(require, exports, module) {
  var CLS_NUMBER = 'x-grid-rownumber';
  /**
   * @class BUI.Grid.Plugins.RowNumber
   * 表格显示行序号的插件
   */
  function RowNumber(config) {
    RowNumber.superclass.constructor.call(this, config);
  }
  BUI.extend(RowNumber, BUI.Base);
  RowNumber.ATTRS = {
    /**
     * column's width which contains the row number
     */
    width: {
      value: 40
    },
    /**
     * @private
     */
    column: {}
  };
  BUI.augment(RowNumber, {
    //创建行
    createDom: function(grid) {
      var _self = this;
      var cfg = {
          title: '',
          width: _self.get('width'),
          fixed: true,
          resizable: false,
          sortable: false,
          renderer: function(value, obj, index) {
            return index + 1;
          },
          elCls: CLS_NUMBER
        },
        column = grid.addColumn(cfg, 0);
      _self.set('column', column);
    }
  });
  module.exports = RowNumber;
});
define("bui/grid/plugins/columngroup", ["jquery", "bui/common"], function(require, exports, module) {
  var $ = require('jquery'),
    BUI = require("bui/common"),
    PREFIX = BUI.prefix,
    CLS_HD_TITLE = PREFIX + 'grid-hd-title',
    CLS_GROUP = PREFIX + 'grid-column-group',
    CLS_GROUP_HEADER = PREFIX + 'grid-group-header',
    CLS_DOUBLE = PREFIX + 'grid-db-hd';
  /**
   * 表头列分组功能
   * @class BUI.Grid.Plugins.ColumnGroup
   * @extends BUI.Base
   */
  var Group = function(cfg) {
    Group.superclass.constructor.call(this, cfg);
  };
  Group.ATTRS = {
    /**
     * 分组
     * @type {Array}
     */
    groups: {
      value: []
    },
    /**
     * 列模板
     * @type {String}
     */
    columnTpl: {
      value: '<th class="bui-grid-hd center" colspan="{colspan}"><div class="' + PREFIX + 'grid-hd-inner">' + '<span class="' + CLS_HD_TITLE + '">{title}</span>' + '</div></th>'
    }
  };
  BUI.extend(Group, BUI.Base);
  BUI.augment(Group, {
    renderUI: function(grid) {
      var _self = this,
        groups = _self.get('groups'),
        header = grid.get('header'),
        headerEl = header.get('el'),
        columns = header.get('children'),
        wraperEl = $('<tr class="' + CLS_GROUP + '"></tr>').prependTo(headerEl.find('thead'));
      headerEl.addClass(CLS_GROUP_HEADER);
      //遍历分组，标志分组
      BUI.each(groups, function(group) {
        var tpl = _self._getGroupTpl(group),
          gEl = $(tpl).appendTo(wraperEl);
        group.el = gEl;
        for (var i = group.from; i <= group.to; i++) {
          var column = columns[i];
          if (column) {
            column.set('group', group);
          }
        }
      });
      var afterEl;
      //修改未分组的rowspan和调整位置
      for (var i = columns.length - 1; i >= 0; i--) {
        var column = columns[i],
          group = column.get('group');
        if (group) {
          afterEl = group.el;
        } else {
          var cEl = column.get('el'); //$(_self.get('emptyTpl'));
          cEl.addClass(CLS_DOUBLE);
          cEl.attr('rowspan', 2);
          if (afterEl) {
            cEl.insertBefore(afterEl);
          } else {
            cEl.appendTo(wraperEl);
          }
          afterEl = cEl;
        }
      }
      if (groups[0].from !== 0) { //处理第一个单元格边框问题
        var firstCol = columns[groups[0].from];
        if (firstCol) {
          firstCol.get('el').css('border-left-width', 1);
        }
      }
      //移除空白列
    },
    _getGroupTpl: function(group) {
      var _self = this,
        columnTpl = _self.get('columnTpl'),
        colspan = group.to - group.from + 1;
      return BUI.substitute(columnTpl, {
        colspan: colspan,
        title: group.title
      });
    }
  });
  module.exports = Group;
});
define("bui/grid/plugins/rowgroup", ["jquery", "bui/common"], function(require, exports, module) {
  var $ = require('jquery'),
    BUI = require("bui/common"),
    DATA_GROUP = 'data-group',
    PREFIX = BUI.prefix,
    CLS_GROUP = PREFIX + 'grid-row-group',
    CLS_TRIGGER = PREFIX + 'grid-cascade',
    CLS_EXPAND = PREFIX + 'grid-cascade-expand';
  //新的分组
  function newGroup(value, text) {
      return {
        items: [],
        value: value,
        text: text
      };
    }
    /**
     * 表头列分组功能，仅处理数据展示，排序，不处理这个过程中的增删改，添加删除列
     * @class BUI.Grid.Plugins.RowGroup
     * @extends BUI.Base
     */
  var Group = function(cfg) {
    Group.superclass.constructor.call(this, cfg);
  };
  Group.ATTRS = {
    groups: {
      shared: false,
      value: []
    },
    /**
     * 渲染分组内容，函数原型 function(text,group){}
     *
     *  - text 是分组字段格式化后的文本
     *  - group 是当前分组，包括,text(文本）,value（值）,items（分组包含的项）
     * @type {Function}
     */
    renderer: {}
  };
  BUI.extend(Group, BUI.Base);
  BUI.augment(Group, {
    renderUI: function(grid) {
      var _self = this,
        tbodyEl = grid.get('el').find('tbody');
      _self.set('grid', grid);
      _self.set('tbodyEl', tbodyEl);
    },
    bindUI: function(grid) {
      var _self = this,
        groups = [];
      //显示完成记录时
      grid.on('aftershow', function() {
        var items = grid.getItems(),
          column = _self._getSortColumn();
        _self._clear();
        if (column) {
          grid.get('view').getAllElements().hide();
          var field = column.get('dataIndex');
          BUI.each(items, function(item, index) {
            var last = groups[groups.length - 1],
              renderer = column.get('renderer'),
              value = item[field],
              text;
            if (!last || value != last.value) {
              text = renderer ? renderer(value, item) : value;
              var current = newGroup(value, text);
              current.begin = index;
              groups.push(current);
              last && _self._createGroup(last);
              last = current;
            }
            last.items.push(item);
          });
          var last = groups[groups.length - 1];
          last && _self._createGroup(last);
          _self.set('groups', groups);
        }
      });
      //清除所有记录时
      grid.on('clear', function() {
        _self._clear();
      });
      _self.get('tbodyEl').delegate('.' + CLS_TRIGGER, 'click', function(ev) {
        var sender = $(ev.currentTarget),
          group = _self._getGroupData(sender);
        if (sender.hasClass(CLS_EXPAND)) {
          _self._collapse(group);
          sender.removeClass(CLS_EXPAND);
        } else {
          _self._expand(group);
          sender.addClass(CLS_EXPAND);
        }
      });
    },
    //获取排序的字段对应的列
    _getSortColumn: function() {
      var _self = this,
        grid = _self.get('grid'),
        store = grid.get('store'),
        field = store.get('sortField');
      return grid.findColumnByField(field);
    },
    //获取分组的数据
    _getGroupData: function(el) {
      var _self = this,
        groupEl = el.closest('.' + CLS_GROUP);
      return groupEl.data(DATA_GROUP);
    },
    _createGroup: function(group) {
      var _self = this,
        grid = _self.get('grid'),
        item = group.items[0],
        firstEl = grid.findElement(item),
        count = grid.get('columns').length,
        renderer = _self.get('renderer'),
        text = renderer ? renderer(group.text, group) : group.text,
        tpl = '<tr class="' + CLS_GROUP + '"><td colspan="' + (count + 1) + '"><div class="bui-grid-cell-inner"><span class="bui-grid-cell-text"><span class="bui-grid-cascade"><i class="bui-grid-cascade-icon"></i></span> ' + text + '</span></div></td></tr>',
        node = $(tpl).insertBefore(firstEl);
      node.data(DATA_GROUP, group);
    },
    _getGroupedElements: function(group) {
      var _self = this,
        grid = _self.get('grid'),
        elements = grid.get('view').getAllElements(),
        begin = group.begin,
        end = group.items.length + begin,
        rst = [];
      for (var i = begin; i < end; i++) {
        rst.push(elements[i]);
      }
      return $(rst);
    },
    _expand: function(group) {
      var _self = this,
        subEls = _self._getGroupedElements(group);
      subEls.show();
    },
    _collapse: function(group) {
      var _self = this,
        subEls = _self._getGroupedElements(group);
      subEls.hide();
    },
    _clear: function() {
      var _self = this,
        groups = _self.get('groups'),
        tbodyEl = _self.get('tbodyEl');
      BUI.Array.empty(groups);
      tbodyEl.find('.' + CLS_GROUP).remove();
    }
  });
  module.exports = Group;
});
define("bui/grid/plugins/columnresize", ["jquery", "bui/common"], function(require, exports, module) {
  /**
   * @fileOverview 拖拽改变列的宽度
   * @ignore
   */
  var $ = require('jquery'),
    BUI = require("bui/common"),
    NUM_DIS = 15,
    NUM_MIN = 30,
    STYLE_CURSOR = 'col-resize';
  var Resize = function(cfg) {
    Resize.superclass.constructor.call(this, cfg);
  };
  Resize.ATTRS = {
    /**
     * @private
     * 是否正在拖拽
     * @type {Boolean}
     */
    resizing: {
      value: false
    },
    //拖拽属性
    draging: {}
  };
  BUI.extend(Resize, BUI.Base);
  BUI.augment(Resize, {
    renderUI: function(grid) {
      this.set('grid', grid);
    },
    bindUI: function(grid) {
      var _self = this,
        header = grid.get('header'),
        curCol,
        preCol,
        direction;
      header.get('el').delegate('.bui-grid-hd', 'mouseenter', function(ev) {
        var resizing = _self.get('resizing');
        if (!resizing) {
          var sender = ev.currentTarget;
          curCol = _self._getColumn(sender);
          preCol = _self._getPreCol(curCol);
        }
      }).delegate('.bui-grid-hd', 'mouseleave', function(ev) {
        var resizing = _self.get('resizing');
        if (!resizing && curCol) {
          curCol.get('el').css('cursor', '');
          curCol = null;
        }
      }).delegate('.bui-grid-hd', 'mousemove', function(ev) {
        var resizing = _self.get('resizing');
        if (!resizing && curCol) {
          var el = curCol.get('el'),
            pageX = ev.pageX,
            offset = el.offset(),
            left = offset.left,
            width = el.width();
          if (pageX - left < NUM_DIS && preCol) {
            el.css('cursor', STYLE_CURSOR);
            direction = -1;
          } else if ((left + width) - pageX < NUM_DIS) {
            direction = 1;
            el.css('cursor', STYLE_CURSOR);
          } else {
            curCol.get('el').css('cursor', '');
          }
        }
        if (resizing) {
          ev.preventDefault();
          var draging = _self.get('draging'),
            start = draging.start,
            pageX = ev.pageX,
            dif = pageX - start,
            width = direction > 0 ? curCol.get('width') : preCol.get('width'),
            toWidth = width + dif;
          if (toWidth > NUM_MIN && toWidth < grid.get('el').width()) {
            draging.end = pageX;
            _self.moveDrag(pageX);
          }
        }
      }).delegate('.bui-grid-hd', 'mousedown', function(ev) {
        var resizing = _self.get('resizing');
        if (!resizing && curCol && curCol.get('el').css('cursor') == STYLE_CURSOR) {
          ev.preventDefault();
          _self.showDrag(ev.pageX);
          bindDraging();
        }
      });

      function callback(ev) {
        var draging = _self.get('draging')
        if (curCol && draging) {
          var col = direction > 0 ? curCol : preCol,
            width = col.get('width'),
            dif = draging.end - draging.start;
          _self.hideDrag();
          if (grid.get('forceFit')) {
            var originWidth = col.get('originWidth'),
              factor = width / originWidth,
              toWidth = (width + dif) / factor;
            // console.log(originWidth + ' ,'+width);
            col.set('originWidth', toWidth);
            col.set('width', toWidth);
            //
          } else {
            col.set('width', width + dif);
          }
        }
        $(document).off('mouseup', callback);
      }

      function bindDraging() {
        $(document).on('mouseup', callback);
      }
    },
    //显示拖拽
    showDrag: function(pageX) {
      var _self = this,
        grid = _self.get('grid'),
        header = grid.get('header'),
        bodyEl = grid.get('el').find('.bui-grid-body'),
        height = header.get('el').height() + bodyEl.height(),
        offset = header.get('el').offset(),
        dragEl = _self.get('dragEl');
      if (!dragEl) {
        var tpl = '<div class="bui-drag-line"></div>';
        dragEl = $(tpl).appendTo('body');
        _self.set('dragEl', dragEl);
      }
      dragEl.css({
        top: offset.top,
        left: pageX,
        height: height
      });
      _self.set('resizing', true);
      _self.set('draging', {
        start: pageX,
        end: pageX
      });
      dragEl.show();
    },
    //关闭拖拽
    hideDrag: function() {
      var _self = this,
        dragEl = _self.get('dragEl');
      dragEl && dragEl.hide();
      _self.set('draging', null);
      _self.set('resizing', false);
    },
    //移动drag
    moveDrag: function(pageX) {
      var _self = this,
        dragEl = _self.get('dragEl');
      dragEl && dragEl.css('left', pageX);
    },
    //获取点击的列
    _getColumn: function(element) {
      var _self = this,
        columns = _self.get('grid').get('columns'),
        rst = null;
      BUI.each(columns, function(column) {
        if (column.containsElement(element)) {
          rst = column;
          return false;
        }
      });
      return rst;
    },
    //获取前一个列
    _getPreCol: function(col) {
      var _self = this,
        columns = _self.get('grid').get('columns'),
        rst = null;
      BUI.each(columns, function(column, index) {
        if (column == col) {
          return false;
        } else if (column.get('visible')) {
          rst = column;
        }
      });
      return rst;
    }
  });
  module.exports = Resize;
});
define("bui/grid/plugins/columnchecked", ["jquery", "bui/common"], function(require, exports, module) {
  var $ = require('jquery'),
    BUI = require("bui/common");
  /**
   * 表格自适应宽度
   * @class BUI.Grid.Plugins.ColumnChecked
   * @extends BUI.Base
   */
  var Checked = function(cfg) {
    Checked.superclass.constructor.call(this, cfg);
  };
  BUI.extend(Checked, BUI.Base);
  Checked.ATTRS = {
    /**
     * 触发的样式，默认 ： x-col-checkbox
     * @type {String}
     */
    triggerCls: {
      value: 'x-col-checkbox'
    },
    /**
     * 未选中的模板
     * @type {String}
     */
    uncheckedTpl: {
      value: '<span class="x-col-checkbox"></span>'
    },
    /**
     * 选中的模板
     * @type {String}
     */
    checkedTpl: {
      value: '<span class="x-col-checkbox x-col-checkbox-checked"></span>'
    }
  };
  BUI.augment(Checked, {
    renderUI: function(grid) {
      var _self = this,
        columns = grid.get('columns'),
        uncheckedTpl = _self.get('uncheckedTpl'),
        checkedTpl = _self.get('checkedTpl');
      BUI.each(columns, function(column) {
        if (column.get('checkable')) {
          var renderer = column.get('renderer');
          var newRender = function(value, obj) {
            var text = renderer ? renderer(value, obj) : '';
            if (value) {
              text = checkedTpl + text;
            } else {
              text = uncheckedTpl + text;
            }
            return text;
          };
          column.set('renderer', newRender);
        }
      });
    },
    bindUI: function(grid) {
      var _self = this,
        triggerCls = _self.get('triggerCls'),
        store = grid.get('store');
      grid.on('cellclick', function(ev) {
        var sender = $(ev.domTarget);
        if (sender.hasClass(triggerCls)) {
          var record = ev.record,
            field = ev.field,
            value = record[field];
          store.setValue(record, field, !value);
          return false; //阻止默认行为
        }
      });
    }
  });
  module.exports = Checked;
});
(function () {
  
  if(BUI.loaderScript.getAttribute('data-auto-use') == 'false'){
    return;
  }
  BUI.use(['bui/common','bui/data','bui/list','bui/picker',
    'bui/menu','bui/toolbar',
    'bui/form','bui/mask','bui/select','bui/tab',
    'bui/calendar','bui/overlay','bui/editor','bui/grid','bui/tooltip'
  ]);
})();