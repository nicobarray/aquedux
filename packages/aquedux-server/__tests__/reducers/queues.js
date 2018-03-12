import actions from '../../src/actions'
import reducer, { initialState, selectors as queuesSelectors } from '../../src/reducers/queues'
import queueReducer, { initialState as queueInitialState } from '../../src/reducers/queue'

test('expect queue.load to add the queue to the state', () => {
  const prevState = {
    ...initialState,
    queues: {
      'wpo-id-to-keep': queueInitialState
    }
  }

  const nextState = reducer(prevState, actions.queue.load('wpo-id-new', 'connection-id', 42))

  expect(nextState).toEqual({
    ...prevState,
    queues: {
      'wpo-id-to-keep': queueInitialState,
      'wpo-id-new': {
        ...queueInitialState,
        name: 'wpo-id-new',
        subId: 'connection-id',
        cursor: 42,
        innerState: 'QUEUE_STATE_LOADING'
      }
    }
  })
})

test('expect queue.unload to remove the queue from the state', () => {
  const prevState = {
    ...initialState,
    queues: {
      'wpo-id-to-keep': {
        /* Some state */
      },
      'wpo-id-to-remove': {
        /* Some other state */
      }
    }
  }

  const nextState = reducer(prevState, actions.queue.unload('wpo-id-to-remove'))

  expect(nextState).toEqual({
    ...initialState,
    queues: {
      'wpo-id-to-keep': {}
    }
  })
})

test('expect api.setRemoveType to update the state', () => {
  const action = actions.api.setRemoveType('foo')
  const prevState = initialState
  const nextState = reducer(prevState, action)

  expect(queuesSelectors.isRemoveQueueType(prevState, 'foo')).toBe(false)
  expect(queuesSelectors.isRemoveQueueType(nextState, 'foo')).toBe(true)
  expect(nextState).toEqual({
    ...initialState,
    removeQueueType: 'foo'
  })
})
