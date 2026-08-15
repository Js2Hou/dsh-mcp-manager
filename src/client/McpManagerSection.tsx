/**
 * MCP Manager settings section: server list with live status, add/remove,
 * enable/disable, edit and on-demand connectivity tests. Rendered inside the
 * Settings panel as the "MCP" page (a `settings.section` entry).
 *
 * All data flows through the typed RPC client to the host half.
 *
 * @module dsh-mcp-manager/client/McpManagerSection
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { McpFieldErrors, McpProbeResult, McpServerConfig, McpServerInfo } from '../shared.ts'
import { callRpc, McpManagerRpcError } from './rpc.ts'
import {
  EditIcon,
  PlugIcon,
  PlusIcon,
  PowerIcon,
  RefreshIcon,
  ServerIcon,
  TrashIcon,
} from './icons.tsx'

/** Human label for a fiber phase. */
const PHASE_LABEL: Record<string, string> = {
  pending: 'Pending',
  loading: 'Loading',
  active: 'Active',
  failed: 'Failed',
  unloading: 'Unloading',
}

interface PatchInfo {
  path: string
  exists: boolean
}

/** Composed props: the settings shell's `close` owner share + injected ctx. */
interface SectionProps {
  close: () => void
  ctx: ClientContext
}

function errorMessage(error: unknown): string {
  if (error instanceof McpManagerRpcError) return error.message.replace(/^[a-z-]+: /, '')
  return error instanceof Error ? error.message : String(error)
}

/** Derive the visual status of one server. */
function statusOf(server: McpServerInfo): { tone: string; label: string } {
  if (!server.enabled) return { tone: 'off', label: 'Disabled' }
  switch (server.fiberPhase) {
    case 'active':
      if (server.toolCount > 0) {
        return { tone: 'ok', label: `Connected · ${server.toolCount} tools` }
      }
      return { tone: 'ok', label: 'Active · 0 tools' }
    case 'failed':
      return { tone: 'bad', label: 'Failed' }
    case 'loading':
    case 'pending':
    case 'unloading':
      return { tone: 'warn', label: PHASE_LABEL[server.fiberPhase] }
    default:
      return { tone: 'off', label: 'Not loaded' }
  }
}

function targetOf(server: McpServerInfo): string {
  if (server.transport === 'stdio') {
    return [server.command, ...(server.args ?? [])].filter(Boolean).join(' ')
  }
  return server.url ?? ''
}

/**
 * The MCP Manager settings page body.
 * @param props - settings owner `close` + injected client context.
 */
