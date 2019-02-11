angular.module('nwauCalculatorApp')
  .controller('JourneyCtrl', ['$scope', '$state', '$stateParams', '$q', 'EncounterService', 'StorageService', 'ihpaService', '$modal', 'JourneyService',
    function ($scope, $state, $stateParams, $q, EncounterService, StorageService, ihpaService, $modal, JourneyService) {
      'use strict';

      $scope.$on('$viewContentLoaded', function () {
        $('.horizontal-list').mousewheel(function (e, delta) {
          this.scrollLeft -= (delta * 10);
          e.preventDefault();
        });
      });

      $scope.view = {};
      $scope.view.showJourneys = false;
      $scope.view.showCompare = false;

      $scope.totalNwau = 0;
      $scope.totalPrice = 0;

      $scope.journeys = StorageService.getJourneys();
      if ($stateParams.journeyId !== '') {
        $scope.journey = _($scope.journeys).find({ id: parseInt($stateParams.journeyId) });
      }
      if (_.isEmpty($scope.journeys)) {
        $state.go('start');
      }

      $scope.compareJourneys = angular.copy($scope.journeys);
      _.remove($scope.compareJourneys, function (journey) {
        return journey.id === $scope.journey.id;
      });

      var formatCareId = function (lastEncounter) {   // suggestions URG 'from' field special formatting, Mark
        if(lastEncounter.classification == "Emergency Department URG") {
          return 'URG' + ("000" + lastEncounter.careId).slice(-3);
        }
        return lastEncounter.careId;
      };

      var suggestions = [];
      var getSuggestions = function () {
        if (!$scope.journey.encounters) {
          //console.log('aaaa ');
          return;
        }

        var lastEncounter = _.last($scope.journey.encounters);
        if (!lastEncounter) {
          //console.log('ccc ', $scope.journey.encounters);
          return;
        }
        //console.log('lastEncounter ', lastEncounter);
        var careId = formatCareId(lastEncounter);

        ihpaService.getSuggestions($scope.journey.facility, $scope.journey.nwauVersion, careId)
          .then(function (result) {
            suggestions = result;
          });
      };
      getSuggestions();

      $scope.addEncounter = function () {
        var encounterId = StorageService.getNewEncounterId($scope.journey);
        //console.log('addEncounter ', $scope.journey.encounters);

        if (!$scope.journey.encounters) {
          //console.log(' bbb ');
          return $state.go('encounter', {journeyId: $scope.journey.id, encounterId: encounterId});
        }
        var lastEncounter = _.last($scope.journey.encounters);
        if (!lastEncounter) {
          //console.log('ccc ', $scope.journey.encounters);
          return $state.go('encounter', { journeyId: $scope.journey.id, encounterId: encounterId });
        }
        //console.log('_lastEncounter ', lastEncounter);
        var careId = formatCareId(lastEncounter);

        ihpaService.getSuggestions($scope.journey.facility, $scope.journey.nwauVersion, careId)
          .then(function (result) {
            suggestions = result;
            if (suggestions.length === 0) {
              return $state.go('encounter', { journeyId: $scope.journey.id, encounterId: encounterId });
            }
            //console.log('getSuggestions ', suggestions);
            var suggestionsModal = $modal.open({
              templateUrl: 'suggestions-modal.html',
              controller: ['$scope', '$modalInstance', 'suggestions',
                function ($scope, $modalInstance, suggestions) {
                  $scope.suggestions = suggestions;

                  $scope.selected = function (suggestion) {
                    $modalInstance.close(suggestion);
                  };

                  $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                  };
                }],
              resolve: {
                suggestions: function () {
                  return suggestions;
                }
              }
            });

            suggestionsModal.result.then(function (suggestion) {
              if (!suggestion) {
                $state.go('encounter', { journeyId: $scope.journey.id, encounterId: encounterId });
              }
              else {
                $state.go('encounter', {
                  journeyId: $scope.journey.id,
                  encounterId: encounterId,
                  classification: suggestion.classification,
                  careId: suggestion.to,
                  careName: suggestion.description
                });
              }
            });
          });
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
