import { combineReducers } from 'redux'
import { aqueduxReducer } from 'aquedux-client'
import todos from './todos'
import visibilityFilter from './visibilityFilter'

export default combineReducers({
  todos,
  visibilityFilter,
  aquedux: aqueduxReducer
})
