angular.module('nwauCalculatorApp').factory('StorageService', function (DSCacheFactory) {

  var journeyPrefix = '/journeys/';

  var journeyCache = new DSCacheFactory('journeyCache', {
    storageMode: 'localStorage'
  });

  var getJourneyByKey = function (key) {
    return journeyCache.get(key);
  };

  var getNewJourneyId = function () {
    var keys = journeyCache.keys();
    if (keys.length === 0) {
      return 1;
    }
    return _(keys).chain()
      .map(function (key) {
        return parseInt(key.replace(journeyPrefix, ''));
      })
      .max()
      .value() + 1;
  };


  return {
    getJourney: function (journeyId) {
      return getJourneyByKey(journeyPrefix + journeyId);
    },
    putJourney: function (journey) {
      journeyCache.put(journeyPrefix + journey.id, journey);
    },
    getJourneys: function () {
      return _(journeyCache.keys()).chain()
        .filter(function (key) {
          return key.slice(0, journeyPrefix.length) === journeyPrefix;
        })
        .map(function (key) {
          return getJourneyByKey(key);
        })
        .value();
    },
    getNewJourney: function () {
      var journey = {
        id: getNewJourneyId(),
        name: '',
        facility: '',
        age: null,
        region: '',
        private: false,
        indigenous: false,
        nwauVersion: 2016,
        encounters: []
      };

      return journey;
    },
    getNewEncounter: function (journey) {
      return {
        id: this.getNewEncounterId(journey),
        classification: '',
        //lengthOfStay: null,   // Mark  orig
        lengthOfStay: 0,   // Mark
        serviceEvents: null,
        icuHours: null,
        psychiatricCare: null
      };
    },
    getNewEncounterId: function (journey) {
      if (!journey || !journey.encounters || journey.encounters.length === 0) {
        return 1;
      }
      return _.max(journey.encounters, 'id').id + 1;
    },
    deleteJourney: function (journeyId) {
      journeyCache.remove(journeyPrefix + journeyId);
    }
  };
});
