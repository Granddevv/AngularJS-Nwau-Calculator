angular.module('nwauCalculatorApp')
  .controller('EncounterCtrl', ['$scope', '$timeout', '$stateParams', 'EncounterService', 'JourneyService', 'StorageService', 'ihpaService', '$q', '$modal', '$state',
    function ($scope, $timeout, $stateParams, EncounterService, JourneyService, StorageService, ihpaService, $q, $modal, $state) {
      'use strict';

      $scope.view = {
        showJourneyForm: false,
        display: 'nwau'
      };

      $scope.forms = {};
      $scope.chartValues = [];
      $scope.losChartValues = [];
      $scope.losPrivChartValues = [];
      $scope.losLabels = undefined;
      $scope.currentCare = undefined;
      $scope.classes = [];

      var newEncounter = false;
      var previousEncounter;

      var formsValid = function (ignoreEncounterForm) {
        //console.log('formsValidformsValid ', $scope.dayLimitDrg, $scope.showLosMsg, $scope.forms.journeyForm);
        var work = !($scope.dayLimitDrg && $scope.showLosMsg) && $scope.forms.journeyForm &&
          $scope.forms.journeyForm.$valid && (ignoreEncounterForm ||
          ($scope.forms.encounterForm &&
          $scope.forms.encounterForm.$valid));
        //console.log('formsValid ', work);
        return work;
      };

      var setEDClass = function () {
        var facility = _.find($scope.facilities, { Facilities: $scope.journey.facility.Facilities });
        if (facility) {
          $scope.EDClass = (facility.EDClass);
        }
      };

      var getFacilities = function () {
        ihpaService.getFacilities($scope.journey.nwauVersion)
          .then(function (result) {
            $scope.facilities = result;
            setEDClass();
          });
      };

      var setIcuEligibility = function () {
        ihpaService.isIcuEligible($scope.journey.facility.FacilityID, $scope.journey.nwauVersion)
          .then(function (eligible) {
            $scope.icuEligibility = eligible;
            if (!eligible) {
              $scope.encounter.icuHours = 0;
            }
          });
      };

      var getEncounter = function () {
        var encounterId = parseInt($stateParams.encounterId);
        var encounter = _($scope.journey.encounters)
          .find({ 'id': encounterId });
        if (!encounter) {
          newEncounter = true;
          encounter = StorageService.getNewEncounter($scope.journey);
          encounter.id = encounterId;
        }
        return encounter;
      };

      var setBusinessRules = function () {
        if (!previousEncounter) {
          $scope.acuteWasLast = false;
          $scope.EDWasLast = false;
          return;
        }
        switch (previousEncounter.classification) {
          case 'Acute Admitted':
            $scope.acuteWasLast = true;
            $scope.EDWasLast = false;
            return;
          case 'Emergency Department UDG':
          case 'Emergency Department URG':
            $scope.EDWasLast = true;
            $scope.acuteWasLast = false;
            return;
          default:
            $scope.acuteWasLast = false;
            $scope.EDWasLast = false;
            return;
        }
      };

      var updateClasses = function () {
        if (!$scope.encounter.classification) {
          return;
        }

        var episodeType;
        if (previousEncounter && previousEncounter.ansnap) {
          episodeType = previousEncounter.ansnap.episodeType;
        }
        ihpaService.getClasses($scope.encounter.classification, $scope.journey.nwauVersion, episodeType)
          .then(function (result) {
            $scope.classes = result;

            if( hideAgeLimitDrgs) {
              var ageLimitDrgs = ['A07A', 'A09A'];

              //$scope.classes = _.filter($scope.classes, function(drg) {
              var work = _.filter($scope.classes, function(drg) {
                //if(ageLimitDrgs.indexOf(drg.id) !== -1) {
                //  console.log('drg.DRG ', drg.id);
                //}
                return ageLimitDrgs.indexOf(drg.id) === -1;
              });
              //console.log('workworkwork ', work.length);
              $scope.classes = work;
            }

            // now that we have a new list, we need to update the current class/group
            if ($scope.currentCare) {
              var newCare = _.find($scope.classes, { id: $scope.currentCare.id });
              if (!_.isEmpty(newCare)) {
                setCare($scope.encounter.classification, newCare);
              }
            }
          });
      };
      var _bounds;

      var getLosBounds = function () {
        if (!($scope.encounter.drg || $scope.encounter.ansnap)) {
          return;
        }
        EncounterService.getCareBounds($scope.encounter, $scope.journey)
          .then(function (bounds) {
            if(!bounds) {
              //if(_debug) console.log('bounds fix (duplicate call seen)');
              return;
            }
            $scope.dayLimitDrg = EncounterService.dayLimitDrg;

            if (bounds.upper === 0) {
              $scope.losMax = 150;
              bounds.losMax = $scope.losMax;
            } else {
              $scope.losMax = bounds.upper * 2;
              bounds.losMax = $scope.losMax;
            }

            if (bounds.lower === 0 && bounds.upper === 0) {
              bounds.lower = 150;
              bounds.upper = 150;
              $scope.losLabels = _(bounds).omit('limit').omit('average').omit('lower').omit('losMax').omit('upper').invert().value();
            } else {
              $scope.losLabels = _(bounds).omit('limit').omit('average').omit('losMax').invert().value();
            }

            if (!$scope.losLabels || _.isEmpty($scope.losLabels)) {
              $scope.losLabels = { 1: '1', 20: '20', 40: '40', 60: '60', 80: '80', 100: '100', 120: '120', 140: '140', 160: '160'};
            }
            _bounds = bounds;   // Mark
          });
      };

      var getIcuLabels = function () {
        if ($scope.icuState) {
          $scope.icuLabels = _.invert({ 'state average': Math.round($scope.icuState.avg) });
        }
        else {
          $scope.icuLabels = { 0: '0', 20: '20', 40: '40', 60: '60', 80: '80', 100: '100'};
        }
      };

      var updateNwauChart = function (nwauCalculation) {
        if ($scope.encounter.nwauCalculation) {
          $scope.chartValues = EncounterService.getChartValues(nwauCalculation, $scope.encounter.classification, $scope.currentCare || '');
        }
      };

      var updateLosChart = function (encounter, journey) {
        if (!$scope.encounter.nwauCalculation || !(encounter.classification === 'Acute Admitted' || encounter.classification === 'SNAP')) {
          return;
        }

        var journeyNonPrivate = angular.copy(journey);
        journeyNonPrivate.private = false;
        var journeyPrivate = angular.copy(journey);
        journeyPrivate.private = true;

        EncounterService.getLosChartValues(encounter, journeyNonPrivate)
          .then(function (result) {
            $scope.losChartValues = result;
          });
        EncounterService.getLosChartValues(encounter, journeyPrivate)
          .then(function (result) {
            $scope.losPrivChartValues = result;
          });

        $scope.losProportions = [];

        $scope.losStateProportions = [];

        EncounterService.getLosProportions(encounter, journey)
          .then(function (result) {
            if (!result || result.length === 0) {
              $scope.hasLosProportions = false;
            } else {
              $scope.hasLosProportions = true;
            }

            EncounterService.getLosStateProportions(encounter, journey)
              .then(function (result) {
                if (!result || result.length === 0) {
                  $scope.hasLosStateProportions = false;
                } else {
                  $scope.hasLosStateProportions = true;
                }

                var short = _.find(result, {group: 'S'});
                $scope.losStateProportions[0] = short && short != '' ? short.pc  * 100 + '%': '0%';
                /*/
                if (short === undefined) {
                  $scope.losStateProportions[0] = '0%';
                }
                else {
                  if(short.n === ""){
                    $scope.losStateProportions[0] = '0%';
                  }
                  else{
                    $scope.losStateProportions[0] = short.pc * 100 + '%';
                  }
                }
                 /*/
                var inlier = _.find(result, {group: 'I'});
                $scope.losStateProportions[1] = inlier && inlier != '' ? inlier.pc  * 100 + '%': '0%';
                /*/
                if (inlier === undefined) {
                  $scope.losStateProportions[1] = '0%';
                }
                else {
                  if(inlier.n === ""){
                    $scope.losStateProportions[1] = '0%';
                  }
                  else{
                    $scope.losStateProportions[1] = inlier.pc * 100 + '%';
                  }
                }
               /*/

                var long = _.find(result, {group: 'L'});
                $scope.losStateProportions[2] = long && long != '' ? long.pc  * 100 + '%': '0%';
                /*/
                if (long === undefined) {
                  $scope.losStateProportions[2] = '0%';
                }
                else {
                  if(long.n === ""){
                    $scope.losStateProportions[2] = '0%';
                  }
                  else{
                    $scope.losStateProportions[2] = long.pc * 100 + '%';
                  }
                }
                 /*/
                var day = _.find(result, {group: 'D'});
                $scope.losStateProportions[3] = day && day != '' ? day.pc  * 100 + '%': '0%';

                var sameDay = _.find(result, {group: 'Sameday'});
                $scope.losStateProportions[4] = sameDay ? sameDay.pc  * 100 + '%': '0%';
                var overnight = _.find(result, {group: 'Overnight'});
                $scope.losStateProportions[5] = overnight ? overnight.pc  * 100 + '%': '0%';
              });
          });
      };

      var updateCharts = function () {
        switch ($scope.view.display) {
          case 'nwau':
            updateNwauChart($scope.encounter.nwauCalculation);
            break;
          case 'los':
            updateLosChart($scope.encounter, $scope.journey);
            break;
        }
      };

      var updateIcuState = function () {
        if ($scope.encounter.classification !== 'Acute Admitted') {
          return;
        }
        EncounterService.getIcuState($scope.encounter.drg.id, $scope.journey.nwauVersion)
          .then(function (result) {
            $scope.icuState = result;
            getIcuLabels();
          });
      };

      var doCalculations = function (ignoreEncounterForm) {
        if ($scope.encounter.classification !== 'Acute Admitted') {
          //console.log('psychiatricCare false');
          $scope.encounter.psychiatricCare = false;
        }
        getLosBounds();
        getIcuLabels();

        if ($scope.encounter.icuHours > $scope.encounter.lengthOfStay * 24) {
          return;
        }
        if (!formsValid(ignoreEncounterForm)) {
          return;
        }

        EncounterService.getNwauCalculation($scope.encounter, $scope.journey)
          .then(function (data) {
            if (newEncounter) {
              $scope.journey.encounters.push($scope.encounter);
              newEncounter = false;
            }
            $scope.encounter.nwauCalculation = data;
            var journeyTotalNwau = JourneyService.getTotalNwau($scope.journey);
            $scope.journey.totalNwau = journeyTotalNwau.nwau;
            $scope.journey.totalPrice = journeyTotalNwau.price;
            $scope.currentCare = EncounterService.getCurrentCare($scope.encounter);
            //console.log('$scope.currentCare ', $scope.currentCare);

            $scope.encounter.careId = $scope.currentCare.id;

            updateCharts();
            StorageService.putJourney($scope.journey);
          });
      };

      var updateTimer = 0;
      var hideAgeLimitDrgs = false;

      $scope.change = function () {
        //console.log('change ');
        hideAgeLimitDrgs = ($scope.journey.age > 16);

        clearTimeout(updateTimer);
        updateTimer = setTimeout(function() {   // waits for the slider to set the value
          $scope.showLosMsg = false;
          if(_bounds) {
            $scope.numDays = _bounds.losMax + 1;
            if( $scope.encounter.lengthOfStay > _bounds.losMax) {
              $scope.showLosMsg = true;
            }
          }
          doCalculations();
        }, 200);
      };

      var setCare = function (classification, care) {
        switch (classification) {
          case 'Acute Admitted':
            $scope.encounter.drg = care;
            break;
          case 'Emergency Department UDG':
            $scope.encounter.edudg = care;
            break;
          case 'Emergency Department URG':
            $scope.encounter.edurg = care;
            break;
          case 'SNAP':
            $scope.encounter.ansnap = care;
            break;
          case 'Non Admitted':
            $scope.encounter.tier2clinic = care;
            break;
          default:
            break;
        }
      };
      var applySuggestion = function () {
        if ($stateParams.classification && $stateParams.careId && $stateParams.careName) {
          if ($stateParams.classification === 'AN-SNAP') {
            $stateParams.classification = 'SNAP';
          }
          $scope.encounter.classification = $stateParams.classification;

          ihpaService.getCare($scope.encounter.classification, $scope.journey.nwauVersion, $stateParams.careId)
            .then(function (care) {
              setCare($stateParams.classification, care);
              $scope.change();
            });
        }
      };

      //actual work
      $scope.journey = StorageService.getJourney($stateParams.journeyId);
      if(!$scope.journey) {
        $state.go('start');
        return;
      }
      $scope.encounter = getEncounter();

      if(!$scope.encounter) {
        $state.go('start');
        return;
      }
      previousEncounter = JourneyService.getPreviousEncounter($scope.journey, $scope.encounter.id);
      $scope.currentCare = EncounterService.getCurrentCare($scope.encounter);

      $scope.serviceEventsLabels = { 1: '1', 20: '20', 40: '40', 60: '60', 80: '80', 100: '100'};
      $timeout(setBusinessRules);

      $timeout(getFacilities);

      $timeout(getLosBounds, 1000);
      $timeout(updateIcuState, 1000);

      $timeout(setIcuEligibility);

      $timeout(function () {
        updateNwauChart($scope.encounter.nwauCalculation);
      }, 1000);

      $timeout(function () {
        updateLosChart($scope.encounter, $scope.journey);
      }, 2000);

      $timeout(function () {
        applySuggestion();
        getLosBounds();
      });

      $scope.$watch('encounter.classification', function () {
        updateClasses();

        if ($scope.encounter.classification !== 'Acute Admitted' &&
          $scope.encounter.classification !== 'SNAP' &&
          $scope.view.display === 'los') {
          $scope.view.display = 'nwau';
        }
        if ($scope.encounter.classification === 'Acute Admitted') {
          $scope.encounter.psychiatricCare = null;
        }
      });

      $scope.$watch('journey.nwauVersion', function () {
        //console.log('$cope.journey.nwauVersion ', $scope.journey.nwauVersion);
        updateClasses();
        doCalculations(true);
      });

      $scope.$watch('encounter.drg', function () {
        getLosBounds();
        if (formsValid()) {
          updateIcuState();
        }
      });
      $scope.$watch('encounter.ansnap', function () {
        getLosBounds();
      });

      $scope.$watch('journey.facility', function () {
        if (!$scope.facilities || !formsValid()) {
          return;
        }
        setEDClass();
        setIcuEligibility();
      });

      $scope.$watch('view.display', function () {
        updateCharts();
      });

      $scope.done = function () {
        if (formsValid()) {
          JourneyService.updateEncounterNwaus($scope.journey)
            .then(function () {
              $state.go('journey', { journeyId: $scope.journey.id });
            });
        }
      };

      $scope.groupSelector = function (type) {
        var selectorModal = $modal.open({
          templateUrl: 'views/_group-selector-modal.html',
          controller: 'GroupSelectorCtrl',
          resolve: {
            type: function () {
              return type;
            },
            nwauVersion: function () {
              return $scope.journey.nwauVersion;
            },
            age: function () {
              return $scope.journey.age;
            },
            lastEpisodeType: function () {
              if (type === 'ansnap') {
                if (previousEncounter && previousEncounter.ansnap) {
                  return previousEncounter.ansnap.episodeType;
                }
              }
            }
          }
        });

        selectorModal.result.then(function (group) {
          ihpaService.getCare($scope.encounter.classification, $scope.journey.nwauVersion, group.id, group.healthType)
            .then(function (care) {
              setCare($scope.encounter.classification, care);
              $scope.change();
            });

        });
      };

      $scope.delete = function () {
        var deleteModal = $modal.open({
          templateUrl: 'views/delete-modal.html',
          controller: 'DeleteCtrl',
          resolve: {
            name: function () {
              if ($scope.currentCare && $scope.currentCare.name) {
                return $scope.currentCare.name;
              }
              return undefined;
            },
            type: function () {
              return 'Encounter';
            }
          }
        });

        deleteModal.result.then(function (deleteEncounter) {
          if (deleteEncounter) {
            _($scope.journey.encounters).remove({ id: $scope.encounter.id });
            var journeyTotalNwau = JourneyService.getTotalNwau($scope.journey);
            $scope.journey.totalNwau = journeyTotalNwau.nwau;
            $scope.journey.totalPrice = journeyTotalNwau.price;
            StorageService.putJourney($scope.journey);
            $state.go('journey', { journeyId: $scope.journey.id });
          }
        });
      };
    }])
;
