function scatter_plot(data, ax, title = "", xCol = "", yCol = "", rCol = "", legend = [], colorCol = "", margin = 50) {
    const X = data.map(d => +d[xCol]);
    const Y = data.map(d => +d[yCol]);
    const R = data.map(d => +d[rCol]);
    const colorCategories = [...new Set(data.map(d => d[colorCol]))];
    const color = d3.scaleOrdinal()
        .domain(colorCategories)
        .range(d3.schemeTableau10);

    const xExtent = d3.extent(X);
    const yExtent = d3.extent(Y);

    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - (xExtent[1] - xExtent[0]) * 0.05, xExtent[1] + (xExtent[1] - xExtent[0]) * 0.05])
        .range([margin, 1000 - margin]);

    const yScale = d3.scaleLinear()
        .domain([yExtent[0] - (yExtent[1] - yExtent[0]) * 0.05, yExtent[1] + (yExtent[1] - yExtent[0]) * 0.05])
        .range([1000 - margin, margin]);

    const rScale = d3.scaleSqrt()
        .domain(d3.extent(R))
        .range([4, 12]);

    const Fig = d3.select(ax);

    Fig.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", (d, i) => `cls_${i} ${d[colorCol]}`)
        .attr("id", (d, i) => `id_${i} ${d[colorCol]}`)
        .attr("cx", d => xScale(d[xCol]))
        .attr("cy", d => yScale(d[yCol]))
        .attr("r", d => rScale(d[rCol]))
        .attr("fill", d => color(d[colorCol]));

    // Axes
    Fig.append("g")
        .attr("transform", `translate(0, ${1000 - margin})`)
        .call(d3.axisBottom(xScale).ticks(5));

    Fig.append("g")
        .attr("transform", `translate(${margin}, 0)`)
        .call(d3.axisLeft(yScale).ticks(5));

    // Title
    Fig.append("text")
        .attr("x", 500)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .attr("class", "title")
        .text(title);

    // Brush
    const brush = d3.brush()
        .extent([[margin, margin], [1000 - margin, 1000 - margin]])
        .on("start brush", brushed);

    Fig.append("g")
        .call(brush);

    function brushed({ selection }) {
        const listBox = d3.select("#selected-list");
        if (!selection) {
            resetSelections();
            return;
        }

        const [[x0, y0], [x1, y1]] = selection;

        d3.selectAll("circle").classed("selected", d => {
            const x = xScale(d[xCol]);
            const y = yScale(d[yCol]);
            return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        });

        const selectedData = data.filter(d => {
            const x = xScale(d[xCol]);
            const y = yScale(d[yCol]);
            return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        });

        listBox.selectAll("li").remove();
        if (selectedData.length > 0) {
            listBox.selectAll("li")
                .data(selectedData)
                .enter()
                .append("li")
                .text(d => `Country: ${d[colorCol]}, ${xCol}: ${d[xCol]}, ${yCol}: ${d[yCol]}`);
        }
    }

    // Legend
    const legendContainer = Fig.append("g")
        .attr("transform", `translate(${800}, ${margin})`);

    legendContainer.selectAll("g")
        .data(colorCategories)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`)
        .each(function(d) {
            const g = d3.select(this);

            g.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", color(d))
                .attr("class", `legend-rect ${d}`)
                .on("click", function() {
                    const isDimmed = d3.select(this).classed("dimmed");
                    d3.select(this).classed("dimmed", !isDimmed);
                    d3.selectAll(`circle.${d}`).style("opacity", isDimmed ? 1 : 0.2);
                    d3.selectAll(`.legend-rect.${d}`).style("opacity", isDimmed ? 1 : 0.5);

                    const event = new CustomEvent("legendClick", {
                        detail: { category: d, dimmed: !isDimmed }
                    });
                    document.dispatchEvent(event);
                });

            g.append("text")
                .attr("x", 30)
                .attr("y", 15)
                .text(d);
        });
}

// Global event listener for legends across scatterplots
document.addEventListener("legendClick", function(event) {
    const { category, dimmed } = event.detail;
    d3.selectAll(`circle.${category}`).style("opacity", dimmed ? 0.2 : 1);
    d3.selectAll(`.legend-rect.${category}`).style("opacity", dimmed ? 0.5 : 1);
});

// Global event listener to reset selections
document.addEventListener("click", function(event) {
    const clickedInsideSVG = event.target.closest("svg");
    const clickedOnBrush = event.target.classList.contains("overlay");

    // Reset selections if clicking outside or on empty space in the graph
    if (!clickedInsideSVG || clickedOnBrush) {
        resetSelections();
    }
});

// Function to reset all selections and opacity
function resetSelections() {
    d3.selectAll("circle").classed("selected", false).style("opacity", 1);
    d3.select("#selected-list").selectAll("li").remove();
    d3.selectAll(".legend-rect").style("opacity", 1);
}
