function saveOptions() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  chrome.storage.sync.set({ username, password }, () => {
    alert("Credentials saved");
    window.close();
  });
}

// Load saved credentials and set up event listener
document.addEventListener("DOMContentLoaded", () => {
  // Load saved credentials
  chrome.storage.sync.get(["username", "password"], (data) => {
    document.getElementById("username").value = data.username || "";
    document.getElementById("password").value = data.password || "";
  });

  // Add event listener to the save button
  document.getElementById("saveButton").addEventListener("click", saveOptions);
});