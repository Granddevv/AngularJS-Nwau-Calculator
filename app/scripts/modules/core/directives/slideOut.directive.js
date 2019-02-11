'use strict';

angular.module('nwauCalculatorApp')
  .directive('slideOut', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        menuVisible: '='
      },
      transclude: true,
      template: '<div class="slide-out" ng-class="{\'active\': menuVisible}" ng-transclude></div>'
    };
  })
  ;