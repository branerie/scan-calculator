import { createPoint } from './elementFactory'

const getQuadrant = (deltaX, deltaY) => {
    if (deltaX === 0 || deltaY === 0) {
        return 0
    }

    if (deltaX > 0) {
        if (deltaY > 0) {
            return 1
        }

        return 4
    }

    // deltaX is negative
    if (deltaY > 0) {
        return 2
    }

    return 3
}

const getQuadrantFromAngle = (angle) => {
    if (angle > 0 && angle < 90) {
        return 1
    }

    if (angle > 90 && angle < 180) {
        return 2
    }

    if (angle > 180 && angle < 270) {
        return 3
    }

    if (angle > 270 && angle < 360) {
        return 4
    }

    if (angle < 0) {
        return getQuadrantFromAngle(360 + (angle % 360))
    }

    if (angle > 360) {
        return getQuadrantFromAngle(angle % 360)
    }

    if (Number.isNaN(angle)) {
        throw new Error('Invalid value for "angle" - ' + angle)
    }

    // angle is 90, 180, 270 or 360 degrees
    return 0
}

const radiansToDegrees = (radians) => {
    return (radians * 180) / Math.PI
}

const degreesToRadians = (degrees) => {
    return (degrees / 180) * Math.PI
}

const getAngleBetweenPoints = (firstPoint, secondPoint) => {
    const deltaX = secondPoint.x - firstPoint.x
    const deltaY = secondPoint.y - firstPoint.y

    const angleInRadians = Math.atan(Math.abs(deltaY) / Math.abs(deltaX))
    const angle = radiansToDegrees(angleInRadians)
    const quadrant = getQuadrant(deltaX, deltaY)

    switch (quadrant) {
        case 0:
            // we have either a vertical or a horizontal line
            if (deltaX === 0) {
                // line is vertical
                return deltaY > 0 ? 90 : 270
            }

            // line is horizontal
            return deltaX > 0 ? 0 : 180
        case 1:
            return angle
        case 2:
            return 180 - angle
        case 3:
            return 180 + angle
        case 4:
            return 360 - angle
        default:
            throw new Error()
    }
}

const getAngleBetweenLines = ({
    lineA = null,
    lineB = null,
    lineAFirstPointX = null,
    lineAFirstPointY = null,
    lineASecondPointX = null,
    lineASecondPointY = null,
    lineBFirstPointX = null,
    lineBFirstPointY = null,
    lineBSecondPointX = null,
    lineBSecondPointY = null,
}) => {
    let startAngle = null
    let endAngle = null
    if (lineA && lineB) {
        startAngle = lineA.angle
        endAngle = lineB.angle
    } else {
        startAngle = getAngleBetweenPoints(
            createPoint(lineAFirstPointX, lineAFirstPointY),
            createPoint(lineASecondPointX, lineASecondPointY)
        )

        endAngle = getAngleBetweenPoints(
            createPoint(lineBFirstPointX, lineBFirstPointY),
            createPoint(lineBSecondPointX, lineBSecondPointY)
        )
    }

    if (startAngle > endAngle) {
        return startAngle - endAngle
    }

    return 360 - (endAngle - startAngle)
}

export {
    getQuadrant,
    getQuadrantFromAngle,
    getAngleBetweenPoints,
    getAngleBetweenLines,
    radiansToDegrees,
    degreesToRadians
}