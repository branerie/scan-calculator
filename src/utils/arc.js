import { getAngleBetweenPoints } from './angle'
import { createPoint } from './elementFactory'

const getPointWithMinDimension = (firstPoint, secondPoint, dim) =>
    firstPoint[dim] < secondPoint[dim] ? firstPoint : secondPoint

const getPointWithMaxDimension = (firstPoint, secondPoint, dim) =>
    firstPoint[dim] > secondPoint[dim] ? firstPoint : secondPoint



const getArcEndPoints = (arc) => {
    const centerPoint = arc.centerPoint
    const radius = arc.radius
    const startPoint = arc.startPoint
    const endPoint = arc.endPoint

    const left = arc.containsAngle(180) 
                    ? createPoint(centerPoint.x - radius, centerPoint.y)
                    : getPointWithMinDimension(startPoint, endPoint, 'x')
    const right = arc.containsAngle(0) 
                    ? createPoint(centerPoint.x + radius, centerPoint.y)
                    : getPointWithMaxDimension(startPoint, endPoint, 'x')
    const top = arc.containsAngle(270) 
                    ? createPoint(centerPoint.x, centerPoint.y - radius)
                    : getPointWithMinDimension(startPoint, endPoint, 'y')
    const bottom = arc.containsAngle(90) 
                    ? createPoint(centerPoint.x, centerPoint.y + radius)
                    : getPointWithMaxDimension(startPoint, endPoint, 'y')

    return { left, right, top, bottom }
}

const getPointsAngleDistance = (arcCenter, shouldCheckClockwise, pointFrom, pointTo) => {
    const angleFrom = getAngleBetweenPoints(arcCenter, pointFrom)
    const angleTo = getAngleBetweenPoints(arcCenter, pointTo)

    if (shouldCheckClockwise) {
        if (angleFrom < angleTo) {
            return angleTo - angleFrom
        }

        return (360 - angleFrom) + angleTo
    }

    if (angleFrom > angleTo) {
        return angleFrom - angleTo
    }

    return (360 - angleTo) + angleFrom
}

export {
    getArcEndPoints,
    getPointsAngleDistance
}