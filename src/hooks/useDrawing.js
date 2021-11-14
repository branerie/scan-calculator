import { useCallback } from 'react'
import { useAppContext } from '../contexts/AppContext'
import Line from '../drawingElements/line'
import { degreesToRadians } from '../utils/angle'

const SELECT_POINT_SQUARE_HALF_SIDE = 4
const SNAP_POINT_SQUARE_HALF_SIDE = 8
const SNAP_POINT_CIRCLE_RADIUS = 8
const SNAP_MID_POINT_TRIANGLE_HALF_SIDE = 10
const LINE_DASH_LINE_SIZE = 15
const LINE_DASH_SPACE_SIZE = 10

const LINE_DASH_CONTAINER_SIZE = 5

const REPLACED_COLOR = '#6a6e6b'

const useDrawing = () => {
    const {
        elements: {
            snappedPoint,
            currentlyReplacedElements,
            selection: { 
                selectedPoints 
            },
            hashGrid
        },
        tools: { canvasContext, currentScale, currentTranslate, tool, keysRef: toolKeys },
    } = useAppContext()

    const drawHashGrid = () => {
        for (let xIdx = hashGrid.startPosX; xIdx <= hashGrid.initialNumDivsX; xIdx++) {
            const currentX = xIdx * hashGrid.divSizeX
            drawElement(new Line({ x: currentX, y: 0 }, { pointB: { x: currentX, y: 5000 } }), {
                color: 'green'
            })
        }

        for (let yIdx = hashGrid.startPosY; yIdx <= hashGrid.initialNumDivsY; yIdx++) {
            const currentY = yIdx * hashGrid.divSizeY
            drawElement(new Line({ x: 0, y: currentY }, { pointB: { x: 5000, y: currentY } }), {
                color: 'green'
            })
        }
    }

    const resetCanvas = useCallback(() => {
        if (!canvasContext) return

        canvasContext.resetTransform()

        canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height)

        canvasContext.translate(currentTranslate[0], currentTranslate[1])
        canvasContext.scale(currentScale, currentScale)

        drawHashGrid()
    }, [canvasContext, currentScale, currentTranslate])

    const drawElement = useCallback(
        (element, options = {}) => {
            canvasContext.beginPath()

            const { color, lineDash } = options

            if (color) {
                canvasContext.strokeStyle = color
            }

            if (lineDash) {
                canvasContext.setLineDash(lineDash)
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
                    element.elements.forEach(e => {
                        if (e.isShown) {
                            drawElement(e, options)
                        }
                    })
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
            canvasContext.strokeStyle = '#000000'
            canvasContext.setLineDash([])
        },
        [canvasContext, currentScale]
    )

    const drawSelectedElement = useCallback(
        (element, options = {}) => {
            drawElement(element, {
                ...options,
                lineDash: [LINE_DASH_LINE_SIZE / currentScale, LINE_DASH_SPACE_SIZE / currentScale]
            })
        },
        [currentScale, drawElement]
    )

    const drawReplacedElements = useCallback(
        (options = {}) => {
            // if (!currentlyReplacedElements || !currentlyReplacedElements.currentReplacements) return
            if (!currentlyReplacedElements) return

            if (currentlyReplacedElements.currentReplacements) {
                const replacements = Object.values(currentlyReplacedElements.currentReplacements)
                let isTrim = tool.name === 'trim'
                if (toolKeys.current.shift) {
                    isTrim = !isTrim
                }

                for (const replacement of replacements) {
                    for (const element of replacement.removedSections) {
                        // drawElement(element, { ...options, color: REPLACED_COLOR })
                        isTrim
                            ? drawElement(element, { ...options, color: REPLACED_COLOR })
                            : drawElement(element)
                    }

                    for (const replacingElement of replacement.replacingElements) {
                        isTrim
                            ? drawElement(replacingElement)
                            : drawElement(replacingElement, { ...options, color: REPLACED_COLOR })
                    }
                }
            }
        },
        [currentlyReplacedElements, drawElement, tool.name, toolKeys]
    )

    const drawSelectionPoints = useCallback(
        selectionPoints => {
            for (const selectionPoint of selectionPoints) {
                const pointFill =
                    selectedPoints && selectedPoints.some(p => p.pointId === selectionPoint.pointId)
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
        },
        [canvasContext, currentScale, selectedPoints]
    )

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
                canvasContext.arc(snappedPoint.x, snappedPoint.y, scaledRadius, 0, 2 * Math.PI, true)
                break
            case 'midPoint':
                const scaledHalfTriangleSide = SNAP_MID_POINT_TRIANGLE_HALF_SIDE / currentScale
                const height = scaledHalfTriangleSide * Math.sqrt(3)

                canvasContext.moveTo(snappedPoint.x - scaledHalfTriangleSide, snappedPoint.y + height / 3)
                canvasContext.lineTo(snappedPoint.x + scaledHalfTriangleSide, snappedPoint.y + height / 3)
                canvasContext.lineTo(snappedPoint.x, snappedPoint.y - (height * 2) / 3)
                canvasContext.lineTo(snappedPoint.x - scaledHalfTriangleSide, snappedPoint.y + height / 3)
                break
            default:
                break
        }

        canvasContext.stroke()
        canvasContext.strokeStyle = '#000000'
    }, [canvasContext, currentScale, snappedPoint])

    const drawToolComponents = useCallback(() => {
        if (tool.clicks && tool.mousePosition) {
            const {
                clicks: [initialClick],
                mousePosition: { mouseX, mouseY }
            } = tool
            const isPartialSelect = mouseX < initialClick.x || tool.type === 'trim'

            const startX = Math.min(initialClick.x, mouseX)
            const startY = Math.min(initialClick.y, mouseY)
            const width = Math.abs(initialClick.x - mouseX)
            const height = Math.abs(initialClick.y - mouseY)

            canvasContext.beginPath()

            canvasContext.globalAlpha = 0.6
            canvasContext.fillStyle = isPartialSelect ? '#169438' : '#0277d6'
            canvasContext.fillRect(startX, startY, width, height)

            const lineDash = isPartialSelect
                ? [LINE_DASH_CONTAINER_SIZE / currentScale, LINE_DASH_CONTAINER_SIZE / currentScale]
                : []

            canvasContext.setLineDash(lineDash)

            canvasContext.strokeStyle = '#000000'
            canvasContext.strokeRect(startX, startY, width, height)
            canvasContext.stroke()

            canvasContext.globalAlpha = 1
            canvasContext.setLineDash([])
            return
        }

        if (!tool.line || (tool.type === 'draw' && tool.name !== 'arc' && tool.name !== 'circle')) return

        canvasContext.strokeStyle = '#d48a02'
        drawElement(tool.line, true)

        canvasContext.strokeStyle = '#000000'
        canvasContext.setLineDash([])
    }, [canvasContext, currentScale, drawElement, tool])

    return {
        drawElement,
        drawSelectedElement,
        drawReplacedElements,
        drawSelectionPoints,
        drawSnappedPoint,
        drawToolComponents,
        resetCanvas
    }
}

export default useDrawing
