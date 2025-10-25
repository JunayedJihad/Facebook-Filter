// Facebook Content Hider with customizable options

let settings = {
  grayscale: true,
  reels: true,
  stories: true,
  marketplace: true,
  watch: true,
  games: true,
  suggested: true,
  peopleYouMayKnow: true
};

// Load settings from storage
function loadSettings(callback) {
  chrome.storage.sync.get(settings, (loadedSettings) => {
    settings = loadedSettings;
    if (callback) callback();
  });
}

// Apply grayscale
function applyGrayscale() {
  if (settings.grayscale) {
    document.documentElement.classList.add('fb-grayscale');
  } else {
    document.documentElement.classList.remove('fb-grayscale');
  }
}

function hideContent() {
  // Hide Reels
  if (settings.reels) {
    const reelsContainers = document.querySelectorAll('div[role="article"], div[data-pagelet*="FeedUnit"]');
    reelsContainers.forEach(container => {
      const text = container.innerText || container.textContent || '';
      const links = container.querySelectorAll('a');

      if (text.includes('Reels') || text.includes('reel')) {
        container.style.display = 'none';
        return;
      }

      links.forEach(link => {
        if (link.href && (link.href.includes('/reel/') || link.href.includes('/reels'))) {
          container.style.display = 'none';
        }
      });
    });

    const reelsSelectors = [
      '[aria-label*="Reels"]',
      '[aria-label*="reel" i]',
      'div[data-pagelet*="reel" i]',
      'a[href*="/reel/"]',
      'a[href*="/reels"]'
    ];

    reelsSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        let parent = el.closest('[role="article"]') ||
                     el.closest('div[data-pagelet*="FeedUnit"]') ||
                     el.closest('div[class*="userContentWrapper"]');
        if (parent) {
          parent.style.display = 'none';
        } else {
          let currentEl = el;
          for (let i = 0; i < 5; i++) {
            if (currentEl) {
              currentEl.style.display = 'none';
              currentEl = currentEl.parentElement;
            }
          }
        }
      });
    });
  }

  // Hide Stories
  if (settings.stories) {
    const storiesSelectors = [
      '[aria-label*="Stories"]',
      '[aria-label*="story" i]',
      'div[data-pagelet*="story" i]',
      'div[role="region"][aria-label*="Stories"]'
    ];

    storiesSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
      });
    });
  }

  // Hide "Suggested for you" sections
  if (settings.suggested) {
    document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]').forEach(container => {
      const text = container.innerText || container.textContent || '';
      if (text.includes('Suggested for you') || text.includes('Suggested posts')) {
        container.style.display = 'none';
      }
    });
  }

  // Hide "People you may know" sections
  if (settings.peopleYouMayKnow) {
    document.querySelectorAll('[role="article"], div[data-pagelet*="FeedUnit"]').forEach(container => {
      const text = container.innerText || container.textContent || '';
      if (text.includes('People you may know') || text.includes('People You May Know')) {
        container.style.display = 'none';
      }
    });

    // Also hide by aria-label
    document.querySelectorAll('[aria-label*="People you may know"], [aria-label*="People You May Know"]').forEach(el => {
      let parent = el.closest('[role="article"]') || el.closest('div[data-pagelet]');
      if (parent) {
        parent.style.display = 'none';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // Hide ALL navigation links based on settings
  document.querySelectorAll('a').forEach(link => {
    const href = link.href || '';
    const ariaLabel = link.getAttribute('aria-label') || '';
    const text = link.innerText || link.textContent || '';

    let shouldHide = false;

    if (settings.marketplace && (href.includes('/marketplace') || ariaLabel.toLowerCase().includes('marketplace') || text.toLowerCase().includes('marketplace'))) {
      shouldHide = true;
    }

    if (settings.watch && (href.includes('/watch') || ariaLabel.toLowerCase().includes('watch') || ariaLabel.toLowerCase().includes('video') || text.toLowerCase().includes('video'))) {
      shouldHide = true;
    }

    if (settings.games && (href.includes('/games') || href.includes('/gaming') || ariaLabel.toLowerCase().includes('gaming') || ariaLabel.toLowerCase().includes('games') || text.toLowerCase().includes('gaming') || text.toLowerCase().includes('games'))) {
      shouldHide = true;
    }

    if (shouldHide) {
      // Hide the link
      link.style.display = 'none';

      // Hide parent containers (usually the nav item wrapper)
      let parent = link.parentElement;
      for (let i = 0; i < 3; i++) {
        if (parent) {
          parent.style.display = 'none';
          parent = parent.parentElement;
        }
      }
    }
  });
}

// Initialize
loadSettings(() => {
  applyGrayscale();
  hideContent();
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    loadSettings(() => {
      applyGrayscale();
      // Reload page for changes to take effect
      location.reload();
    });
  }
});

// Run when new content is loaded
const observer = new MutationObserver(() => {
  hideContent();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Run periodically as backup
setInterval(hideContent, 1000);

console.log('Facebook Content Hider: Active with custom settings');