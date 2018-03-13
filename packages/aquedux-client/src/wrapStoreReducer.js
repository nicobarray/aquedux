import logger from './utils/logger'

const wrapStoreReducer = userReducers => (state, action) => {
  if (action.type === 'AQUEDUX_CHANNEL_SNAPSHOT') {
    logger.trace({
      who: 'Aquedux::wrapStoreReducer',
      what: 'reducing action ' + action.type
    })

    if (action.newState) {
      console.log('Aquedux new state', action)
      return userReducers(action.newState, action)
    }
  }

  return userReducers(state, action)
}

export default wrapStoreReducer
