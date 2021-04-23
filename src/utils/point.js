import { degreesToRadians } from "./angle"
import { createPoint } from "./elementFactory"

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

export {
    getPointDistance,
    getRotatedPointAroundPivot
}