import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const meta = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
const registry = JSON.parse(readFileSync(join(dir, 'server.json'), 'utf8'))
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const runNpm = (args, extra = {}) => execFileSync(npmCommand, args, {
  cwd: dir, encoding: 'utf8', maxBuffer: 2_000_000,
  env: { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false' },
  ...extra,
})

describe('SSTIM MCP standalone npm distribution', () => {
  it('aligns authorship, package ownership metadata, and registry identity', () => {
    expect(meta.name).toBe('@sstim/mcp')
    expect(meta.version).toBe('0.2.0')
    expect(meta.mcpName).toBe('io.github.w3c-cg/sstim')
    expect(meta.publishConfig.access).toBe('public')
    expect(meta.author.name).toBe('SSTIM W3C Community Group')
    expect(meta.author.url).toBe('https://www.w3.org/community/sstim/')
    expect(meta.contributors).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'BioSynCare', url: 'https://biosyncare.com' }),
    ]))
    expect(registry.name).toBe(meta.mcpName)
    expect(registry.version).toBe(meta.version)
    expect(registry.packages[0].identifier).toBe(meta.name)
    expect(registry.packages[0].transport.type).toBe('stdio')
    expect(registry.repository.subfolder).toBe('packages/sstim-mcp')
    expect(registry._meta['io.modelcontextprotocol.registry/publisher-provided']
      .acknowledgement.url).toBe('https://biosyncare.com')
  })

  it('packs a source-independent CLI with its license and registry metadata', () => {
    const pack = JSON.parse(runNpm(['pack', '--dry-run', '--json', '--ignore-scripts']))[0]
    const paths = pack.files.map(x => x.path)
    for (const expected of ['package.json', 'server.mjs', 'client.mjs',
      'README.md', 'LICENSE', 'server.json']) {
      expect(paths).toContain(expected)
    }
    expect(paths.some(x => x.startsWith('examples/'))).toBe(true)
    expect(paths.every(x => ['package.json', 'server.mjs', 'client.mjs',
      'README.md', 'LICENSE', 'server.json'].includes(x) ||
      x.startsWith('examples/'))).toBe(true)
    expect(meta.bin['sstim-mcp']).toBe('./server.mjs')
    expect(readFileSync(join(dir, 'server.mjs'), 'utf8').startsWith('#!/usr/bin/env node'))
      .toBe(true)
  })

  it('runs the actual npm-installed executable, including its bin symlink', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'sstim-mcp-pack-'))
    try {
      const packed = JSON.parse(runNpm([
        'pack', '--json', '--ignore-scripts', '--pack-destination', tmp,
      ]))[0]
      const archive = join(tmp, packed.filename)
      expect(existsSync(archive)).toBe(true)
      const prefix = join(tmp, 'consumer')
      runNpm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
        '--prefix', prefix, archive])
      const cli = join(prefix, 'node_modules', '.bin',
        process.platform === 'win32' ? 'sstim-mcp.cmd' : 'sstim-mcp')
      expect(existsSync(cli)).toBe(true)
      const request = {
        jsonrpc: '2.0', id: 99, method: 'server/discover',
        params: { _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities': {},
        } },
      }
      const result = spawnSync(cli, [], {
        input: JSON.stringify(request) + '\n',
        encoding: 'utf8', timeout: 5000,
      })
      expect(result.error).toBeUndefined()
      expect(result.status, result.stderr).toBe(0)
      const response = JSON.parse(result.stdout.trim())
      expect(response.id).toBe(99)
      expect(response.result.supportedVersions).toContain('2026-07-28')
      expect(response.result.resultType).toBe('complete')
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })
})
