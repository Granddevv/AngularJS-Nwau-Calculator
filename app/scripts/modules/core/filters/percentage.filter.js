'use strict';

angular.module('nwauCalculatorApp')
  .filter('percentage', function () {
    return function (input) {
      var rounded = Math.round(input * 10000) / 100;
      if (isNaN(rounded)) {
        return '';
      }
      var percentage = '' + rounded + '%';
      return percentage;
    };
  })
;
