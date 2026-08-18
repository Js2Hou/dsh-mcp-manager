/**
 * Marketplace listing checker for dsh-mcp-manager.
 *
 * Polls every marketplace registered in listings.json and rewrites the
 * `<!-- listings:start -->` … `<!-- listings:end -->` badge block in
 * README.md / README_EN.md so the README always reflects which plugin
 * marketplaces currently list the package.
 *
 * Modes:
 *   (default)   print a status table; exit 1 if any market is unlisted
 *   --write     rewrite the README badge block in place
 *   --discover  search GitHub for candidate marketplace repos (manual review,
 *               then add them to listings.json)
 *
 * Detection kinds:
 *   url-status    the URL responds 2xx  -> listed
 *   github-topic  the package repo carries the GitHub topic -> listed
 *   json-search   the JSON payload contains the match string -> listed
 *
 * The GitHub topics call needs a token (GITHUB_TOKEN env / CI token); the
 * other detections are anonymous.
 *
 * @module scripts/check-listings
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'listings.json'), 'utf8'))
const START = '<!-- listings:start -->'
const END = '<!-- listings:end -->'
const READS = ['README.md', 'README_EN.md']

const args = process.argv.slice(2)
const writeMode = args.includes('--write')
const discoverMode = args.includes('--discover')

/** Shields.io-safe segment: encode reserved chars, double hyphens (a lone
 *  `-` would be eaten by shields as a separator, `--` renders as `-`). */
function encSegment(value) {
  return encodeURIComponent(value).replace(/-/g, '--')
}

function badge(market, ok) {
  const message = ok ? '\u2713' : '\u2717' // ✓ / ✗
  const color = ok ? '3fb950' : '808080'
  const url = `https://img.shields.io/badge/${encSegment(market.label)}-${encodeURIComponent(message)}-${color}`
  return `[![${market.label}](${url})](${market.url})`
}

async function detect(market) {
  const d = market.detect
  switch (d.kind) {
    case 'url-status': {
      const res = await fetch(d.url, { signal: AbortSignal.timeout(15000) })
      return res.ok
    }
    case 'github-topic': {
      const res = await fetch(`https://api.github.com/repos/${CONFIG.repo}/topics`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'dsh-mcp-manager-listings',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
      })
      if (!res.ok) throw new Error(`github topics ${res.status}`)
      const json = await res.json()
      return (json.names ?? []).includes(d.topic)
    }
    case 'json-search': {
      const res = await fetch(d.url, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) return false
      const text = await res.text()
      return text.includes(d.match)
    }
    default:
      throw new Error(`unknown detect kind: ${d.kind}`)
  }
}

async function runChecks() {
  const results = []
  for (const market of CONFIG.marketplaces) {
    let ok
    try {
      ok = await detect(market)
    } catch (error) {
      ok = false
      console.error(`  !! ${market.id}: detect failed (${error.message})`)
    }
    results.push({ market, ok })
    console.log(`  ${ok ? '✓' : '✗'} ${market.id}`)
  }
  return results
}

async function rewrite(results) {
  const block = `${START}\n${results.map((r) => badge(r.market, r.ok)).join('\n')}\n${END}\n`
  for (const file of READS) {
    const path = join(ROOT, file)
    let content = readFileSync(path, 'utf8')
    const s = content.indexOf(START)
    const e = content.indexOf(END)
    if (s === -1 || e === -1) throw new Error(`missing listings markers in ${file}`)
    content = content.slice(0, s) + block + content.slice(e + END.length)
    writeFileSync(path, content, 'utf8')
  }
}

async function discover() {
  const queries = ['topic:dsh-plugin marketplace', 'topic:dsh-plugin plugin market']
  const seen = new Set()
  for (const q of queries) {
    const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=20`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'dsh-mcp-manager-listings',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
    })
    if (!res.ok) throw new Error(`search ${res.status}`)
    const json = await res.json()
    for (const item of json.items ?? []) {
      if (seen.has(item.full_name)) continue
      seen.add(item.full_name)
      const desc = (item.description ?? '').replace(/\s+/g, ' ').slice(0, 80)
      console.log(`${item.full_name}\t${desc}`)
    }
  }
}

if (discoverMode) {
  await discover()
  process.exit(0)
}

const results = await runChecks()
const listed = results.filter((r) => r.ok).length
console.log(`${listed}/${results.length} marketplaces listed`)

if (writeMode) {
  await rewrite(results)
  console.log('README listings block updated')
}

process.exit(listed === results.length ? 0 : 1)
