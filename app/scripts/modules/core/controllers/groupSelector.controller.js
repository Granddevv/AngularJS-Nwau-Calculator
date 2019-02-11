angular.module('nwauCalculatorApp')
  .controller('GroupSelectorCtrl', ['$scope', '$modalInstance', '$timeout', 'ihpaService', 'type', 'nwauVersion', 'lastEpisodeType', 'age',
    function ($scope, $modalInstance, $timeout, ihpaService, type, nwauVersion, lastEpisodeType, age) {
      'use strict';

      $scope.type = type;
      $scope.nwauVersion = nwauVersion;

      $scope.model = {
        // acute
        mdc: undefined,
        drg: undefined,

        // snap
        episodeType: undefined,
        grouped: undefined,
        ansnap: undefined,

        // edurg
        visitType: undefined,
        episodeEndStatus: undefined,
        triage: undefined,
        mdb: undefined,
        edurg: undefined
      };

      var asc = function (val) {
        return val;
      };


      // acute
      ihpaService.getAcute($scope.nwauVersion)
        .then(function (result) {
          $scope.acutes = result;
          $scope.mdcs = _(result).pluck('MDC').uniq().sortBy(asc).value();
          if (_.contains($scope.mdcs, 'Pre MDC')) {
            _.pull($scope.mdcs, 'Pre MDC');
            $scope.mdcs.splice(0, 0, 'Pre MDC');
          }
          $scope.model.mdc = $scope.mdcs.length === 1 ? $scope.mdcs[0] : undefined;
        });

      $scope.$watchCollection('model.mdc', function () {
        $scope.drgs = _($scope.acutes).filter({ MDC: $scope.model.mdc }).sortBy(asc).value();
        $scope.model.drg = $scope.drgs.length === 1 ? $scope.drgs[0] : undefined;
      });


      // snap
      var updateGroupings = function (episodeType) {
        $scope.groupedList = _($scope.snaps)
          .filter({ EpisodeType: episodeType })
          .pluck('Grouped')
          .uniq()
          .sortBy(asc)
          .value();
        $scope.model.grouped = $scope.groupedList.length === 1 ? $scope.groupedList[0] : undefined;
      };
      var updateHealthTypeList = function (episodeType) {
        $scope.healthTypeList = _($scope.snaps)
          .filter({ EpisodeType: episodeType })
          .pluck('HealthType')
          .uniq()
          .sortBy(asc)
          .value();
        $scope.model.healthType = $scope.healthTypeList.length === 1 ? $scope.healthTypeList[0] : undefined;
      };
      var updateAnsnaps = function (filterCriteria) {
        if(age <= 17){
          $scope.ansnaps = _($scope.snaps)
          .filter(filterCriteria)
          .filter(function(el) {
            if (el.IsPaedClass && age<=17) {
              return true;
            }
            return false;
          })
          .sortBy(asc)
          .value();

          //console.log('$scope.ansnaps ', $scope.ansnaps);

          $scope.model.ansnap = $scope.ansnaps.length === 1 ? $scope.ansnaps[0] : undefined;
      }
      else{
          //console.log('snaps ', $scope.snaps);
          //console.log('filterCriteria ', filterCriteria);
          //debugger;
        $scope.ansnaps = _($scope.snaps)
          .filter(filterCriteria)
          //.filter(function(el) {
          //  console.log('el.IsPaedClass ', el);
          //
          //  if (!el.IsPaedClass ) {
          //    return true;
          //  }
          //  return false;
          //})
          .sortBy(asc)
          .value();

          //console.log('$$$$scope.ansnaps ', $scope.ansnaps);
          $scope.model.ansnap = $scope.ansnaps.length === 1 ? $scope.ansnaps[0] : undefined;
      }
      };

      ihpaService.getSnap($scope.nwauVersion, lastEpisodeType)
        .then(function (result) {
          $scope.snaps = result;
          $scope.episodeTypes = _(result).pluck('EpisodeType').uniq().sortBy(asc).value();
          $scope.model.episodeType = $scope.episodeTypes.length === 1 ? $scope.episodeTypes[0] : undefined;
          $scope.model.grouped = undefined;
        });


      $scope.$watchCollection('model.episodeType', function () {
        if (nwauVersion<2015) {
          updateGroupings($scope.model.episodeType);
          updateAnsnaps({
            EpisodeType: $scope.model.episodeType,
            Grouped: $scope.model.grouped
          });
        }
        else {
          //Groups are replaced by Health Types in version 1516
          updateHealthTypeList($scope.model.episodeType);
          updateAnsnaps({
            EpisodeType: $scope.model.episodeType,
            HealthType: $scope.model.healthType
          });
        }
      });

      $scope.$watchCollection('model.grouped', function () {
        updateAnsnaps({
            EpisodeType: $scope.model.episodeType,
            Grouped: $scope.model.grouped
          });

      });

      $scope.$watchCollection('model.healthType', function () {
        updateAnsnaps({
            EpisodeType: $scope.model.episodeType,
            HealthType: $scope.model.healthType
          });
      });


      // edurg

      var fixIE = function(){
        $timeout(function () {
          angular.forEach(jQuery('select'), function (currSelect) {
            currSelect.options[currSelect.selectedIndex].text += ' ';
          });
        });
      };

      ihpaService.getUrgGroupings($scope.nwauVersion)
        .then(function (result) {
          $scope.urgGroupings = result;
          $scope.visitTypes = _(result).pluck('visitType').uniq(false).sortBy(asc).value();
          $scope.model.visitType = $scope.visitTypes.length === 1 ? $scope.visitTypes[0] : undefined;
        });

      var updateEpisodeEndStatuses = function (visitType) {
        $scope.episodeEndStatuses = _($scope.urgGroupings)
          .filter({ visitType: visitType })
          .pluck('episodeEndStatus')
          .uniq()
          .sortBy(asc)
          .value();
        $scope.model.episodeEndStatus = $scope.episodeEndStatuses.length === 1 ? $scope.episodeEndStatuses[0] : undefined;
        fixIE();
      };

      var updateTriages = function (visitType, episodeEndStatus) {
        $scope.triages = _($scope.urgGroupings)
          .filter({ visitType: visitType, episodeEndStatus: episodeEndStatus })
          .pluck('triage')
          .uniq()
          .sortBy(asc)
          .value();
        $scope.model.triage = $scope.triages.length === 1 ? $scope.triages[0] : undefined;
        fixIE();
      };

      var updateMdbs = function (visitType, episodeEndStatus, triage) {
        $scope.mdbs = _($scope.urgGroupings)
          .filter({ visitType: visitType, episodeEndStatus: episodeEndStatus, triage: triage })
          .pluck('mdb')
          .uniq()
          .sortBy(asc)
          .value();
        $scope.model.mdb = $scope.mdbs.length === 1 ? $scope.mdbs[0] : undefined;
        fixIE();
      };

      var updateEdurgs = function (visitType, episodeEndStatus, triage, mdb) {
        $scope.urgs = _($scope.urgGroupings)
          .filter({ visitType: visitType, episodeEndStatus: episodeEndStatus, triage: triage, mdb: mdb })
          .sortBy(asc)
          .value();
        $scope.model.edurg = $scope.urgs.length === 1 ? $scope.urgs[0] : undefined;
        fixIE();
      };

      $scope.$watchCollection('model.visitType', function () {
        updateEpisodeEndStatuses($scope.model.visitType);
        updateTriages($scope.model.visitType, $scope.model.episodeEndStatus);
        updateMdbs($scope.model.visitType, $scope.model.episodeEndStatus, $scope.model.triage);
        updateEdurgs($scope.model.visitType, $scope.model.episodeEndStatus, $scope.model.triage, $scope.model.mdb);
      });
      $scope.$watchCollection('model.episodeEndStatus', function () {
        updateTriages($scope.model.visitType, $scope.model.episodeEndStatus);
        updateMdbs($scope.model.visitType, $scope.model.episodeEndStatus, $scope.model.triage);
        updateEdurgs($scope.model.visitType, $scope.model.episodeEndStatus, $scope.model.triage, $scope.model.mdb);
      });
      $scope.$watchCollection('model.triage', function () {
        updateMdbs($scope.model.visitType, $scope.model.episodeEndStatus, $scope.model.triage);
        updateEdurgs($scope.model.visitType, $scope.model.episodeEndStatus, $scope.model.triage, $scope.model.mdb);
      });
      $scope.$watchCollection('model.mdb', function () {
        updateEdurgs($scope.model.visitType, $scope.model.episodeEndStatus, $scope.model.triage, $scope.model.mdb);
      });

      // Titles and subtitles
      switch ($scope.type) {
        case 'drg':
          $scope.title = 'Find a DRG';
          $scope.subtitle = 'To find an acute admitted classification, provide the most suitable response in the steps below.';
          break;
        case 'ansnap':
          $scope.title = 'Find an AN-SNAP Class';
          $scope.subtitle = 'To find a sub-acute and non-acute admitted classification, provide the most suitable response in the steps below';
          break;
        case 'edurg':
          $scope.title = 'Find a URG';
          $scope.subtitle = 'To find an Urgency Related Group, provide the most suitable response in the steps below';
          break;
      }

      $scope.ok = function () {
        var group = {};
        switch ($scope.type) {
          case 'drg':
            group = {
              id: $scope.model.drg.DRG
            };
            break;
          case 'ansnap':
            group = {
              id: $scope.model.ansnap.ANSNAP,
              healthType: $scope.model.ansnap.HealthType
            };
            break;
          case 'edurg':
            group = {
              id: $scope.model.edurg.urgId
            };
            break;
        }

        $modalInstance.close(group);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss(false);
      };
    }]);
