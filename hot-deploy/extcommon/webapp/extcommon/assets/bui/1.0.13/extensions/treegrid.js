define("bui/extensions/treegrid", ["bui/common", "jquery", "bui/tree", "bui/list", "bui/data", "bui/grid", "bui/mask", "bui/toolbar", "bui/menu"], function(require, exports, module) {
  /**
   * @fileOverview Tree Grid
   * @ignore
   */
  var BUI = require("bui/common"),
    Tree = require("bui/tree"),
    Grid = require("bui/grid");
  /**
   * @class BUI.Extensions.TreeGrid
   * 树型结构的表格，注意此种表格不要跟分页控件一起使用
   * @extends BUI.Grid.Grid
   */
  var TreeGrid = Grid.Grid.extend([Tree.Mixin], {}, {
    ATTRS: {
      iconContainer: {
        value: '.bui-grid-cell-inner'
      }
    }
  }, {
    xclass: 'tree-grid'
  });
  module.exports = TreeGrid;
});