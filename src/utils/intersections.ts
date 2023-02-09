/* eslint-disable no-loop-func */
import Arc, { FullyDefinedArc } from '../drawingElements/arc'
import { FullyDefinedElement } from '../drawingElements/element'
import Point from '../drawingElements/point'
import { getPointsAngleDistance } from './arc'
import { MAX_NUM_ERROR } from './constants'
import ElementIntersector from './elementIntersector'
import { getPointDistance, pointsMatch } from './point'

const checkArcIntersectionValidity = (
  arc: FullyDefinedArc, 
  extendFromStart: boolean, 
  intersectionDistance: number
) => {
  let arcExtendPoint: Point, 
      arcStationaryPoint: Point
  if (extendFromStart) {
    arcExtendPoint = arc.startPoint
    arcStationaryPoint = arc.endPoint
  } else {
    arcExtendPoint = arc.endPoint
    arcStationaryPoint = arc.startPoint
  }

  const arcPointsOppositeDirectionDistance = getPointsAngleDistance(
    arc.centerPoint,
    extendFromStart,
    arcExtendPoint,
    arcStationaryPoint
  )

  return intersectionDistance <= arcPointsOppositeDirectionDistance
}

const findClosestIntersectPoint = (
  element: FullyDefinedElement,
  elementsToIntersect: FullyDefinedElement[],
  options: {
    fromStart: boolean,
    checkIntersectionLocality: ((pointA: Point, pointB: Point) => boolean) | null,
    excludeExistingIntersections: boolean
  } = {
    fromStart: false,
    checkIntersectionLocality: null,
    excludeExistingIntersections: false
  }
) => {
  const {
    fromStart, 
    checkIntersectionLocality,
    excludeExistingIntersections
  } = options

  const extendedPoint = fromStart ? element.startPoint : element.endPoint

  let minPoint = null
  let minPointDistance = Number.MAX_VALUE
  for (const elementToIntersect of elementsToIntersect) {
    // if (checkedElements.has(elementToExtendTo.id)) return

    const intersections = ElementIntersector.getIntersections(element, elementToIntersect, 'any')
    if (!intersections) {
      // checkedElements.add(elementToExtendTo.id)
      continue
    }

    for (const intersection of intersections) {
      if (!elementToIntersect.checkIfPointOnElement(intersection, MAX_NUM_ERROR)) {
        continue
      }

      if (excludeExistingIntersections && element.checkIfPointOnElement(intersection, MAX_NUM_ERROR)) {
        if (element.type !== 'arc') {
          continue
        }

        const stationaryPoint = fromStart ? element.endPoint : element.startPoint
        if (!pointsMatch(intersection, stationaryPoint)) {
          continue
        }
      }

      if (checkIntersectionLocality && !checkIntersectionLocality(extendedPoint, intersection)) {
        // elements intersect, but not in the locality of "element"'s extendedPoint
        // i.e. there might be other intersections closer to this end
        continue
      }

      // TODO: Check whether intersection in the opposite direction causes bugs at all

      let getIntersectionDistance
      if (element.type === 'line') {
        getIntersectionDistance = getPointDistance
      } else if (element instanceof Arc) {
        getIntersectionDistance = (extendPoint: Point, intersectionPoint: Point) => {
          return getPointsAngleDistance(
            element.centerPoint,
            fromStart,
            extendPoint,
            intersectionPoint
          )
        }
      } else {
        throw new Error('Only elements of type "line" and "arc" can be extended')
      }

      const distanceFromExtendPoint = getIntersectionDistance(extendedPoint, intersection)
      if (distanceFromExtendPoint < minPointDistance) {
        if (
          element instanceof Arc && 
          !checkArcIntersectionValidity(element as FullyDefinedArc, fromStart, distanceFromExtendPoint)
        ) {
          continue
        }

        minPoint = intersection
        minPointDistance = distanceFromExtendPoint
      }
    }
  }

  return minPoint
}

export { findClosestIntersectPoint }
