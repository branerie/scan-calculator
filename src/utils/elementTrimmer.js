import { createElement } from './elementFactory'
import ElementIntersector from './elementIntersector'
import ElementManipulator from './elementManipulator'
import { getPointDistance } from './point'
import PriorityQueue from './priorityQueue'
import { capitalize } from './text'

/*
const endPoints = elementToTrim.getSelectionPoints('endPoint')

const copiedElement = ElementManipulator.copyElement(elementToTrim)
for (const pointOfTrim of pointsOfTrim) {
    let nearestEndPoint = null
    let nearestPointDistance = Number.POSITIVE_INFINITY

    for (const endPoint of endPoints) {
        const pointDistance = getPointDistance(pointOfTrim, endPoint)

        if (pointDistance < nearestPointDistance) {
            nearestEndPoint = endPoint
            nearestPointDistance = pointDistance
        }
    }
    
    copiedElement.setPointById(nearestEndPoint.pointId, pointOfTrim.x, pointOfTrim.y)
} 
*/
const updateTrimmedSections = (trimmedSections, newSection) => {
    if (trimmedSections.length > 0) {
        const lastSection = trimmedSections[trimmedSections.length - 1]

        if (lastSection.end.x === newSection.start.x && lastSection.end.y === newSection.start.y) {
            const newTrimmedSections = [...trimmedSections]
            newTrimmedSections[newTrimmedSections.length - 1].end = newSection.end
            return newTrimmedSections
        }
    }

    return [...trimmedSections, newSection]
}

class ElementTrimmer {
    static trimElement(element, trimPoints, selectPoints) {
        const capitalizedElementType = capitalize(element.baseType)
        const methodName = `trim${capitalizedElementType}`

        return ElementTrimmer[methodName](element, trimPoints, selectPoints)
    }

    static trimLine(element, trimPoints, selectPoints) {
        const startPoint = element.startPoint
        const endPoint = element.endPoint
        const queue = new PriorityQueue((a, b) => a.distanceFromStart < b.distanceFromStart)
        trimPoints.forEach((point, index) => {
            const distanceFromStart = getPointDistance(startPoint, point)
            queue.push({ distanceFromStart, point })
        })

        if (selectPoints.length === 1) {
            const distanceFromStart = getPointDistance(startPoint, selectPoints[0])

            let { point: trimSectionStartPoint } = queue.pop()
            if (distanceFromStart < trimSectionStartPoint) {
                // if | designate start and end of line and x - intersections with elements we are trimming by:
                // |----<trimmedSection>---x---x---...---||
                const trimmedLine = ElementManipulator.copyElement(element, false)
                trimmedLine.setPointA(trimSectionStartPoint.x, trimSectionStartPoint.y)
                return [trimmedLine]
            }

            let trimSectionEndPoint
            while (queue.size > 0 && distanceFromStart > queue.peek().distanceFromStart) {
                trimSectionStartPoint = queue.pop()
                trimSectionEndPoint = queue.peek()
            }

            if (queue.size === 0) {
                // if | designates start of line, || end of line and x - intersections with elements we are trimming by:
                // |---x---x---...--x---<trimmedSection>--||
                const trimmedLine = ElementManipulator.copyElement(element, false)
                trimmedLine.setPointB(trimSectionStartPoint.x, trimSectionStartPoint.y)
                return [trimmedLine]
            }

            // if | designates start of line, || end of line and x - intersections with elements we are trimming by:
            // |---x---x---<trimmedSection>---x---...--x---||
            // i.e. original line is split into two lines
            const firstLine = ElementManipulator.copyElement(element, false)
            const secondLine = ElementManipulator.copyElement(element, false)

            firstLine.setPointB(trimSectionStartPoint.x, trimSectionStartPoint.y)
            secondLine.setPointA(trimSectionEndPoint.x, trimSectionEndPoint.y)

            return [firstLine, secondLine]
        }

        const selectRect = createElement('rectangle', selectPoints[0].x, selectPoints[0].y)
        selectRect.setLastAttribute(selectPoints[1].x, selectPoints[1].y)

        let selectIntersections = ElementIntersector.getIntersections(selectRect, element)                                             

        // we shouldn't trim anything
        if (!selectIntersections) return null

        // TODO: Is it worth moving to priority queue?
        selectIntersections = selectIntersections.map(si => 
            ({ point: si, distanceFromStart: getPointDistance(startPoint, si) })
        ).sort((a, b) => a.distanceFromStart > b.distanceFromStart)

        const { 
            left: selectLeft, 
            right: selectRight, 
            top: selectTop, 
            bottom: selectBottom
        } = selectRect.getBoundingBox()


        let sectionStartPoint = startPoint
        let sectionStartDistance = 0
        let { point: sectionEndPoint, distanceFromStart: sectionEndDistance } = queue.peek()
        let sectionsPostTrim = []
        while (queue.size >= 0) {
            const isStartInSelect = selectLeft <= sectionStartPoint.x && selectRight >= sectionStartPoint.x &&
                                    selectTop <= sectionStartPoint.y && selectBottom >= sectionStartPoint.y

            const isEndInSelect = selectLeft <= sectionEndPoint.x && selectRight >= sectionEndPoint.x &&
                                  selectTop <= sectionEndPoint.y && selectBottom >= sectionEndPoint.y

            if (isStartInSelect || isEndInSelect) {
                sectionsPostTrim = updateTrimmedSections(sectionsPostTrim, { start: sectionStartPoint, end: sectionEndPoint })
                continue
            }

            if (selectIntersections.length > 0) {
                const nextIntersection = selectIntersections[selectIntersections.length - 1]

                if (
                    nextIntersection.distanceFromStart >= sectionStartDistance &&
                    nextIntersection.distanceFromStart <= sectionEndDistance
                ) {
                    selectIntersections.pop()
                    sectionsPostTrim = updateTrimmedSections(
                        sectionsPostTrim, 
                        { start: sectionStartPoint, end: sectionEndPoint }
                    )
                }
            }

            const nextSectionStart = queue.pop()
            sectionStartPoint = nextSectionStart.point
            sectionStartDistance = nextSectionStart.distanceFromStart

            const nextSectionEnd = queue.peek() || 
                                   { point: endPoint, distanceFromStart: getPointDistance(startPoint, endPoint) }
            sectionEndPoint = nextSectionEnd.point
            sectionEndDistance = nextSectionEnd.distanceFromStart
        }
    }
}

export default ElementTrimmer