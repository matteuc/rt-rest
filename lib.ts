import {
    RequestPayload,
    RequestType,
    RestSocketMiddlewareSet,
    RestSocketMiddleware,
    RestSocketOptions,
    RestSocketRequestData,
    RestSocketNext,
    MiddlewareQueueItem,
    RestSocketResponsePayload,
    ConnectionType
} from './types'
import {
    Server as HttpServer,
    createServer
} from 'http'
import { match } from 'node-match-path'
import { URLSearchParams } from 'url'

/**
 * Constants
 */

const Constants = {
    DEFAULT_NAMESPACE: "/",
    MATCH_ALL: "*",
    responseEvent: (id: string) => `${id}-response`,
    receivedEvent: (id: string) => `${id}-received`
}

export class RestSocketRouter {

    namespaces: Array<string>
    middlewareChain: RestSocketMiddlewareSet

    constructor(namespaces: Array<string> = []) {
        this.namespaces = namespaces;

        this.middlewareChain = []
    }

    /**
        Private Utility Methods
        --------------------------
    */

    /**
     * NOT USED DIRECTLY
     */
    _useRoute(type: RequestType, pathTemplate: string, ...controllers: Array<RestSocketMiddleware>): void {

        this.middlewareChain.push({
            namespaces: this.namespaces.length ?
                this.namespaces : [Constants.DEFAULT_NAMESPACE],
            pathTemplate,
            middlewares: controllers,
            isController: true,
            method: type
        })
    }

    /**
     * NOT USED DIRECTLY
     */
    _addMiddleware(pathTemplate: string, ...middlewares: Array<RestSocketMiddleware>): void {

        this.middlewareChain.push({
            namespaces: this.namespaces.length ?
                this.namespaces : [Constants.DEFAULT_NAMESPACE],
            pathTemplate,
            middlewares,
            isController: false
        })

    }

    /**
     * 
     * @param pathOrMiddleware 
     * @param middlewares 
     * @example
     * 
     * const router = require('rt-rest').Router()
     * 
     * router.use('/api', (req, res, next) => { ... })
     * 
     * router.use((req, res, next) => { ... })
     */
    use(
        pathOrMiddleware: string | RestSocketMiddleware,
        ...middlewares: Array<RestSocketMiddleware>
    ): void {
        if (typeof pathOrMiddleware === 'string') {
            this._addMiddleware(pathOrMiddleware, ...middlewares)
        } else {
            this._addMiddleware(Constants.MATCH_ALL, ...[pathOrMiddleware].concat(middlewares))
        }

        return;
    }

    /**
     * 
     * @param pathTemplate 
     * @param controllers 
     * 
     * const router = require('rt-rest').Router()
     * 
     * router.get('/posts', (req, res) => { ... })
     */
    get(pathTemplate: string, ...controllers: Array<RestSocketMiddleware>): void {
        this._useRoute(RequestType.GET, pathTemplate, ...controllers)
    }

    /**
     * 
     * @param pathTemplate 
     * @param controllers 
     * 
     * const router = require('rt-rest').Router()
     * 
     * router.post('/posts', (req, res) => { ... })
     */
    post(pathTemplate: string, ...controllers: Array<RestSocketMiddleware>): void {
        this._useRoute(RequestType.POST, pathTemplate, ...controllers)
    }

    /**
     * 
     * @param pathTemplate 
     * @param controllers 
     * 
     * const router = require('rt-rest').Router()
     * 
     * router.put('/posts/:id', (req, res) => { ... })
     */
    put(pathTemplate: string, ...controllers: Array<RestSocketMiddleware>): void {
        this._useRoute(RequestType.PUT, pathTemplate, ...controllers)
    }

    /**
     * 
     * @param pathTemplate 
     * @param controllers 
     * 
     * const router = require('rt-rest').Router()
     * 
     * router.delete('/posts/:id', (req, res) => { ... })
     */
    delete(pathTemplate: string, ...controllers: Array<RestSocketMiddleware>): void {
        this._useRoute(RequestType.DELETE, pathTemplate, ...controllers)
    }
}

export class RestSocketServer extends RestSocketRouter {

