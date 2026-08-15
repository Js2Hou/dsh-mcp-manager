/**
 * Panel stylesheet. A single `<style>` element injected once by the client
 * entry, using the shell's design tokens (`--dsw-alias-*`) with sensible
 * fallbacks so the panel never looks broken even if a token is missing.
 *
 * Layout keeps the MCP settings page airy and scannable: roomy cards, a clear
 * status line, one target line, one muted meta line, and spaced actions.
 *
 * @module dsh-mcp-manager/client/styles
 */

const STYLE_ID = 'dsh-mcp-manager-styles'

const CSS = `
.dshmcp-section{max-width:720px;width:100%;display:flex;flex-direction:column;gap:14px;color:var(--dsw-alias-label-primary,#e6e8eb);font:13px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif}
.dshmcp-head{display:flex;align-items:center;gap:10px}
.dshmcp-head-title{font-size:16px;font-weight:600;flex:1;min-width:0;display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-primary,#e6e8eb)}
.dshmcp-head-sub{color:var(--dsw-alias-label-tertiary,#8b919c);font-size:12px;font-weight:400}
.dshmcp-toolbar{display:flex;gap:10px;align-items:center}
.dshmcp-btn{appearance:none;font:inherit;border:1px solid var(--dsw-alias-border-l2,#2b2f38);border-radius:8px;padding:6px 14px;
  background:var(--dsw-alias-bg-layer-3,#22262e);color:var(--dsw-alias-label-primary,#e6e8eb);cursor:pointer;line-height:1.45;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.dshmcp-btn:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed,#4a505c)}
.dshmcp-btn:disabled{opacity:.45;cursor:default}
.dshmcp-btn-primary{background:var(--dsw-alias-brand-primary,#4f8cff);border-color:transparent;color:#fff}
.dshmcp-btn-danger{color:var(--dsw-alias-label-error,#ff6b6b)}
.dshmcp-btn-sm{padding:4px 10px;font-size:12px;border-radius:7px;gap:5px}
.dshmcp-iconbtn{appearance:none;font:inherit;border:1px solid transparent;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#a7adb8);cursor:pointer;padding:5px 7px;display:inline-flex;align-items:center}
.dshmcp-iconbtn:hover:not(:disabled){background:var(--dsw-alias-bg-module-platform,#262b34);color:var(--dsw-alias-label-primary,#e6e8eb)}
.dshmcp-iconbtn:disabled{opacity:.4;cursor:default}
.dshmcp-empty{color:var(--dsw-alias-label-tertiary,#8b919c);text-align:center;padding:40px 16px;font-size:13px}
.dshmcp-card{border:1px solid var(--dsw-alias-border-l2,#2b2f38);background:var(--dsw-alias-bg-layer-3,#22262e);border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,background .15s}
.dshmcp-card:hover{border-color:var(--dsw-alias-label-dimmed,#4a505c)}
.dshmcp-card-head{display:flex;align-items:center;gap:10px}
.dshmcp-status{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:500;line-height:18px}
.dshmcp-status-dot{width:7px;height:7px;border-radius:50%;background:currentColor}
.dshmcp-status-ok{background:rgba(63,185,80,.14);color:#3fb950}
.dshmcp-status-warn{background:rgba(210,153,34,.14);color:#d29922}
.dshmcp-status-bad{background:rgba(248,81,73,.14);color:#f85149}
.dshmcp-status-off{background:var(--dsw-alias-bg-module-platform,#262b34);color:var(--dsw-alias-label-secondary,#a7adb8)}
.dshmcp-id{color:var(--dsw-alias-label-tertiary,#8b919c);font-size:12px;font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshmcp-name{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary,#e6e8eb)}
.dshmcp-target{color:var(--dsw-alias-label-secondary,#a7adb8);font-size:12.5px;font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshmcp-meta{display:flex;gap:14px;flex-wrap:wrap;color:var(--dsw-alias-label-tertiary,#8b919c);font-size:12px}
.dshmcp-probe{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#8b919c);max-width:100%;overflow-wrap:anywhere}
.dshmcp-probe-ok{color:#3fb950}
.dshmcp-probe-bad{color:var(--dsw-alias-label-error,#ff6b6b)}
.dshmcp-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--dsw-alias-border-l2,#2b2f38);padding-top:10px;margin-top:2px}
.dshmcp-form{display:flex;flex-direction:column;gap:10px;padding:18px;border:1px solid var(--dsw-alias-border-l2,#2b2f38);border-radius:14px;background:var(--dsw-alias-bg-layer-3,#22262e)}
.dshmcp-form-title{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary,#e6e8eb);margin-bottom:2px}
.dshmcp-field{display:flex;flex-direction:column;gap:5px}
.dshmcp-label{font-size:12px;color:var(--dsw-alias-label-secondary,#a7adb8)}
.dshmcp-input{border:1px solid var(--dsw-alias-border-l2,#2b2f38);background:var(--dsw-alias-bg-layer-3,#22262e);color:var(--dsw-alias-label-primary,#e6e8eb);border-radius:8px;padding:7px 11px;font:inherit;font-size:13px}
.dshmcp-input:focus-visible{border-color:var(--dsw-alias-brand-primary,#4f8cff);outline:none}
.dshmcp-input-invalid{border-color:var(--dsw-alias-label-error,#ff6b6b)}
.dshmcp-select{border:1px solid var(--dsw-alias-border-l2,#2b2f38);background:var(--dsw-alias-bg-layer-3,#22262e);color:var(--dsw-alias-label-primary,#e6e8eb);border-radius:8px;padding:7px 11px;font:inherit;font-size:13px}
.dshmcp-hint{color:var(--dsw-alias-label-error,#ff6b6b);font-size:12px;margin:0}
.dshmcp-field-row{display:flex;gap:10px}
.dshmcp-field-row .dshmcp-field{flex:1}
.dshmcp-check{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--dsw-alias-label-secondary,#a7adb8);cursor:pointer}
.dshmcp-form-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:6px}
.dshmcp-error{color:var(--dsw-alias-label-error,#ff6b6b);font-size:12px;padding:8px 12px;border:1px solid rgba(248,81,73,.35);border-radius:9px;background:rgba(248,81,73,.08)}
.dshmcp-footer{color:var(--dsw-alias-label-tertiary,#8b919c);font-size:11.5px;font-family:ui-monospace,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-top:2px}
.dshmcp-spin{display:inline-block;width:12px;height:12px;border:2px solid var(--dsw-alias-label-dimmed,#4a505c);border-top-color:transparent;border-radius:50%;animation:dshmcp-spin .8s linear infinite;vertical-align:-2px}
@keyframes dshmcp-spin{to{transform:rotate(360deg)}}
`

/** Inject the panel stylesheet once (idempotent). */
export function injectPanelStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}
