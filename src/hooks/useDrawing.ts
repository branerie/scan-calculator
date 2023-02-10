import { useCallback } from 'react'
import { ACCEPTED_TOOL_KEYS, useAppContext } from '../contexts/AppContext'
import { useElementContainerContext } from '../contexts/ElementContainerContext'
import { useElementsStoreContext } from '../contexts/ElementsStoreContext'
import Arc from '../drawingElements/arc'
import Circle from '../drawingElements/circle'
import { FullyDefinedElement } from '../drawingElements/element'
import Line from '../drawingElements/line'
import Polyline from '../drawingElements/polyline'
import Rectangle from '../drawingElements/rectangle'
import { useToolsStore } from '../stores/tools/index'
import { degreesToRadians } from '../utils/angle'
import HashGridElementContainer from '../utils/elementContainers/hashGrid'
import { SelectionPoint } from '../utils/types/index'

const SELECT_POINT_SQUARE_HALF_SIDE = 4
const SNAP_POINT_SQUARE_HALF_SIDE = 8
const SNAP_POINT_CIRCLE_RADIUS = 8
const SNAP_MID_POINT_TRIANGLE_HALF_SIDE = 10
const LINE_DASH_LINE_SIZE = 15
const LINE_DASH_SPACE_SIZE = 10

const LINE_DASH_CONTAINER_SIZE = 5

const REPLACED_COLOR = '#6a6e6b'

type DrawOptions = {
  color?: string
  lineDash?: [number, number]
  forceHidden?: boolean
}

