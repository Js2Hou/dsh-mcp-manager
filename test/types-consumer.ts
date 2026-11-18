/**
 * Consumer-side type-resolution check for issue #10: a strict TypeScript
 * project must be able to `import` the package without TS7016 and use its
 * declared surface. Compiled by `test/tsconfig.consumer.json` (paths map the
 * package specifiers onto the committed `types/` declarations).
 */
import { name, inject, apply } from '@js2hou/dsh-mcp-manager'
import type { McpManagerRowConfig } from '@js2hou/dsh-mcp-manager'
import { inject as clientInject, apply as clientApply } from '@js2hou/dsh-mcp-manager/client'

const pluginName: string = name
const hostServices: readonly string[] = inject
const clientServices: readonly string[] = clientInject

const config: McpManagerRowConfig = { patchFile: 'C:/dsh/profiles/web/cordis.patch.yml' }
apply({}, config)
clientApply({})

export { pluginName, hostServices, clientServices }
