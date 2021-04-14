import { degreesToRadians } from './angle'

const draw = (context, element) => {
    context.beginPath()
    switch (element.type) {
        case 'line':
            context.moveTo(element.pointA.x, element.pointA.y)
            context.lineTo(element.pointB.x, element.pointB.y)
            console.log(element.angle)
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
        default:
            throw new Error(`Element type ${element.type} not supported`)
    }

    context.stroke()
}

export {
    draw
}