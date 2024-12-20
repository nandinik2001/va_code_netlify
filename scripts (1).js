// Dimensions and margins for the bar chart
const barMargin = { top: 50, right: 150, bottom: 100, left: 80 },
    barWidth = 500 - barMargin.left - barMargin.right,
    barHeight = 400 - barMargin.top - barMargin.bottom;

// Append the SVG for the bar chart
const barSvg = d3.select("#chart")
    .append("svg")
    .attr("width", barWidth + barMargin.left + barMargin.right)
    .attr("height", barHeight + barMargin.top + barMargin.bottom)
    .append("g")
    .attr("transform", `translate(${barMargin.left},${barMargin.top})`);




// Append SVG for pie chart
const pieSvg = d3.select("#pieChart")
    .append("svg")
    .attr("width", 700)
    .attr("height", 600)
    .append("g")
    .attr("transform", `translate(300,200)`); // Center the pie chart

const pieRadius = 450;   

const pieWidth = 1200,
    pieHeight = 400,
    barChartWidth = 300,
    barChartHeight = 200;

const pie_margin = { top: 10, right: 10, bottom: 50, left: 50 };


const barChartPopup = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("box-shadow", "2px 2px 10px rgba(0, 0, 0, 0.5)")
    .style("opacity", 0)
    .style("pointer-events", "none"); // Prevent interactions with the pop-up

// Append SVG to the pop-up
const barChartSvg = barChartPopup
    .append("svg")
    .attr("width", barWidth + pie_margin.left + pie_margin.right)
    .attr("height", barHeight + pie_margin.top + pie_margin.bottom)
    .append("g")
    .attr("transform", `translate(${pie_margin.left},${pie_margin.top})`);



// // File input change event
// document.getElementById("fileInput").addEventListener("change", function (event) {
//     const file = event.target.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function (e) {
//             const content = e.target.result;
//             const data = d3.csvParse(content);
//             processAndDraw(data);
//         };
//         reader.readAsText(file);
//     }
// });

drawchart();    

function drawchart() {
console.log("hello");
const csvUrl = "data.csv";
Papa.parse(csvUrl, {
        download: true,
        header: true, 
        dynamicTyping: true,
        complete: function(results) {
            const data = results.data;
            processAndDraw(data);
        }
    });
}

let data;
let bcountry = 'United States';
// Process and draw the charts
function processAndDraw(datac) {

    datac.forEach(d => {
        d.Revenue_x = +d.Revenue_x || 0;
        d.Revenue = +d.Revenue || 0;
    });

    data = datac;
    drawBarChart();
}

