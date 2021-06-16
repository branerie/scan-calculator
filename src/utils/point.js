import { degreesToRadians } from './angle'
import { MAX_NUM_ERROR } from './constants'
import { createPoint } from './elementFactory'

const getPointDistance = (a, b) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

const getRotatedPointAroundPivot = (point, pivotPoint, angle) => {
    const rotatedPoint = createPoint(point.x, point.y)

    // uses negative of angle to get counter-clockwise rotation
    const angleInRadians = degreesToRadians(-angle)

    const angleCos = Math.cos(angleInRadians)
    const angleSin = Math.sin(angleInRadians)

    const dX = rotatedPoint.x - pivotPoint.x
    const dY = rotatedPoint.y - pivotPoint.y

    const rotatedX = angleCos * dX - angleSin * dY + pivotPoint.x
    const rotatedY = angleSin * dX + angleCos * dY + pivotPoint.y

    rotatedPoint.x = rotatedX
    rotatedPoint.y = rotatedY

    return rotatedPoint
}

const getUniquePoints = (points) => {
    const pointsByCoordinates = {}
    for (const point of points) {
        const coordinatesKey = `${point.x},${point.y}`

        if (pointsByCoordinates[coordinatesKey]) {
            continue
        }

        pointsByCoordinates[coordinatesKey] = point
    }

    return Object.values(pointsByCoordinates)
}

const pointsMatch = (pointA, pointB, { checkX = true, checkY = true } = {}) => {
    return (checkX && Math.abs(pointA.x - pointB.x) < MAX_NUM_ERROR) && 
           (checkY && Math.abs(pointA.y - pointB.y) < MAX_NUM_ERROR)
}

export {
    getPointDistance,
    getRotatedPointAroundPivot,
    getUniquePoints,
    pointsMatch
}