import actionTypes from '../constants/actionTypes'

const set = (config) => {
    return {
        type: actionTypes.AQUEDUX_CLIENT_SET_CONFIG,
        config
    }
}

const setEndpoint = (endpoint) => ({
    type: actionTypes.AQUEDUX_CLIENT_SET_ENDPOINT,
    endpoint
})

export default {
    set,
    setEndpoint
}