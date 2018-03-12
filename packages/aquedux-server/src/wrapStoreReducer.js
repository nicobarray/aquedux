import logger from './utils/logger'
import actionTypes from './constants/actionTypes'

const wrapStoreReducer = userReducers => {
  return (prevState, action) => {
    if (action.type === actionTypes.queue.AQUEDUX_QUEUE_SNAPSHOT) {
      logger.trace({
        who: 'Aquedux::wrapStoreReducer',
        what: 'reducing action ' + action.type
      })

      return {
        ...prevState,
        ...action.state,
        aquedux: prevState.aquedux
      }
    }

    return userReducers(prevState, action)
  }
}

export default wrapStoreReducer
