'use strict';

angular.module('nwauCalculatorApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('start', {
        url: '/',
        templateUrl: 'views/start-view.html',
        controller: 'StartCtrl'
      })
      .state('journey', {
        url: '/journey/:journeyId',
        templateUrl : 'views/journey-view.html',
        controller : 'JourneyCtrl'
      })
      .state('editJourney', {
        url: '/journey/:journeyId/edit',
        templateUrl: 'views/edit-journey-view.html',
        controller: 'EditJourneyCtrl'
      })
      .state('encounter', {
        url: '/journey/:journeyId/encounter/:encounterId?classification?careId?careName',
        views: {
          '': {
            templateUrl: 'views/encounter-view.html',
            controller: 'EncounterCtrl'
          },
          'encounterForm@encounter': {
            templateUrl: 'views/_encounter-form.html'
          },
          'encounterNwauChart@encounter': {
            templateUrl: 'views/_encounter-nwau-chart.html'
          },
          'encounterLosChart@encounter': {
            templateUrl: 'views/_encounter-los-chart.html'
          },
          'encounterEquationPage@encounter': {
            templateUrl: 'views/_encounter-equation-page.html'
          }
        }
      })
      .state('compare', {
        url: '/journey/:journey1Id/compare/:journey2Id',
        views: {
          '': {
            templateUrl: 'views/compare-view.html',
            controller: 'CompareCtrl'
          }
        }
      })
    ;
  })
  .config(function($urlRouterProvider){
    $urlRouterProvider.when('', '/');
    $urlRouterProvider.otherwise('/');
  })
;
