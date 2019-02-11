var _debug = false;

angular.module('nwauCalculatorApp').factory('Calculator', ['ihpaService', '$q', '$modal', '$rootScope',
    function(ihpaService, $q, $modal, $rootScope) {
        var getRemoteAdjustment = function(region, RegionAdj) {
            if (region.Description === 'Outer Regional') {
                return RegionAdj.Outer; //outer regional 7%
            } else if (region.Description === 'Remote') {
                return RegionAdj.Remote; //remote region 15%
            } else if (region.Description === 'Very Remote') {
                return RegionAdj.VeryRemote; //very remote region 21%
            } else {
                return 0; //no area adjustment applies
            }
        };

        // TODO: update calcalator to consider if LOS(length of stay) is removed
        var getACCAdjustment = function(A_PRIVATE, region, LOS, A_OVERNIGHT, PrivAccAdj) {
            //switch dependent on location. returns same day or overnight adjustment
            if (A_PRIVATE === false) {
                return 0; //patient is not private, so no adjustment applies
            } else {
                var weights = [];
                switch (region.State) {
                    case 'NSW':
                        weights = [PrivAccAdj.NSWSameDay, PrivAccAdj.NSWOvernight]; //[0.0487, 0.0673];
                        break;
                    case 'VIC':
                        weights = [PrivAccAdj.VICSameDay, PrivAccAdj.VICOvernight]; //[0.0477, 0.0635];
                        break;
                    case 'QLD':
                        weights = [PrivAccAdj.QLDSameDay, PrivAccAdj.QLDOvernight]; //[0.0497, 0.0683];
                        break;
                    case 'SA':
                        weights = [PrivAccAdj.SASameDay, PrivAccAdj.SAOvernight]; //[0.0487, 0.0673];
                        break;
                    case 'WA':
                        weights = [PrivAccAdj.WASameDay, PrivAccAdj.WAOvernight]; //[0.0551, 0.0673];
                        break;
                    case 'TAS':
                        weights = [PrivAccAdj.TASSameDay, PrivAccAdj.TASOvernight]; //[0.0471, 0.0641];
                        break;
                    case 'NT':
                        weights = [PrivAccAdj.NTSameDay, PrivAccAdj.NTOvernight]; //[0.0473, 0.0655];
                        break;
                    case 'ACT':
                        weights = [PrivAccAdj.ACTSameDay, PrivAccAdj.ACTOvernight]; //[0.0487, 0.0673];
                        break;
                    default:
                        weights = [PrivAccAdj.NSWSameDay, PrivAccAdj.NSWOvernight]; // NSW by default
                }
                if (LOS === 1 && A_OVERNIGHT === false) {
                    return weights[0]; //same day
                } else {
                    return weights[1]; //overnight
                }
            }
        };

        var getICUAdjustment = function(BundledICU, ICUHourlyRate) {
            if (BundledICU === true) { //stored as string
                return 0; //bundled ICU means no adjustment for ICU hours
            } else {
                return ICUHourlyRate; //0.0426NWAU per ICU hour
            }
        };

        var getIndAdjustment = function(A_IND, IndigenousAdj) {
          //if(_debug) console.log('getIndAdjustment__ ', arguments);

          if (A_IND === true) {
                return IndigenousAdj; //0.04 for acute admitted
            } else {
                return 0;
            }
        };

        var getNMCAdjustment = function(A_NMC, NMCAdj) {
          //if(_debug) console.log('getNMCAdjustment ', arguments);
          if (A_NMC === true) {
                return NMCAdj;
            } else {
                return 0;
            }
        };

        var getPaediatricAdjustment = function(age, facility, paedAge, paediatricAdjustment) {
            //up to and including 16, admitted to a specialized children's hospital
            if (age < paedAge && facility.SpecialistPaed === true) { // < 17
                return paediatricAdjustment; //add on % based on DRG
            } else {
                return 1; //no paediatric adjustment applies so it is 100%
            }
        };

        var getSNAPPaediatricAdjustment = function(age, paedAge, paediatricAdjustment) {
          //if(_debug) console.log('getSNAPPaediatricAdjustment ', arguments);

          //up to and including 16, admitted to a specialized children's hospital
            if (age < paedAge) { // < 17
              //console.log('paediatricAdjustment ', paediatricAdjustment);

              return paediatricAdjustment; //add on % based on AN SNAP
            } else {
                return 1; //no paediatric adjustment applies so it is 100%
            }
        };

        var getSPAAdjustment = function(A_SPA, age, facility, SpaAge, SpaAdj, year, mdc) {
            if (A_SPA === true) {
                if (age < 0) {
                    // catch: enter age greater than 0
                    return 0;
                }
                // version 1516

                if (year && year > 2014) {
                //if (year && year > 2015) {
                    var isUnder18 = age < 18;
                    var isMDC19_20 = (mdc.toUpperCase().indexOf('MDC 19') > -1) || (mdc.toUpperCase().indexOf('MDC 20') > -1);
                    var specialistPaed = facility.SpecialistPaed;

                    if (isUnder18 && isMDC19_20 && specialistPaed) {
                        return SpaAdj.SPA_Age_MHDA_AchSpec_YYY;
                    } else if (isUnder18 && isMDC19_20 && !specialistPaed) {
                        return SpaAdj.SPA_Age_MHDA_AchSpec_YYN;
                    } else if (isUnder18 && !isMDC19_20 && !specialistPaed) {
                        return SpaAdj.SPA_Age_MHDA_AchSpec_YNN;
                    } else if (isUnder18 && !isMDC19_20 && specialistPaed) {
                        return SpaAdj.SPA_Age_MHDA_AchSpec_YNY;
                    } else if (!isUnder18 && isMDC19_20 && specialistPaed) {
                        return SpaAdj.SPA_Age_MHDA_AchSpec_NYY;
                    } else if (!isUnder18 && isMDC19_20 && !specialistPaed) {
                        return SpaAdj.SPA_Age_MHDA_AchSpec_NYN;
                    } else if (!isUnder18 && !isMDC19_20 && specialistPaed) {
                        return SpaAdj.SPA_Age_MHDA_AchSpec_NNY;
                    } else if (!isUnder18 && !isMDC19_20 && !specialistPaed) {

                        return SpaAdj.SPA_Age_MHDA_AchSpec_NNN;
                    } else {
                        return 0;
                    }
                } else {
                  // console.log('YEAR ISSUE ', year);
                }

                // version 1415
                if (age < SpaAge.Low) { // <18
                    if (facility.SpecialistPaed === true) {
                        return SpaAdj.Low; //30% for specialist children's hospital
                    } else {
                        return SpaAdj.LowN; //40% for all other hospitals
                    }
                } else if (age < SpaAge.Mid) { // <65
                    return 0; //no specialist psychiatric age applies for 18-64
                } else if (age < SpaAge.High) { // <85
                    return SpaAdj.Mid; //5% for 65-84
                } else {
                    return SpaAdj.High; //9% for 85+
                }
            } else {
                return 0; //no specialist psychiatric age adjustment applies
            }
        };

        var getPPSAdjustment = function(A_PRIVATE, PPSAdjustment) {
            if (A_PRIVATE === true) {
                return PPSAdjustment; //private patient service
            } else {
                return 0; //patient is not private, so no adjustment applies
            }
        };

        //separate function for SNAP due to array of adjustments for care type
        //check care type string to determine care type
        var getSNAPPPSAdjustment = function(A_PRIVATE, PPSAdj, type, year) {
            if (A_PRIVATE === true) {
                if (type.indexOf('GEM') > -1) {
                    //switch (year) {
                    //    case 2014:
                    //        return PPSAdj.GEM;
                    //    case 2015:
                    //        return PPSAdj.GEM;
                    //}
                  return PPSAdj.GEM;
                } else if (type.indexOf('Maintenance') > -1) {
                    //switch (year) {
                    //    case 2014:
                    //        return PPSAdj.Maintenance;
                    //    case 2015:
                    //        return PPSAdj.Maintenance;
                    //}
                  return PPSAdj.Maintenance;
                } else if (type.indexOf('Palliative') > -1) {
                    //switch (year) {
                    //    case 2014:
                    //        return PPSAdj.PalliativeCare;
                    //    case 2015:
                    //        return PPSAdj.PalliativeCare;
                    //}
                  return PPSAdj.PalliativeCare;
                } else if (type.indexOf('Psychogeriatric') > -1) {
                    //switch (year) {
                    //    case 2014:
                    //        return PPSAdj.Psychogeriatric;
                    //    case 2015:
                    //        return PPSAdj.Psychogeriatric;
                    //}
                  return PPSAdj.Psychogeriatric;
                } else if (type.indexOf('Rehabilitation') > -1) {
                    //switch (year) {
                    //    case 2014:
                    //        return PPSAdj.Rehabilitation;
                    //    case 2015:
                    //        return PPSAdj.Rehabilitation;
                    //}
                  return PPSAdj.Rehabilitation;
                } else {
                    //switch (year) {
                    //    case 2014:
                    //        return PPSAdj.OtherAdmitted;
                    //    case 2015:
                    //        return PPSAdj.OtherAdmitted;
                    //}
                  return PPSAdj.OtherAdmitted;
                }
            } else {
                return 0; //patient is not private
            }
        };

        var getRadiotherapyAdjustment = function(A_RT, RadiotherapyAdj) {
            if (A_RT === true) {
                return RadiotherapyAdj; //24% for all admitted patients
            } else {
                return 0; //no radiotherapy addition applies
            }
        };

        var getDialysisAdjustment = function(A_DIA, DialysisAdj, drg) {
            if (A_DIA === true && drg !== "L61Z" && drg !== "L68Z") {
                return DialysisAdj;
            } else {
                return 0; //no dialysis addition applies
            }
        };

		var getEmergencyCareAgeAdjustment = function(age, year, edu) {		// Mark
      //if(_debug) console.log('getEmergencyCareAgeAdjustment ', arguments);

			if (year >= 2016) {
        if(age >= 65 && age <= 79) {
          return edu.ED_65_79;
        } else if (age > 79) {
          return edu.ED_80;
        }
			}
      return 0;
		};

		// TODO: update calcalator to consider if LOS(length of stay) is removed
        var getPriceWeight = function(LOS, SameDayPaymentList, SameDay, LowerBound, Inlier, ShortStayOutlierBase, ShortStayOutlierPerDiem, UpperBound, LongStayOutlierPerDiem, overnight) {
            //four possible cases: same day, short stay, inlier, long stay
            if (LOS <= 0) {
                return 0; //catch: enter a positive non-zero value for LOS
            } else if (LOS <= 1 && SameDayPaymentList && !overnight) {
                //Same day payment list
                return SameDay;
            } else if (LOS < LowerBound) {
                //if the LowerBound is 1, short stay Base and Per diem are null, only inlier applies
                if (LowerBound === 1) {
                    return Inlier;
                } else {
                    //acute, so price weight is sum of 'SS outlier base' and 'Length of Stay' multiplied by 'SS per diem'
                    return ShortStayOutlierBase + (LOS * ShortStayOutlierPerDiem);
                }
            } else if (LOS < UpperBound) {
                //acute, so only inlier applies with no modifications for all inliers
                return Inlier;
            } else {
                //Inlier applies and is summed with 'Length of Stay' multiplied by 'LS per diem'
                if (LongStayOutlierPerDiem !== 0) { //some DRGs have no long stay outlier, in which case use inlier
                    return Inlier + (LongStayOutlierPerDiem * (LOS - UpperBound));
                } else {
                    return Inlier;
                }
            }
        };

        // TODO: update calcalator to consider if LOS(length of stay) is removed
        var getSNAPPriceWeight1415 = function(LOS, overnight, LowerBound, UpperBound, SameDay, ShortStayOutlierPerDiem, InlierPerDiem, LongStayOutlierPerDiem) {
            if (LOS <= 1 && overnight === false && (SameDay && SameDay !== 0)) {
                return SameDay;
            } else if (LowerBound === 0 && InlierPerDiem === 0) {
                return LOS * LongStayOutlierPerDiem;
            } else if (LOS < LowerBound) { //short stay outlier
                //subacute short stay is LOS * outlier per diem
                return LOS * LongStayOutlierPerDiem;
            } else if (LOS < UpperBound) { //inlier (includes same day overnight stays matched with 1 day lowerbound)
                //subacute funding jumps: LOS as opposed to LOS-LowerBound?
                return ShortStayOutlierPerDiem + InlierPerDiem * LOS;
            } else {
                //subacute, cumulative sum
                return ShortStayOutlierPerDiem + InlierPerDiem * UpperBound + (LongStayOutlierPerDiem * (LOS - UpperBound));
            }
        };

        var getSNAPPriceWeight1516 = function(LOS, overnight, SameDay, LowerBound, ShortStayOutlierPerDiem, InlierPerDiem, UpperBound, LongStayOutlierPerDiem, overnightPaed, isPaedSNAP) {
            if (LOS <= 0) {
                return 0; //catch: enter a positive non-zero value for LOS
            } else if ((LOS <= 1 && !overnight && (SameDay && SameDay !== 0)) || (!ShortStayOutlierPerDiem && !InlierPerDiem && !LongStayOutlierPerDiem && !isPaedSNAP) || (LOS <= 1 && !overnight && (SameDay && SameDay !== 0) && isPaedSNAP)) {
                //Same day payment list
                return SameDay;
            } else if (LOS == 1 && overnight && overnightPaed) {
                //If Paed SNAP staying overnight, apply Paed overnight weight
                return overnightPaed;
            } else if (LOS > 1 && overnight && overnightPaed) {
                //If Paed SNAP staying overnight for more than one night, apply Paed overnight weight times LengthOfStay
                return overnightPaed * LOS;
            } else if (LowerBound === 0 && InlierPerDiem === 0) {
                return LOS * LongStayOutlierPerDiem;
            } else if (LOS < LowerBound) {
                //if the LowerBound is 1, short stay Base and Per diem are null, only inlier applies
                if (LowerBound === 1) {
                    return InlierPerDiem;
                } else {
                    //acute, so price weight is sum of 'SS outlier base' and 'Length of Stay' multiplied by 'SS per diem'
                    return LOS * ShortStayOutlierPerDiem;
                }
            } else if (LOS < UpperBound) {
                //acute, so only inlier applies with no modifications for all inliers
                return InlierPerDiem;
            } else {
                //Inlier applies and is summed with 'Length of Stay' multiplied by 'LS per diem'
                if (LongStayOutlierPerDiem && LongStayOutlierPerDiem !== 0) { //some DRGs have no long stay outlier, in which case use inlier
                    return InlierPerDiem + (LongStayOutlierPerDiem * (LOS - UpperBound));
                } else {
                    return InlierPerDiem;
                }
            }
        };

        // TODO: update calcalator to consider if LOS(length of stay) is removed
        var getShortStay = function(LOS, LowerBound, ShortStayOutlierBase, ShortStayOutlierPerDiem) {
            if (LOS < LowerBound) {
                return ShortStayOutlierBase + (LOS * ShortStayOutlierPerDiem);
            } else {
                return 0; //not a short stay
            }
        };

        // TODO: update calcalator to consider if LOS(length of stay) is removed
        var getLongStay = function(LOS, UpperBound, LongStayOutlierPerDiem) {
            if (UpperBound === 0) {
                return 0;
            } // ungrouped care types
            if (LOS > UpperBound) {
                return ((LOS - UpperBound) * LongStayOutlierPerDiem); //for snap its called outlier per diem
            } else {
                return 0; //not a long stay
            }
        };

        return {
            classUnavail: function() {
              $rootScope.$broadcast('cancelUserChange');
              $modal.open({   // Mark
                templateUrl: 'views/class-unavail-modal.html',
                controller: 'DeleteCtrl',
                resolve: {
                  name: function () {
                    return 'what';
                  },
                  type: function () {
                    return 'ever';
                  }
                }
              });
            },

            EDURG: function(adjustments, urg, year) {
             // if(_debug) console.log('EDURG ', arguments);

                var edurgFormula = function(PW, AInd, AEca) {
                  //if(_debug) console.log('edurgFormula AEca: ', arguments);

                  if (year >= 2016) {

                    //return PW * (1 + AInd) * (1 + AEca);	// Mark
                    return (PW * 100 * ((1 + AInd) * (1 + AEca) * 1000)) / 100000;

                  } else {
                    return PW * (1 + AInd);
                  }
                };

                var edurgCalculate = function(edurg, care, SEP) {

                    //console.log('edurgCalculate ', edurg);

                    //setCareAcute(care); //set all the required parameters based on user adjustments and DRG values
                    var result = {}; //nwauCalculation to return
                    result.adjustments = {}; //nwauCalculation includes adjustments, PW and Price
                    var A_IND = getIndAdjustment(adjustments.A_IND, edurg.IndigenousAdj); //Indigenous subacute
                    var PW = care.PriceWeights; //Price Weight

                    var A_ECA = getEmergencyCareAgeAdjustment(adjustments.Age, year, edurg);		// Mark

                    result.nwau = edurgFormula(PW, A_IND, A_ECA);

                    result.price = result.nwau * SEP;

                    // adjustments to plot separately
                    result.adjustments.indigenous = PW * A_IND;
                    result.adjustments.emergcareage = PW * A_ECA;		// Mark

                    result.SEP = SEP;
                    result.PW = PW;

                    // raw adjustment
                    result.A_IND = A_IND;
                    result.A_ECA = A_ECA;		// Mark
                    //if(_debug) console.log('AAAA ', result);
                    return result;
                };

                var self = this;
                // main process starts here (http get needs to contain all processes due to asynchronous nature
                return $q.all([
                        ihpaService.getEDUrg(year),
                        ihpaService.getEDAdjustment(year),
                        ihpaService.getStatePrice()
                    ])
                    .then(function(promises) {
                        var cares = promises[0],
                            edurg = promises[1],
                            statePrices = promises[2];

                        // get the specified DRG from cares and set care object
                        var care = _.find(cares, {
                            URG: urg
                        });

                        if(typeof care === 'undefined') {   // Mark
                          self.classUnavail();
                          throw new Error;
                        }

                        // get the state price given the year
                        var SEP = _.find(statePrices, {
                            Year: year
                        });


                        return edurgCalculate(edurg, care, SEP.SEP);
                    });
            },


            EDUDG: function(adjustments, udg, year) {
                var edudgFormula = function(PW, AInd, AEca) {
                  if(AEca) {
                    return PW * (1 + AInd) * (1 + AEca);	// Mark
                  } else {
                    return PW * (1 + AInd);
                  }
                };

                //Pass values into the acute formula
                var edudgCalculate = function(edudg, care, SEP) {

                 // if(_debug) console.log('edudgCalculate ', adjustments);

                    var result = {}; //nwauCalculation to return
                    result.adjustments = {}; //nwauCalculation includes adjustments, PW and Price

                    //setCareAcute(care); //set all the required parameters based on user adjustments and DRG values
                    var A_IND = getIndAdjustment(adjustments.A_IND, edudg.IndigenousAdj); //Indigenous subacute
                    var PW = care.PriceWeights; //Price Weight

					          var A_ECA = getEmergencyCareAgeAdjustment(adjustments.Age, year, edudg);		// Mark

                    result.nwau = edudgFormula(PW, A_IND, A_ECA);
                    result.price = result.nwau * SEP;

                    // adjustments to plot separately
                    result.adjustments.indigenous = PW * A_IND;
                    result.adjustments.emergcareage = PW * A_ECA;		// Mark
                  //if(_debug) console.log('BBBB ');

                  result.SEP = SEP;
                    result.PW = PW;

                    // raw adjustment
                    result.A_IND = A_IND;
                    result.A_ECA = A_ECA;
                    return result;
                };

                var self = this;
                return $q.all([
                        ihpaService.getEDUdg(year),
                        ihpaService.getEDAdjustment(year),
                        ihpaService.getStatePrice()
                    ])
                    .then(function(promises) {
                        var cares = promises[0],
                            edudg = promises[1],
                            statePrices = promises[2];

                        // get the specified DRG from cares and set care object
                        var care = _.find(cares, {
                            UDG: udg
                        });

                        if(typeof care === 'undefined') {   // Mark
                          self.classUnavail();
                          throw new Error;
                        }

                        // get the state price given the year
                        var SEP = _.find(statePrices, {
                            Year: year
                        });

                        return edudgCalculate(edudg, care, SEP.SEP);
                    });
            },

            NAP: function(adjustments, tier2clinic, year) {
              //if(_debug) console.log('NAP ', arguments);

                var napFormula = function(PW, AInd, ANMC) {
                  //if(_debug) console.log('napFormula ', arguments);

                  //if (ANMC) {
                  if(year < 2016) {
                    //console.log('aaa ');
                    var ans = PW * (1 + AInd + ANMC);
                  } else {
                    //console.log('bbb ');
                    //ans = PW * (1 + AInd) * (1 + ANMC);
                    ans = (PW * 100 * ((1 + AInd) * (1 + ANMC) * 1000)) / 100000;
                  }
                    //} else {
                    //console.log('cccc ');
                    //  ans = (1 + AInd) * PW;
                  //}
                  //if(_debug) console.log('ansansans ', ans);

                  return ans;
                };

                //Pass values into the acute formula
                var napCalculate = function(nap, care, SEP) {
                  var result = {}; //nwauCalculation to return
                  result.adjustments = {}; //nwauCalculation includes adjustments, PW and Price
                  //setCareAcute(care); //set all the required parameters based on user adjustments and DRG values
                  var A_IND = getIndAdjustment(adjustments.A_IND, nap.IndigenousAdj); //Indigenous nap

                  //var A_NMC = getNMCAdjustment(adjustments.A_NMC, nap.MDT); //MDT nap
                  var A_NMC = getNMCAdjustment(adjustments.A_MDT, nap.MDT); //MDT nap
                  //console.log('A_NMC ', A_NMC);

                  //if(_debug) console.log('adjustmentsadjustmentsadjustments ', adjustments);

                  var PW = care.PriceWeights; //Price Weight
                    result.nwau = napFormula(PW, A_IND, A_NMC);
                    result.price = result.nwau * SEP;

                    // adjustments to plot separately
                    //if (year > 2014) {
                    if (year == 2015) {
                        var value = PW * (1 + A_IND + A_NMC);
                        result.adjustments.multidisciplinaryteams = value - (PW * (1 + A_IND)); 
                        } 
                    else if (year == 2016) {
                        var value = PW * (1 + A_IND)
                        result.adjustments.multidisciplinaryteams = (value * (1 + A_NMC)) - value;                    
                    } else {
                        result.adjustments.multidisciplinaryteams = 0;
                    }
                    result.adjustments.indigenous = PW * A_IND;
                    //result.adjustments.emergcareage = PW * A_ECA;		// Mark
                  //if(_debug) console.log('CCCC ');

                  result.PW = PW;
                    result.SEP = SEP;
                    // raw adjustment
                    result.A_IND = A_IND;
                    result.A_NMC = A_NMC;
                    return result;
                };

                var self = this;
                // main process starts here (http get needs to contain all processes due to asynchronous nature
                return $q.all([
                        ihpaService.getNap(year),
                        ihpaService.getNonAdmittedAdjustment(year),
                        ihpaService.getStatePrice()
                    ])
                    .then(function(promises) {
                        var cares = promises[0],
                            nap = promises[1],
                            statePrices = promises[2];

                        // get the specified DRG from cares and set care object
                        var care = _.find(cares, {
                          Tier2Clinic: tier2clinic
                        });

                        if(typeof care === 'undefined') {   // Mark
                          self.classUnavail();
                          throw new Error;
                        }

                        if(!care) {
                          // console.log('_______________tier2clinic ', tier2clinic);
                          //console.log('cares: ', cares);
                        }

                        // get the state price given the year
                        var SEP = _.find(statePrices, {
                          Year: year
                        });

                        return napCalculate(nap, care, SEP.SEP);
                    });
            },

            SNAP: function(adjustments, ansnap, year) {

             // if(_debug) console.log('SNAP ', arguments);

              //Subacute formula
                var subacuteFormula = function(PW, APaed, AInd, AA, APPS, LOS, AAcc) {
                    var work =  ((PW * APaed * (1 + AInd + AA)) - (PW * APPS + LOS * AAcc));
                  //if(_debug) console.log('subacuteFormula ', arguments);

                  work = Math.round( work * 10000000 + 1) / 10000000;   // Mark

                  return work;
                };

                //Pass values into the acute formula
                var subacuteCalculate = function(subacute, care, facility, postcode, SEP) {

                  //console.log('__subacute ', subacute);


                  var result = {}; //nwauCalculation to return
                    result.adjustments = {}; //nwauCalculation includes adjustments, PW and Price

                    //setCareAcute(care); //set all the required parameters based on user adjustments and DRG values
                    var A_A = getRemoteAdjustment(postcode, subacute.RegionAdj); // Remoteness Area adjustments
                    var A_ACC = getACCAdjustment(adjustments.A_PRIVATE, postcode, adjustments.LOS, adjustments.A_OVERNIGHT, subacute.PrivAccAdj); //Private Patient Accommodation
                    var A_IND = getIndAdjustment(adjustments.A_IND, subacute.IndigenousAdj); //Indigenous subacute
                    //var A_PAED = getSNAPPaediatricAdjustment(adjustments.Age, subacute.PaedAge, subacute.PaedAdj); //Paediatric for subacute does not depend on facility


                    var A_PAED = getSNAPPaediatricAdjustment(adjustments.Age, subacute.PaedAge_2014, subacute.Paed_adj_2014); //Paediatric for subacute does not depend on facility
                    var A_PPS = getSNAPPPSAdjustment(adjustments.A_PRIVATE, subacute.PrivSerAdj, care.EpisodeType, year); //subacute Private Patient Services
                    var isUse2014Formula = (care.EpisodeType === 'Rehabilitation' || care.EpisodeType === 'Maintenance') && (care.HealthType === 'Mental Health');
                    //Rehabilitation || Maintenance Mental Health apply 2014 adjustments
                    var isPaedSNAP = (care.ANSNAP === 'Paed-001' || care.ANSNAP === 'Paed-002' || care.ANSNAP === 'Paed-003');
                    //If paed class, use paed sameday or paed overnight
                    var isPaedEligible = (adjustments.Age <= 17);

                    if (isUse2014Formula) {
                     // if(_debug) console.log('___isUse2014Formula ', subacute);

                      A_A = getRemoteAdjustment(postcode, subacute.RegionAdj_2014); // Remoteness Area adjustments
                        A_ACC = getACCAdjustment(adjustments.A_PRIVATE, postcode, adjustments.LOS, adjustments.A_OVERNIGHT, subacute.PrivAccAdj_2014); //Private Patient Accommodation

                        //A_IND = getIndAdjustment(adjustments.A_IND, subacute.IndigenousAdj); //Indigenous subacute
                        A_IND = getIndAdjustment(adjustments.A_IND, subacute.IndigenousAdj_2014); //Indigenous subacute MArk

                        A_PAED = getSNAPPaediatricAdjustment(adjustments.Age, subacute.PaedAge_2014, subacute.Paed_adj_2014); //Paediatric for subacute does not depend on facility
                        A_PPS = getSNAPPPSAdjustment(adjustments.A_PRIVATE, subacute.PrivSerAdj_2014, care.EpisodeType, 2014); //subacute Private Patient Services
                    }

                    if (year < 2015 || isUse2014Formula) {
                        var PW = getSNAPPriceWeight1415(parseFloat(adjustments.LOS), adjustments.A_OVERNIGHT, care.LowerBound, care.UpperBound, care.SameDay, care.ShortStayOutlierPerDiem, care.InlierPerDiem, care.LongStayOutlierPerDiem); //subacute Price Weight
                    } else {
                        var PW = getSNAPPriceWeight1516(parseFloat(adjustments.LOS), adjustments.A_OVERNIGHT, care.SameDay, care.LowerBound, care.ShortStayOutlierPerDiem, care.InlierPerDiem, care.UpperBound, care.LongStayOutlierPerDiem, care.Overnight, isPaedSNAP);
                    }
                    if (year < 2015) {
                        var longStay = getLongStay(adjustments.LOS, care.UpperBound, care.LongStayOutlierPerDiem);
                        var shortStay = getShortStay(adjustments.LOS, care.LowerBound, (adjustments.LOS >= care.LowerBound) * care.ShortStayOutlierPerDiem, care.LongStayOutlierPerDiem);
                    } else {
                        var longStay = getLongStay(adjustments.LOS, care.UpperBound, care.LongStayOutlierPerDiem);
                        var shortStay = getShortStay(adjustments.LOS, care.LowerBound, (adjustments.LOS >= care.LowerBound), care.ShortStayOutlierPerDiem);
                    }
                    //if 2015, then remove APaed i.e. APaed = 1
                    if (year > 2014 && !isUse2014Formula) {
                        A_PAED = 1;
                    }

                    if ((isPaedSNAP && !isPaedEligible) || (isPaedEligible && !isPaedSNAP) && year > 2014) {
                        //if paed class is chosen and not 17 or under or if 17 and under but not paed class, there should be no adjustment for this class  - requirements not met
                        PW = 0;
                        A_PAED = 0;
                        A_IND = 0;
                        A_A = 0;
                        A_PPS = 0;
                        A_ACC = 0;
                        shortStay = 0;
                        longStay = 0;
                    }
                    result.nwau = subacuteFormula(PW, A_PAED, A_IND, A_A, A_PPS, adjustments.LOS, A_ACC);

                    result.price = result.nwau * SEP;
                    // negative price is $0
                    if (result.price <= 0) {
                        result.price = 0;
                    }
                    if (result.nwau < 0) {
                        result.nwau = 0;
                    }

                    //order of calculations by IHPA
                    if (year > 2014 && !isUse2014Formula) {
                        //to remove Apaed from chart
                        result.adjustments.paediatric = 0;
                    } else {
                        result.adjustments.paediatric = PW * A_PAED - PW;
                    }
                    result.adjustments.indigenous = (PW + result.adjustments.paediatric) * A_IND;
                 // if(_debug) console.log('DDDD ');

                  result.adjustments.remoteness = (PW + result.adjustments.paediatric) * A_A;
                    result.adjustments.PPS = -(PW) * A_PPS;
                    result.adjustments.ACC = -A_ACC * adjustments.LOS;
                    result.adjustments.longStay = longStay; // unique plotted data that is a section of PW
                    result.adjustments.shortStay = shortStay; // unique plotted data that is a section of PW
                    result.PW = PW - longStay - shortStay;

                    // adjustments raw without combination wiht other parts of the equation
                    // this illustrates the calculation of NWAU on the equation page
                    // raw values are then illustrated to multiply by eachother in a step-by-step process
                    result.PWactual = PW;
                    result.SEP = SEP;
                    result.A_A = A_A;
                    result.A_ACC = A_ACC;
                    result.A_IND = A_IND;
                    result.A_PAED = A_PAED;
                    result.A_PPS = A_PPS;

                  //if(_debug) console.log('result ', result.nwau);


                  return result;
                };

                // main process starts here (http get needs to contain all processes due to asynchronous nature
                var self = this;
                return $q.all([
                        ihpaService.getSnap(year),
                        ihpaService.getSubacuteAdjustment(year),
                        ihpaService.getFacilities(year),
                        ihpaService.getStatePrice()
                    ])
                    .then(function(promises) {
                        var cares = promises[0],
                            subacute = promises[1],
                            facilities = promises[2],
                            statePrices = promises[3];

                        // get the specified DRG from cares and set care object
                        var care = _.find(cares, {
                            ANSNAP: ansnap
                        });

                        if(typeof care === 'undefined') {   // Mark
                          self.classUnavail();
                          throw new Error;
                        }
                        //debugger;

                        // get the facility data from list of facilities
                        var facility = _.find(facilities, {
                            FacilityID: adjustments.facility
                        });
                        // get the state price given the year
                        var isUse2014Formula = (care.EpisodeType == 'Rehabilitation' || care.EpisodeType == 'Maintenance') && (care.HealthType == 'Mental Health');
                        if (year > 2014 && !isUse2014Formula) {
                            var SEP = _.find(statePrices, {
                                Year: year
                            });
                        } else {
                            year = 2014;
                            var SEP = _.find(statePrices, {
                                Year: year
                            });
                        }
                        return subacuteCalculate(subacute, care, facility, adjustments.region, SEP.SEP);
                    });
            },

            Acute: function(adjustments, drg, year) {

             // if(_debug) console.log('Acute ', arguments);

              if (year < 2014) {
                    adjustments.A_RT = 0;
                }
                if (!adjustments.ICU_HOURS) {
                    adjustments.ICU_HOURS = 0;
                }

                //Acute formula
                var acuteFormula = function(PW, APaed, ASPA, AInd, AA, ART, AICU, ICU_HOURS, APPS, LOS, AAcc, ADia) {
                  //console.log('acuteFormula ', arguments);
                  // if LOS > drg.upper || LOS < drg.lower
                  var work = ((PW * APaed * (1 + ASPA) * (1 + AInd + AA + ART + ADia) + (AICU * ICU_HOURS)) - ((PW + AICU * ICU_HOURS) * APPS + LOS * AAcc));
                  return Math.round(work * 10000000 + 1) / 10000000;    // Mark
                };

                var acuteCalculate = function(acute, care, facility, postcode, SEP, icuEligible) {
                    var result = {}; //nwauCalculation to return
                    result.adjustments = {}; //nwauCalculation includes adjustments, PW and Price

                    // length of stay normally calculated withou inclusion of ICU hours, minimum 1
                    var LOSminusICU;
                    if (care.BundledICU) {
                        LOSminusICU = adjustments.LOS;
                    } else {
                        LOSminusICU = Math.max(1, adjustments.LOS - Math.floor(adjustments.ICU_HOURS / 24));
                    }

                    //setCareAcute(care); //set all the required parameters based on user adjustments and DRG values
                    var A_A = getRemoteAdjustment(postcode, acute.RegionAdj); // Remoteness Area adjustments
                    var A_ACC = getACCAdjustment(adjustments.A_PRIVATE, postcode, adjustments.LOS, adjustments.A_OVERNIGHT, acute.PrivAccAdj); //Private Patient Accommodation
                    var A_ICU = icuEligible ? getICUAdjustment(care.BundledICU, acute.ICUHourlyRate) : 0; //ICU adjustment per hour spent in ICU
                    var A_IND = getIndAdjustment(adjustments.A_IND, acute.IndigenousAdj); //Indigenous acute
                    var A_PAED = getPaediatricAdjustment(adjustments.Age, facility, acute.PaedAge, care.PaediatricAdjustment); //Paediatric
                    var A_SPA = getSPAAdjustment(adjustments.A_SPA, adjustments.Age, facility, acute.SPAAge, acute.SPAAdj, year, adjustments.MDC); //Specialist Psychiatric Age
                    var A_PPS = getPPSAdjustment(adjustments.A_PRIVATE, care.PrivatePatientServiceAdjustment); //Private Patient Services
                    var A_RT = getRadiotherapyAdjustment(adjustments.A_RT, acute.RadiotherapyAdj); //Radiotherapy Treatment
                    var A_DIA = year <= 2014 ? 0 : getDialysisAdjustment(adjustments.A_DIA, acute.Dialysis, drg); //Dialysis
                    var PW = getPriceWeight(LOSminusICU, care.SameDayPaymentList, care.SameDay, care.LowerBound, care.Inlier, care.ShortStayOutlierBase, care.ShortStayOutlierPerDiem, care.UpperBound, care.LongStayOutlierPerDiem, adjustments.A_OVERNIGHT); //Price Weight

                    var longStay = getLongStay(LOSminusICU, care.UpperBound, care.LongStayOutlierPerDiem); // return proportion of long stay
                    var shortStay = getShortStay(LOSminusICU, care.LowerBound, care.ShortStayOutlierBase, care.ShortStayOutlierPerDiem);

                  //console.log('STAYS ', longStay, shortStay);

                  result.nwau = acuteFormula(PW, A_PAED, A_SPA, A_IND, A_A, A_RT, A_ICU, adjustments.ICU_HOURS, A_PPS, adjustments.LOS, A_ACC, A_DIA);
                    result.price = result.nwau * SEP;
                    // negative nwau/price is $0
                    if (result.price < 0) {
                        result.price = 0;
                    }
                    if (result.nwau < 0) {
                        result.nwau = 0;
                    }

                    // adjustments to plot separately, plot by progression of the tech spec calculator
                    // the calculator should return the NWAU related to each adjustment
                    // which is total dollars adjusted divided by price weight
                    // return $$$/PW

                    //order of calculations by IHPA
                    result.adjustments.paediatric = PW * A_PAED - PW;
                    result.adjustments.psychiatric = (PW + result.adjustments.paediatric) * A_SPA;
                    result.adjustments.indigenous = (PW + result.adjustments.paediatric + result.adjustments.psychiatric) * A_IND;

                    result.adjustments.remoteness = (PW + result.adjustments.paediatric + result.adjustments.psychiatric) * A_A;
                    result.adjustments.radiotherapy = (PW + result.adjustments.paediatric + result.adjustments.psychiatric) * A_RT;
                    if (year > 2014) {
                        result.adjustments.dialysis = (PW + result.adjustments.paediatric + result.adjustments.psychiatric) * A_DIA;
                    }
                    result.adjustments.ICU = A_ICU * adjustments.ICU_HOURS;
                    result.adjustments.PPS = -(PW + result.adjustments.ICU) * A_PPS;
                    result.adjustments.ACC = -A_ACC * adjustments.LOS;
                    result.adjustments.longStay = longStay; // unique plotted data that is a section of PW
                    result.adjustments.shortStay = shortStay; // unique plotted data that is a section of PW

                    // Break Price Weight up into long stay and short stay elements if applicable.
                    if (adjustments.A_OVERNIGHT) {
                        result.PW = PW - longStay - shortStay;
                    } else {
                        result.adjustments.shortStay = 0;
                        result.PW = PW;
                    }

                    // adjustments raw without combination with other parts of the equation
                    // this illustrates the calculation of NWAU on the equation page
                    // raw values are then illustrated to multiply by each other in a step-by-step process
                    result.PWactual = PW;
                    result.SEP = SEP;
                    result.A_A = A_A;
                    result.A_ACC = A_ACC;
                    result.A_ICU = A_ICU;
                    result.A_IND = A_IND;
                    result.A_PAED = A_PAED;
                    result.A_SPA = A_SPA;
                    result.A_PPS = A_PPS;
                    result.A_RT = A_RT;
                    result.A_DIA = A_DIA;

                    //if(_debug) console.log('EEEE ', result);

                    return result;
                };

                var self = this;
                // main process starts here (http get needs to contain all processes due to asynchronous nature
                return $q.all([
                        ihpaService.getAcute(year),
                        ihpaService.getAcuteAdjustment(year),
                        ihpaService.getFacilities(year),
                        ihpaService.getStatePrice(),
                        ihpaService.isIcuEligible(adjustments.facility, year)
                    ])
                    .then(function(promises) {
                        var cares = promises[0],
                            acute = promises[1],
                            facilities = promises[2],
                            statePrices = promises[3],
                            icuEligible = promises[4];

                        // get the specified DRG from cares and set care object
                        var care = _.find(cares, {
                            DRG: drg
                        });

                        if(typeof care === 'undefined') {   // Mark
                          self.classUnavail();
                          throw new Error;
                        }

                        //debugger;
                        // get the facility data from list of facilities
                        var facility = _.find(facilities, {
                            FacilityID: adjustments.facility
                        });
                        // get the state price given the year
                        var SEP = _.find(statePrices, {
                            Year: year
                        });
                        return acuteCalculate(acute, care, facility, adjustments.region, SEP.SEP, icuEligible);
                    });
            }
        };
    }
]);
