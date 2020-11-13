/* jshint ignore:start */
define(["jquery", "jqueryui"], function(){
	
	(function ($) {
			
		/*!
		 * jQVMap Version 1.0 
		 *
		 * http://jqvmap.com
		 *
		 * Copyright 2012, Peter Schmalfeldt <manifestinteractive@gmail.com>
		 * Copyright 2011-2012, Kirill Lebedev
		 * Licensed under the MIT license.
		 *
		 * Fork Me @ https://github.com/manifestinteractive/jqvmap
		 */

		  var apiParams = {
		    colors: 1,
		    values: 1,
		    backgroundColor: 1,
		    scaleColors: 1,
		    normalizeFunction: 1,
		    enableZoom: 1,
		    showTooltip: 1,
		    borderColor: 1,
		    borderWidth: 1,
		    borderOpacity: 1,
		    selectedRegion: 1
		  };

		  var apiEvents = {
		    onLabelShow: 'labelShow',
		    onRegionOver: 'regionMouseOver',
		    onRegionOut: 'regionMouseOut',
		    onRegionClick: 'regionClick'
		  };

		  $.fn.vectorMap = function (options){

		    var defaultParams = {
		      map: 'world_en',
		      backgroundColor: '#a5bfdd',
		      color: '#f4f3f0',
		      hoverColor: '#c9dfaf',
			  selectedColor: '#c9dfaf',
		      scaleColors: ['#b6d6ff', '#005ace'],
		      normalizeFunction: 'linear',
		      enableZoom: true,
		      showTooltip: true,
		      borderColor: '#818181',
		      borderWidth: 1,
		      borderOpacity: 0.25,
		      selectedRegion: null
		    }, map;

		    if (options === 'addMap')
		    {
		      WorldMap.maps[arguments[1]] = arguments[2];
		    }
		    else if (options === 'set' && apiParams[arguments[1]])
		    {
		      this.data('mapObject')['set' + arguments[1].charAt(0).toUpperCase() + arguments[1].substr(1)].apply(this.data('mapObject'), Array.prototype.slice.call(arguments, 2));
		    }
		    else
		    {
		      $.extend(defaultParams, options);
		      defaultParams.container = this;
		      this.css({ position: 'relative', overflow: 'hidden' });
			  
		      map = new WorldMap(defaultParams);

		      this.data('mapObject', map);

		      for (var e in apiEvents)
		      {
		        if (defaultParams[e])
		        {
		          this.bind(apiEvents[e] + '.jqvmap', defaultParams[e]);
		        }
		      }
		    }
		  };

		  var VectorCanvas = function (width, height, params)
		  {
		    this.mode = window.SVGAngle ? 'svg' : 'vml';
			this.params = params;

		    if (this.mode == 'svg')
		    {
		      this.createSvgNode = function (nodeName)
		      {
		        return document.createElementNS(this.svgns, nodeName);
		      };
		    }
		    else
		    {
		      try {
		        if (!document.namespaces.rvml)
		        {
		          document.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
		        }
		        this.createVmlNode = function (tagName)
		        {
		          return document.createElement('<rvml:' + tagName + ' class="rvml">');
		        };
		      }
		      catch (e)
		      {
		        this.createVmlNode = function (tagName)
		        {
		          return document.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
		        };
		      }

		      document.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
		    }

		    if (this.mode == 'svg')
		    {
		      this.canvas = this.createSvgNode('svg');
		    }
		    else
		    {
		      this.canvas = this.createVmlNode('group');
		      this.canvas.style.position = 'absolute';
		    }

		    this.setSize(width, height);
		  };

		  VectorCanvas.prototype = {
		    svgns: "http://www.w3.org/2000/svg",
		    mode: 'svg',
		    width: 0,
		    height: 0,
		    canvas: null,

		    setSize: function (width, height)
		    {
		      if (this.mode == 'svg')
		      {
		        this.canvas.setAttribute('width', width);
		        this.canvas.setAttribute('height', height);
		      }
		      else
		      {
		        this.canvas.style.width = width + "px";
		        this.canvas.style.height = height + "px";
		        this.canvas.coordsize = width + ' ' + height;
		        this.canvas.coordorigin = "0 0";
		        if (this.rootGroup)
		        {
		          var pathes = this.rootGroup.getElementsByTagName('shape');
		          for (var i = 0, l = pathes.length; i < l; i++)
		          {
		            pathes[i].coordsize = width + ' ' + height;
		            pathes[i].style.width = width + 'px';
		            pathes[i].style.height = height + 'px';
		          }
		          this.rootGroup.coordsize = width + ' ' + height;
		          this.rootGroup.style.width = width + 'px';
		          this.rootGroup.style.height = height + 'px';
		        }
		      }
		      this.width = width;
		      this.height = height;
		    },

		    createPath: function (config)
		    {
		      var node;
		      if (this.mode == 'svg')
		      {
		        node = this.createSvgNode('path');
		        node.setAttribute('d', config.path);

		        if(this.params.borderColor !== null)
		        {
		          node.setAttribute('stroke', this.params.borderColor);
		        }
		        if(this.params.borderWidth > 0)
		        {
		          node.setAttribute('stroke-width', this.params.borderWidth);
		          node.setAttribute('stroke-linecap', 'round');
		          node.setAttribute('stroke-linejoin', 'round');
		        }
		        if(this.params.borderOpacity > 0)
		        {
		          node.setAttribute('stroke-opacity', this.params.borderOpacity);
		        }

		        node.setFill = function (color)
		        {
		          this.setAttribute("fill", color);
				  if(this.getAttribute("original") === null)
				  {
				  	this.setAttribute("original", color);
				  }
		        };

		        node.getFill = function (color)
		        {
		          return this.getAttribute("fill");
		        };

		        node.getOriginalFill = function ()
		        {
				  return this.getAttribute("original");
		        };
				
		        node.setOpacity = function (opacity)
		        {
		          this.setAttribute('fill-opacity', opacity);
		        };
		      }
		      else
		      {
		        node = this.createVmlNode('shape');
		        node.coordorigin = "0 0";
		        node.coordsize = this.width + ' ' + this.height;
		        node.style.width = this.width + 'px';
		        node.style.height = this.height + 'px';
		        node.fillcolor = WorldMap.defaultFillColor;
		        node.stroked = false;
		        node.path = VectorCanvas.pathSvgToVml(config.path);

		        var scale = this.createVmlNode('skew');
		        scale.on = true;
		        scale.matrix = '0.01,0,0,0.01,0,0';
		        scale.offset = '0,0';

		        node.appendChild(scale);

		        var fill = this.createVmlNode('fill');
		        node.appendChild(fill);

		        node.setFill = function (color)
		        {
		          this.getElementsByTagName('fill')[0].color = color;
		        };

		        node.getFill = function (color)
		        {
		          return this.getElementsByTagName('fill')[0].color;
		        };

		        node.setOpacity = function (opacity)
		        {
		          this.getElementsByTagName('fill')[0].opacity = parseInt(opacity * 100, 10) + '%';
		        };
		      }
		      return node;
		    },

		    createGroup: function (isRoot)
		    {
		      var node;
		      if (this.mode == 'svg')
		      {
		        node = this.createSvgNode('g');
		      }
		      else
		      {
		        node = this.createVmlNode('group');
		        node.style.width = this.width + 'px';
		        node.style.height = this.height + 'px';
		        node.style.left = '0px';
		        node.style.top = '0px';
		        node.coordorigin = "0 0";
		        node.coordsize = this.width + ' ' + this.height;
		      }

		      if (isRoot)
		      {
		        this.rootGroup = node;
		      }
		      return node;
		    },

		    applyTransformParams: function (scale, transX, transY)
		    {
		      if (this.mode == 'svg')
		      {
		        this.rootGroup.setAttribute('transform', 'scale(' + scale + ') translate(' + transX + ', ' + transY + ')');
		      }
		      else
		      {
		        this.rootGroup.coordorigin = (this.width - transX) + ',' + (this.height - transY);
		        this.rootGroup.coordsize = this.width / scale + ',' + this.height / scale;
		      }
		    }
		  };

		  VectorCanvas.pathSvgToVml = function (path)
		  {
		    var result = '';
		    var cx = 0, cy = 0, ctrlx, ctrly;

		    return path.replace(/([MmLlHhVvCcSs])((?:-?(?:\d+)?(?:\.\d+)?,?\s?)+)/g, function (segment, letter, coords, index)
		    {
		      coords = coords.replace(/(\d)-/g, '$1,-').replace(/\s+/g, ',').split(',');
		      if (!coords[0])
		      {
		        coords.shift();
		      }

		      for (var i = 0, l = coords.length; i < l; i++)
		      {
		        coords[i] = Math.round(100 * coords[i]);
		      }

		      switch (letter)
		      {
		        case 'm':
		          cx += coords[0];
		          cy += coords[1];
		          return 't' + coords.join(',');
		          break;

		        case 'M':
		          cx = coords[0];
		          cy = coords[1];
		          return 'm' + coords.join(',');
		          break;

		        case 'l':
		          cx += coords[0];
		          cy += coords[1];
		          return 'r' + coords.join(',');
		          break;

		        case 'L':
		          cx = coords[0];
		          cy = coords[1];
		          return 'l' + coords.join(',');
		          break;

		        case 'h':
		          cx += coords[0];
		          return 'r' + coords[0] + ',0';
		          break;

		        case 'H':
		          cx = coords[0];
		          return 'l' + cx + ',' + cy;
		          break;

		        case 'v':
		          cy += coords[0];
		          return 'r0,' + coords[0];
		          break;

		        case 'V':
		          cy = coords[0];
		          return 'l' + cx + ',' + cy;
		          break;

		        case 'c':
		          ctrlx = cx + coords[coords.length - 4];
		          ctrly = cy + coords[coords.length - 3];
		          cx += coords[coords.length - 2];
		          cy += coords[coords.length - 1];
		          return 'v' + coords.join(',');
		          break;

		        case 'C':
		          ctrlx = coords[coords.length - 4];
		          ctrly = coords[coords.length - 3];
		          cx = coords[coords.length - 2];
		          cy = coords[coords.length - 1];
		          return 'c' + coords.join(',');
		          break;

		        case 's':
		          coords.unshift(cy - ctrly);
		          coords.unshift(cx - ctrlx);
		          ctrlx = cx + coords[coords.length - 4];
		          ctrly = cy + coords[coords.length - 3];
		          cx += coords[coords.length - 2];
		          cy += coords[coords.length - 1];
		          return 'v' + coords.join(',');
		          break;

		        case 'S':
		          coords.unshift(cy + cy - ctrly);
		          coords.unshift(cx + cx - ctrlx);
		          ctrlx = coords[coords.length - 4];
		          ctrly = coords[coords.length - 3];
		          cx = coords[coords.length - 2];
		          cy = coords[coords.length - 1];
		          return 'c' + coords.join(',');
		          break;
				  
				default:
				  return false;
				  break;
		      }

		      return '';

		    }).replace(/z/g, '');
		  };

		  var WorldMap = function (params)
		  {
		    params = params || {};
			var map = this;
		    var mapData = WorldMap.maps[params.map];

		    this.container = params.container;

		    this.defaultWidth = mapData.width;
		    this.defaultHeight = mapData.height;

		    this.color = params.color;
		    this.hoverColor = params.hoverColor;
		    this.setBackgroundColor(params.backgroundColor);

		    this.width = params.container.width();
		    this.height = params.container.height();

		    this.resize();

		    jQuery(window).resize(function ()
		    {
		      map.width = params.container.width();
		      map.height = params.container.height();
		      map.resize();
		      map.canvas.setSize(map.width, map.height);
		      map.applyTransform();
		    });

		    this.canvas = new VectorCanvas(this.width, this.height, params);
		    params.container.append(this.canvas.canvas);

		    this.makeDraggable();

		    this.rootGroup = this.canvas.createGroup(true);

		    this.index = WorldMap.mapIndex;
		    this.label = jQuery('<div/>').addClass('jqvmap-label').appendTo(jQuery('body'));

		    if(params.enableZoom)
		    {
		      jQuery('<div/>').addClass('jqvmap-zoomin').text('+').appendTo(params.container);
		      jQuery('<div/>').addClass('jqvmap-zoomout').html('&#x2212;').appendTo(params.container);
		    }
			
			map.countries = [];
			
		    for (var key in mapData.pathes)
		    {
		      var path = this.canvas.createPath({
		        path: mapData.pathes[key].path
		      });
			  
		      path.setFill(this.color);
		      path.id = 'jqvmap' + map.index + '_' + key;
		      map.countries[key] = path;
			  
		      jQuery(this.rootGroup).append(path);

		      path.setAttribute('class', 'jqvmap-region');

		      if(params.selectedRegion !== null)
		      {
		        if(key.toLowerCase() == params.selectedRegion.toLowerCase())
		        {
		          path.setFill(params.selectedColor);
		        }
		      }
		    }

		    jQuery(params.container).delegate(this.canvas.mode == 'svg' ? 'path' : 'shape', 'mouseover mouseout', function (e){
		      var path = e.target,
		      code = e.target.id.split('_').pop(),
		      labelShowEvent = $.Event('labelShow.jqvmap'),
		      regionMouseOverEvent = $.Event('regionMouseOver.jqvmap');

		      if (e.type == 'mouseover')
		      {
		        jQuery(params.container).trigger(regionMouseOverEvent, [code, mapData.pathes[code].name]);
		        if (!regionMouseOverEvent.isDefaultPrevented())
		        {
		          if (params.hoverOpacity)
		          {
		            path.setOpacity(params.hoverOpacity);
		          }
		          else if (params.hoverColor)
		          {
		            path.currentFillColor = path.getFill() + '';
		            path.setFill(params.hoverColor);
		          }
		        }
		        if(params.showTooltip)
		        {
		          map.label.text(mapData.pathes[code].name);
		          jQuery(params.container).trigger(labelShowEvent, [map.label, code]);

		          if (!labelShowEvent.isDefaultPrevented())
		          {
		            map.label.show();
		            map.labelWidth = map.label.width();
		            map.labelHeight = map.label.height();
		          }
		        }
		      }
		      else
		      {
		        path.setOpacity(1);
		        if (path.currentFillColor)
		        {
		          path.setFill(path.currentFillColor);
		        }

		        map.label.hide();
		        jQuery(params.container).trigger('regionMouseOut.jqvmap', [code, mapData.pathes[code].name]);
		      }
		    });

		    jQuery(params.container).delegate(this.canvas.mode == 'svg' ? 'path' : 'shape', 'click', function (e){

			  for (var key in mapData.pathes)
		      {
				map.countries[key].currentFillColor = map.countries[key].getOriginalFill();
		        map.countries[key].setFill(map.countries[key].getOriginalFill());
		      }

		      var path = e.target;
		      var code = e.target.id.split('_').pop();

		      jQuery(params.container).trigger('regionClick.jqvmap', [code, mapData.pathes[code].name]);

			  path.currentFillColor = params.selectedColor;
		      path.setFill(params.selectedColor);

		    });

		    if(params.showTooltip)
		    {
		      params.container.mousemove(function (e){
		        if (map.label.is(':visible'))
		        {
		          map.label.css({
		            left: e.pageX - 15 - map.labelWidth,
		            top: e.pageY - 15 - map.labelHeight
		          });
		        }
		      });
		    }

		    this.setColors(params.colors);

		    this.canvas.canvas.appendChild(this.rootGroup);

		    this.applyTransform();

		    this.colorScale = new ColorScale(params.scaleColors, params.normalizeFunction, params.valueMin, params.valueMax);

		    if (params.values)
		    {
		      this.values = params.values;
		      this.setValues(params.values);
		    }

		    this.bindZoomButtons();

		    WorldMap.mapIndex++;
		  };

		  WorldMap.prototype = {
		    transX: 0,
		    transY: 0,
		    scale: 1,
		    baseTransX: 0,
		    baseTransY: 0,
		    baseScale: 1,
		    width: 0,
		    height: 0,
		    countries: {},
		    countriesColors: {},
		    countriesData: {},
		    zoomStep: 1.4,
		    zoomMaxStep: 4,
		    zoomCurStep: 1,

		    setColors: function (key, color)
		    {
		      if (typeof key == 'string')
		      {
		        this.countries[key].setFill(color);
		  	  	this.countries[key].setAttribute("original", color);
		      }
		      else
		      {
		        var colors = key;

		        for (var code in colors)
		        {
		          if (this.countries[code])
		          {
		            this.countries[code].setFill(colors[code]);
					this.countries[code].setAttribute("original", colors[code]);
		          }
		        }
		      }
		    },

		    setValues: function (values)
		    {
		      var max = 0,
		      min = Number.MAX_VALUE,
		      val;

		      for (var cc in values)
		      {
		        val = parseFloat(values[cc]);
		        if (val > max)
		        {
		          max = values[cc];
		        }
		        if (val && val < min)
		        {
		          min = val;
		        }
		      }

		      this.colorScale.setMin(min);
		      this.colorScale.setMax(max);

		      var colors = {};
		      for (cc in values)
		      {
		        val = parseFloat(values[cc]);
		        if (val)
		        {
		          colors[cc] = this.colorScale.getColor(val);
		        }
		        else
		        {
		          colors[cc] = this.color;
		        }
		      }
		      this.setColors(colors);
		      this.values = values;
		    },

		    setBackgroundColor: function (backgroundColor)
		    {
		      this.container.css('background-color', backgroundColor);
		    },

		    setScaleColors: function (colors)
		    {
		      this.colorScale.setColors(colors);

		      if (this.values)
		      {
		        this.setValues(this.values);
		      }
		    },

		    setNormalizeFunction: function (f)
		    {
		      this.colorScale.setNormalizeFunction(f);

		      if (this.values)
		      {
		        this.setValues(this.values);
		      }
		    },

		    resize: function ()
		    {
		      var curBaseScale = this.baseScale;
		      if (this.width / this.height > this.defaultWidth / this.defaultHeight)
		      {
		        this.baseScale = this.height / this.defaultHeight;
		        this.baseTransX = Math.abs(this.width - this.defaultWidth * this.baseScale) / (2 * this.baseScale);
		      }
		      else
		      {
		        this.baseScale = this.width / this.defaultWidth;
		        this.baseTransY = Math.abs(this.height - this.defaultHeight * this.baseScale) / (2 * this.baseScale);
		      }
		      this.scale *= this.baseScale / curBaseScale;
		      this.transX *= this.baseScale / curBaseScale;
		      this.transY *= this.baseScale / curBaseScale;
		    },

		    reset: function ()
		    {
		      this.countryTitle.reset();
		      for (var key in this.countries)
		      {
		        this.countries[key].setFill(WorldMap.defaultColor);
		      }
		      this.scale = this.baseScale;
		      this.transX = this.baseTransX;
		      this.transY = this.baseTransY;
		      this.applyTransform();
		    },

		    applyTransform: function ()
		    {
		      var maxTransX, maxTransY, minTransX, minTransY;
		      if (this.defaultWidth * this.scale <= this.width)
		      {
		        maxTransX = (this.width - this.defaultWidth * this.scale) / (2 * this.scale);
		        minTransX = (this.width - this.defaultWidth * this.scale) / (2 * this.scale);
		      }
		      else
		      {
		        maxTransX = 0;
		        minTransX = (this.width - this.defaultWidth * this.scale) / this.scale;
		      }

		      if (this.defaultHeight * this.scale <= this.height)
		      {
		        maxTransY = (this.height - this.defaultHeight * this.scale) / (2 * this.scale);
		        minTransY = (this.height - this.defaultHeight * this.scale) / (2 * this.scale);
		      }
		      else
		      {
		        maxTransY = 0;
		        minTransY = (this.height - this.defaultHeight * this.scale) / this.scale;
		      }

		      if (this.transY > maxTransY)
		      {
		        this.transY = maxTransY;
		      }
		      else if (this.transY < minTransY)
		      {
		        this.transY = minTransY;
		      }
		      if (this.transX > maxTransX)
		      {
		        this.transX = maxTransX;
		      }
		      else if (this.transX < minTransX)
		      {
		        this.transX = minTransX;
		      }

		      this.canvas.applyTransformParams(this.scale, this.transX, this.transY);
		    },

		    makeDraggable: function ()
		    {
		      var mouseDown = false;
		      var oldPageX, oldPageY;
		      var self = this;

		      this.container.mousemove(function (e){

		        if (mouseDown)
		        {
		          var curTransX = self.transX;
		          var curTransY = self.transY;

		          self.transX -= (oldPageX - e.pageX) / self.scale;
		          self.transY -= (oldPageY - e.pageY) / self.scale;

		          self.applyTransform();

		          oldPageX = e.pageX;
		          oldPageY = e.pageY;
		        }

		        return false;

		      }).mousedown(function (e){

		        mouseDown = true;
		        oldPageX = e.pageX;
		        oldPageY = e.pageY;

		        return false;

		      }).mouseup(function (){

		        mouseDown = false;
		        return false;

		      });
		    },

		    bindZoomButtons: function ()
		    {
		      var map = this;
		      var sliderDelta = (jQuery('#zoom').innerHeight() - 6 * 2 - 15 * 2 - 3 * 2 - 7 - 6) / (this.zoomMaxStep - this.zoomCurStep);

		      this.container.find('.jqvmap-zoomin').click(function ()
		      {
		        if (map.zoomCurStep < map.zoomMaxStep)
		        {
		          var curTransX = map.transX;
		          var curTransY = map.transY;
		          var curScale = map.scale;

		          map.transX -= (map.width / map.scale - map.width / (map.scale * map.zoomStep)) / 2;
		          map.transY -= (map.height / map.scale - map.height / (map.scale * map.zoomStep)) / 2;
		          map.setScale(map.scale * map.zoomStep);
		          map.zoomCurStep++;

		          jQuery('#zoomSlider').css('top', parseInt(jQuery('#zoomSlider').css('top'), 10) - sliderDelta);
		        }
		      });

		      this.container.find('.jqvmap-zoomout').click(function ()
		      {
		        if (map.zoomCurStep > 1) {
		          var curTransX = map.transX;
		          var curTransY = map.transY;
		          var curScale = map.scale;

		          map.transX += (map.width / (map.scale / map.zoomStep) - map.width / map.scale) / 2;
		          map.transY += (map.height / (map.scale / map.zoomStep) - map.height / map.scale) / 2;
		          map.setScale(map.scale / map.zoomStep);
		          map.zoomCurStep--;

		          jQuery('#zoomSlider').css('top', parseInt(jQuery('#zoomSlider').css('top'), 10) + sliderDelta);
		        }
		      });
		    },

		    setScale: function (scale)
		    {
		      this.scale = scale;
		      this.applyTransform();
		    },

		    getCountryPath: function (cc)
		    {
		      return jQuery('#' + cc)[0];
		    }
		  };

		  WorldMap.xlink = "http://www.w3.org/1999/xlink";
		  WorldMap.mapIndex = 1;
		  WorldMap.maps = {};

		  var ColorScale = function (colors, normalizeFunction, minValue, maxValue)
		  {
		    if (colors)
		    {
		      this.setColors(colors);
		    }
		    if (normalizeFunction)
		    {
		      this.setNormalizeFunction(normalizeFunction);
		    }
		    if (minValue)
		    {
		      this.setMin(minValue);
		    }
		    if (minValue)
		    {
		      this.setMax(maxValue);
		    }
		  };

		  ColorScale.prototype = {
		    colors: [],

		    setMin: function (min)
		    {
		      this.clearMinValue = min;

		      if (typeof this.normalize === 'function')
		      {
		        this.minValue = this.normalize(min);
		      }
		      else
		      {
		        this.minValue = min;
		      }
		    },

		    setMax: function (max)
		    {
		      this.clearMaxValue = max;
		      if (typeof this.normalize === 'function')
		      {
		        this.maxValue = this.normalize(max);
		      }
		      else
		      {
		        this.maxValue = max;
		      }
		    },

		    setColors: function (colors)
		    {
		      for (var i = 0; i < colors.length; i++)
		      {
		        colors[i] = ColorScale.rgbToArray(colors[i]);
		      }
		      this.colors = colors;
		    },

		    setNormalizeFunction: function (f)
		    {
		      if (f === 'polynomial')
		      {
		        this.normalize = function (value)
		        {
		          return Math.pow(value, 0.2);
		        };
		      }
		      else if (f === 'linear')
		      {
		        delete this.normalize;
		      }
		      else
		      {
		        this.normalize = f;
		      }
		      this.setMin(this.clearMinValue);
		      this.setMax(this.clearMaxValue);
		    },

		    getColor: function (value)
		    {
		      if (typeof this.normalize === 'function')
		      {
		        value = this.normalize(value);
		      }

		      var lengthes = [];
		      var fullLength = 0;
		      var l;

		      for (var i = 0; i < this.colors.length - 1; i++)
		      {
		        l = this.vectorLength(this.vectorSubtract(this.colors[i + 1], this.colors[i]));
		        lengthes.push(l);
		        fullLength += l;
		      }

		      var c = (this.maxValue - this.minValue) / fullLength;

		      for (i = 0; i < lengthes.length; i++)
		      {
		        lengthes[i] *= c;
		      }

		      i = 0;
		      value -= this.minValue;

		      while (value - lengthes[i] >= 0)
		      {
		        value -= lengthes[i];
		        i++;
		      }

		      var color;
		      if (i == this.colors.length - 1)
		      {
		        color = this.vectorToNum(this.colors[i]).toString(16);
		      }
		      else
		      {
		        color = (this.vectorToNum(this.vectorAdd(this.colors[i], this.vectorMult(this.vectorSubtract(this.colors[i + 1], this.colors[i]), (value) / (lengthes[i]))))).toString(16);
		      }

		      while (color.length < 6)
		      {
		        color = '0' + color;
		      }
		      return '#' + color;
		    },

		    vectorToNum: function (vector)
		    {
		      var num = 0;
		      for (var i = 0; i < vector.length; i++)
		      {
		        num += Math.round(vector[i]) * Math.pow(256, vector.length - i - 1);
		      }
		      return num;
		    },

		    vectorSubtract: function (vector1, vector2)
		    {
		      var vector = [];
		      for (var i = 0; i < vector1.length; i++)
		      {
		        vector[i] = vector1[i] - vector2[i];
		      }
		      return vector;
		    },

		    vectorAdd: function (vector1, vector2)
		    {
		      var vector = [];
		      for (var i = 0; i < vector1.length; i++)
		      {
		        vector[i] = vector1[i] + vector2[i];
		      }
		      return vector;
		    },

		    vectorMult: function (vector, num)
		    {
		      var result = [];
		      for (var i = 0; i < vector.length; i++)
		      {
		        result[i] = vector[i] * num;
		      }
		      return result;
		    },

		    vectorLength: function (vector)
		    {
		      var result = 0;
		      for (var i = 0; i < vector.length; i++)
		      {
		        result += vector[i] * vector[i];
		      }
		      return Math.sqrt(result);
		    }
		  };

		  ColorScale.arrayToRgb = function (ar)
		  {
		    var rgb = '#';
		    var d;
		    for (var i = 0; i < ar.length; i++)
		    {
		      d = ar[i].toString(16);
		      rgb += d.length == 1 ? '0' + d : d;
		    }
		    return rgb;
		  };

		  ColorScale.rgbToArray = function (rgb)
		  {
		    rgb = rgb.substr(1);
		    return [parseInt(rgb.substr(0, 2), 16), parseInt(rgb.substr(2, 2), 16), parseInt(rgb.substr(4, 2), 16)];
		  };




		/**FranceMapDataPointsforjQVMaphttp://jqvmap.com*//**MapcreatedbyGaëlJaffredo<http://www.jaffredo.com/>*/

		$.fn.vectorMap('addMap','france_fr',
		{"width":530,"height":581,
		"pathes":{
			"ac-lille": {"path": "M 331.35,68.17 C 331.35,68.17 341.29,64.87 341.29,64.87,341.29,64.87 348.89,67.35 348.89,67.35,348.89,67.35 358.82,64.74 358.82,64.74,358.82,64.74 365.21,70.64 365.21,70.64,365.21,70.64 370.97,66.38 370.97,66.38,370.97,66.38 368.53,47.82 368.53,47.82,368.53,47.82 350.56,46.25 350.56,46.25,350.56,46.25 346.81,34.94 346.81,34.94,346.81,34.94 337.32,33.30 337.32,33.30,337.32,33.30 331.67,16.87 331.67,16.87,331.67,16.87 318.37,21.12 318.37,21.12,318.37,21.12 311.39,15.74 311.39,15.74,311.39,15.74 307.96,0.00 307.96,0.00,307.96,0.00 290.83,2.35 290.83,2.35,290.83,2.35 275.97,4.85 275.97,4.85,275.97,4.85 269.61,10.37 269.61,10.37,269.61,10.37 265.12,38.36 265.12,38.36,265.12,38.36 271.47,43.01 271.47,43.01,271.47,43.01 281.61,43.58 281.61,43.58,281.61,43.58 288.95,51.77 288.95,51.77,288.95,51.77 302.84,51.16 302.84,51.16,302.84,51.16 300.43,57.42 300.43,57.42,300.43,57.42 327.25,61.98 327.25,61.98,327.25,61.98 331.35,68.17 331.35,68.17 Z", "name": "LILLE"},
			"ac-amiens": {"path": "M 333.47,133.06 C 333.47,133.06 342.78,130.77 342.78,130.77,342.78,130.77 342.08,116.29 342.08,116.29,342.08,116.29 347.80,117.05 347.80,117.05,347.80,117.05 343.89,106.40 343.89,106.40,343.89,106.40 361.46,103.38 361.46,103.38,361.46,103.38 365.04,87.66 365.04,87.66,365.04,87.66 371.40,77.46 371.40,77.46,371.40,77.46 371.02,66.39 371.02,66.39,371.02,66.39 365.26,70.65 365.26,70.65,365.26,70.65 358.87,64.75 358.87,64.75,358.87,64.75 348.94,67.36 348.94,67.36,348.94,67.36 341.34,64.88 341.34,64.88,341.34,64.88 331.40,68.18 331.40,68.18,331.40,68.18 327.29,61.99 327.29,61.99,327.29,61.99 300.47,57.43 300.47,57.43,300.47,57.43 302.88,51.17 302.88,51.17,302.88,51.17 288.99,51.78 288.99,51.78,288.99,51.78 281.65,43.59 281.65,43.59,281.65,43.59 271.51,43.02 271.51,43.02,271.51,43.02 265.16,38.37 265.16,38.37,265.16,38.37 261.39,43.64 261.39,43.64,261.39,43.64 260.49,60.81 260.49,60.81,260.49,60.81 265.76,68.75 265.76,68.75,265.76,68.75 268.07,77.60 268.07,77.60,268.07,77.60 263.97,90.58 263.97,90.58,263.97,90.58 266.94,94.22 266.94,94.22,266.94,94.22 263.16,99.84 263.16,99.84,263.16,99.84 262.80,113.44 262.80,113.44,262.80,113.44 278.75,111.40 278.75,111.40,278.75,111.40 284.14,115.17 284.14,115.17,284.14,115.17 291.37,112.80 291.37,112.80,291.37,112.80 297.50,120.09 297.50,120.09,297.50,120.09 321.26,121.84 321.26,121.84,321.26,121.84 323.34,117.03 323.34,117.03,323.34,117.03 333.47,133.06 333.47,133.06 Z", "name": "AMIENS"},
			"ac-normandie": {"path": "M 266.97,94.26 C 266.97,94.26 263.94,90.56 263.94,90.56,263.94,90.56 268.04,77.58 268.04,77.58,268.04,77.58 265.73,68.73 265.73,68.73,265.73,68.73 260.52,60.86 260.52,60.86,260.52,60.86 261.00,51.72 261.00,51.72,261.00,51.72 256.78,57.60 256.78,57.60,256.78,57.60 247.43,62.07 247.43,62.07,247.43,62.07 232.07,67.59 232.07,67.59,232.07,67.59 219.71,70.51 219.71,70.51,219.71,70.51 210.53,76.66 210.53,76.66,210.53,76.66 206.88,84.51 206.88,84.51,206.88,84.51 213.30,85.71 213.30,85.71,213.30,85.71 216.92,86.48 216.92,86.48,216.92,86.48 226.94,88.70 226.94,88.70,226.94,88.70 219.90,88.31 219.90,88.31,219.90,88.31 212.42,90.12 212.42,90.13 205.56,92.05 205.56,92.05,205.56,92.05 197.36,95.39 197.36,95.39,197.36,95.39 164.70,89.39 164.70,89.39,164.70,89.39 159.33,89.37 159.33,89.37,159.33,89.37 155.51,79.16 155.51,79.16,155.51,79.16 158.65,74.62 158.65,74.62,158.65,74.62 158.71,69.63 158.71,69.63,158.71,69.63 155.45,67.78 155.45,67.78,155.45,67.78 148.53,69.89 148.53,69.89,148.53,69.89 137.80,69.85 137.80,69.85,137.80,69.85 132.97,65.96 132.97,65.96,132.97,65.96 129.70,68.28 129.70,68.28,129.70,68.28 134.24,72.15 134.24,72.15,134.24,72.15 131.84,78.40 131.84,78.40,131.84,78.40 139.77,98.56 139.77,98.56,139.77,98.56 137.88,125.95 137.88,125.95,137.88,125.95 143.39,132.08 143.39,132.08,143.39,132.08 134.93,132.86 134.93,132.86,134.93,132.86 134.99,139.10 134.99,139.10,134.99,139.10 142.07,143.11 142.07,143.11,142.07,143.11 146.43,137.25 146.43,137.25,146.43,137.25 161.37,139.85 161.37,139.85,161.37,139.85 166.12,145.69 166.12,145.69,166.12,145.69 186.01,140.03 186.01,140.03,186.01,140.03 192.44,145.70 192.44,145.70,192.44,145.70 193.30,153.20 193.30,153.20,193.30,153.20 208.88,149.11 208.88,149.11,208.88,149.11 212.24,153.74 212.24,153.74,212.24,153.74 212.19,158.46 212.19,158.46,212.19,158.46 219.90,161.39 219.90,161.39,219.90,161.39 226.32,166.04 226.32,166.04,226.32,166.04 226.52,158.62 226.52,158.62,226.52,158.62 232.86,156.13 232.86,156.13,232.86,156.13 233.41,148.11 233.41,148.11,233.41,148.11 232.32,144.23 232.32,144.23,232.32,144.23 232.96,138.17 232.96,138.16 232.96,138.16,232.96,138.16 250.84,131.42 250.84,131.42,250.84,131.42 253.34,118.10 253.34,118.10,253.34,118.10 262.78,113.44 262.78,113.44,262.78,113.44 263.19,99.90 263.19,99.90,263.19,99.90 266.97,94.26 266.97,94.26 Z", "name": "NORMANDIE"},
//			"ac-rouen": {"path": "M 266.97,94.26 C 266.97,94.26 263.94,90.56 263.94,90.56,263.94,90.56 268.04,77.58 268.04,77.58,268.04,77.58 265.73,68.73 265.73,68.73,265.73,68.73 260.52,60.86 260.52,60.86,260.52,60.86 261.00,51.72 261.00,51.72,261.00,51.72 256.78,57.60 256.78,57.60,256.78,57.60 247.43,62.07 247.43,62.07,247.43,62.07 232.07,67.59 232.07,67.59,232.07,67.59 219.71,70.51 219.71,70.51,219.71,70.51 210.53,76.66 210.53,76.66,210.53,76.66 206.88,84.51 206.88,84.51,206.88,84.51 213.30,85.71 213.30,85.71,213.30,85.71 216.92,86.48 216.92,86.48,216.92,86.48 226.94,88.70 226.94,88.70,226.94,88.70 219.90,88.31 219.90,88.31,219.90,88.31 212.42,90.12 212.42,90.12,212.42,90.12 217.12,103.99 217.12,103.99,217.12,103.99 215.80,120.99 215.80,120.99,215.80,120.99 223.57,122.83 223.57,122.83,223.57,122.83 226.75,128.27 226.75,128.27,226.75,128.27 232.96,138.16 232.96,138.16,232.96,138.16 250.84,131.42 250.84,131.42,250.84,131.42 253.34,118.10 253.34,118.10,253.34,118.10 262.78,113.44 262.78,113.44,262.78,113.44 263.19,99.90 263.19,99.90,263.19,99.90 266.97,94.26 266.97,94.26 Z", "name": "ROUEN"},
//			"ac-caen": {"path": "M 215.80,121.00 C 215.80,121.00 217.12,104.00 217.12,104.00,217.12,104.00 212.42,90.13 212.42,90.13,212.42,90.13 205.56,92.05 205.56,92.05,205.56,92.05 197.36,95.39 197.36,95.39,197.36,95.39 164.70,89.39 164.70,89.39,164.70,89.39 159.33,89.37 159.33,89.37,159.33,89.37 155.51,79.16 155.51,79.16,155.51,79.16 158.65,74.62 158.65,74.62,158.65,74.62 158.71,69.63 158.71,69.63,158.71,69.63 155.45,67.78 155.45,67.78,155.45,67.78 148.53,69.89 148.53,69.89,148.53,69.89 137.80,69.85 137.80,69.85,137.80,69.85 132.97,65.96 132.97,65.96,132.97,65.96 129.70,68.28 129.70,68.28,129.70,68.28 134.24,72.15 134.24,72.15,134.24,72.15 131.84,78.40 131.84,78.40,131.84,78.40 139.77,98.56 139.77,98.56,139.77,98.56 137.88,125.95 137.88,125.95,137.88,125.95 143.39,132.08 143.39,132.08,143.39,132.08 134.93,132.86 134.93,132.86,134.93,132.86 134.99,139.10 134.99,139.10,134.99,139.10 142.07,143.11 142.07,143.11,142.07,143.11 146.43,137.25 146.43,137.25,146.43,137.25 161.37,139.85 161.37,139.85,161.37,139.85 166.12,145.69 166.12,145.69,166.12,145.69 186.01,140.03 186.01,140.03,186.01,140.03 192.44,145.70 192.44,145.70,192.44,145.70 193.30,153.20 193.30,153.20,193.30,153.20 208.88,149.11 208.88,149.11,208.88,149.11 212.24,153.74 212.24,153.74,212.24,153.74 212.19,158.46 212.19,158.46,212.19,158.46 219.90,161.39 219.90,161.39,219.90,161.39 226.32,166.04 226.32,166.04,226.32,166.04 226.52,158.62 226.52,158.62,226.52,158.62 232.86,156.13 232.86,156.13,232.86,156.13 233.41,148.11 233.41,148.11,233.41,148.11 232.32,144.23 232.32,144.23,232.32,144.23 232.96,138.17 232.96,138.17,232.96,138.17 223.56,122.83 223.56,122.83,223.56,122.83 215.80,121.00 215.80,121.00 Z", "name" : "CAEN"},
			"ac-paris": {"path": "M 297.47,120.10 C 297.47,120.10 284.00,134.13 284.00,134.13,284.00,134.13 284.25,140.88 284.25,140.88,284.25,140.88 302.75,146.88 302.75,146.88,302.75,146.88 308.63,139.38 308.63,139.38,308.63,139.38 297.47,120.10 297.47,120.10 Z", "name" : "PARIS"},
			"ac-creteil": {"path": "M 317.34,165.57 C 317.34,165.57 330.66,165.22 330.66,165.22,330.66,165.22 332.07,153.14 332.07,153.14,332.07,153.14 336.83,148.94 336.83,148.94,336.83,148.94 333.40,133.06 333.40,133.06,333.40,133.06 323.31,117.04 323.31,117.04,323.31,117.04 321.23,121.85 321.23,121.85,321.23,121.85 297.47,120.10 297.47,120.10,297.47,120.10 308.75,139.38 308.75,139.38,308.75,139.38 302.74,146.91 302.74,146.91,302.74,146.91 303.63,160.00 303.63,160.00,303.63,160.00 291.73,174.73 291.73,174.73,291.73,174.73 308.04,177.68 308.04,177.68,308.04,177.68 317.34,165.57 317.34,165.57 Z", "name" : "CRETEIL"},
			"ac-versailles": {"path": "M 302.74,146.87 C 302.74,146.87 284.26,140.91 284.26,140.91,284.26,140.91 284.09,134.09 284.09,134.09,284.09,134.09 297.47,120.10 297.47,120.10,297.47,120.10 291.34,112.81 291.34,112.81,291.34,112.81 284.11,115.18 284.11,115.18,284.11,115.18 278.72,111.41 278.72,111.41,278.72,111.41 262.77,113.45 262.77,113.45,262.77,113.45 253.33,118.11 253.33,118.11,253.33,118.11 250.83,131.43 250.83,131.43,250.83,131.43 255.28,136.53 255.28,136.53,255.28,136.53 255.47,145.27 255.47,145.27,255.47,145.27 264.78,153.11 264.78,153.11,264.78,153.11 272.55,165.29 272.55,165.29,272.55,165.29 287.79,164.97 287.79,164.97,287.79,164.97 291.73,174.73 291.73,174.73,291.73,174.73 303.64,159.91 303.64,159.91,303.64,159.91 302.74,146.87 302.74,146.87 Z", "name" : "VERSAILLES"},
			"ac-rennes": {"path": "M 115.10,187.33 C 115.10,187.33 119.83,184.27 119.83,184.27,119.83,184.27 127.14,184.95 127.14,184.95,127.14,184.95 133.76,179.21 133.76,179.21,133.76,179.21 141.20,183.93 141.20,183.93,141.20,183.93 146.62,176.56 146.62,176.56,146.62,176.56 147.49,172.17 147.49,172.17,147.49,172.17 154.53,172.56 154.53,172.56,154.53,172.56 154.85,167.86 154.85,167.86,154.85,167.86 150.81,156.80 150.81,156.80,150.81,156.80 155.02,153.15 155.02,153.15,155.02,153.15 156.14,138.92 156.14,138.92,156.14,138.92 146.42,137.27 146.42,137.27,146.42,137.27 142.06,143.13 142.06,143.13,142.06,143.13 134.98,139.12 134.98,139.12,134.98,139.12 134.92,132.88 134.92,132.88,134.92,132.88 126.94,132.84 126.94,132.84,126.94,132.84 126.00,130.02 126.00,130.02,126.00,130.02 127.29,127.86 127.29,127.86,127.29,127.86 120.75,128.33 120.75,128.33,120.75,128.33 121.01,132.79 121.01,132.79,121.01,132.79 117.96,133.61 117.96,133.61,117.96,133.61 115.69,131.42 115.69,131.42,115.69,131.42 109.91,133.32 109.91,133.32,109.91,133.32 110.37,126.68 110.37,126.68,110.37,126.68 101.20,128.38 101.20,128.38,101.20,128.38 91.81,133.41 91.81,133.41,91.81,133.41 83.68,120.18 83.68,120.18,83.68,120.18 78.76,116.14 78.76,116.14,78.76,116.14 79.78,109.53 79.78,109.53,79.78,109.53 69.50,112.72 69.50,112.72,69.50,112.72 61.05,112.25 61.05,112.25,61.05,112.25 49.53,123.54 49.53,123.54,49.53,123.54 46.59,116.98 46.59,116.98,46.59,116.98 42.76,123.43 42.76,123.43,42.76,123.43 37.47,118.14 37.47,118.14,37.47,118.14 23.73,120.70 23.73,120.70,23.73,120.70 20.55,117.74 20.55,117.74,20.55,117.74 4.92,122.97 4.92,122.97,4.92,122.97 5.14,127.98 5.14,127.98,5.14,127.98 1.12,128.86 1.12,128.86,1.12,128.86 4.11,134.58 4.11,134.58,4.11,134.58 14.29,134.59 14.29,134.59,14.29,134.59 22.37,132.28 22.37,132.28,22.37,132.28 18.76,135.40 18.76,135.40,18.76,135.40 24.08,140.14 24.08,140.14,24.08,140.14 14.96,141.29 14.96,141.29,14.96,141.29 11.25,137.75 11.25,137.75,11.25,137.75 7.11,140.29 7.11,140.29,7.11,140.29 10.83,143.83 10.83,143.83,10.83,143.83 12.33,146.69 12.33,146.69,12.33,146.69 14.77,144.05 14.77,144.05,14.77,144.05 21.11,150.51 21.11,150.51,21.11,150.51 14.68,153.49 14.68,153.49,14.68,153.49 0.00,153.21 0.00,153.21,0.74,153.45 14.93,157.94 14.13,169.56,14.13,169.56 24.00,174.00 24.00,174.00,24.00,174.00 23.86,167.89 23.86,167.89,23.86,167.89 32.31,168.36 32.31,168.36,32.31,168.36 34.29,172.36 34.29,172.36,34.29,172.36 47.00,174.85 47.00,174.85,47.00,174.85 54.25,182.61 54.25,182.61,54.25,182.61 57.18,181.10 57.18,181.10,57.18,181.10 63.71,184.80 63.71,184.80,63.71,184.80 65.06,189.87 65.06,189.87,65.06,189.87 63.48,196.44 63.48,196.44,63.48,196.44 66.59,200.50 66.59,200.50,66.59,200.50 66.64,191.62 66.64,191.62,66.64,191.62 71.86,189.69 71.86,189.69,71.86,189.69 81.47,189.68 81.47,189.68,81.47,189.68 81.80,193.03 81.80,193.03,81.80,193.03 74.45,193.18 74.45,193.18,74.45,193.18 80.26,199.05 80.26,199.05,80.26,199.05 95.03,199.76 95.03,199.76,95.03,199.76 102.58,196.86 102.58,196.86,102.58,196.86 106.40,187.95 106.40,187.95,106.40,187.95 115.10,187.33 115.10,187.33 Z", "name" : "RENNES"},
			"ac-reims": {"path": "M 396.97,199.50 C 396.97,199.50 396.43,207.28 396.43,207.28,396.43,207.28 401.61,210.86 401.61,210.86,401.61,210.86 413.34,212.91 413.34,212.91,413.34,212.91 419.37,207.42 419.37,207.42,419.37,207.42 421.46,209.76 421.46,209.76,421.46,209.76 425.30,207.47 425.30,207.47,425.30,207.47 424.78,202.72 424.78,202.72,424.78,202.72 432.80,192.90 432.80,192.90,432.80,192.90 423.83,183.46 423.83,183.46,423.83,183.46 426.58,180.60 426.58,180.60,426.64,179.78 426.39,171.84 426.37,171.43,426.37,171.43 416.03,169.74 416.03,169.74,416.03,169.74 416.75,163.32 416.75,163.32,416.75,163.32 401.78,150.84 401.78,150.84,401.78,150.84 396.18,148.78 396.18,148.78,396.18,148.78 392.87,139.77 392.87,139.77,392.87,139.77 399.07,140.12 399.07,140.12,399.07,140.12 401.11,126.85 401.11,126.85,401.11,126.85 396.20,124.41 396.20,124.41,396.20,124.41 397.76,113.73 397.76,113.73,397.76,113.73 405.71,93.85 405.71,93.85,405.71,93.85 413.49,96.01 413.49,96.01,413.49,96.01 416.49,93.35 416.49,93.35,416.49,93.35 401.12,78.66 401.12,78.66,401.12,78.66 395.53,77.79 395.53,77.79,395.53,77.79 395.29,56.68 395.29,56.68,395.29,56.68 382.40,67.29 382.40,67.29,382.40,67.29 370.98,66.36 370.98,66.36,370.98,66.36 371.36,77.43 371.36,77.43,371.36,77.43 365.00,87.63 365.00,87.63,365.00,87.63 362.53,99.53 362.53,99.53,362.53,99.53 361.42,103.36 361.42,103.36,361.42,103.36 343.85,106.38 343.85,106.38,343.85,106.38 347.76,117.03 347.76,117.03,347.76,117.03 342.04,116.27 342.04,116.27,342.04,116.27 342.74,130.75 342.74,130.75,342.74,130.75 333.43,133.04 333.43,133.04,333.43,133.04 336.86,148.92 336.86,148.92,336.86,148.92 332.10,153.12 332.10,153.12,332.10,153.12 330.69,165.20 330.69,165.20,330.69,165.20 337.22,168.95 337.22,168.95,337.22,168.95 336.20,175.55 336.20,175.55,336.20,175.55 342.92,176.49 342.92,176.49,342.92,176.49 349.21,191.84 349.21,191.84,349.21,191.84 360.59,190.81 360.59,190.81,360.59,190.81 364.26,194.91 364.26,194.91,364.26,194.91 371.89,190.71 371.89,190.71,371.89,190.71 384.15,185.20 384.15,185.20,384.15,185.20 383.88,184.86 383.88,184.86,383.88,184.86 396.97,199.50 396.97,199.50 Z", "name" : "REIMS"},
			"ac-strasbourg": {"path": "M 483.90,177.21 C 483.90,177.21 482.75,185.75 482.75,185.75,482.75,185.75 473.44,202.75 473.44,202.75,473.44,202.75 480.18,205.84 480.18,205.84,480.18,205.84 481.29,210.93 481.29,210.93,481.29,210.93 486.05,215.63 486.05,215.63,486.05,215.63 487.38,220.21 487.38,220.21,487.38,220.21 492.10,226.30 492.10,226.30,492.10,226.30 494.60,222.77 494.60,222.77,494.60,222.77 499.69,221.98 499.69,221.98,499.69,221.98 506.86,212.39 506.86,212.39,506.86,212.39 503.45,204.94 503.45,204.94,503.45,204.94 510.43,189.78 510.43,189.78,510.43,189.78 508.45,185.78 508.45,185.78,508.45,185.78 523.22,143.85 523.22,143.85,523.22,143.85 531.00,137.62 531.00,137.62,531.00,137.62 533.90,128.34 533.90,128.34,533.90,128.34 511.08,123.18 511.08,123.18,511.08,123.18 506.82,123.50 506.82,123.50,506.82,123.50 504.35,130.58 504.35,130.58,504.35,130.58 494.20,131.72 494.20,131.72,494.20,131.72 485.44,126.20 485.44,126.20,485.44,126.20 480.36,134.25 480.36,134.25,480.36,134.25 484.93,141.72 484.93,141.72,484.93,141.72 491.87,139.33 491.87,139.33,491.87,139.33 496.16,142.91 496.16,142.91,496.16,142.91 492.92,149.80 492.92,149.80,492.92,149.80 484.88,158.93 484.88,158.93,484.88,158.93 486.48,168.45 486.48,168.45,486.48,168.45 490.31,170.33 490.31,170.33,490.31,170.33 483.90,177.21 483.90,177.21 Z", "name" : "STRASBOURG"},
			"ac-nantes": {"path": "M 192.37,145.64 C 192.37,145.64 186.01,140.04 186.01,140.04,186.01,140.04 166.12,145.70 166.12,145.70,166.12,145.70 161.37,139.86 161.37,139.86,161.37,139.86 156.15,138.90 156.15,138.90,156.15,138.90 155.03,153.13 155.03,153.13,155.03,153.13 150.82,156.78 150.82,156.78,150.82,156.78 154.86,167.84 154.86,167.84,154.86,167.84 154.54,172.54 154.54,172.54,154.54,172.54 147.50,172.15 147.50,172.15,147.50,172.15 146.63,176.54 146.63,176.54,146.63,176.54 141.21,183.91 141.21,183.91,141.21,183.91 133.77,179.19 133.77,179.19,133.77,179.19 127.15,184.93 127.15,184.93,127.15,184.93 119.84,184.24 119.84,184.24,119.84,184.24 115.11,187.30 115.11,187.30,115.11,187.30 106.40,187.96 106.40,187.96,106.40,187.96 102.58,196.87 102.58,196.87,102.58,196.87 95.03,199.77 95.03,199.77,95.03,199.77 89.50,203.78 89.50,203.78,89.50,203.78 90.86,208.58 90.86,208.58,90.86,208.58 86.81,210.02 86.81,210.02,86.81,210.02 97.85,213.97 97.85,213.97,97.85,213.97 104.29,210.73 104.29,210.73,104.29,210.73 119.61,214.08 119.61,214.08,119.61,214.08 105.17,214.38 105.17,214.38,105.17,214.38 101.33,220.83 101.33,220.83,101.33,220.83 109.42,226.57 109.42,226.57,109.42,226.57 108.40,229.00 108.40,229.00,108.40,229.00 102.22,232.54 102.22,232.54,102.22,232.54 103.36,236.49 103.36,236.49,103.36,236.49 99.26,238.49 99.26,238.49,99.26,238.49 109.33,248.21 109.33,248.21,109.33,248.21 112.92,261.75 112.92,261.75,113.09,261.76 116.58,261.95 117.40,262.27,118.23,262.59 127.75,272.35 128.26,272.87,128.26,272.87 136.33,274.72 136.33,274.72,136.33,274.72 150.42,275.23 150.42,275.23,150.42,275.23 152.50,278.69 152.50,278.69,152.50,278.69 160.37,274.73 160.37,274.73,160.37,274.73 157.08,271.28 157.08,271.28,157.08,271.28 156.25,258.74 156.25,258.74,156.25,258.74 159.97,253.95 159.97,253.95,159.97,253.95 149.54,245.32 149.54,245.32,149.54,245.32 148.58,238.87 148.58,238.87,148.58,238.87 138.08,229.26 138.08,229.26,138.08,229.26 157.58,235.09 157.58,235.09,157.58,235.09 162.69,230.47 162.69,230.47,162.69,230.47 185.62,231.44 185.62,231.44,185.62,231.44 192.06,228.57 192.06,228.57,192.06,228.57 190.43,221.63 190.43,221.63,190.43,221.63 197.40,216.83 197.40,216.83,197.40,216.83 198.94,200.63 198.94,200.63,198.94,200.63 217.73,199.43 217.73,199.43,217.73,199.43 217.86,191.50 217.86,191.50,217.86,191.50 226.96,185.94 226.96,185.94,226.96,185.94 227.55,174.36 227.55,174.36,227.55,174.36 233.41,173.95 233.41,173.95,233.41,173.95 226.31,166.03 226.31,166.03,226.31,166.03 219.89,161.38 219.89,161.38,219.89,161.38 212.18,158.45 212.18,158.45,212.18,158.45 212.23,153.73 212.23,153.73,212.23,153.73 208.87,149.10 208.87,149.10,208.87,149.10 193.29,153.19 193.29,153.19,193.29,153.19 192.37,145.64 192.37,145.64 Z", "name" : "NANTES"},
			"ac-orleans-tours": {"path": "M 275.32,281.76 C 275.32,281.76 289.26,276.44 289.26,276.44,289.26,276.44 291.46,264.90 291.46,264.90,291.46,264.90 313.26,259.32 313.26,259.32,313.26,259.32 313.24,256.67 313.24,256.67,313.24,256.67 313.41,252.60 313.41,252.60,313.41,252.60 309.92,245.74 309.92,245.74,309.92,245.74 311.14,228.04 311.14,228.04,311.14,228.04 306.50,221.67 306.50,221.67,306.50,221.67 307.14,213.97 307.14,213.97,307.14,213.97 311.81,210.71 311.81,210.71,311.81,210.71 308.48,202.78 308.48,202.78,308.48,202.78 313.75,191.96 313.75,191.96,313.75,191.96 312.98,178.59 312.98,178.59,312.98,178.59 291.73,174.72 291.73,174.72,291.73,174.72 287.79,164.96 287.79,164.96,287.79,164.96 272.55,165.28 272.55,165.28,272.55,165.28 264.78,153.10 264.78,153.10,264.78,153.10 255.61,145.47 255.61,145.47,255.61,145.47 255.28,136.52 255.28,136.52,255.28,136.52 250.83,131.42 250.83,131.42,250.83,131.42 232.95,138.16 232.95,138.16,232.95,138.16 232.31,144.22 232.31,144.22,232.31,144.22 233.50,148.24 233.50,148.24,233.50,148.24 232.95,156.26 232.95,156.26,232.95,156.26 226.51,158.60 226.51,158.60,226.51,158.60 226.31,166.02 226.31,166.02,226.31,166.02 233.41,173.94 233.41,173.94,233.41,173.94 227.55,174.35 227.55,174.35,227.55,174.35 226.84,185.75 226.84,185.75,226.84,185.75 217.85,191.49 217.85,191.49,217.85,191.49 217.72,199.42 217.72,199.42,217.72,199.42 198.80,200.59 198.80,200.59,198.80,200.59 197.39,216.82 197.39,216.82,197.39,216.82 190.42,221.62 190.42,221.62,190.42,221.62 192.05,228.56 192.05,228.56,192.05,228.56 200.68,232.12 200.68,232.12,200.68,232.12 200.74,242.36 200.74,242.36,200.74,242.36 210.96,239.95 210.96,239.95,210.96,239.95 220.60,252.80 220.60,252.80,220.60,252.80 226.85,254.32 226.85,254.32,226.85,254.32 225.56,263.72 225.56,263.72,225.56,263.72 233.76,279.41 233.76,279.41,233.76,279.41 244.17,281.54 244.17,281.54,244.17,281.54 253.55,280.58 253.55,280.58,253.55,280.58 270.86,280.97 270.86,280.97,270.86,280.97 275.32,281.76 275.32,281.76 Z", "name" : "ORLEANS-TOURS"},
			"ac-dijon": {"path": "M 307.13,213.98 C 307.13,213.98 306.49,221.68 306.49,221.68,306.49,221.68 311.13,228.05 311.13,228.05,311.13,228.05 309.91,245.75 309.91,245.75,309.91,245.75 313.40,252.61 313.40,252.61,313.40,252.61 313.25,259.33 313.25,259.33,313.25,259.33 313.44,264.27 313.44,264.27,313.44,264.27 328.45,267.89 328.45,267.89,328.45,267.89 336.13,262.42 336.13,262.42,336.13,262.42 343.50,275.12 343.50,275.12,343.50,275.12 351.40,279.45 351.40,279.45,351.40,279.45 351.30,289.16 351.30,289.16,351.30,289.16 347.85,294.58 347.85,294.58,347.85,294.58 352.30,299.21 352.30,299.21,352.30,299.21 363.28,300.44 363.28,300.44,363.28,300.44 373.90,289.93 373.90,289.93,373.90,289.93 383.51,298.28 383.51,298.28,383.51,298.28 387.15,293.87 387.15,293.87,387.15,293.87 389.25,279.90 389.25,279.90,389.25,279.90 406.46,280.03 406.46,280.03,406.46,280.03 407.32,270.82 407.32,270.82,407.32,270.82 401.34,263.26 401.34,263.26,401.34,263.26 408.57,260.89 408.57,260.89,408.57,260.89 401.66,254.36 401.66,254.36,401.66,254.36 414.73,235.13 414.73,235.13,414.73,235.13 415.55,228.97 415.55,228.97,415.55,228.97 413.06,224.11 413.06,224.11,413.06,224.11 418.62,217.21 418.62,217.21,418.62,217.21 413.28,212.75 413.28,212.75,413.28,212.75 401.55,210.70 401.55,210.70,401.55,210.70 396.38,207.12 396.38,207.12,396.38,207.12 397.18,199.67 397.18,199.67,397.18,199.67 384.10,185.01 384.10,185.01,384.10,185.01 364.21,194.72 364.21,194.72,364.21,194.72 360.53,190.63 360.53,190.63,360.53,190.63 349.16,191.66 349.16,191.66,349.16,191.66 342.87,176.31 342.87,176.31,342.87,176.31 336.15,175.37 336.15,175.37,336.15,175.37 337.17,168.77 337.17,168.77,337.17,168.77 330.69,165.21 330.69,165.21,330.69,165.21 317.37,165.56 317.37,165.56,317.37,165.56 308.05,177.68 308.05,177.68,308.05,177.68 312.99,178.60 312.99,178.60,312.99,178.60 313.76,191.97 313.76,191.97,313.76,191.97 308.49,202.79 308.49,202.79,308.49,202.79 311.82,210.72 311.82,210.72,311.82,210.72 307.13,213.98 307.13,213.98 Z", "name" : "DIJON"},
			"ac-grenoble": {"path": "M 369.29,362.29 C 369.29,362.29 367.96,369.16 367.96,369.16,367.96,369.16 363.72,369.19 363.72,369.19,363.72,369.19 362.52,374.40 362.52,374.40,362.52,374.40 359.36,375.06 359.36,375.06,359.36,375.06 359.60,379.79 359.60,379.79,359.60,379.79 341.27,387.37 341.27,387.37,341.27,387.37 346.39,407.37 346.39,407.37,346.39,407.37 350.71,410.25 350.71,410.25,350.71,410.25 350.95,414.98 350.95,414.98,350.95,414.98 359.43,419.07 359.43,419.07,359.43,419.07 362.32,413.96 362.32,413.96,362.32,413.96 368.16,415.25 368.16,415.25,368.16,415.25 367.66,418.42 367.66,418.42,367.66,418.42 381.05,416.81 381.05,416.81,381.05,416.81 387.90,420.12 387.90,420.12,387.90,420.12 400.59,416.38 400.59,416.38,400.59,416.38 395.10,425.15 395.10,425.15,395.10,425.15 403.59,421.96 403.59,421.96,403.59,421.96 412.79,428.80 412.79,428.80,412.79,428.80 417.05,424.72 417.05,424.72,417.05,424.72 420.07,426.00 420.07,426.00,420.07,426.00 422.80,422.98 422.80,422.98,422.80,422.98 418.91,417.13 418.91,417.13,418.91,417.13 414.48,415.77 414.48,415.77,414.48,415.77 409.96,411.63 409.96,411.63,409.96,411.63 413.04,407.92 413.04,407.92,413.04,407.92 420.41,407.50 420.41,407.50,420.41,407.50 422.63,404.01 422.63,404.01,422.63,404.01 418.00,401.46 418.00,401.46,418.00,401.46 421.08,397.77 421.08,397.77,421.08,397.77 426.19,397.54 426.19,397.54,426.19,397.54 431.58,388.96 431.58,388.96,431.58,388.96 435.61,387.80 435.61,387.80,435.61,387.80 438.89,385.48 438.89,385.48,438.89,385.48 446.03,384.35 446.03,384.35,446.03,384.35 453.19,387.12 453.19,387.12,453.19,387.12 454.00,379.39 454.00,379.39,454.00,379.39 446.33,375.91 446.33,375.91,446.33,375.91 446.71,370.37 446.71,370.37,446.71,370.37 454.16,373.01 454.16,373.01,454.16,373.01 465.39,367.95 465.39,367.95,465.39,367.95 477.19,366.95 477.19,366.95,477.19,366.95 482.00,362.78 482.00,362.78,482.00,362.78 487.39,362.52 487.39,362.52,487.39,362.52 487.75,353.38 487.75,353.38,487.75,353.38 490.84,349.39 490.84,349.39,490.84,349.39 483.75,345.67 483.75,345.67,483.75,345.67 482.15,336.13 482.15,336.13,482.15,336.13 474.39,329.86 474.39,329.86,474.39,329.86 474.83,323.50 474.83,323.50,474.83,323.50 483.49,320.92 483.49,320.92,483.49,320.92 484.60,312.93 484.60,312.93,484.60,312.93 476.29,306.36 476.29,306.36,476.29,306.36 473.04,300.35 473.04,300.35,473.04,300.35 479.40,298.21 479.40,298.21,479.40,298.21 476.91,289.19 476.91,289.19,476.91,289.19 459.74,288.23 459.74,288.23,459.74,288.23 452.58,293.66 452.58,293.66,452.58,293.66 452.42,300.04 452.42,300.04,452.42,300.04 441.28,305.79 441.28,305.79,441.28,305.79 440.01,305.86 440.01,305.86,440.01,305.86 436.00,322.00 436.00,322.00,436.00,322.00 427.33,330.67 427.33,330.67,427.33,330.67 415.67,326.00 415.67,326.00,415.67,326.00 408.00,325.33 408.00,325.33,408.00,325.33 398.67,329.67 398.67,329.67,398.67,329.67 392.33,340.33 392.33,340.33,392.33,340.33 389.33,353.33 389.33,353.33,389.33,353.33 380.33,360.67 380.33,360.67,380.33,360.67 369.29,362.29 369.29,362.29 Z", "name" : "GRENOBLE"},
			"ac-lyon": {"path": "M 373.93,289.93 C 373.93,289.93 363.31,300.44 363.31,300.44,363.31,300.44 352.33,299.21 352.33,299.21,352.33,299.21 347.88,294.58 347.88,294.58,347.88,294.58 343.69,295.04 343.69,295.04,343.69,295.04 342.38,309.96 342.38,309.96,342.38,309.96 336.02,316.13 336.02,316.13,336.02,316.13 340.43,321.79 340.43,321.79,340.43,321.79 338.96,326.71 338.96,326.71,338.96,326.71 347.72,343.02 347.72,343.02,347.72,343.02 345.72,351.52 345.72,351.52,345.72,351.52 359.39,350.07 359.39,350.07,359.39,350.07 361.05,354.60 361.05,354.60,361.05,354.60 365.33,354.01 365.33,354.01,365.33,354.01 369.29,362.29 369.29,362.29,369.29,362.29 380.35,360.70 380.35,360.70,380.35,360.70 389.48,353.30 389.48,353.30,389.48,353.30 392.30,340.39 392.30,340.39,392.30,340.39 398.83,329.48 398.83,329.48,398.83,329.48 408.00,325.26 408.00,325.26,408.00,325.26 415.52,325.87 415.52,325.87,415.52,325.87 427.35,330.61 427.35,330.61,427.35,330.61 436.17,321.87 436.17,321.87,436.17,321.87 440.01,305.86 440.01,305.86,440.01,305.86 438.70,302.32 438.70,302.32,438.70,302.32 447.08,295.56 447.08,295.56,447.08,295.56 443.27,284.14 443.27,284.14,443.27,284.14 423.45,296.91 423.45,296.91,423.45,296.91 417.56,292.15 417.56,292.15,417.56,292.15 411.94,295.72 411.94,295.72,411.94,295.72 403.70,288.03 403.70,288.03,403.70,288.03 408.59,283.97 408.59,283.97,408.59,283.97 406.46,280.04 406.46,280.04,406.46,280.04 389.25,279.91 389.25,279.91,389.25,279.91 387.15,293.88 387.15,293.88,387.15,293.88 383.51,298.29 383.51,298.29,383.51,298.29 373.93,289.93 373.93,289.93 Z", "name" : "LYON"},
			"ac-bordeaux": {"path": "M 225.48,389.86 C 225.48,389.86 225.27,384.70 225.27,384.70,225.27,384.70 234.14,370.77 234.14,370.77,234.14,370.77 234.31,360.22 234.31,360.22,234.31,360.22 226.41,351.73 226.41,351.73,226.41,351.73 231.09,345.33 231.09,345.33,231.09,345.33 231.58,338.27 231.58,338.27,231.58,338.27 226.90,338.57 226.90,338.57,226.90,338.57 217.69,326.53 217.69,326.53,217.69,326.53 207.08,320.06 207.08,320.06,207.08,320.06 198.84,324.57 198.84,324.57,198.84,324.57 194.05,336.52 194.05,336.52,194.05,336.52 187.14,338.36 187.14,338.36,187.14,338.36 187.24,345.02 187.24,345.02,187.24,345.02 176.21,350.43 176.21,350.43,176.21,350.43 175.16,354.76 175.16,354.76,175.16,354.76 170.81,358.09 170.81,358.09,170.81,358.09 163.88,351.25 163.88,351.25,163.88,351.25 156.92,349.75 156.92,349.75,156.92,349.75 156.82,343.08 156.82,343.08,156.82,343.08 152.39,339.64 152.39,339.64,152.39,339.64 145.30,339.93 145.30,339.93,145.30,339.93 146.16,358.94 146.16,358.94,146.16,358.94 140.75,338.92 140.75,338.92,140.75,338.92 131.80,329.54 131.80,329.54,131.80,329.54 131.05,323.95 131.05,323.95,131.05,323.95 127.41,327.63 127.41,327.63,129.61,336.26 119.59,377.06 119.44,377.72,119.44,377.72 123.95,373.80 123.95,373.80,123.95,373.80 128.26,380.98 128.26,380.98,128.26,380.98 118.36,380.99 118.36,380.99,118.36,380.99 116.83,386.74 116.83,386.74,116.83,386.74 110.15,422.19 110.15,422.19,110.15,422.19 102.92,440.95 102.92,440.95,102.92,440.95 95.97,449.83 95.97,449.83,95.97,449.83 89.02,454.56 89.02,454.56,89.02,454.56 81.58,455.81 81.58,455.81,81.58,455.81 82.76,459.21 82.76,459.21,82.76,459.21 87.82,459.49 87.82,459.49,87.82,459.49 90.30,464.63 90.30,464.63,90.30,464.63 95.34,461.30 95.34,461.30,95.34,461.30 99.26,465.97 99.26,465.97,99.26,465.97 94.87,476.27 94.87,476.27,94.87,476.27 100.67,478.26 100.67,478.26,100.67,478.26 105.22,473.80 105.22,473.80,105.22,473.80 107.18,478.07 107.18,478.07,107.18,478.07 127.48,486.98 127.48,486.98,127.48,486.98 132.55,495.32 132.55,495.32,132.55,495.32 147.76,496.17 147.76,496.17,147.76,496.17 149.17,483.87 149.17,483.87,149.17,483.87 154.49,484.57 154.49,484.57,154.49,484.57 154.05,478.75 154.05,478.75,154.05,478.75 165.13,469.77 165.13,469.77,165.13,469.77 165.37,462.17 165.37,462.17,165.37,462.17 162.09,460.60 162.09,460.60,162.09,460.60 161.31,451.51 161.31,451.51,161.31,451.51 148.91,452.13 148.91,452.13,148.91,452.13 154.96,446.88 154.96,446.88,154.96,446.88 154.26,432.40 154.26,432.40,154.26,432.40 165.90,427.50 165.90,427.50,165.90,427.50 167.61,431.48 167.61,431.48,167.61,431.48 171.38,425.35 171.38,425.35,171.38,425.35 180.04,425.79 180.04,425.79,180.04,425.79 187.58,423.00 187.58,423.00,187.58,423.00 196.12,426.25 196.12,426.25,196.12,426.25 199.91,424.41 199.91,424.41,199.91,424.41 200.35,422.09 200.35,422.09,200.35,422.09 208.63,420.89 208.63,420.89,208.63,420.89 211.23,412.03 211.23,412.03,211.23,412.03 207.25,408.20 207.25,408.20,207.25,408.20 207.69,406.01 207.69,406.01,207.69,406.01 215.01,406.31 215.01,406.31,215.01,406.31 213.34,397.83 213.34,397.83,213.34,397.83 217.83,394.19 217.83,394.19,217.83,394.19 218.03,391.29 218.03,391.29,218.03,391.29 225.48,389.86 225.48,389.86 Z", "name" : "BORDEAUX"},
			"ac-aix-marseille": {"path": "M 424.34,493.65 C 424.34,493.65 431.25,492.00 431.51,492.11,431.51,492.11 423.00,472.00 423.00,472.00,423.00,472.00 423.75,456.50 423.75,456.50,423.75,456.50 439.00,453.25 439.00,453.25,439.00,453.25 448.75,451.25 448.75,451.25,448.75,451.25 461.75,442.50 461.75,442.50,461.75,442.50 471.25,436.00 471.25,436.00,471.25,436.00 478.25,425.00 478.25,425.00,478.25,425.00 480.71,421.04 480.71,421.04,480.71,421.04 475.93,416.90 475.93,416.90,475.93,416.90 478.76,410.82 478.76,410.82,478.76,410.82 474.55,406.29 474.55,406.29,474.55,406.29 477.33,399.13 477.33,399.13,477.33,399.13 479.65,396.54 479.65,396.54,479.65,396.54 484.13,395.25 484.13,395.25,484.13,395.25 483.19,386.18 483.19,386.18,483.19,386.18 476.20,384.95 476.20,384.95,476.20,384.95 465.37,367.96 465.37,367.96,465.37,367.96 454.14,373.02 454.14,373.02,454.14,373.02 446.69,370.38 446.69,370.38,446.69,370.38 446.31,375.92 446.31,375.92,446.31,375.92 453.98,379.40 453.98,379.40,453.98,379.40 453.17,387.13 453.17,387.13,453.17,387.13 446.01,384.36 446.01,384.36,446.01,384.36 438.87,385.49 438.87,385.49,438.87,385.49 435.59,387.81 435.59,387.81,435.59,387.81 431.56,388.97 431.56,388.97,431.56,388.97 426.17,397.55 426.17,397.55,426.17,397.55 421.06,397.78 421.06,397.78,421.06,397.78 417.98,401.47 417.98,401.47,417.98,401.47 422.61,404.02 422.61,404.02,422.61,404.02 420.39,407.51 420.39,407.51,420.39,407.51 413.02,407.93 413.02,407.93,413.02,407.93 409.94,411.64 409.94,411.64,409.94,411.64 414.46,415.78 414.46,415.78,414.46,415.78 418.89,417.14 418.89,417.14,418.89,417.14 422.78,422.99 422.78,422.99,422.78,422.99 420.05,426.01 420.05,426.01,420.05,426.01 417.03,424.73 417.03,424.73,417.03,424.73 412.77,428.81 412.77,428.81,412.77,428.81 403.57,421.97 403.57,421.97,403.57,421.97 395.08,425.16 395.08,425.16,395.08,425.16 400.57,416.39 400.57,416.39,400.57,416.39 387.88,420.13 387.88,420.13,387.88,420.13 381.03,416.82 381.03,416.82,381.03,416.82 378.04,423.32 378.04,423.32,378.04,423.32 384.43,433.21 384.43,433.21,384.43,433.21 385.40,439.55 385.40,439.55,385.40,439.55 375.05,446.20 375.05,446.20,375.05,446.20 373.60,455.00 373.60,455.00,373.60,455.00 366.12,456.80 366.12,456.80,366.12,456.80 366.74,462.24 366.74,462.24,366.74,462.24 358.59,463.60 358.59,463.60,358.59,463.60 357.95,468.84 357.95,468.84,357.95,468.84 367.79,469.67 367.79,469.67,367.79,469.67 371.62,475.44 371.62,475.44,371.62,475.44 380.52,477.60 380.52,477.60,380.52,477.60 382.59,472.16 382.59,472.16,382.59,472.16 388.23,472.47 388.23,472.47,388.23,472.47 391.78,478.23 391.78,478.23,391.78,478.23 401.27,475.98 401.27,475.98,401.27,475.98 406.88,480.73 406.88,480.73,406.88,480.73 402.41,484.09 402.41,484.09,402.41,484.09 406.76,486.55 406.76,486.55,406.76,486.55 419.99,487.29 419.99,487.29,419.99,487.29 424.34,493.65 424.34,493.65 Z", "name" : "AIX-MARSEILLE"},
			"ac-nice": {"path": "M 431.51,492.11 C 431.51,492.11 443.43,495.56 443.43,495.56,443.43,495.56 442.67,490.23 442.67,490.23,442.67,490.23 452.39,492.72 452.39,492.72,452.39,492.72 454.68,488.13 454.68,488.13,454.68,488.13 463.25,489.02 463.25,489.02,463.25,489.02 469.75,482.60 469.75,482.60,469.75,482.60 463.61,481.41 463.61,481.41,463.61,481.41 468.52,475.86 468.52,475.86,468.52,475.86 474.79,475.10 474.79,475.10,474.79,475.10 480.07,465.55 480.07,465.55,480.07,465.55 485.54,465.72 485.54,465.72,485.54,465.72 493.30,455.60 493.30,455.60,493.30,455.60 504.99,454.32 504.99,454.32,504.99,454.32 509.24,441.78 509.24,441.78,509.24,441.78 516.74,435.54 516.74,435.54,516.74,435.54 513.61,427.59 513.61,427.59,513.61,427.59 502.44,429.74 502.44,429.74,502.44,429.74 490.81,426.32 490.81,426.32,490.81,426.32 480.71,421.04 480.71,421.04,480.71,421.04 471.25,436.00 471.25,436.00,471.25,436.00 448.66,451.31 448.66,451.31,448.66,451.31 423.72,456.53 423.72,456.53,423.72,456.53 423.03,472.00 423.03,472.00,423.03,472.00 431.51,492.11 431.51,492.11 Z", "name" : "NICE"},
			"ac-corse": {"path": "M 521.11,496.27 C 521.11,496.27 518.31,512.22 518.31,512.22,518.31,512.22 514.36,510.39 514.36,510.39,514.36,510.39 508.59,513.90 508.59,513.90,508.59,513.90 499.39,516.16 499.39,516.16,499.39,516.16 492.35,527.99 492.35,527.99,492.35,527.99 492.39,533.45 492.39,533.45,492.39,533.45 488.97,536.08 488.97,536.08,488.97,536.08 489.54,542.83 489.54,542.83,489.54,542.83 495.96,543.65 495.96,543.65,495.96,543.65 490.54,551.39 490.54,551.39,490.54,551.39 495.96,552.21 495.96,552.21,495.96,552.21 492.96,559.13 492.96,559.13,492.96,559.13 501.96,560.74 501.96,560.74,501.96,560.74 496.48,566.54 496.48,566.54,496.48,566.54 500.23,570.33 500.23,570.33,500.23,570.33 498.79,573.89 498.79,573.89,498.79,573.89 507.24,574.37 507.24,574.37,507.24,574.37 514.14,580.87 514.14,580.87,514.14,580.87 519.66,574.52 519.66,574.52,519.66,574.52 522.55,553.30 522.55,553.30,522.55,553.30 522.21,548.28 522.21,548.28,522.21,548.28 529.20,541.70 529.20,541.70,529.20,541.70 529.77,523.10 529.77,523.10,529.77,523.10 525.92,511.08 525.92,511.08,525.92,511.08 526.18,496.59 526.18,496.59,526.18,496.59 520.93,495.94 520.93,495.94,520.93,495.94 521.11,496.27 521.11,496.27 Z", "name" : "CORSE"},
			"ac-toulouse": {"path": "M 301.26,454.58 C 301.26,454.58 305.32,444.81 305.32,444.81,305.32,444.81 309.72,446.73 309.72,446.73,309.72,446.73 316.54,442.11 316.54,442.11,316.54,442.11 316.57,437.39 316.57,437.39,316.57,437.39 321.91,433.80 321.91,433.80,321.91,433.80 314.70,430.82 314.70,430.82,314.70,430.82 317.78,424.12 317.78,424.12,317.78,424.12 307.53,421.05 307.53,421.05,307.53,421.05 307.53,404.67 307.53,404.67,307.53,404.67 302.48,396.06 302.48,396.06,302.48,396.06 301.45,386.42 301.45,386.42,301.45,386.42 298.04,386.64 298.04,386.64,298.04,386.64 292.53,376.47 292.53,376.47,292.53,376.47 280.00,394.10 280.00,394.10,280.00,394.10 268.21,393.02 268.21,393.02,268.21,393.02 264.91,391.59 264.91,391.59,264.91,391.59 266.64,382.80 266.64,382.80,266.64,382.80 261.13,380.82 261.13,380.82,261.13,380.82 262.77,371.73 262.77,371.73,262.77,371.73 244.68,372.86 244.68,372.86,244.68,372.86 234.12,370.85 234.12,370.85,234.12,370.85 225.25,384.78 225.25,384.78,225.25,384.78 225.46,389.94 225.46,389.94,225.46,389.94 218.01,391.33 218.01,391.33,218.01,391.33 217.81,394.23 217.81,394.23,217.81,394.23 213.32,397.87 213.32,397.87,213.32,397.87 214.99,406.35 214.99,406.35,214.99,406.35 207.67,406.05 207.67,406.05,207.67,406.05 207.23,408.24 207.23,408.24,207.23,408.24 211.21,412.07 211.21,412.07,211.21,412.07 208.61,420.93 208.61,420.93,208.61,420.93 200.33,422.13 200.33,422.13,200.33,422.13 199.89,424.45 199.89,424.45,199.89,424.45 196.10,426.29 196.10,426.29,196.10,426.29 187.56,423.04 187.56,423.04,187.56,423.04 180.01,426.07 180.01,426.07,180.01,426.07 171.37,425.39 171.37,425.39,171.37,425.39 167.60,431.52 167.60,431.52,167.60,431.52 165.89,427.54 165.89,427.54,165.89,427.54 154.25,432.44 154.25,432.44,154.25,432.44 154.95,446.92 154.95,446.92,154.95,446.92 148.90,452.17 148.90,452.17,148.90,452.17 161.30,451.55 161.30,451.55,161.30,451.55 162.07,460.88 162.07,460.88,162.07,460.88 165.35,462.44 165.35,462.44,165.35,462.44 165.13,469.81 165.13,469.81,165.13,469.81 154.03,479.03 154.03,479.03,154.03,479.03 154.49,484.61 154.49,484.61,154.49,484.61 149.17,483.91 149.17,483.91,149.17,483.91 147.74,496.44 147.74,496.44,147.74,496.44 158.46,504.30 158.46,504.30,158.46,504.30 167.89,503.40 167.89,503.40,167.89,503.40 172.43,507.27 172.43,507.27,172.43,507.27 177.09,505.31 177.09,505.31,177.09,505.31 181.05,505.59 181.05,505.59,181.05,505.59 189.93,508.03 189.93,508.03,189.93,508.03 190.62,498.06 190.62,498.06,190.62,498.06 198.25,499.43 198.25,499.43,198.25,499.43 211.96,506.98 211.96,506.98,211.96,506.98 217.93,506.48 217.93,506.48,217.93,506.48 221.68,513.63 221.68,513.63,221.68,513.63 230.71,513.86 230.71,513.86,230.71,513.86 235.30,516.90 235.30,516.90,235.30,516.90 233.87,521.26 233.87,521.26,233.87,521.26 239.84,523.30 239.84,523.30,239.84,523.30 256.09,513.10 256.09,513.10,256.09,513.10 253.29,508.60 253.29,508.60,253.29,508.60 248.12,509.70 248.12,509.70,248.12,509.70 242.20,504.94 242.20,504.94,242.20,504.94 248.94,498.89 248.94,498.89,248.94,498.89 249.11,489.39 249.11,489.39,249.11,489.39 238.24,480.31 238.24,480.31,238.24,480.31 238.46,472.08 238.46,472.08,238.46,472.08 243.84,471.82 243.84,471.82,243.84,471.82 244.56,467.33 244.56,467.33,244.56,467.33 250.72,469.84 250.72,469.84,250.72,469.84 254.90,467.17 254.90,467.17,254.90,467.17 263.10,471.24 263.10,471.24,263.10,471.24 263.67,467.10 263.67,467.10,263.67,467.10 276.37,471.41 276.37,471.41,276.37,471.41 283.41,467.69 283.41,467.69,283.41,467.69 278.84,460.22 278.84,460.22,278.84,460.22 284.77,456.11 284.77,456.11,284.77,456.11 290.49,459.21 290.49,459.21,290.49,459.21 297.91,454.21 297.91,454.21,297.91,454.21 301.26,454.58 301.26,454.58 Z", "name" : "TOULOUSE"},
			"ac-montpellier": {"path": "M 263.46,467.13 C 263.46,467.13 263.19,471.12 263.19,471.12,263.19,471.12 254.93,467.01 254.93,467.01,254.93,467.01 250.68,469.84 250.68,469.84,250.68,469.84 244.52,467.33 244.52,467.33,244.52,467.33 243.65,471.85 243.65,471.85,243.65,471.85 238.52,471.93 238.52,471.93,238.52,471.93 238.28,480.30 238.28,480.30,238.28,480.30 249.06,489.39 249.06,489.39,249.06,489.39 248.89,498.89 248.89,498.89,248.89,498.89 242.15,504.94 242.15,504.94,242.15,504.94 248.22,509.67 248.22,509.67,248.22,509.67 253.09,508.49 253.09,508.49,253.09,508.49 256.04,513.11 256.04,513.11,256.04,513.11 239.79,523.31 239.79,523.31,239.79,523.31 246.90,533.47 246.90,533.47,246.90,533.47 257.50,527.39 257.50,527.39,257.50,527.39 262.62,531.01 262.62,531.01,262.62,531.01 269.86,536.69 269.86,536.69,269.86,536.69 275.85,531.75 275.85,531.75,275.85,531.75 280.69,535.35 280.69,535.35,280.69,535.35 286.20,529.28 286.20,529.28,286.20,529.28 298.34,529.40 298.34,529.40,298.34,529.40 301.83,532.10 301.83,532.10,301.83,532.10 304.93,528.10 304.93,528.10,304.93,528.10 301.07,522.61 301.07,522.61,301.07,522.61 297.83,520.48 297.83,520.48,297.83,520.48 296.59,505.69 296.59,505.69,296.58,504.84 296.35,488.73 307.51,482.65,307.71,482.51 311.38,479.81 318.69,480.50,319.08,480.20 326.46,474.27 329.25,474.99,329.63,474.36 336.90,462.37 349.01,463.05,349.01,463.05 351.48,468.18 351.48,468.18,351.48,468.18 357.94,468.82 357.94,468.82,357.94,468.82 358.58,463.58 358.58,463.58,358.58,463.58 366.86,462.38 366.86,462.38,366.86,462.38 366.12,456.78 366.12,456.78,366.12,456.78 373.60,454.98 373.60,454.98,373.60,454.98 375.05,446.18 375.05,446.18,375.05,446.18 385.40,439.53 385.40,439.53,385.40,439.53 384.43,433.19 384.43,433.19,384.43,433.19 378.04,423.30 378.04,423.30,378.04,423.30 381.03,416.80 381.03,416.80,381.03,416.80 367.64,418.41 367.64,418.41,367.64,418.41 368.14,415.24 368.14,415.24,368.14,415.24 362.30,413.95 362.30,413.95,362.30,413.95 359.41,419.06 359.41,419.06,359.41,419.06 350.93,414.97 350.93,414.97,350.93,414.97 350.69,410.24 350.69,410.24,350.69,410.24 346.37,407.36 346.37,407.36,346.37,407.36 341.25,387.36 341.25,387.36,341.25,387.36 333.27,384.13 333.27,384.13,333.27,384.13 333.01,379.81 333.01,379.81,333.01,379.81 329.90,379.92 329.90,379.92,329.90,379.92 327.80,385.63 327.80,385.63,327.80,385.63 323.84,385.68 323.84,385.68,323.84,385.68 323.38,380.10 323.38,380.10,323.38,380.10 317.48,375.47 317.48,375.47,317.48,375.47 308.60,381.22 308.60,381.22,308.60,381.22 302.50,396.02 302.50,396.02,302.50,396.02 307.55,404.63 307.55,404.63,307.55,404.63 307.55,421.01 307.55,421.01,307.55,421.01 317.80,424.08 317.80,424.08,317.80,424.08 314.72,430.78 314.72,430.78,314.72,430.78 321.93,433.76 321.93,433.76,321.93,433.76 316.59,437.35 316.59,437.35,316.59,437.35 316.56,442.07 316.56,442.07,316.56,442.07 309.62,446.53 309.62,446.53,309.62,446.53 305.34,444.77 305.34,444.77,305.34,444.77 301.28,454.54 301.28,454.54,301.28,454.54 297.91,454.21 297.91,454.21,297.91,454.21 290.49,459.21 290.49,459.21,290.49,459.21 284.77,456.11 284.77,456.11,284.77,456.11 278.84,460.22 278.84,460.22,278.84,460.22 283.41,467.69 283.41,467.69,283.41,467.69 276.37,471.41 276.37,471.41,276.37,471.41 263.46,467.13 263.46,467.13 Z", "name" : "MONTPELLIER"},
			"ac-nancy-metz": {"path": "M 444.59,189.91 C 444.59,189.91 444.93,195.05 444.93,195.05,444.93,195.05 455.58,192.31 455.58,192.31,455.58,192.31 460.38,198.57 460.38,198.57,460.38,198.57 463.55,193.75 463.55,193.75,463.55,193.75 473.45,202.72 473.45,202.72,473.45,202.72 482.76,185.72 482.76,185.72,482.76,185.72 483.91,177.18 483.91,177.18,483.91,177.18 490.32,170.32 490.32,170.32,490.32,170.32 486.49,168.44 486.49,168.44,486.49,168.44 484.89,158.92 484.89,158.92,484.89,158.92 492.93,149.79 492.93,149.79,492.93,149.79 496.04,143.16 496.04,143.16,496.04,143.16 491.88,139.32 491.88,139.32,491.88,139.32 484.94,141.71 484.94,141.71,484.94,141.71 480.37,134.24 480.37,134.24,480.37,134.24 485.45,126.19 485.45,126.19,485.45,126.19 494.21,131.71 494.21,131.71,494.21,131.71 504.36,130.57 504.36,130.57,504.36,130.57 506.83,123.49 506.83,123.49,506.83,123.49 507.12,123.47 507.12,123.47,507.12,123.47 506.16,116.68 506.16,116.68,506.16,116.68 499.63,115.62 499.63,115.62,499.63,115.62 491.00,119.17 491.00,119.17,491.00,119.17 480.16,112.45 480.16,112.45,480.16,112.45 473.67,116.53 473.67,116.53,473.67,116.53 462.34,100.35 462.34,100.35,462.34,100.35 457.20,101.17 457.20,101.17,457.20,101.17 452.93,97.60 452.93,97.60,452.93,97.60 441.39,100.84 441.39,100.84,441.39,100.84 431.33,93.67 431.33,93.67,431.33,93.67 421.44,95.27 421.44,95.27,421.44,95.27 416.48,93.38 416.48,93.38,416.48,93.38 413.48,96.04 413.48,96.04,413.48,96.04 405.70,93.88 405.70,93.88,405.70,93.88 397.75,113.76 397.75,113.76,397.75,113.76 396.19,124.44 396.19,124.44,396.19,124.44 401.10,126.88 401.10,126.88,401.10,126.88 399.06,140.15 399.06,140.15,399.06,140.15 392.86,139.80 392.86,139.80,392.86,139.80 396.17,148.81 396.17,148.81,396.17,148.81 401.77,150.87 401.77,150.87,401.77,150.87 416.74,163.35 416.74,163.35,416.74,163.35 416.02,169.77 416.02,169.77,416.02,169.77 426.36,171.46 426.36,171.46,426.36,171.46 426.57,180.63 426.57,180.63,426.57,180.63 423.82,183.49 423.82,183.49,423.82,183.49 432.79,192.93 432.79,192.93,432.79,192.93 444.59,189.91 444.59,189.91 Z", "name" : "NANCY-METZ"},
			"ac-poitiers": {"path": "M 152.39,339.68 C 152.39,339.68 156.82,343.12 156.82,343.12,156.82,343.12 156.92,349.79 156.92,349.79,156.92,349.79 163.88,351.29 163.88,351.29,163.88,351.29 170.81,358.13 170.81,358.13,170.81,358.13 175.16,354.80 175.16,354.80,175.16,354.80 176.21,350.47 176.21,350.47,176.21,350.47 187.24,345.06 187.24,345.06,187.24,345.06 187.14,338.40 187.14,338.40,187.14,338.40 194.05,336.56 194.05,336.56,194.05,336.56 198.84,324.61 198.84,324.61,198.84,324.61 207.08,320.10 207.08,320.10,207.08,320.10 219.83,308.08 219.83,308.08,219.83,308.08 212.73,295.40 212.73,295.40,212.73,295.40 223.65,284.63 223.65,284.63,223.65,284.63 233.78,279.41 233.78,279.41,233.78,279.41 225.58,263.72 225.58,263.72,225.58,263.72 226.87,254.32 226.87,254.32,226.87,254.32 220.62,252.80 220.62,252.80,220.62,252.80 210.98,239.95 210.98,239.95,210.98,239.95 200.76,242.36 200.76,242.36,200.76,242.36 200.70,232.12 200.70,232.12,200.70,232.12 192.07,228.56 192.07,228.56,192.07,228.56 185.63,231.43 185.63,231.43,185.63,231.43 162.70,230.46 162.70,230.46,162.70,230.46 157.59,235.08 157.59,235.08,157.59,235.08 138.09,229.25 138.09,229.25,138.09,229.25 148.59,238.86 148.59,238.86,148.59,238.86 149.55,245.31 149.55,245.31,149.55,245.31 159.98,253.94 159.98,253.94,159.98,253.94 156.26,258.73 156.26,258.73,156.26,258.73 157.09,271.27 157.09,271.27,157.09,271.27 160.38,274.72 160.38,274.72,160.38,274.72 152.51,278.68 152.51,278.68,152.51,278.68 150.43,275.22 150.43,275.22,150.43,275.22 136.34,274.71 136.34,274.71,136.34,274.71 131.06,281.63 131.06,281.63,131.06,281.63 139.36,292.37 139.36,292.37,139.36,292.37 134.74,293.77 134.74,293.77,134.74,293.77 138.32,299.25 138.32,299.25,138.32,299.25 133.28,306.75 133.28,306.75,133.28,306.75 127.35,309.92 127.35,309.92,127.35,309.92 121.82,304.65 121.82,304.65,121.82,304.65 112.72,301.36 112.72,301.36,112.72,301.36 113.79,306.41 113.79,306.41,113.79,306.41 123.76,313.37 123.76,313.37,123.76,313.37 125.80,318.15 125.80,318.15,125.80,318.15 133.36,321.74 133.36,321.74,133.36,321.74 140.18,329.35 140.18,329.35,140.18,329.35 145.30,339.97 145.30,339.97,145.30,339.97 152.39,339.68 152.39,339.68 Z", "name" : "POITIERS"},
			"ac-limoges": {"path": "M 207.07,320.12 C 207.07,320.12 217.68,326.59 217.68,326.59,217.68,326.59 226.88,338.61 226.88,338.61,226.88,338.61 231.57,338.33 231.57,338.33,231.57,338.33 231.08,345.39 231.08,345.39,231.08,345.39 226.40,351.79 226.40,351.79,226.40,351.79 234.30,360.28 234.30,360.28,234.30,360.28 234.13,370.83 234.13,370.83,234.13,370.83 244.69,372.84 244.69,372.84,244.69,372.84 262.78,371.71 262.78,371.71,262.78,371.71 266.99,365.72 266.99,365.72,266.99,365.72 268.17,360.79 268.17,360.79,268.17,360.79 272.95,357.17 272.95,357.17,272.95,357.17 274.91,349.23 274.91,349.23,274.91,349.23 284.42,346.70 284.42,346.70,284.42,346.70 284.80,337.00 284.80,337.00,284.80,337.00 287.13,332.13 287.13,332.13,287.13,332.13 282.44,326.32 282.44,326.32,282.44,326.32 284.44,321.99 284.44,321.99,284.44,321.99 279.98,317.02 279.98,317.02,279.98,317.02 289.23,313.31 289.23,313.31,289.23,313.31 290.60,302.34 290.60,302.34,290.60,302.34 278.17,289.98 278.17,289.98,278.17,289.98 275.34,281.77 275.34,281.77,275.34,281.77 270.88,280.97 270.88,280.97,270.88,280.97 253.57,280.58 253.57,280.58,253.57,280.58 244.26,281.70 244.26,281.70,244.26,281.70 233.77,279.41 233.77,279.41,233.77,279.41 223.64,284.63 223.64,284.63,223.64,284.63 212.72,295.40 212.72,295.40,212.72,295.40 219.82,308.08 219.82,308.08,219.82,308.08 207.07,320.12 207.07,320.12 Z", "name" : "LIMOGES"},
			"ac-clermont": {"path": "M 278.18,289.96 C 278.18,289.96 290.61,302.32 290.61,302.32,290.61,302.32 289.24,313.29 289.24,313.29,289.24,313.29 279.99,317.00 279.99,317.00,279.99,317.00 284.45,321.97 284.45,321.97,284.45,321.97 282.45,326.30 282.45,326.30,282.45,326.30 287.14,332.11 287.14,332.11,287.14,332.11 284.82,336.98 284.82,336.98,284.82,336.98 284.44,346.68 284.44,346.68,284.44,346.68 274.93,349.21 274.93,349.21,274.93,349.21 272.97,357.15 272.97,357.15,272.97,357.15 268.19,360.77 268.19,360.77,268.19,360.77 267.01,365.70 267.01,365.70,267.01,365.70 262.80,371.69 262.80,371.69,262.80,371.69 261.16,380.78 261.16,380.78,261.16,380.78 266.67,382.76 266.67,382.76,266.67,382.76 264.94,391.55 264.94,391.55,264.94,391.55 268.24,392.98 268.24,392.98,268.24,392.98 280.03,394.06 280.03,394.06,280.03,394.06 292.56,376.43 292.56,376.43,292.56,376.43 298.07,386.60 298.07,386.60,298.07,386.60 301.48,386.38 301.48,386.38,301.48,386.38 302.51,396.02 302.51,396.02,302.51,396.02 308.61,381.22 308.61,381.22,308.61,381.22 317.49,375.47 317.49,375.47,317.49,375.47 323.39,380.10 323.39,380.10,323.39,380.10 323.85,385.68 323.85,385.68,323.85,385.68 327.81,385.63 327.81,385.63,327.81,385.63 329.91,379.92 329.91,379.92,329.91,379.92 333.02,379.81 333.02,379.81,333.02,379.81 333.28,384.13 333.28,384.13,333.28,384.13 341.26,387.36 341.26,387.36,341.26,387.36 359.59,379.78 359.59,379.78,359.59,379.78 359.35,375.05 359.35,375.05,359.35,375.05 362.51,374.39 362.51,374.39,362.51,374.39 363.71,369.18 363.71,369.18,363.71,369.18 367.95,369.15 367.95,369.15,367.95,369.15 369.28,362.28 369.28,362.28,369.28,362.28 365.32,354.00 365.32,354.00,365.32,354.00 361.04,354.59 361.04,354.59,361.04,354.59 359.38,350.06 359.38,350.06,359.38,350.06 345.71,351.51 345.71,351.51,345.71,351.51 347.71,343.01 347.71,343.01,347.71,343.01 338.95,326.70 338.95,326.70,338.95,326.70 340.42,321.78 340.42,321.78,340.42,321.78 336.01,316.12 336.01,316.12,336.01,316.12 342.37,309.95 342.37,309.95,342.37,309.95 343.68,295.03 343.68,295.03,343.68,295.03 347.87,294.57 347.87,294.57,347.87,294.57 351.32,289.15 351.32,289.15,351.32,289.15 351.42,279.44 351.42,279.44,351.42,279.44 343.52,275.11 343.52,275.11,343.52,275.11 336.15,262.41 336.15,262.41,336.15,262.41 328.47,267.88 328.47,267.88,328.47,267.88 313.46,264.26 313.46,264.26,313.46,264.26 313.27,259.32 313.27,259.32,313.27,259.32 291.47,264.90 291.47,264.90,291.47,264.90 289.27,276.44 289.27,276.44,289.27,276.44 275.33,281.76 275.33,281.76,275.33,281.76 278.18,289.96 278.18,289.96 Z", "name" : "CLERMONT-FERRAND"},
			"ac-besancon": {"path": "M 463.53,193.76 C 463.53,193.76 460.36,198.58 460.36,198.58,460.36,198.58 455.56,192.32 455.56,192.32,455.56,192.32 444.91,195.06 444.91,195.06,444.91,195.06 444.57,189.92 444.57,189.92,444.57,189.92 432.77,192.92 432.77,192.92,432.77,192.92 424.75,202.74 424.75,202.74,424.75,202.74 425.27,207.49 425.27,207.49,425.27,207.49 421.43,209.78 421.43,209.78,421.43,209.78 419.34,207.44 419.34,207.44,419.34,207.44 413.31,212.93 413.31,212.93,413.31,212.93 418.65,217.39 418.65,217.39,418.65,217.39 413.09,224.29 413.09,224.29,413.09,224.29 415.58,229.15 415.58,229.15,415.58,229.15 414.71,235.12 414.71,235.12,414.71,235.12 401.64,254.35 401.64,254.35,401.64,254.35 408.55,260.88 408.55,260.88,408.55,260.88 401.32,263.25 401.32,263.25,401.32,263.25 407.30,270.81 407.30,270.81,407.30,270.81 406.44,280.02 406.44,280.02,406.44,280.02 408.42,283.74 408.42,283.74,408.42,283.74 403.68,288.01 403.68,288.01,403.68,288.01 411.92,295.70 411.92,295.70,411.92,295.70 417.54,292.13 417.54,292.13,417.54,292.13 423.43,296.89 423.43,296.89,423.43,296.89 443.25,284.12 443.25,284.12,443.25,284.12 446.83,276.16 446.83,276.16,446.83,276.16 446.05,269.04 446.05,269.04,446.05,269.04 446.26,268.07 446.26,268.07,446.26,268.07 457.15,261.74 457.15,261.74,457.15,261.74 459.13,253.53 459.13,253.53,459.13,253.53 484.91,232.20 484.91,232.20,484.91,232.20 485.19,228.06 485.19,228.06,485.19,228.06 475.38,226.91 475.38,226.91,475.38,226.91 479.59,223.30 479.59,223.30,479.59,223.30 485.37,222.24 485.37,222.24,485.37,222.24 486.05,215.61 486.05,215.61,486.05,215.61 481.29,210.91 481.29,210.91,481.29,210.91 480.18,205.82 480.18,205.82,480.18,205.82 473.44,202.73 473.44,202.73,473.44,202.73 463.53,193.76 463.53,193.76 Z", "name" : "BESANCON"}
		}
		});

		
	})(jQuery);
	
});
