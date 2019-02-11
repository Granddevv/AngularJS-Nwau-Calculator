'use strict';

angular.module('nwauCalculatorApp')
  .filter('yesno', function () {
    return function (input) {
      if (input) {
        return 'Yes';
      }
      return 'No';
    };
  })
;
