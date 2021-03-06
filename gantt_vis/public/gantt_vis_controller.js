import _ from 'lodash';
import { uiModules } from 'ui/modules';
import $ from 'jquery';
const module = uiModules.get('kibana/gantt_vis', ['kibana']);

//import visTimeline from 'vis'; //Load vis.js from node_modules
//import { DataSet, Timeline } from 'vis/index-timeline-graph2d';
import { DataSet, Timeline } from 'vis';

module.controller('KbnGanttVisController', function ($scope, $element, Private) {

  let rootElement = $element;

  let graph = null;
  let width;
  let height;
  let data = new DataSet();
  let margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  };

  $scope.$watchMulti(['esResponse', 'vis.params'], function ([resp]) {

    if (resp) {
      const vis = $scope.vis;
      let counter = 0;

      width = $(rootElement).width() - margin.left - margin.right;
      height = $(rootElement).height() - margin.top - margin.bottom;

      let eventStart = 0;
      let eventEnd = 0;
	  let eventTmp = 0;
	  let minStart = 0;
	  let maxEnd = 0;
      let eventStr = '';
	  let groupStr = '';
	  let cols = 0;
      let rows = 0;
	  let data = new DataSet();
	  let myGroups = new DataSet();
	  // Go from Elasticsearch resp object to vis.js Dataset
      _.map(resp.aggregations, function (xElementRoot) {
	    if (xElementRoot !== null) {
		  _.map(xElementRoot.buckets, function (xElement) {
			if (xElement !== null) {
			  eventStart = xElement.key;
			  
			  cols++;
              _.map(xElement[2].buckets, function (yElementBucket) {

                eventEnd = yElementBucket.key;
				
				if (eventEnd < eventStart){
					eventTmp = eventStart;
					eventStart = eventEnd;
					eventEnd = eventTmp;
				}
				if (minStart > eventStart || minStart == 0){
					minStart = eventStart;
				}
				if (maxEnd < eventEnd){
					maxEnd = eventEnd;
				}
				
				  rows++;
				if (yElementBucket[3] !== undefined){
					_.map(yElementBucket[3].buckets, function (zElementBucket) {
						eventStr = zElementBucket.key;
						if (zElementBucket[4] !==undefined){
							_.map(zElementBucket[4].buckets, function (wElementBucket) {
								groupStr = wElementBucket.key;
								if (myGroups.get(eventStr)==null){
									try {
										myGroups.add({
											id: groupStr,
											content: groupStr
										});
									}catch(err){
									//console.log(groupStr);
									}
								}
								data.add({
									id: counter++,
									start: new Date(eventStart),
									end: new Date(eventEnd),
									content: eventStr,
									group: groupStr,
									className: 'default'
								});
							});
						} else {
							data.add({
								id: counter++,
								start: new Date(eventStart),
								end: new Date(eventEnd),
								content: eventStr,
								className: 'default'
							});	
						}	
					});
				} else {
					data.add({
							id: counter++,
							start: new Date(eventStart),
							end: new Date(eventEnd),
							content: ' ',
							className: 'default'
						});	
				}	
              });
            }
          });
        }
      });
	  	if (vis.params.stacked === undefined) {vis.params.stacked = false;}
		if (vis.params.autoresize === undefined) {vis.params.autoresize = false;}
		if (vis.params.verticalscroll === undefined) {vis.params.verticalscroll = false;}
		if (vis.params.movable === undefined) {vis.params.movable = false;}
		if (vis.params.zoomable === undefined) {vis.params.zoomable = false;}
		//console.log(vis.params.chheigh);
		//if (vis.params.chheigh === undefined || vis.params.chheigh == null || vis.params.chheigh == 0){vis.params.chheigh = 0;}	  	  
	  	var options = {
			autoResize: vis.params.autoresize,
			locale: "de",
			start: new Date(minStart - (maxEnd-minStart)/10),
			end: new Date(maxEnd + (maxEnd-minStart)/10),
			verticalScroll: vis.params.verticalscroll,
			clickToUse: false,
			//height: vis.params.chheigh == 0 ? vis.params.chheigh : vis.params.chheigh + 'px',
			//zoomKey: 'ctrlKey',
			stack: vis.params.stacked,
			moveable: vis.params.movable,
			zoomable: vis.params.zoomable
		};
      

      // Instantiate our graph object.
	  if (data !== null && data.length > 0) {
		if (myGroups !== null && myGroups.length > 0) {
			try{
				graph.destroy();
			}catch(Err){
			}
			graph = new Timeline(rootElement[0], data, myGroups, options);
		}else{
			try{
				graph.destroy();
			}catch(Err){
			}
			graph = new Timeline(rootElement[0], data, options);
		}
      }

    }
  });

  $scope.$watch(function () {
    let element = $(rootElement);

    return [element.width(), element.height()].join('x');
  }, function (resp) {

    let element = $(rootElement);
    let height = element.height();
    let width = element.width();

    if (width < 200 || height < 200) {
      // Too small a container

    } else {
      if (data && graph) {

        width = width - margin.left - margin.right;
        height = height - margin.top - margin.bottom;

        //graph.setSize(width + 'px', height + 'px');
		//graph.destroy();
        graph.redraw();
      }
    }
  });
});
