import { Server } from 'http'
import cookieSession from 'cookie-session'
import sharedSession from 'express-socket.io-session'
import socketio from 'socket.io'

const DEFAULT_NAMESPACE = "/"

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

type RestSocketRouteController = {
    path: string,
    controller: RestSocketController
}

type RestSocketControllerMap = {
    [k in RequestType]: Array<RestSocketRouteController>
}

type RestSocketMiddlewareNamespaceMap = {
    [namespace: string]: Array<RestSocketMiddleware>
}

type RestSocketControllerNamespaceMap = {
    [namespace: string]: RestSocketControllerMap
}

enum RequestType {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete"
}

// TODO
// Some entity that processes a request and passes it through middleware, which only proceeds if 'next()' is called without error
// If called with error, return to client with error code

// TODO 
// Some function that is used to define an HTTP request (i.e. 'post()') and correctly passes the incoming request to middlewares under the specified route

class RestSocket {
    socketIo: socketio.Server
    session?: ReturnType<typeof cookieSession>
    middlewareMap: RestSocketMiddlewareNamespaceMap
    controllerMap: RestSocketControllerNamespaceMap

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

        this.middlewareMap = {
            [DEFAULT_NAMESPACE]: []
        } as RestSocketMiddlewareNamespaceMap

        this.controllerMap = {
            [DEFAULT_NAMESPACE]: Object.keys(RequestType).reduce((all, type) => ({
                ...all,
                [type]: []
            }), {}) as RestSocketControllerMap
        }

    }

    /**
        Middleware Utility Methods
        --------------------------
     */

    use(middlewares: Array<RestSocketMiddleware>, namespace = DEFAULT_NAMESPACE) {
        this.middlewareMap[namespace].push(...middlewares)
    }

    _route(type: RequestType, path: string, controller: RestSocketController, namespace = DEFAULT_NAMESPACE) {
        this.controllerMap[namespace][type].push({
            path,
            controller
        })
    }

    /**
    * TODO
    */
    withAuth() {

        return this
    }

    /**
        Instance Creator Methods
        ------------------------
     */

    /**
     * 
     * @param port 
     * @param options 
     */
    static fromPort(port: number, options: RestSocketOptions = {}) {
        if (!port) {
            throw new Error('Please provide an available port number.')
        }

        return new RestSocket(port, undefined, options)
    }

    /**
     * 
     * @param server 
     * @param options 
     */
    static fromServer(server: Server, options: RestSocketOptions = {}) {
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

    /**
        Route Controller Methods
        ------------------------
     */

    get(path: string, controller: RestSocketController, namespace?: string) {
        return this._route(RequestType.GET, path, controller, namespace)
    }

    post(path: string, controller: RestSocketController, namespace?: string) {
        return this._route(RequestType.POST, path, controller, namespace)
    }

    put(path: string, controller: RestSocketController, namespace?: string) {
        return this._route(RequestType.PUT, path, controller, namespace)
    }

    delete(path: string, controller: RestSocketController, namespace?: string) {
        return this._route(RequestType.DELETE, path, controller, namespace)
    }

}