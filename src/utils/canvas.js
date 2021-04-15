import { degreesToRadians } from './angle'

const draw = (context, element) => {
    console.log(element);
    context.beginPath()
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

const drawSnappingPoints = (snappingPoints, selectedPoints, context) => {
    for (const [pointType, snappingPointValues] of Object.entries(snappingPoints)) {
        switch (pointType) {
            case 'endPoints':
                snappingPointValues.forEach(endPoint => {
                    let pointFill = 'blue'
                    if (selectedPoints &&
                        selectedPoints.some(p => p.pointId === endPoint.pointId)) {
                        pointFill = 'red'
                    }

                    context.beginPath()
                    context.moveTo(endPoint.x, endPoint.y)
                    context.fillStyle = pointFill
                    context.fillRect(
                        endPoint.x - 4,
                        endPoint.y - 4, 8, 8
                    )

                    context.stroke()
                })
                break
            default:
                return
        }

    }
}


export {
    draw
}