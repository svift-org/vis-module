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
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  };

  module.timeline = {
    //Start and End are in Milliseconds, func receives a value between 0 and 1, obj is a container to store related info e.g. easing, etc.
    //rect:{start:0, end:3000, func:module.drawRect, obj:{}}
  };

  module.init = function () {
    module.svg = module.container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      //temporary testing for phantom rendering
      .style('background-color','#ffffff');

    module.defs = module.svg.append('defs');
    module.g = module.svg.append('g')
      .attr('transform','translate('+module.config.margin.top+','+module.config.margin.left+')');

    module.playHead = 0;

    module.setup();
    module.resize();

    for( var key in module.timeline ){
      var tl = module.timeline[key];
      if(module.playTime < tl.end){
        module.playTime = tl.end;
      }
    }

    module.time.step = module.playTime / (module.playTime/1000*module.time.fps);

    if (typeof window.callPhantom === 'function') {
      window.callPhantom({ msg: 'setupDone' });
    }

    d3.select(window).on('resize', SVIFT.helper.debouncer(function(e){
      module.resize();
    }, 200));
  };

  module.setup = function () {
  };

  module.resize = function () {
    //Resize should consider height and width (e.g. Bootstrap 16-9 resizes height and width of embed elements)
    //For some weird reason phantom resizes the page before every rendering, pay attention to this problem
  };

  module.draw = function (t) {
    for( var key in module.timeline ){
      var tl = module.timeline[key];
      if(tl.start <= t && tl.end >= t){
        tl.func((t-tl.start)/(tl.end-tl.start));
      }else if(t > tl.end){
        //Making sure it sits on its end position, also for the goto function
        tl.func(1);
      }
    }
  };

  module.playHead = 0;
  module.playState = false;
  module.playTime = 0;
  module.time = {
    fps : 30,
    step: 0,
    elapsed : 0,
    fpsInterval : 1000 / 30, //30 fps
    then : 0,
    startTime : 0,
    now : 0
  };

  module.play = function () {
    if(module.playState){
      if (typeof window.callPhantom === 'function') {
        //Node.JS rendering
        module.playHead += module.time.step;
        if(module.playHead <= module.playTime){
          module.draw(module.playHead);
          //Node.js calls the play method again after rendering is done
          window.callPhantom({ msg: 'drawDone', playHead: module.playHead });
        }else{
          //Draw one last frame to make sure no rounding error messed things up
          module.playHead = module.playTime;
          module.draw(module.playHead);
          //Let node.js know we are done.
          module.pause();
          window.callPhantom({ msg: 'playDone' });
        }
      }else{
        //Standard Web Implementation
        if(module.time.then === 0){
          module.time.then = module.time.startTime = Date.now();
        }

        module.time.now = Date.now();
        module.time.elapsed = module.time.now - module.time.then;

        if((module.time.now - module.time.startTime) <= module.playTime){
          window.requestAnimationFrame(module.play);

          if (module.time.elapsed > module.time.fpsInterval) {
            module.time.then = module.time.now - (module.time.elapsed % module.time.fpsInterval);
            module.playHead = (module.time.now - module.time.startTime);
            module.draw(module.playHead);
          }
        }else{
          module.playHead = module.playTime;
          module.goTo(1);
          module.pause();
        }     
      }
    }
  };

  module.start = function () {
    module.playState  = true;
    module.play();
  };

  module.pause = function () {
    module.playState = false;
  };

  module.goTo = function (t) {
    if(t<=module.playTime){
      module.playHead = t*module.playTime;
      module.draw(module.playHead);
    }
    module.pause();
  };

  return module;
});