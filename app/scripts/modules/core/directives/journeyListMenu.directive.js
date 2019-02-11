'use strict';

angular.module('nwauCalculatorApp')
  .directive('journeyListMenu', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'views/_journey-list.html',
      controller: ['$scope', 'StorageService',
        function ($scope, StorageService) {
          $scope.journeys = StorageService.getJourneys();
        }]
    };
  })
  ;