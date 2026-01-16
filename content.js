// Content script for Brave Dev Tool

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'inspect') {
    // Enable element inspection mode
    enableInspectMode();
    sendResponse({ success: true });
  } else if (request.action === 'network') {
    // Log network information
    logNetworkInfo();
    sendResponse({ success: true });
  }
  return true;
});

// Inspect mode state
let inspectModeActive = false;
let inspectStyle = null;
let currentHighlightedElement = null;

// Enable inspect mode
function enableInspectMode() {
  if (inspectModeActive) {
    disableInspectMode();
    return;
  }
  
  inspectModeActive = true;
  
  // Add visual indicator style (only once)
  if (!inspectStyle) {
    inspectStyle = document.createElement('style');
    inspectStyle.id = 'brave-dev-inspect-style';
    inspectStyle.textContent = `
      .brave-dev-inspect {
        outline: 3px solid #667eea !important;
        outline-offset: 2px !important;
        cursor: crosshair !important;
        background-color: rgba(102, 126, 234, 0.1) !important;
      }
      .brave-dev-inspect-hint {
        position: fixed;
        top: 10px;
        right: 10px;
        background: #667eea;
        color: white;
        padding: 10px 15px;
        border-radius: 6px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        z-index: 999998;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
    `;
    document.head.appendChild(inspectStyle);
  }
  
  // Add event listeners
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleEscape, true);
  
  console.log('%c🔍 Brave Dev Tool: Inspect Mode Active', 'color: #667eea; font-size: 14px; font-weight: bold;');
  console.log('Hover over elements to highlight them, click to inspect, press ESC to exit');
}

// Disable inspect mode
function disableInspectMode() {
  if (!inspectModeActive) return;
  
  inspectModeActive = false;
  
  // Remove event listeners
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleEscape, true);
  
  // Remove all highlights
  document.querySelectorAll('.brave-dev-inspect').forEach(el => {
    el.classList.remove('brave-dev-inspect');
  });
  
  // Remove hint
  const hint = document.getElementById('brave-dev-inspect-hint');
  if (hint) hint.remove();
  
  currentHighlightedElement = null;
  
  console.log('Brave Dev Tool: Inspect mode disabled');
}

function handleMouseOver(e) {
  // Skip if clicking on hint
  if (e.target.closest('.brave-dev-inspect-hint')) return;
  
  // Remove previous highlight
  if (currentHighlightedElement) {
    currentHighlightedElement.classList.remove('brave-dev-inspect');
  }
  
  // Add highlight to current element
  currentHighlightedElement = e.target;
  currentHighlightedElement.classList.add('brave-dev-inspect');
  
  // Show element info hint
  showElementHint(e.target);
  
  e.stopPropagation();
}

function handleMouseOut(e) {
  if (currentHighlightedElement && currentHighlightedElement === e.target) {
    currentHighlightedElement.classList.remove('brave-dev-inspect');
    currentHighlightedElement = null;
  }
  e.stopPropagation();
}

function showElementHint(element) {
  // Remove existing hint
  let hint = document.getElementById('brave-dev-inspect-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'brave-dev-inspect-hint';
    hint.className = 'brave-dev-inspect-hint';
    document.body.appendChild(hint);
  }
  
  // Get element info
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = element.className && typeof element.className === 'string' 
    ? `.${element.className.split(' ').filter(c => c).join('.')}` 
    : '';
  const selector = `${tag}${id}${classes}`.substring(0, 50);
  
  hint.textContent = `Click to inspect: ${selector}`;
}

function handleClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target;
  
  // Get detailed element info
  const elementInfo = {
    tag: element.tagName.toLowerCase(),
    id: element.id || '(no id)',
    classes: element.className || '(no classes)',
    text: element.textContent?.trim().substring(0, 100) || '(no text)',
    attributes: {}
  };
  
  // Get all attributes
  if (element.attributes) {
    Array.from(element.attributes).forEach(attr => {
      elementInfo.attributes[attr.name] = attr.value;
    });
  }
  
  // Log to console with nice formatting
  console.group('%c🔍 Brave Dev Tool: Element Inspected', 'color: #667eea; font-size: 14px; font-weight: bold;');
  console.log('Tag:', elementInfo.tag);
  console.log('ID:', elementInfo.id);
  console.log('Classes:', elementInfo.classes);
  console.log('Text:', elementInfo.text);
  console.log('Attributes:', elementInfo.attributes);
  console.log('Element:', element);
  console.groupEnd();
  
  // Copy selector to clipboard (if possible)
  try {
    const selector = generateSelector(element);
    navigator.clipboard.writeText(selector).then(() => {
      console.log(`%c✓ Selector copied: ${selector}`, 'color: #48bb78;');
    }).catch(() => {
      // Clipboard access might fail, that's okay
    });
  } catch (err) {
    // Ignore clipboard errors
  }
  
  // Disable inspect mode after clicking
  disableInspectMode();
}

function handleEscape(e) {
  if (e.key === 'Escape' && inspectModeActive) {
    disableInspectMode();
  }
}

