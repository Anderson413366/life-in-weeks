import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const headless = !args.includes("--headed");
const baseUrlArg = args.find((arg) => arg.startsWith("--base-url="));
const baseUrl = (baseUrlArg ? baseUrlArg.split("=")[1] : process.env.BASE_URL ?? "http://127.0.0.1:4173").replace(/\/$/, "");
const screenshotDir = path.resolve(projectRoot, "output", "playwright");
const photoPath = path.resolve(projectRoot, "public/icons/icon-192.png");

function log(step) {
  console.log(`• ${step}`);
}

function sanitizeLabel(value) {
  return value.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${url} failed with ${response.status}`);
  }
  return response.json();
}

async function waitFor(fn, { timeout = 90_000, interval = 2_000, message = "Timed out" } = {}) {
  const started = Date.now();

  while (Date.now() - started < timeout) {
    const result = await fn();
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(message);
}

function normalizeUrl(raw) {
  return raw
    .replace(/&amp;/g, "&")
    .replace(/[)\],.]+$/, "")
    .trim();
}

function extractConfirmationUrl(message) {
  const combined = [message.text, message.html].flat().filter(Boolean).join("\n");
  const matches = combined.match(/https?:\/\/[^\s"'<>]+/g) ?? [];
  const cleaned = matches.map(normalizeUrl);
  return cleaned.find((url) => /auth\/v1\/verify/.test(url)) ?? cleaned[0] ?? null;
}

async function createMailbox() {
  const domains = await requestJson("https://api.mail.tm/domains");
  const domain = domains["hydra:member"]?.find((entry) => entry.isActive)?.domain;
  assert(domain, "No disposable mail domain available");

  const address = `codex-${Date.now()}@${domain}`;
  const password = "CodexMailbox!234";

  await requestJson("https://api.mail.tm/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });

  const tokenPayload = await requestJson("https://api.mail.tm/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });

  return { address, password, token: tokenPayload.token };
}

async function waitForConfirmationLink(mailbox) {
  return waitFor(async () => {
    const inbox = await requestJson("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${mailbox.token}` },
    });

    const message = inbox["hydra:member"]?.[0];
    if (!message) return null;

    const fullMessage = await requestJson(`https://api.mail.tm/messages/${message.id}`, {
      headers: { Authorization: `Bearer ${mailbox.token}` },
    });

    const link = extractConfirmationUrl(fullMessage);
    return link ? { link, subject: fullMessage.subject, from: fullMessage.from?.address ?? "" } : null;
  }, {
    timeout: 90_000,
    interval: 5_000,
    message: "Verification email did not arrive in time",
  });
}

async function verifyExternalLink(url) {
  const response = await fetch(url, { redirect: "manual" });
  assert(response.status < 400 || response.status === 405, `${url} returned ${response.status}`);
}

