class Element {
    constructor(groupId) {
        this.groupId = groupId
        this.isShown = true
    }

    get basePoint() {
        throw new Error('Property basePoint is not implemented')
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

    copy(keepIds = false) {
        throw new Error('Method copy is not implemented')
    }

    getPointById(pointId) {
        throw new Error('Method getPointById is not implemented')
    }

    setPointById(pointId, newPointX, newPointY) {
        throw new Error('Method setPointById is not implemented')
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

    setLastAttribute(lastPoint) {
        throw new Error('Method setLastAttribute is not implemented')
    }
}

export default Element