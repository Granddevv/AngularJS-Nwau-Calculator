'use strict';

angular.module('nwauCalculatorApp')
  .directive('slideOutContainer', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        blackOut: '='
      },
      transclude: true,
      template: '<div class="slide-out-container container-fluid" >' +
        '<div ng-show="blackOut" ng-click="blackOut=false" class="black-out"></div>' +
        '<div ng-transclude></div>' +
        '</div>'
    };
  })
  ;