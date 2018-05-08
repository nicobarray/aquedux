import actionTypes from '../constants/actionTypes'

export const initialState = {
  definitions: {},
  subscription: []
}

const reducer = (prevState = initialState, action) => {
  if (action.type === actionTypes.AQUEDUX_CLIENT_CHANNEL_DEFINE) {
    return {
      ...prevState,
      definitions: {
        ...prevState.definitions,
        [action.name]: { name: action.name }
      }
    }
  }
  if (action.type === actionTypes.AQUEDUX_CLIENT_CHANNEL_JOIN) {
    // The action.name here is already composed.
    return {
      ...prevState,
      subscription: [
        ...prevState.subscription.filter(sub => sub.name !== action.name),
        { name: action.name, id: action.id, template: !!action.id }
      ]
    }
  }
  if (action.type === actionTypes.AQUEDUX_CLIENT_CHANNEL_LEAVE) {
    const composedName = !!action.id ? action.name + '-' + action.id : action.name
    return {
      ...prevState,
      subscription: prevState.subscription.filter(sub => sub.name !== composedName)
    }
  }

  return prevState
}

export default reducer

export const selectors = {
  hasSubscription: (name, state) => state.aquedux.subscription.find(sub => sub.name === name),
  getSubscription: state => state.aquedux.subscription,
  hasChannel: (name, state) => state.aquedux.definitions.hasOwnProperty(name)
}
