import { StateCreator } from 'zustand'
import { ElementWithId, SelectionPoint } from '../../../utils/types/index'
import { ElementsState } from '../index'

export type SelectionSlice = {
  selectedElements: Map<string, ElementWithId> | null,
  selectedPoints: SelectionPoint[] | null,
  addSelectedElements(elements: ElementWithId[] | ElementWithId): void,
  removeSelectedElements(elements: ElementWithId[] | ElementWithId): void,
  hasSelectedElement(element: ElementWithId): boolean,
  setSelectedElements(newElements: ElementWithId[]): void,
  clearSelection(): void,
  setSelectedPoints(newPoints: SelectionPoint[]): void,
  clearSelectedPoints(): void
}

export default function useSelectionSlice() {

  const createSelectionSlice: StateCreator<
    ElementsState,
    [["zustand/immer", never]],
    [],
    SelectionSlice
  > = ((
    set,  
    get,
  ) => ({
    selectedElements: null,
    selectedPoints: null,
    addSelectedElements(elements) {
      const newElements = Array.isArray(elements) ? elements : [elements]
      
      set((state) => {
        if (!state.selectedElements) {
          state.selectedElements = new Map<string, ElementWithId>()
        }

        for (const addedElement of newElements) {
          state.selectedElements.set(addedElement.id, addedElement)
        }
      })
    },
    removeSelectedElements(elements) {
      const newElements = Array.isArray(elements) ? elements : [elements]
      
      set((state) => {
        if (!state.selectedElements) {
          state.selectedElements = new Map<string, ElementWithId>()
        }

        for (const addedElement of newElements) {
          state.selectedElements.delete(addedElement.id)
        }
      })
    },
    hasSelectedElement(element) {
      const selectedElements = get().selectedElements
      if (!selectedElements) {
        return false
      }

      if (element.groupId) {
        return selectedElements.has(element.groupId)
      }

      return selectedElements.has(element.id)
    },
    setSelectedElements(newElements) {
      set({
        selectedElements: newElements.reduce((acc, value) => {
          acc.set(value.id, value)
          return acc
        }, new Map<string, ElementWithId>())
      })
    },
    clearSelection() {
      set({
        selectedElements: null,
        selectedPoints: null
      })
    },
    setSelectedPoints(newPoints) {
      set({
        selectedPoints: newPoints
      })
    },
    clearSelectedPoints() {
      set({
        selectedPoints: null
      })
    },
  }))

  return createSelectionSlice
}