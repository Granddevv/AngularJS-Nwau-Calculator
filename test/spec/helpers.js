var Helpers = function ($filter, $httpBackend) {
  'use strict';
  return {
    round: function (number, decimals) {
      'use strict';
      return parseFloat($filter('number')(number, decimals));
    },
    loadApi: function () {
      jasmine.getFixtures().fixturesPath = 'base/app';
      $httpBackend.whenGET().respond(function (method, url) {
		  //console.log('whenGET ', url);

		  return [200, readFixtures(url)];
      });
    }
  };
}

