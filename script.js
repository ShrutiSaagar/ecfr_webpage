document.addEventListener('DOMContentLoaded', () => {
    const dataUrl = 'data.json';
    const titleFilter = d3.select('#title-filter');
    const wordFilter = d3.select('#word-filter');
    const titleList = d3.select('#title-list');
    const wordList = d3.select('#word-list');
    const selectedTitlesDiv = d3.select('#selected-titles');
    const selectedWordsDiv = d3.select('#selected-words');
    const timeSeriesChartDiv = d3.select('#time-series-chart');
    const topWordsChartDiv = d3.select('#top-words-chart');
    const stackedAreaChartDiv = d3.select('#stacked-area-chart');
    const tooltipDiv = d3.select('#chart-tooltip');
    const resetButton = d3.select('#reset-button');

    let allData = [];
    let allTitles = [];
    let allWords = [];
    let selectedTitles = ['all'];
    let selectedWords = [];
    let filteredTitles = [];
    let filteredWords = [];

    // --- Helper Functions ---
    const getTitles = (data) => [...new Set(data.map(d => d.title))].sort();
    const getAllWords = (data) => {
        const words = new Set();
        data.forEach(item => {
            Object.keys(item.wordFrequencies).forEach(word => words.add(word));
        });
        return Array.from(words).sort();
    };

    const filterData = () => {
        let filteredData = allData;
        if (!selectedTitles.includes('all')) {
            filteredData = filteredData.filter(d => selectedTitles.includes(d.title));
        }
        return filteredData;
    };

    const updateTitleList = () => {
        const filterValue = titleFilter.property('value').toLowerCase();
        filteredTitles = ['all', ...allTitles].filter(title => 
            title.toLowerCase().includes(filterValue)
        );

        const items = titleList.selectAll('.filter-item')
            .data(filteredTitles, d => d);

        items.exit().remove();

        const newItems = items.enter()
            .append('div')
            .attr('class', 'filter-item');

        items.merge(newItems)
            .classed('selected', d => selectedTitles.includes(d))
            .text(d => d === 'all' ? 'All Titles' : d)
            .on('click', (event, d) => {
                if (d === 'all') {
                    selectedTitles = ['all'];
                } else {
                    const index = selectedTitles.indexOf(d);
                    if (index === -1) {
                        if (selectedTitles.includes('all')) {
                            selectedTitles = [d];
                        } else {
                            selectedTitles.push(d);
                        }
                    } else {
                        selectedTitles.splice(index, 1);
                        if (selectedTitles.length === 0) {
                            selectedTitles = ['all'];
                        }
                    }
                }
                updateSelectedTitles();
                updateCharts();
            });
    };

    const updateWordList = () => {
        const filterValue = wordFilter.property('value').toLowerCase();
        filteredWords = allWords.filter(word => 
            word.toLowerCase().includes(filterValue)
        );

        const items = wordList.selectAll('.filter-item')
            .data(filteredWords, d => d);

        items.exit().remove();

        const newItems = items.enter()
            .append('div')
            .attr('class', 'filter-item');

        items.merge(newItems)
            .classed('selected', d => selectedWords.includes(d))
            .text(d => d)
            .on('click', (event, d) => {
                const index = selectedWords.indexOf(d);
                if (index === -1) {
                    if (selectedWords.length < 10) {
                        selectedWords.push(d);
                    }
                } else {
                    selectedWords.splice(index, 1);
                }
                updateSelectedWords();
                updateCharts();
            });
    };

    const updateSelectedTitles = () => {
        const tags = selectedTitlesDiv.selectAll('.selected-tag')
            .data(selectedTitles, d => d);

        tags.exit().remove();

        const newTags = tags.enter()
            .append('div')
            .attr('class', 'selected-tag');

        newTags.append('span')
            .attr('class', 'tag-text');
        newTags.append('span')
            .attr('class', 'remove-tag')
            .text('×');

        tags.merge(newTags)
            .select('.tag-text')
            .text(d => d === 'all' ? 'All Titles' : d);

        tags.merge(newTags)
            .select('.remove-tag')
            .on('click', (event, d) => {
                const index = selectedTitles.indexOf(d);
                if (index !== -1) {
                    selectedTitles.splice(index, 1);
                    if (selectedTitles.length === 0) {
                        selectedTitles = ['all'];
                    }
                    updateTitleList();
                    updateSelectedTitles();
                    updateCharts();
                }
            });
    };

    const updateSelectedWords = () => {
        const tags = selectedWordsDiv.selectAll('.selected-tag')
            .data(selectedWords, d => d);

        tags.exit().remove();

        const newTags = tags.enter()
            .append('div')
            .attr('class', 'selected-tag');

        newTags.append('span')
            .attr('class', 'tag-text');
        newTags.append('span')
            .attr('class', 'remove-tag')
            .text('×');

        tags.merge(newTags)
            .select('.tag-text')
            .text(d => d);

        tags.merge(newTags)
            .select('.remove-tag')
            .on('click', (event, d) => {
                const index = selectedWords.indexOf(d);
                if (index !== -1) {
                    selectedWords.splice(index, 1);
                    updateWordList();
                    updateSelectedWords();
                    updateCharts();
                }
            });
    };

    // --- Chart Functions ---
    const createTimeSeriesChart = (data, wordsToShow) => {
        timeSeriesChartDiv.selectAll('*').remove();

        if (!data || data.length === 0 || wordsToShow.length === 0) {
            timeSeriesChartDiv.append('text').text("No data to display for selected options.");
            return;
        }

        const margin = { top: 20, right: 150, bottom: 80, left: 70 };
        const width = timeSeriesChartDiv.node().getBoundingClientRect().width - margin.left - margin.right - 10;
        const height = 500 - margin.top - margin.bottom;

        const svg = timeSeriesChartDiv.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.versionDate)))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => wordsToShow.reduce((maxFreq, word) => Math.max(maxFreq, d.wordFrequencies[word] || 0), 0))])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");
        svg.append('g')
            .call(d3.axisLeft(y));

        wordsToShow.forEach((word, index) => {
            const sortedDataForWord = data
                .sort((a, b) => new Date(a.versionDate) - new Date(b.versionDate))
                .filter(d => d.wordFrequencies[word] !== undefined);

            const line = d3.line()
                .x(d => x(new Date(d.versionDate)))
                .y(d => y(d.wordFrequencies[word]))
                .curve(d3.curveMonotoneX); // Add curve interpolation

            svg.append('path')
                .datum(sortedDataForWord)
                .attr('fill', 'none')
                .attr('stroke', d3.schemeCategory10[index % 10])
                .attr('stroke-width', 1.5)
                .attr('d', line);

            // Add circles for data points
            svg.selectAll(`.data-point-${index}`)
                .data(sortedDataForWord)
                .enter().append('circle')
                .attr('class', `data-point-${index}`)
                .attr('cx', d => x(new Date(d.versionDate)))
                .attr('cy', d => y(d.wordFrequencies[word]))
                .attr('r', 3)
                .attr('fill', d3.schemeCategory10[index % 10])
                .on('mouseover', (event, d) => {
                    const [mouseX, mouseY] = d3.pointer(event);
                    tooltipDiv.transition().duration(200).style('opacity', .9);
                    tooltipDiv.html(`${word}: ${d.wordFrequencies[word]}`)
                              .style('left', (mouseX + 10) + 'px')
                              .style('top', (mouseY - 15) + 'px');
                })
                .on('mouseout', () => {
                    tooltipDiv.transition().duration(500).style('opacity', 0);
                })
                .on('click', () => {
                    const index = selectedWords.indexOf(word);
                    if (index !== -1) {
                        selectedWords.splice(index, 1);
                        updateWordList();
                        updateSelectedWords();
                        updateCharts();
                    }
                });
        });

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 5)
            .style('text-anchor', 'middle')
            .text('Version Date');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Word Frequency');

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width + 20}, 0)`);

        wordsToShow.forEach((word, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 16})`);

            legendRow.append('rect')
                .attr('width', 8)
                .attr('height', 8)
                .attr('fill', d3.schemeCategory10[i % 10]);

            legendRow.append('text')
                .attr('x', 12)
                .attr('y', 8)
                .attr('font-size', '11px')
                .text(word);
        });
    };

    const createTopWordsChart = (data) => {
        topWordsChartDiv.selectAll('*').remove(); // Clear previous chart

        if (!data || data.length === 0) {
            topWordsChartDiv.append('text').text("No data to display for selected options.");
            return;
        }

        // Aggregate word frequencies across all selected dates and titles
        const aggregatedWords = {};
        data.forEach(item => {
            for (const word in item.wordFrequencies) {
                aggregatedWords[word] = (aggregatedWords[word] || 0) + item.wordFrequencies[word];
            }
        });

        const sortedWords = Object.entries(aggregatedWords)
            .sort(([, freqA], [, freqB]) => freqB - freqA) // Sort by frequency descending
            .slice(0, 20); // Top 20 words
        const topWords = sortedWords.map(([word]) => word);
        const topFrequencies = sortedWords.map(([, freq]) => freq);

        const margin = { top: 20, right: 40, bottom: 120, left: 90 };
        const width = topWordsChartDiv.node().getBoundingClientRect().width - margin.left - margin.right - 10;
        const height = 500 - margin.top - margin.bottom;

        const svg = topWordsChartDiv.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(topWords)
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(topFrequencies)])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");
        svg.append('g')
            .call(d3.axisLeft(y));

        svg.selectAll(".bar")
            .data(sortedWords)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d[0]))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d[1]))
            .attr("height", d => height - y(d[1]))
            .attr('fill', 'steelblue')
            .on('mouseover', (event, d) => {
                const [mouseX, mouseY] = d3.pointer(event);
                tooltipDiv.transition().duration(200).style('opacity', .9);
                tooltipDiv.html(`${d[0]}: ${d[1]}`)
                          .style('left', (mouseX + 10) + 'px')
                          .style('top', (mouseY - 15) + 'px');
            })
            .on('mouseout', () => {
                tooltipDiv.transition().duration(500).style('opacity', 0);
            })
            .on('click', (event, d) => { // Add click event
                const clickedWord = d[0];
                const index = selectedWords.indexOf(clickedWord);
                if (index !== -1) {
                    selectedWords.splice(index, 1);
                    updateWordList();
                    updateSelectedWords();
                    updateCharts();
                }
            });

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 30)
            .style('text-anchor', 'middle')
            .text('Words');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Total Frequency');
    };

    const createStackedAreaChart = (data, wordsToShow) => {
        stackedAreaChartDiv.selectAll('*').remove();

        if (!data || data.length === 0 || wordsToShow.length === 0) {
            stackedAreaChartDiv.append('text').text("No data for stacked area chart.");
            return;
        }

        const margin = { top: 20, right: 150, bottom: 80, left: 70 };
        const width = stackedAreaChartDiv.node().getBoundingClientRect().width - margin.left - margin.right - 10;
        const height = 500 - margin.top - margin.bottom;

        const svg = stackedAreaChartDiv.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.versionDate)))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.sum(wordsToShow, word => d3.max(data, d => d.wordFrequencies[word] || 0)) * 1.1]) // Adjust domain
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text") // Select x-axis text elements
            .style("text-anchor", "end") // Anchor text to the end
            .attr("dx", "-.8em") // Shift text to the left
            .attr("dy", ".15em") // Shift text down slightly
            .attr("transform", "rotate(-45)"); // Rotate text by -45 degrees
        svg.append('g')
            .call(d3.axisLeft(y));

        const color = d3.scaleOrdinal(d3.schemeCategory10).domain(wordsToShow);

        const stack = d3.stack()
            .keys(wordsToShow)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const series = stack(data.map(d => {
            const row = { versionDate: d.versionDate };
            wordsToShow.forEach(word => row[word] = d.wordFrequencies[word] || 0);
            return row;
        }));

        const area = d3.area()
            .x(d => x(new Date(d.data.versionDate)))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        svg.selectAll(".area")
            .data(series)
            .enter().append("path")
            .attr("class", "area")
            .attr("d", area)
            .style("fill", d => color(d.key))
            .on('mouseover', (event, d) => {
                const [mouseX, mouseY] = d3.pointer(event);
                tooltipDiv.transition().duration(200).style('opacity', .9);
                tooltipDiv.html(`${d.key}`)
                          .style('left', (mouseX + 10) + 'px')
                          .style('top', (mouseY - 15) + 'px');
            })
            .on('mouseout', () => {
                tooltipDiv.transition().duration(500).style('opacity', 0);
            })
            .on('click', (event, d) => {
                const index = selectedWords.indexOf(d.key);
                if (index !== -1) {
                    selectedWords.splice(index, 1);
                    updateWordList();
                    updateSelectedWords();
                    updateCharts();
                }
            });

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom - 5)
            .style('text-anchor', 'middle')
            .text('Version Date');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text('Total Word Frequency (Stacked)');

        // Legend for Stacked Area Chart (similar to Time Series)
        const legend = svg.append('g')
            .attr('transform', `translate(${width + 20}, 0)`);

        wordsToShow.forEach((word, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 16})`);

            legendRow.append('rect')
                .attr('width', 8)
                .attr('height', 8)
                .attr('fill', color(word));

            legendRow.append('text')
                .attr('x', 12)
                .attr('y', 8)
                .attr('font-size', '11px')
                .text(word);
        });
    };

    // --- Update Charts ---
    const updateCharts = () => {
        const filteredData = filterData();
        createTimeSeriesChart(filteredData, selectedWords);
        createTopWordsChart(filteredData);
        createStackedAreaChart(filteredData, selectedWords);
    };

    // --- Event Handlers ---
    titleFilter.on('input', updateTitleList);
    wordFilter.on('input', updateWordList);

    resetButton.on('click', () => {
        selectedTitles = ['all'];
        selectedWords = [];
        titleFilter.property('value', '');
        wordFilter.property('value', '');
        updateTitleList();
        updateWordList();
        updateSelectedTitles();
        updateSelectedWords();
        updateCharts();
    });

    // --- Data Loading and Initialization ---
    d3.json(dataUrl).then(data => {
        allData = data;
        allTitles = getTitles(data);
        allWords = getAllWords(data);
        filteredTitles = ['all', ...allTitles];
        filteredWords = allWords;

        updateTitleList();
        updateWordList();
        updateSelectedTitles();
        updateSelectedWords();
        updateCharts();
    }).catch(error => {
        console.error("Error loading data:", error);
        timeSeriesChartDiv.append('text').text("Error loading data. Please check console.");
        topWordsChartDiv.append('text').text("Error loading data. Please check console.");
        stackedAreaChartDiv.append('text').text("Error loading data. Please check console.");
    });
});
