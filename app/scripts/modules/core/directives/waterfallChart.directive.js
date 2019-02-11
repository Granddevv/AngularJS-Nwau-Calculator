'use strict';

angular.module('nwauCalculatorApp')
	.directive('waterfallChart', function () {
	    return {
	      restrict: 'E',
	      replace: true,
	      scope: {
	        containerId: '@',
	        type: '@',
	        privData: '=',
	        data: '=',
	        losProportions: '='
	      },
	      template: '<svg class="{{ type }}-chart"></svg>',
	      link: function (scope, elem) {
	        var getContainerRatio = function (type, elem) {
	          switch (type) {
	            case 'bar':
	              return {
	                width: elem.parent().width() * 1.5,
	                height: elem.parent().height() * 1.5,
	                shift: {down: 40, left: 60}
	              };
	            case 'waterfall': //preemptive space allowed for x axis text, arbitrary value selected
	              return {
	                width: elem.parent().width() * 1.3,
	                height: elem.parent().height() * 1.3,
	                shift: {down: 35, left: 80}
	              };
	            case 'line': //preemptive space allowed for x axis text, arbitrary value selected
	              return {
	                width: elem.parent().width() * 1.3,
	                height: elem.parent().height() * 1.3,
	                shift: {down: 40, left: 60}
	              };
	            default:
	              return {
	                width: elem.parent().width() * 1.3,
	                height: elem.parent().height() * 1.2,
	                shift: {down: 40, left: 60}
	              };
	          }
	        };

	        var containerRatio = getContainerRatio(scope.type, elem);
	        d3.select(elem[0])
	          .attr('class', 'g')
	          .attr('width', '100%')
	          .attr('height', '100%')
	          .attr('viewBox', '0 0 ' + containerRatio.width + ' ' + containerRatio.height)
	          .attr('preserveAspectRatio', 'xMinYMin')
	          .append('g')
	          .attr('transform', 'translate(' + containerRatio.shift.left + ',' + containerRatio.shift.down + ')');


	      },
	      controller: 'WaterfallCtrl'
	    };
	  })
;