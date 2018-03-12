import logger from './utils/logger'
import * as fromConstants from './utils/constants'
import reducer from './reducers'

const wrapStoreReducer = userReducers => (state, action) => {
  if (action.type === 'AQUEDUX_CHANNEL_SNAPSHOT') {
    logger.trace({
      who: 'Aquedux::wrapStoreReducer',
      what: 'reducing action ' + action.type
    })

    if (action.newState) {
      console.log('Aquedux new state', action)
      return  userReducers(action.newState, action)
    }
  }

  return userReducers(state, action)
}

export default wrapStoreReducer
