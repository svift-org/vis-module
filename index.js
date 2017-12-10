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
  module.scale = false;

  var screenHeight, screenWidth;

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
        "500":16,
        "0":14
      },
      default: "14px"
    },
    paddingTopText: 20,
    paddingBottomText: 20,
  };

  module.timeline = {
    //Start and End are in Milliseconds, func receives a value between 0 and 1, obj is a container to store related info e.g. easing, etc.
    //rect:{start:0, end:3000, func:module.drawRect, obj:{}}
  };

  module.init = function () {

    screenWidth = module.container.node().offsetWidth;
    screenHeight = module.container.node().offsetHeight;
    var fontSize;
    for( var key in module.config.font.sizes ){
      if(screenWidth>=key){
        fontSize = module.config.font.sizes[key]
      }
    }

    module.svg = module.container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      //.attr('font-size', fontSize)
      //background-color setting
      //ToDo > Transparent for Video
      .style('background-color','#ffffff');
      .attr("viewBox", "0 0 " + screenWidth + " " + screenHeight);

    module.defs = module.svg.append('defs');
    module.g = module.svg.append('g')
      .attr('transform','translate('+module.config.margin.top+','+module.config.margin.left+')');

    //Text Top
    module.config.topTextWrapper = module.g.append("g")
      .attr("text-anchor", "middle")
      .attr("class", "title-wrapper" )
      .attr("font-family", data.style.font)

    module.config.titleMain = module.config.topTextWrapper.append("text")
      .text(data.data.title)
      .attr("font-size", "1.7em")
      .attr("fill", data.style.color.main)
      .attr("id", "title-main")

    module.config.titleSub = module.config.topTextWrapper.append("text")
      .text(data.data.subTitle)
      .attr("font-size", "1em")
      .attr("fill", data.style.color.second)
      .attr("id", "title-sub")

    //Text Bottom
    module.config.bottomTextWrapper = module.g.append("g")
      .attr("font-family", "InterfaceRegular")

    module.config.attribution = module.config.bottomTextWrapper
      .append("text")
      .text(data.data.attribution)
      .attr("font-size", module.config.font.default)
      .attr("fill", data.style.color.second)
      .attr("font-style","italic")
      // .attr("id", "attribution")

    module.config.source = module.config.bottomTextWrapper
      .append("text")
      .text(data.data.source)
      .attr("font-size", module.config.font.default)
      .attr("fill", data.style.color.second)
      .attr("id", "source")

    //Make a Viz Container
    module.config.vizContainer = module.g
      .append("g")
      .attr("class", "viz-container")


    module.playHead = 0;

    module.setup();
    module.resizeText()
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

      module.preResize();
      if(!module.scale){
        module.resizeText();
        module.resize();
      }

    }, 200));
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
    screenWidth = module.container.node().offsetWidth;
    screenHeight = module.container.node().offsetHeight;
    if(!module.scale){
      module.svg.attr("viewBox", "0 0 " + screenWidth + " " + screenHeight)
    }
  };

  module.setScale = function(s){
    module.scale = s;
  }

  module.resize = function () {
    //Resize should consider height and width (e.g. Bootstrap 16-9 resizes height and width of embed elements)
    //For some weird reason phantom resizes the page before every rendering, pay attention to this problem
  };

  //function that resizes/positions the text
  module.resizeText = function(){

    var fontSize;
    for( var key in module.config.font.sizes ){
      if(screenWidth>=key){
        fontSize = module.config.font.sizes[key]
      }
    }
    if(screenWidth<=500){
      module.config.margin.top=15;
      module.config.margin.right=15;
      module.config.margin.left=15;
      module.config.margin.bottom=15;
    }

    module.svg
      .attr('font-size', fontSize)

    var vizWidth = module.container.node().offsetWidth - module.config.margin.left - module.config.margin.right;
    var vizCenter = vizWidth/2;

    module.config.titleMain
      .attr("x", vizCenter)
      .attr("y", function(){
        module.config.titleMainHeight = this.getBBox().height
        return module.config.titleMainHeight
      })

    module.config.titleSub
      .attr("x", vizCenter)
      .attr("y", function(){
        return (module.config.titleMainHeight + this.getBBox().height + 5)
      })

    module.config.bottomTextWrapper
      .attr('transform','translate(0,'+ (module.container.node().offsetHeight - module.config.margin.top - module.config.margin.bottom) +')')

    module.config.attribution
      .attr("x", function(){
        return vizWidth - this.getBBox().width
      })

    module.config.source
      .attr("x", 0)


    module.config.topTextHeight = module.config.topTextWrapper.node().getBBox().height + module.config.paddingTopText;
    module.config.bottomTextHeight = module.config.bottomTextWrapper.node().getBBox().height + module.config.paddingBottomText ;

    module.config.vizContainer
      .attr('transform','translate(0,'+ module.config.topTextHeight +')')
  }

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