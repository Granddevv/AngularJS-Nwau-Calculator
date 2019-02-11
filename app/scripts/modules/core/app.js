'use strict';

angular.module('nwauCalculatorApp', [
  'ngAnimate',
  'ngSanitize',
  'ui.bootstrap',
  'ngTouch',
  'ui.router',
  'angular-data.DSCacheFactory'
]);

angular.module('nwauCalculatorApp').run([function () {
  FastClick.attach(document.body);

  if(window.applicationCache) {
    window.applicationCache.addEventListener('updateready', function () {
      if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
        window.applicationCache.swapCache();
        if (confirm('This application has been updated. Would you like to reload to get the latest changes?')) {
          window.location.reload();
        }
      }
    }, false);
  }

  //close popovers
  $('body').on('click', function (e) {
    $('*[popover]').each(function () {
      //Only do this for all popovers other than the current one that cause this event
      if (!($(this).is(e.target) || $(this).has(e.target).length > 0) &&
        $(this).siblings('.popover').length !== 0 &&
        $(this).siblings('.popover').has(e.target).length === 0)
      {
        //Remove the popover element from the DOM
        $(this).siblings('.popover').remove();
        //Set the state of the popover in the scope to reflect this
        angular.element(this).scope().tt_isOpen = false;
      }
    });
  });

  // hide splash
  setTimeout(function () {
    $('.splash').css({
      'opacity': '0',
      'z-index': '-1000'
    });
    setTimeout(function () {
      $('.splash').css({
        'display': 'none'
      });
      $('.splash img').css({
        'display': 'none !important'
      });
    },1000);
  }, 1000);
}]);
