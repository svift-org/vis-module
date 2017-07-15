/*
* 
* 
* 
*/

SVIFT.vis = {};
SVIFT.vis.base = (function (data, root) {

  var module = {};

  module.data = data;
  module.root = root;
  module.svg = null;

  module.config = {
    maxWidth : 4096,
    maxHeight : 4096,
    margin : {
      //TODO: Margin should have a minimum and then be relative %
      top: 10,
      right: 10,
      bottom: 25,
      left: 35
    }
  };

  module.init = function () {
    module.svg = root.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('g')
        .attr('transform','translate('+module.config.margin.top+','+module.config.margin.left+')');

    module.setup();
    module.resize();

    d3.select(window).on('resize', SVIFT.helper.debouncer(function(e){
      module.resize();
    }, 200));
  };

  module.setup = function () {
  };

  module.resize = function () {
  };

  return module;
});