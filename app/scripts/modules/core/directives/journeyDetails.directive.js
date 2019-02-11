'use strict';

angular.module('nwauCalculatorApp')
	.directive('journeyDetails', function () {
	    return {
	      restrict: 'E',
	      replace: false,
	      scope: {
	        journey: '='
	      },
	      templateUrl: 'views/journey-details.html'
	    };
	  })
  ;