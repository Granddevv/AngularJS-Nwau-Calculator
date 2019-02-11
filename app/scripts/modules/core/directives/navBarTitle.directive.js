'use strict';

angular.module('nwauCalculatorApp')
	.directive('navBarTitle', function () {
	    return {
	      restrict: 'E',
	      replace: true,
	      scope: {
	        text: '='
	      },
	      template: '<div class="nav nav-bar navbar-title text-center">{{ text }}</div>'
	    };
	  })
  ;