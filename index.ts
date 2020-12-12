import { Server } from 'http'
import cookieSession from 'cookie-session'
import sharedSession from 'express-socket.io-session'

type RestSocketOptions = {
    maxByteSize?: number
}

type RestSocketNext = (err?: Error) => void

class RestSocketRequest {

}
class RestSocketResponse {

}

type RestSocketMiddleware = (req: RestSocketRequest, res: RestSocketResponse, next?: RestSocketNext) => any

type RestSocketController = (req: RestSocketRequest, res: RestSocketResponse) => any

// TODO
// Some entity that processes a request and passes it through middleware, which only proceeds if 'next()' is called without error
// If called with error, return to client with error code

// TODO 
// Some function that is used to define an HTTP request (i.e. 'post()') and correctly passes the incoming request to middlewares under the specified route

class RestSocket {
    socketIo: SocketIO.Server
    session?: ReturnType<typeof cookieSession>

    /**
     * 
     * @param port 
     * @param server 
     * @param options 
     */
    constructor(port?: number, server?: Server, options?: RestSocketOptions) {

        if (!port) {
            throw new Error('Please provide a port to create a RestSocket instance.')
        }

        if (server) {
            this.socketIo = require('socket.io')(server, options || {})
        } else {
            this.socketIo = require('socket.io')(port, options || {})
            console.info(`REST Socket listening on port ${port}!`)
        }

    }

    /**
     * 
     * @param port 
     * @param options 
     */
    static standalone(port: number, options: RestSocketOptions = {}) {
        if (!port) {
            throw new Error('Please provide an available port number.')
        }

        return new RestSocket(port, undefined, options)
    }

    use(middleware: RestSocketMiddleware) {

        return this
    }

    /**
     * 
     * @param server 
     * @param options 
     */
    static withServer(server: Server, options: RestSocketOptions = {}) {
        if (!server) {
            throw new Error('Please provide a server instance.')
        }

        return new RestSocket(undefined, server, options)
    }

    /**
     * 
     * @param session 
     */
    withSession(session: ReturnType<typeof cookieSession>) {
        if (!session) {
            throw new Error('Please provide a cookieSession instance.')
        }

        this.session = session
        this.socketIo.use(
            sharedSession(session, {
                autoSave: true,
            }))

        return this
    }

    withAuth() {

        return this
    }

}

