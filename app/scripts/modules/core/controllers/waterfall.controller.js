angular.module('nwauCalculatorApp')
    .controller('WaterfallCtrl', ['$scope',
        function($scope) {
            'use strict';

            var x1 = d3.scale.ordinal();
            var y;
            var x0;

            function initialiseBarChart(container) {
                var dummyData = [''];
                var state = container.selectAll('.state')
                    .data($scope.data)
                    .enter()
                    .append('g');

                state.selectAll('rect')
                    .data(dummyData)
                    .enter().append('rect');

            }

            var convertDataToPlot = function(data) {
                var total = 0;
                var totals = {};
                var SumOfPositive = 0;
                for (var i = 0; i < data.length; i++) {
                    if (data[i].value < 0) {
                        if ((total + data[i].value) < 0) {
                            data[i].value = -total;
                        }
                        total = total + data[i].value;
                        totals[data[i].caption] = total;
                    } else {
                        if (i === data.length - 1) {
                            total = total + data[i].value;
                            totals[data[i].caption] = total;
                        } else {
                            totals[data[i].caption] = total;
                            total += data[i].value;
                            SumOfPositive += data[i].value;
                        }
                    }

                }

                //then map category name, value, and starting height to each observation
                data.formatted = data.map(function(d, i) {
                    return {
                        name: data[i].caption,
                        value: data[i].value,
                        baseHeight: totals[data[i].caption],
                        id: i,
                        SumOfPositive: SumOfPositive,
                        colour: data[i].colour
                    };
                });

                return data;
            };

            var setXdomain = function(domain) {
                x0.domain(domain.formatted.map(function(d) {
                    return (d.name);
                }));
                x1.domain(domain).rangeRoundBands([0, x0.rangeBand()]);

            };

            var setXdomainbyID = function(domain) {
                x0.domain(domain.formatted.map(function(d) {
                    return (d.id);
                }));
                x1.domain(domain).rangeRoundBands([0, x0.rangeBand()]);

            };

            var setXdomainAsGroupedAdjustments = function(domain, data) {
                x0.domain(domain.map(function(d) {
                    return (d);
                }));
                x1.domain(data).rangeRoundBands([0, x0.rangeBand()]);
            };

            var setYdomain = function(domain, GraphType) {
              //console.log('setYdomain ', arguments);

              y.domain([0, d3.max(domain.formatted, function(d) {
                    var scale = 0.001;
                    var magnitude = 0;
                    var Ymax;

                    switch (GraphType) {
                        case 'waterfall':
                            Ymax = d.SumOfPositive;
                            break;
                        case 'stackedbar':
                            Ymax = d.SumOfPositive;
                            break;
                        case 'bar':
                            Ymax = d.value;
                            break;
                        case 'horizontalbar':
                            Ymax = d.value;
                            break;
                    }
                    //work out the highest scale multiplying base 10 with 0.001 until a range higher than the Ymax is found
                    for (var i = 1; scale < Ymax; i++) {
                        if (scale * Math.pow(10, i) > Ymax) {
                            scale = 0.001 * Math.pow(10, i - 1);
                        }
                        magnitude = i;

                    }
                    //get the scale to be within 0.001% of Ymax
                    while (scale > (Ymax + scale * 0.001)) {
                        scale = scale - 0.0001 * Math.pow(10, magnitude - 1);
                    }
                    scale = scale + 0.0001 * Math.pow(10, magnitude - 1);

                    return scale;

                })]);
            };

            var clearAxes = function(container) {
                container.select('.y.axis')
                    .remove();
                container.select('.x.axis')
                    .remove();
            };

            var updateWaterfallChart = function(container, data) {
                var plotData = convertDataToPlot(data);

                clearGraph(container, plotData.formatted);

                initialiseBarChart(container);

                setXdomain(plotData);
                setYdomain(plotData, 'waterfall');

                drawXaxis(container, y(0), x0, 'waterfall');
                drawYaxis(container, 0, y, 'waterfall');

                container.selectAll('rect')
                    .data(plotData.formatted)
                    .style('stroke', 'black')
                    .style('stroke-width', '2')
                    .attr('width', x0.rangeBand())
                    .attr('x', function(d) {
                        return x1(d.name);
                    })
                    .transition()
                    .attr('height', function(d) {
                        return y(0) - y(Math.abs(d.value));
                    })
                    .attr('y', function(d) {
                        if (d.name === 'Total') {
                            return y(d.baseHeight - Math.abs(d.value) - container.select('rect').attr('stroke-width'));
                        } else {
                            return y(Math.abs(d.value) + d.baseHeight - container.select('rect').attr('stroke-width'));
                        }
                    })
                    .duration(500)
                    .style('fill', function(d) {
                        return d.colour;
                    })
                    .attr('transform', function(d) {
                        return 'translate(' + x0(d.name) + ',0)';
                    });

            };

            var updateStackedChart = function(container, data) {
                if (data === undefined) {
                    return;
                }
                var plotData = convertDataToPlot(data);
                var adj = [' ', '  ', '   '];

                container.selectAll('g')
                    .data(plotData.formatted).exit().remove();
                clearAxes(container);

                initialiseBarChart(container);

                setXdomainAsGroupedAdjustments(adj, plotData);
                setYdomain(plotData, 'stackedbar');

                drawXaxis(container, y(0), x0, 'stackedbar');
                drawYaxis(container, 0, y, 'stackedbar');

                container.selectAll('g .x.axis .tick')
                    .remove();

                container.selectAll('rect')
                    .data(plotData.formatted)
                    .style('stroke', 'black')
                    .style('stroke-width', '2')
                    .attr('width', x1.rangeBand())
                    .attr('x', function(d) {
                        if (d.name === 'Total') {
                            return x0(adj[2]);
                        } else if (d.value >= 0) {
                            return x0(adj[0]);
                        } else {
                            return x0(adj[1]);
                        }
                    })
                    .attr('height', function(d) {
                        return Math.abs(y(0) - y(Math.abs(d.value)));
                    })
                    .attr('y', function(d) {
                        if (d.name === 'Total') {
                            return y(d.baseHeight - Math.abs(d.value) - container.select('rect').attr('stroke-width'));
                        } else {
                            return y(Math.abs(d.value) + d.baseHeight - container.select('rect').attr('stroke-width'));
                        }
                    })
                    .style('fill', function(d) {
                        return d.colour;
                    });

            };

            var setupYaxis = function(scale, graphType) {
                var yAxis;

                switch (graphType) {
                    case 'waterfall':
                        yAxis = d3.svg.axis()
                            .scale(scale)
                            .orient('left')
                            .tickFormat(d3.format('.2f'));
                        break;
                    case 'horizontalbar':
                        yAxis = d3.svg.axis()
                            .scale(scale)
                            .orient('top')
                            .ticks(4)
                            .tickFormat(d3.format('.2f'));
                        break;
                    case 'line':
                        yAxis = d3.svg.axis()
                            .scale(scale)
                            .orient('left')
                            .tickFormat(d3.format('.1f'));
                        break;
                    case 'stackedbar':
                        yAxis = d3.svg.axis()
                            .scale(scale)
                            .orient('left')
                            .ticks(5)
                            .tickFormat(d3.format('.2f'));
                        break;
                    case 'bar':
                        yAxis = d3.svg.axis()
                            .scale(scale)
                            .orient('left')
                            .ticks(5)
                            .tickFormat(d3.format('.2f'));
                        break;
                    default:
                        yAxis = d3.svg.axis()
                            .scale(scale)
                            .orient('left')
                            .tickFormat(d3.format('.1f'));
                }
                return yAxis;
            };

            var drawYaxis = function(container, location, scale, graphType) {
                var yAxis = setupYaxis(scale, graphType);

                container.append('g')
                    .attr('class', 'y axis')
                    .call(yAxis)
                    .append('text')
                    .style('text-anchor', 'end')
                    .text('NWAU')
                    .attr('x', function() {
                        if (graphType === 'horizontalbar') {
                            return location + 65;
                        } else {
                            return 0;
                        }
                    })
                    .attr('y', function() {
                        if (graphType === 'horizontalbar') {
                            return 5;
                        } else {
                            return -15;
                        }
                    });

            };

            var drawXaxis = function(container, location, scale, graphType) {
                var xAxis;
                if (graphType === 'horizontalbar') {
                    xAxis = d3.svg.axis()
                        .scale(scale)
                        .orient('left');
                } else {
                    xAxis = d3.svg.axis()
                        .scale(scale)
                        .orient('bottom');
                }

                container.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', function() {
                        if (graphType === 'horizontalbar') {
                            return 'translate(0,' + 0 + ')';
                        } else {
                            return 'translate(0,' + location + ')';
                        }
                    })
                    .call(xAxis)
                    .selectAll('text')
                    .style('text-anchor', function() {
                        if (graphType === 'bar') {
                            return 'middle';
                        } else {
                            return 'end';
                        }
                    })
                    .attr('dy', function() {
                        if (graphType === 'waterfall') {
                            return '0.8em';
                        } else if (graphType === 'bar') {
                            return '-0.3em';
                        } else {
                            return '0em';
                        }
                    })
                    .attr('dx', function() {
                        if (graphType === 'bar') {
                            return '-2.4em';
                        } else {
                            return '0em';
                        }
                    })
                    .attr('transform', function() {
                        if (graphType === 'waterfall') {
                            return 'rotate(-30)';
                        } else if (graphType === 'bar') {
                            return 'rotate(-90)';
                        } else {
                            return 'rotate(' + 0 + ')';
                        }
                    });

            };

            var convertDataToPlotLine = function(data) {
                //then map category name, value, and starting height to each observation
                data.formatted = data.map(function(d, i) {
                    return {
                        day: data[i].day,
                        nwau: data[i].nwau,
                        average: data[0].average
                    };
                });

                return data;
            };

            var removeAllLines = function(container) {
                clearAxes(container);

                container.select('#private').remove();
                container.select('#normal').remove();
                container.select('#nationalaverage').remove();
                container.select('#stateaverage').remove();
                container.selectAll('text').remove();
            };

            var getLengthOfStayAverage = function(data) {
                var averageExists = {
                    national: 0,
                    state: 0
                };

                if ((data[0].average.national) !== undefined) {
                    averageExists.national = data[0].average.national;
                }
                if ((data[0].average.state) !== undefined) {
                    averageExists.state = data[0].average.state;
                }

                return averageExists;

            };

            var getMaxValue = function(data1, data2) {
                var MaxValueOnYaxis;
                var MaxValueOnYaxisDataset1 = d3.max(data1, function(d) {
                    return d.nwau;
                });

                var MaxValueOnYaxisDataset2 = d3.max(data2, function(d) {
                    return d.nwau;
                });

                if (MaxValueOnYaxisDataset1 > MaxValueOnYaxisDataset2) {
                    MaxValueOnYaxis = MaxValueOnYaxisDataset1;
                } else {
                    MaxValueOnYaxis = MaxValueOnYaxisDataset2;
                }

                return MaxValueOnYaxis;
            };

            var getTicks = function(data) {
                var ticks = [];
                for (var i = 0; i < data.length; i++) {
                    ticks[i] = Math.ceil(data[i].day);

                }
                ticks = _.uniq(ticks, true); //removes duplicate data
                return ticks;
            };

            var drawXaxisWithTicks = function(container, x0, ticks, heightOfGraph) {
                var xAxis = d3.svg.axis().scale(x0)
                    .tickSize(-heightOfGraph)
                    .tickValues(ticks);

                container.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + heightOfGraph + ')')
                    .call(xAxis);

                container.selectAll('.x.axis .tick line')
                    .style('stroke-dasharray', ('5, 3'));
            };

            var updateLineChart = function(container, losData, privlosData) {
                if (losData.length === 0 || privlosData.length === 0) {
                    return;
                }

                var plotData = convertDataToPlotLine(losData);
                var plotData2 = convertDataToPlotLine(privlosData);
                var MaxValueOnYaxis = getMaxValue(plotData.formatted, plotData2.formatted);
                var losAverage = getLengthOfStayAverage(losData);
                var averageValues = [];

                var MaxValueOnXaxis = d3.max(plotData.formatted, function(d) {
                    return (d.day);
                });

                x0.domain([0, MaxValueOnXaxis]);
                y.domain([0, MaxValueOnYaxis]);

                var ticks = getTicks(losData);

                removeAllLines(container);

                drawXaxisWithTicks(container, x0, ticks, y(0));

                drawYaxis(container, 0, y, false);

                var lineFunction = d3.svg.line()
                    .x(function(d) {
                        return x0(d.day);
                    })
                    .y(function(d) {
                        return y(0) - (y(MaxValueOnYaxis - Math.abs(d.nwau)));
                    })
                    .interpolate('linear');

                var averageLengthofStay = d3.svg.line()
                    .x(function(d) {
                        return x0(d);
                    })
                    .y(function(d, i) {
                        if (i === 0) {
                            return y(0);
                        } else {
                            return y(MaxValueOnYaxis);
                        }
                    })
                    .interpolate('linear');

                if (losData[1].nwau !== 0) {
                    container.append('path')
                        .attr('id', 'normal')
                        .attr('d', lineFunction(plotData.formatted))
                        .attr('stroke', 'blue')
                        .attr('stroke-width', 2)
                        .attr('fill', 'none');
                }

                if (losData[2].nwau !== 0) {
                    container.append('path')
                        .attr('id', 'private')
                        .attr('d', lineFunction(plotData2.formatted))
                        .attr('stroke', 'red')
                        .attr('stroke-width', 2)
                        .attr('fill', 'none');
                }

                if (losAverage.national > 0 && losData[1].nwau !== 0) {
                    averageValues.push(losAverage.national);
                    averageValues.push(losAverage.national);
                    container.append('path')
                        .attr('id', 'nationalaverage')
                        .attr('d', averageLengthofStay(averageValues))
                        .attr('stroke', 'orange')
                        .attr('stroke-width', 2)
                        .attr('fill', 'none');

                    if (losAverage.national !== ticks[1]) {
                        container.data(plotData.formatted)
                            .append('text')
                            .text(function(d) {
                                return d.average.national;
                            })
                            .attr('x', function(d) {
                                return x0(d.average.national);
                            })
                            .attr('dx', '-0.8em')
                            .attr('y', y(0) + 13);
                    }
                }

                if (losAverage.state > 0 && losData[1].nwau !== 0) {
                    averageValues = [];
                    averageValues.push(losAverage.state);
                    averageValues.push(losAverage.state);
                    container.append('path')
                        .attr('id', 'stateaverage')
                        .attr('d', averageLengthofStay(averageValues))
                        .attr('stroke', 'purple')
                        .attr('stroke-width', 2)
                        .attr('fill', 'none');

                    if (losAverage.state !== ticks[1]) {
                        container.data(plotData.formatted)
                            .append('text')
                            .text(function(d) {
                                return d.average.state;
                            })
                            .attr('x', function(d) {
                                return x0(d.average.state);
                            })
                            .attr('dx', '-0.8em')
                            .attr('y', y(0) + 13);
                    }
                }

                if (losData[1].day !== 0 && losData[1].day !== 149.99 && losData[1].nwau !== 0) {
                    container.select('g .y.axis')
                        .append('text')
                        .style('text-anchor', 'middle')
                        .text('Lower Bound')
                        .attr('x', x0(ticks[1]) + 5)
                        .attr('y', y(MaxValueOnYaxis))
                        .attr('dy', '-1.1em');

                    container.select('g .y.axis')
                        .append('text')
                        .style('text-anchor', 'middle')
                        .text('Short Stay')
                        .attr('x', x0(ticks[1]) / 2)
                        .attr('y', y(MaxValueOnYaxis / 2) - 100);
                }

                if (_.last(losData).day !== 150 && losData[1].nwau !== 0) {
                    container.select('g .y.axis')
                        .append('text')
                        .style('text-anchor', 'middle')
                        .text('Upper Bound')
                        .attr('x', x0(ticks[2]) + 5)
                        .attr('y', y(MaxValueOnYaxis))
                        .attr('dy', '-1.1em');

                    container.select('g .y.axis')
                        .append('text')
                        .style('text-anchor', 'middle')
                        .text('Outlier')
                        .attr('x', x0(ticks[3] + ticks[2]) / 2)
                        .attr('y', y(MaxValueOnYaxis / 2) + 100);
                }

                if (losData[2].day !== 150 && losData[2].nwau !== 0) {
                    var inlierPosition = (ticks[2] + ticks[1]) / 2;
                    if (!inlierPosition) {
                        inlierPosition = 50;
                    }
                    container.select('g .y.axis')
                        .append('text')
                        .style('text-anchor', 'middle')
                        .text('Inlier')
                        .attr('x', x0(inlierPosition))
                        .attr('y', y(MaxValueOnYaxis / 2) + 30);
                }
                container.select('g .x.axis')
                    .append('text')
                    .style('text-anchor', 'start')
                    .text('Days')
                    .attr('x', x0(MaxValueOnXaxis) + 5);

            };

            var updateBarChart = function(container, data) {
                var plotData = convertDataToPlot(data);

                clearGraph(container, plotData.formatted);

                initialiseBarChart(container);

                setXdomainbyID(plotData);
                setYdomain(plotData, 'bar');

                drawXaxis(container, y(0), x0, 'bar');
                drawYaxis(container, 0, y, 'bar');

                container.selectAll('rect')
                    .data(plotData.formatted)
                    .style('stroke', 'black')
                    .style('stroke-width', '2')
                    .attr('width', x0.rangeBand())
                    .attr('x', function(d, i) {
                        return x1(i);
                    })
                    .transition()
                    .attr('height', function(d) {
                        return y(0) - y(Math.abs(d.value));
                    })
                    .attr('y', function(d) {
                        return y(Math.abs(d.value) - container.select('rect').attr('stroke-width'));
                    })
                    .duration(250)
                    .style('fill', function(d) {
                        return d.colour;
                    })
                    .attr('transform', function(d, i) {
                        return 'translate(' + x0(i) + ' ,' + 0 + ')';
                    });

                replaceIDOnXaxisWithName(container, plotData.formatted);

            };
            //return name from unique id
            var replaceIDOnXaxisWithName = function(container, data) {
                container.selectAll('g .x.axis text')
                    .data(data)
                    .text(function(d) {
                        return d.name;
                    });
            };

            var clearGraph = function(container, data) {
                container.selectAll('g')
                    .data(data).exit().remove();
                container.select('g .x.axis')
                    .remove();
                container.select('g .y.axis')
                    .remove();
            };

            function scaleAndUpdateChart() {
                var elementToResize = d3.select('#' + $scope.containerId).select('g');
                var selectedElement = $('#' + $scope.containerId);

                switch ($scope.type) {
                    case 'stackedbar':
                        x0 = d3.scale.ordinal()
                            .rangeRoundBands([0, selectedElement.width()], 0, 0.1);
                        y = d3.scale.linear()
                            .range([selectedElement.height() / 1.1, 0]);
                        updateStackedChart(elementToResize, $scope.data);
                        break;
                    case 'bar':
                        x0 = d3.scale.ordinal()
                            .rangeRoundBands([0, selectedElement.width()], 0, 0.1);
                        y = d3.scale.linear()
                            .range([selectedElement.height(), 0]);
                        updateBarChart(elementToResize, $scope.data);
                        break;
                }
            }

            $scope.$on('$stateChangeSuccess', function() {
                if ($scope.type === 'waterfall') {
                    x0 = d3.scale.ordinal()
                        .rangeRoundBands([0, $('#' + $scope.containerId).width() * 1.1], 0, 0.1);
                    y = d3.scale.linear()
                        .range([$('#' + $scope.containerId).height(), 0]);
                } else if ($scope.type === 'line') {
                    x0 = d3.scale.linear()
                        .range([0, $('#' + $scope.containerId).width() * 1.1]);
                    y = d3.scale.linear()
                        .range([$('#' + $scope.containerId).height(), 0]);
                }

            });

            $scope.$watchCollection('data', function() {
                var graphicContainer = d3.select('#' + $scope.containerId);
                if ($scope.data === undefined) {
                    return;
                }
                if ($scope.type === 'waterfall') {
                    updateWaterfallChart(graphicContainer.select('g'), $scope.data);
                } else if ($scope.type === 'line') {
                    updateLineChart(graphicContainer.select('g'), $scope.data, $scope.privData);
                } else {
                    scaleAndUpdateChart();
                }

            });

            d3.select(window).on('ScaleAndUpdateChart', scaleAndUpdateChart);
        }
    ]);
