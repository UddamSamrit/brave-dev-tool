// Get current tab information
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// Show copy feedback
function showCopyFeedback(element) {
  const originalText = element.textContent;
  element.textContent = '✓ Copied!';
  element.classList.add('copied');
  
  setTimeout(() => {
    element.textContent = originalText;
    element.classList.remove('copied');
  }, 1500);
}

// Update page info
async function updatePageInfo() {
  const tab = await getCurrentTab();
  
  const urlElement = document.getElementById('current-url');
  const titleElement = document.getElementById('page-title');
  
  if (tab.url) {
    urlElement.textContent = tab.url;
    urlElement.addEventListener('click', async () => {
      const success = await copyToClipboard(tab.url);
      if (success) {
        showCopyFeedback(urlElement);
      }
    });
  }
  
  if (tab.title) {
    titleElement.textContent = tab.title;
    titleElement.addEventListener('click', async () => {
      const success = await copyToClipboard(tab.title);
      if (success) {
        showCopyFeedback(titleElement);
      }
    });
  }
}

// Refresh current page
document.getElementById('refresh-btn').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  chrome.tabs.reload(tab.id);
  window.close();
});

// Open console - show instructions and log helpful info
document.getElementById('console-btn').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  
  try {
    // Inject script to log helpful info
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        console.log('%c🔧 Brave Dev Tool', 'color: #667eea; font-size: 16px; font-weight: bold;');
        console.log('%cConsole is ready!', 'color: #48bb78; font-size: 14px;');
        console.log('Press F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows) to open DevTools');
        console.log('Or right-click → Inspect');
        console.log('---');
        
        // Show visual notification on page
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #667eea;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          z-index: 999999;
          font-family: Arial, sans-serif;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          pointer-events: none;
          max-width: 300px;
        `;
        notification.innerHTML = `
          <strong>🔧 Console Helper</strong><br>
          Press <strong>F12</strong> to open DevTools<br>
          <small>Mac: Cmd+Option+I | Win/Linux: Ctrl+Shift+I</small>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transition = 'opacity 0.3s';
          setTimeout(() => notification.remove(), 300);
        }, 4000);
      }
    });
  } catch (error) {
    console.error('Error executing script:', error);
    // Fallback: just show alert
    alert('Press F12 to open DevTools!\n\nMac: Cmd+Option+I\nWindows/Linux: Ctrl+Shift+I');
  }
  
  window.close();
});

// Clear storage
document.getElementById('clear-storage-btn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all storage?')) {
    await chrome.storage.local.clear();
    alert('Storage cleared!');
  }
});

// Inspect element (send message to content script)
document.getElementById('inspect-btn').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  
  // Check if we can access the tab
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('brave://')) {
    alert('Inspect element is not available on this page.\n\nTry on a regular website (http:// or https://).');
    return;
  }
  
  try {
    // First, try to send message to content script
    let response;
    try {
      response = await chrome.tabs.sendMessage(tab.id, { action: 'inspect' });
    } catch (msgError) {
      // If content script isn't loaded, inject it first
      console.log('Content script not loaded, injecting...');
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      // Wait a bit for script to load
      await new Promise(resolve => setTimeout(resolve, 100));
      response = await chrome.tabs.sendMessage(tab.id, { action: 'inspect' });
    }
    
    if (response && response.success) {
      // Show notification
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
          `;
          notification.textContent = '🔍 Inspect mode active! Hover over elements and click to inspect. Press ESC to exit.';
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
          }, 4000);
        }
      });
    }
  } catch (error) {
    console.error('Error enabling inspect mode:', error);
    alert('Inspect mode enabled! Hover over elements on the page and click to inspect them.\n\nOpen console (F12) to see element details.\n\nPress ESC to exit inspect mode.');
  }
  
  window.close();
});

// Network monitor
document.getElementById('network-btn').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'network' });
    
    if (response && response.success) {
      // Show notification
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
          `;
          notification.textContent = '🌐 Network info logged to console! Press F12 to view.';
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
          }, 3000);
        }
      });
    }
  } catch (error) {
    console.error('Error getting network info:', error);
    alert('Network info logged to console!\n\nPress F12 to open DevTools and check the console.');
  }
  
  window.close();
});

// Expand collapsed sections
document.getElementById('expand-sections-btn').addEventListener('click', async () => {
  const tab = await getCurrentTab();
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Open only the closed sections (click buttons that have chevron-down)
        const buttons = document.querySelectorAll('button[aria-label*="Expand/collapse"]');
        let closedCount = 0;

        buttons.forEach((btn, index) => {
          const chevron = btn.querySelector('span[class*="chevron-down"]');
          if (chevron) {
            setTimeout(() => {
              btn.click();
              closedCount++;
            }, index * 20);
          }
        });

        setTimeout(() => {
          console.log(`Opened ${closedCount} closed sections`);
          
          // Show notification
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
          `;
          notification.textContent = `📂 Opened ${closedCount} collapsed sections`;
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
          }, 3000);
        }, 500);
      }
    });
  } catch (error) {
    console.error('Error expanding sections:', error);
    alert('Error expanding sections. Make sure you\'re on a page with collapsible sections.');
  }
  
  window.close();
});

// Initialize
updatePageInfo();
