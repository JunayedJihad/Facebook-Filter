// Default settings
const defaultSettings = {
  showTimer: true,
  grayscale: true,
  reels: true,
  stories: true,
  sponsored: true,
  marketplace: true,
  watch: true,
  games: true,
  suggested: true,
  peopleYouMayKnow: true
};

// Load saved settings
chrome.storage.sync.get(defaultSettings, (settings) => {
  // Set toggle states based on saved settings
  Object.keys(settings).forEach(key => {
    const toggle = document.querySelector(`[data-option="${key}"]`);
    if (toggle && settings[key]) {
      toggle.classList.add('active');
    }
  });
});

// Handle toggle clicks
document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const option = toggle.dataset.option;
    const isActive = toggle.classList.toggle('active');

    // Save setting
    chrome.storage.sync.set({ [option]: isActive }, () => {
      // Show status message
      const status = document.getElementById('status');
      status.classList.add('show');
      setTimeout(() => status.classList.remove('show'), 2000);

      // Notify content script to update
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'updateSettings'});
        }
      });
    });
  });
});