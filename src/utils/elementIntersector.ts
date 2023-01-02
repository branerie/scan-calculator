import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'
import { radiansToDegrees } from './angle'
import { MAX_NUM_ERROR } from './constants'
import { createLine, createPoint } from './elementFactory'
import { getPerpendicularPointToLine } from './line'
import { getPointDistance, getRotatedPointAroundPivot, getUniquePoints } from './point'
import { capitalize } from './text'
import { FullyDefinedArc, FullyDefinedCircle, FullyDefinedElement, FullyDefinedLine } from './types/index'

export default class ElementIntersector {
  static getIntersections(
    elementA: FullyDefinedElement, 
    elementB: FullyDefinedElement, 
    shouldLieOnElements: 'yes' | 'no' | 'any' = 'yes'
  ): Point[] | null {
    let results: Point[] = []
    const polylineElement = elementA instanceof Polyline
      ? elementA 
      : elementB instanceof Polyline ? elementB : null

    if (polylineElement) {
      const nonPolylineElement = elementA.baseType === 'polyline' ? elementB : elementA

      for (const element of polylineElement.elements) {
        const intersections = ElementIntersector.getIntersections(
          element as FullyDefinedElement, 
          nonPolylineElement, shouldLieOnElements
        )

        if (!intersections) {
          continue
        }

        const uniqueIntersections = getUniquePoints(intersections)
        results = results.concat(uniqueIntersections)
      }

      return results.length > 0 ? results : null
    }

    const [firstElement, secondElement] = [elementA, elementB].sort((a, b) => a.type.localeCompare(b.type))
    const firstCapitalizedType = capitalize(firstElement.type)
    const secondCapitalizedType = capitalize(secondElement.type)

    const methodName = `get${firstCapitalizedType}${secondCapitalizedType}Intersections`
    // @ts-ignore
    return ElementIntersector[methodName](firstElement, secondElement, shouldLieOnElements)
  }

  static getArcArcIntersections(
    arcA: FullyDefinedArc, 
    arcB: FullyDefinedArc, 
    shouldLieOnElements: 'yes' | 'no' | 'any' = 'yes'
  ): Point[] | null {
    const circleIntersections = this.getCircleCircleIntersections(
      arcA as unknown as FullyDefinedCircle, 
      arcB as unknown as FullyDefinedCircle
    )

    if (!circleIntersections) {
      return null
    }

    if (shouldLieOnElements === 'any') {
      return circleIntersections
    }

    const arcIntersections = []
    for (const intersection of circleIntersections) {
      const pointOnArcA = arcA.checkIfPointOnElement(intersection, MAX_NUM_ERROR)
      const pointOnArcB = arcB.checkIfPointOnElement(intersection, MAX_NUM_ERROR)

      if (
        (shouldLieOnElements === 'yes' && pointOnArcA && pointOnArcB) ||
        (shouldLieOnElements === 'no' && !pointOnArcA && !pointOnArcB)
      ) {
        arcIntersections.push(intersection)
      }
    }

    if (arcIntersections.length === 0) {
      return null
    }

    return arcIntersections
  }
  
  static getArcLineIntersections(
    arc: FullyDefinedArc, 
    line: FullyDefinedLine, 
    shouldLieOnElements: 'yes' | 'no' | 'any' = 'yes'
  ): Point[] | null {
    const circleLineIntersections = ElementIntersector.getCircleLineIntersections(
      arc as unknown as FullyDefinedCircle, 
      line,
      shouldLieOnElements
    )

    if (!circleLineIntersections) {
      return null
    }

    if (shouldLieOnElements === 'any') {
      return circleLineIntersections
    }

    const arcLineIntersections = []
    for (const intersection of circleLineIntersections) {
      const liesOnArc = arc.checkIfPointOnElement(intersection, MAX_NUM_ERROR)
      if (
        (shouldLieOnElements === 'yes' && liesOnArc) ||
        (shouldLieOnElements === 'no' && !liesOnArc)
      ) {
        arcLineIntersections.push(intersection)
      }
    }

    if (arcLineIntersections.length === 0) {
      return null
    }

    return arcLineIntersections
  }
  