// Generate CSS selector for element
function generateSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  let selector = element.tagName.toLowerCase();
  
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c);
    if (classes.length > 0) {
      selector += '.' + classes.join('.');
    }
  }
  
  // Add nth-child if needed for uniqueness
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(el => 
      el.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      selector += `:nth-child(${index})`;
    }
  }
  
  return selector;
}

// Log network information
function logNetworkInfo() {
  if (!window.performance || !window.performance.getEntriesByType) {
    console.log('%c⚠️ Brave Dev Tool: Performance API not available', 'color: #f56565; font-size: 14px;');
    console.log('Open DevTools Network tab (F12) for detailed network monitoring');
    return;
  }

  const resources = window.performance.getEntriesByType('resource');
  const navigation = window.performance.getEntriesByType('navigation')[0];
  
  console.log('%c🌐 Brave Dev Tool: Network Monitor', 'color: #667eea; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(60));
  
  // Page load info
  if (navigation) {
    console.group('%c📄 Page Load Performance', 'color: #48bb78; font-size: 14px; font-weight: bold;');
    console.log('URL:', navigation.name);
    console.log('Load Time:', `${navigation.loadEventEnd - navigation.fetchStart}ms`);
    console.log('DOM Content Loaded:', `${navigation.domContentLoadedEventEnd - navigation.fetchStart}ms`);
    console.log('Time to First Byte:', `${navigation.responseStart - navigation.fetchStart}ms`);
    console.groupEnd();
  }
  
  // Network resources
  if (resources.length === 0) {
    console.log('%cNo network resources found', 'color: #999;');
    console.log('Tip: Refresh the page to see network requests');
  } else {
    console.group(`%c📦 Network Resources (${resources.length} total)`, 'color: #667eea; font-size: 14px; font-weight: bold;');
    
    // Group by type
    const byType = {};
    let totalSize = 0;
    let totalDuration = 0;
    
    resources.forEach((resource) => {
      const type = resource.initiatorType || 'other';
      if (!byType[type]) {
        byType[type] = [];
      }
      byType[type].push(resource);
      
      if (resource.transferSize) totalSize += resource.transferSize;
      totalDuration += resource.duration;
    });
    
    // Show summary
    console.log('%c📊 Summary', 'color: #48bb78; font-weight: bold;');
    console.table({
      'Total Resources': resources.length,
      'Total Size': `${(totalSize / 1024).toFixed(2)} KB`,
      'Total Duration': `${totalDuration.toFixed(2)} ms`,
      'Average Size': `${(totalSize / resources.length / 1024).toFixed(2)} KB`,
      'Average Duration': `${(totalDuration / resources.length).toFixed(2)} ms`
    });
    
    // Show by type
    Object.keys(byType).sort().forEach(type => {
      const items = byType[type];
      const typeSize = items.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const typeDuration = items.reduce((sum, r) => sum + r.duration, 0);
      
      console.group(`%c${type} (${items.length})`, 'color: #667eea;');
      console.log(`Total: ${(typeSize / 1024).toFixed(2)} KB | ${typeDuration.toFixed(2)} ms`);
      
      // Show top 5 largest
      const sorted = [...items].sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0));
      const top5 = sorted.slice(0, 5);
      
      if (top5.length > 0) {
        console.log('%cTop 5 Largest:', 'font-weight: bold;');
        top5.forEach((resource, index) => {
          const url = new URL(resource.name);
          const filename = url.pathname.split('/').pop() || url.hostname;
          const size = resource.transferSize ? `${(resource.transferSize / 1024).toFixed(2)} KB` : 'N/A';
          const duration = `${resource.duration.toFixed(2)} ms`;
          const status = resource.responseStatus || 'N/A';
          
          console.log(`  ${index + 1}. ${filename}`);
          console.log(`     Size: ${size} | Duration: ${duration} | Status: ${status}`);
          console.log(`     URL: ${resource.name.substring(0, 80)}${resource.name.length > 80 ? '...' : ''}`);
        });
      }
      console.groupEnd();
    });
    
    // Show all resources in a table
    console.group('%c📋 All Resources', 'color: #667eea; font-weight: bold;');
    const tableData = resources.map((resource) => {
      const url = new URL(resource.name);
      return {
        'Type': resource.initiatorType || 'other',
        'File': url.pathname.split('/').pop() || url.hostname,
        'Size': resource.transferSize ? `${(resource.transferSize / 1024).toFixed(2)} KB` : 'N/A',
        'Duration': `${resource.duration.toFixed(2)} ms`,
        'Status': resource.responseStatus || 'N/A',
        'URL': resource.name
      };
    });
    console.table(tableData);
    console.groupEnd();
    
    console.groupEnd();
  }
  
  // Performance tips
  console.log('%c💡 Tips:', 'color: #fbbf24; font-weight: bold;');
  console.log('• Open DevTools Network tab (F12) for real-time monitoring');
  console.log('• Check for large files that could be optimized');
  console.log('• Look for slow requests (>1000ms)');
  console.log('• Consider lazy loading images and scripts');
  console.log('='.repeat(60));
}
