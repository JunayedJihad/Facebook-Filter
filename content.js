// Facebook Content Hider with customizable options and time tracker

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

// Timer variables
let timeSpentToday = 0;
let timerInterval = null;
let timerElement = null;
let isTabActive = true;

// Load settings from storage
function loadSettings(callback) {
  chrome.storage.sync.get(settings, (loadedSettings) => {
    settings = loadedSettings;
    if (callback) callback();
  });
}

// Load time spent from storage
function loadTimeSpent() {
  chrome.storage.local.get(['timeSpentToday', 'lastResetDate'], (result) => {
    const today = new Date().toDateString();

    // Reset if it's a new day
    if (result.lastResetDate !== today) {
      timeSpentToday = 0;
      chrome.storage.local.set({
        timeSpentToday: 0,
        lastResetDate: today
      });
    } else {
      timeSpentToday = result.timeSpentToday || 0;
    }

    updateTimerDisplay();
  });
}

// Save time spent to storage
function saveTimeSpent() {
  chrome.storage.local.set({
    timeSpentToday: timeSpentToday,
    lastResetDate: new Date().toDateString()
  });
}

// Create timer element
function createTimer() {
  if (timerElement) return;

  timerElement = document.createElement('div');
  timerElement.id = 'fb-time-tracker';
  timerElement.innerHTML = `
    <div class="timer-text">
      <span class="timer-label">Time Today</span>
      <span class="timer-value">0:00:00</span>
    </div>
  `;
  document.body.appendChild(timerElement);
}

// Remove timer element
function removeTimer() {
  if (timerElement) {
    timerElement.remove();
    timerElement = null;
  }
}

// Format seconds to HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update timer display
function updateTimerDisplay() {
  if (timerElement) {
    const timeValue = timerElement.querySelector('.timer-value');
    if (timeValue) {
      timeValue.textContent = formatTime(timeSpentToday);
    }
  }
}

// Start timer
function startTimer() {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    if (isTabActive && settings.showTimer) {
      timeSpentToday++;
      updateTimerDisplay();

      // Save every 10 seconds
      if (timeSpentToday % 10 === 0) {
        saveTimeSpent();
      }
    }
  }, 1000);
}

// Stop timer
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    saveTimeSpent();
  }
}

// Handle visibility change
document.addEventListener('visibilitychange', () => {
  isTabActive = !document.hidden;
  if (!isTabActive) {
    saveTimeSpent();
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  saveTimeSpent();
});

// Initialize timer
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

// Apply grayscale
function applyGrayscale() {
  if (settings.grayscale) {
    document.documentElement.classList.add('fb-grayscale');
  } else {
    document.documentElement.classList.remove('fb-grayscale');
  }
}

// Apply CSS class for hiding reels
function applyReelsHiding() {
  if (settings.reels) {
    document.documentElement.classList.add('fb-hide-reels');
  } else {
    document.documentElement.classList.remove('fb-hide-reels');
  }
}

// Check if element contains text
function containsText(element, keywords) {
  try {
    const text = element.textContent || element.innerText || '';
    for (let keyword of keywords) {
      if (text.includes(keyword)) {
        return true;
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return false;
}

function hideContent() {
  // Hide Sponsored Posts
  if (settings.sponsored) {
    document.querySelectorAll('[role="article"]').forEach(article => {
      if (article.hasAttribute('data-sponsored-hidden')) return;

      // Look for "Sponsored" text in the post
      const sponsoredLinks = article.querySelectorAll('a[href*="/ads/"]');
      const hasSponsored = containsText(article, ['Sponsored', 'স্পন্সরড']);

      if (sponsoredLinks.length > 0 || hasSponsored) {
        article.style.display = 'none';
        article.setAttribute('data-sponsored-hidden', 'true');
      }
    });
  }

  // Hide Reels section with JavaScript as backup to CSS
  if (settings.reels) {
    // Find and hide all elements that contain "Reels" text exactly
    document.querySelectorAll('*').forEach(el => {
      // Skip if already processed or if it's our timer
      if (el.id === 'fb-time-tracker' || el.hasAttribute('data-fb-checked')) return;

      // Check direct text content only (not nested)
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
        // Find parent container
        let container = el;
        for (let i = 0; i < 10; i++) {
          if (!container.parentElement) break;
          container = container.parentElement;

          // Check if this is a major container
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

    // Hide any link to reels
    document.querySelectorAll('a[href*="/reel/"], a[href*="/reels"]').forEach(link => {
      let container = link;
      for (let i = 0; i < 10; i++) {
        if (!container.parentElement) break;
        container = container.parentElement;

        const role = container.getAttribute('role');
        if (role === 'article' || container.hasAttribute('data-pagelet')) {
          if (!container.hasAttribute('data-reel-hidden')) {
            container.style.display = 'none';
            container.setAttribute('data-reel-hidden', 'true');
          }
          break;
        }
      }
    });
  }

  // Hide Stories
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

  // Hide "Suggested for you" posts
  if (settings.suggested) {
    document.querySelectorAll('[role="article"]').forEach(article => {
      if (article.hasAttribute('data-suggested-hidden')) return;

      if (containsText(article, ['Suggested for you', 'Suggested posts'])) {
        article.style.display = 'none';
        article.setAttribute('data-suggested-hidden', 'true');
      }
    });
  }

  // Hide "People you may know" sections
  if (settings.peopleYouMayKnow) {
    document.querySelectorAll('[role="article"]').forEach(article => {
      if (article.hasAttribute('data-pymk-hidden')) return;

      if (containsText(article, ['People you may know', 'People You May Know'])) {
        article.style.display = 'none';
        article.setAttribute('data-pymk-hidden', 'true');
      }
    });
  }

  // Hide navigation items
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

// Initialize
loadSettings(() => {
  applyGrayscale();
  applyReelsHiding();
  initializeTimer();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideContent);
  } else {
    hideContent();
  }
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    loadSettings(() => {
      applyGrayscale();
      applyReelsHiding();
      initializeTimer();
      location.reload();
    });
  }
});

// More aggressive observer
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

// Run frequently
setInterval(hideContent, 1000);

console.log('Facebook Content Hider: Active with custom settings and time tracker');