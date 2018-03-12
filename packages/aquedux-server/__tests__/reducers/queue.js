import reducer, { selectors, initialState } from '../../src/reducers/queue'
import actions from '../../src/actions'

test('expect selectors to return the initialState values', () => {
  const state = initialState

  expect(selectors.getName(initialState)).toBe('')
  expect(selectors.getCursor(initialState)).toBe(0)
  expect(selectors.getNotificationQueue(initialState)).toEqual([])
  expect(selectors.getPushQueue(initialState)).toEqual([])
  expect(selectors.getSubId(initialState)).toBeUndefined()
  expect(selectors.getNextNotification(initialState)).toBeUndefined()
})

// FIXME: Add more 'except' statement when more actions are defined.
test('expect selectors to return state modifications', () => {
  const nextState = reducer(initialState, actions.queue.load('queue-id', '42', 0))
  expect(selectors.getName(nextState)).toBe('queue-id')
  expect(selectors.getSubId(nextState)).toBe('42')
  expect(selectors.getNotificationQueue(nextState)).toEqual([])
  expect(selectors.getNextNotification(nextState)).toBeUndefined()

  const nextState1 = reducer(nextState, actions.queue.enqueueNotification('queue-id'))
  expect(selectors.getNextNotification(nextState1)).toBe(0)
  expect(selectors.getNotificationQueue(nextState1)).toEqual([0])

  const nextState2 = reducer(nextState1, actions.queue.enqueueNotification('queue-id'))
  expect(selectors.getNextNotification(nextState2)).toBe(0)
  expect(selectors.getNotificationQueue(nextState2)).toEqual([0, 1])

  const nextState3 = reducer(nextState2, actions.queue.dequeueNotification('queue-id'))
  expect(selectors.getNextNotification(nextState3)).toBe(1)
  expect(selectors.getNotificationQueue(nextState3)).toEqual([1])
})

test('expect the getNextAction to return the first added action', () => {
  const state = reducer(initialState, actions.queue.load('queue-id', '42', 0))
  const nextState = reducer(state, actions.queue.enqueueAction('queue-id', { type: 'FOO', name: 'bar' }))
  const lastState = reducer(nextState, actions.queue.enqueueAction('queue-id', { type: 'BAR', name: 'baz' }))

  expect(selectors.getNextAction(nextState)).toEqual({ type: 'FOO', name: 'bar' })
})
