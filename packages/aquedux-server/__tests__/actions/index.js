import actions from '../../src/actions'
import actionTypes from '../../src/constants/actionTypes'

test('expect queue load action creator to return the expected action object', () => {
  const action = actions.queue.load('wpo-beerpong', '42', 16)
  expect(action).toEqual({
    type: 'AQUEDUX_LOAD_QUEUE',
    name: 'wpo-beerpong',
    subId: '42',
    cursor: 16
  })
})

test('expect enqueue action creator to return the expected action object', () => {
  const action = actions.queue.enqueueNotification('wpo-beerpong')
  expect(action).toEqual({
    type: 'AQUEDUX_ENQUEUE_NOTIFICATION',
    name: 'wpo-beerpong'
  })
})

test('expect dequeue action creator to return the expected action object', () => {
  const action = actions.queue.dequeueNotification('wpo-beerpong')
  expect(action).toEqual({
    type: 'AQUEDUX_DEQUEUE_NOTIFICATION',
    name: 'wpo-beerpong'
  })
})

test('expect enqueue action creator to return the expected action object', () => {
  const action = actions.queue.enqueueAction('wpo-beerpong', { type: 'ADD_TEAM', tid: 'wpo-beerpong' })
  expect(action).toEqual({
    type: 'AQUEDUX_ENQUEUE_ACTION',
    name: 'wpo-beerpong',
    action: { type: 'ADD_TEAM', tid: 'wpo-beerpong' }
  })
})

test('expect setRemoveType action creator to return the expected action object', () => {
  const action = actions.api.setRemoveType('foo')
  expect(action).toEqual({
    type: 'AQUEDUX_REMOVE_TYPE_SET',
    typeToSet: 'foo'
  })
})
