import Point from '../drawingElements/point'
import { getAngleBetweenPoints } from './angle'
import { SelectionPointType } from './enums/index'
import { pointsMatch } from './point'
import { capitalize } from './text'
import {
  assemblePointDistancesAndSubsections,
  fixJoinedSections,
  fixJoinedPointDistances,
  getDistFunc,
  getTrimSections,
  joinTrimEndSubsections
} from './trimUtils/trim'
import { Ensure } from './types/generics'
import { FullyDefinedArc, FullyDefinedCircle, FullyDefinedElement, FullyDefinedLine, FullyDefinedPolyline } from './types/index'

export default class ElementTrimmer {
  static trimElement(element: FullyDefinedElement, trimPoints: Point[], selectPoints: Point[]) {
    // TODO: Improve below logic
    if (element.baseType !== 'polyline') {
      trimPoints = trimPoints.filter(tp =>
        element.getSelectionPoints(SelectionPointType.EndPoint).every(ep => !pointsMatch(ep, tp))
      )
    }

    const capitalizedElementType = capitalize(element.type)
    const methodName = `trim${capitalizedElementType}`

    return ElementTrimmer[methodName](element, trimPoints, selectPoints)
  }

  static trimLine(element: FullyDefinedLine, trimPoints: Point[], selectPoints: Point[]) {
    const startPoint = element.startPoint
    const distFunc = getDistFunc('line', { startPoint })

    return getTrimSections(
      element,
      trimPoints,
      selectPoints,
      distFunc,
      element.startPoint,
      element.endPoint
    )
  }

  static trimArc(element: FullyDefinedArc, trimPoints: Point[], selectPoints: Point[]) {
    const centerPoint = element.centerPoint
    const startAngle = element.startLine.angle
    const distFunc = getDistFunc('arc', { centerPoint, startAngle })

    return getTrimSections(
      element,
      trimPoints,
      selectPoints,
      distFunc,
      element.startPoint,
      element.endPoint
    )
  }

  static trimCircle(element: FullyDefinedCircle, trimPoints: Point[], selectPoints: Point[]) {
    if (trimPoints.length < 2) {
      return null
    }

    const newTrimPoints = [...trimPoints]
    const startPoint = newTrimPoints.pop()!

    const centerPoint = element.centerPoint
    const startAngle = getAngleBetweenPoints(centerPoint, startPoint)
    const distFunc = getDistFunc('circle', { centerPoint, startAngle })

    const trimSections = getTrimSections(
      element,
      newTrimPoints,
      selectPoints,
      distFunc,
      startPoint,
      startPoint
    )

    if (trimSections) {
      trimSections.remaining = joinTrimEndSubsections(trimSections.remaining, element)
      trimSections.removed = joinTrimEndSubsections(trimSections.removed, element)
    }

    return trimSections
  }

  static trimPolyline(
    element: FullyDefinedPolyline, 
    trimPointsByElement: Record<string, Point[]>, 
    selectPoints: Point[]
  ) {
    const { pointDistances, subsections } = assemblePointDistancesAndSubsections(
      element,
      trimPointsByElement,
      selectPoints
    )

    const distFunc = (point: Ensure<Point, 'pointId'>) => {
      const pointDistance = pointDistances[point.pointId!]
      if (pointDistance && pointDistance !== 0) {
        return pointDistance
      }

      const selectPoint = pointDistances.select.find(s => pointsMatch(point, s.point))
      if (selectPoint) {
        return selectPoint.distanceFromStart
      }

      throw new Error('Could not find point distance. Could not find point on polyline')
    }

    let startPoint = null
    let endPoint = null

    const trimPoints = Object.values(trimPointsByElement).flat()
    if (element.isJoined) {
      fixJoinedSections(element, subsections)

      const lastTrimPoint = trimPoints[trimPoints.length - 1]
      endPoint = fixJoinedPointDistances(element, pointDistances, lastTrimPoint)
      startPoint = lastTrimPoint
      trimPoints.pop()

      if (trimPoints.length === 0) {
        return null
      }
    } else {
      startPoint = element.startPoint
      endPoint = element.endPoint
    }

    const trimSections = getTrimSections(
      element,
      trimPoints,
      selectPoints,
      distFunc,
      startPoint,
      endPoint,
      subsections
    )

    return trimSections
  }

  static trimRectangle(element, trimPointsByElement, selectPoints) {
    return ElementTrimmer.trimPolyline(element, trimPointsByElement, selectPoints)
  }
}
