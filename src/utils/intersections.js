/* eslint-disable no-loop-func */
import { MAX_NUM_ERROR } from './constants'
import ElementIntersector from './elementIntersector'
import { getPointDistance } from './point'

const findClosestIntersectPoint = ({
    element, 
    elementsToIntersect,
    fromStart,
    checkIntersectionLocality = null,
    excludeExistingIntersections = false
} = {}) => {
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

        intersections.forEach(intersection => {
            if (excludeExistingIntersections && element.checkIfPointOnElement(intersection, MAX_NUM_ERROR)) {
                return
            }

            if (checkIntersectionLocality && !checkIntersectionLocality(extendedPoint, intersection)) {
                // elements intersect, but not in the locality of "element"'s extendedPoint
                // i.e. there might be other intersections closer to this end
                return
            }

            // TODO: Check if intersection isn't in the opposite direction

            const distanceFromExtendPoint = getPointDistance(extendedPoint, intersection)
            if (distanceFromExtendPoint < minPointDistance) {
                minPoint = intersection
                minPointDistance = distanceFromExtendPoint
            }
        })
    }

    return minPoint
}

export { findClosestIntersectPoint }