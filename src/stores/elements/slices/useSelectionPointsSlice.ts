import { StateCreator } from 'zustand';
// import { immer } from 'zustand/middleware/immer';
import Point from '../../../drawingElements/point';
import { CANVAS_WIDTH } from '../../../utils/constants';
import { SelectionPointType } from '../../../utils/enums/index';
import Node from '../../../utils/searchTree/node';
import { createTree } from '../../../utils/searchTree/pointsSearchTree';
import { SelectionPoint } from '../../../utils/types/index';
import { ElementsState } from '../index';

const POINT_ID_ERROR = 'Selection points must have a pointId and elementId'

export type SelectionPointsSlice = {
  pointsTree: Node<PointTreeNode>,
  addSelectionPoints(elementPoints: SelectionPoint[]): void,
  removeSelectionPoints(elementPoints: SelectionPoint[]): void,
  replaceSelectionPoints(pointsAfterReplace: SelectionPoint[]): void,
  findNearbyPoints(mouseX: number, mouseY: number, delta: number): SelectionPoint[],
  findPointById(pointId: string): PointTreeNode | null,
}

export default function useSelectionPointsSlice() {
  // const createSelectionPointsSlice = immer<SelectionPointsSlice>((
  const createSelectionPointsSlice: StateCreator<
    ElementsState,
    [["zustand/immer", never]],
    [],
    SelectionPointsSlice
  > = (
    set, 
    get
  ) => ({
    pointsTree: createTree(CANVAS_WIDTH),
    addSelectionPoints(elementPoints) {
      set((state) => {
        const { pointsTree } = state
        for (const elementPoint of elementPoints) {
          pointsTree.insert(
            elementPoint.x,
            buildPointsTreeDataObject(elementPoint, elementPoint.pointType)
          )
        }
      })
    },
    removeSelectionPoints(elementPoints) {
      set((state) => {
        const { pointsTree } = state
        for (const elementPoint of elementPoints) {
          pointsTree.remove(
            elementPoint.x, { 
              y: elementPoint.y, 
              pointId: elementPoint.pointId 
            }
          )
        }
      })
    },
    replaceSelectionPoints(pointsAfterReplace) {
      set((state) => {
        const { pointsTree } = state

        for (const par of pointsAfterReplace) {
          const pointBeforeEdit = pointsTree.find(Number.MIN_VALUE, Number.MAX_VALUE, { pointId: par.pointId })[0]
          if (!pointBeforeEdit) {
            continue
          }

          if (!par.pointId || !par.elementId) {
            throw new Error(POINT_ID_ERROR)
          }

          pointsTree.replace(
            pointBeforeEdit.leafValue,
            { pointId: par.pointId },
            par.x,
            buildPointsTreeDataObject(par, par.pointType)
          )
        }
      })
    },
    findPointById(pointId) {
      const pointsTree = get().pointsTree
      const point = pointsTree.find(Number.MIN_VALUE, Number.MAX_VALUE, { pointId })

      if (!point || !point.length) {
        return null
      }

      return point[0]
    },
    findNearbyPoints(mouseX, mouseY, delta) {
      const pointsTree = get().pointsTree
      const filteredPoints = pointsTree.find(mouseX - delta, mouseX + delta)

      const nearbyPoints: SelectionPoint[] = []
      for (const point of filteredPoints) {
        if (Math.abs(point.y - mouseY) <= delta) {
          const nearbyPoint = {
            x: point.leafValue,
            y: point.y,
            pointId: point.pointId,
            elementId: point.elementId,
            pointType: point.pointType,
          }

          nearbyPoints.push(nearbyPoint)
        }
      }

      return nearbyPoints       
    },
  })

  return createSelectionPointsSlice
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