import { useState } from 'react'
import create, { StateCreator, StoreApi } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Immutable } from 'immer'
import Element from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import useSelectionPoints from '../../hooks/useSelectionPoints'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../utils/constants'
import HashGrid from '../../utils/hashGrid/index'
import { SelectionPoint } from '../../utils/types/index'
import useElementsSlice, { ElementsSlice } from './slices/useElementsSlice'
import HashGridElementContainer from '../../utils/elementContainers/hashGrid'

const HASH_GRID_DIV_SIZE_X = 80
const HASH_GRID_DIV_SIZE_Y = 40

const hashGrid = new HashGrid(
  Math.ceil(CANVAS_WIDTH / HASH_GRID_DIV_SIZE_X),
  HASH_GRID_DIV_SIZE_X,
  Math.ceil(CANVAS_HEIGHT / HASH_GRID_DIV_SIZE_Y),
  HASH_GRID_DIV_SIZE_Y
)

const elementsContainer = new HashGridElementContainer(hashGrid)

export const useElementsStore = () => {
  const [historyPointer, setHistoryPointer] = useState<number | null>(null)
  const [actionHistory, setActionHistory] = useState<HistoryEvent[]>([])

  const { addSelectionPoints } = useSelectionPoints()

  const createElementsSlice = useElementsSlice(elementsContainer)

  const updateHistoryEvents = (newEvent: HistoryEvent) => {
    let newActionHistory = actionHistory
    if (historyPointer !== null) {
        newActionHistory = actionHistory.slice(0, historyPointer)
        setHistoryPointer(null)
    }

    setActionHistory([...newActionHistory, newEvent])
  }

  const addElementsFromHistory = (elementsToAdd: Element[]) => {
    let pointsToAdd: SelectionPoint[] = []
    for (const element of elementsToAdd) {
        pointsToAdd = pointsToAdd.concat(element.getSelectionPoints())
    }

    addSelectionPoints(pointsToAdd)
    addElementsToState(elementsToAdd)
  }

  return create<StoreState>()(
    immer((set, get, store) => ({
          ...createElementsSlice(set, get, store)
      })
    )

  )
}

export type StoreState = ElementsSlice


type HistoryEvent = {
    action: 'add' | 'edit' | 'delete'
    elements: Element[]
}
