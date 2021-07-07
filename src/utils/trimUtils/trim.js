import { getAngleBetweenPoints } from '../angle'
import { MAX_NUM_ERROR } from '../constants'
import { createElement, createLine, createPoint } from '../elementFactory'
import ElementIntersector from '../elementIntersector'
import { getPointDistance, pointsMatch } from '../point'
import PriorityQueue from '../priorityQueue'
import { 
    getSectionKey, 
    getSectionKeyStart, 
    getSelectionPointDistances, 
    getSubsectionElements, 
    splitIntoRemainingRemovedSections, 
    trimSubsectionElements
} from './trimHelper'

const trimWithSingleClick = (
    element, 
    selectPoints, 
    distFunc, 
    startPoint, 
    endPoint, 
    subsections, 
    trimPointsQueue
) => {
    const selectPointDistanceFromStart = distFunc(selectPoints[0])

    let { point: trimSectionStartPoint, distanceFromStart: trimSectionDistance } = trimPointsQueue.pop()
    if (selectPointDistanceFromStart < trimSectionDistance) {
        // if | designates start of element, || end of element and x - intersections with elements we are trimming by:
        // |----<trimmedSection>---x---x---...---||
        const remainingSection = createSubsection(element, trimSectionStartPoint, endPoint, subsections)
        const removedSection = createSubsection(element, startPoint, trimSectionStartPoint, subsections)
        return { remaining: [remainingSection], removed: [removedSection] }
    }

    const nextValue = trimPointsQueue.peek()
    let trimSectionEndPoint = nextValue ? nextValue.point : endPoint
    while (trimPointsQueue.size > 0 && selectPointDistanceFromStart > trimPointsQueue.peek().distanceFromStart) {
        trimSectionStartPoint = trimPointsQueue.pop().point
        const nextValue = trimPointsQueue.peek()

        trimSectionEndPoint = nextValue ? trimPointsQueue.peek().point : null
    }

    if (trimPointsQueue.size === 0) {
        // if | designates start of element, || end of element and x - intersections with elements we are trimming by:
        // |---x---x---...--x---<trimmedSection>--||
        const remainingSubsection = createSubsection(element, startPoint, trimSectionStartPoint, subsections)
        const removedSubsection = createSubsection(element, trimSectionStartPoint, endPoint, subsections)
        return { remaining: [remainingSubsection], removed: [removedSubsection] }
    }

    // if | designates start of element, || end of element and x - intersections with elements we are trimming by:
    // |---x---x---<trimmedSection>---x---...--x---||
    // i.e. original element is split into two elements
    const firstSubsection = createSubsection(element, startPoint, trimSectionStartPoint, subsections)
    const secondSubsection = createSubsection(element, trimSectionEndPoint, endPoint, subsections)

    const removedSubsection = createSubsection(element, trimSectionStartPoint, trimSectionEndPoint, subsections)

    return { remaining: [firstSubsection, secondSubsection], removed: [removedSubsection] }
}

const trimWithSelectBox = (
    element, 
    selectPoints, 
    distFunc, 
    startPoint, 
    endPoint, 
    subsections, 
    trimPointsQueue
) => {
    const selectRect = createElement('rectangle', selectPoints[0].x, selectPoints[0].y)
    selectRect.setLastAttribute(selectPoints[1].x, selectPoints[1].y)

    let selectIntersections = ElementIntersector.getIntersections(selectRect, element)

    // we shouldn't trim anything
    if (!selectIntersections) return null

    // TODO: Is it worth moving to priority queue?
    selectIntersections = selectIntersections.map(si =>
        ({ point: si, distanceFromStart: distFunc(si) })
    ).sort((a, b) => a.distanceFromStart < b.distanceFromStart ? 1 : -1)

    let sectionStartPoint = startPoint
    let sectionStartDistance = 0
    let { point: sectionEndPoint, distanceFromStart: sectionEndDistance } = trimPointsQueue.peek()
    const sectionsPostTrim = splitIntoRemainingRemovedSections(
        sectionStartPoint,
        sectionEndPoint,
        sectionStartDistance,
        sectionEndDistance,
        selectIntersections,
        selectRect,
        trimPointsQueue,
        distFunc,
        endPoint
    )

    if (!sectionsPostTrim.remaining || !sectionsPostTrim.removed) return null

    const remaining = sectionsPostTrim.remaining.map(section =>
        createSubsection(element, section.start, section.end, subsections)
    )

    const removed = sectionsPostTrim.removed.map(section =>
        createSubsection(element, section.start, section.end, subsections)
    )

    return { remaining, removed }
}

