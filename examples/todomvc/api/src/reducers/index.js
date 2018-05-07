import { combineReducers } from 'redux'
import { aqueduxReducers } from 'aquedux-server'
import todos from './todos'

const appReducers = combineReducers({
  todos,
  aquedux: aqueduxReducers
})

export default appReducers
