/* eslint-disable no-loop-func */
import ElementIntersector from '../../utils/elementIntersector'
import ElementManipulator from '../../utils/elementManipulator'
import { getDivContentsInLineDirection } from '../../utils/hashGrid/utils'
import { getPointDistance, pointsMatch } from '../../utils/point'

const useExtendUtils = (hashGrid) => {
    const tryExtendElementEnd = (element, tryFromStart) => {
        if (element.baseType === 'polyline') {
            if (element.isJoined) return null

            if (tryFromStart) {
                const firstElement = element.elements[0]
                const isInPolyDirection = pointsMatch(element.startPoint, firstElement.startPoint)

                const extendedSubElement = tryExtendElementEnd(firstElement, isInPolyDirection)
                if (!extendedSubElement) return null

                const elementCopy = ElementManipulator.copyElement(element)
                elementCopy.elements[0] = extendedSubElement
                return elementCopy
            }

            const lastElement = element.elements[element.elements.length - 1]
            const isInPolyDirection = pointsMatch(element.endPoint, lastElement.endPoint)

            const extendedSubElement = tryExtendElementEnd(lastElement, !isInPolyDirection)
            if (!extendedSubElement) return null

            const elementCopy = ElementManipulator.copyElement(element)
            elementCopy.elements[elementCopy.elements.length - 1] = extendedSubElement
            return elementCopy
        }

        if (element.baseType === 'line') {
            /*
                1. Get grid boxes line passes through, in order by distance from end
                2. Check for intersections, as if line passes through each of the grid boxes
                   and return first one that you meet (if any)..
            */
            const extendedPoint = tryFromStart ? element.startPoint : element.endPoint
            const boxElementsGen = getDivContentsInLineDirection(hashGrid, element, tryFromStart)
            const checkedElements = new Set()
            let minPointDistance = Number.MAX_VALUE
            let minPoint = null
            let nextElements = boxElementsGen.next()
            while (!nextElements.done) {
                const { value: elements } = nextElements

                if (!elements) {
                    nextElements = boxElementsGen.next()
                    continue    
                }

                elements.forEach(elementToExtendTo => {
                    if (checkedElements.has(elementToExtendTo.id)) return

                    const intersections = ElementIntersector.getIntersections(element, elementToExtendTo, true)

                    if (!intersections) {
                        checkedElements.add(elementToExtendTo.id)
                        return
                    }

                    intersections.forEach(intersection => {
                        const distanceFromExtendPoint = getPointDistance(extendedPoint, intersection)
                        if (distanceFromExtendPoint < minPointDistance) {
                            minPoint = intersection
                            minPointDistance = distanceFromExtendPoint
                        }
                    })
                })

                if (minPoint) break

                nextElements = boxElementsGen.next()
            }

            return minPoint
        }
    }

    return {
        tryExtendElementEnd
    }
}

export default useExtendUtils