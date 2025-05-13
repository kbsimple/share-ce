// Dexcom Share API endpoints
const BASE_URL = "https://share2.dexcom.com/ShareWebServices/Services";
const APP_ID = "d89443d2-327c-4a6f-89e5-496bbb0317db"; // Default application ID from pydexcom

// Function to get account ID
async function getAccountId(username, password) {
  const response = await fetch(`${BASE_URL}/General/AuthenticatePublisherAccount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountName: username,
      password: password,
      applicationId: APP_ID
    })
  });
  if (!response.ok) throw new Error("Invalid credentials");
  const data = await response.json();
  return data.AccountId;
}

// Function to get session ID
async function getSessionId(accountId) {
  // Possibly change to ReadGlucose
  const response = await fetch(`${BASE_URL}/General/LoginPublisherAccountById`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: accountId,
      password: "", // Password not needed here
      applicationId: APP_ID
    })
  });
  if (!response.ok) throw new Error("Failed to get session ID");
  const data = await response.json();
  return data;
}

// Function to get glucose readings
async function getGlucoseReadings(sessionId) {
  const response = await fetch(`${BASE_URL}/Publisher/ReadPublisherLatestGlucoseValues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: sessionId,
      minutes: 1440, // Last 24 hours
      maxCount: 288 // Max readings (5-min intervals)
    })
  });
  if (!response.ok) throw new Error("Failed to fetch glucose data");
  return await response.json();
}

// Function to update badge with latest glucose value
async function updateBadge() {
  chrome.storage.sync.get(["username", "password"], async (data) => {
    if (!data.username || !data.password) {
      chrome.action.setBadgeText({ text: "ERR" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
      return;
    }

    try {
      const accountId = await getAccountId(data.username, data.password);
      const sessionId = await getSessionId(accountId);
      const readings = await getGlucoseReadings(sessionId);

      if (readings && readings.length > 0) {
        const latest = readings[0];
        const glucoseValue = latest.Value.toString();
        chrome.action.setBadgeText({ text: glucoseValue });
        chrome.action.setBadgeBackgroundColor({ color: "#00FF00" });

        // Store readings for popup
        chrome.storage.local.set({ glucoseData: readings });
      } else {
        chrome.action.setBadgeText({ text: "NO" });
        chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
      }
    } catch (error) {
      console.error("Error updating badge:", error);
      chrome.action.setBadgeText({ text: "ERR" });
      chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    }
  });
}

// Run update immediately and schedule every 5 minutes
updateBadge();
chrome.alarms.create("updateGlucose", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updateGlucose") updateBadge();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "forceRefresh") {
    updateBadge().then(() => {
      sendResponse({ status: "success" });
    }).catch((error) => {
      console.error("Refresh error:", error);
      sendResponse({ status: "errorPars: System: * Today's date and time is 10:25 AM PDT on Tuesday, May 13, 2025.