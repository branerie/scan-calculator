import { FullyDefinedElement } from '../drawingElements/element'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline, { SubElement } from '../drawingElements/polyline'
import { getPointDistance, getPointDistanceOnArc, pointsMatch } from './point'

const checkIsElementStartCloserThanEnd = (
  element: FullyDefinedElement, 
  pointsOnElement: Point[], 
  polylineSubElement?: SubElement
) => {
  if (element.type === 'circle') {
    throw new Error('Elements of type circle do not have a start or end')
  }

  if (element instanceof Polyline && element.isJoined) {
    throw new Error('Closed polylines do not have a start or end')
  }

  const result = []
  if (!(element instanceof Polyline)) {
    for (const pointOnElement of pointsOnElement) {
      const startDistance = getPointDistance(element.startPoint, pointOnElement)
      const endDistance = getPointDistance(element.endPoint, pointOnElement)

      result.push(startDistance < endDistance)
    }

    return result
  }

  if (!polylineSubElement) {
    throw new Error('You must explicitly pass polyline sub element if "element" is of type polyline')
  }

  const elementStartDistances: Record<string, number> = {}
  let totalDistance = 0
  let lastSubElementEndPoint = element.startPoint
  const innerElements = element.elements
  let isPointsSubElementInPolyDirection = true
  for (let elementIndex = 0; elementIndex < innerElements.length; elementIndex++) {
    const innerElement = innerElements[elementIndex]

    elementStartDistances[innerElement.id!] = totalDistance
    totalDistance += innerElement.length

    const isInPolyDirection = pointsMatch(lastSubElementEndPoint, innerElement.startPoint)
    if (innerElement.id === polylineSubElement.id) {
      isPointsSubElementInPolyDirection = isInPolyDirection
    }

    lastSubElementEndPoint = isInPolyDirection ? innerElement.endPoint : innerElement.startPoint
  }

  const polylineMidPointDistance = totalDistance / 2
  for (const pointOnElement of pointsOnElement) {
    let pointDistanceOnElement = 0
    if (polylineSubElement instanceof Line) {
      pointDistanceOnElement = isPointsSubElementInPolyDirection
          ? getPointDistance(polylineSubElement.startPoint, pointOnElement)
          : getPointDistance(polylineSubElement.endPoint, pointOnElement)
    } else {
      pointDistanceOnElement = isPointsSubElementInPolyDirection
          ? getPointDistanceOnArc(polylineSubElement.startPoint, pointOnElement, polylineSubElement.centerPoint)
          : getPointDistanceOnArc(polylineSubElement.endPoint, pointOnElement, polylineSubElement.centerPoint)
    }

    const totalPointPolylineDistance = elementStartDistances[polylineSubElement.id!] + pointDistanceOnElement

    result.push(totalPointPolylineDistance < polylineMidPointDistance)
  }

  return result
  // if (element.type === 'line') {
  //     const startDistance = getPointDistance(element.startPoint, point)
  //     const endDistance = getPointDistance(element.endPoint, point)

  //     return startDistance < endDistance
  // }

  // if (element.type === 'arc') {
  //     const pointAngleFromCenter = getAngleBetweenPoints(element.centerPoint, point)

  //     let startDiff = Math.abs(element.startLine.angle - pointAngleFromCenter)
  //     if (startDiff > 180) {
  //         startDiff = 360 - startDiff
  //     }

  //     let endDiff = Math.abs(element.endLine.angle - pointAngleFromCenter)
  //     if (endDiff > 180) {
  //         endDiff = 360 - endDiff
  //     }

  //     return startDiff < endDiff
  // }
}

export {
  checkIsElementStartCloserThanEnd
}