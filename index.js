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
    module.data.data = data;
  };

  module.container = container;
  module.g = null;
  module.svg = null;
  module.scale = false;
  module.vizContainer = null;
  module.vizSize = {width:500,height:500};
  module.vizInitSize = {width:500,height:500};
  module.containerSize = {width:0,height:0};
  module.theme = data.style.theme;
  module.hideNumberLablesClass = data.hideNumberLables ? "numberLableHidden" : "";
  module.color = data.style.color.main;
  module.custom = null;
  module.bg = null;

  console.log("module",module,"data",data)

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
    custom:false
  };

  module.text = {};

  module.timeline = {
    //Start and End are in Milliseconds, func receives a value between 0 and 1, obj is a container to store related info e.g. easing, etc.
    //rect:{start:0, end:3000, func:module.drawRect, obj:{}}
  };

  module.init = function () {

    module.scale = false;

    module.vizInitSize.width = module.containerSize.width = module.container.node().offsetWidth;
    module.vizInitSize.height = module.containerSize.height = module.container.node().offsetHeight;

    module.vizSize.width = module.vizInitSize.width - module.config.margin.right - module.config.margin.left;
    module.vizSize.height = module.vizInitSize.height;
    
    module.svg = module.container.append('svg')
      .style('background-color', '#ffffff')
      .attr("viewBox", "0 0 " + module.containerSize.width + " " + module.containerSize.height)
      // .attr('class', module.theme+' '+module.color+' '+ module.labelTextHidden);
      .attr('class', module.theme + " " + module.color + " " + module.hideNumberLablesClass)
      // .attr('class', module.theme+' '+module.color);

    module.defs = module.svg.append('defs');

    module.bg = module.svg.append('rect')
      .style('fill', '#fff');

    module.g = module.svg.append('g')
      .attr('transform','translate('+module.config.margin.top+','+module.config.margin.left+')');

    module.custom = module.g.append('g')

    if(module.data.custom){
      module.custom.attr('transform', 'translate(' + (((module.data.custom.logo.align=='left')?0:((module.data.custom.logo.align=='right')?module.vizInitSize.width-module.config.margin.left-module.config.margin.right:(module.vizInitSize.width/2-module.config.margin.left)))+module.data.custom.logo.x_offset) + ',' + (((module.data.custom.logo.valign=='bottom')?(module.vizInitSize.height-(module.config.margin.bottom+module.config.margin.top)):module.config.margin.top)+module.data.custom.logo.y_offset) + ')');

      module.custom.append('image')
        .attr('xlink:href', module.data.custom.logo.url)
        .attr('width', module.data.custom.logo.width)
        .attr('height', module.data.custom.logo.height)
        .attr('x', ((module.data.custom.logo.align=='left')?0:((module.data.custom.logo.align=='right')?-module.data.custom.logo.width:(-module.data.custom.logo.width/2))))
        .attr('y', ((module.data.custom.logo.valign=='bottom')?-module.data.custom.logo.height:0));
    }

    //Text Top
    module.text.head = module.g.append('g')
      .attr('class', 'title-wrapper');

    module.text.title = module.text.head.append('text').attr('class', 'titleFont');

    module.text.subtitle = module.text.head.append('text').attr('class', 'subtitleFont');

    module.text.foot = module.g.append("g")
      .attr('transform', 'translate(0,'+(module.containerSize.height-module.config.margin.bottom-module.config.margin.top)+')')
      .attr('class', 'bottomTextWrapper');

    module.text.attribution = module.text.foot
      .append("text")
      .attr('x', module.containerSize.width-module.config.margin.left-module.config.margin.right)
      .text(module.data.data.attribution)
      .attr('class', 'attribution');

    module.text.source = module.text.foot
      .append('text')
      .text(module.data.data.source)
      .attr('class', 'source');

    //Make a Viz Container
    module.vizContainer = module.g
      .append("g")
      .attr("class", "viz-container")

    module.playHead = 0;

    module.setup();
    module.updateHead();

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
          headlineHeight = 0,
          headlineLineHeight = 1.1,
          headlineSize = headlineMax;

      module.vizSize.width = module.vizInitSize.width-module.config.margin.left-module.config.margin.right;

      if(module.data.data.title.length > 0){
          var lines = module.data.data.title.split('\n');

          module.text.title.selectAll('tspan').remove();

          lines.forEach(function(l,li){
              var localSize = headlineMax,
                  line = module.text.title.append('tspan')
                      .text(l)
                      .attr('x',0)
                      .style('font-size', localSize+'px');

              while(line.node().getComputedTextLength() > module.vizSize.width && localSize > 8){
                localSize--;
                line.style('font-size', localSize+'px');
              }

              if(headlineSize>localSize){
                  headlineSize = localSize;
              }
          });

          module.text.title.attr('transform','translate(0,'+headlineSize+')');

          module.text.title.selectAll('tspan')
            .style('font-size', headlineSize+'px')
            .attr('dy', function(d,i){
              return (i>0)?(headlineSize*headlineLineHeight):0;
            });

          headlineHeight = (headlineSize*headlineLineHeight) * (lines.length - 1) + headlineSize;
      }

      var copyMax = 15,
          copyLineHeight = 1.1,
          copyHeight = 0,
          copySize = (copyMax > headlineSize)?headlineSize*0.75:copyMax;

      if(module.data.data.subTitle.length > 0){
          lines = module.data.data.subTitle.split('\n');

          module.text.subtitle.selectAll('tspan').remove();

          lines.forEach(function(l){
              var localSize = copyMax,
                  line = module.text.subtitle.append('tspan')
                      .text(l)
                      .attr('x',0)
                      .style('font-size', localSize+'px');
              while(line.node().getComputedTextLength() > (module.vizSize.width) && localSize > 5){
                  localSize--;
                  line.style('font-size', localSize+'px');
              }
              if(copySize>localSize){
                  copySize = localSize;
              }
          });

          module.text.subtitle.selectAll('tspan')
              .attr('dy', function(d,i){
                return (i>0)?(copySize*copyLineHeight):0;
              })
              .style('font-size', copySize+'px');

          module.text.subtitle.attr('transform','translate(0,'+Math.round(headlineHeight+copySize*1.55)+')');

          copyHeight += copySize*2 + (copySize * copyLineHeight)*(lines.length-1);
      }

      module.vizContainer
        .attr('transform','translate(0,'+ (copyHeight+headlineHeight) +')');

      module.vizSize.height = module.vizInitSize.height-(copyHeight+headlineHeight)-module.config.margin.top-module.config.margin.bottom-module.config.footerHeight -15;
      module.text.foot.attr('transform', 'translate(0,'+(module.vizInitSize.height-module.config.margin.bottom-module.config.margin.top)+')');
      if(module.data.custom){
        module.custom.attr('transform', 'translate(' + (((module.data.custom.logo.align=='left')?0:((module.data.custom.logo.align=='right')?module.vizInitSize.width-module.config.margin.left-module.config.margin.right:(module.vizInitSize.width/2-module.config.margin.left)))+module.data.custom.logo.x_offset) + ',' + (((module.data.custom.logo.valign=='bottom')?(module.vizInitSize.height-(module.config.margin.bottom+module.config.margin.top)):module.config.margin.top)+module.data.custom.logo.y_offset) + ')');
      }
      module.text.attribution.attr('x', module.vizInitSize.width-module.config.margin.left-module.config.margin.right);

      module.updateSource();

      module.resize();
  };

  module.setTheme = function(theme){
    module.svg.classed(module.theme, false);
    module.theme = theme;
    module.svg.classed(module.theme, true);
    module.updateHead();
  };

  // module.toogleLabelText = function(hide){
  //   module.labelTextHidden = hide ? 'hideLabelText' : '';
  //   module.svg.classed('hideLabelText', hide);
  //   module.updateHead();
  // };

  module.setColor = function(color){
    module.svg.classed(module.color, false);
    module.color = color;
    module.svg.classed(module.color, true);
    module.updateHead();
  };

  module.updateSource = function(){
    module.text.source.text(module.data.data.source);
  };

  //temporary workaround to jump back to the beginning of the timeline
  module.reset = function () {
    module.playState = false;
    module.playHead = 0;
    module.vizContainer.selectAll('*').remove();
    module.setup();
    module.resize();
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
    module.bg
      .attr('width', module.containerSize.width)
      .attr('height', module.containerSize.height);

    if(!module.scale){
      module.svg.attr("viewBox", "0 0 " + module.containerSize.width + " " + module.containerSize.height);
      module.vizInitSize.width = module.containerSize.width;
      module.vizInitSize.height = module.containerSize.height;
    }else{
      //Just scale the svg
    }

    module.updateHead();
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
      }else if(t < tl.start){
        tl.func(0);
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
    fpsInterval : 1000 / 30, //60 fps
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