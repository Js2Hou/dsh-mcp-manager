/**
 * MCP Manager settings section: server list with live status, add/remove,
 * enable/disable, edit and on-demand connectivity tests. Rendered inside the
 * Settings panel as the "MCP" page (a `settings.section` entry).
 *
 * Copy is fully localized (zh/en) through the shell's locale service and
 * follows the active GUI language automatically. The add form sits at the top
 * of the page; the edit form opens **in place of** the card being edited, and
 * the two modes are mutually exclusive.
 *
 * All data flows through the typed RPC client to the host half.
 *
 * @module dsh-mcp-manager/client/McpManagerSection
 */
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls `Context { locale }` into the program.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { McpFieldErrors, McpProbeResult, McpServerConfig, McpServerInfo } from '../shared.ts'
import { callRpc, McpManagerRpcError } from './rpc.ts'
import { NS } from './locales.ts'
import {
  EditIcon,
  PlugIcon,
  PlusIcon,
  PowerIcon,
  RefreshIcon,
  ServerIcon,
  TrashIcon,
} from './icons.tsx'

interface PatchInfo {
  path: string
  exists: boolean
}

/** Composed props: the settings shell's `close` owner share + injected ctx. */
interface SectionProps {
  close: () => void
  ctx: ClientContext
}

/** Status keys used by the card badge (a subset of the locale dictionary). */
type StatusKey =
  | 'statusConnected'
  | 'statusActiveNoTools'
  | 'statusFailed'
  | 'statusDisabled'
  | 'statusLoading'
  | 'statusPending'
  | 'statusUnloading'
  | 'statusNotLoaded'

function errorMessage(error: unknown, t: TranslateNS<typeof NS>): string {
  if (error instanceof McpManagerRpcError) {
    switch (error.code) {
      case 'duplicate-id': return t('errDuplicateId')
      case 'duplicate-server-name': return t('errDuplicateName')
      case 'invalid-config': return t('errInvalidConfig')
      case 'not-found': return t('errNotFound')
      default: return error.message.replace(/^[a-z-]+: /, '')
    }
  }
  return error instanceof Error ? error.message : String(error)
}

