class Element {
    constructor(groupId) {
        this.groupId = groupId
        this.isShown = true
    }

    get basePoint() {
        throw new Error('Property basePoint is not implemented')
    }

    get baseType() {
        const baseType = Object.getPrototypeOf(this.constructor).name
        return baseType !== 'Element' ? baseType : this.type 
    }

    get type() {
        return this.constructor.name.toLowerCase()
    }

    get isFullyDefined() {
        throw new Error('Property isFullyDefined is not implemented')
    }

    /* Should return true if all but the last dimension of the element are defined */
    get isAlmostDefined() {
        throw new Error('Property isAlmostDefined is not implemented')
    }

    get startPoint() {
        throw new Error('Property startPoint is not implemented')
    }

    get endPoint() {
        throw new Error('Property endPoint is not implemented')
    } 

    getPointById(pointId) {
        throw new Error('Method getPointById is not implemented')
    }

    setPointById(pointId, newPointX, newPointY) {
        const point = this.getPointById(pointId)
        if (!point) {
            return false
        }

        point.x = newPointX
        point.y = newPointY
        return true
    }

    getSnappingPoints() {
        throw new Error('Method getSnappingPoints is not implemented')
    }

    checkIfPointOnElement(point) {
        throw new Error('Method checkIfPointOnElement is not implemented')
    }

    defineNextAttribute(definingPoint) {
        throw new Error('Method defineNextAttribute is not implemented')
    }

    setLastAttribute(pointX, pointY) {
        throw new Error('Method setLastAttribute is not implemented')
    }

    move(dX, dY) {
        throw new Error('Method move is not implemented')
    }
}

export default Element