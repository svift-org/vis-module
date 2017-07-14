/*
* 
* 
* 
*/

SVIFT.vis = {};
SVIFT.vis.base = (function (data, root) {
 
  var module = {};

  module.config = {
    root:root,
    data:data,
    maxWidth : 4096,
    maxHeight : 4096,
    margin : {
      top: 10,
      right: 10,
      bottom: 25,
      left: 35
    }
  };

  module.init = function () {
    module.config.root.append('svg')
      .style('width','100%')
      .style('height','100%')
      .attr('width', '100%')
      .attr('height', '100%');

    d3.select(window).on('resize', SVIFT.helper.debouncer(function(e){
      module.resize();
    }, 200));
  };

  module.resize = function () {
    console.log('resize');
  };

  return module;
});