function drawBarChart() {
    
    const ageGroups = ["18-25", "26-35", "36-50", "51+"];
    const colors = {
        "18-25": "#FFFFCC",
        "26-35": "#A1DAB4",
        "36-50": "#41B6C4",
        "51+": "#225EA8"
    };

    // Map age groups
    function mapAgeGroup(ageGroup) {
        if (ageGroup === "18-25") return "18-25";
        if (ageGroup === "26-35") return "26-35";
        if (["36-45", "46-50"].includes(ageGroup)) return "36-50";
        if (["51-55", "56-65", "66-75", "76-85", "86-95"].includes(ageGroup)) return "51+";
        return "Other";
    }

    data.forEach(d => {
        d["Mapped Age Group"] = mapAgeGroup(d["Age Group"]);
    });

    const filteredData = data.filter(d => ageGroups.includes(d["Mapped Age Group"]));

    const groupedData = d3.groups(filteredData, d => d.Country).map(([key, values]) => {
        const entry = { Country: key };
        ageGroups.forEach(ageGroup => {
            entry[ageGroup] = values
                .filter(v => v["Mapped Age Group"] === ageGroup)
                .reduce((sum, v) => sum + v.Revenue_x, 0);
        });
        return entry;
    });

    const stackData = groupedData;

    const countries = groupedData.map(d => d.Country);

    const stackedData = d3.stack()
        .keys(ageGroups)
        .value((d, key) => d[key])
        (groupedData);

    const xScale = d3.scaleBand()
        .domain(countries)
        .range([0, barWidth])
        .padding(0.2);

    const x = xScale;

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(stackedData, d => d3.max(d, d => d[1]))])
        .range([barHeight, 0]);

    const y = yScale;    

    barSvg.selectAll("*").remove(); // Clear any previous content

    // Add X-axis with label
    barSvg.append("g")
        .attr("transform", `translate(0,${barHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    barSvg.append("text")
        .attr("x", barWidth / 2)
        .attr("y", barHeight + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("");

    // Add Y-axis
    barSvg.append("g").call(d3.axisLeft(yScale));

    // Tooltip for hover
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.2)")
        .style("pointer-events", "none")
        .style("display", "none");

    // Bars
    barSvg.selectAll("g.layer")
        .data(stackedData)
        .join("g")
        .attr("class", "layer")
        .attr("fill", d => colors[d.key])
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => xScale(d.data.Country))
        .attr("y", d => yScale(d[1]))
        .attr("height", d => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .on("mouseover", function (event, d) {
            
            const ageGroup = d3.select(this.parentNode).datum().key;
            console.log('barsvg',ageGroup);
            const country = d.data.Country;
            const revenue = d[1] - d[0];

            tooltip.style("display", "block")
                .html(`<strong>Country:</strong> ${country}<br>
                       <strong>Age Group:</strong> ${ageGroup}<br>
                       <strong>Revenue:</strong> $${revenue}`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 20 + "px");
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        })
        .on("click", function (event, d) {
            const country = d.data.Country;
            bcountry = country;
            drawPieChart(filteredData.filter(row => row.Country === country));
        });

     drawPieChart(filteredData.filter(row => row.Country === bcountry));    

    // Legend
    const legend = barSvg.append("g")
        .attr("transform", `translate(${barWidth + 30}, 20)`);

    // Initialize activeAgeGroup to track which group is active for filtering
    let activeAgeGroup = null;

    // Create the color scale
    const color = d3.scaleOrdinal()
        .domain(ageGroups)
        .range(["#FFFFCC", "#A1DAB4", "#41B6C4", "#225EA8"]);

    // Create the legend for age groups
    ageGroups.forEach((ageGroup, i) => {
        console.log('ageGroups ',ageGroup,'i - ',i);
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 40})`)
            .style("cursor", "pointer")
            .on("click", function () {
                activeAgeGroup = (activeAgeGroup === ageGroup) ? null : ageGroup;
                updateChart(); // Update the chart after filtering
            })
            .on("mouseover", function () {
                d3.select(this).select("rect")
                    .style("fill", d3.color(color(ageGroup)).brighter(0.8)) // Brighten on hover
                    .style("stroke-width", 2);
            })
            .on("mouseout", function () {
                d3.select(this).select("rect")
                    .style("fill", color(ageGroup)) // Reset on mouseout
                    .style("stroke-width", 1);
            });

        // Create the legend rectangle
        legendRow.append("rect")
            .attr("width", 25)
            .attr("height", 25)
            .attr("rx", 5)
            .style("fill", color(ageGroup))
            .style("stroke", "black")
            .style("stroke-width", 1);

        // Add the legend text
        legendRow.append("text")
            .attr("x", 35)
            .attr("y", 15)
            .attr("dy", ".35em")
            .style("font-size", "12px")
            .text(ageGroup);
    });

   function updateChart() {
    // Filter data to show only the selected age group, or all groups if none is selected
    const filteredStackedData = activeAgeGroup
        ? stackedData.filter(d => d.key === activeAgeGroup)
        : stackedData;


    if (activeAgeGroup === null) {
        drawBarChart();
    }    

    const bars = barSvg.selectAll("g.layer")
        .data(filteredStackedData)
        .join("g")
        .attr("class", "layer")
        .attr("fill", d => colors[d.key]);

    bars.selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", d => xScale(d.data.Country))
        .attr("y", d => 
            activeAgeGroup 
                ? yScale(d[1] - d[0]) // Start at the correct height for the filtered group
                : yScale(d[1])        // Standard stacked bar position
        )
        .attr("height", d => 
            activeAgeGroup 
                ? barHeight - yScale(d[1] - d[0]) // Height for the filtered group
                : yScale(d[0]) - yScale(d[1])    // Stacked bar height
        )
        .attr("width", xScale.bandwidth());
}


    // Pie chart drawing function (simplified)
   // Pie chart drawing function (simplified)

}

// Assuming you have the color scale already defined for the pie chart
const pieColor = d3.scaleOrdinal(d3.schemeTableau10);


