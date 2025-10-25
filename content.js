let settings = {
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

let timeSpentToday = 0;
let timerInterval = null;
let timerElement = null;
let isTabActive = true;

function loadSettings(callback) {
  chrome.storage.sync.get(settings, (loadedSettings) => {
    const validSettings = {};
    for (const key in settings) {
      if (loadedSettings.hasOwnProperty(key) && typeof loadedSettings[key] === 'boolean') {
        validSettings[key] = loadedSettings[key];
      } else {
        validSettings[key] = settings[key];
      }
    }
    settings = validSettings;
    if (callback) callback();
  });
}

function loadTimeSpent() {
  chrome.storage.local.get(['timeSpentToday', 'lastResetDate'], (result) => {
    const today = new Date().toDateString();

    if (result.lastResetDate !== today) {
      timeSpentToday = 0;
      chrome.storage.local.set({
        timeSpentToday: 0,
        lastResetDate: today
      });
    } else {
      const time = result.timeSpentToday || 0;
      timeSpentToday = (typeof time === 'number' && time >= 0 && time < 86400) ? Math.floor(time) : 0;
    }

    updateTimerDisplay();
  });
}

function saveTimeSpent() {
  chrome.storage.local.set({
    timeSpentToday: timeSpentToday,
    lastResetDate: new Date().toDateString()
  });
}

function createTimer() {
  if (timerElement) return;

  timerElement = document.createElement('div');
  timerElement.id = 'fb-time-tracker';
  
  const timerText = document.createElement('div');
  timerText.className = 'timer-text';
  
  const timerLabel = document.createElement('span');
  timerLabel.className = 'timer-label';
  timerLabel.textContent = 'Time Today';
  
  const timerValue = document.createElement('span');
  timerValue.className = 'timer-value';
  timerValue.textContent = '0:00:00';
  
  timerText.appendChild(timerLabel);
  timerText.appendChild(timerValue);
  timerElement.appendChild(timerText);
  
  document.body.appendChild(timerElement);
}

function removeTimer() {
  if (timerElement) {
    timerElement.remove();
    timerElement = null;
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  if (timerElement) {
    const timeValue = timerElement.querySelector('.timer-value');
    if (timeValue) {
      timeValue.textContent = formatTime(timeSpentToday);
    }
  }
}

function startTimer() {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    if (isTabActive && settings.showTimer) {
      timeSpentToday++;
      updateTimerDisplay();

      if (timeSpentToday % 10 === 0) {
        saveTimeSpent();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    saveTimeSpent();
  }
}

document.addEventListener('visibilitychange', () => {
  isTabActive = !document.hidden;
  if (!isTabActive) {
    saveTimeSpent();
  }
});

window.addEventListener('beforeunload', () => {
  saveTimeSpent();
});

function initializeTimer() {
  if (settings.showTimer) {
    createTimer();
    loadTimeSpent();
    startTimer();
  } else {
    removeTimer();
    stopTimer();
  }
}

function applyGrayscale() {
  if (settings.grayscale) {
    document.documentElement.classList.add('fb-grayscale');
  } else {
    document.documentElement.classList.remove('fb-grayscale');
  }
}

function applyReelsHiding() {
  if (settings.reels) {
    document.documentElement.classList.add('fb-hide-reels');
  } else {
    document.documentElement.classList.remove('fb-hide-reels');
  }
}

function containsText(element, keywords) {
  try {
    const text = element.textContent || element.innerText || '';
    for (let keyword of keywords) {
      if (text.includes(keyword)) {
        return true;
      }
    }
  } catch (e) {
  }
  return false;
}

function hideContent() {
  if (settings.sponsored) {
    document.querySelectorAll('[role="article"]').forEach(article => {
      if (article.hasAttribute('data-sponsored-hidden')) return;

      const sponsoredLinks = article.querySelectorAll('a[href*="/ads/"]');
      const hasSponsored = containsText(article, ['Sponsored', 'স্পন্সরড']);

      if (sponsoredLinks.length > 0 || hasSponsored) {
        article.style.display = 'none';
        article.setAttribute('data-sponsored-hidden', 'true');
      }
    });
  }

  if (settings.reels) {
    document.querySelectorAll('*').forEach(el => {
      if (el.id === 'fb-time-tracker' || el.hasAttribute('data-fb-checked')) return;

      let hasReelsText = false;
      for (let node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (text === 'Reels' || text === 'reel') {
            hasReelsText = true;
            break;
          }
        }
      }

      if (hasReelsText) {
        let container = el;
        for (let i = 0; i < 10; i++) {
          if (!container.parentElement) break;
          container = container.parentElement;

          const role = container.getAttribute('role');
          const hasPagelet = container.hasAttribute('data-pagelet');

          if (role === 'article' || hasPagelet || container.tagName === 'SECTION') {
            container.style.display = 'none';
            container.setAttribute('data-reel-hidden', 'true');
            break;
          }
        }
      }

      el.setAttribute('data-fb-checked', 'true');
    });

    document.querySelectorAll('a[href*="/reel/"], a[href*="/reels"]').forEach(link => {
      const inNav = link.closest('[role="navigation"]') || link.closest('nav');
      
      if (inNav) {
        let navContainer = link.closest('[role="navigation"]') || link.closest('nav');
        let parent = link.parentElement;
        if (parent) {
          parent.style.display = 'none';
        }
        return;
      }

      let container = link;
      let foundArticle = false;
      
      for (let i = 0; i < 10; i++) {
        if (!container.parentElement) break;
        container = container.parentElement;

        const role = container.getAttribute('role');
        if (role === 'article') {
          foundArticle = true;
          
          const hasReelsLabel = containsText(container, ['Reels', 'reel']) && 
                                 !container.hasAttribute('data-reel-hidden');
          
          if (hasReelsLabel) {
            container.style.display = 'none';
            container.setAttribute('data-reel-hidden', 'true');
          }
          break;
        }
      }
    });
  }

  if (settings.stories) {
    document.querySelectorAll('[aria-label*="Stories"], [aria-label*="Create a story"]').forEach(el => {
      if (el.hasAttribute('data-story-hidden')) return;

      let container = el.closest('[role="region"]') || el.closest('div[data-pagelet]');
      if (container) {
        container.style.display = 'none';
        container.setAttribute('data-story-hidden', 'true');
      }
    });

    document.querySelectorAll('*').forEach(el => {
      if (el.hasAttribute('data-story-checked')) return;

      for (let node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === 'Stories') {
          let container = el;
          for (let i = 0; i < 10; i++) {
            if (!container.parentElement) break;
            container = container.parentElement;

            if (container.getAttribute('role') === 'region' || container.hasAttribute('data-pagelet')) {
              container.style.display = 'none';
              container.setAttribute('data-story-hidden', 'true');
              break;
            }
          }
          break;
        }
      }

      el.setAttribute('data-story-checked', 'true');
    });
  }

  if (settings.suggested) {
    document.querySelectorAll('[role="article"]').forEach(article => {
      if (article.hasAttribute('data-suggested-hidden')) return;

      if (containsText(article, ['Suggested for you', 'Suggested posts'])) {
        article.style.display = 'none';
        article.setAttribute('data-suggested-hidden', 'true');
      }
    });
  }

  if (settings.peopleYouMayKnow) {
    document.querySelectorAll('[role="article"]').forEach(article => {
      if (article.hasAttribute('data-pymk-hidden')) return;

      if (containsText(article, ['People you may know', 'People You May Know'])) {
        article.style.display = 'none';
        article.setAttribute('data-pymk-hidden', 'true');
      }
    });
  }

  if (!document.body.hasAttribute('data-nav-hidden')) {
    const navAreas = document.querySelectorAll('[role="navigation"], nav, [data-pagelet*="LeftRail"]');

    navAreas.forEach(navArea => {
      navArea.querySelectorAll('a').forEach(link => {
        const href = link.href || '';
        const ariaLabel = link.getAttribute('aria-label') || '';

        let shouldHide = false;

        if (settings.marketplace && href.includes('facebook.com/marketplace')) {
          shouldHide = true;
        }

        if (settings.watch && (href.includes('facebook.com/watch') || ariaLabel === 'Watch' || ariaLabel === 'Video')) {
          shouldHide = true;
        }

        if (settings.games && (href.includes('facebook.com/games') || href.includes('facebook.com/gaming') || ariaLabel === 'Gaming' || ariaLabel === 'Games')) {
          shouldHide = true;
        }

        if (shouldHide) {
          let parent = link.parentElement;
          if (parent) {
            parent.style.display = 'none';
          }
        }
      });
    });

    document.body.setAttribute('data-nav-hidden', 'true');
  }
}

function blockReelAccess() {
  if (settings.reels) {
    const currentUrl = window.location.href;
    if (currentUrl.startsWith('https://www.facebook.com/') || currentUrl.startsWith('https://facebook.com/')) {
      if (currentUrl.includes('/reel/') || currentUrl.includes('/reels/') || currentUrl.includes('/reels')) {
        window.location.replace('https://www.facebook.com/');
      }
    }
  }
}

loadSettings(() => {
  applyGrayscale();
  applyReelsHiding();
  initializeTimer();
  blockReelAccess();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideContent);
  } else {
    hideContent();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && typeof request.action === 'string' && request.action === 'updateSettings') {
    loadSettings(() => {
      applyGrayscale();
      applyReelsHiding();
      initializeTimer();
      blockReelAccess();
      location.reload();
    });
  }
  return true;
});

let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    blockReelAccess();
  }
}).observe(document, { subtree: true, childList: true });

const observer = new MutationObserver(() => {
  hideContent();
});

setTimeout(() => {
  const feedArea = document.querySelector('[role="main"]') || document.body;
  observer.observe(feedArea, {
    childList: true,
    subtree: true
  });
}, 1000);

setInterval(hideContent, 1000);

console.log('Facebook Content Hider: Active with custom settings and time tracker');