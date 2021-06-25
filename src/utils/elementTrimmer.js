import { getAngleBetweenPoints } from './angle'
import { SELECT_DELTA } from './constants'
import { createElement, createLine, createPoint } from './elementFactory'
import ElementIntersector from './elementIntersector'
import ElementManipulator from './elementManipulator'
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

        if (pointsMatch(lastSection.end, newSection.end)) {
            sectionsOfType[sectionsOfType.length - 1].end = newSection.start
        }

        sectionsOfType.push(newSection)
        return
    }

    trimmedSections[sectionType] = [newSection]
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

    static trimPolyline(element, trimPoints, selectPoints) {
        const { pointDistances, subsections } = assemblePointDistancesAndSubsections(element, trimPoints, selectPoints)

        const distFunc = (point) => {
            const pointDistance = pointDistances[point.pointId]
            if (pointDistance) {
                return pointDistance
            }

            const selectPoint = pointDistances.select.find(s => pointsMatch(point, s.point))
            if (selectPoint) {
                return selectPoint.distanceFromStart
            }

            throw new Error('Could not find point distance. Could not find point on polyline')
        }

        // const subsectionElements = formSubsectionElements(element, pointDistances, distFunc)

        const trimSections = getTrimSections(
            element,
            Object.values(trimPoints).flat(),
            selectPoints,
            distFunc,
            element.startPoint,
            element.endPoint,
            subsections
        )

        if (trimSections && element.isJoined) {
            fixJoinedSections(element, trimSections)
        }

        return trimSections
    }
}

function getTrimSections(element, trimPoints, selectPoints, distFunc, startPoint, endPoint, subsections = null) {
    // const startPoint = element.startPoint
    // const endPoint = element.endPoint
    const queue = new PriorityQueue((a, b) => a.distanceFromStart < b.distanceFromStart)
    trimPoints.forEach((point, index) => {
        const distanceFromStart = distFunc(point)
        queue.push({ distanceFromStart, point })
    })

    if (selectPoints.length === 1) {
        return trimWithSingleClick(element, selectPoints, distFunc, startPoint, endPoint, subsections, queue)
    }

    return trimWithSelectBox(element, selectPoints, distFunc, startPoint, endPoint, subsections, queue)
}

