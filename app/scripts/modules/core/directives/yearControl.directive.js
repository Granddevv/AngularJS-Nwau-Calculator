'use strict';

angular.module('nwauCalculatorApp')
  .directive('yearControl', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        model: '=',
        change: '&',
        leftValue: '=',
        rightValue: '=',
        leftLabel: '=',
        rightLabel: '=',
        disabled: '='
      },
      template: '<div class="btn-group">' +
        '<button type="button" class="btn btn-primary" ng-model="model" ng-change="change()" btn-radio=leftValue ng-disabled="disabled">{{ leftLabel }}</button>' +
        '<button type="button" class="btn btn-primary" ng-model="model" ng-change="change()" btn-radio=rightValue ng-disabled="disabled">{{ rightLabel }}</button>' +
        '</div>'
    };
  })
