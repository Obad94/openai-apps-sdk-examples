# OpenAI Apps SDK Documentation Scraper

This scraper extracts documentation from the OpenAI Apps SDK documentation site and converts it to Markdown format.

## Features

- Extracts documentation from sidebar navigation
- Follows next/previous links to discover additional pages
- Maintains the hierarchical structure of the documentation
- Converts HTML to clean Markdown format
- Skips already-scraped pages
- Generates an index file with the complete documentation structure

## Installation

```bash
npm install
```

## Usage

### Basic usage (default settings)

```bash
node scrape.mjs
```

This will:
- Scrape from `https://developers.openai.com/apps-sdk`
- Output to `./apps-sdk-md/`
- Use 3 concurrent connections
- Add 250ms delay between requests

### Custom options

```bash
# Custom output directory
node scrape.mjs --out ./custom-output

# Custom base URL
node scrape.mjs --base https://developers.openai.com/apps-sdk

# Adjust concurrency and delay
node scrape.mjs --concurrency 5 --delay 500
```

## Output Structure

The scraper organizes documentation by category:

```
apps-sdk-md/
├── INDEX.md                    # Complete index with all links
├── home.md                     # Main apps-sdk page
├── concepts/
│   ├── mcp-server.md
│   ├── user-interaction.md
│   └── design-guidelines.md
├── plan/
│   ├── use-case.md
│   ├── tools.md
│   └── components.md
├── build/
│   ├── mcp-server.md
│   ├── custom-ux.md
│   ├── auth.md
│   ├── storage.md
│   └── examples.md
├── deploy/
│   ├── connect-chatgpt.md
│   ├── testing.md
│   └── troubleshooting.md
├── guides/
│   ├── optimize-metadata.md
│   └── security-privacy.md
├── reference.md
└── app-developer-guidelines.md
```

## How It Works

1. **Sidebar Navigation**: Extracts all links from the left sidebar navigation
2. **Next/Previous Links**: While scraping each page, it discovers additional pages via next/previous navigation buttons
3. **Iterative Discovery**: Continues scraping until no new pages are discovered
4. **Content Extraction**: Removes navigation, headers, footers, and other UI elements, keeping only the main content
5. **Markdown Conversion**: Converts cleaned HTML to Markdown using Turndown
6. **File Organization**: Saves files in a hierarchical structure matching the URL paths

## Features Specific to OpenAI Apps SDK

- Detects and extracts next/previous navigation links automatically
- Preserves the documentation hierarchy from the sidebar
- Handles the Astro-based site structure
- Removes dark mode toggle elements and other UI chrome
- Maintains proper heading levels and code blocks

## Command Line Options

- `--base <url>`: Base URL to scrape (default: `https://developers.openai.com/apps-sdk`)
- `--out <path>`: Output directory (default: `./apps-sdk-md`)
- `--concurrency <number>`: Number of concurrent requests (default: 3)
- `--delay <ms>`: Delay between requests in milliseconds (default: 250)

## Notes

- The scraper is polite and includes delays between requests
- Already-scraped pages are skipped on subsequent runs
- Failed pages are logged and can be retried
- All pages include frontmatter with title, source URL, and fetch timestamp
