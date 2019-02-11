angular.module('nwauCalculatorApp')
  .controller('CompareCtrl', ['$scope', '$stateParams', '$q', '$state', 'EncounterService', 'StorageService', 'JourneyService',
    function ($scope, $stateParams, $q, $state, EncounterService, StorageService, JourneyService) {
      'use strict';

      $scope.journey1 = StorageService.getJourney(parseInt($stateParams.journey1Id));
      $scope.journey2 = StorageService.getJourney(parseInt($stateParams.journey2Id));
      if(!$scope.journey1 || !$scope.journey2) {
        $state.go('start');
        return;
      }
      $scope.combinedJourneys = [$scope.journey1, $scope.journey2];
      $scope.combinedEncounters = _.zip($scope.journey1.encounters, $scope.journey2.encounters);

      var calculateNwauTotal1 = function () {
        var promises =
          _($scope.journey1.encounters)
            .map(function (e) {
              return EncounterService.getNwauCalculation(e, $scope.journey1);
            });

        $q.all(promises)
          .then(function (data) {
            var nwau = 0,
              price = 0;

            _.each(data, function (d) {
              nwau += d.nwau;
              price += d.price;
            });

            $scope.journey1.totalNwau = nwau;
            $scope.journey1.totalPrice = price;
          });
      };

      var calculateNwauTotal2 = function () {
        var promises =
          _($scope.journey2.encounters)
            .map(function (e) {
              return EncounterService.getNwauCalculation(e, $scope.journey2);
            });

        $q.all(promises)
          .then(function (data) {
            var nwau = 0,
              price = 0;
            _.each(data, function (d) {
              nwau += d.nwau;
              price += d.price;
            });
            $scope.journey2.totalNwau = nwau;
            $scope.journey2.totalPrice = price;
          });
      };

      JourneyService.getEncounterNwaus($scope.journey1).then(function (nwaus) {
        $scope.journeyPlot1 = EncounterService.getJourneyChart(nwaus);
      });

      JourneyService.getEncounterNwaus($scope.journey2).then(function (nwaus) {
        $scope.journeyPlot2 = EncounterService.getJourneyChart(nwaus);
      });

      calculateNwauTotal1();
      calculateNwauTotal2();
    }]);
