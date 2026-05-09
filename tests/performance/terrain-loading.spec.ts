import { test, expect } from '@playwright/test';

test.describe('Terrain and 3D Tiles Loading Performance', () => {
  test('measures time and tracks 3D tiles loading progress', async ({
    page,
  }) => {
    // Check token before start
    const token = process.env.VITE_CESIUM_TOKEN;
    if (!token) {
      console.warn(
        '[Test] VITE_CESIUM_TOKEN is missing. Skipping 3D tiles test.',
      );
      test.skip(!token, 'VITE_CESIUM_TOKEN missing. Skip 3D tile test.');
      return;
    }

    const tilesetRequests: string[] = [];
    const failedRequests: string[] = [];
    const consoleErrors: string[] = [];
    let loadedTileCount = 0;

    // 1. Track network requests for tileset metadata
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('tileset.json')) {
        tilesetRequests.push(url);
        const hasToken = url.includes('access_token=');
        console.log(
          `[Test] Detected tileset request. Has access_token: ${hasToken}`,
        );
        if (!hasToken) {
          console.error(
            `[Test] CRITICAL: tileset.json requested WITHOUT access_token! URL: ${url}`,
          );
        }
      }
    });

    // Track failed requests
    page.on('requestfailed', (request) => {
      const url = request.url();
      failedRequests.push(`${url}: ${request.failure()?.errorText}`);
      if (url.includes('tileset.json')) {
        console.error(`[Test] Tileset request FAILED: ${url}`);
      }
    });

    // Track response status for ANY request to catch early auth failures
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();

      if (url.includes('tileset.json')) {
        console.log(
          `[Test] Tileset response: ${status} for ${url.split('?')[0]}`,
        );
        if (!response.ok()) {
          failedRequests.push(`Tileset failed: ${url} (Status: ${status})`);
        }
      }

      // Catch any Cesium auth failures (endpoint or tiles)
      if (status === 401 || status === 403) {
        failedRequests.push(`Auth Failure [${status}]: ${url}`);
        console.error(`[Test] AUTH FAILURE [${status}] on: ${url}`);
      }
    });

    // 2. Track console logs and errors
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();

      // Log to terminal immediately for easier debugging
      if (type === 'error') {
        console.error(`[Browser Error] ${text}`);
        consoleErrors.push(text);
      } else {
        // Log all relevant app logs
        if (text.includes('[Tiles3DLayer]') || text.includes('[Terrain]')) {
          console.log(`[Browser Log] ${text}`);
        }
      }

      if (text.includes('[Tiles3DLayer] Tiles loaded:')) {
        const match = text.match(/Tiles loaded: (\d+)/);
        if (match) {
          loadedTileCount = parseInt(match[1], 10);
        }
      }
    });

    // Go to the app
    await page.goto('http://localhost:5173/');

    // Wait for the map to be ready
    console.log('[Test] Waiting for map container...');
    await page.waitForSelector('.maplibregl-canvas', { state: 'visible' });

    // Check for early 401s (endpoint fetch happens on mount)
    await page.waitForTimeout(3000);
    if (
      failedRequests.some((req) => req.includes('401') || req.includes('403'))
    ) {
      test.skip(
        true,
        `Cesium authentication failed early. Requests:\n${failedRequests.join('\n')}`,
      );
      return;
    }

    // Locator for the Terrain button
    const terrainBtn = page
      .locator(
        '.maplibregl-ctrl-terrain, button[title*="Terrain" i], button[aria-label*="Terrain" i]',
      )
      .first();

    console.log('[Test] Checking Terrain toggle state...');
    try {
      await expect(terrainBtn).toBeVisible({ timeout: 20000 });

      const btnText = await terrainBtn.innerText();
      const isAlreadyActive =
        btnText.toLowerCase().includes('disable') ||
        (await terrainBtn.getAttribute('class'))?.includes('active');

      if (isAlreadyActive) {
        console.log(
          '[Test] Terrain already active. Proceeding to measure load.',
        );
      } else {
        console.log('[Test] Clicking Terrain toggle to enable...');
        await terrainBtn.click();
      }
    } catch (e) {
      if (failedRequests.length > 0) {
        test.skip(true, `Failed due to network errors: ${failedRequests[0]}`);
        return;
      }
      throw e;
    }

    const startTime = Date.now();

    // 3. Wait for tileset metadata to be fetched
    console.log('[Test] Waiting for tileset.json request...');
    try {
      const response = await page.waitForResponse(
        (response) => response.url().includes('tileset.json'),
        { timeout: 30000 },
      );
      console.log(`[Test] Tileset response received: ${response.status()}`);
    } catch (e) {
      console.warn(
        '[Test] Tileset metadata timeout. Request count so far:',
        tilesetRequests.length,
      );
    }

    // 4. Wait for tiles to start loading.
    // Give it 10 seconds to load actual 3D content
    console.log('[Test] Waiting for 3D data throughput...');
    await page.waitForTimeout(10000);

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log('--------------------------------------------------');
    console.log(`[Result] Performance Metrics:`);
    console.log(`- Time elapsed: ${loadTime}ms`);
    console.log(`- Tileset requests: ${tilesetRequests.length}`);
    console.log(`- Failed requests: ${failedRequests.length}`);
    console.log(`- Console errors: ${consoleErrors.length}`);
    console.log(`- 3D Tiles reported loaded: ${loadedTileCount}`);
    console.log('--------------------------------------------------');

    // Validation
    expect(
      failedRequests,
      `Detected ${failedRequests.length} failed requests:\n${failedRequests.join('\n')}`,
    ).toHaveLength(0);
    expect(
      consoleErrors,
      `Detected ${consoleErrors.length} console errors:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0);
    expect(tilesetRequests.length).toBeGreaterThan(0);
  });
});
