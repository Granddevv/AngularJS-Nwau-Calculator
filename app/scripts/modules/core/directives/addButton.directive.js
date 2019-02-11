'use strict';

angular.module('nwauCalculatorApp')
	 .directive('addButton', function () {
	    return {
	      restrict: 'E',
	      replace: true,
	      scope: {
	        text: '@',
	        action: '&'
	      },
	      template: '<a class=\'add-button glyphicon glyphicon-plus-sign\' ng-click=\'action()\'>{{text}}</a>'
	    };
	  })
	;