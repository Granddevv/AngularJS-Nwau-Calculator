angular.module('nwauCalculatorApp')
  .controller('EditJourneyCtrl', ['$scope', '$state', '$stateParams', '$q', 'StorageService', 'JourneyService',
    function ($scope, $state, $stateParams, $q, StorageService, JourneyService) {
      'use strict';

      $scope.journey = {};
      $scope.facilities = [];
      $scope.regions = [];
      $scope.isNewJourney = false;

      if ($stateParams.journeyId) {
        $scope.journey = StorageService.getJourney($stateParams.journeyId);
      }
      else {
        $scope.journey = StorageService.getNewJourney();
        $scope.isNewJourney = true;
      }


      $scope.save = function () {
        JourneyService.updateEncounterNwaus($scope.journey)
          .then(function () {
            StorageService.putJourney($scope.journey);
            $state.go('journey', {journeyId: $scope.journey.id});
          });
      };

      $scope.cancel = function () {
        if ($scope.isNewJourney) {
          $state.go('start');
        }
        else {
          $state.go('journey', {journeyId: $scope.journey.id});
        }
      };

      $scope.delete = function () {
        JourneyService.delete($scope.journey)
          .then(function (deleted) {
            if (deleted) {
              $state.go('start');
            }
          });
      };
    }]);
