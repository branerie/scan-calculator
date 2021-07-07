import { getAngleBetweenPoints } from './angle'
import { pointsMatch } from './point'
import { capitalize } from './text'
import { 
    assemblePointDistancesAndSubsections, 
    createSubsection,
    fixJoinedSections,
    fixJoinedPointDistances,
    getDistFunc, 
    getTrimSections 
} from './trimUtils/trim'

class ElementTrimmer {
    static trimElement(element, trimPoints, selectPoints) {
        // TODO: Improve below logic
        if (element.baseType !== 'polyline') {
            trimPoints = trimPoints.filter(tp => element.getSelectionPoints('endPoint').every(ep => !pointsMatch(ep, tp)))
        }

        const capitalizedElementType = capitalize(element.baseType)
        const methodName = `trim${capitalizedElementType}`

        return ElementTrimmer[methodName](element, trimPoints, selectPoints)
    }

    static trimLine(element, trimPoints, selectPoints) {
        const startPoint = element.startPoint
        const distFunc = getDistFunc('line', { startPoint })

        return getTrimSections(element, trimPoints, selectPoints, distFunc, element.startPoint, element.endPoint)
    }

    static trimArc(element, trimPoints, selectPoints) {
        const centerPoint = element.centerPoint
        const startAngle = element.startLine.angle
        const distFunc = getDistFunc('arc', { centerPoint, startAngle })

        return getTrimSections(element, trimPoints, selectPoints, distFunc, element.startPoint, element.endPoint)
    }

    static trimCircle(element, trimPoints, selectPoints) {
        if (trimPoints.length < 2) return null

        const newTrimPoints = [...trimPoints]
        const startPoint = newTrimPoints.pop()

        const centerPoint = element.centerPoint
        const startAngle = getAngleBetweenPoints(centerPoint, startPoint)
        const distFunc = getDistFunc('circle', { centerPoint, startAngle })

        const trimSections = getTrimSections(element, newTrimPoints, selectPoints, distFunc, startPoint, startPoint)

        if (trimSections && trimSections.remaining.length > 1) {
            const firstRemaining = trimSections.remaining[0]
            const lastRemaining = trimSections.remaining[trimSections.remaining.length - 1]

            if (pointsMatch(firstRemaining.startPoint, lastRemaining.endPoint)) {
                trimSections.remaining = trimSections.remaining.slice(1, trimSections.length - 1)
                const joinedSection = createSubsection(element, lastRemaining.startPoint, firstRemaining.endPoint)
                trimSections.remaining.push(joinedSection)
            }
        }

        return trimSections
    }

    static trimPolyline(element, trimPointsByElement, selectPoints) {
        const { pointDistances, subsections } = assemblePointDistancesAndSubsections(element, trimPointsByElement, selectPoints)

        const distFunc = (point) => {
            const pointDistance = pointDistances[point.pointId]
            if (pointDistance && pointDistance !== 0) {
                return pointDistance
            }

            const selectPoint = pointDistances.select.find(s => pointsMatch(point, s.point))
            if (selectPoint) {
                return selectPoint.distanceFromStart
            }

            throw new Error('Could not find point distance. Could not find point on polyline')
        }

        let startPoint = null
        let endPoint = null
        
        const trimPoints = Object.values(trimPointsByElement).flat()
        if (element.isJoined) {
            fixJoinedSections(element, subsections)

            const lastTrimPoint = trimPoints[trimPoints.length - 1]
            endPoint = fixJoinedPointDistances(element, pointDistances, lastTrimPoint)
            startPoint = lastTrimPoint
            trimPoints.pop()
        } else {
            startPoint = element.startPoint
            endPoint = element.endPoint
        }

        const trimSections = getTrimSections(
            element,
            trimPoints,
            selectPoints,
            distFunc,
            startPoint,
            endPoint,
            subsections
        )

        return trimSections
    }
}

export default ElementTrimmer