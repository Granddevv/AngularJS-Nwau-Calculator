'use strict';

angular.module('nwauCalculatorApp')
  .directive('legendItem', function () {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="legend-item"></div>'
    };
  })
  ;