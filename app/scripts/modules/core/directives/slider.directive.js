'use strict';

angular.module('nwauCalculatorApp')
   .directive('slider', function () {
    return {
      restrict: 'A',
      replace: true,
      scope: {
        value: '=',
        id: '@',
        min: '=',
        max: '=',
        labels: '=',
        change: '&'
      },
      link: function (scope, element) {
        $(element).labeledslider({
          min: parseInt(scope.min),
          max: parseInt(scope.max)
        });
        $('.ui-slider').draggable();

        var updateLabels = function (labels) {
          if (!scope.labels) {
            return;
          }

          var ticks = _(scope.labels).keys()
            .map(function (l) {
              return parseInt(l);
            }).value();

          $(element).labeledslider('option', 'tickInterval', null);
          $(element).labeledslider('option', 'tickLabels', labels);
          $(element).labeledslider('option', 'tickArray', ticks);
        };


        scope.$watch('value', function () {
          $(element).labeledslider('option', 'value', scope.value);
        });

        scope.$watch('labels', function () {
          updateLabels(scope.labels);
        });

        scope.$watch('max', function () {
          $(element).labeledslider('option', 'max', scope.max);
        });

        scope.$watch('min', function () {
          $(element).labeledslider('option', 'min', scope.min);
        });

        $(element).labeledslider({
          slide: function (event, ui) {
            scope.$apply(function (scope) {
              scope.value = ui.value;
              scope.change();
            });
          }
        });
      }
    };
  })
  ;