const createSubsection = (element, sectionStart, sectionEnd, subsections) => {
    switch (element.baseType) {
        case 'line': {
            return createLine(sectionStart.x, sectionStart.y, sectionEnd.x, sectionEnd.y, { assignId: true })
        }
        case 'arc':
            const startPoint = element.startPoint
            const endPoint = element.endPoint

            if (pointsMatch(startPoint, sectionEnd) || pointsMatch(endPoint, sectionStart)) {
                const temp = sectionStart
                sectionStart = sectionEnd
                sectionEnd = temp
            }
        // eslint-disable-next-line no-fallthrough
        case 'circle': {
            const centerPoint = element.centerPoint
            const subsection = createElement('arc', centerPoint.x, centerPoint.y, { assignId: true })
            subsection.defineNextAttribute(sectionStart)
            subsection.setLastAttribute(sectionEnd.x, sectionEnd.y)
            return subsection
        }
        case 'polyline': {
            const subsectionElements = getSubsectionElements(sectionStart, sectionEnd, subsections)
            const subElements = trimSubsectionElements(subsectionElements, sectionStart, sectionEnd)

            const newSubsection = createElement('polyline', sectionStart.x, sectionStart.y, { assignId: true })
            newSubsection.elements = subElements

            if (!subsectionElements[0].isInPolylineDirection) {
                newSubsection.startPoint = newSubsection.elements[0].endPoint
            }

            if (!subsectionElements[subsectionElements.length - 1].isInPolylineDirection) {
                newSubsection.endPoint = newSubsection[newSubsection.elements.length - 1].startPoint
            }

            return newSubsection
        }
        default:
            throw new Error('Invalid element baseType')
    }
}

const updateLastTrimSectionEnd = (currentSectionElements, sectionEnd, currentSubElement) => {
    const lastSectionElement = currentSectionElements.length > 0 
                                    ? currentSectionElements[currentSectionElements.length - 1] 
                                    : null
    if (
        lastSectionElement && 
        lastSectionElement.trimStart && 
        currentSubElement.id === lastSectionElement.element.id
    ) {
        // section start is a previous trim point, so last section's end must be set to current trimPoint
        // as it will be unset currently
        lastSectionElement.trimEnd = sectionEnd
        return true
    }

    return false
}

const assemblePointDistancesAndSubsections = (element, trimPoints, selectPoints) => {
    let pointDistances = { select: [] }
    const subsections = {}
    let currentSectionElements = []
    let sectionStartPoint = element.startPoint
    let distanceFromStart = 0

    let lastEndPoint = element.startPoint
    
    for (const subElement of element.elements) {
        const isInPolylineDirection = pointsMatch(subElement.startPoint, lastEndPoint)
        const subElementEndPoint = isInPolylineDirection ? subElement.endPoint : subElement.startPoint

        let subElementDistFunc = subElement.baseType === 'line'
            ? getDistFunc('line', { startPoint: lastEndPoint })
            : getDistFunc('arc', {
                centerPoint: subElement.centerPoint, startAngle: isInPolylineDirection
                    ? subElement.startLine.angle
                    : subElement.endLine.angle
            })

        const sortedSubElementTrimPoints = (trimPoints[subElement.id] || []).sort((a, b) => subElementDistFunc(a) < subElementDistFunc(b) ? -1 : 1)
        const subElementStartPoint = isInPolylineDirection ? subElement.startPoint : subElement.endPoint
        let hasMatchedStart = false
        for (const trimPoint of sortedSubElementTrimPoints) {
            const subElementDistance = subElementDistFunc(trimPoint)
            pointDistances[trimPoint.pointId] = subElementDistance + distanceFromStart

            const matchesStart = pointsMatch(trimPoint, subElementStartPoint)
            const matchesEnd = pointsMatch(trimPoint, subElementEndPoint)

            if (matchesStart) {
                if (sortedSubElementTrimPoints.length === 1) {
                    currentSectionElements.push({ element: subElement, isInPolylineDirection })
                } else {
                    hasMatchedStart = true
                }
            } else if (matchesEnd) {
                if ((hasMatchedStart && sortedSubElementTrimPoints.length === 2) || sortedSubElementTrimPoints.length === 1) {
                    currentSectionElements.push({ element: subElement, isInPolylineDirection })
                } else {
                    updateLastTrimSectionEnd(currentSectionElements, trimPoint, subElement)
                }

                subsections[getSectionKey(sectionStartPoint, trimPoint)] = currentSectionElements
                currentSectionElements = []
            } else {
                const isLastSectionUpdated = updateLastTrimSectionEnd(currentSectionElements, trimPoint, subElement)
                if (!isLastSectionUpdated) {
                    currentSectionElements.push({ element: subElement, isInPolylineDirection, trimStart: subElementStartPoint, trimEnd: trimPoint })
                }
                
                subsections[getSectionKey(sectionStartPoint, trimPoint)] = currentSectionElements
                currentSectionElements = [{ element: subElement, isInPolylineDirection, trimStart: trimPoint }]
            }

            sectionStartPoint = trimPoint
        }
        
        if (sortedSubElementTrimPoints.length === 0) {
            currentSectionElements.push({ element: subElement, isInPolylineDirection })
        } else {
            updateLastTrimSectionEnd(currentSectionElements, subElementEndPoint, subElement)
        }

        const selectPointDistances = getSelectionPointDistances(subElement, selectPoints, subElementDistFunc, distanceFromStart)
        pointDistances.select = pointDistances.select.concat(selectPointDistances)

        distanceFromStart = distanceFromStart + subElementDistFunc(subElementEndPoint)
        
        pointDistances[subElementEndPoint.pointId] = distanceFromStart

        lastEndPoint = subElementEndPoint
    }

    const sectionEndPoint = element.endPoint
    subsections[getSectionKey(sectionStartPoint, sectionEndPoint)] = currentSectionElements
    
    // distanceFromStart for polyline endPoint is the same as the distanceFromStart for the endPoint of the
    // last element. However, we still need to add the polyline endPoint's pointId to the pointDistances to
    // make things further down work
    pointDistances[sectionEndPoint.pointId] = distanceFromStart

    return { pointDistances, subsections }
}

