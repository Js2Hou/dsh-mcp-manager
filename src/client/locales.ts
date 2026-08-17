/**
 * Locale dictionaries for the MCP Manager section. The web GUI's active
 * locale (zh/en) selects the dictionary automatically; technical identifiers
 * (serverName, transport names, config keys) stay untranslated in both.
 *
 * @module dsh-mcp-manager/client/locales
 */

/** Locale namespace for this plugin's copy. */
export const NS = 'mcpManager'

/** Key union merged into the slots LocaleNamespaceMap. */
export type McpManagerKeys =
  | 'nav'
  | 'title'
  | 'total'
  | 'addServer'
  | 'connected'
  | 'failed'
  | 'enabledOf'
  | 'refresh'
  | 'loading'
  | 'empty'
  | 'emptyHint'
  | 'patchMissing'
  | 'removeConfirm'
  | 'statusConnected'
  | 'statusActiveNoTools'
  | 'statusFailed'
  | 'statusDisabled'
  | 'statusLoading'
  | 'statusPending'
  | 'statusUnloading'
  | 'statusNotLoaded'
  | 'toolCount'
  | 'bundleDefined'
  | 'reconnectOff'
  | 'probeOk'
  | 'probeFail'
  | 'enable'
  | 'disable'
  | 'test'
  | 'edit'
  | 'remove'
  | 'formAddTitle'
  | 'formEditTitle'
  | 'fieldId'
  | 'fieldServerName'
  | 'fieldTransport'
  | 'fieldUrl'
  | 'fieldCommand'
  | 'fieldArgs'
  | 'fieldEnv'
  | 'fieldCwd'
  | 'fieldHeaders'
  | 'fieldTimeout'
  | 'fieldFailStartup'
  | 'cancel'
  | 'save'
  | 'errIdRequired'
  | 'errIdPattern'
  | 'errIdTaken'
  | 'errNameRequired'
  | 'errNamePattern'
  | 'errNameTaken'
  | 'errUrlRequired'
  | 'errCommandRequired'
  | 'errDuplicateId'
  | 'errDuplicateName'
  | 'errInvalidConfig'
  | 'errNotFound'
  | 'errUnknown'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    mcpManager: McpManagerKeys
  }
}

/** Simplified lookup type (the LocaleDictOf resolution needs the merge above). */
export type McpManagerDict = Record<McpManagerKeys, string>

/** Simplified lookup type (the LocaleDictOf resolution needs the merge above). */
export const zh: McpManagerDict = {
  nav: 'MCP',
  title: 'MCP 服务器',
  total: '共 {count} 个',
  addServer: '添加服务器',
  connected: '{count} 个已连接',
  failed: '{count} 个失败',
  enabledOf: '{count}/{total} 已启用',
  refresh: '刷新',
  loading: '正在加载服务器…',
  empty: '尚未配置 MCP 服务器。',
  emptyHint: '点击“添加服务器”开始接入。',
  patchMissing: '补丁文件缺失：{path}',
  removeConfirm: '删除 MCP 服务器 “{name}”（{id}）？\n此操作会修改 cordis.patch.yml 并断开其工具。',
  statusConnected: '已连接 · {count} 个工具',
  statusActiveNoTools: '未连接 · 无工具',
  statusFailed: '失败',
  statusDisabled: '已停用',
  statusLoading: '加载中',
  statusPending: '等待中',
  statusUnloading: '卸载中',
  statusNotLoaded: '未加载',
  toolCount: '{count} 个工具',
  bundleDefined: 'bundle 定义',
  reconnectOff: '已关闭重连',
  probeOk: '✓ 已连接，耗时 {ms}ms · {count} 个工具',
  probeFail: '✗ {error}（{ms}ms）',
  enable: '启用',
  disable: '停用',
  test: '测试',
  edit: '编辑',
  remove: '删除',
  formAddTitle: '添加 MCP 服务器',
  formEditTitle: '编辑 {name}',
  fieldId: '条目 ID',
  fieldServerName: 'serverName',
  fieldTransport: '传输方式',
  fieldUrl: 'URL',
  fieldCommand: '命令',
  fieldArgs: '参数（每行一个）',
  fieldEnv: '环境变量（KEY=VALUE，每行一个）',
  fieldCwd: '工作目录（可选）',
  fieldHeaders: '请求头（Key: Value，每行一个）',
  fieldTimeout: 'toolCallTimeoutMs（可选）',
  fieldFailStartup: 'failOnStartupError',
  cancel: '取消',
  save: '保存更改',
  errIdRequired: '条目 ID 必填',
  errIdPattern: '需匹配 [A-Za-z0-9_-]{1,64}',
  errIdTaken: '条目 ID 已被占用',
  errNameRequired: 'serverName 必填',
  errNamePattern: '需匹配 [A-Za-z0-9_-]{1,32}',
  errNameTaken: 'serverName 已被占用',
  errUrlRequired: 'URL 必填',
  errCommandRequired: '命令必填',
  errDuplicateId: '条目 ID 已被使用',
  errDuplicateName: 'serverName 已被其他服务器使用',
  errInvalidConfig: 'MCP 服务器配置无效',
  errNotFound: '未找到该 MCP 服务器条目',
  errUnknown: '操作失败',
}

