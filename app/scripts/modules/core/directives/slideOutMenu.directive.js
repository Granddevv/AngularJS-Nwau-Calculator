'use strict';

angular.module('nwauCalculatorApp')
	.directive('slideOutMenu', function () {
	    return {
	      restrict: 'E',
	      replace: true,
	      transclude: true,
	      template: '<div class="slide-out-menu">' +
	        '<div class="slide-out-menu-scrollable" ng-transclude></div>' +
	        '</div>'
	    };
	  })
	  ;