const useDrawing = () => {
  const useElementsStore = useElementsStoreContext()
  const snappedPoint = useElementsStore((state) => state.snappedPoint)
  const currentlyReplacedElements = useElementsStore((state) => state.currentlyReplacedElements)
  const selectedPoints = useElementsStore((state) => state.selectedPoints)
  const pointsTree = useElementsStore((state) => state.pointsTree)
  const tool = useToolsStore((state) => state.tool)
  const toolClicks = useToolsStore((state) => state.toolClicks)
  const toolKeys = useToolsStore((state) => state.toolKeys)
  const currentTranslate = useToolsStore((state) => state.currentTranslate)
  const currentScale = useToolsStore((state) => state.currentScale)

  const { canvasContext } = useAppContext()

  const container = useElementContainerContext() as HashGridElementContainer
  // @ts-ignore
  const hashGrid = container._hashGrid

  const drawPointsTree = useCallback(() => {
    if (!canvasContext) {
      return
    }

    const points = pointsTree.toArray()
    canvasContext.fillStyle = '#FFC0CB'
    for (const point of points) {
      canvasContext.beginPath()
      canvasContext.arc(point.leafValue, point.y, 5, 0, 2 * Math.PI)
      canvasContext.fill()
    }

    canvasContext.fillStyle = ''
  }, [canvasContext, pointsTree])

  const drawHashGrid = () => {
    for (let xIdx = hashGrid.minXDiv; xIdx <= hashGrid.initialNumDivsX; xIdx++) {
      const currentX = xIdx * hashGrid.divSizeX
      drawElement(
        new Line({ x: currentX, y: 0 }, { pointB: { x: currentX, y: 5000 } }) as FullyDefinedElement,
        { color: 'green' }
      )
    }

    for (let yIdx = hashGrid.minYDiv; yIdx <= hashGrid.initialNumDivsY; yIdx++) {
      const currentY = yIdx * hashGrid.divSizeY
      drawElement(
        new Line({ x: 0, y: currentY }, { pointB: { x: 5000, y: currentY } }) as FullyDefinedElement,
        { color: 'green' }
      )
    }
  }

  const resetCanvas = useCallback(() => {
    if (!canvasContext) {
      return
    }

    canvasContext.resetTransform()

    canvasContext.clearRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height)

    canvasContext.translate(currentTranslate[0], currentTranslate[1])
    canvasContext.scale(currentScale, currentScale)

    drawPointsTree()
    drawHashGrid()
  }, [canvasContext, currentScale, currentTranslate, drawPointsTree])

  const drawElement = useCallback(
    (element: FullyDefinedElement, options: DrawOptions = {}) => {
      if (!canvasContext || (!element.isShown && !options.forceHidden)) {
        return
      }

      canvasContext.beginPath()

      const { color, lineDash } = options

      if (color) {
        canvasContext.strokeStyle = color
      }

      if (lineDash) {
        canvasContext.setLineDash(lineDash)
      }

      canvasContext.lineWidth = 1 / currentScale

      const resetContextStroke = () => {
        canvasContext.strokeStyle = '#000000'
        canvasContext.setLineDash([])
      }

      if (element instanceof Line) {
        canvasContext.moveTo(element.pointA.x, element.pointA.y)
        canvasContext.lineTo(element.pointB!.x, element.pointB!.y)
      } else if (element instanceof Arc) {
        canvasContext.moveTo(element.startPoint!.x, element.startPoint!.y)
        canvasContext.arc(
          element.centerPoint.x,
          element.centerPoint.y,
          element.radius,
          degreesToRadians(element.startAngle!),
          degreesToRadians(element.endAngle!),
          true
        )
      } else if (element instanceof Rectangle) {
        const box = element.getBoundingBox()
        canvasContext.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top)
        resetContextStroke()
        return
      } else if (element instanceof Polyline) {
        element.elements.forEach((e) => drawElement(e, options))
        resetContextStroke()
        return
      } else if (element instanceof Circle) {
        canvasContext.moveTo(element.centerPoint.x + element.radius, element.centerPoint.y)
        canvasContext.arc(element.centerPoint.x, element.centerPoint.y, element.radius, 0, 2 * Math.PI, true)
      } else {
        throw new Error(`Element type ${element.type} not supported`)
      }

      canvasContext.stroke()
      resetContextStroke()
    },
    [canvasContext, currentScale]
  )

  const drawSelectedElement = useCallback(
    (element: FullyDefinedElement, options: DrawOptions = {}) => {
      drawElement(element, {
        ...options,
        lineDash: [LINE_DASH_LINE_SIZE / currentScale, LINE_DASH_SPACE_SIZE / currentScale],
      })
    },
    [currentScale, drawElement]
  )

  const drawReplacedElements = useCallback(
    (options = {}) => {
      // if (!currentlyReplacedElements || !currentlyReplacedElements.currentReplacements) return
      if (!currentlyReplacedElements) {
        return
      }

      if (currentlyReplacedElements.currentReplacements) {
        const replacements = currentlyReplacedElements.currentReplacements.values()
        let isTrim = tool.name === 'trim'
        if (toolKeys.has(ACCEPTED_TOOL_KEYS.SHIFT)) {
          isTrim = !isTrim
        }

        for (const replacement of replacements) {
          for (const element of replacement.removedSections) {
            if (isTrim) {
              drawElement(element, { ...options, color: REPLACED_COLOR, forceHidden: true })
              continue
            }

            drawElement(element, { ...options, forceHidden: true })
          }

          if (isTrim) {
            for (const replacingElement of replacement.replacingElements) {
              drawElement(replacingElement, { ...options, forceHidden: true })
            }
          } else if (replacement.diffElements) {
            for (const diffElement of replacement.diffElements) {
              drawElement(diffElement, { ...options, color: REPLACED_COLOR, forceHidden: true })
            }
          }
        }
      }
    },
    [currentlyReplacedElements, drawElement, tool.name, toolKeys]
  )

  const drawSelectionPoints = useCallback(
    (selectionPoints: SelectionPoint[]) => {
      if (!canvasContext) {
        return
      }

      for (const selectionPoint of selectionPoints) {
        const pointFill =
          selectedPoints && selectedPoints.some((p) => p.pointId === selectionPoint.pointId) ? 'red' : 'blue'

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
    if (!canvasContext || !snappedPoint) {
      return
    }

    canvasContext.beginPath()
    canvasContext.lineWidth = 2 / currentScale
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
      case 'centerPoint':
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
    if (!canvasContext) {
      return
    }

    if (toolClicks && tool.props?.mousePosition) {
      const [initialClick] = toolClicks
      const {
        props: {
          mousePosition: { mouseX, mouseY },
        },
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

    if (!tool.props?.line || (tool.type === 'draw' && tool.name !== 'arc' && tool.name !== 'circle')) {
      return
    }

    canvasContext.strokeStyle = '#d48a02'
    drawElement(tool.props.line, { forceHidden: true })

    canvasContext.strokeStyle = '#000000'
    canvasContext.setLineDash([])
  }, [canvasContext, currentScale, drawElement, tool, toolClicks])

  return {
    drawElement,
    drawSelectedElement,
    drawReplacedElements,
    drawSelectionPoints,
    drawSnappedPoint,
    drawToolComponents,
    resetCanvas,
  }
}

export default useDrawing
