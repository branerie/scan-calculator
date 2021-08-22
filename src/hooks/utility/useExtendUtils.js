import ElementManipulator from '../../utils/elementManipulator'
import { pointsMatch } from '../../utils/point'

const useExtendUtils = () => {
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
        }
    }
    
    return {
        tryExtendElementEnd
    }
}

export default useExtendUtils