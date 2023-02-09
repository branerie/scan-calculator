import { StateCreator } from 'zustand'
import { createDraft } from 'immer'
import { SelectionPoint } from '../../../utils/types/index'
import useSelectionPointsSlice from './useSelectionPointsSlice'
import { ElementsState } from '../index'
import useSelectionSlice from './useSelectionSlice'
import Polyline from '../../../drawingElements/polyline'
import Element, { ElementWithId } from '../../../drawingElements/element'
import { generateId } from '../../../utils/general'
import { useElementContainerContext } from '../../../contexts/ElementContainerContext'
import ElementManipulator from '../../../utils/elementManipulator'

export type HistorySlice = {
  historyPointer: number | null
  actionHistory: HistoryEvent[]
  // updateHistoryEvents(newEvent: HistoryEvent): void,
  // addElementsFromHistory(elementsToAdd: ElementWithId[]): void,
  // removeElementsFromHistory(elementsToRemove: ElementWithId[]): void,
  addElements(newElements: Element[]): void
  editElements(): void
  deleteElements(deletedElements: ElementWithId[]): void
  replaceElements(): void
  undo(): void
  redo(): void
  resetCurrentModifications(): void
}

export default function useHistorySlice() {
  const selectionSlice = useSelectionSlice()
  const selectionPointsSlice = useSelectionPointsSlice()
  const container = useElementContainerContext()

  const createHistorySlice: StateCreator<ElementsState, [['zustand/immer', never]], [], HistorySlice> = (
    set,
    get,
    store
  ) => {
    //#region helpers
    function addElementsToState(newElements: ElementWithId[]) {
      set((state) => {
        const { elements, groupedElements } = state
        for (const newElement of newElements) {
          if (!newElement.id) {
            return
          }

          if (newElement.groupId) {
            groupedElements.set(newElement.id, newElement)
          } else {
            elements.set(newElement.id, newElement)

            if (newElement instanceof Polyline) {
              newElement.elements.forEach((element) => {
                groupedElements.set(element.id!, element as ElementWithId)
              })
            }
          }
        }

        state.currentlyCreatedElement = null
      })

      container.addElements(newElements)
    }

    function removeElements(elementsToRemove: ElementWithId[]) {
      set((state) => {
        const { elements, groupedElements, currentlyEditedElements } = state

        for (const elementToRemove of elementsToRemove) {
          const elementId = elementToRemove.id
          if (elementToRemove.groupId) {
            groupedElements.delete(elementId)
          } else {
            elements.delete(elementId)

            if (elementToRemove instanceof Polyline) {
              for (const subElement of elementToRemove.elements) {
                groupedElements.delete(subElement.id!)
              }
            }
          }

          if (currentlyEditedElements && currentlyEditedElements.has(elementId)) {
            currentlyEditedElements.delete(elementId)
          }
        }
      })

      container.removeElements(elementsToRemove)
    }

    function changeElements(elementsAfterChange: ElementWithId[]) {
      set((state) => {
        const { elements, groupedElements } = state

        for (const elementAfterChange of elementsAfterChange) {
          if (elementAfterChange.groupId) {
            groupedElements.set(elementAfterChange.id, elementAfterChange)
          } else if (elementAfterChange instanceof Polyline) {
            for (const subElement of elementAfterChange.elements) {
              groupedElements.set(subElement.id!, subElement as ElementWithId)
            }
          }

          elements.set(elementAfterChange.id, elementAfterChange)
        }
      })

      container.changeElements(elementsAfterChange)
    }

    function updateHistoryEvents(newEvent: HistoryEvent) {
      set((state) => {
        const { actionHistory, historyPointer } = state
        if (historyPointer !== null) {
          state.actionHistory = actionHistory.slice(0, historyPointer)
          state.historyPointer = null
        }

        state.actionHistory.push(createDraft(newEvent))
      })
    }

    function addElementsFromHistory(elementsToAdd: ElementWithId[]) {
      let pointsToAdd: SelectionPoint[] = []
      for (const element of elementsToAdd) {
        pointsToAdd = pointsToAdd.concat(element.getSelectionPoints())
      }

      const addSelectionPoints = selectionPointsSlice(set, get, store).addSelectionPoints

      addSelectionPoints(pointsToAdd)
      addElementsToState(elementsToAdd)
    }

    function removeElementsFromHistory(elementsToRemove: ElementWithId[]) {
      const removeSelectedElements = selectionSlice(set, get, store).removeSelectedElements
      const removeSelectionPoints = selectionPointsSlice(set, get, store).removeSelectionPoints

      // remove selection points of deleted elements
      for (const removedElement of elementsToRemove) {
        const selectionPoints = removedElement.getSelectionPoints()
        removeSelectionPoints(selectionPoints)
      }

      removeElements(elementsToRemove)
      removeSelectedElements(elementsToRemove)
    }

    function updateElementsFromHistory(lastEventIndex: number, isUndo: boolean) {
      const actionHistory = get().actionHistory
      const lastHistoryEvent = actionHistory[lastEventIndex]
      if (!lastHistoryEvent) {
        return
      }

      let updateOperation = lastHistoryEvent.action

      // Undoing an added element means removing it, while undoing a delete command means adding an element.
      // Therefore, we switch the actual update operations. Redo works normally
      if (isUndo) {
        if (updateOperation === 'add') {
          updateOperation = 'delete'
        } else if (updateOperation === 'delete') {
          updateOperation = 'add'
        }
      }

      if (updateOperation === 'add') {
        addElementsFromHistory((lastHistoryEvent as AddEditDeleteHistoryEvent).elements)
        return
      }

      if (updateOperation === 'delete') {
        removeElementsFromHistory((lastHistoryEvent as AddEditDeleteHistoryEvent).elements)
        return
      }

      if (lastHistoryEvent.action === 'edit') {
        // save state of edited elements in elementsBeforeUndo in order to put it in history
        // to be able to get the elements back to this state using redo/undo
        const elementsBeforeUndo: ElementWithId[] = []
        const elementsAfterUndo = lastHistoryEvent.elements
        const getElementById = get().getElementById
        const replaceSelectionPoints = get().replaceSelectionPoints
        const hasSelectedElement = get().hasSelectedElement
        const addSelectedElements = get().addSelectedElements

        for (const elementAfterUndo of elementsAfterUndo) {
          const elementBeforeUndo = getElementById(elementAfterUndo.id)!
          elementsBeforeUndo.push(elementBeforeUndo)

          const pointsAfterUndo = elementAfterUndo.getSelectionPoints()
          replaceSelectionPoints(pointsAfterUndo)
        }

        // if edited element is still selected, updates the selected element with the new element state
        // after undo/redo
        const updatedSelectedElements = []
        for (const elementAfterUndo of elementsAfterUndo) {
          if (hasSelectedElement(elementAfterUndo)) {
            updatedSelectedElements.push(elementAfterUndo)
          }
        }

        if (updatedSelectedElements.length > 0) {
          addSelectedElements(updatedSelectedElements)
        }

        // change actionHistory by adding elementsBeforeUndo so it can be accessed using undo/redo
        const newActionHistory = [...actionHistory]
        const lastEvent = newActionHistory[lastEventIndex] as AddEditDeleteHistoryEvent
        lastEvent.elements = elementsBeforeUndo
        set({
          actionHistory: newActionHistory,
        })

        changeElements(elementsAfterUndo)
        return
      }

      if (updateOperation === 'replace') {
        const { addedElements, removedElements } = lastHistoryEvent as ReplaceHistoryEvent

        if (isUndo) {
          addElementsFromHistory(removedElements)
          removeElementsFromHistory(addedElements)
          return
        }

        addElementsFromHistory(addedElements)
        removeElementsFromHistory(removedElements)
        return
      }

      throw new Error('Invalid event action')
    }

    //#endregion

    return {
      historyPointer: null,
      actionHistory: [],
      addElements(newElements) {
        const addSelectionPoints = get().addSelectionPoints

        let newSelectionPoints: SelectionPoint[] = []
        for (const newElement of newElements) {
          newElement.id = generateId()
          newSelectionPoints = newSelectionPoints.concat(newElement.getSelectionPoints())
        }

        addElementsToState(newElements as ElementWithId[])
        addSelectionPoints(newSelectionPoints)

        updateHistoryEvents({ action: 'add', elements: newElements as ElementWithId[] })
      },
      editElements() {
        const currentlyEditedElements = get().currentlyEditedElements
        if (!currentlyEditedElements) {
          return
        }

        const getElementById = get().getElementById
        const completeEditingElements = get().completeEditingElements
        const addSelectedElements = get().addSelectedElements
        const replaceSelectionPoints = get().replaceSelectionPoints
        const clearSelectedPoints = get().clearSelectedPoints
        const selectedPoints = get().selectedPoints

        const elementsBeforeEdit: ElementWithId[] = []
        const editedElementsValuesArr = Array.from(currentlyEditedElements.values())
        for (const cee of editedElementsValuesArr) {
          const elementBeforeEdit = ElementManipulator.copyElement(
            getElementById(cee.id)!, 
            { keepIds: true, assignId: false }
          )  as ElementWithId

          elementBeforeEdit.isShown = true
          elementsBeforeEdit.push(elementBeforeEdit)
        }

        let pointsToReplace: SelectionPoint[] = []
        if (!!selectedPoints) {
          pointsToReplace = selectedPoints
        } else {
          pointsToReplace = editedElementsValuesArr.reduce(
            (acc, cee) => acc.concat(cee.getSelectionPoints()),
            new Array<SelectionPoint>()
          )
        }

        for (const pointToReplace of pointsToReplace) {
          let elementOfPoint = currentlyEditedElements.get(pointToReplace.elementId)
          if (!elementOfPoint) {
            // element might be a subelement of a polyline
            const elementWithId = getElementById(pointToReplace.elementId)
            if (elementWithId?.groupId) {
              elementOfPoint = currentlyEditedElements.get(elementWithId.groupId)
            }

            if (!elementOfPoint) {
              throw new Error('Trying to change a point which does not belong to a currently edited element')
            }
          }

          const selectionPointsAfterEdit = elementOfPoint.getSelectionPoints()

          replaceSelectionPoints(selectionPointsAfterEdit)
        }

        updateHistoryEvents({ action: 'edit', elements: elementsBeforeEdit })

        const editedElements = completeEditingElements()
        addSelectedElements(editedElements)
        clearSelectedPoints()
      },
      deleteElements(deletedElements) {
        const removeSelectionPoints = get().removeSelectionPoints

        // remove selection points of deleted elements
        for (const deletedElement of deletedElements) {
          const selectionPoints = deletedElement.getSelectionPoints()
          removeSelectionPoints(selectionPoints)
        }

        updateHistoryEvents({ action: 'delete', elements: deletedElements })
        removeElements(deletedElements)
      },
      replaceElements() {
        const currentlyReplacedElements = get().currentlyReplacedElements
        if (!currentlyReplacedElements) return

        if (!currentlyReplacedElements.completed || !currentlyReplacedElements.completed.aggregate) {
          const clearReplacingElements = get().clearReplacingElements
          clearReplacingElements()
          return
        }

        const { completed } = currentlyReplacedElements

        const allRemovedElements = Array.from(completed.aggregate!.removed.values())
        const removedSelectionPoints = allRemovedElements.reduce<SelectionPoint[]>((acc, el) => {
          return acc.concat(el.getSelectionPoints())
        }, [])

        const allAddedElements = Array.from(completed.aggregate!.added.values())
        const addedSelectionPoints = allAddedElements.reduce<SelectionPoint[]>((acc, el) => {
          return acc.concat(el.getSelectionPoints())
        }, [])

        const removeSelectionPoints = get().removeSelectionPoints
        const addSelectionPoints = get().addSelectionPoints
        removeSelectionPoints(removedSelectionPoints)
        addSelectionPoints(addedSelectionPoints)

        updateHistoryEvents({
          action: 'replace',
          removedElements: allRemovedElements,
          addedElements: allAddedElements,
        })

        const completeReplacingElements = get().completeReplacingElements
        completeReplacingElements()
      },
      undo() {
        const historyPointer = get().historyPointer
        if (historyPointer === 0) {
          return
        }

        const actionHistory = get().actionHistory
        const newPointer = historyPointer === null ? actionHistory.length - 1 : historyPointer - 1

        set({
          historyPointer: newPointer,
        })

        updateElementsFromHistory(newPointer, true)
      },
      redo() {
        const historyPointer = get().historyPointer
        if (historyPointer === null) {
          return
        }

        updateElementsFromHistory(historyPointer, false)

        set((state) => {
          const { historyPointer: currentPointer, actionHistory } = state

          if (currentPointer === actionHistory.length - 1) {
            state.historyPointer = null
          } else {
            state.historyPointer = currentPointer! + 1
          }
        })
      },
      resetCurrentModifications() {
        const currentlyCreatedElement = get().currentlyCreatedElement
        if (currentlyCreatedElement) {
          const removeCurrentlyCreatedElement = get().removeCurrentlyCreatedElement
          removeCurrentlyCreatedElement()
          return
        }

        const currentlyCopiedElements = get().currentlyCopiedElements
        if (currentlyCopiedElements) {
          const completeCopyingElements = get().completeCopyingElements
          const positionedCopies = completeCopyingElements()

          const addElements = get().addElements
          addElements(positionedCopies)
          return
        }

        const currentlyEditedElements = get().currentlyEditedElements
        if (currentlyEditedElements) {
          const selectedElements = get().selectedElements
          if (selectedElements) {
            const newSelectedElements = new Map(selectedElements)
            newSelectedElements.forEach((se) => (se.isShown = true))

            set({
              selectedElements: newSelectedElements,
            })
          }

          const stopEditingElements = get().stopEditingElements
          stopEditingElements()
          return
        }

        const currentlyReplacedElements = get().currentlyReplacedElements
        if (currentlyReplacedElements) {
          const replaceElements = get().replaceElements
          replaceElements()
        }
      },
    }
  }

  return createHistorySlice
}

type AddEditDeleteHistoryEvent = {
  action: 'add' | 'edit' | 'delete'
  elements: ElementWithId[]
}

type ReplaceHistoryEvent = {
  action: 'replace'
  addedElements: ElementWithId[]
  removedElements: ElementWithId[]
}

type HistoryEvent = AddEditDeleteHistoryEvent | ReplaceHistoryEvent
