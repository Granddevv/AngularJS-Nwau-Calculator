'use strict';

angular.module('nwauCalculatorApp')
  .directive('summaryField', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        caption: '@',
        value: '='
      },
      template: '<div class="row"><strong class="col-xs-12">{{ caption }}</strong>' +
        '<p class="col-xs-12">{{ value }}</p></div>'
    };
  })
  ;