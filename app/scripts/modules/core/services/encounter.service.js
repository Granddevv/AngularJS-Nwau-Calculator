angular.module('nwauCalculatorApp').factory('EncounterService', ['Calculator', 'ihpaService', '$q',
    function(Calculator, ihpaService, $q) {
        'use strict';

        return {
            getNwauCalculation: function(encounter, journey) {
              //console.log('encounter ', encounter);

              var adjustments = {
                    Age: journey.age, //Age
                    region: journey.region, //Private Patient Accommodation
                    A_OVERNIGHT: !encounter.sameDay, //Overnight calculation (only applicable for 1 day LOS)
                    A_IND: journey.indigenous, //Indigenous
                    facility: journey.facility.FacilityID, //Facility ID
                    A_SPA: encounter.psychiatricCare, //Specialist Psychiatric Care Days recorded
                    A_PRIVATE: journey.private, //Private Patient
                    A_RT: encounter.radiotherapy, //Radiotherapy Treatment
                    A_DIA: encounter.dialysis, //Dialysis
                    LOS: encounter.lengthOfStay, //Length of Stay
                    ICU_HOURS: encounter.icuHours, //ICU Hours
                    //A_NMC: encounter.nmc //MDT Adjustment
                    A_MDT: encounter.nmc //MDT Adjustment
                };

              switch (encounter.classification) {
                    case 'Acute Admitted':
                        //for new calculation of acute adjustment
                      adjustments.MDC = encounter.drg.mdc;
                      //if(_debug) console.log('adjustments.MDC ', adjustments.MDC);

                      return Calculator.Acute(adjustments, encounter.drg.id, journey.nwauVersion);
                    case 'SNAP':
                        return Calculator.SNAP(adjustments, encounter.ansnap.id, journey.nwauVersion);
                    case 'Emergency Department UDG':
                        return Calculator.EDUDG(adjustments, encounter.edudg.id, journey.nwauVersion);
                    case 'Emergency Department URG':
                        return Calculator.EDURG(adjustments, encounter.edurg.id, journey.nwauVersion);
                    case 'Non Admitted':
                        return Calculator.NAP(adjustments, encounter.tier2clinic.id, journey.nwauVersion)
                            .then(function(calculation) {
                                calculation.adjustedNwau = calculation.nwau * encounter.serviceEvents;
                                calculation.adjustedPrice = calculation.price * encounter.serviceEvents;
                                return calculation;
                            });
                    default:
                        return {};
                }
            },

            getChartValues: function(nwauCalculation, classification, group) {
              var c = nwauCalculation;
                var cv = [];
                var pushValue = function(caption, value, colour) {
                    cv.push({
                        caption: caption,
                        value: value,
                        colour: colour
                    });
                };
                pushValue('PW (Short Stay)', c.adjustments.shortStay, '#64c76a');

                if (classification === 'Emergency Department URG' ||
                    classification === 'Emergency Department UDG' ||
                    classification === 'Non Admitted' ||
                    group.name.indexOf('Ungrouped Care Type') > -1 ||
                    (nwauCalculation.adjustments.shortStay === 0 && nwauCalculation.adjustments.longStay === 0)) {
                    pushValue('Price Weight', c.PW, '#4be04f');
                } else {
                    pushValue('PW (Inlier)', c.PW, '#4be04f');
                }
                pushValue('PW (Long Stay Outlier)', c.adjustments.longStay, '#01e88d');
                pushValue('Remoteness', c.adjustments.remoteness, '#B43104');
                pushValue('ICU', c.adjustments.ICU, '#6199CC');
                pushValue('Indigenous', c.adjustments.indigenous, '#FF8000');

                if (c.adjustments.emergcareage) {
                  pushValue('Age Care', c.adjustments.emergcareage, '#9EAA20');   // Mark
                }

                if (c.adjustments.paediatric != 0) {
                    pushValue('Paediatric', c.adjustments.paediatric, '#00FFFF');
                }
                if (c.adjustments.multidisciplinaryteams) {
                    pushValue('Multi-Disciplinary Teams', c.adjustments.multidisciplinaryteams, '#008080');
                }
                pushValue('Psychiatric', c.adjustments.psychiatric, '#8000FF');
                pushValue('Radiotherapy', c.adjustments.radiotherapy, '#00FF00');
                if (c.adjustments.dialysis !== 0) {
                    pushValue('Dialysis', c.adjustments.dialysis, '#a52a2a');
                }
                pushValue('ACC', c.adjustments.ACC, '#FF0000');
                pushValue('PPS', c.adjustments.PPS, '#FA58F4');
                pushValue('Total', c.nwau, '#0040FF');

                var noZeroes = _.filter(cv, function(v) {
                    if (v.caption === 'Total') {
                        return v;
                    } else if (v.value !== 0 && v.value !== undefined) {
                        return v;
                    }
                });
                return noZeroes;
            },

            dayLimitDrg: false,

            getCareBounds: function(encounter, journey) {
              //console.log('getCareBounds encounter ', arguments);

              switch (encounter.classification) {
                    case 'Acute Admitted':
                        promises = [
                            ihpaService.getAcute(journey.nwauVersion),
                            ihpaService.getLosState(journey.nwauVersion)
                        ];
                        var self = this;
                        return $q.all(promises)
                            .then(function(result) {
                                var acuteList = result[0];
                                var losList = result[1];

                                //get the DRG
                                var drg = _(acuteList).find({
                                    'DRG': encounter.drg.id
                                });
                                if (!drg) {
                                  // console.log('!drg return');
                                  return;
                                }

                                //check whether to get mental health or non-mental health stats from LOS state average
                                var healthStatus = "NMH";

                                if (encounter.psychiatricCare) {
                                    healthStatus = "MH";
                                }

                                //get the state average los
                                var stateAverage = _.find(losList, {
                                    cn: encounter.careId,
                                    nv: journey.nwauVersion.toString(),
                                    psych: healthStatus
                                });

                              var dayLimitDrgs = ['Y60Z', 'W60A', 'W60B', 'P60A', 'P60B', 'P01Z', 'I80Z', 'F62C', 'F60B', 'B78C', 'B70D'];
                              self.dayLimitDrg = dayLimitDrgs.indexOf(drg.DRG) !== -1;  // Mark

                              return {
                                    lower: drg.LowerBound,
                                    upper: drg.UpperBound,
                                    limit: drg.UpperBound + drg.LowerBound,
                                    average: {
                                        national: Math.round(drg.ALOS),
                                        state: stateAverage ? Math.round(stateAverage.ALOS) : undefined
                                    }
                                }
                            });
                    case 'SNAP':
                        var promises = [
                            ihpaService.getLosState(journey.nwauVersion),
                            ihpaService.getLosUngroupedState(journey.nwauVersion),
                            ihpaService.getSnap(journey.nwauVersion),
                            _.contains([
                                'Rehabillitation',
                                'Palliative Care',
                                'Maintenance',
                                'GEM',
                                'Psychogeriatric'
                            ], encounter.ansnap.id) ? ihpaService.getLosUngroupedState(journey.nwauVersion) : ihpaService.getLosState(journey.nwauVersion)
                        ];
                        return $q.all(promises)
                            .then(function(result) {
                                var losList = result[0];
                                var ungroupedLosList = result[1];
                                var snapList = result[2];

                                var ansnap = _(snapList).find({
                                    'ANSNAP': encounter.ansnap.id
                                });
                                if (!ansnap) {
                                    return;
                                }

                                //when getting stats, if same day is selected, get same day stats, else get overnight stats
                                if (encounter.sameDay) {
                                    var getLOSStats = 'Sameday';
                                } else {
                                    var getLOSStats = 'Overnight';
                                }

                                //check whether to get mental health or non-mental health stats from LOS state average
                                var healthStatus = "NMH";
                                if (encounter.ansnap.healthType === "Mental Health") {
                                    healthStatus = "MH";
                                }

                                //get the state average los
                                if (ansnap) {
                                    //get ungrouped data for 2015/2016
                                    if (journey.nwauVersion > 2014 && (encounter.careId === 'Rehabilitation' || encounter.careId === 'Maintenance' || encounter.careId === 'Paed-001' || encounter.careId === 'Paed-002' || encounter.careId === 'Paed-003')) {
                                        var stateAverage = _.find(ungroupedLosList, {
                                            cn: encounter.careId,
                                            nv: journey.nwauVersion.toString(),
                                            psych: healthStatus,
                                            group: getLOSStats
                                        });
                                    }
                                    //get ungrouped data for 2014/2015
                                    else if (journey.nwauVersion <= 2014 && (encounter.careId === 'Rehabilitation' || encounter.careId === 'Maintenance' || encounter.careId === 'GEM' || encounter.careId === 'Palliative Care' || encounter.careId === 'Psychogeriatric')) {
                                        var stateAverage = _.find(ungroupedLosList, {
                                            cn: encounter.careId,
                                            nv: journey.nwauVersion.toString(),
                                            psych: healthStatus,
                                            group: getLOSStats
                                        });
                                    }
                                    //get grouped data for both 2014/2015 and 2015/2016
                                    else {
                                        var stateAverage = _.find(losList, {
                                            cn: encounter.careId,
                                            psych: healthStatus,
                                            nv: journey.nwauVersion.toString()
                                        });
                                    }
                                    return {
                                        lower: ansnap.LowerBound,
                                        upper: ansnap.UpperBound,
                                        limit: ansnap.UpperBound + ansnap.LowerBound,
                                        average: {
                                            national: Math.round(ansnap.AverageLengthofStay),
                                            state: stateAverage ? Math.round(stateAverage.ALOS) : undefined
                                        }
                                    };
                                };

                            });
                    default:
                        var deferred = $q.defer();
                        deferred.resolve([]);
                        return deferred.promise;
                }
            },

            getLosChartValues: function(encounter, journey) {
                var that = this;

                return this.getCareBounds(encounter, journey)
                    .then(function(bounds) {
                        if (!bounds) {
                            var deferred = $q.defer();

                            return deferred.resolve(bounds);
                        }
                        if (bounds.lower === 0) {
                            bounds.lower = 150;
                        }
                        if (bounds.upper === 0) {
                            bounds.upper = 150;
                        }
                        if (bounds.limit === 0) {
                            bounds.limit = 150;
                        }

                        var losChartPoints = [];
                        losChartPoints[0] = 0;
                        losChartPoints[1] = bounds.lower - 0.01;
                        losChartPoints[2] = bounds.lower;
                        losChartPoints[3] = bounds.upper;
                        losChartPoints[4] = bounds.limit;

                        var promises = _(losChartPoints)
                            .map(function(los) {
                                var e = angular.copy(encounter);
                                e.lengthOfStay = los;
                                if (los < 1) {
                                    e.sameDay = true;
                                } else {
                                    e.sameDay = false;
                                }

                                return that.getNwauCalculation(e, journey)
                                    .then(function(calculation) {
                                        return {
                                            day: los,
                                            nwau: calculation.nwau,
                                            average: bounds.average
                                        };
                                    });
                            })
                            .value();

                        return $q.all(promises);
                    });
            },

            getLosProportions: function(encounter, journey) {
                var getLos = function(careCode, year, psych, grouped) {
                  //console.log('getLos ', arguments);

                  var promises = grouped ? ihpaService.getLosState(year) : ihpaService.getLosUngroupedState(year);
                    return $q.all(promises)
                        .then(function(result) {
                            var psychValue = psych ? 'MH' : 'NMH';
                            return _.filter(result, {
                                cn: careCode.id,
                                nv: year.toString(),
                                psych: psychValue
                            });
                        });
                };

                switch (encounter.classification) {
                    case 'Acute Admitted':
                        return getLos(encounter.drg, journey.nwauVersion, encounter.psychiatricCare, true);

                    case 'SNAP':
                        return getLos(encounter.ansnap, journey.nwauVersion, encounter.psychiatricCare, encounter.ansnap.grouped);

                    default:
                        return;
                }
            },
            getLosStateProportions: function(encounter, journey) {

                var getLosState = function(careCode, year, psych, grouped) {
                    var promise = grouped ? ihpaService.getLosState(year) : ihpaService.getLosUngroupedState(year);
                    return promise
                        .then(function(result) {
                            var psychValue = psych ? 'MH' : 'NMH';
                            return _.filter(result, {
                                cn: careCode.id,
                                nv: year.toString(),
                                psych: psychValue
                            });
                        });
                };

                switch (encounter.classification) {
                    case 'Acute Admitted':
                        return getLosState(encounter.drg, journey.nwauVersion, encounter.psychiatricCare, true);

                    case 'SNAP':
                        if (journey.nwauVersion > 2014) {
                            encounter.ansnap.grouped = true;
                            //used for 2015 to get ungrouped state data
                            if ((encounter.ansnap.episodeType == 'Rehabilitation' || encounter.ansnap.episodeType == 'Maintenance') && encounter.ansnap.healthType == 'Mental Health') {
                                encounter.ansnap.grouped = false;
                            } else if (encounter.ansnap.id === 'Paed-001' || encounter.ansnap.id === 'Paed-002' || encounter.ansnap.id === 'Paed-003') {
                                encounter.ansnap.grouped = false;
                            }
                            return getLosState(encounter.ansnap, journey.nwauVersion, (encounter.ansnap.healthType === 'Mental Health'), encounter.ansnap.grouped);
                        }
                        return getLosState(encounter.ansnap, journey.nwauVersion, encounter.psychiatricCare, encounter.ansnap.grouped);
                    default:
                        return;
                }
            },

            getIcuState: function(drg, year) {
                var getIcuState = function() {
                    var promises = ihpaService.getIcuState(year);
                    return $q.all(promises)
                        .then(function(result) {
                            return _.find(result, {
                                class_name: drg,
                                year: year.toString()
                            });
                        });
                };

                var promises = getIcuState();
                return $q.all(promises).then(function(result) {
                    return result;
                });
            },

            getJourneyChart: function(journey) {
                return _(journey.encounters)
                    .map(function(encounter) {
                        var label;
                        var colour;
                        switch (encounter.classification) {
                            case 'Acute Admitted':
                                label = 'Acute';
                                colour = '#fb8335';
                                break;
                            case 'SNAP':
                                label = 'SNAP';
                                colour = '#4e5ece';
                                break;
                            case 'Emergency Department UDG':
                                label = 'ED';
                                colour = '#DE1B1B';
                                break;
                            case 'Emergency Department URG':
                                label = 'ED';
                                colour = '#7D1935';
                                break;
                            case 'Non Admitted':
                                label = 'NAP';
                                colour = '#f47e7d';
                                break;
                            default:
                                return;
                        }
                        return {
                            caption: label,
                            value: encounter.nwauCalculation.nwau,
                            colour: colour
                        };
                    })
                    .value();
            },

            getCurrentCare: function(encounter) {
                switch (encounter.classification) {
                    case 'Acute Admitted':
                        return encounter.drg;
                    case 'SNAP':
                        return encounter.ansnap;
                    case 'Emergency Department UDG':
                        return encounter.edudg;
                    case 'Emergency Department URG':
                        return encounter.edurg;
                    case 'Non Admitted':
                        return encounter.tier2clinic;
                }
            }
        };
    }
]);
