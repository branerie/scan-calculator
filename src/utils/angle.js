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

const polarToCartesian = (centerPoint, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0

    return {
        x: centerPoint.x + (radius * Math.cos(angleInRadians)),
        y: centerPoint.y + (radius * Math.sin(angleInRadians))
    }
}

export {
    getQuadrant,
    polarToCartesian
}