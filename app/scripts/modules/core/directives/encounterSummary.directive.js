'use strict';

angular.module('nwauCalculatorApp')
  .directive('encounterSummary', function () {
    return {
      restrict: 'E',
      replace: true,
      scope: {
        encounter: '=',
        journey: '=',
        containerId: '='
      },
      templateUrl: 'views/_encounter-summary.html',
      controller: ['$scope', 'EncounterService',
        function ($scope, EncounterService) {
          var currentCare = EncounterService.getCurrentCare($scope.encounter);
          $scope.chartValues = EncounterService.getChartValues($scope.encounter.nwauCalculation, $scope.encounter.classification, currentCare);
          $scope.journeyId = $scope.journey.id;
        }]
    };
  })
  ;