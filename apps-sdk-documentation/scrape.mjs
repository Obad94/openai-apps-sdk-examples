#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TurndownService from '../grapesjs-sdk-scrape/node_modules/turndown/lib/turndown.cjs.js';
import { gfm } from '../grapesjs-sdk-scrape/node_modules/turndown-plugin-gfm/lib/turndown-plugin-gfm.cjs.js';
import sanitize from '../grapesjs-sdk-scrape/node_modules/sanitize-filename/index.js';
import { chromium } from '../grapesjs-sdk-scrape/node_modules/playwright/index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- CLI args ----------
const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg.startsWith('--')) {
    const key = arg.replace(/^--/, '');
    if (arg.includes('=')) {
      const [k, v] = arg.split('=');
      args[k.replace(/^--/, '')] = v;
    } else {
      // Next arg is the value
      const nextArg = argv[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
}

const BASE = (args.base || 'https://developers.openai.com/apps-sdk').replace(/\/+$/, '');
const OUT  = path.resolve(args.out || './apps-sdk-md');
const CONCURRENCY = Number(args.concurrency || 3);
const DELAY_MS = Number(args.delay || 250); // polite crawl

// ---------- Helpers ----------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toLocalPathFromDocs(url) {
  // Create nested directory structure based on URL path
  const u = new URL(url);
  const parts = u.pathname.replace(/^\/+/, '').split('/');

  // Find apps-sdk index and use everything after it
  const idx = parts.indexOf('apps-sdk');
  if (idx === -1) {
    // Fallback to flat structure if apps-sdk not found
    let file = parts.join('-');
    file = file.replace(/\.html?$/i, '');
    file = sanitize(file || 'index');
    return path.join(OUT, `${file}.md`);
  }

  const docsParts = parts.slice(idx + 1); // Skip 'apps-sdk'

  if (docsParts.length === 0) {
    // Root apps-sdk page
    return path.join(OUT, 'home.md');
  }

  if (docsParts.length === 1) {
    // Top-level category (e.g., /apps-sdk/deploy)
    const category = sanitize(docsParts[0]);
    return path.join(OUT, `${category}.md`);
  }

  // Nested structure (e.g., /apps-sdk/concepts/mcp-server)
  const category = sanitize(docsParts[0]);
  const subcategories = docsParts.slice(1).map(part => sanitize(part));
  const filename = sanitize(subcategories[subcategories.length - 1] || 'index');

  // Build the full path with nested directories
  const fullPath = [OUT, category, `${filename}.md`];
  return path.join(...fullPath);
}

function ensureDir(pth) {
  fs.mkdirSync(path.dirname(pth), { recursive: true });
}

function buildTurndown() {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**'
  });
  td.use(gfm);
  // Cleanups & tweaks
  td.addRule('stripBadges', {
    filter: (node) => node.nodeType === 1 && (
      node.classList?.contains('copyButtonIcons_MVhB') ||
      node.classList?.contains('buttonGroup_TNwR') ||
      node.tagName === 'IFRAME'
    ),
    replacement: () => ''
  });
  return td;
}

async function collectAllDocLinks(page) {
  await page.goto(BASE, { waitUntil: 'load', timeout: 60000 });

  // Wait for page to be fully loaded
  await sleep(3000);

  console.log('Extracting links from sidebar navigation...');

  // Extract all links from the sidebar navigation
  const links = new Set();

  const anchors = await page.evaluate(() => {
    const hrefs = [];

    // Find the left navigation container
    const navContainer = document.querySelector('[data-left-nav-container]');
    if (!navContainer) {
      console.log('Navigation container not found');
      return hrefs;
    }

    // Get all links from the navigation
    const menuLinks = navContainer.querySelectorAll('a[href*="/apps-sdk"]');

    menuLinks.forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('#')) {
        hrefs.push(href);
      }
    });

    return hrefs;
  });

  console.log(`Found ${anchors.length} link(s) in sidebar navigation`);

  anchors.forEach(href => {
    try {
      // Skip hash-only links
      if (!href || href.startsWith('#')) return;

      // Handle both relative and absolute URLs
      const abs = href.startsWith('http') ? href : new URL(href, 'https://developers.openai.com').href;
      // Only keep apps-sdk pages
      if (/\/apps-sdk/.test(abs)) links.add(abs);
    } catch (e) {
      console.log(`Failed to parse URL: ${href}`);
    }
  });

  // Also add the base URL
  links.add(BASE);

  console.log(`Total unique links discovered: ${links.size}`);
  return Array.from(links).sort();
}

