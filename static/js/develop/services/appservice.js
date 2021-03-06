'use strict';

(function(){
  angular.module('osumo').service('AppService', ['$q', '$rootScope', '$timeout', 'VERSION', 'DataService', 'L10NService', function($q, $rootScope, $timeout, VERSION, DataService, L10NService) {

    var APPURL = BASE_URL + 'manifest.webapp';

    this.checkInstalled = function() {
      var deferred = $q.defer();
      if (this.installCompatible(deferred)) {
        var request = window.navigator.mozApps.checkInstalled(APPURL);
        request.onsuccess = function() {
          if (request.result) {
            deferred.resolve(true);
          } else {
            deferred.resolve(false);
          }
        };

        request.onerror = function() {
          deferred.reject(this.error);
        };
      }
      return deferred.promise;
    };

    /**
     * Check if we can install as a mozApp
     *
     * @param {deferred} deferred  A deferred to reject if we can't install.
     * @returns {boolean} Either a true or a false value depending on if the
     *                    browser is compatible.
     */
    this.installCompatible = function(deferred) {
      if (!window.navigator.mozApps) {
        if (deferred) {
          deferred.reject('Your browser is not compatible. Try using Firefox!');
        }
        return false;
      }
      return true;
    };

    if (!this.installCompatible()) {
      $timeout(function() {
        $rootScope.toast({
          message: L10NService._('Your browser is not compatible and this app may not work as intended. Try using Firefox instead!'),
          showclose: 'false'
        }, "incompatible-browser");
      }, 0);
    }

    /**
     * Attempts to auto install the app without telling the user. This is
     * perhaps badly named. The reason is auto install only occurs if we are
     * already installed as an mozApp. This simply sets up the database.
     *
     * @returns {promise} A promise that will be rejected either with
     *                    'not installed', in which case this means that the app
     *                    is not already installed or it will be rejected as
     *                    an incompatible browser. It will be resolved if the
     *                    auto install went through.
     */
    this.autoInstall = function() {
      var request;
      var d = $q.defer();

      if (this.installCompatible(d)) {
        request = window.navigator.mozApps.getSelf();
        request.onsuccess = function(e) {
          if (request.result) {
            $rootScope.$apply(function() {
              DataService.settingsDb.then(function(db) {
                db.transaction('meta').objectStore('meta').get(VERSION).then(function(value) {
                  if (value === undefined || !value.installed) {
                    d.resolve();
                    console.log('We are already running as an app.');
                  }
                });
              });
            });
          } else {
            $rootScope.$safeApply(function() {
              d.reject('not installed');
            });
          }
        };
      }
      return d.promise;
    };

    /**
     * The actuall install request.
     *
     * @returns {promise} A promise that will be resolved when the installation
     *                    is complete or rejected if there is an error.
     */
    this.install = function() {
      var promise;
      var d = $q.defer();

      if (this.installCompatible(d)) {
        promise = this.autoInstall();

        promise.then(undefined, function(reason) {
          var install;
          if (reason === 'not installed') {
            install = window.navigator.mozApps.install(APPURL);
            install.onsuccess = function() {
              $rootScope.$safeApply(function() {
                d.resolve();
              });
            };

            install.onerror = function(e) {
              $rootScope.$safeApply(function() {
                d.reject(e.target.error.name);
              });
            };
          }
        });

      }

      return d.promise;
    };

    this.setDefaultLocale = function(locale) {
      var deferred = $q.defer();

      L10NService.setDefaultLocale(locale);
      DataService.settingsDb.then(function(db) {
        var metaStore = db.transaction('meta', 'readwrite').objectStore('meta');
        metaStore.get(VERSION).then(function(original) {
          original.locale = locale;
          metaStore.put(original).then(function() {
            deferred.resolve();
          });
        });
      });

      return deferred.promise;
    };

    L10NService.setDefaultLocale(navigator.language);
    // Check for default locale in indexeddb.
    DataService.settingsDb.then(function(db) {
      var metaStore = db.transaction('meta').objectStore('meta');
      metaStore.get(VERSION).then(function(value) {
        if (value)
          L10NService.setDefaultLocale(value.locale);
      });
    });

    // Check appcache stuff for upgrade.
    var needupgrade = $q.defer();
    var appCache = window.applicationCache;
    if (appCache) {
      appCache.addEventListener('updateready', function(e) {
        if (appCache.status === appCache.UPDATEREADY) {
          $rootScope.$safeApply(function() {
            needupgrade.resolve(true);
          });
        }
      });
    }

    /**
     * Checks if app cache wants to update. Returns a promise. This promise will
     * only resolve if there needs to be an upgrade.
     */
    this.checkAppcacheUpgrade = function() {
      return needupgrade.promise;
    };

  }]);
})();