import server, { Router } from '.'
import { RestSocketMiddleware } from './types'

const rt = server(3050)

const controller: RestSocketMiddleware = (req, res, next) => {
    console.log('controller', { change: req.session })

    return
}
const mainMiddleware: RestSocketMiddleware = (req, res, next) => {
    console.log('mainMiddleware')
    next()

    return
}
const firstMiddleware: RestSocketMiddleware = (req, res, next) => {
    console.log('firstMiddleware')
    console.log('controller', { change: req.session })
    next()

    return
}
const secondMiddleware: RestSocketMiddleware = (req, res, next) => {
    console.log('secondMiddleware')
    req.session = { yo: 'Hello' }
    next()

    return
}

rt.use(mainMiddleware)

const router = Router()

router.post('/ping', controller)

rt.use('/admin', firstMiddleware, secondMiddleware)

rt.use('/admin', router)

rt.listen()
