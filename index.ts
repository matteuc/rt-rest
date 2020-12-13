// TODO
// Some entity that processes a request and passes it through middleware, which only proceeds if 'next()' is called without error
// If called with error, return to client with error code

// TODO 
// Some function that is used to define an HTTP request (i.e. 'post()') and correctly passes the incoming request to middlewares under the specified route

import { RestSocketOptions, SetupOption } from "./types"
import { RestSocket } from "./lib"
import { Server } from "http"

export default function (setupOption: SetupOption, options: RestSocketOptions = {}): RestSocket | void {
    if (setupOption instanceof Server) {
        return RestSocket.fromServer(setupOption, options)
    }
    else if (typeof setupOption === 'number') {
        return RestSocket.fromPort(setupOption, options)
    }

    throw new Error('Invalid socket option provided.')
}