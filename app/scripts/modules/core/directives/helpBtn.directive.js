'use strict';

angular.module('nwauCalculatorApp')
  .directive('helpBtn', function () {
    return {
      restrict: 'E',
      replace: false,
      scope: {
        help: '@',
        placement: '@',
        icon: '@',
        floatNormal: '@'
      },
      template: '<a popover-placement="{{ placement || \'top\' }}" popover="{{ help }}" popover-trigger="" class="glyphicon help-button {{ floatNormal ? \'\' : \' pull-right\' }}" ng-class="icon ? icon : \'glyphicon-info-sign\'"></a>'
    };
  })
  ;