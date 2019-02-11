'use strict';

angular.module('nwauCalculatorApp')
	.directive('noJourneys', function () {
	    return {
	      restrict: 'E',
	      replace: true,
	      templateUrl: 'views/no-journeys.html'
	    };
	  })
	;