function trimWithSingleClick(element, selectPoints, distFunc, startPoint, endPoint, subsections, trimPointsQueue) {
    const distanceFromStart = distFunc(selectPoints[0])

    let { point: trimSectionStartPoint, distanceFromStart: trimSectionDistance } = trimPointsQueue.pop()
    if (distanceFromStart < trimSectionDistance) {
        // if | designates start of element, || end of element and x - intersections with elements we are trimming by:
        // |----<trimmedSection>---x---x---...---||
        const remainingSection = createSubsection(element, trimSectionStartPoint, endPoint, subsections)
        const removedSection = createSubsection(element, startPoint, trimSectionStartPoint, subsections)
        return { remaining: [remainingSection], removed: [removedSection] }
    }

    const nextValue = trimPointsQueue.peek()
    let trimSectionEndPoint = nextValue ? nextValue.point : endPoint
    while (trimPointsQueue.size > 0 && distanceFromStart > trimPointsQueue.peek().distanceFromStart) {
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

function trimWithSelectBox(element, selectPoints, distFunc, startPoint, endPoint, subsections, trimPointsQueue) {
    const selectRect = createElement('rectangle', selectPoints[0].x, selectPoints[0].y)
    selectRect.setLastAttribute(selectPoints[1].x, selectPoints[1].y)

    let selectIntersections = ElementIntersector.getIntersections(selectRect, element)

    // we shouldn't trim anything
    if (!selectIntersections) return null

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

function assemblePointDistancesAndSubsections(element, trimPoints, selectPoints) {
    const pointDistances = { select: [] }
    const subsections = {}
    let currentSectionElements = []
    let sectionStartPoint = element.startPoint
    let distanceFromStart = 0
    let lastEndPoint = element.startPoint
    // sectionEndsQueue.push({ point: lastEndPoint, distanceFromStart: 0 })
    const selectRect = getSelectRect(selectPoints)
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

        const subElementTrimPoints = (trimPoints[subElement.id] || []).sort((a, b) => subElementDistFunc(a) < subElementDistFunc(b) ? -1 : 1)
        const subElementStartPoint = isInPolylineDirection ? subElement.startPoint : subElement.endPoint
        let hasMatchedStart = false
        for (let pointIndex = 0; pointIndex < subElementTrimPoints.length; pointIndex++) {
            const trimPoint = subElementTrimPoints[pointIndex]
            // TODO: What happens if trimPoint is on the edge between elements?

            // const pointDistance = subElementDistFunc(trimPoint) + distanceFromStart
            // pointDistances[trimPoint.pointId] = { distanceFromStart: pointDistance, type: 'trim' }
            const subElementDistance = subElementDistFunc(trimPoint)
            pointDistances[trimPoint.pointId] = subElementDistance + distanceFromStart

            const matchesStart = pointsMatch(trimPoint, subElementStartPoint)
            const matchesEnd = pointsMatch(trimPoint, subElementEndPoint)

            if (matchesStart) {
                if (subElementTrimPoints.length === 1) {
                    currentSectionElements.push({ element: subElement, isInPolylineDirection })
                }

                hasMatchedStart = true
            } else if (matchesEnd) {
                if ((hasMatchedStart && subElementTrimPoints.length === 2) || subElementTrimPoints.length === 1) {
                    currentSectionElements.push({ element: subElement, isInPolylineDirection })
                }

                subsections[getSectionKey(sectionStartPoint, trimPoint)] = currentSectionElements
                currentSectionElements = []
            } else {
                currentSectionElements.push({ element: subElement, isInPolylineDirection, trim: 1 })
                subsections[getSectionKey(sectionStartPoint, trimPoint)] = currentSectionElements
                currentSectionElements = [{ element: subElement, isInPolylineDirection, trim: -1 }]
            }

            sectionStartPoint = trimPoint
        }

        if (subElementTrimPoints.length === 0) {
            currentSectionElements.push({ element: subElement, isInPolylineDirection })
        }

        let selectIntersections = []
        if (selectRect) {
            selectIntersections = ElementIntersector.getIntersections(selectRect, subElement) || []
        } else if (subElement.checkIfPointOnElement(selectPoints[0], SELECT_DELTA)) {
            selectIntersections = [selectPoints[0]]
        }

        for (const intersection of selectIntersections) {
            const intersectionDistance = subElementDistFunc(intersection) + distanceFromStart
            pointDistances.select.push({ point: intersection, distanceFromStart: intersectionDistance })
        }

        distanceFromStart = distanceFromStart + subElementDistFunc(subElementEndPoint)
        // pointDistances[subElementEndPoint.pointId] = { point: subElementEndPoint, distanceFromStart, type: 'endPoint' }
        pointDistances[subElementEndPoint.pointId] = distanceFromStart

        // sectionEndsQueue.push({ point: subElementEndPoint, distanceFromStart })
        lastEndPoint = subElementEndPoint
    }

    const sectionEndPoint = element.endPoint
    subsections[getSectionKey(sectionStartPoint, sectionEndPoint)] = currentSectionElements
    // pointDistances[sectionEndPoint.pointId] = { distanceFromStart, point: sectionEndPoint }
    pointDistances[sectionEndPoint.pointId] = distanceFromStart

    return { pointDistances, subsections }
}

function fixJoinedSections(element, trimSections) {
    const firstRemaining = trimSections.remaining[0]
    const lastRemoved = trimSections.removed[trimSections.removed.length - 1]
    const elementStartPoint = element.startPoint

    const firstRemainingMatches = pointsMatch(firstRemaining.startPoint, elementStartPoint) ||
        pointsMatch(firstRemaining.endPoint, elementStartPoint)
    const lastRemovedMatches = pointsMatch(lastRemoved.startPoint, elementStartPoint) ||
        pointsMatch(lastRemoved.endPoint, elementStartPoint)
    if (firstRemainingMatches && lastRemovedMatches) {
        lastRemoved.endPoint = firstRemaining.endPoint
        return
    }

    const lastRemaining = trimSections.remaining[trimSections.remaining.length - 1]
    const firstRemoved = trimSections.removed[0]

    const lastRemainingMatches = pointsMatch(lastRemaining.startPoint, elementStartPoint) ||
        pointsMatch(lastRemaining.endPoint, elementStartPoint)
    const firstRemovedMatches = pointsMatch(firstRemoved.startPoint, elementStartPoint) ||
        pointsMatch(firstRemoved.endPoint, elementStartPoint)
    if (lastRemainingMatches && firstRemovedMatches) {
        firstRemovedMatches.startPoint = lastRemaining.startPoint
        return
    }
}

function getSectionKey(startPoint, endPoint) {
    return `${startPoint.x},${startPoint.y};${endPoint.x},${endPoint.y}`
}

function getSectionKeyStart(startPoint) {
    return `${startPoint.x},${startPoint.y}`
}

function splitIntoRemainingRemovedSections(
    sectionStartPoint,
    sectionEndPoint,
    sectionStartDistance,
    sectionEndDistance,
    selectIntersections,
    selectRect,
    trimPointsQueue,
    distFunc,
    endPoint
) {
    let sectionsPostTrim = {}
    while (trimPointsQueue.size >= 0) {
        const isSectionTrimmed = getSectionFate(
            selectIntersections,
            sectionStartPoint,
            sectionEndPoint,
            sectionStartDistance,
            sectionEndDistance,
            selectRect,
            distFunc
        )

        updateTrimmedSections(sectionsPostTrim, { start: sectionStartPoint, end: sectionEndPoint }, isSectionTrimmed)

        const nextSectionStart = trimPointsQueue.pop()
        if (!nextSectionStart) break

        // move to next section for next loop iteration
        sectionStartPoint = nextSectionStart.point
        sectionStartDistance = nextSectionStart.distanceFromStart

        const nextSectionEnd = trimPointsQueue.peek() ||
            { point: endPoint, distanceFromStart: distFunc(endPoint) }
        sectionEndPoint = nextSectionEnd.point
        sectionEndDistance = nextSectionEnd.distanceFromStart
    }

    return sectionsPostTrim
}

function getSectionFate(
    selectIntersections,
    sectionStartPoint,
    sectionEndPoint,
    sectionStartDistance,
    sectionEndDistance,
    selectRect,
    distFunc
) {
    const {
        left: selectLeft,
        right: selectRight,
        top: selectTop,
        bottom: selectBottom
    } = selectRect.getBoundingBox()

    const isStartInSelect = selectLeft <= sectionStartPoint.x && selectRight >= sectionStartPoint.x &&
        selectTop <= sectionStartPoint.y && selectBottom >= sectionStartPoint.y

    const isEndInSelect = selectLeft <= sectionEndPoint.x && selectRight >= sectionEndPoint.x &&
        selectTop <= sectionEndPoint.y && selectBottom >= sectionEndPoint.y

    if (isStartInSelect || isEndInSelect) {
        return true
    }

    // TODO: Is it worth moving to priority queue?
    selectIntersections = selectIntersections.map(si =>
        ({ point: si, distanceFromStart: distFunc(si) })
    ).sort((a, b) => a.distanceFromStart < b.distanceFromStart ? 1 : -1)

    let isSectionTrimmed = false
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

    return isSectionTrimmed
}

function createSubsection(element, sectionStart, sectionEnd, subsections) {
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

function getSelectRect(selectPoints) {
    if (selectPoints.length !== 2) return null

    const selectRect = createElement('rectangle', selectPoints[0].x, selectPoints[0].y)
    selectRect.setLastAttribute(selectPoints[1].x, selectPoints[1].y)

    return selectRect
}

function trimSubsectionElements(subsectionElements, sectionStart, sectionEnd) {
    const subElements = []
    for (let subIndex = 0; subIndex < subsectionElements.length; subIndex++) {
        const subsectionElementInfo = subsectionElements[subIndex]
        const subElement = subsectionElementInfo.element
        const trimmedSubElement = ElementManipulator.copyElement(subElement, false)

        if (!subsectionElementInfo.trim) {
            subElements.push(trimmedSubElement)
            continue
        }

        const nextSub = subsectionElements[subIndex + 1]
        const includesWholeElement = nextSub && nextSub.trim &&
            subsectionElementInfo.trim !== nextSub.trim &&
            nextSub.element.id === subElement.id
        if (includesWholeElement) {
            subElements.push(trimmedSubElement)
            subIndex++
            continue
        }

        if (subsectionElementInfo.trim === 1) {
            const newPoint = createPoint(sectionEnd.x, sectionEnd.y)

            if (subsectionElementInfo.isInPolylineDirection) {
                trimmedSubElement.endPoint = newPoint
            } else {
                trimmedSubElement.startPoint = newPoint
            }
        } else {
            const newPoint = createPoint(sectionStart.x, sectionStart.y)

            if (subsectionElementInfo.isInPolylineDirection) {
                trimmedSubElement.startPoint = newPoint
            } else {
                trimmedSubElement.endPoint = newPoint
            }
        }

        subElements.push(trimmedSubElement)
    }

    return subElements
}

function getSubsectionElements(sectionStart, sectionEnd, subsections) {
    const sectionKeyStart = getSectionKeyStart(sectionStart)
    const firstKey = Object.keys(subsections).find(k => k.startsWith(sectionKeyStart))
    let [firstPoint, secondPoint] = firstKey.split(';')
    let subsectionElements = []

    while (secondPoint !== `${sectionEnd.x},${sectionEnd.y}`) {
        subsectionElements = subsectionElements.concat(subsections[`${firstPoint};${secondPoint}`])

        firstPoint = secondPoint
        // eslint-disable-next-line no-loop-func
        secondPoint = Object.keys(subsections).find(k => k.startsWith(secondPoint)).split(';')[1]
    }

    subsectionElements = subsectionElements.concat(subsections[`${firstPoint};${secondPoint}`])
    return subsectionElements
}

// function checkElementSelection(element, selectPoints) {
//     if (selectPoints.length === 1) {
//         return element.checkIfPointOnElement(selectPoints[0])
//     }

//     const selectRect = createElement('rectangle', selectPoints[0].x, selectPoints[0].y)
//     selectRect.setLastAttribute(selectPoints[1].x, selectPoints[1].y)

//     let selectIntersections = ElementIntersector.getIntersections(selectRect, element)
//     if (selectIntersections) return true

//     const { 
//         left: selectLeft, 
//         right: selectRight, 
//         top: selectTop, 
//         bottom: selectBottom
//     } = selectRect.getBoundingBox()

//     const {
//         left: elementLeft,
//         right: elementRight,
//         top: elementTop,
//         bottom: elementBottom,
//     } = element.getBoundingBox()

//     return selectLeft <= elementLeft &&
//            selectRight >= elementRight &&
//            selectTop <= elementTop &&
//            selectBottom >= elementBottom
// }

export default ElementTrimmer

// const getPolyDistFunc = (distanceFromStart) => {

// }

// const sections = { remaining: [], removed: [] }
// let currentSection = { subElements: [], isSelected: false, isRemoved: false }
// let startPoint = element.startPoint
// let endPoint = element.endPoint
// let distanceFromStart = 0
// for (const subElement of element.elements) {
//     const elementTrimPoints = trimPoints[subElement.id]

//     if (!elementTrimPoints) {
//         currentSection.subElements.push(subElement)
//         if (!currentSection.isSelected) {
//             currentSection.isSelected = checkElementSelection(subElement, selectPoints)
//         }

//         distanceFromStart += subElement.length
//         continue
//     }

//     let subStartPoint
//     let subEndPoint
//     let isSectionReversed
//     if (pointsMatch(startPoint, subElement.startPoint)) {
//         subStartPoint = subElement.startPoint
//         subEndPoint = subElement.endPoint
//         isSectionReversed = false
//     } else {
//         subStartPoint = subElement.endPoint
//         subEndPoint = subElement.startPoint
//         isSectionReversed = true
//     }

//     let distFunc
//     if (subElement.baseType === 'line') {
//         distFunc = getDistFunc('line', { startPoint: subStartPoint })
//     } else {
//         const centerPoint = element.centerPoint
//         const startAngle = element.startLine.angle
//         distFunc = getDistFunc('arc', { centerPoint, startAngle })
//     }

//     const trimResults = getTrimSections(
//         subElement, 
//         elementTrimPoints, 
//         selectPoints, 
//         distFunc, 
//         subStartPoint, 
//         subEndPoint, 
//         isSectionReversed
//     )

//     if (!trimResults) {
//         currentSection.subElements.push(subElement)
//         distanceFromStart += subElement.length
//         continue
//     }

//     let currentSectionType = 'remaining'
//     let otherSectionType = 'removed'
//     if (currentSection.isRemoved) {
//         currentSectionType = 'removed'
//         otherSectionType = 'remaining'
//     } else {
//         currentSectionType = 'remaining'
//         otherSectionType = 'removed'
//     }

//     const sectionsOfCurrentType = currentSection[currentSectionType]
//     if (!sectionsOfCurrentType) {
//         sections[currentSectionType].push(currentSection)
//         currentSection = { subElements: [], isSelected: false, isRemoved: false }
//     }

//     // TODO: Add all sections (removed and remaining in a queue with distanceFromStart)
//     // and add them to sections in that order

//     let remainingIndex = 0
//     let nextContinuing = sectionsOfCurrentType[remainingIndex]
//     let nextContinuingStart = isSectionReversed ? nextContinuing.endPoint : nextContinuing.startPoint
//     if (pointsMatch(subStartPoint, nextContinuingStart) && !currentSection.isRemoved) {              
//         currentSection.subElements.push(nextContinuing)
//     }


//     // if (!trimResults.remaining) {
//     //     currentSection.isRemoved = true
//     //     distanceFromStart += subElement.length
//     //     continue
//     // }

// }