/** Derive the visual status of one server. */
function statusOf(server: McpServerInfo): { tone: string; key: StatusKey; count?: string } {
  if (!server.enabled) return { tone: 'off', key: 'statusDisabled' }
  switch (server.fiberPhase) {
    case 'active':
      // The fiber being active only means the mcp-client entry is running;
      // the MCP handshake succeeded only when tools are actually registered.
      // With zero tools the server is effectively not connected, so it must
      // never render green (that would mislead users into thinking the
      // connection is healthy when it failed, e.g. HTTP 401 / crash loop).
      return server.toolCount > 0
        ? { tone: 'ok', key: 'statusConnected', count: String(server.toolCount) }
        : { tone: 'warn', key: 'statusActiveNoTools' }
    case 'failed':
      return { tone: 'bad', key: 'statusFailed' }
    case 'loading':
      return { tone: 'warn', key: 'statusLoading' }
    case 'pending':
      return { tone: 'warn', key: 'statusPending' }
    case 'unloading':
      return { tone: 'warn', key: 'statusUnloading' }
    default:
      return { tone: 'off', key: 'statusNotLoaded' }
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
  const t = ctx.locale.bind(NS)
  const [, bump] = useReducer((x: number) => x + 1, 0)
  useEffect(() => ctx.locale.subscribe(bump), [ctx])

  const [servers, setServers] = useState<McpServerInfo[]>([])
  const [patchInfo, setPatchInfo] = useState<PatchInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [probes, setProbes] = useState<Record<string, McpProbeResult>>({})

  const formOpen = adding || editingId !== null
  const actionsDisabled = busy !== null || formOpen

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { servers: list } = await callRpc<{ servers: McpServerInfo[] }>(ctx, 'list')
      setServers(list)
      const { patch } = await callRpc<{ patch: PatchInfo }>(ctx, 'patchInfo')
      setPatchInfo(patch)
    } catch (err) {
      setError(errorMessage(err, t))
    } finally {
      setLoading(false)
    }
  }, [ctx, t])

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
      setError(errorMessage(err, t))
    } finally {
      setBusy(null)
    }
  }, [refreshSettled, t])

  const toggleEnabled = useCallback((server: McpServerInfo) => {
    void run(
      () => callRpc(ctx, 'setEnabled', { id: server.id, enabled: !server.enabled }),
      `toggle:${server.id}`,
    )
  }, [ctx, run])

  const removeServer = useCallback((server: McpServerInfo) => {
    if (!window.confirm(t('removeConfirm', { name: server.serverName, id: server.id }))) return
    void run(() => callRpc(ctx, 'remove', { id: server.id }), `remove:${server.id}`)
  }, [ctx, run, t])

  const testConnection = useCallback((server: McpServerInfo) => {
    void run(async () => {
      const result = await callRpc<McpProbeResult>(ctx, 'probe', { id: server.id })
      setProbes((prev) => ({ ...prev, [server.id]: result }))
    }, `probe:${server.id}`)
  }, [ctx, run])

  const beginAdd = useCallback(() => {
    setEditingId(null)
    setAdding(true)
  }, [])

  const closeForms = useCallback(() => {
    setAdding(false)
    setEditingId(null)
  }, [])

  const beginEdit = useCallback((server: McpServerInfo) => {
    setAdding(false)
    setEditingId(server.id)
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
          {t('title')}
          <span className="dshmcp-head-sub">{t('total', { count: String(summary.total) })}</span>
        </span>
        <button type="button" className="dshmcp-iconbtn" title={t('refresh')} onClick={() => void refresh()} disabled={actionsDisabled || loading}>
          {loading ? <span className="dshmcp-spin" /> : <RefreshIcon size={14} />}
        </button>
      </div>

      <div className="dshmcp-toolbar">
        <button
          type="button"
          className="dshmcp-btn dshmcp-btn-primary dshmcp-btn-sm"
          onClick={beginAdd}
          disabled={actionsDisabled}
          title={editingId !== null ? t('formEditTitle', { name: servers.find((s) => s.id === editingId)?.serverName ?? editingId }) : undefined}
        >
          <PlusIcon size={12} /> {t('addServer')}
        </button>
        <span className="dshmcp-spacer" />
        <span className="dshmcp-meta">
          <span>{t('connected', { count: String(summary.connected) })}</span>
          {summary.failed > 0 ? <span className="dshmcp-probe-bad">{t('failed', { count: String(summary.failed) })}</span> : null}
          <span>{t('enabledOf', { count: String(summary.enabled), total: String(summary.total) })}</span>
        </span>
      </div>

      {error !== null ? <div className="dshmcp-error">{error}</div> : null}

      {adding ? (
        <ServerForm
          ctx={ctx}
          t={t}
          initial={undefined}
          existingIds={new Set(servers.map((s) => s.id))}
          existingNames={new Set(servers.map((s) => s.serverName))}
          busy={busy !== null}
          onCancel={closeForms}
          onSaved={() => {
            closeForms()
            void run(() => Promise.resolve(), 'form:add')
          }}
        />
      ) : null}

      {loading && servers.length === 0 ? (
        <div className="dshmcp-empty"><span className="dshmcp-spin" /> {t('loading')}</div>
      ) : null}

      {!loading && servers.length === 0 ? (
        <div className="dshmcp-empty">
          {t('empty')}
          <br />
          {t('emptyHint')}
        </div>
      ) : null}

      {servers.map((server) => {
        if (server.id === editingId) {
          return (
            <ServerForm
              key={server.id}
              ctx={ctx}
              t={t}
              initial={server}
              existingIds={new Set(servers.map((s) => s.id))}
              existingNames={new Set(servers.map((s) => s.serverName))}
              busy={busy !== null}
              onCancel={closeForms}
              onSaved={() => {
                closeForms()
                void run(() => Promise.resolve(), `form:update:${server.id}`)
              }}
            />
          )
        }
        const status = statusOf(server)
        const probe = probes[server.id]
        return (
          <div className="dshmcp-card" key={server.id}>
            <div className="dshmcp-card-head">
              <span className={`dshmcp-status dshmcp-status-${status.tone}`}>
                <span className="dshmcp-status-dot" />
                {t(status.key, status.count !== undefined ? { count: status.count } : undefined)}
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
              <span>{t('toolCount', { count: String(server.toolCount) })}</span>
              {!server.userManaged ? <span>{t('bundleDefined')}</span> : null}
              {server.failOnStartupError === true ? <span>failOnStartupError</span> : null}
              {server.reconnect?.enabled === false ? <span>{t('reconnectOff')}</span> : null}
            </div>
            {probe !== undefined ? (
              <div className={`dshmcp-probe ${probe.ok ? 'dshmcp-probe-ok' : 'dshmcp-probe-bad'}`}>
                {probe.ok
                  ? t('probeOk', {
                      ms: String(probe.latencyMs),
                      count: probe.toolCount !== undefined ? String(probe.toolCount) : '?',
                    })
                  : t('probeFail', { error: probe.error ?? 'failed', ms: String(probe.latencyMs) })}
              </div>
            ) : null}
            <div className="dshmcp-actions">
              <button type="button" className="dshmcp-btn dshmcp-btn-sm" onClick={() => toggleEnabled(server)} disabled={actionsDisabled}>
                <PowerIcon size={12} /> {server.enabled ? t('disable') : t('enable')}
              </button>
              <button type="button" className="dshmcp-btn dshmcp-btn-sm" onClick={() => testConnection(server)} disabled={actionsDisabled}>
                {busy === `probe:${server.id}` ? <span className="dshmcp-spin" /> : <PlugIcon size={12} />} {t('test')}
              </button>
              <button type="button" className="dshmcp-btn dshmcp-btn-sm" onClick={() => beginEdit(server)} disabled={actionsDisabled}>
                <EditIcon size={12} /> {t('edit')}
              </button>
              <span className="dshmcp-spacer" />
              <button
                type="button"
                className="dshmcp-btn dshmcp-btn-sm dshmcp-btn-danger"
                onClick={() => removeServer(server)}
                disabled={actionsDisabled}
                title={server.userManaged ? t('remove') : t('bundleDefined')}
              >
                <TrashIcon size={12} /> {t('remove')}
              </button>
            </div>
          </div>
        )
      })}

      {patchInfo !== null ? (
        <div className="dshmcp-footer" title={patchInfo.path}>
          {patchInfo.exists ? patchInfo.path : t('patchMissing', { path: patchInfo.path })}
        </div>
      ) : null}
    </div>
  )
}

