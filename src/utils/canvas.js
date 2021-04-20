import { degreesToRadians } from './angle'

const SELECT_POINT_SQUARE_HALF_SIDE = 4
const SNAP_POINT_SQUARE_HALF_SIDE = 8
const SNAP_POINT_CIRCLE_RADIUS = 8
// const SNAP_MID_POINT_TRIANGLE_HALF_SIDE = 10
const LINE_DASH_LINE_SIZE = 15
const LINE_DASH_SPACE_SIZE = 10

const draw = (context, element, currentScale, isSelected = false) => {
    context.beginPath()
    if (isSelected) {
        context.setLineDash([LINE_DASH_LINE_SIZE / currentScale, LINE_DASH_SPACE_SIZE / currentScale])
    }

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
                0,
                2 * Math.PI,
                true
            )
            break
        default:
            throw new Error(`Element type ${element.type} not supported`)
    }

    context.stroke()
    context.setLineDash([])
}

const drawSelectionPoints = (context, selectionPoints, selectedPoints, currentScale) => {
    for (const selectionPoint of selectionPoints) {
        const pointFill = selectedPoints && selectedPoints.some(p => p.pointId === selectionPoint.pointId)
            ? 'red'
            : 'blue'

        context.beginPath()
        // context.moveTo(selectionPoint.x, selectionPoint.y)
        context.fillStyle = pointFill

        const scaledHalfSquareSide = SELECT_POINT_SQUARE_HALF_SIDE / currentScale

        context.fillRect(
            selectionPoint.x - scaledHalfSquareSide,
            selectionPoint.y - scaledHalfSquareSide,
            scaledHalfSquareSide * 2,
            scaledHalfSquareSide * 2
        )

        context.stroke()
    }
}

const drawSnappedPoint = (context, snappedPoint, currentScale) => {
    context.beginPath()
    context.strokeWidth = 2 / currentScale
    context.strokeStyle = '#479440'
    switch (snappedPoint.pointType) {
        case 'endPoint':
            const scaledHalfSquareSide = SNAP_POINT_SQUARE_HALF_SIDE / currentScale
            context.strokeRect(
                snappedPoint.x - scaledHalfSquareSide,
                snappedPoint.y - scaledHalfSquareSide,
                scaledHalfSquareSide * 2,
                scaledHalfSquareSide * 2
                )
                break
        case 'center':
        case 'midPoint':
            const scaledRadius = SNAP_POINT_CIRCLE_RADIUS / currentScale
            context.moveTo(snappedPoint.x + scaledRadius, snappedPoint.y)
            context.arc(
                snappedPoint.x,
                snappedPoint.y,
                scaledRadius,
                0,
                2 * Math.PI,
                true
            )
            // TRIANGLE:
            // const scaledHalfTriangleSide = SNAP_MID_POINT_TRIANGLE_HALF_SIDE / currentScale
            // const height = scaledHalfTriangleSide * Math.sqrt(3)

            // context.moveTo(snappedPoint.x - scaledHalfTriangleSide, snappedPoint.y + height / 3)
            // context.lineTo(snappedPoint.x + scaledHalfTriangleSide, snappedPoint.y + height / 3)
            // context.lineTo(snappedPoint.x, snappedPoint.y - height * 2 / 3)
            // context.lineTo(snappedPoint.x - scaledHalfTriangleSide, snappedPoint.y + height / 3)
            break
        default:
            break
    }

    context.stroke()
    context.strokeStyle = '#000000'
}

export {
    draw,
    drawSelectionPoints,
    drawSnappedPoint
}