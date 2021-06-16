import { createElement, createLine } from './elementFactory'
import ElementIntersector from './elementIntersector'
import { getPointDistance, pointsMatch } from './point'
import PriorityQueue from './priorityQueue'
import { capitalize } from './text'


const updateTrimmedSections = (trimmedSections, newSection, isSectionTrimmed) => {
    const sectionType = isSectionTrimmed ? 'removed' : 'remaining'
    const sectionsOfType = trimmedSections[sectionType]

    if (sectionsOfType) {
        const lastSection = sectionsOfType[sectionsOfType.length - 1]
        if (pointsMatch(lastSection.end, newSection.start)) {
            sectionsOfType[sectionsOfType.length - 1].end = newSection.end
            return
        }

        sectionsOfType.push(newSection)
        return
    }

    trimmedSections[sectionType] = [newSection]
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

            let { point: trimSectionStartPoint, distanceFromStart: trimSectionDistance } = queue.pop()
            if (distanceFromStart < trimSectionDistance) {
                // if | designates start of line, || end of line and x - intersections with elements we are trimming by:
                // |----<trimmedSection>---x---x---...---||
                const remainingLine = createLine(trimSectionStartPoint.x, trimSectionStartPoint.y, endPoint.x, endPoint.y, { assignId: true })

                const removedLine = createLine(startPoint.x, startPoint.y, trimSectionStartPoint.x, trimSectionStartPoint.y)
                return { remaining: [remainingLine], removed: [removedLine] }
            }

            const nextValue = queue.peek()
            let trimSectionEndPoint = nextValue ? nextValue.point : endPoint
            while (queue.size > 0 && distanceFromStart > queue.peek().distanceFromStart) {
                trimSectionStartPoint = queue.pop().point
                const nextValue = queue.peek()

                trimSectionEndPoint = nextValue ? queue.peek().point : null
            }

            if (queue.size === 0) {
                // if | designates start of line, || end of line and x - intersections with elements we are trimming by:
                // |---x---x---...--x---<trimmedSection>--||
                const remainingLine = createLine(startPoint.x, startPoint.y, trimSectionStartPoint.x, trimSectionStartPoint.y, { assignId: true })

                const removedLine = createLine(trimSectionStartPoint.x, trimSectionStartPoint.y, endPoint.x, endPoint.y)
                return { remaining: [remainingLine], removed: [removedLine] }
            }

            // if | designates start of line, || end of line and x - intersections with elements we are trimming by:
            // |---x---x---<trimmedSection>---x---...--x---||
            // i.e. original line is split into two lines
            const firstLine = createLine(startPoint.x, startPoint.y, trimSectionStartPoint.x, trimSectionStartPoint.y, { assignId: true })
            const secondLine = createLine(trimSectionEndPoint.x, trimSectionEndPoint.y, endPoint.x, endPoint.y, { assignId: true })

            const removedLine = createLine(
                trimSectionStartPoint.x, 
                trimSectionStartPoint.y, 
                trimSectionEndPoint.x, 
                trimSectionEndPoint.y
            )

            return { remaining: [firstLine, secondLine], removed: [removedLine] }
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
        let sectionsPostTrim = {}
        while (queue.size >= 0) {
            const isStartInSelect = selectLeft <= sectionStartPoint.x && selectRight >= sectionStartPoint.x &&
                                    selectTop <= sectionStartPoint.y && selectBottom >= sectionStartPoint.y

            const isEndInSelect = selectLeft <= sectionEndPoint.x && selectRight >= sectionEndPoint.x &&
                                  selectTop <= sectionEndPoint.y && selectBottom >= sectionEndPoint.y

            let isSectionTrimmed = false
            if (isStartInSelect || isEndInSelect) {
                isSectionTrimmed = true
            } else {
                let isIntersectionInSection = true
                while (selectIntersections.length > 0 && isIntersectionInSection) {
                    const nextIntersection = selectIntersections[selectIntersections.length - 1]

                    if (
                        nextIntersection.distanceFromStart >= sectionStartDistance &&
                        nextIntersection.distanceFromStart <= sectionEndDistance
                    ) {
                        // an intersection of the element with the selection box occurs in this section
                        // therefore, it needs to be trimmed 
                        selectIntersections.pop()
                        isSectionTrimmed = true
                    } else {
                        isIntersectionInSection = false
                    }
                }
            }

            updateTrimmedSections(sectionsPostTrim, { start: sectionStartPoint, end: sectionEndPoint }, isSectionTrimmed)

            const nextSectionStart = queue.pop()
            if (!nextSectionStart) break
            
            // move to next section for next loop iteration
            sectionStartPoint = nextSectionStart.point
            sectionStartDistance = nextSectionStart.distanceFromStart

            const nextSectionEnd = queue.peek() || 
                                   { point: endPoint, distanceFromStart: getPointDistance(startPoint, endPoint) }
            sectionEndPoint = nextSectionEnd.point
            sectionEndDistance = nextSectionEnd.distanceFromStart
        }

        if (!sectionsPostTrim.remaining || !sectionsPostTrim.removed) return null

        const remaining = sectionsPostTrim.remaining.map(section => 
            createLine(section.start.x, section.start.y, section.end.x, section.end.y, { assignId: true })
        )

        const removed = sectionsPostTrim.removed.map(section => 
            createLine(section.start.x, section.start.y, section.end.x, section.end.y)
        )

        return { remaining, removed }
    }
}

export default ElementTrimmer