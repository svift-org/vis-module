/*
* 
* 
* 
*/

SVIFT.vis = {};
SVIFT.vis.base = (function (data, container) {

  var module = {};

  module.data = data;
  module.setData = function(data){
    module.data = data;
  };

  module.container = container;
  module.g = null;
  module.svg = null;
  module.scale = false;
  module.vizContainer = null;
  module.vizSize = {width:500,height:500};
  module.containerSize = {width:0,height:0};

  module.config = {
    maxWidth : 4096,
    maxHeight : 4096,
    margin : {
      //TODO: Margin should have a minimum and then be relative %
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    font:{
      sizes:{
        // "1000": 20,
        "450":15,
        "0":13
      },
      default: "13px"
    },
    footerHeight: 40,
  };

  module.text = {};

  module.timeline = {
    //Start and End are in Milliseconds, func receives a value between 0 and 1, obj is a container to store related info e.g. easing, etc.
    //rect:{start:0, end:3000, func:module.drawRect, obj:{}}
  };

  module.init = function () {

    module.containerSize.width = module.container.node().offsetWidth;
    module.containerSize.height = module.container.node().offsetHeight;
    module.vizSize.width = module.containerSize.width - module.config.margin.right - module.config.margin.left;
    module.vizSize.height = module.containerSize.height;
    
    module.svg = module.container.append('svg')
      .attr("viewBox", "0 0 " + module.containerSize.width + " " + module.containerSize.height)
      .attr('class', module.data.style.theme);

    module.defs = module.svg.append('defs');

    module.g = module.svg.append('g')
      .attr('transform','translate('+module.config.margin.top+','+module.config.margin.left+')');

    //Text Top
    module.text.head = module.g.append('g')
      .attr('class', 'title-wrapper');

    module.text.title = module.text.head.append('text').attr('class', 'titleFont');

    module.text.subtitle = module.text.head.append('text').attr('class', 'subtitleFont');

    //Text Bottom
    //TODO: Move all the font declarations to the stylesheet so we can easily apply themes and change the fonts etc.
    module.text.foot = module.g.append("g")
      .attr('class', 'bottomTextWrapper');

    module.text.attribution = module.text.foot
      .append("text")
      .text(data.data.attribution)
      .attr('class', 'attribution');

    module.text.source = module.text.foot
      .append('text')
      .text(data.data.source)
      .attr('class', 'source');

    //Make a Viz Container
    module.vizContainer = module.g
      .append("g")
      .attr("class", "viz-container")

    module.playHead = 0;

    module.updateHead();
    //module.setup();
    //module.resize();

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

      module.preResize();
      if(!module.scale){
        module.resize();
      }

    }, 200));
  };

  module.updateHead = function(){
    /*TODO: get current width, transform accordingly font-family/size via css
    record height for vizSize*/

      var headlineMax = 30,
          fontHeight = 0,
          headlineHeight = 0,
          headlineLineHeight = 1.1,
          headlineSize = headlineMax;

      if(data.data.title.length > 0){
          var lines = data.data.title.split('\n');

          lines.forEach(function(l){
              var localSize = headlineMax,
                  line = module.text.title.append('tspan')
                      .text(l)
                      .style('font-size', localSize);
              while(line.node().getComputedTextLength() > (module.vizSize.width) || localSize < 5){
                  localSize--;
                  line.style('font-size', localSize);
              }
              if(headlineSize>localSize){
                  headlineSize = localSize;
              }
          });

          module.text.title.selectAll('tspan')
            .style('font-size', headlineSize);

          headlineHeight = (headlineSize*headlineLineHeight) * (lines.length - 1) + headlineSize;
      }

      var copyMax = 15,
          copyLineHeight = 1.1,
          copyHeight = 0,
          copySize = (copyMax > headlineSize)?headlineSize*0.75:copyMax;

      if(data.data.subtitle.length > 0){
          lines = data.data.subtitle.split('\n');

          module.text.subtitle.style('transform','translate(0,'+headlineHeight+')');

          lines.forEach(function(l){
              var localSize = copyMax,
                  line = module.text.subtitle.append('tspan')
                      .text(l)
                      .style('font-size', localSize);
              while(line.node().getComputedTextLength() > (module.vizSize.width) || localSize < 5){
                  localSize--;
                  line.style('font-size', localSize);
              }
              if(copySize>localSize){
                  copySize = localSize;
              }
          });

          module.text.subtitle.selectAll('tspan')
              .style('font-size', copySize);

          copyHeight += copySize*1.25 + (copySize * copyLineHeight)*(lines.length-1);
      }

      module.vizContainer
        .attr('transform','translate(0,'+ (copyHeight+headlineHeight) +')');

      module.vizSize.height = module.containerSize.height-(copyHeight+headlineHeight)-config.margin.top-config.margin.bottom-config.footerHeight;

      module.resize();
      module.draw(module.playHead);
  };



  module.updateSource = function(){
    module.text.source.text(data.data.source);
  };

  //temporary workaround to jump back to the beginning of the timeline
  module.reset = function () {
    module.container.selectAll('*').remove();
    module.init();
  };

  //function that processes the data
  module.process = function () {
  };

  //initial function for setting things up initially
  module.setup = function () {
  };

  //all the drawing should be done in here
  module.update = function () {
  };

  module.preResize = function() {
    module.containerSize.width = module.container.node().offsetWidth;
    module.containerSize.height = module.container.node().offsetHeight;
    if(!module.scale){
      module.svg.attr("viewBox", "0 0 " + module.containerSize.width + " " + module.containerSize.height)
    }
  };

  module.setScale = function(s){
    module.scale = s;
  }

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