async function extractNextPrevLinks(page) {
  return await page.evaluate(() => {
    const links = { prev: null, next: null };

    // Find navigation with previous/next buttons
    const nav = document.querySelector('nav.px-2.md\\:px-8.lg\\:px-16');
    if (!nav) return links;

    // Get all links in the navigation
    const navLinks = nav.querySelectorAll('a');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const text = link.textContent || '';

      // Check if it's a previous link (contains "Previous" text)
      if (text.includes('Previous') || text.includes('previous')) {
        links.prev = href;
      }
      // Check if it's a next link (contains "Next" text)
      else if (text.includes('Next') || text.includes('next')) {
        links.next = href;
      }
    });

    return links;
  });
}

async function pruneAndExtractHTML(page) {
  return await page.evaluate(() => {
    // Remove UI chrome that would pollute Markdown
    document.querySelectorAll([
      'nav.navbar',
      'aside[data-left-nav-container]',
      '[data-left-nav-container]',
      'nav[aria-label="Breadcrumb"]',
      'footer',
      '.backToTopButton',
      'button[title="Copy"]',
      // Remove the right-side table of contents navigation
      'nav[class*="TableOfContents"]',
      '[class*="tocContainer"]',
      // Remove prev/next navigation
      'nav.px-2.md\\:px-8.lg\\:px-16',
    ].join(',')).forEach(el => el.remove());

    // Remove hidden elements
    document.querySelectorAll('[hidden]').forEach(el => el.remove());

    // Remove iframes
    document.querySelectorAll('iframe').forEach(el => el.remove());

    // Find the main content area
    const article = document.querySelector('article') ||
                    document.querySelector('main article') ||
                    document.querySelector('main');

    const title = document.querySelector('h1')?.textContent?.trim() || '';

    return {
      title,
      html: article ? article.innerHTML : document.body.innerHTML
    };
  });
}

