import { useCallback, useRef } from 'react'
import Point from '../drawingElements/point'
import { CANVAS_WIDTH } from '../utils/constants'
import { SelectionPointType } from '../utils/enums/index'
import Node from '../utils/searchTree/node'
import { createTree } from '../utils/searchTree/pointsSearchTree'
import { SelectionPoint } from '../utils/types/index'

const POINT_ID_ERROR = 'Selection points must have a pointId and elementId'

export default function useSelectionPoints() {
    const pointsTree = useRef<Node>(createTree(CANVAS_WIDTH))

    const addSelectionPoints = useCallback((elementPoints: SelectionPoint[]) => {
        elementPoints.forEach(elementPoint => {
            if (!elementPoint.pointId || !elementPoint.elementId) {
                throw new Error(POINT_ID_ERROR)
            }

            pointsTree.current.insert(
                elementPoint.x,
                buildPointsTreeDataObject(elementPoint, elementPoint.pointType)
            )
        })
    }, [])

    const removeSelectionPoints = useCallback((elementPoints: SelectionPoint[]) => {
        elementPoints.forEach(elementPoint => {
            pointsTree.current.remove(elementPoint.x, { y: elementPoint.y, pointId: elementPoint.pointId })
        })
    }, [])

    const replaceSelectionPoints = useCallback(
        (pointsAfterReplace: SelectionPoint[], pointsBeforeReplace: SelectionPoint[]) => {
            pointsAfterReplace.forEach(par => {
                const pointBeforeEdit = pointsBeforeReplace.find(pbr => pbr.pointId === par.pointId)
                if (!pointBeforeEdit) return

                if (!par.pointId || !par.elementId) {
                    throw new Error(POINT_ID_ERROR)
                }

                pointsTree.current.replace(
                    pointBeforeEdit.x,
                    { pointId: par.pointId },
                    par.x,
                    buildPointsTreeDataObject(par, par.pointType)
                )
            })
        },
        []
    )

    const findNearbyPoints = useCallback(
        (mouseX: number, mouseY: number, delta: number): SelectionPoint[] => {
            const filteredPoints = pointsTree.current.find(mouseX - delta, mouseX + delta)

            const nearbyPoints = []
            for (const point of filteredPoints) {
                if (Math.abs(point.y - mouseY) <= delta) {
                    const nearbyPoint = { ...point }
                    nearbyPoint.x = point.leafValue
                    delete nearbyPoint.leafValue

                    nearbyPoints.push(nearbyPoint)
                }
            }

            return nearbyPoints
        },
        []
    )

    return {
        addSelectionPoints,
        removeSelectionPoints,
        replaceSelectionPoints,
        findNearbyPoints
    }
}

type PointTreeNode = {
    leafValue: number
    y: number
    pointId: string
    elementId: string
    pointType: SelectionPointType
}

function buildPointsTreeDataObject(point: Point, pointType: SelectionPointType): PointTreeNode {
    return {
        leafValue: point.x,
        y: point.y,
        pointId: point.pointId!,
        elementId: point.elementId!,
        pointType
    }
}
