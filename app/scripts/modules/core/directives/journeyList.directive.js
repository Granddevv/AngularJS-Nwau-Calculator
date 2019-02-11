'use strict';

angular.module('nwauCalculatorApp')
  .directive('journeyList', function () {
    return {
      restrict: 'E',
      replace: false,
      templateUrl: 'views/_journey-list.html',
      controller: ['$scope', 'StorageService', 'JourneyService',
        function ($scope, StorageService, JourneyService) {
          $scope.journeys = StorageService.getJourneys();
          $scope.delete = function (journey) {
            JourneyService.delete(journey)
              .then(function (deleted) {
                if (deleted) {
                  _.remove($scope.journeys, { id: journey.id });
                }
              });
          };
        }]
    };
  })
;
