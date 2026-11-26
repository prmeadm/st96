// Проверки индекса workspace-папок: что worker реально увидит в выпадающем списке админки.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { indexSignature, scanWorkspaceFolders, withProjectFolders, workspaceRoots } from './workspaceFolders'

function makeTree(): string {
  const base = mkdtempSync(join(tmpdir(), 'st96-ws-'))
  for (const d of ['GF-leasing', 'a1c', 'a1c.by', '_template', 'node_modules', '.hidden']) mkdirSync(join(base, d))
  mkdirSync(join(base, 'a1c.by', '.git'))
  mkdirSync(join(base, 'nested-root'))
  mkdirSync(join(base, 'nested-root', 'inner'))
  mkdirSync(join(base, 'file-is-not-a-folder'), { recursive: false })
  writeFileSync(join(base, 'README.md'), 'не папка')
  return base
}

test('scan: только реальные папки, без скрытых и служебных, с завершающим слэшем', () => {
  const base = makeTree()
  try {
    const index = scanWorkspaceFolders([base], new Date('2026-11-26T10:00:00Z'))
    assert.equal(index.scanned_at, '2026-11-26T10:00:00.000Z')
    assert.equal(index.roots.length, 1)
    const root = index.roots[0]!
    assert.equal(root.exists, true)
    const names = root.folders.map((f) => f.name)
    assert.deepEqual(names, ['a1c', 'a1c.by', 'file-is-not-a-folder', 'GF-leasing', 'nested-root'])
    assert.ok(!names.includes('_template'), 'служебная папка _template в списке не нужна')
    assert.ok(root.folders.every((f) => f.path.endsWith('/')))
    assert.equal(root.folders.find((f) => f.name === 'a1c.by')!.has_git, true)
    assert.equal(root.folders.find((f) => f.name === 'a1c')!.has_git, false)
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test('scan: вложенный корень не дублируется как папка родителя', () => {
  const base = makeTree()
  try {
    const index = scanWorkspaceFolders([base, join(base, 'nested-root')])
    const rootNames = index.roots[0]!.folders.map((f) => f.name)
    assert.ok(!rootNames.includes('nested-root'))
    assert.equal(index.roots[1]!.root, join(base, 'nested-root'))
    assert.deepEqual(index.roots[1]!.folders.map((f) => f.name), ['inner'])
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test('scan: отсутствующий корень помечается exists=false и не роняет скан', () => {
  const base = makeTree()
  try {
    const missing = join(base, 'нет-такой-папки')
    const index = scanWorkspaceFolders([missing])
    assert.deepEqual(index.roots, [{ root: missing, exists: false, folders: [] }])
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test('indexSignature: набор папок без mtime; изменения набора видны', () => {
  const base = makeTree()
  try {
    const a = indexSignature(scanWorkspaceFolders([base], new Date('2026-11-26T10:00:00Z')))
    const b = indexSignature(scanWorkspaceFolders([base], new Date('2026-11-26T12:00:00Z')))
    assert.equal(a, b, 'время скана и mtime не должны менять подпись')
    mkdirSync(join(base, 'new-client'))
    const c = indexSignature(scanWorkspaceFolders([base]))
    assert.notEqual(a, c, 'новая папка должна менять подпись')
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test('withProjectFolders: скрытые папки (_template) не возвращаются в список даже как путь проекта', () => {
  const base = makeTree()
  try {
    const index = scanWorkspaceFolders([base])
    const withProjects = withProjectFolders(index, [join(base, '_template')])
    assert.equal(withProjects.extra?.length ?? 0, 0)
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test('withProjectFolders: путь вне корней добавляется только если папка существует и без дублей', () => {
  const base = makeTree()
  const outside = mkdtempSync(join(tmpdir(), 'st96-ws-out-'))
  try {
    mkdirSync(join(outside, 'legacy-project'))
    mkdirSync(join(outside, 'legacy-project', '.git'))
    const index = scanWorkspaceFolders([base])
    const withProjects = withProjectFolders(index, [
      join(outside, 'legacy-project'),                    // существует — попадает
      join(outside, 'legacy-project') + '/',              // дубль по слэшу — не попадает
      join(outside, 'deleted-project'),                   // папки нет — не попадает
      join(base, 'a1c'),                                  // уже в корне — не дублируется
      '',                                                  // пусто — игнорируется
    ])
    assert.deepEqual((withProjects.extra ?? []).map((f) => f.path), [join(outside, 'legacy-project') + '/'])
    assert.equal((withProjects.extra ?? [])[0]!.has_git, true)
    const all = [...withProjects.roots[0]!.folders, ...(withProjects.extra ?? [])].map((f) => f.name).filter((n) => n === 'a1c')
    assert.deepEqual(all, ['a1c'])
  } finally {
    rmSync(base, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
})

test('workspaceRoots: переменная окружения и дефолт', () => {
  assert.deepEqual(workspaceRoots({} as NodeJS.ProcessEnv), ['/home/dsh/work/KLIENTS'])
  assert.deepEqual(workspaceRoots({ SUPPORT_WORKSPACE_ROOTS: ' /a , /b/ ,, ' } as NodeJS.ProcessEnv), ['/a', '/b/'])
})
