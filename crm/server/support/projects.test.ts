import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectLabel, isProjectsQuestion, pickProject, projectsListText } from './projects'
import type { ClientProjectRow } from './types'

const proj = (p: Partial<ClientProjectRow>): ClientProjectRow => ({ id: 'p1', client_id: 'c1', package_id: null, workspace_path: null, repo_url: null, deploy_target: null, default_branch: 'main', deploy_cmd: null, status: 'active', agent_scenario_id: null, created_at: '', updated_at: '', ...p })

test('projectLabel: деплой-таргет, workspace, repo, иначе id', () => {
  assert.equal(projectLabel(proj({ deploy_target: 'https://gf-leasing.by/' })), 'gf-leasing.by')
  assert.equal(projectLabel(proj({ workspace_path: '/home/dsh/work/music-loto/' })), 'music loto')
  assert.equal(projectLabel(proj({ repo_url: 'https://github.com/x/shop.git' })), 'shop')
  assert.equal(projectLabel(proj({ id: '12345678-aaaa-bbbb' })), 'проект 12345678')
})

test('isProjectsQuestion: распознаёт вопрос про проекты, не путает с правкой', () => {
  assert.ok(isProjectsQuestion('какие у меня проекты?'))
  assert.ok(isProjectsQuestion('сколько проектов ты видишь'))
  assert.ok(isProjectsQuestion('покажи список моих проектов'))
  assert.ok(!isProjectsQuestion('поменяй заголовок на главной'))
})

test('pickProject: находит по названию и слагу', () => {
  const list = [proj({ workspace_path: '/home/dsh/work/GF-leasing/' }), proj({ id: 'p2', workspace_path: '/home/dsh/work/music-loto/' })]
  assert.equal(pickProject('вноси правки в GF-leasing', list)?.id, 'p1')
  assert.equal(pickProject('работаем с music loto', list)?.id, 'p2')
  assert.equal(pickProject('просто правка', list), null)
})

test('pickProject: выбирает проект по номеру (цифре)', () => {
  const list = [proj({ workspace_path: '/home/dsh/work/GF-leasing/' }), proj({ id: 'p2', workspace_path: '/home/dsh/work/music-loto/' }), proj({ id: 'p3', workspace_path: '/home/dsh/work/shop/' })]
  assert.equal(pickProject('1', list)?.id, 'p1')
  assert.equal(pickProject('2', list)?.id, 'p2')
  assert.equal(pickProject('3', list)?.id, 'p3')
  assert.equal(pickProject('первый', list)?.id, 'p1')
  assert.equal(pickProject('второй', list)?.id, 'p2')
  assert.equal(pickProject('99', list), null)
  assert.equal(pickProject('0', list), null)
  assert.equal(pickProject('поменяй заголовок', list), null)
})

test('projectsListText: перечисляет проекты и спрашивает, в какой', () => {
  const list = [proj({ workspace_path: '/home/dsh/work/GF-leasing/' }), proj({ id: 'p2', workspace_path: '/home/dsh/work/music-loto/' })]
  const s = projectsListText(list)
  assert.match(s, /несколько проектов/)
  assert.match(s, /GF leasing/)
  assert.match(s, /music loto/)
  assert.match(s, /В какой проект вносим правку\? Напиши номер или название/)
})