export function McpManagerSection({ ctx }: SectionProps): JSX.Element {
  const [servers, setServers] = useState<McpServerInfo[]>([])
  const [patchInfo, setPatchInfo] = useState<PatchInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<McpServerInfo | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [probes, setProbes] = useState<Record<string, McpProbeResult>>({})

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { servers: list } = await callRpc<{ servers: McpServerInfo[] }>(ctx, 'list')
      setServers(list)
      const { patch } = await callRpc<{ patch: PatchInfo }>(ctx, 'patchInfo')
      setPatchInfo(patch)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [ctx])

  useEffect(() => { void refresh() }, [refresh])

  /** Refresh, then re-poll a few times while the HMR reload settles. */
  const refreshSettled = useCallback(() => {
    void refresh()
    window.setTimeout(() => { void refresh() }, 800)
    window.setTimeout(() => { void refresh() }, 2400)
  }, [refresh])

  const run = useCallback(async (action: () => Promise<unknown>, label: string) => {
    setBusy(label)
    setError(null)
    try {
      await action()
      refreshSettled()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }, [refreshSettled])

  const toggleEnabled = useCallback((server: McpServerInfo) => {
    void run(
      () => callRpc(ctx, 'setEnabled', { id: server.id, enabled: !server.enabled }),
      `toggle:${server.id}`,
    )
  }, [ctx, run])

  const removeServer = useCallback((server: McpServerInfo) => {
    if (!window.confirm(`Remove MCP server "${server.serverName}" (${server.id})?\nThis edits cordis.patch.yml and disconnects its tools.`)) return
    void run(() => callRpc(ctx, 'remove', { id: server.id }), `remove:${server.id}`)
  }, [ctx, run])

  const testConnection = useCallback((server: McpServerInfo) => {
    void run(async () => {
      const result = await callRpc<McpProbeResult>(ctx, 'probe', { id: server.id })
      setProbes((prev) => ({ ...prev, [server.id]: result }))
    }, `probe:${server.id}`)
  }, [ctx, run])

  const beginAdd = useCallback(() => {
    setEditing(null)
    setShowForm(true)
  }, [])

  const beginEdit = useCallback((server: McpServerInfo) => {
    setEditing(server)
    setShowForm(true)
  }, [])

  const summary = useMemo(() => {
    const enabled = servers.filter((s) => s.enabled).length
    const connected = servers.filter((s) => s.enabled && s.fiberPhase === 'active' && s.toolCount > 0).length
    const failed = servers.filter((s) => s.enabled && s.fiberPhase === 'failed').length
    return { total: servers.length, enabled, connected, failed }
  }, [servers])

  return (
    <div className="dshmcp-section">
      <div className="dshmcp-head">
        <span className="dshmcp-head-title">
          <ServerIcon size={15} />
          MCP servers
          <span className="dshmcp-head-sub">{summary.total} total</span>
        </span>
        <button type="button" className="dshmcp-iconbtn" title="Refresh" onClick={() => void refresh()} disabled={busy !== null || loading}>
          {loading ? <span className="dshmcp-spin" /> : <RefreshIcon size={14} />}
        </button>
      </div>

      <div className="dshmcp-toolbar">
        <button type="button" className="dshmcp-btn dshmcp-btn-primary dshmcp-btn-sm" onClick={beginAdd} disabled={busy !== null}>
          <PlusIcon size={12} /> Add server
        </button>
        <span className="dshmcp-spacer" />
        <span className="dshmcp-meta">
          <span>{summary.connected} connected</span>
          {summary.failed > 0 ? <span className="dshmcp-probe-bad">{summary.failed} failed</span> : null}
          <span>{summary.enabled}/{summary.total} enabled</span>
        </span>
      </div>

      {error !== null ? <div className="dshmcp-error">{error}</div> : null}

      {showForm ? (
        <ServerForm
          ctx={ctx}
          initial={editing ?? undefined}
          existingIds={new Set(servers.map((s) => s.id))}
          existingNames={new Set(servers.map((s) => s.serverName))}
          busy={busy !== null}
          onCancel={() => setShowForm(false)}
          onSaved={(label) => {
            setShowForm(false)
            setEditing(null)
            void run(() => Promise.resolve(), label)
          }}
        />
      ) : null}

      {loading && servers.length === 0 ? (
        <div className="dshmcp-empty"><span className="dshmcp-spin" /> Loading servers…</div>
      ) : null}

      {!loading && servers.length === 0 ? (
        <div className="dshmcp-empty">
          No MCP servers configured.
          <br />
          Use “Add server” to connect one.
        </div>
      ) : null}

      {servers.map((server) => {
        const status = statusOf(server)
        const probe = probes[server.id]
        return (
          <div className="dshmcp-card" key={server.id}>
            <div className="dshmcp-card-head">
              <span className={`dshmcp-status dshmcp-status-${status.tone}`}>
                <span className="dshmcp-status-dot" />
                {status.label}
              </span>
              <span className="dshmcp-spacer" />
              <span className="dshmcp-id" title={server.id}>{server.id}</span>
            </div>
            <div className="dshmcp-name">{server.serverName || '(unnamed)'}</div>
            <div className="dshmcp-target" title={targetOf(server)}>
              {targetOf(server) || (server.transport === 'stdio' ? 'stdio' : server.url ?? 'streamable-http')}
            </div>
            <div className="dshmcp-meta">
              <span>{server.transport}</span>
              <span>{server.toolCount} tool{server.toolCount === 1 ? '' : 's'}</span>
              {!server.userManaged ? <span>bundle-defined</span> : null}
              {server.failOnStartupError === true ? <span>failOnStartupError</span> : null}
              {server.reconnect?.enabled === false ? <span>reconnect off</span> : null}
            </div>
            {probe !== undefined ? (
              <div className={`dshmcp-probe ${probe.ok ? 'dshmcp-probe-ok' : 'dshmcp-probe-bad'}`}>
                {probe.ok
                  ? `✓ Connected in ${probe.latencyMs}ms${probe.toolCount !== undefined ? ` · ${probe.toolCount} tools` : ''}`
                  : `✗ ${probe.error ?? 'failed'} (${probe.latencyMs}ms)`}
              </div>
            ) : null}
            <div className="dshmcp-actions">
              <button type="button" className="dshmcp-btn dshmcp-btn-sm" onClick={() => toggleEnabled(server)} disabled={busy !== null}>
                <PowerIcon size={12} /> {server.enabled ? 'Disable' : 'Enable'}
              </button>
              <button type="button" className="dshmcp-btn dshmcp-btn-sm" onClick={() => testConnection(server)} disabled={busy !== null}>
                {busy === `probe:${server.id}` ? <span className="dshmcp-spin" /> : <PlugIcon size={12} />} Test
              </button>
              <button type="button" className="dshmcp-btn dshmcp-btn-sm" onClick={() => beginEdit(server)} disabled={busy !== null}>
                <EditIcon size={12} /> Edit
              </button>
              <span className="dshmcp-spacer" />
              <button
                type="button"
                className="dshmcp-btn dshmcp-btn-sm dshmcp-btn-danger"
                onClick={() => removeServer(server)}
                disabled={busy !== null}
                title={server.userManaged ? 'Remove from cordis.patch.yml' : 'Removes the user-patch override (bundle-defined entry stays disabled only if applicable)'}
              >
                <TrashIcon size={12} /> Remove
              </button>
            </div>
          </div>
        )
      })}

      {patchInfo !== null ? (
        <div className="dshmcp-footer" title={patchInfo.path}>
          {patchInfo.exists ? patchInfo.path : `patch file missing: ${patchInfo.path}`}
        </div>
      ) : null}
    </div>
  )
}

