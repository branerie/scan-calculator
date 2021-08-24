/* eslint-disable no-loop-func */
import { useElementsContext } from '../../contexts/ElementsContext'
import { pointsMatch } from '../../utils/point'

const useExtendUtils = () => {
    const {
        elements: {
            getNextLineIntersection
        }
    } = useElementsContext()

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
            const extendPoint = getNextLineIntersection(element, tryFromStart)
            return extendPoint
        }

        // TODO: arc
    }

    return {
        tryExtendElementEnd
    }
}

export default useExtendUtils