/** English dictionary. */
export const en: McpManagerDict = {
  nav: 'MCP',
  title: 'MCP servers',
  total: '{count} total',
  addServer: 'Add server',
  connected: '{count} connected',
  failed: '{count} failed',
  enabledOf: '{count}/{total} enabled',
  refresh: 'Refresh',
  loading: 'Loading servers…',
  empty: 'No MCP servers configured.',
  emptyHint: 'Use “Add server” to connect one.',
  patchMissing: 'patch file missing: {path}',
  removeConfirm: 'Remove MCP server "{name}" ({id})?\nThis edits cordis.patch.yml and disconnects its tools.',
  statusConnected: 'Connected · {count} tools',
  statusActiveNoTools: 'Not connected · no tools',
  statusFailed: 'Failed',
  statusDisabled: 'Disabled',
  statusLoading: 'Loading',
  statusPending: 'Pending',
  statusUnloading: 'Unloading',
  statusNotLoaded: 'Not loaded',
  toolCount: '{count} tools',
  bundleDefined: 'bundle-defined',
  reconnectOff: 'reconnect off',
  probeOk: '✓ Connected in {ms}ms · {count} tools',
  probeFail: '✗ {error} ({ms}ms)',
  enable: 'Enable',
  disable: 'Disable',
  test: 'Test',
  edit: 'Edit',
  remove: 'Remove',
  formAddTitle: 'Add MCP server',
  formEditTitle: 'Edit {name}',
  fieldId: 'Entry id',
  fieldServerName: 'serverName',
  fieldTransport: 'Transport',
  fieldUrl: 'URL',
  fieldCommand: 'Command',
  fieldArgs: 'Args (one per line)',
  fieldEnv: 'Env (KEY=VALUE, one per line)',
  fieldCwd: 'Working directory (optional)',
  fieldHeaders: 'Headers (Key: Value, one per line)',
  fieldTimeout: 'toolCallTimeoutMs (optional)',
  fieldFailStartup: 'failOnStartupError',
  cancel: 'Cancel',
  save: 'Save changes',
  errIdRequired: 'Entry id is required',
  errIdPattern: 'Match [A-Za-z0-9_-]{1,64}',
  errIdTaken: 'Entry id already in use',
  errNameRequired: 'serverName is required',
  errNamePattern: 'Match [A-Za-z0-9_-]{1,32}',
  errNameTaken: 'serverName already in use',
  errUrlRequired: 'URL is required',
  errCommandRequired: 'Command is required',
  errDuplicateId: 'Entry id is already in use',
  errDuplicateName: 'serverName is already used by another server',
  errInvalidConfig: 'Invalid MCP server configuration',
  errNotFound: 'MCP server entry not found',
  errUnknown: 'Operation failed',
}
