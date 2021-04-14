import { degreesToRadians } from './angle'

const draw = (context, element) => {
    context.beginPath()
    switch (element.type) {

        case 'line':
            context.moveTo(element.pointA.x, element.pointA.y)
            context.lineTo(element.pointB.x, element.pointB.y)
            console.log(element.pointB)
            break
        case 'arc':
            context.moveTo(element.startLine.pointB.x, element.startLine.pointB.y)
            context.arc(
                element.centerPoint.x,
                element.centerPoint.y,
                element.radius,
                degreesToRadians(element.startLine.angle),
                degreesToRadians(element.endLine.angle),
                true
            )
            break
        case 'polyline':
            element.elements.forEach(e => draw(context, e))
            break
        case 'circle':
            context.moveTo(element.centerPoint.x + element.radius , element.centerPoint.y)
            context.arc(
                element.centerPoint.x,
                element.centerPoint.y,
                element.radius,
                degreesToRadians(0),
                degreesToRadians(360),
                true
            )
            break
        default:
            throw new Error(`Element type ${element.type} not supported`)
    }

    context.stroke()
}

export {
    draw
}