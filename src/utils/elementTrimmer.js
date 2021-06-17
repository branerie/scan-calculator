import { getAngleBetweenPoints } from './angle'
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
        const distFunc = (point) => getPointDistance(startPoint, point)

        return getTrimSections(element, trimPoints, selectPoints, distFunc, element.startPoint, element.endPoint)
    }

    static trimArc(element, trimPoints, selectPoints) {
        const centerPoint = element.centerPoint
        const startAngle = element.startLine.angle
        const distFunc = (point) => {
            const lineAngle = getAngleBetweenPoints(centerPoint, point)

            if (lineAngle > startAngle) {
                return 360 - lineAngle + startAngle
            }

            return startAngle - lineAngle
        }

        return getTrimSections(element, trimPoints, selectPoints, distFunc, element.startPoint, element.endPoint)
    }

    static trimCircle(element, trimPoints, selectPoints) {
        if (trimPoints.length < 2) return null

        const newTrimPoints = [...trimPoints]
        const startPoint = newTrimPoints.pop()

        const centerPoint = element.centerPoint
        const startAngle = getAngleBetweenPoints(centerPoint, startPoint)
        const distFunc = (point) => {
            const lineAngle = getAngleBetweenPoints(centerPoint, point)

            if (lineAngle === startAngle) {
                // line must be to endPoint
                return 360
            }

            if (lineAngle > startAngle) {
                return 360 - lineAngle + startAngle
            }

            return startAngle - lineAngle
        }

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

    static trimPolyline(element, trimPoints, selectPoints) {
        for (const trimPoint of trimPoints) {
            
        }
    }
}

function getTrimSections(element, trimPoints, selectPoints, distFunc, startPoint, endPoint) {
    // const startPoint = element.startPoint
    // const endPoint = element.endPoint
    const queue = new PriorityQueue((a, b) => a.distanceFromStart < b.distanceFromStart)
    trimPoints.forEach((point, index) => {
        const distanceFromStart = distFunc(point)
        queue.push({ distanceFromStart, point })
    })

    if (selectPoints.length === 1) {
        const distanceFromStart = distFunc(selectPoints[0])

        let { point: trimSectionStartPoint, distanceFromStart: trimSectionDistance } = queue.pop()
        if (distanceFromStart < trimSectionDistance) {
            // if | designates start of line, || end of line and x - intersections with elements we are trimming by:
            // |----<trimmedSection>---x---x---...---||
            const remainingSection = createSubsection(element, trimSectionStartPoint, endPoint)
            const removedSection = createSubsection(element, startPoint, trimSectionStartPoint)
            return { remaining: [remainingSection], removed: [removedSection] }
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
            const remainingSubsection = createSubsection(element, startPoint, trimSectionStartPoint)
            const removedSubsection = createSubsection(element, trimSectionStartPoint, endPoint)
            return { remaining: [remainingSubsection], removed: [removedSubsection] }
        }

        // if | designates start of line, || end of line and x - intersections with elements we are trimming by:
        // |---x---x---<trimmedSection>---x---...--x---||
        // i.e. original line is split into two lines
        const firstSubsection = createSubsection(element, startPoint, trimSectionStartPoint)
        const secondSubsection = createSubsection(element, trimSectionEndPoint, endPoint)

        const removedSubsection = createSubsection(element, trimSectionStartPoint, trimSectionEndPoint)

        return { remaining: [firstSubsection, secondSubsection], removed: [removedSubsection] }
    }

    const selectRect = createElement('rectangle', selectPoints[0].x, selectPoints[0].y)
    selectRect.setLastAttribute(selectPoints[1].x, selectPoints[1].y)

    let selectIntersections = ElementIntersector.getIntersections(selectRect, element)                                             

    // we shouldn't trim anything
    if (!selectIntersections) return null

    // TODO: Is it worth moving to priority queue?
    selectIntersections = selectIntersections.map(si => 
        ({ point: si, distanceFromStart: distFunc(si) })
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
                                { point: endPoint, distanceFromStart: distFunc(endPoint) }
        sectionEndPoint = nextSectionEnd.point
        sectionEndDistance = nextSectionEnd.distanceFromStart
    }

    if (!sectionsPostTrim.remaining || !sectionsPostTrim.removed) return null

    const remaining = sectionsPostTrim.remaining.map(section => 
        createSubsection(element, section.start, section.end)
    )

    const removed = sectionsPostTrim.removed.map(section => 
        createSubsection(element, section.start, section.end)
    )

    return { remaining, removed }
}

function createSubsection(element, sectionStart, sectionEnd) {
    switch(element.baseType) {
        case 'line': {
            return createLine(sectionStart.x, sectionStart.y, sectionEnd.x, sectionEnd.y, { assignId: true })    
        }
        case 'arc':
        case 'circle': {
            const centerPoint = element.centerPoint
            const subsection = createElement('arc', centerPoint.x, centerPoint.y, { assignId: true })
            subsection.defineNextAttribute(sectionStart)
            subsection.setLastAttribute(sectionEnd.x, sectionEnd.y)
            return subsection
        }
        default:
            throw new Error('Invalid element baseType')
    }
}


export default ElementTrimmer