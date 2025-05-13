// Function to update the popup with glucose data
function updatePopup() {
  chrome.storage.local.get(["glucoseData"], (data) => {
    const readings = data.glucoseData || [];
    if (readings.length === 0) {
      document.getElementById("glucoseValue").textContent = "No data available";
      return;
    }

    const latest = readings[0];
    document.getElementById("glucoseValue").textContent = `Latest: ${latest.Value} mg/dL (${latest.Trend})`;

    // Prepare data for chart
    const labels = readings.reverse().map(r => new Date(r.WT).toLocaleTimeString());
    const values = readings.map(r => r.Value);

    // Clear existing chart if it exists
    const canvas = document.getElementById("glucoseChart");
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    // Render new chart
    new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Glucose (mg/dL)",
          data: values,
          borderColor: "#00FF00",
          fill: false
        }]
      },
      options: {
        scales: {
          x: { display: false },
          y: { suggestedMin: 50, suggestedMax: 250 }
        }
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Initial popup update
  updatePopup();

  // Add event listener for refresh button
  document.getElementById("refreshButton").addEventListener("click", () => {
    // Disable button to prevent multiple clicks
    const button = document.getElementById("refreshButton");
    button.disabled = true;
    button.textContent = "Refreshing...";

    console.log("About to send a message to the forceRefresh button");
    // Send message to background.js to force refresh
    chrome.runtime.sendMessage({ action: "forceRefresh" }, () => {
      // Update popup with new data
      updatePopup();
      // Re-enable button
      button.disabled = false;
      button.textContent = "Refresh";
    });
  });
});