interface ServerFormProps {
  ctx: ClientContext
  t: TranslateNS<typeof NS>
  initial?: McpServerInfo
  existingIds: Set<string>
  existingNames: Set<string>
  busy: boolean
  onCancel: () => void
  onSaved: () => void
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

/** Trim surrounding quotes from a pasted JSON-style key/value pair. */
function stripQuotes(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1).trim()
    }
  }
  return trimmed
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
    out[stripQuotes(line.slice(0, sep))] = stripQuotes(line.slice(sep + 1))
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
 * Add/edit server form with per-field validation feedback. Localized labels
 * and validation messages; when editing, the id field is locked.
 * @param props - form context and callbacks.
 */
function ServerForm({ ctx, t, initial, existingIds, existingNames, busy, onCancel, onSaved }: ServerFormProps): JSX.Element {
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
    if (form.id.trim() === '') errors['id'] = t('errIdRequired')
    else if (!/^[A-Za-z0-9_-]{1,64}$/.test(form.id.trim())) errors['id'] = t('errIdPattern')
    else if (!editing && existingIds.has(form.id.trim())) errors['id'] = t('errIdTaken')
    if (form.serverName.trim() === '') errors['serverName'] = t('errNameRequired')
    else if (!/^[A-Za-z0-9_-]{1,32}$/.test(form.serverName.trim())) errors['serverName'] = t('errNamePattern')
    else if (!editing && existingNames.has(form.serverName.trim())) errors['serverName'] = t('errNameTaken')
    if (form.transport === 'streamable-http' && form.url.trim() === '') errors['url'] = t('errUrlRequired')
    if (form.transport === 'stdio' && form.command.trim() === '') errors['command'] = t('errCommandRequired')
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
      onSaved()
    } catch (err) {
      if (err instanceof McpManagerRpcError && err.fields !== undefined) setFieldErrors(err.fields)
      setSubmitError(errorMessage(err, t))
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
        {editing ? t('formEditTitle', { name: initial!.serverName }) : t('formAddTitle')}
      </div>

      <div className="dshmcp-field-row">
        <div className="dshmcp-field">
          <label className="dshmcp-label" htmlFor="dshmcp-id">{t('fieldId')}</label>
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
          <label className="dshmcp-label" htmlFor="dshmcp-server">{t('fieldServerName')}</label>
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
        <label className="dshmcp-label" htmlFor="dshmcp-transport">{t('fieldTransport')}</label>
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
          <label className="dshmcp-label" htmlFor="dshmcp-url">{t('fieldUrl')}</label>
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
            <label className="dshmcp-label" htmlFor="dshmcp-command">{t('fieldCommand')}</label>
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
            <label className="dshmcp-label" htmlFor="dshmcp-args">{t('fieldArgs')}</label>
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
            <label className="dshmcp-label" htmlFor="dshmcp-env">{t('fieldEnv')}</label>
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
            <label className="dshmcp-label" htmlFor="dshmcp-cwd">{t('fieldCwd')}</label>
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
        <label className="dshmcp-label" htmlFor="dshmcp-headers">{t('fieldHeaders')}</label>
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
          <label className="dshmcp-label" htmlFor="dshmcp-timeout">{t('fieldTimeout')}</label>
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
            {t('fieldFailStartup')}
          </label>
        </div>
      </div>

      {submitError !== null ? <div className="dshmcp-error">{submitError}</div> : null}

      <div className="dshmcp-form-actions">
        <button type="button" className="dshmcp-btn dshmcp-btn-sm" onClick={onCancel} disabled={saving}>
          {t('cancel')}
        </button>
        <button type="button" className="dshmcp-btn dshmcp-btn-sm dshmcp-btn-primary" onClick={() => void submit()} disabled={saving || busy}>
          {saving ? <span className="dshmcp-spin" /> : null} {editing ? t('save') : t('addServer')}
        </button>
      </div>
    </div>
  )
}
