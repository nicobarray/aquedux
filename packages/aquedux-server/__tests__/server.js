import { applyMiddleware } from 'redux'
import { createAquedux, createStore } from '../src'

describe('public api', () => {
  it('should instantiate a working middleware', () => {
    const reducer = (prevState = 0, action) => {
      if (action.type === 'inc') {
        return prevState + 1
      }
      return prevState
    }

    const aquedux = createAquedux({})

    const testMiddleware = _store => next => action => {
      expect(action.type).toBe('inc')
      next(action)
    }

    const store = createStore(reducer, applyMiddleware(aquedux, testMiddleware))

    store.dispatch({ type: 'inc' })
  })
})