const getDistFunc = (elementType, elementParams) => {
    switch (elementType) {
        case 'line': {
            const { startPoint } = elementParams
            return (point) => getPointDistance(startPoint, point)
        }
        case 'arc':
        case 'circle': {
            const { centerPoint, startAngle } = elementParams
            return (point) => {
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
        }
        default:
            throw new Error('Invalid elementType parameter')
    }
}

const getTrimSections = (
    element, 
    trimPoints, 
    selectPoints, 
    distFunc, 
    startPoint, 
    endPoint, 
    subsections = null
) => {
    const trimPointDistanceQueue = new PriorityQueue((a, b) => a.distanceFromStart < b.distanceFromStart)
    let lastDistance = 0
    trimPoints.forEach((point, index) => {
        const distanceFromStart = distFunc(point)

        if (Math.abs(lastDistance - distanceFromStart) > MAX_NUM_ERROR) {
            trimPointDistanceQueue.push({ distanceFromStart, point })
        }

        lastDistance = distanceFromStart
    })

    if (selectPoints.length === 1) {
        return trimWithSingleClick(element, selectPoints, distFunc, startPoint, endPoint, subsections, trimPointDistanceQueue)
    }

    return trimWithSelectBox(element, selectPoints, distFunc, startPoint, endPoint, subsections, trimPointDistanceQueue)
}

const fixJoinedSections = (element, subsections) => {
    const startKey = getSectionKeyStart(element.startPoint)

    const subsectionKeys = Object.keys(subsections)

    const firstSubsectionKey = subsectionKeys.find(sk => sk.startsWith(startKey))
    const firstSubsection = subsections[firstSubsectionKey]

    const lastSubsectionKey = subsectionKeys.find(sk => sk.endsWith(startKey))
    const lastSubsection = subsections[lastSubsectionKey]


    delete subsections[firstSubsectionKey]
    delete subsections[lastSubsectionKey]

    const newStartKey = lastSubsectionKey.split(';')[0]
    const newEndKey = firstSubsectionKey.split(';')[1]

    const joinedKey = `${newStartKey};${newEndKey}`
    subsections[joinedKey] = lastSubsection.concat(firstSubsection)
}

const fixJoinedPointDistances = (element, pointDistances, lastTrimPoint) => {
    delete pointDistances[element.startPoint.pointId]

    const oldEndPointDistance = pointDistances[element.endPoint.pointId]
    delete pointDistances[element.endPoint.pointId]

    const lastSubElement = element.elements[element.elements.length - 1]
    // get lastSubElement.startPoint in case subElement is in reverse direction to the polyline
    const lastSubElementEndPoint = pointsMatch(element.startPoint, lastSubElement.endPoint)
                                        ? lastSubElement.endPoint
                                        : lastSubElement.startPoint

    delete pointDistances[lastSubElementEndPoint.pointId]

    const lastTrimPointId = lastTrimPoint.pointId
    const lastTrimPointDistance = pointDistances[lastTrimPointId]

    const distanceShift = oldEndPointDistance - lastTrimPointDistance
    
    for (const pointKey of Object.keys(pointDistances)) {
        if (pointKey === 'select') continue

        const pointDistance = pointDistances[pointKey]
        if (pointDistance < lastTrimPointDistance) {
            pointDistances[pointKey] += distanceShift
        } else {
            pointDistances[pointKey] = pointDistance - lastTrimPointDistance
        }
    }

    for (let selectIndex = 0; selectIndex < pointDistances.select.length; selectIndex++) {
        const { distanceFromStart } = pointDistances.select[selectIndex]

        if (distanceFromStart < lastTrimPointDistance) {
            pointDistances.select[selectIndex].distanceFromStart += distanceShift
        } else {
            pointDistances.select[selectIndex].distanceFromStart = distanceFromStart - lastTrimPointDistance
        }
    }

    delete pointDistances[lastTrimPointId]

    const newEndPoint = createPoint(lastTrimPoint.x, lastTrimPoint.y)
    pointDistances[newEndPoint.pointId] = oldEndPointDistance

    return newEndPoint
}

export {
    fixJoinedSections,
    fixJoinedPointDistances,
    assemblePointDistancesAndSubsections,
    getTrimSections,
    getDistFunc,
    createSubsection
}