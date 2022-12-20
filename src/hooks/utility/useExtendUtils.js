/* eslint-disable no-loop-func */
import { useAppContext } from '../../contexts/AppContext'
import { createElement, createPoint } from '../../utils/elementFactory'
import { pointsMatch } from '../../utils/point'

const useExtendUtils = () => {
    const {
        elements: { getNextArcIntersection, getNextLineIntersection }
    } = useAppContext()

    const validateExtendedElement = element => {
        if (element.type === 'arc') {
            if (pointsMatch(element.startPoint, element.endPoint)) {
                // Introduce a prompt to ask user whether to join arc into a circle

                const centerPoint = element.centerPoint
                const replacingCircle = createElement('circle', createPoint(centerPoint.x, centerPoint.y))
                replacingCircle.radius = element.radius
                replacingCircle.id = element.id

                return replacingCircle
            }
        }

        return element
    }

    const tryExtendElementEnd = (element, tryFromStart) => {
        if (element.type === 'circle') return null

        if (element.baseType === 'polyline') {
            if (element.isJoined) return null

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
        }

        if (element.baseType === 'line') {
            const extendPoint = getNextLineIntersection(element, {
                shouldExtendFromStart: tryFromStart,
                shouldCheckPointsLocality: false
            })

            return extendPoint
        }

        if (element.type === 'arc') {
            const extendPoint = getNextArcIntersection(element, {
                shouldExtendFromStart: tryFromStart,
                shouldCheckPointsLocality: false
            })

            return extendPoint
        }
    }

    return {
        tryExtendElementEnd,
        validateExtendedElement
    }
}

export default useExtendUtils
