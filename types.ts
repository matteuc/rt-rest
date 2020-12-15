import { CorsOptions } from 'cors'
import { Server } from 'http'
import { match } from 'node-match-path'
import { RestSocketRequest, RestSocketResponse } from './lib'

export type RestSocketOptions = {
    maxByteSize?: number,
    cors?: CorsOptions
}

export type SetupOption = number | Server

export type RestSocketNext = (err?: Error) => void

export type RestSocketMiddleware = (req: RestSocketRequest, res: RestSocketResponse, next?: RestSocketNext) => void

export type RestSocketPathHandler = {
    namespaces: Array<string>,
    pathTemplate: string,
    middlewares: Array<RestSocketMiddleware>
    isController: boolean,
    method?: RequestType
}

export type RequestPayload = {
    method: RequestType,
    requestId: string,
    path: string,
    payload: any,
    attachments: Array<string>
}

export enum RequestType {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}

export type RequestAuth = {
    token?: string
}

export type RequestHeaders = {
    host?: string,
    origin?: string,
}

export type RestSocketControllerMap = {
    [k in RequestType]: Array<RestSocketPathHandler>
}

export type RestSocketMiddlewareSet = Array<RestSocketPathHandler>

export type RestSocketRequestData<T> = {
    namespace: SocketIO.Namespace['name'],
    connectionId: SocketIO.Socket['id'],
    path: string,
    rooms: Array<string>,
    params: ReturnType<typeof match>['params'],
    session: Record<string, unknown>,
    headers: SocketIO.Handshake['headers'],
    method: RequestType,
    id: string,
    body: T,
    attachments: Array<Buffer>
}

export type RestSocketResponsePayload = {
    [key: string]: any,
    code: () => number
}

export type MiddlewareQueueItem = {
    isController: RestSocketPathHandler['isController'],
    pathTemplate: RestSocketPathHandler['pathTemplate'],
    handler: RestSocketMiddleware
}

export enum ConnectionType {
    REQUEST = 'REQUEST',
    EVENT = 'EVENT'
}