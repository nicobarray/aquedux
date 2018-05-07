import { combineReducers } from 'redux'
import { aqueduxReducer } from 'aquedux-client'
import todos from './todos'
import visibilityFilter from './visibilityFilter'

const rootReducer = combineReducers({
  todos,
  visibilityFilter,
  aquedux: aqueduxReducer
})

export default rootReducer
