import configureStore from './configureStore'
import configureAquedux from './configureAquedux'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || '4242'

let store = configureStore()
let server = configureAquedux(store, host, port)

server()
