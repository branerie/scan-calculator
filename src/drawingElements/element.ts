import { immerable } from 'immer'
import { SelectionPointType } from '../utils/enums/index'
import { BoundingBox } from '../utils/types/index'
import Point from './point'
import { SelectionPoint } from '../utils/types'

abstract class Element {
    [immerable] = true
    private _id: string | null = null
    groupId: string | null = null
    isShown: boolean

    constructor(id?: string, groupId?: string) {
        if (id) {
            this._id = id
        }

        if (groupId) {
            this.groupId = groupId
        }

        this.isShown = true
    }

    get id(): string | null {
        return this._id
    }

    set id(value) {
        this._id = value
        this.setPointsElementId()
    }

    get baseType(): string {
        const baseType = Object.getPrototypeOf(this.constructor).name
        return baseType !== 'Element' ? baseType.toLowerCase() : this.type
    }

    get type(): string {
        return this.constructor.name.toLowerCase()
    }

    setPointById(pointId: string, newPointX: number, newPointY: number) {
        const point = this.getPointById(pointId)
        if (!point) {
            return false
        }

        point.x = newPointX
        point.y = newPointY
        return true
    }

    /**
     * Should return true if all dimensions of the element are defined
     */
    abstract get isFullyDefined(): boolean

    /**
     * Should return true if all but the last dimension of the element are defined
     */
    abstract get isAlmostDefined(): boolean

    abstract get basePoint(): Point | null
    abstract get startPoint(): Point | null
    abstract set startPoint(value: Point | null)
    abstract get endPoint(): Point | null
    abstract set endPoint(value: Point | null)

    abstract getPointById(pointId: string): Point | null
    abstract getSelectionPoints(pointType?: SelectionPointType): SelectionPoint[]
    abstract checkIfPointOnElement(point: Point, maxDiff: number): boolean
    abstract defineNextAttribute(definingPoint: Point): void
    abstract setLastAttribute(pointX: number, pointY: number): void
    abstract getBoundingBox(): BoundingBox
    abstract move(dX: number, dY: number): void
    abstract setPointsElementId(): void
}

export default Element

export const NO_ID_ERROR = 'Attempting to set an undefined element id to points'
export const NOT_DEFINED_ERROR = 'Attempting to access properties of an element that is not fully defined yet' 
