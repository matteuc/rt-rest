import socketio from 'socket.io'
import { RequestHandler, Request, Response, NextFunction } from 'express'
import { ExtendedError } from 'socket.io/dist/namespace'
import { RequestType, RestSocketControllerMap, RestSocketControllerNamespaceMap, RestSocketMiddleware, RestSocketOptions, RouteConfig } from './types'
import { Server } from 'http'

export class RestSocketNamespaceContext {
    _ref: RestSocket
    namespaces: Array<string>

    constructor(ref: RestSocket, namespaces: Array<string>) {
        this._ref = ref;
        this.namespaces = namespaces;
    }

    use(...middlewares: Array<RestSocketMiddleware>): void {
        this._ref._addMiddleware(middlewares, this.namespaces)
    }

    get(path: string, ...controllers: Array<RestSocketMiddleware>): void {
        this._ref._route(RequestType.GET, { path, namespaces: this.namespaces }, ...controllers)
    }

    post(path: string, ...controllers: Array<RestSocketMiddleware>): void {
        this._ref._route(RequestType.POST, { path, namespaces: this.namespaces }, ...controllers)
    }

    put(path: string, ...controllers: Array<RestSocketMiddleware>): void {
        this._ref._route(RequestType.PUT, { path, namespaces: this.namespaces }, ...controllers)
    }

    delete(path: string, ...controllers: Array<RestSocketMiddleware>): void {
        this._ref._route(RequestType.DELETE, { path, namespaces: this.namespaces }, ...controllers)
    }
}

export class RestSocket {
    static DEFAULT_NAMESPACE = "/"
    static parseOptions = (options?: RestSocketOptions): {
        maxHttpBufferSize: number
    } => ({
        maxHttpBufferSize: options?.maxByteSize
    })

    socketIo: socketio.Server
    controllerMap: RestSocketControllerNamespaceMap
    port: number

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

        this.port = port

        if (server) {
            this.socketIo = require('socket.io')(server, RestSocket.parseOptions(options))
        } else {
            this.socketIo = require('socket.io')(port, RestSocket.parseOptions(options))
        }

        this.controllerMap = {
            [RestSocket.DEFAULT_NAMESPACE]:
                Object.keys(RequestType)
                    .reduce((all, type) => ({
                        ...all,
                        [type]: []
                    }), {}) as RestSocketControllerMap
        }

    }

    /**
        Private Utility Methods
        --------------------------
    */
    _route(type: RequestType, config: RouteConfig, ...controllers: Array<RestSocketMiddleware>): void {
        const { path, namespaces = [] } = config

        const allNamespaces = [RestSocket.DEFAULT_NAMESPACE].concat(namespaces)

        for (const ns of allNamespaces) {
            this.controllerMap[ns][type].push({
                path,
                controllers
            })
        }
    }

    _wrapMiddleware(middleware: RequestHandler): (socket: socketio.Socket, next: (err?: ExtendedError) => void) => void {
        return (socket: socketio.Socket, next: (err?: ExtendedError) => void) =>
            middleware(socket.request as Request, {} as Response, next as NextFunction)
    }

    _addMiddleware(middlewares: Array<RestSocketMiddleware>, namespaces = []): void {
        namespaces.concat(RestSocket.DEFAULT_NAMESPACE).forEach((namespace) => {
            const wrappedMiddlewares = middlewares.map(m => this._wrapMiddleware(m))

            wrappedMiddlewares.forEach(wm => this.socketIo.of(namespace).use(wm))
        })
    }

    /**
        Middleware Utility Methods
        --------------------------
     */

    use(...middlewares: Array<RequestHandler>): void {
        this._addMiddleware(middlewares)
    }

    of(...namespaces: Array<string>): RestSocketNamespaceContext {
        return new RestSocketNamespaceContext(this, namespaces)
    }

    /**
        Instance Creator Methods
        ------------------------
     */

    static fromPort(port: number, options: RestSocketOptions = {}): RestSocket {
        if (!port) {
            throw new Error('Please provide an available port number.')
        }

        return new RestSocket(port, undefined, options)
    }

    static fromServer(server: Server, options: RestSocketOptions = {}): RestSocket {
        if (!server) {
            throw new Error('Please provide a server instance.')
        }

        return new RestSocket(undefined, server, options)
    }

    /**
        Route Controller Methods
        ------------------------
     */

    get(path: string, ...controllers: Array<RestSocketMiddleware>): void {
        return this._route(RequestType.GET, { path }, ...controllers)
    }

    post(path: string, ...controllers: Array<RestSocketMiddleware>): void {
        return this._route(RequestType.POST, { path }, ...controllers)
    }

    put(path: string, ...controllers: Array<RestSocketMiddleware>): void {
        return this._route(RequestType.PUT, { path }, ...controllers)
    }

    delete(path: string, ...controllers: Array<RestSocketMiddleware>): void {
        return this._route(RequestType.DELETE, { path }, ...controllers)
    }

}

export class RestSocketRequest {

}
export class RestSocketResponse {

}