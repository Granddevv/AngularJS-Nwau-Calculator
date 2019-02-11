'use strict';

angular.module('nwauCalculatorApp')
	.directive('encounter', function () {
    return {
      restrict: 'E',
      replace: false,
      scope: {
        journey: '=',
        addClicked: '&',
        localHealthDistricts: '=',
        facilities: '='
      },
      templateUrl: 'views/encounter-summary.html'
    };
  })
;