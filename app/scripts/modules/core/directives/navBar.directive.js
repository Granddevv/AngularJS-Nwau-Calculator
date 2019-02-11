'use strict';

angular.module('nwauCalculatorApp')
	.directive('navBar', function () {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      template: '<nav class="navbar navbar-default navbar-fixed-top" role="navigation">' +
        '<div class="container-fluid" ng-transclude></span>' +
        '</nav>'
    };
  })
  ;