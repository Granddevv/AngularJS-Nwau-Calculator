'use strict';

angular.module('nwauCalculatorApp')
  .filter('currencyWhole', function ($filter) {
    return function (input) {
      return '$' + $filter('number')(input, 0);
    };
  })
;
