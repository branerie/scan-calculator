import { FullyDefinedArc } from '../drawingElements/arc'
import { FullyDefinedCircle } from '../drawingElements/circle'
import { FullyDefinedElement } from '../drawingElements/element'
import { FullyDefinedLine } from '../drawingElements/line'
import Point from '../drawingElements/point'
import { FullyDefinedPolyline } from '../drawingElements/polyline'
import { degreesToRadians } from './angle'
import { SelectionPoint } from './types/index'

const SELECT_POINT_SQUARE_HALF_SIDE = 4
const SNAP_POINT_SQUARE_HALF_SIDE = 8
const SNAP_POINT_CIRCLE_RADIUS = 8
const SNAP_MID_POINT_TRIANGLE_HALF_SIDE = 10
const LINE_DASH_LINE_SIZE = 15
const LINE_DASH_SPACE_SIZE = 10

const draw = (context: CanvasRenderingContext2D, element: FullyDefinedElement, currentScale: number, isSelected = false) => {
  context.beginPath()
  if (isSelected) {
    context.setLineDash([LINE_DASH_LINE_SIZE / currentScale, LINE_DASH_SPACE_SIZE / currentScale])
  }

  context.lineWidth = 1 / currentScale
  switch (element.type) {
    case 'line':
      context.moveTo(
        (element as FullyDefinedLine).pointA.x, 
        (element as FullyDefinedLine).pointA.y
      )
      context.lineTo(
        (element as FullyDefinedLine).pointB.x, 
        (element as FullyDefinedLine).pointB!.y
      )
      break
    case 'arc':
      context.moveTo(
        (element as FullyDefinedArc).startPoint.x, 
        (element as FullyDefinedArc).startPoint.y
      )
      context.arc(
        (element as FullyDefinedArc).centerPoint.x,
        (element as FullyDefinedArc).centerPoint.y,
        (element as FullyDefinedArc).radius,
        degreesToRadians((element as FullyDefinedArc).startAngle),
        degreesToRadians((element as FullyDefinedArc).endAngle),
        true
      )
      break
    case 'polyline':
    case 'rectangle':
      (element as FullyDefinedPolyline).elements.forEach(e => draw(context, e, currentScale,  isSelected))
      return
    case 'circle':
      context.moveTo(
        (element as FullyDefinedCircle).centerPoint.x + (element as FullyDefinedCircle).radius, 
        (element as FullyDefinedCircle).centerPoint.y
      )
      context.arc(
        (element as FullyDefinedCircle).centerPoint.x,
        (element as FullyDefinedCircle).centerPoint.y,
        (element as FullyDefinedCircle).radius,
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

const drawSelectionPoints = (
  context: CanvasRenderingContext2D, 
  selectionPoints: Point[], 
  selectedPoints: Point[], 
  currentScale: number
) => {
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

const drawSnappedPoint = (context: CanvasRenderingContext2D, snappedPoint: SelectionPoint, currentScale: number) => {
  context.beginPath()
  // context.strokeWidth = 2 / currentScale
  context.lineWidth = 2 / currentScale
  // context.strokeStyle = '#479440'
  context.strokeStyle = '#42ba32'
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
    case 'centerPoint':
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
      break
    case 'midPoint':
      const scaledHalfTriangleSide = SNAP_MID_POINT_TRIANGLE_HALF_SIDE / currentScale
      const height = scaledHalfTriangleSide * Math.sqrt(3)

      context.moveTo(snappedPoint.x - scaledHalfTriangleSide, snappedPoint.y + height / 3)
      context.lineTo(snappedPoint.x + scaledHalfTriangleSide, snappedPoint.y + height / 3)
      context.lineTo(snappedPoint.x, snappedPoint.y - height * 2 / 3)
      context.lineTo(snappedPoint.x - scaledHalfTriangleSide, snappedPoint.y + height / 3)
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
  drawSnappedPoint,
}