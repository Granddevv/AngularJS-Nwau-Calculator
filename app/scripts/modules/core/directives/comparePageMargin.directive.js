'use strict';

angular.module('nwauCalculatorApp')
  .directive('comparePageMargin', function ($timeout, $window) {

      var setComparePageMargin = function (elem) {
        var height = _(document.getElementsByClassName('journey-summary'))
          .pluck('offsetHeight')
          .max()
          .value();
        jQuery(elem).height(height + 10);
      };

      return {
        restrict: 'A',
        link: function (scope, elem) {
          angular.element($window).bind('resize', function () {
            setComparePageMargin(elem);
          });
          angular.element($window).bind('orientationchange', function () {
            setComparePageMargin(elem);
          });
          $timeout(function () {
            setComparePageMargin(elem);
          }, 1500);
        }
      };
    })
;
