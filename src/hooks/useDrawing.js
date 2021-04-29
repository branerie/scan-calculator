import { useCallback } from 'react'
import { useElementsContext } from '../contexts/ElementsContext'
import { useToolsContext } from '../contexts/ToolsContext'
import { degreesToRadians } from '../utils/angle'

const SELECT_POINT_SQUARE_HALF_SIDE = 4
const SNAP_POINT_SQUARE_HALF_SIDE = 8
const SNAP_POINT_CIRCLE_RADIUS = 8
const SNAP_MID_POINT_TRIANGLE_HALF_SIDE = 10
const LINE_DASH_LINE_SIZE = 15
const LINE_DASH_SPACE_SIZE = 10

const useDrawing = () => {
    const {
        elements: {
            snappedPoint
        },
        selection: {
            selectedPoints,

        }
    } = useElementsContext()
    const { canvasContext, currentScale, currentTranslate } = useToolsContext()

    const resetCanvas = useCallback(() => {
        if (!canvasContext) return

        canvasContext.resetTransform()

        canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height)

        canvasContext.translate(currentTranslate[0], currentTranslate[1])
        canvasContext.scale(currentScale, currentScale)
    }, [canvasContext, currentScale, currentTranslate])

    const drawElement = useCallback((element, isSelected = false) => {
        canvasContext.beginPath()
        if (isSelected) {
            canvasContext.setLineDash([LINE_DASH_LINE_SIZE / currentScale, LINE_DASH_SPACE_SIZE / currentScale])
        }

        canvasContext.lineWidth = 1 / currentScale
        switch (element.type) {

            case 'line':
                canvasContext.moveTo(element.pointA.x, element.pointA.y)
                canvasContext.lineTo(element.pointB.x, element.pointB.y)
                break
            case 'arc':
                canvasContext.moveTo(element.startLine.pointB.x, element.startLine.pointB.y)
                canvasContext.arc(
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
                element.elements.forEach(e => drawElement(e, isSelected))
                return
            case 'circle':
                canvasContext.moveTo(element.centerPoint.x + element.radius, element.centerPoint.y)
                canvasContext.arc(
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

        canvasContext.stroke()
        canvasContext.setLineDash([])
    }, [canvasContext, currentScale])

    const drawSelectionPoints = useCallback((selectionPoints) => {
        for (const selectionPoint of selectionPoints) {
            const pointFill = selectedPoints && selectedPoints.some(p => p.pointId === selectionPoint.pointId)
                ? 'red'
                : 'blue'

            canvasContext.beginPath()
            // context.moveTo(selectionPoint.x, selectionPoint.y)
            canvasContext.fillStyle = pointFill

            const scaledHalfSquareSide = SELECT_POINT_SQUARE_HALF_SIDE / currentScale

            canvasContext.fillRect(
                selectionPoint.x - scaledHalfSquareSide,
                selectionPoint.y - scaledHalfSquareSide,
                scaledHalfSquareSide * 2,
                scaledHalfSquareSide * 2
            )

            canvasContext.stroke()
        }
    }, [canvasContext, currentScale, selectedPoints])

    const drawSnappedPoint = useCallback(() => {
        if (!snappedPoint) return

        canvasContext.beginPath()
        canvasContext.strokeWidth = 2 / currentScale
        // context.strokeStyle = '#479440'
        canvasContext.strokeStyle = '#42ba32'
        switch (snappedPoint.pointType) {
            case 'endPoint':
                const scaledHalfSquareSide = SNAP_POINT_SQUARE_HALF_SIDE / currentScale
                canvasContext.strokeRect(
                    snappedPoint.x - scaledHalfSquareSide,
                    snappedPoint.y - scaledHalfSquareSide,
                    scaledHalfSquareSide * 2,
                    scaledHalfSquareSide * 2
                )
                break
            case 'center':
                const scaledRadius = SNAP_POINT_CIRCLE_RADIUS / currentScale
                canvasContext.moveTo(snappedPoint.x + scaledRadius, snappedPoint.y)
                canvasContext.arc(
                    snappedPoint.x,
                    snappedPoint.y,
                    scaledRadius,
                    0,
                    2 * Math.PI,
                    true
                )
                break
            case 'midPoint':
                const scaledHalfTriangleSide = SNAP_MID_POINT_TRIANGLE_HALF_SIDE / currentScale
                const height = scaledHalfTriangleSide * Math.sqrt(3)

                canvasContext.moveTo(snappedPoint.x - scaledHalfTriangleSide, snappedPoint.y + height / 3)
                canvasContext.lineTo(snappedPoint.x + scaledHalfTriangleSide, snappedPoint.y + height / 3)
                canvasContext.lineTo(snappedPoint.x, snappedPoint.y - height * 2 / 3)
                canvasContext.lineTo(snappedPoint.x - scaledHalfTriangleSide, snappedPoint.y + height / 3)
                break
            default:
                break
        }

        canvasContext.stroke()
        canvasContext.strokeStyle = '#000000'
    }, [canvasContext, currentScale, snappedPoint])

    return {
        drawElement,
        drawSelectionPoints,
        drawSnappedPoint,
        resetCanvas
    }
}

export default useDrawing