    static parseOptions = (options?: RestSocketOptions): {
        maxHttpBufferSize: RestSocketOptions['maxByteSize'],
        cors: RestSocketOptions['cors']
    } => ({
        maxHttpBufferSize: options?.maxByteSize,
        cors: options?.cors
    })

    /**
     * Class fields
     */
    port: number
    httpServer: HttpServer
    socketIo: SocketIO.Server & {
        httpServer: HttpServer
    }

    constructor(port?: number, server?: HttpServer, options?: RestSocketOptions) {
        super([])

        if (!port && !server) {
            throw new Error('Please provide a port or Server to create a RestSocketServer instance.')
        }

        if (server) {
            this.socketIo = require('socket.io')(server, RestSocketServer.parseOptions(options))
            this.httpServer = server
        } else {
            this.port = port
            this.httpServer = createServer()
            this.socketIo = require('socket.io')(this.httpServer, RestSocketServer.parseOptions(options))
        }

        this.socketIo.httpServer.on('listening', () => {
            this._subscribeToRequests()
        })

    }

    /**
     * @example
     * 
     * const app = require('rt-rest')(3030)
     * 
     * app.listen()
     */
    listen(): void {
        if (this.httpServer.listening) return;

        this.httpServer.listen(this.port, () => {
            console.info(`Server listening on ${this.port}!`)
        })
    }

    /**
        Middleware Utility Methods
        --------------------------
     */

    _combineRouter(path: string, router: RestSocketRouter): void {
        this.middlewareChain.push(...router.middlewareChain.map(m => ({
            ...m,
            pathTemplate: path + m.pathTemplate
        })))
    }
    /**
     * 
     * @param middlewares 
     * @example
     * 
     * const app = require('rt-rest')(3030)
     * 
     * app.use((req, res, next) => { ... })
     * 
     * app.use('/api', (req, res, next) => { ... })
     * 
     * const router = require('rt-rest').Router()
     * 
     * app.use('/api', router)
     * 
     */
    use(
        path: string | RestSocketMiddleware,
        router?: RestSocketRouter | RestSocketMiddleware,
        ...middlewares: Array<RestSocketMiddleware>
    ): void {

        if (typeof path === 'string' && router instanceof RestSocketRouter) {
            this._combineRouter(path, router)
        }

        else if (typeof path === 'string' && typeof router === 'function') {
            // Add middleware
            this._addMiddleware(path, ...[router].concat(middlewares))
        }

        else if (typeof path === 'function') {
            // Add middleware
            this._addMiddleware(Constants.MATCH_ALL, ...[path].concat(middlewares))
        }

        return;
    }

    /**
        Instance Creator Methods
        ------------------------
     */

    /**
     * NOT USED DIRECTLY
     */
    static _fromPort(port: number, options: RestSocketOptions = {}): RestSocketServer {
        if (!port) {
            throw new Error('Please provide an available port number.')
        }

        return new RestSocketServer(port, undefined, options)
    }

    /**
     * NOT USED DIRECTLY
     */
    static _fromServer(server: HttpServer, options: RestSocketOptions = {}): RestSocketServer {
        if (!server) {
            throw new Error('Please provide a server instance.')
        }

        return new RestSocketServer(undefined, server, options)
    }

    /**
     * NOT USED DIRECTLY
     */

