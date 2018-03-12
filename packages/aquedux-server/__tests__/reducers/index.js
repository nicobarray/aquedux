import reducer, { selectors } from '../../src/reducers'
import actions from '../../src/actions'

test('expect selectors to get the forwarded sub state', () => {
  const state = reducer(undefined, actions.queue.load('foo', 'bar', 42))
  let appState = { aquedux: state }
  expect(selectors.queue.getName(appState, 'foo')).toBe('foo')
  expect(selectors.queue.getId(appState)).not.toBeUndefined()

  const nextState = reducer(state, actions.queue.enqueueAction('foo', { type: 'FOO', name: 'bar' }))
  const nextAppState = { aquedux: nextState }
  expect(selectors.queue.getNextAction(nextAppState, 'foo')).toEqual({ type: 'FOO', name: 'bar' })
})