interface ServerFormProps {
  ctx: ClientContext
  initial?: McpServerInfo
  existingIds: Set<string>
  existingNames: Set<string>
  busy: boolean
  onCancel: () => void
  onSaved: (label: string) => void
}

interface FormState {
  id: string
  serverName: string
  transport: 'stdio' | 'streamable-http'
  url: string
  command: string
  argsText: string
  envText: string
  cwd: string
  headersText: string
  toolCallTimeoutMs: string
  failOnStartupError: boolean
}

const EMPTY_FORM: FormState = {
  id: '',
  serverName: '',
  transport: 'streamable-http',
  url: '',
  command: '',
  argsText: '',
  envText: '',
  cwd: '',
  headersText: '',
  toolCallTimeoutMs: '',
  failOnStartupError: false,
}

function toForm(server: McpServerInfo | undefined): FormState {
  if (server === undefined) return EMPTY_FORM
  return {
    id: server.id,
    serverName: server.serverName,
    transport: server.transport,
    url: server.url ?? '',
    command: server.command ?? '',
    argsText: (server.args ?? []).join('\n'),
    envText: (server.env !== undefined ? Object.entries(server.env).map(([k, v]) => `${k}=${v}`) : []).join('\n'),
    cwd: server.cwd ?? '',
    headersText: (server.headers !== undefined ? Object.entries(server.headers).map(([k, v]) => `${k}: ${v}`) : []).join('\n'),
    toolCallTimeoutMs: server.toolCallTimeoutMs !== undefined ? String(server.toolCallTimeoutMs) : '',
    failOnStartupError: server.failOnStartupError === true,
  }
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== '')
}

function parsePairs(text: string): Record<string, string> | undefined {
  const lines = splitLines(text)
  if (lines.length === 0) return undefined
  const out: Record<string, string> = {}
  for (const line of lines) {
    const eq = line.indexOf('=')
    const colon = line.indexOf(':')
    const sep = eq === -1 ? colon : colon === -1 ? eq : Math.min(eq, colon)
    if (sep <= 0) continue
    out[line.slice(0, sep).trim()] = line.slice(sep + 1).trim()
  }
  return out
}

function toConfig(form: FormState): McpServerConfig {
  const config: McpServerConfig = {
    serverName: form.serverName.trim(),
    transport: form.transport,
  }
  if (form.transport === 'streamable-http') {
    if (form.url.trim() !== '') config.url = form.url.trim()
  } else {
    if (form.command.trim() !== '') config.command = form.command.trim()
    const args = splitLines(form.argsText)
    if (args.length > 0) config.args = args
    const env = parsePairs(form.envText)
    if (env !== undefined) config.env = env
    if (form.cwd.trim() !== '') config.cwd = form.cwd.trim()
  }
  const headers = parsePairs(form.headersText)
  if (headers !== undefined) config.headers = headers
  if (form.toolCallTimeoutMs.trim() !== '' && Number.isFinite(Number(form.toolCallTimeoutMs))) {
    config.toolCallTimeoutMs = Number(form.toolCallTimeoutMs)
  }
  if (form.failOnStartupError) config.failOnStartupError = true
  return config
}

