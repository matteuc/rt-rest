import { Server } from 'http'
import { RestSocketRequest, RestSocketResponse } from './lib'

export type RestSocketOptions = {
    maxByteSize?: number
}

export type SetupOption = number | Server

export type RestSocketNext = (err?: Error) => void

export type RestSocketMiddleware = (req: RestSocketRequest, res: RestSocketResponse, next?: RestSocketNext) => void

export type RestSocketRouteController = {
    path: string,
    controllers: Array<RestSocketMiddleware>
}

export enum RequestType {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete"
}

export type RestSocketControllerMap = {
    [k in RequestType]: Array<RestSocketRouteController>
}

export type RouteConfig =
    {
        path: string
    }
    &
    {
        path: string,
        namespaces?: Array<string>
    }

export type RestSocketControllerNamespaceMap = {
    [namespace: string]: RestSocketControllerMap
}