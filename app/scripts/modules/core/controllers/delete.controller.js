angular.module('nwauCalculatorApp')
  .controller('DeleteCtrl', ['$scope', '$modalInstance', 'type', 'name',
    function ($scope, $modalInstance, type, name) {
      'use strict';
      $scope.type = type;
      $scope.name = name;

      $scope.delete = function () {
        $modalInstance.close(true);
      };

      $scope.cancel = function () {
        $modalInstance.dismiss(false);
      };
    }]);

