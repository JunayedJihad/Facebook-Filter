// Set up alarm for midnight reset
chrome.alarms.create('midnightReset', {
  when: getNextMidnight(),
  periodInMinutes: 1440 // 24 hours
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'midnightReset') {
    // Reset time spent
    chrome.storage.local.set({
      timeSpentToday: 0,
      lastResetDate: new Date().toDateString()
    });
    console.log('Facebook timer reset at midnight');
  }
});

// Function to get next midnight timestamp
function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['timeSpentToday', 'lastResetDate'], (result) => {
    const today = new Date().toDateString();

    // Reset if it's a new day
    if (result.lastResetDate !== today) {
      chrome.storage.local.set({
        timeSpentToday: 0,
        lastResetDate: today
      });
    }
  });
});