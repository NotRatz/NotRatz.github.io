// Test script to verify background effects
window.addEventListener('DOMContentLoaded', () => {
  console.log('Testing background effects...');
  
  // Check if background and vignette are applied
  const bodyStyles = window.getComputedStyle(document.body);
  const beforePseudo = document.styleSheets[0].cssRules[Array.from(document.styleSheets[0].cssRules).findIndex(r => r.selectorText === 'body::before')];
  const afterPseudo = document.styleSheets[0].cssRules[Array.from(document.styleSheets[0].cssRules).findIndex(r => r.selectorText === 'body::after')];
  
  console.log('Body background:', bodyStyles.background);
  console.log('Before pseudo-element (blurred background):', beforePseudo ? 'Applied' : 'Missing');
  console.log('After pseudo-element (vignette):', afterPseudo ? 'Applied' : 'Missing');
  
  const testEl = document.createElement('div');
  testEl.style.position = 'fixed';
  testEl.style.bottom = '10px';
  testEl.style.right = '10px';
  testEl.style.padding = '10px';
  testEl.style.background = 'rgba(0,0,0,0.7)';
  testEl.style.color = '#fff';
  testEl.style.borderRadius = '4px';
  testEl.style.fontFamily = 'monospace';
  testEl.style.zIndex = '9999';
  testEl.textContent = 'Background Effects: ' + (beforePseudo && afterPseudo ? 'WORKING ✓' : 'ISSUE ✗');
  
  document.body.appendChild(testEl);
  
  setTimeout(() => {
    document.body.removeChild(testEl);
  }, 5000);
});