// Draw pie chart for product categories
function drawPieChart(data) {
    const productCategories = d3.group(data, d => d["Product Category"]);
    pieSvg.selectAll("*").remove();

    // Prepare data for pie chart
    const pieData = Array.from(productCategories, ([key, values]) => ({
        category: key,
        value: d3.sum(values, d => +d.Revenue)
    }));

    const radius = Math.min(400, 400) / 2 - 50;
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const arcs = pieSvg.selectAll("arc")
        .data(pie(pieData))
        .join("g")
        .attr("class", "arc");

  // Add a tooltip
const tooltip = d3.select("body")
    .append("div")
    .style("position", "fixed") // Use fixed positioning for placement relative to the window
    .style("bottom", "20px") // Position 20px from the bottom
    .style("right", "20px")  // Position 20px from the right
    .style("background", "white")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("padding", "8px")
    .style("pointer-events", "none")
    .style("opacity", 0);


    arcs.on("mouseover", function (event, d) {
        tooltip
         .html(`<b>Category:</b> ${d.data.category}<br><b>Revenue:</b> ${d.data.value}<br><b>Percentage:</b>(${Math.round(d.data.value / d3.sum(pieData, d => d.value) * 100)}%)`)

            .style("opacity", 1);
    });
    

    // Draw pie slices
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category))
        .on("mouseover", function (event, d) {
            drawSubCategoryBarChart(data, d.data.category); // Call to draw subcategory bar chart
            tooltip
            .html(`<b>Category:</b> ${d.data.category}<br><b>Revenue:</b> ${d.data.value}<br><b>Percentage:</b>(${Math.round(d.data.value / d3.sum(pieData, d => d.value) * 100)}%)`)
            .style("opacity", 1);
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });


  // Draw pie slices
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.category))
        .on("mouseover", function (event, d) {
            const category = d.data.category;
            const [mouseX, mouseY] = [event.pageX, event.pageY];
            const hoverColor = d3.color(color(d.data.category));
            // Show the bar chart pop-up
            drawSubCategoryBarChart(data, category,hoverColor);
            barChartPopup
                .style("left", `${mouseX + 10}px`)
                .style("top", `${mouseY}px`)
                .style("opacity", 1);
        })
        .on("mouseout", function () {
            // Hide the bar chart pop-up
            barChartPopup.style("opacity", 0);
            tooltip.style("opacity", 0);
        });

    arcs.append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .text(d => `${d.data.category}`);   

    pieSvg.append("text")
    .attr("x", 0) // Center the title horizontally
    .attr("y", -radius - 20) // Position it above the pie chart
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(`Revenue by Product Category For ${bcountry}`);      

}

function drawSubCategoryBarChart(data, selectedCategory,hoverColor) {
    const filteredData = data.filter(d => d["Product Category"] === selectedCategory);
    const subCategories = d3.group(filteredData, d => d["Sub Category"]);

    const barData = Array.from(subCategories, ([key, values]) => ({
        subCategory: key,
        value: d3.sum(values, d => +d.Revenue)
    }));

    // Set margins and dimensions
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = barChartWidth - margin.left - margin.right;
    const height = barChartHeight - margin.top - margin.bottom;

    // Define scales
    const x = d3.scaleBand()
        .domain(barData.map(d => d.subCategory))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.value) * 1.1]) // Add padding to the max value
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeSet3);

    // Clear existing bar chart
    barChartSvg.selectAll("*").remove();

    // Append a group element for the chart area
    const chartArea = barChartSvg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis
    chartArea.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y-axis
    chartArea.append("g")
        .call(d3.axisLeft(y));

     // Append a title
    barChartSvg.append("text")
    .attr("x", 10)
    .attr("y", 3) // Starting position for the title
    .attr("text-anchor", "start") // Aligns the text to the left
    .style("font-size", "11px")
    .style("font-weight", "bold")
    // .html(`Subcategories in "${bcountry}" for 
    //     <tspan x="10" dy="1.2em"> "${selectedCategory}" {x-axis:Sub category, y-axis:revenue}</tspan>`);
    .html(`Revenue by Subcategories in "${bcountry}" for 
        <tspan x="10" dy="1.2em"> "${selectedCategory}" </tspan>`)
        // .html('{x-axis:Sub category, y-axis:revenue}');





    // Add bars
    chartArea.selectAll(".bar")
        .data(barData)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.subCategory))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => hoverColor);
}

