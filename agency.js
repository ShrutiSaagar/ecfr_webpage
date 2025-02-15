document.addEventListener('DOMContentLoaded', () => {
    const dataUrl = 'agency.json';
    const agencyFilter = d3.select('#agency-filter');
    const wordFilter = d3.select('#word-filter');
    const agencyList = d3.select('#agency-list');
    const wordList = d3.select('#word-list');
    const selectedAgenciesDiv = d3.select('#selected-agencies');
    const selectedWordsDiv = d3.select('#selected-words');
    const timeSeriesChartDiv = d3.select('#time-series-chart');
    const topWordsChartDiv = d3.select('#top-words-chart');
    const stackedAreaChartDiv = d3.select('#stacked-area-chart');
    const agencyWordCountDiv = d3.select('#agency-word-count');
    const agencyComplexityDiv = d3.select('#agency-complexity');
    const wordDistributionDiv = d3.select('#word-distribution');
    const temporalHeatmapDiv = d3.select('#temporal-heatmap');
    const tooltipDiv = d3.select('#chart-tooltip');
    const resetButton = d3.select('#reset-button');

    let allData = [];
    let allAgencies = [];
    let allWords = [];
    let selectedAgencies = ['all'];
    let selectedWords = [];
    let filteredAgencies = [];
    let filteredWords = [];

    // --- Helper Functions ---
    const getAgencies = (data) => [...new Set(data.map(d => d.agency))].sort();
    const getAllWords = (data) => {
        const words = new Set();
        data.forEach(item => {
            Object.keys(item.wordFrequencies).forEach(word => words.add(word));
        });
        return Array.from(words).sort();
    };

    const filterData = () => {
        let filteredData = allData;
        if (!selectedAgencies.includes('all')) {
            filteredData = filteredData.filter(d => selectedAgencies.includes(d.agency));
        }
        return filteredData;
    };

    // --- Summary Chart Functions ---
    const createAgencyWordCountChart = (data) => {
        agencyWordCountDiv.selectAll('*').remove();

        if (!data || data.length === 0) {
            agencyWordCountDiv.append('text').text("No data available");
            return;
        }

        const margin = { top: 30, right: 20, bottom: 40, left: 60 };
        const width = agencyWordCountDiv.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = agencyWordCountDiv.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const svg = agencyWordCountDiv.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate total word count per agency
        const agencyCounts = d3.rollup(data,
            v => d3.sum(v, d => d3.sum(Object.values(d.wordFrequencies))),
            d => d.agency
        );

        const sortedAgencies = Array.from(agencyCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const x = d3.scaleBand()
            .domain(sortedAgencies.map(d => d[0]))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(sortedAgencies, d => d[1])])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        svg.append('g')
            .call(d3.axisLeft(y));

        svg.selectAll('rect')
            .data(sortedAgencies)
            .enter()
            .append('rect')
            .attr('x', d => x(d[0]))
            .attr('y', d => y(d[1]))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d[1]))
            .attr('fill', '#4CAF50')
            .on('mouseover', (event, d) => {
                tooltipDiv.transition().duration(200).style('opacity', .9);
                tooltipDiv.html(`${d[0]}: ${d[1]} words`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 15) + 'px');
            })
            .on('mouseout', () => {
                tooltipDiv.transition().duration(500).style('opacity', 0);
            });

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Total Word Count by Agency (Top 10)');
    };

    const createAgencyComplexityChart = (data) => {
        agencyComplexityDiv.selectAll('*').remove();

        if (!data || data.length === 0) {
            agencyComplexityDiv.append('text').text("No data available");
            return;
        }

        const margin = { top: 30, right: 20, bottom: 40, left: 60 };
        const width = agencyComplexityDiv.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = agencyComplexityDiv.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const svg = agencyComplexityDiv.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate average word length per agency
        const agencyComplexity = d3.rollup(data,
            v => {
                const allWords = v.flatMap(d => 
                    Object.entries(d.wordFrequencies)
                        .flatMap(([word, freq]) => Array(freq).fill(word.length))
                );
                return d3.mean(allWords);
            },
            d => d.agency
        );

        const sortedAgencies = Array.from(agencyComplexity)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        const x = d3.scaleBand()
            .domain(sortedAgencies.map(d => d[0]))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(sortedAgencies, d => d[1])])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        svg.append('g')
            .call(d3.axisLeft(y));

        svg.selectAll('rect')
            .data(sortedAgencies)
            .enter()
            .append('rect')
            .attr('x', d => x(d[0]))
            .attr('y', d => y(d[1]))
            .attr('width', x.bandwidth())
            .attr('height', d => height - y(d[1]))
            .attr('fill', '#2196F3')
            .on('mouseover', (event, d) => {
                tooltipDiv.transition().duration(200).style('opacity', .9);
                tooltipDiv.html(`${d[0]}: ${d[1].toFixed(2)} avg. length`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 15) + 'px');
            })
            .on('mouseout', () => {
                tooltipDiv.transition().duration(500).style('opacity', 0);
            });

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Average Word Length by Agency (Top 10)');
    };

    const createWordDistributionChart = (data) => {
        wordDistributionDiv.selectAll('*').remove();

        if (!data || data.length === 0) {
            wordDistributionDiv.append('text').text("No data available");
            return;
        }

        const margin = { top: 30, right: 20, bottom: 40, left: 60 };
        const width = wordDistributionDiv.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = wordDistributionDiv.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const svg = wordDistributionDiv.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate word length distribution
        const wordLengths = data.flatMap(d => 
            Object.entries(d.wordFrequencies)
                .flatMap(([word, freq]) => Array(freq).fill(word.length))
        );

        const bins = d3.histogram()
            .domain([0, 20])
            .thresholds(20)
            (wordLengths);

        const x = d3.scaleLinear()
            .domain([0, 20])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .nice()
            .range([height, 0]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append('g')
            .call(d3.axisLeft(y));

        svg.selectAll('rect')
            .data(bins)
            .enter()
            .append('rect')
            .attr('x', d => x(d.x0))
            .attr('width', d => x(d.x1) - x(d.x0))
            .attr('y', d => y(d.length))
            .attr('height', d => height - y(d.length))
            .attr('fill', '#9C27B0')
            .on('mouseover', (event, d) => {
                tooltipDiv.transition().duration(200).style('opacity', .9);
                tooltipDiv.html(`Length ${d.x0}: ${d.length} words`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 15) + 'px');
            })
            .on('mouseout', () => {
                tooltipDiv.transition().duration(500).style('opacity', 0);
            });

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Word Length Distribution');
    };

    const createTemporalHeatmap = (data) => {
        temporalHeatmapDiv.selectAll('*').remove();

        if (!data || data.length === 0) {
            temporalHeatmapDiv.append('text').text("No data available");
            return;
        }

        const margin = { top: 30, right: 20, bottom: 40, left: 60 };
        const width = temporalHeatmapDiv.node().getBoundingClientRect().width - margin.left - margin.right;
        const height = temporalHeatmapDiv.node().getBoundingClientRect().height - margin.top - margin.bottom;

        const svg = temporalHeatmapDiv.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Process data for temporal analysis
        const temporalData = d3.rollup(data,
            v => d3.sum(v, d => d3.sum(Object.values(d.wordFrequencies))),
            d => d.agency,
            d => new Date(d.versionDate).getMonth()
        );

        const agencies = Array.from(temporalData.keys()).sort();
        const months = d3.range(12);

        const x = d3.scaleBand()
            .domain(months)
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleBand()
            .domain(agencies)
            .range([height, 0])
            .padding(0.1);

        const color = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([0, d3.max(Array.from(temporalData.values(), m => d3.max(Array.from(m.values()))))]);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(d => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d]));

        svg.append('g')
            .call(d3.axisLeft(y));

        agencies.forEach(agency => {
            months.forEach(month => {
                const value = temporalData.get(agency)?.get(month) || 0;
                svg.append('rect')
                    .attr('x', x(month))
                    .attr('y', y(agency))
                    .attr('width', x.bandwidth())
                    .attr('height', y.bandwidth())
                    .attr('fill', color(value))
                    .on('mouseover', (event) => {
                        tooltipDiv.transition().duration(200).style('opacity', .9);
                        tooltipDiv.html(`${agency}<br>${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]}: ${value} words`)
                            .style('left', (event.pageX + 10) + 'px')
                            .style('top', (event.pageY - 15) + 'px');
                    })
                    .on('mouseout', () => {
                        tooltipDiv.transition().duration(500).style('opacity', 0);
                    });
            });
        });

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Word Usage Heatmap (Agency × Month)');
    };

    // --- Main Chart Functions ---
    // (Reuse the existing chart functions from script.js, but modify them to work with agency data)
    // ... (Copy and adapt the createTimeSeriesChart, createTopWordsChart, and createStackedAreaChart functions)

    // --- Update Charts ---
    const updateCharts = () => {
        const filteredData = filterData();
        createAgencyWordCountChart(filteredData);
        createAgencyComplexityChart(filteredData);
        createWordDistributionChart(filteredData);
        createTemporalHeatmap(filteredData);
        createTimeSeriesChart(filteredData, selectedWords);
        createTopWordsChart(filteredData);
        createStackedAreaChart(filteredData, selectedWords);
    };

    // --- Event Handlers ---
    agencyFilter.on('input', updateAgencyList);
    wordFilter.on('input', updateWordList);

    resetButton.on('click', () => {
        selectedAgencies = ['all'];
        selectedWords = [];
        agencyFilter.property('value', '');
        wordFilter.property('value', '');
        updateAgencyList();
        updateWordList();
        updateSelectedAgencies();
        updateSelectedWords();
        updateCharts();
    });

    // --- Data Loading and Initialization ---
    d3.json(dataUrl).then(data => {
        allData = data;
        allAgencies = getAgencies(data);
        allWords = getAllWords(data);
        filteredAgencies = ['all', ...allAgencies];
        filteredWords = allWords;

        updateAgencyList();
        updateWordList();
        updateSelectedAgencies();
        updateSelectedWords();
        updateCharts();
    }).catch(error => {
        console.error("Error loading data:", error);
        // Display error messages in all chart containers
    });
}); 