    _subscribeToRequests(): void {

        this.socketIo.on('connection', (socket) => {
            console.log('Client connected: ', socket.id)
            socket.on(ConnectionType.REQUEST, (
                { method, requestId, path, payload, attachments }: RequestPayload) => {

                // Acknowledge request was received
                socket.emit(Constants.receivedEvent(requestId))

                const namespace = socket.nsp.name

                const res = new RestSocketResponse(socket,
                    (data: RestSocketResponsePayload) => {
                        socket.emit(Constants.responseEvent(requestId), data, null)
                    })

                // Determine matching controllers 
                const controllerChain = this.middlewareChain
                    .filter(h =>
                        h.isController &&
                        h.namespaces.includes(namespace) &&
                        match(h.pathTemplate, path).matches &&
                        h.method === method
                    )

                /// Handle No matching routes
                if (!controllerChain.length) {
                    console.info('No matching routes')

                    // Tell user no route found
                    res.status(404).json({
                        message: 'No matching routes.'
                    });

                    return;
                }

                /**
                 * Run middleware if...
                 * 
                 * It matches to all routes
                 * 
                 * OR
                 * 
                 * Matches exactly (route middleware)
                 * 
                 * Matches prefix (non-route middleware)
                 * 
                 * AND 
                 * 
                 * This handler is also used for client's namespace
                 * 
                 */
                const handlers = this.middlewareChain
                    .filter(h => {
                        const matchesPath = (
                            h.pathTemplate === Constants.MATCH_ALL ||
                                h.isController ?
                                match(h.pathTemplate, path).matches
                                : path.startsWith(h.pathTemplate)
                        )

                        return h.namespaces.includes(namespace) && matchesPath
                    })

                // Flatten list of each route's middleware chain to one big list
                const middlewareQueue: Array<MiddlewareQueueItem> =
                    handlers.map((h) =>
                        h.middlewares.map(m => ({
                            isController: h.isController,
                            pathTemplate: h.pathTemplate,
                            handler: m
                        }))
                    ).flat()

                const req = new RestSocketRequest({
                    namespace,
                    connectionId: socket.id,
                    path,
                    rooms: Object.keys(socket.rooms),
                    params: {},
                    session: socket.request.session || {},
                    headers: socket.handshake.headers,
                    method,
                    id: requestId,
                    body: payload,
                    attachments: attachments.map(a => Buffer.from(a))
                })

                const processMiddleware = (req: RestSocketRequest, res: RestSocketResponse, item: MiddlewareQueueItem) => {
                    const next: RestSocketNext = (e) => {
                        if (e) {
                            // Log Error
                            console.error('NEXT CALLED WITH ERR', e)
                            // Send an error back to the client
                            res.status(404).json({
                                message: e
                            })
                            return;
                        }

                        if (middlewareQueue.length > 0) {
                            processMiddleware(req, res, middlewareQueue.shift())
                        }
                    }

                    // Calculate params for current handler
                    req.params = (
                        item.isController ?
                            match(item.pathTemplate, req.path).params :
                            {}
                    )

                    item.handler(req, res, next)

                }

                // Process all matching middleware
                // Catch any errors
                try {
                    processMiddleware(req, res, middlewareQueue.shift())
                } catch (e) {
                    res.status(500).json({
                        message: e.message
                    })
                }

            })

        })
    }

}

export class RestSocketRequest<T = Record<string, unknown>> {
    namespace: SocketIO.Namespace['name']
    connectionId: SocketIO.Socket['id']
    path: string
    rooms: Array<string>
    params: ReturnType<typeof match>['params']
    session: Record<string, unknown>
    headers: SocketIO.Handshake['headers']
    method: RequestType
    id: string
    body: T
    attachments: Array<Buffer>
    search: URLSearchParams

    constructor(data: RestSocketRequestData<T>) {
        Object.keys(data).forEach(k => this[k] = data[k])

        this.search = new URLSearchParams(this.path)
    }

    param(p: string): string | undefined {
        return this.params[p]
    }

    query(q: string): string | undefined {
        return this.search.get(q)
    }

}

export class RestSocketResponse {
    socket: SocketIO.Socket
    done: (data: RestSocketResponsePayload) => void
    code: number;

    constructor(
        socket: RestSocketResponse['socket'],
        done: RestSocketResponse['done']
    ) {
        this.done = done
        this.socket = socket
        this.code = 200
    }

    // TODO - Inaccurate way to determine if response is okay
    isOk(): boolean {
        return this.code < 400
    }

    end(): void {
        this.done({
            code: this.code,
            ok: this.isOk()
        })
        return;
    }

    json(data?: Record<string, unknown>): void {
        this.done({
            code: this.code,
            ok: this.isOk(),
            data
        })
        return;
    }

    status(code: number): RestSocketResponse {
        this.code = code
        return this;
    }

    cookie(): RestSocketResponse {
        throw Error('Not implemented')
        return;
    }

    clearCookie(): RestSocketResponse {
        throw Error('Not implemented')
        return;
    }

}