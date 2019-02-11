'use strict';

angular.module('nwauCalculatorApp')
  .filter('numberWholeZero', function ($filter) {
    return function (input, digits) {
      if(input === 0) {
        return '0';
      }
      else {
        return $filter('number')(input, digits);
      }
    };
  })
;
