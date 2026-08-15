#!/usr/bin/env node
/**
 * Removes a manually-added dsh-mcp-manager mount row from a profile's
 * `cordis.patch.yml` (top-level `- insert:` blocks or id-targeted override
 * rows whose id is `mcp-manager`). Everything else — comments, other
 * servers, the file header — is preserved verbatim. Idempotent; a missing
 * file is a no-op.
 *
 * Used by the one-click installers so bundle-based mounting can never
 * double-mount the plugin alongside an older manual entry.
 *
 * @module dsh-mcp-manager/scripts/remove-manual-mount
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const file = process.argv[2]
if (!file || !existsSync(file)) process.exit(0)

const lines = readFileSync(file, 'utf8').split('\n')
const out = []
let i = 0

while (i < lines.length) {
  const line = lines[i]
  const trimmed = line.trim()
  // A top-level patch row starts at column 0 with a list dash or a mapping key
  // (comments and blanks pass through untouched).
  if (trimmed !== '' && !trimmed.startsWith('#') && /^[-]|^[A-Za-z0-9_-]+:/.test(trimmed) && line.startsWith(trimmed)) {
    const block = [line]
    let j = i + 1
    while (j < lines.length) {
      const next = lines[j]
      if (next.startsWith(' ') || next.startsWith('\t')) {
        if (next.trim() !== '') block.push(next)
      } else {
        break
      }
      j += 1
    }
    const isMcpManager = block.some((l) => /id:\s*['"]?mcp-manager['"]?\s*$/.test(l.trim()))
    if (!isMcpManager) out.push(...block)
    i = j
  } else {
    out.push(line)
    i += 1
  }
}

while (out.length > 0 && out[out.length - 1].trim() === '') out.pop()
writeFileSync(file, `${out.join('\n')}\n`)
console.log(`[dsh-mcp-manager] removed manual mcp-manager mount row from ${file}`)
