export let state = {
  statefullActionTypes: []
}

export const isStateFull = actionType => {
  return state.statefullActionTypes.includes(actionType)
}

const registerActions = actionTypes => {
  state.statefullActionTypes = [...state.statefullActionTypes, ...actionTypes]
}

export default registerActions
