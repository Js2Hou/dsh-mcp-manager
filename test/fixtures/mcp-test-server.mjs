#!/usr/bin/env node
/**
 * Minimal MCP stdio server used to exercise dsh-mcp-manager end to end:
 *   node test/fixtures/mcp-test-server.mjs
 *
 * Speaks the Model Context Protocol (initialize / tools/list / tools/call /
 * ping) over stdio JSON-RPC. Not a real service — a fixture.
 */
import { createInterface } from 'node:readline'

const rl = createInterface({ input: process.stdin })

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

rl.on('line', (line) => {
  let request
  try {
    request = JSON.parse(line)
  } catch {
    return
  }
  const { id, method, params } = request
  switch (method) {
    case 'initialize':
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: params?.protocolVersion ?? '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'mcp-test-server', version: '1.0.0' },
        },
      })
      break
    case 'notifications/initialized':
      break
    case 'tools/list':
      send({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'hello',
              description: 'Say hello from the test MCP server',
              inputSchema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Who to greet' },
                },
              },
            },
          ],
        },
      })
      break
    case 'tools/call':
      send({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `hello, ${params?.arguments?.name ?? 'world'}` }],
        },
      })
      break
    case 'ping':
      send({ jsonrpc: '2.0', id, result: {} })
      break
    default:
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${method}` } })
  }
})
