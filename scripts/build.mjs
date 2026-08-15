/**
 * Build script for dsh-mcp-manager.
 *
 * Produces two artifacts:
 *   lib/index.js   — node half (ESM, deps external: resolved at runtime from
 *                    the harness profile / installation).
 *   lib/client.js  — browser half as a `window.__ModuleLoader__` closure bundle
 *                    (the format dsh-client-modules serves and the shell's
 *                    ModuleLoader executes). External packages become
 *                    `require(...)` calls resolved from the runtime registry.
 *
 * Optional typecheck: `node scripts/build.mjs --typecheck` runs `tsc --noEmit`
 * using the paths in tsconfig.json (point them at your DSH checkout's built
 * lib/types outputs, or export DSH_PACKAGES_DIR and run
 * `node scripts/build.mjs --gen-tsconfig` to regenerate the paths block).
 *
 * @module dsh-mcp-manager/scripts/build
 */
import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const libDir = join(root, 'lib')
mkdirSync(libDir, { recursive: true })

const args = process.argv.slice(2)

/** Indent a multi-line string by `tabs` tabs. */
function indent(code, tabs) {
  const pad = '\t'.repeat(tabs)
  return code
    .split('\n')
    .map((line) => (line === '' ? line : pad + line))
    .join('\n')
}

async function buildHost() {
  await build({
    entryPoints: [join(root, 'src/index.ts')],
    outfile: join(libDir, 'index.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    external: [
      'js-yaml',
      '@modelcontextprotocol/*',
      '@deepseek-ai/*',
    ],
    sourcemap: true,
    logLevel: 'info',
  })
  console.log('[dsh-mcp-manager] host bundle -> lib/index.js')
}

async function buildClient() {
  const result = await build({
    entryPoints: [join(root, 'src/client/index.tsx')],
    outfile: join(libDir, 'client.js'),
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    external: [
      'react',
      'react/jsx-runtime',
      'react-dom/*',
      '@deepseek-ai/*',
    ],
    loader: { '.ts': 'tsx' },
    write: false,
    sourcemap: true,
    logLevel: 'info',
  })
  const js = result.outputFiles.find((f) => f.path.endsWith('.js'))
  const map = result.outputFiles.find((f) => f.path.endsWith('.map'))
  if (js === undefined) throw new Error('client bundle produced no js output')
  // Match the harness's own client bundles: plain `exports.apply/inject` on
  // module.exports with no `__esModule` marker. esbuild's cjs format wraps the
  // entry exports in __toCommonJS; unwrap it so the shell's module loader sees
  // exactly the shape every in-box bundle uses.
  let code = js.text.replace(
    /module\.exports = __toCommonJS\((\w+_exports)\);/g,
    (_, name) => `module.exports = ${name};`,
  )
  if (code === js.text) {
    console.warn('[dsh-mcp-manager] warning: __toCommonJS unwrap pattern did not match; check bundle exports')
  }
  const wrapped = [
    'window.__ModuleLoader__.load({',
    `\tid: ${JSON.stringify(pkg.name)},`,
    '\tfactory: (require) => {',
    '\t\tvar module = { exports: {} };',
    '\t\tvar exports = module.exports;',
    indent(code, 2),
    '',
    '\t\treturn module.exports;',
    '\t}',
    '});',
    '',
  ].join('\n')
  writeFileSync(join(libDir, 'client.js'), wrapped)
  if (map !== undefined) {
    writeFileSync(join(libDir, 'client.js.map'), map.text)
    writeFileSync(join(libDir, 'client.js'), `${wrapped}\n//# sourceMappingURL=client.js.map\n`)
  }
  console.log('[dsh-mcp-manager] client bundle -> lib/client.js')
}

function typecheck() {
  const tsc = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc')
  if (!existsSync(tsc)) {
    console.warn('[dsh-mcp-manager] tsc not found; run `pnpm install` to typecheck (skipping)')
    return
  }
  console.log('[dsh-mcp-manager] typecheck (tsc --noEmit)…')
  execFileSync(tsc, ['-p', join(root, 'tsconfig.json'), '--noEmit'], { stdio: 'inherit' })
}

await buildHost()
await buildClient()
if (args.includes('--typecheck')) typecheck()
console.log('[dsh-mcp-manager] build complete')
