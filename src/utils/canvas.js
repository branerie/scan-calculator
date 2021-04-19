import { degreesToRadians } from './angle'

const draw = (context, element, currentScale) => {
    context.beginPath()
    context.lineWidth = 1 / currentScale
    switch (element.type) {

        case 'line':
            context.moveTo(element.pointA.x, element.pointA.y)
            context.lineTo(element.pointB.x, element.pointB.y)
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
        case 'rectangle':
            element.elements.forEach(e => draw(context, e))
            break
        case 'circle':
            context.moveTo(element.centerPoint.x + element.radius, element.centerPoint.y)
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

const drawSnappingPoints = (context, snappingPoints, selectedPoints) => {
    for (const snappingPoint of snappingPoints) {
        const pointFill = selectedPoints && selectedPoints.some(p => p.pointId === snappingPoint.pointId)
                            ? 'red' 
                            : 'blue'

        context.beginPath()
        context.moveTo(snappingPoint.x, snappingPoint.y)
        context.fillStyle = pointFill

        switch (snappingPoint.pointType) {
            case 'endPoint':
            case 'midPoint':
            case 'center':
                context.fillRect(
                    snappingPoint.x - 4,
                    snappingPoint.y - 4, 8, 8
                )

                break
            default:
                return
        }
                
        context.stroke()
    }
}


export {
    draw,
    drawSnappingPoints
}