'use strict';

angular.module('nwauCalculatorApp')
	.directive('switchControl', function () {
	    return {
	      restrict: 'E',
	      replace: true,
	      scope: {
	        model: '=',
	        change: '&',
	        trueLabel: '@',
	        falseLabel: '@',
	        disabled: '=',
	        ngRequired: '='
	      },
	      template: '<div class="btn-group">' +
	        '<label class="btn btn-primary" ng-class="{\'checked\': model === true}">' +
	        '<input type="radio" class="sr-only" ng-model="model" name="{{ model }}" ng-change="change()" ng-value="true" ng-disabled="disabled" ng-required="ngRequired">{{trueLabel}}' +
	        '</label>' +
	        '<label class="btn btn-primary" ng-class="{\'checked\': model === false}">' +
	        '<input type="radio" class="sr-only" ng-model="model" name="{{ model }}" ng-change="change()" ng-value="false" ng-disabled="disabled" ng-required="ngRequired">{{falseLabel}}' +
	        '</label>' +
	        '</div>'
	    };
	  })
	;