async function scrapeOne(browser, url, discoveredLinks) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    // Give page time to render
    await sleep(500);

    // Extract next/prev links before removing navigation
    const navLinks = await extractNextPrevLinks(page);

    // Add discovered prev/next links to the set
    if (navLinks.prev) {
      const prevUrl = navLinks.prev.startsWith('http')
        ? navLinks.prev
        : new URL(navLinks.prev, 'https://developers.openai.com').href;
      if (/\/apps-sdk/.test(prevUrl) && !discoveredLinks.has(prevUrl)) {
        console.log(`  ↪ Discovered prev link: ${prevUrl}`);
        discoveredLinks.add(prevUrl);
      }
    }

    if (navLinks.next) {
      const nextUrl = navLinks.next.startsWith('http')
        ? navLinks.next
        : new URL(navLinks.next, 'https://developers.openai.com').href;
      if (/\/apps-sdk/.test(nextUrl) && !discoveredLinks.has(nextUrl)) {
        console.log(`  ↪ Discovered next link: ${nextUrl}`);
        discoveredLinks.add(nextUrl);
      }
    }

    const { title, html } = await pruneAndExtractHTML(page);

    // Convert to Markdown
    const turndown = buildTurndown();
    const bodyMd = turndown.turndown(html);

    // Build frontmatter + page header
    const md = [
      `---`,
      `title: "${title?.replace(/"/g, '\\"') || ''}"`,
      `source: "${url}"`,
      `fetched_at: "${new Date().toISOString()}"`,
      `---`,
      ``,
      title ? `# ${title}\n` : '',
      bodyMd
    ].join('\n');

    // Write file
    const outFile = toLocalPathFromDocs(url);
    ensureDir(outFile);
    fs.writeFileSync(outFile, md, 'utf8');

    return { url, outFile, ok: true, navLinks };
  } catch (err) {
    return { url, error: String(err), ok: false };
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  console.log(`Base: ${BASE}`);
  console.log(`Out : ${OUT}`);
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Collecting initial links from sidebar...');
  const links = await collectAllDocLinks(page);
  await page.close();

  // Use a Set to track all discovered links (including from next/prev)
  const allDiscoveredLinks = new Set(links);

  console.log(`Discovered ${allDiscoveredLinks.size} doc pages from sidebar.`);

  const results = [];
  const processed = new Set();
  let iteration = 0;

  // Keep scraping until no new links are discovered
  while (allDiscoveredLinks.size > processed.size) {
    iteration++;
    console.log(`\n=== Iteration ${iteration} ===`);

    const toScrape = Array.from(allDiscoveredLinks).filter(url => {
      // Skip already processed
      if (processed.has(url)) return false;

      // Check if already exists on disk
      const outFile = toLocalPathFromDocs(url);
      const exists = fs.existsSync(outFile);
      if (exists) {
        const relativePath = path.relative(OUT, outFile);
        console.log(`⊘ Skipping (already exists): ${relativePath}`);
        processed.add(url);
        return false;
      }
      return true;
    });

    if (toScrape.length === 0) {
      console.log('No new pages to scrape.');
      break;
    }

    console.log(`${toScrape.length} page(s) to scrape in this iteration`);

    let i = 0;
    // Simple chunked concurrency
    while (i < toScrape.length) {
      const chunk = toScrape.slice(i, i + CONCURRENCY);
      const batch = await Promise.all(chunk.map(async (u) => {
        const res = await scrapeOne(browser, u, allDiscoveredLinks);
        processed.add(u);

        if (res.ok) {
          const relativePath = path.relative(OUT, res.outFile);
          console.log(`✔ Saved: ${relativePath}`);
        } else {
          console.log(`✖ Failed: ${u}\n   ${res.error}`);
        }
        await sleep(DELAY_MS);
        return res;
      }));
      results.push(...batch);
      i += CONCURRENCY;
    }
  }

  await browser.close();

  // Write an enhanced index with nested structure
  const allLinks = Array.from(allDiscoveredLinks).sort();

  // Group by categories for better organization
  const groupedLinks = {};
  allLinks.forEach(url => {
    const outFile = toLocalPathFromDocs(url);
    const relativePath = path.relative(OUT, outFile).replace(/\\/g, '/');
    const parts = relativePath.split('/');
    const category = parts.length > 1 ? parts[0] : 'Root';

    if (!groupedLinks[category]) {
      groupedLinks[category] = [];
    }

    const result = results.find(r => r.url === url);
    const exists = fs.existsSync(outFile);
    const status = result ? (result.ok ? '✅' : '❌') : (exists ? '⏭️' : '❓');

    groupedLinks[category].push({
      path: relativePath,
      url: url,
      status: status,
      result: result,
      exists: exists
    });
  });

  const indexContent = [
    `# OpenAI Apps SDK Documentation`,
    ``,
    `This directory contains scraped documentation from OpenAI Apps SDK with organized nested structure.`,
    ``,
    `## Directory Structure`,
    ``,
    ...Object.keys(groupedLinks).sort().map(category => {
      const links = groupedLinks[category];
      const categoryLines = [
        `### ${category}`,
        ``,
        ...links.map(link => {
          const statusText = link.result
            ? (link.result.ok ? '' : ` (${link.result.error})`)
            : (link.exists ? ' (already existed)' : '');
          return `- ${link.status} [${link.path}](${link.path})  \`${link.url}\`${statusText}`;
        }),
        ``
      ];
      return categoryLines.join('\n');
    }),
    `## Summary`,
    ``,
    `- Total pages discovered: ${allLinks.length}`,
    `- Successfully scraped: ${results.filter(r => r.ok).length}`,
    `- Failed: ${results.filter(r => !r.ok).length}`,
    `- Already existed: ${allLinks.length - results.length}`,
    `- Generated at: ${new Date().toISOString()}`,
    ``
  ].join('\n');

  fs.writeFileSync(path.join(OUT, 'INDEX.md'), indexContent, 'utf8');

  const okCount = results.filter(r => r.ok).length;
  const failCount = results.length - okCount;
  const skipped = allLinks.length - results.length;
  console.log(`\nDone. OK: ${okCount}, Failed: ${failCount}, Skipped: ${skipped}. Output: ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