async function verifyStaticRoutes() {
  const checks = [
    { path: "/", contentTypes: ["text/html"] },
    { path: "/terms", contentTypes: ["text/html"] },
    { path: "/privacy", contentTypes: ["text/html"] },
    { path: "/grid", contentTypes: ["text/html"] },
    { path: "/diary", contentTypes: ["text/html"] },
    { path: "/timemirror", contentTypes: ["text/html"] },
    { path: "/settings", contentTypes: ["text/html"] },
    { path: "/manifest.json", contentTypes: ["application/json"] },
    { path: "/sw.js", contentTypes: ["application/javascript", "text/javascript"] },
  ];

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`);
    assert.equal(response.status, 200, `${check.path} returned ${response.status}`);
    assert(
      check.contentTypes.some((contentType) => response.headers.get("content-type")?.includes(contentType)),
      `${check.path} did not return one of: ${check.contentTypes.join(", ")}`,
    );
  }
}

async function expectAuthGate(page) {
  await page.waitForLoadState("networkidle");
  await page.getByRole("heading", { name: "Life in Weeks" }).waitFor();
  await page.getByRole("button", { name: /Continue with Google/i }).waitFor();
}

function primaryNav(page) {
  return page.getByRole("navigation", { name: "Primary" });
}

async function verifySignedOutRoutes(page) {
  log("Verifying signed-out routes and public pages");

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await expectAuthGate(page);

  const termsLink = page.getByRole("link", { name: /Terms of Service/i });
  const privacyLink = page.getByRole("link", { name: /Privacy Policy/i });
  assert.equal(await termsLink.getAttribute("href"), "/terms");
  assert.equal(await privacyLink.getAttribute("href"), "/privacy");

  for (const protectedPath of ["/grid", "/diary", "/timemirror", "/settings", "/missing-route"]) {
    await page.goto(`${baseUrl}${protectedPath}`, { waitUntil: "networkidle" });
    await expectAuthGate(page);
  }

  await page.goto(`${baseUrl}/terms`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Terms of Service" }).waitFor();
  await page.getByRole("link", { name: /Back To App/i }).click();
  await expectAuthGate(page);

  await page.goto(`${baseUrl}/privacy`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Privacy Policy" }).waitFor();
}

async function signUpAndConfirm(page, mailbox) {
  const password = "CodexTest!234";
  log(`Signing up a disposable account at ${baseUrl}`);

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await expectAuthGate(page);
  await page.getByRole("button", { name: /Don't have an account\? Sign up/i }).click();
  await page.locator("#auth-email").fill(mailbox.address);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.getByRole("heading", { name: "Check your inbox" }).waitFor();

  const confirmation = await waitForConfirmationLink(mailbox);
  assert(confirmation.link, "Confirmation link missing from email");
  log(`Received confirmation email from ${confirmation.from || "unknown sender"}`);

  await page.goto(confirmation.link, { waitUntil: "networkidle" });

  const signedIn = await waitFor(async () => {
    await page.waitForLoadState("networkidle");

    if (await page.getByText(/Set your birthdate in Settings to begin\./i).count()) return true;
    if (await page.getByRole("navigation", { name: "Primary" }).count()) return true;
    return false;
  }, {
    timeout: 45_000,
    interval: 1_500,
    message: "The confirmed account did not reach an authenticated app state",
  });

  assert(signedIn, "Authenticated session not established after confirmation");

  return { email: mailbox.address, password };
}

async function completeSettings(page, downloadDir) {
  log("Completing and verifying Settings flows");

  const setupCta = page.getByRole("button", { name: /Finish setup in Settings|Go to Settings/i });
  if (await setupCta.count()) {
    await setupCta.click();
  } else {
    await primaryNav(page).getByRole("button", { name: "Settings", exact: true }).click();
  }
  await page.getByRole("heading", { name: "Identity & timeline" }).waitFor();

  const fileInputsBeforeTimeMirror = page.locator('input[type="file"]');
  await fileInputsBeforeTimeMirror.first().setInputFiles(photoPath);
  await page.getByText("Profile photo updated.").waitFor();

  await page.getByPlaceholder("Your full name").fill("Codex Test User");
  await page.getByPlaceholder("What should we call you?").fill("Codex");
  await page.getByPlaceholder("+1 (555) 123-4567").fill("+1 (555) 867-5309");
  await page.locator('input[type="date"]').first().fill("1990-01-01");
  await page.locator('input[type="number"]').first().fill("92");
  await page.getByRole("button", { name: "Save changes" }).first().click();
  await page.getByText("Profile details saved.").waitFor();

  const averageInput = page.locator('input[type="number"]').nth(1);
  await averageInput.fill("71");
  await page.getByRole("button", { name: "Save averages" }).click();
  await page.getByText("Dashboard averages saved.").waitFor();

  await page.getByRole("button", { name: "Focus Mode" }).click();
  await page.locator(".nav-meta").getByText("Focus", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Zen Mode" }).click();
  await page.locator(".nav-meta").getByText("Zen", { exact: true }).waitFor();

  const supportHref = await page.locator('a[href^="mailto:"]').first().getAttribute("href");
  assert.equal(supportHref, "mailto:support@lifeinweeks.app");

  const githubHref = await page.locator('a[href*="github.com/Anderson413366/life-in-weeks/issues"]').first().getAttribute("href");
  assert.equal(githubHref, "https://github.com/Anderson413366/life-in-weeks/issues");
  await verifyExternalLink(githubHref);

  await page.getByText(/How to get a free Gemini API key/i).click();
  const aiStudioHref = await page.locator('a[href*="aistudio.google.com/apikey"]').first().getAttribute("href");
  assert.equal(aiStudioHref, "https://aistudio.google.com/apikey");
  await verifyExternalLink(aiStudioHref);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download My Life Data" }).click();
  const download = await downloadPromise;
  const exportPath = path.join(downloadDir, "life-in-weeks-export.json");
  await download.saveAs(exportPath);
  const exported = JSON.parse(await readFile(exportPath, "utf8"));
  assert.equal(exported.profile.birthdate, "1990-01-01");
  assert.equal(exported.profile.preferredName, "Codex");
  assert(!JSON.stringify(exported).includes("gemini_api_key"), "Export payload should not contain gemini_api_key");
  assert(!JSON.stringify(exported).includes("geminiApiKey"), "Export payload should not contain geminiApiKey");
}

async function verifyDashboard(page) {
  log("Verifying Home mood flow");
  await primaryNav(page).getByRole("button", { name: "Home", exact: true }).click();
  await page.getByText(/How are you feeling right now\?/i).waitFor();
  await page.getByRole("button", { name: /Amazing/i }).click();
  await page.getByText(/Resets in 3 hours/i).waitFor();
}

async function createDiaryEntryFromGrid(page) {
  log("Creating a diary entry from the Life Grid");
  await primaryNav(page).getByRole("button", { name: "Life Grid", exact: true }).click();
  await page.getByRole("heading", { name: /Your Life in/i }).waitFor();
  await page.getByRole("button", { name: /Year 0, week 1\./i }).click();
  await page.getByRole("dialog").waitFor();
  await page.locator("textarea").fill("Codex end-to-end journal entry from the grid.");
  await page.locator('input[type="file"]').last().setInputFiles(photoPath);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

async function verifyDiaryPage(page, { deleteEntry = false } = {}) {
  log(`Verifying Diary page ${deleteEntry ? "with delete action" : "with edit action"}`);
  await primaryNav(page).getByRole("button", { name: "Diary", exact: true }).click();
  await page.getByText(/A clean record of the weeks that mattered\./i).waitFor();
  await waitFor(async () => {
    return (await page.getByLabel("Search journal entries").count()) > 0;
  }, {
    timeout: 30_000,
    interval: 500,
    message: "Diary search input did not appear",
  });
  await page.getByLabel("Search journal entries").fill("Codex end-to-end");
  await page.getByText("Codex end-to-end journal entry from the grid.").waitFor();

  await page.getByRole("button", { name: /Read journal entry for week 1, year 0/i }).click();
  await page.getByRole("dialog").waitFor();

  if (deleteEntry) {
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Delete journal entry" }).click();
    await page.getByRole("button", { name: "Confirm delete journal entry" }).click();
    await page.getByText(/No entries match "Codex end-to-end"/i).waitFor();
    return;
  }

  await page.locator("textarea").fill("Codex end-to-end journal entry edited from the diary page.");
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByText("Codex end-to-end journal entry edited from the diary page.").waitFor();
}

async function verifyTimeMirror(page) {
  log("Verifying Time Mirror upload and Gemini gating");
  await primaryNav(page).getByRole("button", { name: "Time Mirror", exact: true }).click();
  await page.getByRole("heading", { name: "Time Mirror" }).waitFor();
  await page.getByText(/Gemini API key required/i).waitFor();
  await page.locator('input[type="file"]').setInputFiles(photoPath);
  await page.getByRole("heading", { name: /Ready for your time journey\?/i }).waitFor();
  await assert.equal(await page.getByRole("button", { name: /Generate My Timeline/i }).isDisabled(), true);
}

async function verifyFooterAndFallback(page) {
  log("Verifying footer links and signed-in unknown-route fallback");
  await page.goto(`${baseUrl}/unknown-after-login`, { waitUntil: "networkidle" });
  await page.getByText(/start with today/i).waitFor();
  await page.getByRole("link", { name: "Terms" }).waitFor();
  await page.getByRole("link", { name: "Privacy" }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Support" }).getAttribute("href"), "mailto:support@lifeinweeks.app");
}

async function signOut(page) {
  log("Signing out");
  await primaryNav(page).getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expectAuthGate(page);
}

async function run() {
  await verifyStaticRoutes();

  const mailbox = await createMailbox();
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const downloadDir = await mkdtemp(path.join(tmpdir(), "liw-downloads-"));

  try {
    await verifySignedOutRoutes(page);
    await signUpAndConfirm(page, mailbox);
    await completeSettings(page, downloadDir);
    await verifyDashboard(page);
    await createDiaryEntryFromGrid(page);
    await verifyDiaryPage(page, { deleteEntry: false });
    await verifyTimeMirror(page);
    await verifyFooterAndFallback(page);
    await signOut(page);

    log(`Verification succeeded for ${baseUrl}`);
  } finally {
    await browser.close();
    await rm(downloadDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(`E2E verification failed for ${baseUrl}`);
  console.error(error);
  process.exitCode = 1;
});
