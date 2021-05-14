class Element {
    constructor(id, groupId) {
        this.id = id
        this.groupId = groupId
        this.isShown = true
    }

    get basePoint() {
        throw new Error('Property basePoint is not implemented')
    }

    get baseType() {
        const baseType = Object.getPrototypeOf(this.constructor).name
        return baseType !== 'Element' ? baseType.toLowerCase() : this.type 
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

    getSelectionPoints() {
        throw new Error('Method getSelectionPoints is not implemented')
    }

    checkIfPointOnElement(point, maxDiff) {
        throw new Error('Method checkIfPointOnElement is not implemented')
    }

    defineNextAttribute(definingPoint) {
        throw new Error('Method defineNextAttribute is not implemented')
    }

    setLastAttribute(pointX, pointY) {
        throw new Error('Method setLastAttribute is not implemented')
    }

    /* Method should return an object containing information about an object's bounding box,
    containing properties as the following example:
        {
            left: 10,
            right: 150,
            top: 50,
            bottom: 350
        } 
    */
    getBoundingBox() {
        throw new Error('Method getBoundingBox is not implemented')
    }

    move(dX, dY) {
        throw new Error('Method move is not implemented')
    }
}

export default Element