# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> 3. Subscribe Seite >> 3.5 - Plan-Buttons (Şimdi Başla / Get Started) sind aktiv
- Location: tests\e2e.spec.ts:398:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: /Şimdi Başla|Get Started/ }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button').filter({ hasText: /Şimdi Başla|Get Started/ }).first()

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
> 405 |     await expect(ctaBtn).toBeVisible({ timeout: 10_000 });
      |                          ^ Error: expect(locator).toBeVisible() failed
  406 |     await expect(ctaBtn).toBeEnabled();
  407 |     await page.close();
  408 |   });
  409 | 
  410 |   test("3.6 - Geri Dön / Go Back Button ist vorhanden", async () => {
  411 |     const page = await devContext.newPage();
  412 |     await page.goto("/subscribe");
  413 |     await waitForAppReady(page);
  414 |     await page.waitForTimeout(1000);
  415 | 
  416 |     await expect(
  417 |       page.locator("button").filter({ hasText: /Geri Dön|Go Back/ })
  418 |     ).toBeVisible({ timeout: 10_000 });
  419 |     await page.close();
  420 |   });
  421 | 
  422 |   test("3.7 - Broker mit aktivem Abo sieht 'Aboneliğiniz Aktif'", async () => {
  423 |     const page = await brokerContext.newPage();
  424 |     await page.goto("/subscribe");
  425 |     await waitForAppReady(page);
  426 |     await page.waitForTimeout(2000);
  427 | 
  428 |     // murad hat subscription_status=active → zeigt Bestätigungs-Screen
  429 |     await expect(
  430 |       page.locator("text=/Aktif|Active/")
  431 |     ).toBeVisible({ timeout: 10_000 });
  432 |     await page.close();
  433 |   });
  434 | 
  435 |   test("3.8 - Sicherer Checkout-Link nicht konfigurier → Alert statt Crash", async () => {
  436 |     const page = await devContext.newPage();
  437 |     await page.goto("/subscribe");
  438 |     await waitForAppReady(page);
  439 |     await page.waitForTimeout(2000);
  440 | 
  441 |     // Klick auf Plan-Button (Stripe Checkout) - wir fangen den Dialog ab
  442 |     page.on("dialog", async dialog => {
  443 |       // Wenn "Stripe Price ID not configured" kommt - OK
  444 |       await dialog.dismiss();
  445 |     });
  446 | 
  447 |     const ctaBtn = page.locator("button").filter({ hasText: /Şimdi Başla|Get Started/ }).first();
  448 |     if (await ctaBtn.isVisible()) {
  449 |       await ctaBtn.click({ timeout: 5000 }).catch(() => {});
  450 |     }
  451 |     // Kein Crash erwartet
  452 |     expect(page.url()).not.toMatch(/error/);
  453 |     await page.close();
  454 |   });
  455 | 
  456 | });
  457 | 
  458 | // ─────────────────────────────────────────────
  459 | // 4. PROJEKT-DETAILSEITE /projects/[id]
  460 | // ─────────────────────────────────────────────
  461 | 
  462 | test.describe("4. Projekt-Detailseite", () => {
  463 |   let brokerContext: BrowserContext;
  464 | 
  465 |   test.beforeAll(async ({ browser }) => {
  466 |     brokerContext = await browser.newContext();
  467 |     const page = await brokerContext.newPage();
  468 |     await loginViaUI(page, "murad@mailinator.com", "Test1234!");
  469 |     await page.goto("/broker/map");
  470 |     await waitForAppReady(page);
  471 |     await page.close();
  472 |   });
  473 | 
  474 |   test.afterAll(async () => {
  475 |     await brokerContext.close();
  476 |   });
  477 | 
  478 |   test("4.1 - Projekt-Detailseite ist erreichbar (für subscribed Broker)", async () => {
  479 |     const page = await brokerContext.newPage();
  480 |     // Navigiere zur Map und hole eine Projekt-ID
  481 |     await page.goto("/broker/map");
  482 |     await waitForAppReady(page);
  483 |     await page.waitForTimeout(4000);
  484 | 
  485 |     // Wechsle zu Liste-Tab
  486 |     const listTab = page.locator("button").filter({ hasText: /^Liste|^List/ }).first();
  487 |     await listTab.click();
  488 |     await page.waitForTimeout(2000);
  489 | 
  490 |     // Klicke auf erstes Projekt (Popup öffnet sich)
  491 |     const projectEntries = page.locator("div").filter({ hasText: /[₺$€]\d/ }).nth(2);
  492 |     const count = await page.locator(".mapboxgl-marker").count();
  493 | 
  494 |     if (count > 0) {
  495 |       // Marker auf Map klicken
  496 |       await page.locator(".mapboxgl-marker").first().click();
  497 |       await page.waitForTimeout(1500);
  498 | 
  499 |       const popup = page.locator(".mapboxgl-popup");
  500 |       if (await popup.isVisible({ timeout: 3000 }).catch(() => false)) {
  501 |         const detailsBtn = popup.locator("button").filter({ hasText: /Detayları|Details/ });
  502 |         if (await detailsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  503 |           await detailsBtn.click();
  504 |           await page.waitForTimeout(3000);
  505 |           // Soll jetzt auf /projects/[id] sein
```