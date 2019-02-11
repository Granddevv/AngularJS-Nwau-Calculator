angular.module('nwauCalculatorApp')
  .controller('StartCtrl', ['$scope', 'StorageService', '$modal',
    function ($scope, StorageService, $modal) {
      'use strict';
      $scope.helps = [
        {
          title: 'What is a patient journey?',
          text: '<p>A patient journey describes the sequence of clinical events a patient will experience as the patient moves through the health system. The journey is based on five workstreams that parallel the case-mix classifications:<br>' +
            'Emergency Department;<br>' +
            'Acute;<br>' +
            'Sub-acute and Non-acute Admitted Patients;<br>' +
            'Non-Admitted; and<br>' +
            'Mental Health</p>'
        },
        {
          title: 'What is an NWAU?',
          text: '<p>The NWAU is a resource use relativity and the currency used to express the price weights for all services funded on an activity basis.</p>' +
            '<p>The NWAU values are recalibrated yearly and are based on annual costing studies from a majority of Australian hospitals.</p>' +
            '<p>The NWAU value and the weighting for each classification element is set by IHPA on an annual basis.</p>' +
            '<p>The NWAU forms the basis for funding agreements between the Ministry of Health and Local Health Districts/Specialty Health Networks.</p>' +
            '<p>For 2016-2017 the State Price for the provision of 1 NWAU of clinical activity was $4605. </p>'
        },
        {
          title: 'How does this affect my job?',
          text: '<p>The information you collect as you go about the clinical care of your patient forms the basis of the data used within the Activity Based Funding process. Accurately recording the care  you provide to your patient as well as patient and facility characteristics will ensure that all costs and activity are appropriately recorded.</p>' +
            '<p>You do not need to do anything different other than treat the patient to the best of your ability</p>'
        }
      ];

      var disclaimer = {
          title: 'Disclaimer',
          text: '<h2>NWAU Calculator</h2>' +
            '<p>The NWAU calculator is an education tool developed to assist clinicians and managers understand the factors that influence the calculation of NWAU for an episode of care or for a patient journey. It is a single dimension of the Activity Based Funding and Activity Based Management frameworks and on its own should not influence decisions regarding the model or location of care provided to patients.</p>'
      };

      showHelp(disclaimer);

      $scope.showHelp = showHelp;

      function showHelp(help) {
        $modal.open({
          templateUrl: 'help-modal.html',
          controller: ['$scope', '$modalInstance', 'help',
            function ($scope, $modalInstance, help) {
              $scope.help = help;

              $scope.close = function () {
                $modalInstance.dismiss('cancel');
              };
            }],
          resolve: {
            help: function () {
              return help;
            }
          }
        });
      };
    }]);
