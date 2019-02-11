'use strict';

angular.module('nwauCalculatorApp')
  .directive('journeyForm', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/_journey-form.html',
      controller: ['$scope', '$rootScope', 'ihpaService',
        function ($scope, $rootScope, ihpaService) {
          $scope.currentYear = {
            value: 2016,
            label: 'NWAU16'
          };
          $scope.previousYear = {
            value: 2015,
            label: 'NWAU15'
          };
          $scope.facilties = [];
          $scope.regions = [];

          $rootScope.$on('cancelUserChange', function() {   // Mark
            //console.log('cancelUserChange ');
            if( $scope.journey.nwauVersion === $scope.previousYear.value) {
              $scope.journey.nwauVersion = $scope.currentYear.value;
            } else {
              $scope.journey.nwauVersion = $scope.previousYear.value;
            }
          });

          var getFacilities = function () {
            var returnValue = [];
            ihpaService.getFacilities($scope.journey.nwauVersion)
              .then(function (result) {
                if ($scope.journey.nwauVersion > 2014) {
                  $scope.facilities = result;
                }
                else {
                  $scope.facilities = result.filter(function(e) {
                    return !e.IsNewFacility;
                  });
                }
                returnValue = $scope.facilities;
              });
            //console.log('returnValue ', returnValue);

            return returnValue;
          };
          getFacilities();

          var getRegions = function () {
            ihpaService.getRegions($scope.journey.nwauVersion)
              .then(function (result) {
                $scope.regions = result;
              });
          };
          getRegions();

          $scope.$watch('journey.nwauVersion', function () {
            //console.log('$$$$scope.journey.nwauVersion ', $scope.journey.nwauVersion);

            getRegions();
            getFacilities();

            //if ($scope.journey.nwauVersion<=2014 && $scope.journey.facility.IsNewFacility) {
            if ($scope.journey.facility.IsNewFacility) {
              $scope.journey.facility = null;
            }
          });
        }]
    };
  })
;
