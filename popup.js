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

let statusTimeout = null;

chrome.storage.sync.get(defaultSettings, (settings) => {
  if (!settings || typeof settings !== 'object') {
    settings = defaultSettings;
  }
  
  Object.keys(defaultSettings).forEach(key => {
    const toggle = document.querySelector(`[data-option="${key}"]`);
    if (toggle && settings.hasOwnProperty(key) && typeof settings[key] === 'boolean' && settings[key]) {
      toggle.classList.add('active');
    }
  });
});

document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const option = toggle.dataset.option;
    
    if (!defaultSettings.hasOwnProperty(option)) {
      console.error('Invalid option:', option);
      return;
    }
    
    const isActive = toggle.classList.toggle('active');

    chrome.storage.sync.set({ [option]: isActive }, () => {
      const status = document.getElementById('status');
      if (status) {
        if (statusTimeout) {
          clearTimeout(statusTimeout);
        }
        
        status.classList.add('show');
        
        statusTimeout = setTimeout(() => {
          status.classList.remove('show');
          statusTimeout = null;
        }, 2000);
      }

      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'updateSettings'}).catch(() => {
          });
        }
      });
    });
  });
});