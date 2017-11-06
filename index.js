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
    },
    font:{
      sizes:{
        "1500": 25,
        "1000": 20,
        "0":16
      },
      default: "16px"
    },
    paddingTopText: 20
  };

  module.timeline = {
    //Start and End are in Milliseconds, func receives a value between 0 and 1, obj is a container to store related info e.g. easing, etc.
    //rect:{start:0, end:3000, func:module.drawRect, obj:{}}
  };

  module.init = function () {

    var screenWidth = module.container.node().offsetWidth;
    var fontSize;
    for( var key in module.config.font.sizes ){
      if(screenWidth>=key){
        fontSize = module.config.font.sizes[key]
      }
    }

    module.svg = module.container.append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('font-size', fontSize) //font size match function goeas here
      //temporary testing for phantom rendering
      .style('background-color','#ffffff');

    module.defs = module.svg.append('defs');
    module.g = module.svg.append('g')
      .attr('transform','translate('+module.config.margin.top+','+module.config.margin.left+')');


    //Text Top
    module.d3config.topTextWrapper = module.g.append("g")
      .attr("text-anchor", "middle")
      .attr("class", "title-wrapper" )
      .attr("font-family", data.style.font)

    module.d3config.titleMain = module.d3config.topTextWrapper.append("text")
      .text(data.data.title)
      .attr("font-size", "1.7em")
      .attr("fill", data.style.color.main)

    module.d3config.titleSub = module.d3config.topTextWrapper.append("text")
      .text(data.data.subTitle)
      .attr("font-size", "1em")
      .attr("fill", data.style.color.second)

    //Text Bottom
    module.d3config.bottomTextWrapper = module.g.append("g")
      .attr("font-family", data.style.font)

    module.d3config.attribution = module.d3config.bottomTextWrapper
      .append("text")
      .text(data.data.attribution)
      .attr("font-size", module.config.font.default)
      .attr("fill", data.style.color.second)

    module.d3config.source = module.d3config.bottomTextWrapper
      .append("text")
      .text(data.data.source)
      .attr("font-size", module.config.font.default)
      .attr("fill", data.style.color.second)

    //Make a Viz Container
    module.d3config.vizContainer = module.g
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

      module.resizeText()
      module.resize();
      

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

  module.resize = function () {
    //Resize should consider height and width (e.g. Bootstrap 16-9 resizes height and width of embed elements)
    //For some weird reason phantom resizes the page before every rendering, pay attention to this problem
  };

  //function that resizes/positions the text
  module.resizeText = function(){

    var vizWidth = module.container.node().offsetWidth - module.config.margin.left - module.config.margin.right;
    var vizHeight= module.container.node().offsetHeight - module.config.margin.top - module.config.margin.bottom;
    var vizCenter = vizWidth/2;

    module.d3config.titleMain
      .attr("x", vizCenter)
      .attr("y", function(){
        module.d3config.titleMainHeight = this.getBBox().height
        return module.d3config.titleMainHeight
      })

    module.d3config.titleSub
      .attr("x", vizCenter)
      .attr("y", function(){
        return (module.d3config.titleMainHeight + this.getBBox().height + 10)
      })

    module.d3config.attribution
      .attr("x", function(){
        return vizWidth - this.getBBox().width
      })
      .attr("y", function(){
        return vizHeight - this.getBBox().height
      })

    module.d3config.source
      .attr("x", 0)
      .attr("y", function(){
        return vizHeight - this.getBBox().height
      })


    module.d3config.topTextHeight = module.d3config.topTextWrapper.node().getBBox().height + module.config.paddingTopText;
    module.d3config.bottomTextHeight = module.d3config.bottomTextWrapper.node().getBBox().height ;

    module.d3config.vizContainer
      .attr('transform','translate(0,'+ module.d3config.topTextHeight +')')
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