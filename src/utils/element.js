import { getAngleBetweenPoints } from './angle'
import { getPointDistance } from './point'

const checkIsElementStartCloserThanEnd = (element, pointsOnElement, polylineSubElement) => {
    if (element.type === 'circle') {
        throw new Error('Elements of type circle do not have a start or end')
    }

    if (element.baseType === 'polyline' && element.isJoined) {
        throw new Error('Closed polylines do not have a start or end')
    }

    const result = {}
    if (element.baseType !== 'polyline') {
        for (const pointOnElement of pointsOnElement) {
            const startDistance = getPointDistance(element.startPoint, pointOnElement)
            const endDistance = getPointDistance(element.endPoint, pointOnElement)

            result[pointOnElement.pointId] = startDistance < endDistance
        }

        return result
    }

    const elementStartDistances = {}
    let totalDistance = 0
    const innerElements = element.elements
    for (let elementIndex = 0; elementIndex < element.elements.length; elementIndex++) {
        const innerElement = innerElements[elementIndex]

        elementStartDistances[innerElement.id] = totalDistance
        totalDistance += innerElement.length
    }

    const polylineMidPointDistance = totalDistance / 2
    for (const pointOnElement of pointsOnElement) {
        // TODO: get innerElement on which point lies, use elementStartDistances
        // and calculate if pointOnElement's distanceFromStart is less than polylineMidPointDistance
    }


    // if (element.type === 'line') {
    //     const startDistance = getPointDistance(element.startPoint, point)
    //     const endDistance = getPointDistance(element.endPoint, point)

    //     return startDistance < endDistance
    // }

    // if (element.type === 'arc') {
    //     const pointAngleFromCenter = getAngleBetweenPoints(element.centerPoint, point)

    //     let startDiff = Math.abs(element.startLine.angle - pointAngleFromCenter)
    //     if (startDiff > 180) {
    //         startDiff = 360 - startDiff
    //     }

    //     let endDiff = Math.abs(element.endLine.angle - pointAngleFromCenter)
    //     if (endDiff > 180) {
    //         endDiff = 360 - endDiff
    //     }

    //     return startDiff < endDiff
    // }


}

export {
    checkIsElementStartCloserThanEnd
}