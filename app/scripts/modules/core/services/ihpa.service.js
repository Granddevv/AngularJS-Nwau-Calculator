angular.module('nwauCalculatorApp').factory('ihpaService', ['$http', '$q',
  function ($http, $q) {
    'use strict';
    var baseUrl = 'ihpa/',
      los,
      suggestions;

    var getFinancialYear = function (year) {
      var twoDigits = year % 100;
      return '' + twoDigits + (twoDigits + 1);
    };

    var getData = function (name) {
      var path = baseUrl + name + '.json';
			//console.log('pathpathpathpath ', path);

		return $http.get(path, { cache: true })
        .then(function (result) {
          return result.data;
        });
    };

    var getYearData = function (name, year) {
      var yearName = name + getFinancialYear(year);
      return getData(yearName);
    };

    var resolvePromise = function (value) {
      var deferred = $q.defer();
      deferred.resolve(value);
      return deferred.promise;
    };

    return {
      getAcute: function (year) {
        return getYearData('Acute', year)
          .then(function (result) {
            return result.Acute;
          });
      },
      getAcuteAdjustment: function (year) {
        return getYearData('AcuteAdjustment', year)
          .then(function (result) {
            return result.AcuteAdjustment;
          });
      },
      getSnap: function (year, lastEpisodeType) {
        var reject = function (snaps) {
          if (lastEpisodeType !== 'Palliative Care') {
            return _.reject(snaps, { EpisodeType: lastEpisodeType});
          }
          return snaps;
        };

        return getYearData('Snap', year)
          .then(function (result) {
            if (lastEpisodeType) {
              return reject(result.Snap);
            } else {
              return result.Snap;
            }
          });
      },
      getSubacuteAdjustment: function (year) {
        return getYearData('SubacuteAdjustment', year)
          .then(function (result) {
            return result.SubacuteAdjustment;
          });
      },
      getEDAdjustment: function (year) {
        return getYearData('EDAdjustment', year)
          .then(function (result) {
            return result.EDAdjustment;
          });
      },
      getEDUdg: function (year) {
        return getYearData('EDUDG', year)
          .then(function (result) {
            return result.EDUDG;
          });
      },
      getEDUrg: function (year) {
        return getYearData('EDURG', year)
          .then(function (result) {
            return result.EDURG;
          });
      },
      getNap: function (year) {
		  //console.log('getNap year: ', year);

		  return getYearData('NAP', year)
          .then(function (result) {
			  //console.log('NAPresult ', result.NAP);

			  return result.NAP;
          });
      },
      getNonAdmittedAdjustment: function (year) {
        return getYearData('NonAdmittedAdjustment', year)
          .then(function (result) {
            //console.log('result.NonAdmittedAdjustment ', result.NonAdmittedAdjustment);
            return result.NonAdmittedAdjustment;
          });
      },
      getFacilities: function (year) {
        return getYearData('Facilities', year)
          .then(function (result) {
            return _(result.Facilities)
              .map(function (facility) {
                facility.description = facility.Facilities + ' ' + facility.FacilityID;
                return facility;
              })
              .value();
          });
      },
      getRegions: function (year) {
        return getYearData('Regions', year)
          .then(function (result) {
            return _(result.Regions)
              .map(function (region) {
                region.description = region.Postcode + ' ' + region.Locality + ' ' + region.State + ' - ' + region.Description;
                return region;
              })
              .value();
          });
      },
      getSpecifiedIcus: function (year) {
        return getYearData('SpecifiedICUs', year)
          .then(function (result) {
            return result.SpecifiedICUs;
          });
      },
      isIcuEligible: function (hospital, year) {
        return this.getSpecifiedIcus(year)
          .then(function (icus) {
            var icu = icus.filter(function(el) {
              return el.ICUEligibleHospitals === hospital;
            });

            return !_.isEmpty(icu);
          });
      },
      getClasses: function (classification, year, lastEpisodeType) {
        // console.log('getClasses ', arguments);

        switch (classification) {
          case 'Acute Admitted':
            return this.getAcute(year)
              .then(function (result) {
                var acuteList = result;
                return _(acuteList).map(function (d) {
                  return {
                    id: d.DRG,
                    name: d.DRG + ' - ' + d.Description,
                    sameDay: d.SameDay,
                    mdc: d.MDC,
                    bundledIcu: d.BundledICU
                  };
                }).value();
              });
          case 'SNAP':
            return this.getSnap(year, lastEpisodeType)
              .then(function (result) {
                var snapList = result;
                return _(snapList).map(function (d) {
                  return {
                    id: d.ANSNAP,
                    name: d.ANSNAP + ' - ' + d.Description,
                    sameDay: d.SameDay,
                    episodeType: d.EpisodeType,
                    grouped: d.Grouped === 'Grouped',
                    healthType: d.HealthType,
                    paedClass: d.IsPaedClass
                  };
                }).value();
              });
          case 'Emergency Department UDG':
            return this.getEDUdg(year)
              .then(function (result) {
                var udgList = result;
                return _(udgList).map(function (d) {
                  return {
                    id: d.UDG,
                    name: d.UDG + ' - ' + d.Description
                  };
                }).value();
              });
          case 'Emergency Department URG':
            return this.getEDUrg(year)
              .then(function (result) {
                var urgList = result;
                return _(urgList).map(function (d) {
                  return {
                    id: d.URG,
                    name: d.URG + ' - ' + d.Description
                  };
                }).value();
              });
          case 'Non Admitted':
            return this.getNap(year)
              .then(function (result) {
                var napList = result;
                return _(napList).map(function (d) {
                  return {
                    id: d.Tier2Clinic,
                    name: d.Tier2Clinic + ' - ' + d.Description,
                    monthlyRollup: d.MonthlyRollup
                  };
                }).value();
              });
        }
      },
      getSuggestions: function (facility, nwauVersion, careId) {
        //console.log('__getSuggestions ', arguments);
        var that = this;

        var addCareDetails = function (suggestions) {
          //console.log('addCareDetails ', arguments);

          var promises = [
            that.getAcute(nwauVersion),
            that.getSnap(nwauVersion),
            that.getEDUdg(nwauVersion),
            that.getEDUrg(nwauVersion),
            that.getNap(nwauVersion)
          ];

          return $q.all(promises)
            .then(function (result) {

              var acute = result[0],
                snap = result[1],
                edUdg = result[2],
                edUrg = result[3],
                nap = result[4],
                care;

              return _(suggestions)
                .map(function (suggestion) {
                  //console.log('suggestion ', suggestion);

                  if ((/^DRG/).test(suggestion.to_type)) {
                    care = _(acute).find({'DRG': suggestion.to});
                    if (care) {
                      suggestion.classification = 'Acute Admitted';
                      suggestion.description = suggestion.to + ' - ' + care.Description;
                    }
                  }
                  else if ((/^UDG/).test(suggestion.to_type)) {
                    care = _(edUdg).find({'UDG': suggestion.to});
                    if (care) {
                      suggestion.classification = 'Emergency Department UDG';
                      suggestion.description = suggestion.to + ' - ' + care.Description;
                    }
                  }
                  else if ((/^URG/).test(suggestion.to_type)) {
                    care = _(edUrg).find({'URG': suggestion.to});
                    if(!care) {
                      var work = suggestion.to.substr(3) *1;  // Mark
                      care = _(edUrg).find({'URG': work.toString()});
                    }
                    if (care) {
                      suggestion.classification = 'Emergency Department URG';
                      suggestion.description = suggestion.to + ' - ' + care.Description;
                    }
                  }
                  else if ((/^ANSNAP/).test(suggestion.to_type) || (/^Care_Type/).test(suggestion.to_type)) {
                    care = _(snap).find({'ANSNAP': suggestion.to});
                    if (care) {
                      suggestion.classification = 'AN-SNAP';
                      suggestion.description = suggestion.to + ' - ' + care.Description;
                    }
                  }
                  else if ((/^Tier2Clinic/).test(suggestion.to_type)) {
                    care = _(nap).find({'Tier2Clinic': suggestion.to});
                    if (care) {
                      suggestion.classification = 'Non Admitted';
                      suggestion.description = suggestion.to + ' - ' + care.Description;
                    }
                  }
                  return suggestion;
                }).value();
            });
        };

        var findSuggestion = function (suggestions) {
          //console.log('suggestions ', suggestions);
          var nwau = nwauVersion % 100;
          //console.log('findSuggestion ', careId, facility.Peer, nwau);
          var filteredSuggestions = _(suggestions).filter({'from': careId, 'peer_group': facility.Peer, 'nwau': nwau.toString() }).value();
          //console.log('filteredSuggestions ', filteredSuggestions);
          return addCareDetails(filteredSuggestions);
        };

        return getYearData('suggestions', nwauVersion)
          .then(function (result) {
            suggestions = result.Suggestions;
            return findSuggestion(suggestions);
          });
      },
      getStatePrice: function () {
        return getData('StatePrice')
          .then(function (result) {
            return result.StatePrice;
          });
      },

      getLosState: function (year) {
        return getYearData('LosState', year)
          .then(function (result) {
            return result.LosState;
          });
      },
      getLosUngroupedState: function (year) {
        return getYearData('LosUngroupedState', year)
          .then(function (result) {
            return result.LosUngroupedState;
          });
      },
      getIcuState: function (year) {
        return getYearData('IcuState', year)
          .then(function (result) {
            return result.IcuState;
          });
      },
      getCare: function (classification, year, careId, healthType) {
        //console.log('getCare ', arguments);
        return this.getClasses(classification, year, undefined)
          .then(function (classes) {
            //console.log('classes ', classes);
            if (healthType) {
              return _.find(classes, { id: careId, healthType: healthType});
            }
            return _.find(classes, { id: careId });
          });
      },
      getUrgGroupings: function (year) {
        return getYearData('urgGrouping', year)
          .then(function (result) {
            return result.urgGrouping;
          });
      }
    };
  }]);
