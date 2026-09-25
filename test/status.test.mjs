/**
 * Regression tests for the status projection and, most importantly, for which
 * config a probe is allowed to use.
 *
 * The report in issue #8 was a probe against a server whose `Authorization`
 * header is authored as a `!!js` expression. The probe read the *authored*
 * config (`entry.options.config`), where the expression is still a `{__jsExpr}`
 * object, handed it to the transport, and the server correctly rejected the
 * resulting `Authorization: [object Object]` — while the running instance, which
 * gets the loader's *evaluated* config, worked fine.
 *
 * Run with: pnpm test
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { JS_EXPR_PREFIX } from '../src/jsexpr.ts'
import { listMcpServers, probeConfigFor, toServerConfig } from '../src/status.ts'

const BEARER_EXPR = "('Bearer ' + (process.env.GITHUB_PERSONAL_ACCESS_TOKEN ?? ''))"
const EVALUATED_TOKEN = 'Bearer ghp_example_evaluated_token'

/** The authored row: what the patch file holds, expressions unevaluated. */
const AUTHORED = {
  serverName: 'github',
  transport: 'streamable-http',
  url: 'https://api.githubcopilot.com/mcp/',
  headers: { Authorization: { __jsExpr: BEARER_EXPR }, Accept: 'application/json' },
  toolCallTimeoutMs: 120_000,
}

/** The evaluated row: what the loader hands the running mcp-client instance. */
const EVALUATED = {
  ...AUTHORED,
  headers: { Authorization: EVALUATED_TOKEN, Accept: 'application/json' },
}

/** Minimal `ctx.loader`/`ctx.tools` stand-in for the projection functions. */
function fakeContext(entries, toolNames = []) {
  return {
    loader: { entries: () => entries },
    tools: { schemas: () => toolNames.map((name) => ({ name })) },
  }
}

function entry(overrides = {}) {
  return {
    id: 'include:mcp-github',
    options: { name: '@deepseek-ai/dsh-mcp-client', config: AUTHORED },
    disabled: false,
    fiber: { state: 2, config: EVALUATED },
    ...overrides,
  }
}

test('toServerConfig renders an authored !!js value as text, never as an object', () => {
  const config = toServerConfig(AUTHORED)
  assert.equal(config.headers?.Authorization, `${JS_EXPR_PREFIX}${BEARER_EXPR}`)
  assert.equal(config.headers?.Accept, 'application/json')
  assert.equal(config.serverName, 'github')
  assert.equal(config.toolCallTimeoutMs, 120_000)
})

test('toServerConfig leaves an evaluated value untouched', () => {
  assert.equal(toServerConfig(EVALUATED).headers?.Authorization, EVALUATED_TOKEN)
})

test('toServerConfig defaults the transport and tolerates junk', () => {
  assert.equal(toServerConfig({}).transport, 'streamable-http')
  assert.equal(toServerConfig({ transport: 'stdio' }).transport, 'stdio')
  assert.equal(toServerConfig(undefined).serverName, '')
})

test('probeConfigFor uses the evaluated config so the real credential is sent', () => {
  const source = probeConfigFor(entry())
  assert.equal(source.ok, true)
  assert.equal(source.config.headers?.Authorization, EVALUATED_TOKEN)
  assert.equal(source.config.headers?.Authorization?.includes('__jsExpr'), false)
})

test('probeConfigFor refuses to guess when the entry never started', () => {
  const source = probeConfigFor(entry({ fiber: undefined }))
  assert.equal(source.ok, false)
  assert.match(source.reason, /not running/)
  assert.match(source.reason, /headers\.Authorization/)
})

test('probeConfigFor falls back to the authored config when it has no expressions', () => {
  const plain = {
    serverName: 'filesystem',
    transport: 'stdio',
    command: 'node',
    args: ['server.mjs'],
  }
  const source = probeConfigFor({ options: { config: plain } })
  assert.equal(source.ok, true)
  assert.equal(source.config.command, 'node')
})

test('a disabled entry with an expression reports why it cannot be probed', () => {
  const source = probeConfigFor(entry({ disabled: true, fiber: undefined }))
  assert.equal(source.ok, false)
  assert.match(source.reason, /headers\.Authorization/)
})

test('listMcpServers projects authored config and live status', () => {
  const servers = listMcpServers(
    fakeContext([entry()], ['mcp__github__get_me', 'unrelated']),
    () => true,
  )
  assert.equal(servers.length, 1)
  const server = servers[0]
  assert.equal(server.id, 'mcp-github')
  assert.equal(server.enabled, true)
  assert.equal(server.fiberPhase, 'active')
  assert.equal(server.toolCount, 1)
  assert.equal(server.userManaged, true)
  assert.equal(server.headers?.Authorization, `${JS_EXPR_PREFIX}${BEARER_EXPR}`)
})

test('listMcpServers skips groups and non-mcp-client rows', () => {
  const servers = listMcpServers(
    fakeContext([
      entry({ options: { group: true, config: AUTHORED } }),
      entry({ options: { name: 'other-plugin', config: AUTHORED } }),
    ]),
    () => false,
  )
  assert.deepEqual(servers, [])
})
