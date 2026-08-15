/**
 * dsh-mcp-manager — browser half.
 *
 * Registers an "MCP" page in the Settings panel (a `settings.section` entry
 * beside 通用设置 / 模型 / 插件 / Agent 预设), hosting the server list,
 * add/remove, enable/disable and connection-status tools. Copy is localized
 * (zh/en) and follows the GUI's active locale automatically. All data flows
 * over the loopback-only `/mcp-manager` Connection RPC channel registered by
 * the node half; the browser never touches the host filesystem directly.
 *
 * @module dsh-mcp-manager/client
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the slot-registry Context merge (ctx.slots) and the
// settings-slot declarations (`settings.section`) into this program so the
// register call below type-checks.
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { McpManagerSection } from './McpManagerSection.tsx'
import { injectPanelStyles } from './styles.ts'
import { NS, en, zh } from './locales.ts'

/** Required services: the slot registry, connection RPC, and locale. */
export const inject = ['slots', 'connection', 'locale']

/** Nav position of the MCP section (models=10, plugins=15, agent-presets=20). */
const SECTION_ORDER = 18

/**
 * Client plugin body: register the settings section, dictionaries, and styles.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => {
    injectPanelStyles()
    return () => { /* styles stay for the page lifetime */ }
  }, 'mcp-manager: styles')

  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'mcp-manager: locale')

  const t = ctx.locale.bind(NS)

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'mcp',
    order: SECTION_ORDER,
    label: () => t('nav'),
    inject: () => ({ ctx }),
  }, McpManagerSection))
}