  static getArcCircleIntersections(
    arc: FullyDefinedArc,
    circle: FullyDefinedCircle, 
    shouldLieOnElements: 'yes' | 'no' | 'any' = 'yes'
  ): Point[] | null {
    const circleCircleIntersections = ElementIntersector.getCircleCircleIntersections(
      arc as unknown as FullyDefinedCircle, 
      circle
    )

    if (!circleCircleIntersections) {
      return null
    }

    if (shouldLieOnElements === 'any') {
      return circleCircleIntersections
    }

    const arcCircleIntersections = []
    for (const intersection of circleCircleIntersections) {
      const liesOnArc = arc.checkIfPointOnElement(intersection, MAX_NUM_ERROR)
      if ((shouldLieOnElements === 'yes' && liesOnArc) ||
        (shouldLieOnElements === 'no' && !liesOnArc)) {
        arcCircleIntersections.push(intersection)
      }
    }

    if (arcCircleIntersections.length === 0) {
      return null
    }

    return arcCircleIntersections
  }
  
  static getCircleCircleIntersections(
    circleA: FullyDefinedCircle, 
    circleB: FullyDefinedCircle, 
    shouldLieOnElements: 'yes' | 'no' | 'any' = 'yes'
  ): Point[] | null {
    if (shouldLieOnElements === 'no') {
      return null
    }

    const centerDistance = getPointDistance(circleA.centerPoint, circleB.centerPoint)
    const radiusSum  = circleA.radius + circleB.radius
    const [smallerRadius, largerRadius] = 
        [circleA.radius, circleB.radius].sort((rA, rB) => rA > rB ? 1 : -1)

    if (
      centerDistance > radiusSum || 
      centerDistance < MAX_NUM_ERROR ||
      largerRadius - (centerDistance + smallerRadius) > MAX_NUM_ERROR
    ) {
      return null
    }

    const centerLine = createLine(
      circleA.centerPoint.x,
      circleA.centerPoint.y,
      circleB.centerPoint.x,
      circleB.centerPoint.y,
    )

    if (Math.abs(centerDistance - radiusSum) < MAX_NUM_ERROR) {
      centerLine.setLength(circleA.radius, false)
      return [centerLine.pointB!]
    }

    const d = centerDistance
    const R = circleA.radius
    const r = circleB.radius

    // x - distance along centerLine from center of circleA to point where if you take a perpendicular
    // to the centerLine, you would cross the intersection points
    // y - perpendicular distance from the centerLine to the intersections (y on both sides to get both intersections)  
    const x = (d ** 2 - r ** 2 + R ** 2) / (2 * d)
    const y = Math.sqrt((-d + r - R) * (-d - r + R) * (-d + r + R) * (d + r + R)) / (2 * d)

    centerLine.setLength(x, false)
    centerLine.setLength(y, true)
    const intersection1 = getRotatedPointAroundPivot(centerLine.pointA, centerLine.pointB!, 90)
    const intersection2 = getRotatedPointAroundPivot(centerLine.pointA, centerLine.pointB!, 270)
    
    return [intersection1, intersection2]
  }
  