/**
 * Add/edit server form with per-field validation feedback.
 * @param props - form context and callbacks.
 */
function ServerForm({ ctx, initial, existingIds, existingNames, busy, onCancel, onSaved }: ServerFormProps): JSX.Element {
  const editing = initial !== undefined
  const [form, setForm] = useState<FormState>(() => toForm(initial))
  const [fieldErrors, setFieldErrors] = useState<McpFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateLocal = (): McpFieldErrors => {
    const errors: McpFieldErrors = {}
    if (form.id.trim() === '') errors['id'] = 'Entry id is required'
    else if (!/^[A-Za-z0-9_-]{1,64}$/.test(form.id.trim())) errors['id'] = 'Match [A-Za-z0-9_-]{1,64}'
    else if (!editing && existingIds.has(form.id.trim())) errors['id'] = 'Entry id already in use'
    if (form.serverName.trim() === '') errors['serverName'] = 'serverName is required'
    else if (!/^[A-Za-z0-9_-]{1,32}$/.test(form.serverName.trim())) errors['serverName'] = 'Match [A-Za-z0-9_-]{1,32}'
    else if (!editing && existingNames.has(form.serverName.trim())) errors['serverName'] = 'serverName already in use'
    if (form.transport === 'streamable-http' && form.url.trim() === '') errors['url'] = 'URL is required'
    if (form.transport === 'stdio' && form.command.trim() === '') errors['command'] = 'Command is required'
    return errors
  }

  const submit = async (): Promise<void> => {
    const local = validateLocal()
    setFieldErrors(local)
    if (Object.keys(local).length > 0) return
    setSaving(true)
    setSubmitError(null)
    try {
      const payload = { id: form.id.trim(), config: toConfig(form) }
      if (editing) {
        await callRpc(ctx, 'update', payload)
      } else {
        await callRpc(ctx, 'add', payload)
      }
      onSaved(editing ? `update:${payload.id}` : `add:${payload.id}`)
    } catch (err) {
      if (err instanceof McpManagerRpcError && err.fields !== undefined) setFieldErrors(err.fields)
      setSubmitError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const err = (key: keyof McpFieldErrors): string | undefined => fieldErrors[key]
  const inputClass = (key: keyof McpFieldErrors): string =>
    `dshmcp-input${err(key) !== undefined ? ' dshmcp-input-invalid' : ''}`

  return (
    <div className="dshmcp-form">
      <div className="dshmcp-form-title">
        {editing ? `Edit ${initial!.serverName}` : 'Add MCP server'}
      </div>

      <div className="dshmcp-field-row">
        <div className="dshmcp-field">
          <label className="dshmcp-label" htmlFor="dshmcp-id">Entry id</label>
          <input
            id="dshmcp-id"
            className={inputClass('id')}
            value={form.id}
            placeholder="mcp-github"
            spellCheck={false}
            disabled={editing || saving || busy}
            onChange={(e) => set('id', e.target.value)}
          />
          {err('id') !== undefined ? <p className="dshmcp-hint">{err('id')}</p> : null}
        </div>
        <div className="dshmcp-field">
          <label className="dshmcp-label" htmlFor="dshmcp-server">serverName</label>
          <input
            id="dshmcp-server"
            className={inputClass('serverName')}
            value={form.serverName}
            placeholder="github"
            spellCheck={false}
            disabled={saving || busy}
            onChange={(e) => set('serverName', e.target.value)}
          />
          {err('serverName') !== undefined ? <p className="dshmcp-hint">{err('serverName')}</p> : null}
        </div>
      </div>

      <div className="dshmcp-field">
        <label className="dshmcp-label" htmlFor="dshmcp-transport">Transport</label>
        <select
          id="dshmcp-transport"
          className="dshmcp-select"
          value={form.transport}
          disabled={saving || busy}
          onChange={(e) => set('transport', e.target.value as 'stdio' | 'streamable-http')}
        >
          <option value="streamable-http">streamable-http</option>
          <option value="stdio">stdio</option>
        </select>
      </div>

      {form.transport === 'streamable-http' ? (
        <div className="dshmcp-field">
          <label className="dshmcp-label" htmlFor="dshmcp-url">URL</label>
          <input
            id="dshmcp-url"
            className={inputClass('url')}
            value={form.url}
            placeholder="http://127.0.0.1:3000/mcp"
            spellCheck={false}
            disabled={saving || busy}
            onChange={(e) => set('url', e.target.value)}
          />
          {err('url') !== undefined ? <p className="dshmcp-hint">{err('url')}</p> : null}
        </div>
      ) : (
        <>
          <div className="dshmcp-field">
            <label className="dshmcp-label" htmlFor="dshmcp-command">Command</label>
            <input
              id="dshmcp-command"
              className={inputClass('command')}
              value={form.command}
              placeholder="npx"
              spellCheck={false}
              disabled={saving || busy}
              onChange={(e) => set('command', e.target.value)}
            />
            {err('command') !== undefined ? <p className="dshmcp-hint">{err('command')}</p> : null}
          </div>
          <div className="dshmcp-field">
            <label className="dshmcp-label" htmlFor="dshmcp-args">Args (one per line)</label>
            <textarea
              id="dshmcp-args"
              className="dshmcp-input"
              rows={3}
              value={form.argsText}
              placeholder={'-y\n@modelcontextprotocol/server-github'}
              spellCheck={false}
              disabled={saving || busy}
              onChange={(e) => set('argsText', e.target.value)}
            />
          </div>
          <div className="dshmcp-field">
            <label className="dshmcp-label" htmlFor="dshmcp-env">Env (KEY=VALUE, one per line)</label>
            <textarea
              id="dshmcp-env"
              className="dshmcp-input"
              rows={3}
              value={form.envText}
              placeholder={'GITHUB_TOKEN=ghp_xxx'}
              spellCheck={false}
              disabled={saving || busy}
              onChange={(e) => set('envText', e.target.value)}
            />
          </div>
          <div className="dshmcp-field">
            <label className="dshmcp-label" htmlFor="dshmcp-cwd">Working directory (optional)</label>
            <input
              id="dshmcp-cwd"
              className="dshmcp-input"
              value={form.cwd}
              spellCheck={false}
              disabled={saving || busy}
              onChange={(e) => set('cwd', e.target.value)}
            />
          </div>
        </>
      )}

      <div className="dshmcp-field">
        <label className="dshmcp-label" htmlFor="dshmcp-headers">Headers (Key: Value, one per line)</label>
        <textarea
          id="dshmcp-headers"
          className="dshmcp-input"
          rows={2}
          value={form.headersText}
          placeholder={'Authorization: Bearer xxx'}
          spellCheck={false}
          disabled={saving || busy}
          onChange={(e) => set('headersText', e.target.value)}
        />
      </div>

      <div className="dshmcp-field-row">
        <div className="dshmcp-field">
          <label className="dshmcp-label" htmlFor="dshmcp-timeout">toolCallTimeoutMs (optional)</label>
          <input
            id="dshmcp-timeout"
            className="dshmcp-input"
            value={form.toolCallTimeoutMs}
            inputMode="numeric"
            placeholder="60000"
            disabled={saving || busy}
            onChange={(e) => set('toolCallTimeoutMs', e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <div className="dshmcp-field" style={{ justifyContent: 'flex-end' }}>
          <label className="dshmcp-check">
            <input
              type="checkbox"
              checked={form.failOnStartupError}
              disabled={saving || busy}
              onChange={(e) => set('failOnStartupError', e.target.checked)}
            />
            failOnStartupError
          </label>
        </div>
      </div>

      {submitError !== null ? <div className="dshmcp-error">{submitError}</div> : null}

      <div className="dshmcp-form-actions">
        <button type="button" className="dshmcp-btn dshmcp-btn-sm" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="dshmcp-btn dshmcp-btn-sm dshmcp-btn-primary" onClick={() => void submit()} disabled={saving || busy}>
          {saving ? <span className="dshmcp-spin" /> : null} {editing ? 'Save changes' : 'Add server'}
        </button>
      </div>
    </div>
  )
}
