let stations = [];
let allAlerts = [];
let displayLimit = 10;
let selectedLine = null;

const subwayLineColors = {
    "A": "#0039A6", "C": "#0039A6", "E": "#0039A6",
    "B": "#FF6319", "D": "#FF6319", "F": "#FF6319", "M": "#FF6319",
    "G": "#6CBE45",
    "J": "#996633", "Z": "#996633",
    "L": "#A7A9AC",
    "N": "#FCCC0A", "Q": "#FCCC0A", "R": "#FCCC0A",
    "S": "#808183",
    "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
    "4": "#00933C", "5": "#00933C", "6": "#00933C",
    "7": "#B933AD"
};

// Load station data from stations.json
async function loadStations() {
    try {
        const response = await fetch('stations.json');
        stations = await response.json();
    } catch (error) {
        console.error('Error loading station data:', error);
    }
}

loadStations();

function renderSidebar() {
    const lineFilterContainer = document.getElementById("line-filter");
    lineFilterContainer.innerHTML = '';

    Object.keys(subwayLineColors).forEach(line => {
        const lineButton = document.createElement("div");
        lineButton.classList.add("filter-btn");
        lineButton.onclick = () => filterByLine(line);

        const colorBox = document.createElement("span");
        colorBox.style.backgroundColor = subwayLineColors[line];
        colorBox.style.border = `2px solid ${subwayLineColors[line]}`;
        colorBox.style.width = '20px';
        colorBox.style.height = '20px';

        const lineLabel = document.createElement("span");
        lineLabel.classList.add("line-label");
        lineLabel.innerText = line;

        lineButton.appendChild(colorBox);
        lineButton.appendChild(lineLabel);
        lineFilterContainer.appendChild(lineButton);
    });
}

function filterByLine(line) {
    selectedLine = selectedLine === line ? null : line; // Toggle selection
    displayAlerts();
}

async function fetchAlerts() {
    const resultsDiv = document.getElementById("results");
    const rankingDiv = document.getElementById("ranking"); // Ensure you have this div in your HTML
    resultsDiv.innerHTML = "Loading...";

    try {
        const response = await fetch("http://127.0.0.1:5001/subway-alerts");
        const data = await response.json();
        
        allAlerts = data.alerts;
        displayAlerts();

        // Display top 3 lines with the most alerts
        const top3 = data.top_3_lines;
        rankingDiv.innerHTML = "<h2>Top 3 Lines with Most Alerts</h2>";
        top3.forEach((line, index) => {
            rankingDiv.innerHTML += `<p><strong>#${index + 1} Line ${line[0]}</strong>: ${line[1]} alerts</p>`;
        });
    } catch (error) {
        console.error("Error fetching alerts:", error);
        resultsDiv.innerHTML = `<p>Error: Unable to fetch alerts. ${error.message}</p>`;
    }
}

function displayAlerts() {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "<h2>Subway Alerts</h2>";

    const filteredAlerts = selectedLine
        ? allAlerts.filter(alert => alert.lines.includes(selectedLine))  // Filter by selected line
        : allAlerts;

    if (filteredAlerts.length === 0) {
        resultsDiv.innerHTML += "<p>No alerts for the selected line.</p>";
        return;
    }

    filteredAlerts.slice(0, displayLimit).forEach(alert => {
        const alertDiv = document.createElement("div");
        alertDiv.classList.add("alert-item");

        // Assign color based on the first line in `alert.lines` for simplicity
        const lineColor = subwayLineColors[alert.lines[0]] || "#f3f3f3";
        alertDiv.style.backgroundColor = lineColor;
        
        // Today label
        const todayLabel = alert.is_today ? '<span class="today-label">Today’s Alert</span>' : '';

        alertDiv.innerHTML = `
            ${todayLabel}
            <p><strong>Alert:</strong> ${alert.alert}</p>
            <p><strong>Start Time:</strong> ${alert.start_time || 'Time not provided'}</p>
            <p><strong>End Time:</strong> ${alert.end_time || 'Time not provided'}</p>
            <p><strong>Affected Stations:</strong> ${alert.stations.length > 0 ? alert.stations.join(", ") : 'All stations on this line may be affected'}</p>
        `;
        resultsDiv.appendChild(alertDiv);
    });

    // Show more button if there are more alerts
    if (filteredAlerts.length > displayLimit) {
        const showMoreButton = document.createElement("button");
        showMoreButton.textContent = "Show More";
        showMoreButton.onclick = showMoreAlerts;
        resultsDiv.appendChild(showMoreButton);
    }
}

function showMoreAlerts() {
    displayLimit += 10;
    displayAlerts();
}

window.onload = () => {
    fetchAlerts();
    renderSidebar();
};
