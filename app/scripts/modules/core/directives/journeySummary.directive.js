'use strict';

angular.module('nwauCalculatorApp')
  .directive('journeySummary', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        journey: '='
      },
      templateUrl: 'views/_journey-summary.html',
      controller: ['$scope', 'JourneyService', 'EncounterService',
        function ($scope, JourneyService, EncounterService) {
          $scope.journeyPlot1 = EncounterService.getJourneyChart($scope.journey);
        }]
    };
  })
  ;