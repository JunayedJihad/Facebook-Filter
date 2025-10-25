chrome.alarms.create('midnightReset', {
  when: getNextMidnight(),
  periodInMinutes: 1440
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'midnightReset') {
    chrome.storage.local.set({
      timeSpentToday: 0,
      lastResetDate: new Date().toDateString()
    });
    console.log('Facebook timer reset at midnight');
  }
});

function getNextMidnight() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['timeSpentToday', 'lastResetDate'], (result) => {
    const today = new Date().toDateString();

    if (result.lastResetDate !== today) {
      chrome.storage.local.set({
        timeSpentToday: 0,
        lastResetDate: today
      });
    } else {
      const time = result.timeSpentToday || 0;
      if (typeof time !== 'number' || time < 0 || time > 86400) {
        chrome.storage.local.set({
          timeSpentToday: 0,
          lastResetDate: today
        });
      }
    }
  });
});