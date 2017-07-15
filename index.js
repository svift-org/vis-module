/*
* 
* 
* 
*/

SVIFT.vis = {};
SVIFT.vis.base = (function (data, container) {

  var module = {};

  module.data = data;
  module.container = container;
  module.g = null;
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
    console.log(module.container.node().getBBox());
    module.svg = module.container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%');

    module.g = module.svg.append('g')
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