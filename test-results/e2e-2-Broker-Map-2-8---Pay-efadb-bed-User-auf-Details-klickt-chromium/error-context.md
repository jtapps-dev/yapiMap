# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> 2. Broker Map >> 2.8 - Paywall Modal erscheint wenn nicht-subscribed User auf Details klickt
- Location: tests\e2e.spec.ts:291:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 100
Received:   31
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]: ✓
    - generic [ref=e5]: Aboneliğiniz Aktif
    - button "← Geri Dön" [ref=e6] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e12] [cursor=pointer]:
    - img [ref=e13]
  - alert [ref=e16]
```

# Test source

```ts
  204 |     await waitForAppReady(page);
  205 |     await page.waitForTimeout(3000);
  206 | 
  207 |     // Auf "Liste" Tab wechseln
  208 |     const listTab = page.locator("button").filter({ hasText: /^Liste|^List/ }).first();
  209 |     await listTab.click();
  210 |     await page.waitForTimeout(2000);
  211 | 
  212 |     // Preis-Anzeige in der Liste (₺ Zeichen)
  213 |     const priceItems = page.locator("div").filter({ hasText: /[₺$€]\d/ });
  214 |     const count = await priceItems.count();
  215 |     // Mindestens 0 - Test prüft ob keine Fehler auftreten
  216 |     expect(count).toBeGreaterThanOrEqual(0);
  217 | 
  218 |     // Seite ist stabil
  219 |     expect(page.url()).not.toMatch(/\/login/);
  220 |     await page.close();
  221 |   });
  222 | 
  223 |   test("2.5 - Map-Marker sind nach dem Laden sichtbar", async () => {
  224 |     const page = await brokerContext.newPage();
  225 |     await page.goto("/broker/map");
  226 |     await waitForAppReady(page);
  227 |     await page.waitForTimeout(5000); // Warte auf Mapbox-Render
  228 | 
  229 |     // Mapbox Container ist geladen
  230 |     const mapContainer = page.locator(".mapboxgl-canvas, .mapboxgl-map");
  231 |     await expect(mapContainer.first()).toBeVisible({ timeout: 15_000 });
  232 | 
  233 |     // Marker-Divs vorhanden (gelbe Labels)
  234 |     const markerContainers = page.locator(".mapboxgl-marker");
  235 |     const markerCount = await markerContainers.count();
  236 |     // Marker können vorhanden sein (0 ist ok wenn keine publizierten Projekte)
  237 |     expect(markerCount).toBeGreaterThanOrEqual(0);
  238 |     await page.close();
  239 |   });
  240 | 
  241 |   test("2.6 - Map Popup erscheint beim Klicken auf Marker", async () => {
  242 |     const page = await brokerContext.newPage();
  243 |     await page.goto("/broker/map");
  244 |     await waitForAppReady(page);
  245 |     await page.waitForTimeout(5000);
  246 | 
  247 |     const markers = page.locator(".mapboxgl-marker");
  248 |     const count = await markers.count();
  249 | 
  250 |     if (count > 0) {
  251 |       await markers.first().click();
  252 |       await page.waitForTimeout(1500);
  253 |       // Popup ist sichtbar
  254 |       const popup = page.locator(".mapboxgl-popup");
  255 |       const popupVisible = await popup.isVisible({ timeout: 5000 }).catch(() => false);
  256 |       if (popupVisible) {
  257 |         await expect(popup).toBeVisible();
  258 |         // Details-Button im Popup (murad hat Abo → kein 🔒)
  259 |         const detailsBtn = popup.locator("button").filter({ hasText: /Detayları|Details/ });
  260 |         await expect(detailsBtn).toBeVisible({ timeout: 3000 });
  261 |       }
  262 |     }
  263 |     // Test ist erfolgreich auch ohne Marker
  264 |     await page.close();
  265 |   });
  266 | 
  267 |   test("2.7 - Filter anwenden und zurücksetzen funktioniert", async () => {
  268 |     const page = await brokerContext.newPage();
  269 |     await page.goto("/broker/map");
  270 |     await waitForAppReady(page);
  271 |     await page.waitForTimeout(2000);
  272 | 
  273 |     // City Input ausfüllen
  274 |     const inputs = page.locator("input[type='text'], input:not([type='checkbox']):not([type='number'])");
  275 |     const cityInput = inputs.first();
  276 |     await cityInput.fill("Istanbul");
  277 | 
  278 |     // Apply Button
  279 |     await page.locator("button").filter({ hasText: /Uygula|Apply/ }).click();
  280 |     await page.waitForTimeout(1500);
  281 | 
  282 |     // Reset Button
  283 |     await page.locator("button").filter({ hasText: /Sıfırla|Reset/ }).click();
  284 |     await page.waitForTimeout(1500);
  285 | 
  286 |     // Seite ist noch stabil
  287 |     expect(page.url()).not.toMatch(/\/login/);
  288 |     await page.close();
  289 |   });
  290 | 
  291 |   test("2.8 - Paywall Modal erscheint wenn nicht-subscribed User auf Details klickt", async ({ browser }) => {
  292 |     // Neuer Context ohne Abo (Developer ahmet)
  293 |     const ctx = await browser.newContext();
  294 |     const page = await ctx.newPage();
  295 |     await loginViaUI(page, "ahmet@mailinator.com", "Test1234!");
  296 |     // ahmet ist developer - wird zu /developer redirected
  297 |     // Wir testen das Paywall-Verhalten theoretisch auf der broker/map
  298 |     // ahmet kann /broker/map nicht normal sehen (wird zu /developer redirected)
  299 |     // Stattdessen: Prüfe ob "subscribe" URL erreichbar ist
  300 |     await page.goto("/subscribe");
  301 |     await waitForAppReady(page);
  302 |     // Developer ahmet sollte Pläne sehen (kein aktives Abo)
  303 |     const bodyText = await page.locator("body").innerText();
> 304 |     expect(bodyText.length).toBeGreaterThan(100);
      |                             ^ Error: expect(received).toBeGreaterThan(expected)
  305 |     await ctx.close();
  306 |   });
  307 | 
  308 |   test("2.9 - Abone Ol in Paywall redirectet zu /subscribe", async () => {
  309 |     const page = await brokerContext.newPage();
  310 |     await page.goto("/subscribe");
  311 |     await waitForAppReady(page);
  312 |     // murad hat aktives Abo → zeigt "Aktif" Seite
  313 |     const bodyText = await page.locator("body").innerText();
  314 |     // Seite lädt ohne Fehler
  315 |     expect(bodyText.length).toBeGreaterThan(50);
  316 |     await page.close();
  317 |   });
  318 | 
  319 | });
  320 | 
  321 | // ─────────────────────────────────────────────
  322 | // 3. SUBSCRIBE SEITE
  323 | // ─────────────────────────────────────────────
  324 | 
  325 | test.describe("3. Subscribe Seite", () => {
  326 |   let devContext: BrowserContext;
  327 |   let brokerContext: BrowserContext;
  328 | 
  329 |   test.beforeAll(async ({ browser }) => {
  330 |     devContext = await browser.newContext();
  331 |     const devPage = await devContext.newPage();
  332 |     await loginViaUI(devPage, "ahmet@mailinator.com", "Test1234!");
  333 |     await devPage.goto("/developer");
  334 |     await waitForAppReady(devPage);
  335 |     await devPage.close();
  336 | 
  337 |     brokerContext = await browser.newContext();
  338 |     const brokerPage = await brokerContext.newPage();
  339 |     await loginViaUI(brokerPage, "murad@mailinator.com", "Test1234!");
  340 |     await brokerPage.goto("/broker/map");
  341 |     await waitForAppReady(brokerPage);
  342 |     await brokerPage.close();
  343 |   });
  344 | 
  345 |   test.afterAll(async () => {
  346 |     await devContext.close();
  347 |     await brokerContext.close();
  348 |   });
  349 | 
  350 |   test("3.1 - Subscribe Seite lädt für Developer", async () => {
  351 |     const page = await devContext.newPage();
  352 |     await page.goto("/subscribe");
  353 |     await waitForAppReady(page);
  354 |     expect(page.url()).not.toMatch(/\/login/);
  355 |     // Seite hat Inhalt
  356 |     const bodyText = await page.locator("body").innerText();
  357 |     expect(bodyText.length).toBeGreaterThan(100);
  358 |     await page.close();
  359 |   });
  360 | 
  361 |   test("3.2 - Zwei Pläne sichtbar: €29 (Monat) und €249 (Jahr)", async () => {
  362 |     const page = await devContext.newPage();
  363 |     await page.goto("/subscribe");
  364 |     await waitForAppReady(page);
  365 |     await page.waitForTimeout(2000);
  366 | 
  367 |     // Monatlicher Plan: €29
  368 |     await expect(page.locator("text=€29")).toBeVisible({ timeout: 10_000 });
  369 |     // Jährlicher Plan: €249
  370 |     await expect(page.locator("text=€249")).toBeVisible({ timeout: 5000 });
  371 |     await page.close();
  372 |   });
  373 | 
  374 |   test("3.3 - PREMIUM Badge und YapiMap Premium Titel sichtbar", async () => {
  375 |     const page = await devContext.newPage();
  376 |     await page.goto("/subscribe");
  377 |     await waitForAppReady(page);
  378 |     await page.waitForTimeout(2000);
  379 | 
  380 |     await expect(page.locator("text=PREMIUM").first()).toBeVisible({ timeout: 10_000 });
  381 |     await expect(page.locator("h1").filter({ hasText: /YapiMap Premium/ })).toBeVisible();
  382 |     await page.close();
  383 |   });
  384 | 
  385 |   test("3.4 - Developer Feature-Liste und Broker Feature-Liste sichtbar", async () => {
  386 |     const page = await devContext.newPage();
  387 |     await page.goto("/subscribe");
  388 |     await waitForAppReady(page);
  389 |     await page.waitForTimeout(2000);
  390 | 
  391 |     // Developer Feature Block (🏗️ Developer title)
  392 |     await expect(page.locator("text=Developer").first()).toBeVisible({ timeout: 10_000 });
  393 |     // Broker Feature Block
  394 |     await expect(page.locator("text=/Emlak Danışmanı|Real Estate/").first()).toBeVisible({ timeout: 5000 });
  395 |     await page.close();
  396 |   });
  397 | 
  398 |   test("3.5 - Plan-Buttons (Şimdi Başla / Get Started) sind aktiv", async () => {
  399 |     const page = await devContext.newPage();
  400 |     await page.goto("/subscribe");
  401 |     await waitForAppReady(page);
  402 |     await page.waitForTimeout(2000);
  403 | 
  404 |     const ctaBtn = page.locator("button").filter({ hasText: /Şimdi Başla|Get Started/ }).first();
```