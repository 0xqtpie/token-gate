
import { chromium } from 'playwright';
import path from 'path';

async function verifyDesign() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 600 },
    deviceScaleFactor: 2
  });
  
  // 1. Verify Popup
  const page = await context.newPage();
  const popupPath = path.resolve('packages/extension/popup.html');
  await page.goto(`file://${popupPath}`);
  
  // Inject mock state
  await page.evaluate(() => {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
    
    // Set progress
    document.getElementById('progress-percentage').textContent = '65%';
    document.getElementById('progress-fill').style.width = '65%';
    
    // Set stats
    document.getElementById('current-tokens').textContent = '32,500';
    document.getElementById('threshold-tokens').textContent = '50,000';
    
    // Set status
    const status = document.getElementById('status-indicator');
    status.classList.add('connected');
    status.querySelector('.status-text').textContent = 'ONLINE';
    
    // Inject breakdown
    const breakdown = document.getElementById('breakdown');
    breakdown.innerHTML = `
      <div class="breakdown-header">
        <span>SOURCE_DATA</span>
        <span>TOKENS</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-name">CLAUDE_CODE</span>
        <span class="breakdown-tokens">18,200</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-name">OPEN_CODE</span>
        <span class="breakdown-tokens">12,100</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-name">CODEX_BETA</span>
        <span class="breakdown-tokens">2,200</span>
      </div>
    `;
  });

  await page.screenshot({ path: 'packages/extension/.aesthetic-loop/snapshots/latest-popup.png', fullPage: true });
  console.log('Popup screenshot captured');

  // 2. Verify Options
  const pageOptions = await context.newPage();
  const optionsPath = path.resolve('packages/extension/options.html');
  await pageOptions.goto(`file://${optionsPath}`);
  
  // Set viewport for desktop feel
  await pageOptions.setViewportSize({ width: 1000, height: 800 });
  
  await pageOptions.evaluate(() => {
    // Mock domain list
    const container = document.getElementById("domain-list");
    container.innerHTML = `
      <div class="domain-tag">
        <span>twitter.com</span>
        <button class="remove-btn">×</button>
      </div>
      <div class="domain-tag">
        <span>reddit.com</span>
        <button class="remove-btn">×</button>
      </div>
      <div class="domain-tag">
        <span>youtube.com</span>
        <button class="remove-btn">×</button>
      </div>
    `;
  });

  await pageOptions.screenshot({ path: 'packages/extension/.aesthetic-loop/snapshots/latest-settings.png', fullPage: true });
  console.log('Options screenshot captured');

  await browser.close();
}

verifyDesign().catch(console.error);
