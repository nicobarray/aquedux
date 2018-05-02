import { combineReducers } from 'redux'
import aqueduxReducer from './reducers'

export default userReducers => {
  return combineReducers({
    ...userReducers,
    aquedux: aqueduxReducer
  })
}
