import Arc, { FullyDefinedArc } from '../../drawingElements/arc'
import Circle from '../../drawingElements/circle'
import { FullyDefinedElement } from '../../drawingElements/element'
import Line, { FullyDefinedLine } from '../../drawingElements/line'
import Point from '../../drawingElements/point'
import Polyline from '../../drawingElements/polyline'
import { createElementFromName, createPoint } from '../../utils/elementFactory'
import { pointsMatch } from '../../utils/point'
import useIntersections from '../useIntersections'

const useExtendUtils = () => {
  const {
    getNextLineIntersection,
    getNextArcIntersection
  } = useIntersections()

  const validateExtendedElement = (element: FullyDefinedElement): FullyDefinedElement => {
    if (element instanceof Arc) {
      if (pointsMatch(element.startPoint, element.endPoint)) {
        // TODO: Introduce a prompt to ask user whether to join arc into a circle

        const centerPoint = element.centerPoint
        const replacingCircle = createElementFromName('circle', createPoint(centerPoint.x, centerPoint.y)) as Circle
        replacingCircle.radius = element.radius
        replacingCircle.id = element.id

        return replacingCircle as FullyDefinedElement
      }
    }

    return element
  }

  const tryExtendElementEnd = (element: FullyDefinedElement, tryFromStart: boolean): Point | null => {
    if (element.type === 'circle') {
      return null
    }

    if (element instanceof Polyline) {
      if (element.isJoined) {
        return null
      }

      if (tryFromStart) {
        const firstElement = element.elements[0]
        const isInPolyDirection = pointsMatch(element.startPoint, firstElement.startPoint)

        const extendPoint = tryExtendElementEnd(firstElement, isInPolyDirection)
        return extendPoint
      }

      const lastElement = element.elements[element.elements.length - 1]
      const isInPolyDirection = pointsMatch(element.endPoint, lastElement.endPoint)

      const extendPoint = tryExtendElementEnd(lastElement, !isInPolyDirection)
      return extendPoint
    } else if (element instanceof Line) {
      const extendPoint = getNextLineIntersection(element as FullyDefinedLine, {
        shouldExtendFromStart: tryFromStart,
        shouldCheckPointsLocality: false
      })

      return extendPoint
    } else if (element instanceof Arc) {
      const extendPoint = getNextArcIntersection(element as FullyDefinedArc, {
        shouldExtendFromStart: tryFromStart,
        shouldCheckPointsLocality: false
      })

      return extendPoint
    } else {
      throw new Error(`Elements of type ${element.type} is not supported`)
    }
  }

  return {
    tryExtendElementEnd,
    validateExtendedElement
  }
}

export default useExtendUtils
