angular.module('nwauCalculatorApp').factory('JourneyService', function (Calculator, ihpaService, $q, EncounterService, StorageService, $state, $modal) {
  return {
    getTotalNwau: function (journey) {
      if (!journey.encounters || journey.encounters.length === 0) {
        return {
          nwau: 0,
          price: 0
        };
      }
      return  _(journey.encounters)
        .map(function (encounter) {
          return {
            nwau: encounter.nwauCalculation.adjustedNwau || encounter.nwauCalculation.nwau,
            price: encounter.nwauCalculation.adjustedPrice || encounter.nwauCalculation.price
          };
        })
        .reduce(function (sum, nwau) {
          sum.nwau += nwau.nwau;
          sum.price += nwau.price;
          return sum;
        });
    },
    getEncounterNwaus: function (journey) {
      var promises =
        _(journey.encounters)
          .map(function (e) {
            return EncounterService.getNwauCalculation(e, journey);
          }).value();

      return $q.all(promises)
        .then(function (results) {
          return _.pluck(results, 'nwau');
        });
    },
    getPreviousEncounter: function (journey, encounterId) {
      if (!journey || !encounterId || !journey.encounters || journey.encounters.length === 0) {
        return;
      }
      var currentIndex = _.findIndex(journey.encounters, { id: encounterId});
      if (currentIndex === 0) {
        return; // this is the first encounter
      } else if (currentIndex > 0) {
        return journey.encounters[currentIndex - 1];
      } else {
        return _.last(journey.encounters); //if not found or new encounter, just check last in array
      }
    },
    updateEncounterNwaus: function (journey) {
      var that = this;
      var promises = _.map(journey.encounters, function (encounter) {
        return EncounterService.getNwauCalculation(encounter, journey)
          .then(function (result) {
            encounter.nwauCalculation = result;
            return encounter;
          });
      });
      return $q.all(promises)
        .then(function (result) {
          journey.encounters = result;
          var journeyTotalNwau = that.getTotalNwau(journey);
          journey.totalNwau = journeyTotalNwau.nwau;
          journey.totalPrice = journeyTotalNwau.price;
          StorageService.putJourney(journey);
        });
    },
    delete: function (journey) {
      var deleteModal = $modal.open({
        templateUrl: 'views/delete-modal.html',
        controller: 'DeleteCtrl',
        resolve: {
          name: function () {
            return journey.name;
          },
          type: function () {
            return 'Journey';
          }
        }
      });

      return deleteModal.result.then(function (deleteJourney) {
        if (deleteJourney) {
          StorageService.deleteJourney(journey.id);
        }
        return deleteJourney;
      });
    }
  };
});