  static getCircleLineIntersections(
    circle: FullyDefinedCircle, 
    line: FullyDefinedLine, 
    shouldLieOnElements: 'yes' | 'no' | 'any' = 'yes'
  ) {
    const perpPoint = getPerpendicularPointToLine(circle.centerPoint, line)
    const distanceToCenter = getPointDistance(circle.centerPoint, perpPoint) 
    if (distanceToCenter > (circle.radius + MAX_NUM_ERROR)) {
      return null
    }

    if (Math.abs(distanceToCenter - circle.radius) < MAX_NUM_ERROR) {
      const perpLiesOnLine = line.checkIfPointOnElement(perpPoint)

      if (
        shouldLieOnElements === 'any' ||
        (shouldLieOnElements === 'yes' && perpLiesOnLine) ||
        (shouldLieOnElements === 'no' && !perpLiesOnLine)
      ) {
        return [perpPoint]
      }

      return null
    }

    const lineFromCenter = createLine(
      circle.centerPoint.x,
      circle.centerPoint.y,
      perpPoint.x,
      perpPoint.y
    )

    // angle between perpendicular to line from center and line from center to intersection
    // to get intersections, we rotate lineFromCenter by theta on both sides to get both possible intersections
    const theta = radiansToDegrees(Math.acos(distanceToCenter / circle.radius))
    lineFromCenter.setLength(circle.radius, false)
    
    // these intersections assume line of infinite length
    const intersection1 = getRotatedPointAroundPivot(lineFromCenter.pointB!, circle.centerPoint, theta)
    const intersection2 = getRotatedPointAroundPivot(lineFromCenter.pointB!, circle.centerPoint, -theta)

    if (shouldLieOnElements === 'any') {
      return [intersection1, intersection2]
    }

    // check if intersections lie on finite-length line
    const finalIntersections = []
    let liesOnLine = line.checkIfPointOnElement(intersection1, MAX_NUM_ERROR)
    if (
      (shouldLieOnElements === 'yes' && liesOnLine) ||
      (shouldLieOnElements === 'no' && !liesOnLine)
    ) {
      finalIntersections.push(intersection1)
    }

    liesOnLine = line.checkIfPointOnElement(intersection2, MAX_NUM_ERROR)
    if (
      (shouldLieOnElements === 'yes' && liesOnLine) ||
      (shouldLieOnElements === 'no' && !liesOnLine)
    ) {
      finalIntersections.push(intersection2)
    }

    if (finalIntersections.length === 0) {
      return null
    }

    return finalIntersections
  }
  
  static getLineLineIntersections(
    lineA: FullyDefinedLine, 
    lineB: FullyDefinedLine, 
    shouldLieOnElements: 'yes' | 'no' | 'any' = 'yes'
  ): Point[] | null {
    const intersections = []
    if (
      getPointDistance(lineA.pointA, lineB.pointA) < MAX_NUM_ERROR || 
      getPointDistance(lineA.pointA, lineB.pointB) < MAX_NUM_ERROR
    ) {
      intersections.push(createPoint(lineA.pointA.x, lineA.pointA.y))
    }

    if (
      getPointDistance(lineA.pointB, lineB.pointA) < MAX_NUM_ERROR || 
      getPointDistance(lineA.pointB, lineB.pointB) < MAX_NUM_ERROR
    ) {
      if (intersections.length > 0) {
        // lines are identical
        return null
      }

      intersections.push(createPoint(lineA.pointA.x, lineA.pointA.y))
    }

    if (intersections.length > 0) {
      // lines have a common point
      return intersections
    }

    const { slope: m1, intercept: b1 } = lineA.equation
    const { slope: m2, intercept: b2 } = lineB.equation
    if (m1 === m2) {
      // lines are parallel
      return null
    }

    let intersection
    if (isNaN(m1)) {
      if (isNaN(m2)) {
        return null
      }
      
      // lineA is vertical
      intersection = createPoint(lineA.pointA.x, m2 * lineA.pointA.x + b2)
    } else if (isNaN(m2)) {
      // lineB is vertical
      intersection = createPoint(lineB.pointA.x, m1 * lineB.pointA.x + b1)
    } else {
      const x = (b2 - b1) / (m1 - m2)
      const y = m1 * x + b1

      intersection = createPoint(x, y)
    }

    if (shouldLieOnElements === 'any') {
      return [intersection]
    }

    const liesOnLineA = lineA.checkIfPointOnElement(intersection, MAX_NUM_ERROR)
    const liesOnLineB = lineB.checkIfPointOnElement(intersection, MAX_NUM_ERROR)
    if (
      (shouldLieOnElements === 'yes' && liesOnLineA && liesOnLineB) ||
      (shouldLieOnElements === 'no' && !liesOnLineA && !liesOnLineB)
    ) {
      return [intersection]
    }
        
    return null
  }
}