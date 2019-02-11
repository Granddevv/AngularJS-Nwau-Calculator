'use strict';

angular.module('nwauCalculatorApp')
  .directive('chartValue', function () {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        caption: '@',
        value: '=',
        type: '@',
        inactiveLegend: '='
      },
      template: '<tr ng-class="{ \'chart-value-inactive\': value === \'0\' || value === \'0%\' || value === \'100%\' }">' +
        '<td><span class="legend-item {{ type }}" ng-class="{ \'legend-item-inactive\': value === \'0\' || value === \'0%\' || value === \'100%\' || inactiveLegend }"></span></td>' +
        '<td ng-bind-html="caption"></td><td class="chart-value">{{ value }}</td></tr>'
    };
  })
  ;
