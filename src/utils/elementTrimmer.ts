import { FullyDefinedArc } from '../drawingElements/arc'
import { FullyDefinedCircle } from '../drawingElements/circle'
import { ElementWithId } from '../drawingElements/element'
import { FullyDefinedLine } from '../drawingElements/line'
import Point from '../drawingElements/point'
import { FullyDefinedPolyline } from '../drawingElements/polyline'
import { FullyDefinedRectangle } from '../drawingElements/rectangle'
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
import { Defined, Ensure } from './types/generics'

export default class ElementTrimmer {
  static trimElement(element: ElementWithId, trimPoints: Defined<Point, "pointId">[], selectPoints: Point[]) {
    // TODO: Improve below logic
    if (element.baseType !== 'polyline') {
      trimPoints = trimPoints.filter(tp =>
        element.getSelectionPoints(SelectionPointType.EndPoint).every(ep => !pointsMatch(ep, tp))
      )
    }
    const capitalizedElementType = capitalize(element.type)
    const methodName = `trim${capitalizedElementType}` as Exclude<keyof typeof ElementTrimmer, 'prototype'>

    switch (methodName) {
      case 'trimLine':
        return ElementTrimmer.trimLine(element as Ensure<FullyDefinedLine, 'id'>, trimPoints, selectPoints)
      case 'trimArc':
        return ElementTrimmer.trimArc(element as Ensure<FullyDefinedArc, 'id'>, trimPoints, selectPoints)
      case 'trimCircle':
        return ElementTrimmer.trimCircle(element as Ensure<FullyDefinedCircle, 'id'>, trimPoints, selectPoints)
      default:
        throw new Error(`ElementTrimmer.trimElement does not support element type ${element.type}`)
    }

    // return ElementTrimmer[methodName](element, trimPoints, selectPoints)
  }

  static trimLine(element: Ensure<FullyDefinedLine, 'id'>, trimPoints: Defined<Point, "pointId">[], selectPoints: Point[]) {
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

  static trimArc(element: Ensure<FullyDefinedArc, 'id'>, trimPoints: Defined<Point, "pointId">[], selectPoints: Point[]) {
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

  static trimCircle(element: Ensure<FullyDefinedCircle, 'id'>, trimPoints: Defined<Point, "pointId">[], selectPoints: Point[]) {
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
      trimSections.remaining = joinTrimEndSubsections(trimSections.remaining, element, true)
      trimSections.removed = joinTrimEndSubsections(trimSections.removed, element, false)
    }

    return trimSections
  }

  static trimPolyline(
    element: Ensure<FullyDefinedPolyline, 'id'>, 
    trimPointsByElement: Record<string, Defined<Point, 'pointId'>[]>, 
    selectPoints: Point[]
  ) {
    let { pointDistances, subsections } = assemblePointDistancesAndSubsections(
      element,
      trimPointsByElement,
      selectPoints
    )

    const distFunc = (point: Defined<Point, 'pointId'>) => {
      const pointDistance = pointDistances.points[point.pointId]
      if (pointDistance && pointDistance !== 0) {
        return pointDistance
      }

      const selectPoint = pointDistances.selection.find(s => pointsMatch(point, s.point))
      if (selectPoint) {
        return selectPoint.distanceFromStart
      }

      throw new Error('Could not find point distance. Could not find point on polyline')
    }

    let startPoint = null
    let endPoint = null

    const trimPoints = Object.values(trimPointsByElement).flat()
    if (element.isJoined) {
      subsections = fixJoinedSections(element, subsections)

      const lastTrimPoint = trimPoints[trimPoints.length - 1]
      const newPointDistancesResult = fixJoinedPointDistances(element, pointDistances, lastTrimPoint)
      endPoint = newPointDistancesResult.newEndPoint
      pointDistances = newPointDistancesResult.pointDistances

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
      distFunc as (point: Point) => number,
      startPoint,
      endPoint,
      subsections
    )

    // TODO: Test if polylines don't need to use the joinTrimEndSubsections function, same as circle
    return trimSections
  }

  static trimRectangle(
    element: Ensure<FullyDefinedRectangle, 'id'>,
    trimPointsByElement: Record<string, Defined<Point, 'pointId'>[]>,
    selectPoints: Point[]
  ) {
    return ElementTrimmer.trimPolyline(element, trimPointsByElement, selectPoints)
  }
}
