import { RestSocketOptions, SetupOption } from "./types"
import { RestSocketRouter, RestSocketServer } from "./lib"
import { Server } from "http"

export function Router(...namespaces: Array<string>): RestSocketRouter {
    return new RestSocketRouter(namespaces)
}

export default function (setupOption: SetupOption, options: RestSocketOptions = {}): RestSocketServer {
    if (setupOption instanceof Server) {
        return RestSocketServer._fromServer(setupOption, options)
    }
    else if (typeof setupOption === 'number') {
        return RestSocketServer._fromPort(setupOption, options)
    }

    throw new Error('Invalid socket option provided.')
}