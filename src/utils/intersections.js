/* eslint-disable no-loop-func */
import ElementIntersector from './elementIntersector'
import { getPointDistance } from './point'

const findClosestIntersectPoint = (element, elementsToIntersect, fromStart) => {
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
            const distanceFromExtendPoint = getPointDistance(extendedPoint, intersection)
            if (distanceFromExtendPoint < minPointDistance) {
                minPoint = intersection
                minPointDistance = distanceFromExtendPoint
            }
        })
    }

    return minPoint
}

export {
    findClosestIntersectPoint
}