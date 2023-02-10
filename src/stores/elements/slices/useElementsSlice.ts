// import { immer } from 'zustand/middleware/immer'
import { StateCreator } from 'zustand'
import Element, { ElementWithId, FullyDefinedElement } from '../../../drawingElements/element'
import Point from '../../../drawingElements/point'
import { SelectionPoint } from '../../../utils/types/index'
import { ElementsState } from '../index'
import Polyline, { FullyDefinedPolyline, SubElement } from '../../../drawingElements/polyline'
import { Ensure } from '../../../utils/types/generics'
import { createElement, createPoint } from '../../../utils/elementFactory'
import { SELECT_DELTA } from '../../../utils/constants'
import ElementIntersector from '../../../utils/elementIntersector'
import Rectangle, { FullyDefinedRectangle } from '../../../drawingElements/rectangle'
import ElementManipulator from '../../../utils/elementManipulator'
import ElementReplacement from '../../../utils/elementReplacement'
import { useElementContainerContext } from '../../../contexts/ElementContainerContext'

const CONTAINER_STATE_MISMATCH_ERROR =
  'Elements container contains element that is not found in the elements state'

export type ReturnGroupOption = "individual" | "members" | "owner"

export type ElementsSlice = {
  elements: Map<string, ElementWithId>
  groupedElements: Map<string, ElementWithId>
  snappedPoint: SelectionPoint | null
  currentlyCreatedElement: Element | null
  currentlyEditedElements: Map<string, ElementWithId> | null
  currentlyCopiedElements: {
    original: Element[]
    current: Element[]
    positioned: Element[]
  } | null
  currentlyReplacedElements: {
    completed?: ElementReplacement | null
    currentReplacements?: Map<
      string,
      {
        replacingElements: ElementWithId[]
        removedSections: FullyDefinedElement[]
        diffElements?: FullyDefinedElement[]
      }
    >
  } | null
  // addElements: (newElements: ElementWithId[]) => void,
  // removeElements: (elementsToRemove: ElementWithId[]) => void,
  // changeElements: (elementsAfterChange: ElementWithId[]) => void,
  getElementById: (elementId: string) => ElementWithId | null
  // getElementsFromReturnGroupOptions: (
  //   originalElement: Element,
  //   returnGroupOption: ReturnGroupOption
  // ) => Element[],
  getElementsContainingPoint: (
    pointX: number,
    pointY: number,
    options: {
      maxPointsDiff?: number
      returnGroup?: ReturnGroupOption
    }
  ) => Element[] | null
  getElementsInContainer: (
    boxStartPoint: Point,
    boxEndPoint: Point,
    options: {
      shouldSkipPartial?: boolean
      returnGroup?: ReturnGroupOption
    }
  ) => Element[] | null
  getElementsNearElement: (
    element: ElementWithId,
    options: {
      skipSiblings?: boolean
      returnGroup?: ReturnGroupOption
    }
  ) => Element[]
  addCurrentlyCreatedElement: (createdElement: Element) => void
  removeCurrentlyCreatedElement: () => void
  startEditingElements: (
    editedElements: ElementWithId[],
    shouldHideOriginal?: boolean,
    shouldCopyElements?: boolean
  ) => void
  changeEditingElements: (newEditingElements: ElementWithId[] | Map<string, ElementWithId>) => void
  stopEditingElements: () => void
  completeEditingElements: () => ElementWithId[]
  isEditingElement: (element: ElementWithId) => boolean
  startCopyingElements: (elements: Element[]) => void
  moveCopyingElements: (dX: number, dY: number) => void
  continueCopyingElements: () => void
  completeCopyingElements: () => Element[]
  startReplacingElements: (
    replacements: Map<
      string,
      {
        replacingElements: ElementWithId[]
        removedSections: Element[]
        diffElements?: Element[]
      }
    >
  ) => void
  clearReplacingElements: (elementsToKeep?: ElementWithId[]) => void
  completeReplacingElements: () => ElementReplacement | null
  updateReplacementSteps: (shouldUndo: boolean) => void
  continueReplacingElements: () => void
  isReplacingElement: (element: Element) => boolean
  setSnappedPoint: (snappedPoint: SelectionPoint | null) => void
  clearSnappedPoint: () => void
}

export default function useElementsSlice() {
  // const createElementsSlice = immer<ElementsSlice>((
  const container = useElementContainerContext()

  const createElementsSlice: StateCreator<ElementsState, [['zustand/immer', never]], [], ElementsSlice> = (
    set,
    get
  ) => {
    //#region helpers
    function getElementsFromReturnGroupOptions(
      originalElement: Element,
      returnGroupOption: ReturnGroupOption
    ): Element[] {
      if (!originalElement.groupId || returnGroupOption === "individual") {
        return [originalElement]
      }

      const getElementById = get().getElementById
      const groupOwner = getElementById(originalElement.groupId)
      if (returnGroupOption === "owner") {
        return groupOwner ? [groupOwner] : []
      }

      if (returnGroupOption === "members" && groupOwner instanceof Polyline) {
        return groupOwner.elements
      }

      return groupOwner ? [groupOwner] : []
    }
    //#endregion

    return {
      elements: new Map(),
      groupedElements: new Map(),
      snappedPoint: null,
      currentlyCreatedElement: null,
      currentlyEditedElements: null,
      currentlyCopiedElements: null,
      currentlyReplacedElements: null,
      getElementById(elementId) {
        const elements = get().elements
        const groupedElements = get().groupedElements

        let element = elements.get(elementId)
        if (!element) {
          element = groupedElements.get(elementId)
        }

        return element || null
      },
      getElementsContainingPoint(
        pointX,
        pointY,
        options = {
          maxPointsDiff: SELECT_DELTA,
          returnGroup: "owner",
        }
      ) {
        const { maxPointsDiff = SELECT_DELTA, returnGroup = "owner" } = options
        const getElementById = get().getElementById

        const elementIdsInDivision = container.getElementsNearPoint(pointX, pointY)
        if (!elementIdsInDivision) {
          return null
        }

        const point = createPoint(pointX, pointY)

        let elementsWithPoint: Element[] = []
        for (const elementId of elementIdsInDivision) {
          const element = getElementById(elementId)
          if (!element) {
            throw new Error(CONTAINER_STATE_MISMATCH_ERROR)
          }

          if (!element.checkIfPointOnElement(point, maxPointsDiff)) {
            continue
          }

          const elementsToAdd = getElementsFromReturnGroupOptions(element, returnGroup)
          elementsWithPoint = elementsWithPoint.concat(elementsToAdd)
        }

        return elementsWithPoint.length > 0 ? elementsWithPoint : null
      },
      getElementsInContainer(
        boxStartPoint,
        boxEndPoint,
        options = {
          shouldSkipPartial: true,
          returnGroup: "owner",
        }
      ) {
        const { shouldSkipPartial = true, returnGroup = "owner" } = options
        const startPoint = {
          x: Math.min(boxStartPoint.x, boxEndPoint.x),
          y: Math.min(boxStartPoint.y, boxEndPoint.y),
        }
        const endPoint = {
          x: Math.max(boxStartPoint.x, boxEndPoint.x),
          y: Math.max(boxStartPoint.y, boxEndPoint.y),
        }

        const elementIds = container.getElementsInContainer(startPoint, endPoint)
        if (!elementIds) {
          return null
        }

        let elementsInContainer: Element[] = []
        const getElementById = get().getElementById
        for (const elementId of elementIds) {
          const element = getElementById(elementId)
          if (!element) {
            throw new Error(CONTAINER_STATE_MISMATCH_ERROR)
          }

          const boundingBox = element.getBoundingBox()

          const isLeftInContainer = boundingBox.left >= startPoint.x
          const isTopInContainer = boundingBox.top >= startPoint.y
          const isRightInContainer = boundingBox.right <= endPoint.x
          const isBottomInContainer = boundingBox.bottom <= endPoint.y

          if (isLeftInContainer && isTopInContainer && isRightInContainer && isBottomInContainer) {
            const elementsToAdd = getElementsFromReturnGroupOptions(element, returnGroup)
            elementsInContainer = elementsInContainer.concat(elementsToAdd)
            continue
          }

          if (shouldSkipPartial) {
            continue
          }

          const selectionContainer = createElement(
            Rectangle,
            createPoint(startPoint.x, startPoint.y, { assignId: false })
          )
          selectionContainer.setLastAttribute(endPoint.x, endPoint.y)
          const intersections = ElementIntersector.getIntersections(
            element,
            selectionContainer as FullyDefinedRectangle
          )
          if (intersections) {
            const elementsToAdd = getElementsFromReturnGroupOptions(element, returnGroup)
            elementsInContainer = elementsInContainer.concat(elementsToAdd)
          }
        }

        return elementsInContainer.length > 0 ? elementsInContainer : null
      },
      getElementsNearElement(
        element,
        options = {
          skipSiblings: true,
          returnGroup: "owner",
        }
      ) {
        const { returnGroup = "owner", skipSiblings = true } = options

        const nearbyElementIds = container.getElementIdsNearElement(element)

        const getElementById = get().getElementById
        let nearbyElements: Element[] = []
        for (const elementId of nearbyElementIds) {
          const nearbyElement = getElementById(elementId)
          if (!nearbyElement) {
            throw new Error(CONTAINER_STATE_MISMATCH_ERROR)
          }

          const isSibling = nearbyElement.groupId && nearbyElement.groupId === element.groupId
          if (skipSiblings && isSibling) {
            continue
          }

          const elementsToAdd = getElementsFromReturnGroupOptions(nearbyElement, returnGroup)

          nearbyElements = nearbyElements.concat(elementsToAdd)
        }

        return nearbyElements
      },
      addCurrentlyCreatedElement(createdElement) {
        set({ currentlyCreatedElement: createdElement })
      },
      removeCurrentlyCreatedElement() {
        set({
          currentlyCreatedElement: null,
          snappedPoint: null,
        })
      },
      startEditingElements(editedElements, shouldHideOriginal = true, shouldCopyElements = true) {
        set((state) => {
          const { elements } = state
          const currentlyEditedElements = new Map<string, ElementWithId>()
          for (const editedElement of editedElements) {
            const editedElementCopy = shouldCopyElements
              ? (ElementManipulator.copyElement(editedElement, { keepIds: true }) as ElementWithId)
              : editedElement

            currentlyEditedElements.set(editedElement.id, editedElementCopy)

            if (shouldHideOriginal) {
              const element = elements.get(editedElement.id)
              if (!element) {
                throw new Error('Trying to edit an element that is not in the elements state')
              }

              element.isShown = false
            }
          }

          state.currentlyEditedElements = currentlyEditedElements
        })
      },
      changeEditingElements(newEditingElements) {
        set((state) => {
          if (newEditingElements instanceof Map) {
            state.currentlyEditedElements = newEditingElements
            return
          }

          const { currentlyEditedElements } = state

          let newCurrentlyEdited = currentlyEditedElements || new Map<string, ElementWithId>()
          for (const newEditingElement of newEditingElements) {
            newCurrentlyEdited.set(newEditingElement.id, newEditingElement)
          }

          state.currentlyEditedElements = newCurrentlyEdited
        })
      },
      stopEditingElements() {
        set((state) => {
          const { elements, currentlyEditedElements } = state
          if (!currentlyEditedElements) {
            return
          }

          for (const elementId of elements.keys()) {
            const element = elements.get(elementId)!
            element.isShown = true
          }

          state.currentlyEditedElements = null
          state.snappedPoint = null
        })
      },
      completeEditingElements() {
        const currentlyEditedElements = get().currentlyEditedElements
        if (!currentlyEditedElements) {
          return []
        }

        set((state) => {
          const { elements, groupedElements, currentlyEditedElements } = state

          for (const elementId of currentlyEditedElements!.keys()) {
            const editedElement = currentlyEditedElements!.get(elementId)!
            elements.set(elementId, editedElement)

            if (editedElement instanceof Polyline) {
              editedElement.elements.forEach((editedSubElement) => {
                groupedElements.set(editedSubElement.id!, editedSubElement as ElementWithId)
              })
            }
          }

          state.currentlyEditedElements = null
          state.snappedPoint = null
        })

        const editedElementsArray = Array.from(
          currentlyEditedElements.values()
        )
        if (editedElementsArray.length > 0) {
          container.changeElements(
            editedElementsArray
          )
        }

        return editedElementsArray
      },
      isEditingElement(element) {
        const currentlyEditedElements = get().currentlyEditedElements
        if (!currentlyEditedElements) {
          return false
        }

        return currentlyEditedElements.has(element.id)
      },
      startCopyingElements(elements) {
        const newCopiedElements: Element[] = []
        for (const elementToCopy of elements) {
          const copyOfElement = ElementManipulator.copyElement(elementToCopy, { assignId: true })
          newCopiedElements.push(copyOfElement)
        }

        set({
          currentlyCopiedElements: {
            original: elements,
            current: newCopiedElements,
            positioned: [],
          },
        })
      },
      moveCopyingElements(dX, dY) {
        set((state) => {
          const { currentlyCopiedElements } = state
          if (!currentlyCopiedElements || !currentlyCopiedElements.current) {
            return
          }

          for (const currentElement of currentlyCopiedElements.current) {
            currentElement.move(dX, dY)
          }
        })
      },
      continueCopyingElements() {
        const currentlyCopiedElements = get().currentlyCopiedElements
        if (!currentlyCopiedElements) {
          return
        }

        const { original, current, positioned } = currentlyCopiedElements
        const newPositionedElements = [...positioned, ...current]
        const newCurrent: Element[] = []

        for (const currentCopy of current) {
          const copyOfElement = ElementManipulator.copyElement(currentCopy, { assignId: true })
          newCurrent.push(copyOfElement)
        }

        set({
          currentlyCopiedElements: {
            original,
            current: newCurrent,
            positioned: newPositionedElements,
          },
        })
      },
      completeCopyingElements() {
        const positionedCopies: Element[] = get().currentlyCopiedElements?.positioned || []

        set({
          currentlyCopiedElements: null,
        })

        return positionedCopies.map(el => ElementManipulator.copyElement(el, { keepIds: false, assignId: false }))
      },
      startReplacingElements(replacements) {
        set((state) => {
          const { elements, groupedElements, currentlyReplacedElements } = state

          const currentReplacements = currentlyReplacedElements?.currentReplacements || new Map()

          for (const [replacedId, replacement] of replacements.entries()) {
            const { replacingElements, removedSections, diffElements } = replacement
            currentReplacements.set(replacedId, {
              replacingElements,
              removedSections,
              diffElements,
            })

            const replacedElement = elements.get(replacedId) || groupedElements.get(replacedId)
            if (!replacedElement) {
              throw new Error('Trying to replace an element that is not part of the elements state')
            }

            replacedElement.isShown = false
          }

          const completed = currentlyReplacedElements?.completed

          state.currentlyReplacedElements = {
            currentReplacements,
            ...(!!completed && { completed }),
          }
        })
      },
      clearReplacingElements(elementsToKeep) {
        set((state) => {
          const { currentlyReplacedElements, elements, groupedElements } = state

          if (!currentlyReplacedElements || !currentlyReplacedElements?.currentReplacements) {
            return
          }

          const { currentReplacements, completed } = currentlyReplacedElements

          const idsToKeep = new Set<string>(elementsToKeep?.map((el) => el.id) || [])
          for (const [replacedId, replacement] of currentReplacements.entries()) {
            /* ---- <PRUNE NEW ADDITION> */
            if (idsToKeep.has(replacedId)) {
              continue
            }

            currentReplacements.delete(replacedId)

            /* ---- </PRUNE NEW ADDITION> */
            const element = elements.get(replacedId) || groupedElements.get(replacedId)
            if (!element) {
              throw new Error('Attempting to replace an element that is not in the elements state')
            }

            element.isShown = true

            const { replacingElements } = replacement
            for (const replacingElement of replacingElements) {
              elements.delete(replacingElement.id)

              if (replacingElement instanceof Polyline) {
                replacingElement.elements.forEach((e) => groupedElements.delete(e.id!))
              }
            }
          }

          /* ---- <PRUNE NEW ADDITION> */
          let newReplacedElements: typeof currentlyReplacedElements | null = null
          if (!!completed || currentReplacements.size > 0) {
            newReplacedElements = {}

            if (completed) {
              newReplacedElements.completed = completed
            }

            if (currentReplacements.size > 0) {
              newReplacedElements.currentReplacements = currentReplacements
            }
          }

          state.currentlyReplacedElements = newReplacedElements
          /* ---- </PRUNE NEW ADDITION> */
        })
      },
      completeReplacingElements() {
        let completedReplacements: ElementReplacement | null = null
        set((state) => {
          const { elements, currentlyReplacedElements } = state
          if (!currentlyReplacedElements) {
            return
          }

          const { completed, currentReplacements } = currentlyReplacedElements
          if (currentReplacements) {
            for (const replacedId of currentReplacements.keys()) {
              const element = elements.get(replacedId)
              element!.isShown = true
            }
          }

          completedReplacements = completed?.clone() || null
          state.currentlyReplacedElements = null
        })

        return completedReplacements
      },
      updateReplacementSteps(shouldUndo) {
        const currentlyReplacedElements = get().currentlyReplacedElements
        if (!currentlyReplacedElements || !currentlyReplacedElements.completed) {
          return
        }

        const { completed } = currentlyReplacedElements

        let elementsToAdd: Map<string, ElementWithId>, 
            elementsToRemove: Map<string, ElementWithId>
        if (shouldUndo) {
          if (!completed.current) {
            return
          }

          const { added, removed } = completed.current

          elementsToRemove = added
          elementsToAdd = removed
        } else {
          if (!completed.next) return

          const { added, removed } = completed.next

          elementsToRemove = removed
          elementsToAdd = added
        }

        const newCompleted = completed.clone()
        const changeWasMade = shouldUndo ? newCompleted.undo() : newCompleted.redo()
        if (!changeWasMade) {
          return
        }

        set((state) => {
          const { elements, groupedElements } = state
          for (const elementToRemove of elementsToRemove.values()) {
            elements.delete(elementToRemove.id)

            if (elementToRemove instanceof Polyline) {
              for (const subElement of elementToRemove.elements) {
                groupedElements.delete(subElement.id!)
              }
            }
          }

          for (const elementToAdd of elementsToAdd.values()) {
            elements.set(elementToAdd.id, elementToAdd)

            if (elementToAdd instanceof Polyline) {
              for (const subElement of elementToAdd.elements) {
                groupedElements.set(
                  subElement.id!,
                  subElement as Ensure<SubElement, 'id' | 'startPoint' | 'endPoint'>
                )
              }
            }
          }

          state.currentlyReplacedElements = {
            completed: newCompleted,
          }
        })

        // Note: could lead to bug as before ts migration these container changes were made before
        // the state changes
        container.removeElements(Array.from(elementsToRemove.values()))
        container.addElements(Array.from(elementsToAdd.values()))
      },
      continueReplacingElements() {
        const currentlyReplacedElements = get().currentlyReplacedElements
        if (!currentlyReplacedElements?.currentReplacements) {
          return
        }

        const { currentReplacements } = currentlyReplacedElements
        const elements = get().elements
        const groupedElements = get().groupedElements

        // gather all replaced and replacing elements in a structure suitable for updating elements container
        // and assemble all replacements in a key value pair format suitable for parsing later
        //#region
        const replacements: {
          [replacedId: string]: { replacedElement: ElementWithId; replacingElements: ElementWithId[] }
        } = {}
        let allReplacedElements: { [elementId: string]: ElementWithId } = {}
        let allReplacingElements: { [elementId: string]: ElementWithId } = {}
        for (const [replacedId, { replacingElements }] of currentReplacements.entries()) {
          const replacedElement = (elements.get(replacedId) || groupedElements.get(replacedId))!

          const parentReplacedElement = replacedElement.groupId
            ? elements.get(replacedElement.groupId)!
            : replacedElement

          const replacingElementsResult = parseReplacingElementsInContinuation(
            parentReplacedElement,
            replacingElements,
            replacedId
          )

          const { currentElementReplacingElements } = replacingElementsResult
          allReplacingElements = {
            ...allReplacingElements,
            ...replacingElementsResult.allReplacingElements,
          }

          allReplacedElements[parentReplacedElement.id] = parentReplacedElement
          replacements[replacedId] = {
            replacedElement: parentReplacedElement,
            replacingElements: currentElementReplacingElements,
          }
        }

        container.addElements(Object.values(allReplacingElements))
        container.removeElements(Object.values(allReplacedElements))
        //#endregion

        // assemble new state for "completed" property of currentlyReplacedElements
        // and set new state
        //#region
        set((state) => {
          const { elements, groupedElements } = state

          const newCompleteAdded = new Map<string, ElementWithId>()
          const newCompleteRemoved = new Map<string, ElementWithId>()
          for (const [replacedId, { replacingElements, replacedElement }] of Object.entries(replacements)) {
            const replacedCopy = ElementManipulator.copyElement(replacedElement, { keepIds: true, assignId: false }) as ElementWithId
            replacedCopy.isShown = true

            newCompleteRemoved.set(replacedElement.id, replacedCopy)
            elements.delete(replacedElement.id)

            if (groupedElements.has(replacedId)) {
              const groupedElementCopy = ElementManipulator.copyElement(
                groupedElements.get(replacedId) as ElementWithId
              ) as ElementWithId
              groupedElementCopy.isShown = true

              groupedElements.set(replacedId, groupedElementCopy)
            }

            executeOnSubElements(replacedCopy, (subElement) => {
              subElement.isShown = true
              groupedElements.delete(subElement.id!)
            })

            for (const replacingElement of replacingElements) {
              executeOnSubElements(replacingElement, (subElement) => {
                groupedElements.set(subElement.id!, subElement as ElementWithId)
              })

              elements.set(replacingElement.id, replacingElement)
              newCompleteAdded.set(replacingElement.id, replacingElement)
            }
          }

          const { completed } = state.currentlyReplacedElements!
          const newCompleted = completed ? completed.clone() : new ElementReplacement()
          newCompleted.addStep({
            removed: newCompleteRemoved,
            added: newCompleteAdded,
          })

          state.currentlyReplacedElements = {
            completed: newCompleted,
          }
        })
        //#endregion
      },
      isReplacingElement(element) {
        const currentlyReplacedElements = get().currentlyReplacedElements
        if (!currentlyReplacedElements || !element.id) {
          return false
        }

        const { currentReplacements, completed } = currentlyReplacedElements

        let isInCurrentReplacements = false
        if (currentReplacements) {
          isInCurrentReplacements = Array.from(currentReplacements.values()).some((cr) =>
            cr.replacingElements.some((re) => re.id === element.id)
          )
        }

        if (isInCurrentReplacements) {
          return true
        }

        return !!completed?.current?.removed && completed.current.removed.has(element.id)
      },
      setSnappedPoint(snappedPoint) {
        set({
          snappedPoint,
        })
      },
      clearSnappedPoint() {
        set({
          snappedPoint: null,
        })
      },
    }
  }

  return createElementsSlice
}

/**
 * @param parentReplacedElement Element which is being replaced, or its parent element in case of sub-element in polyline
 * @param replacingElements The elements that are replacing the replaced element
 * @param replacedId The id of the replaced element (original in case different from parent)
 * @returns
 *  @param allReplacingElements Key value pair of all elements replacing the replaced element
 *  @param currentElementReplacingElements Array of elements replacing the current replaced element
 */
function parseReplacingElementsInContinuation(
  parentReplacedElement: ElementWithId,
  replacingElements: ElementWithId[],
  replacedId: string
): {
  currentElementReplacingElements: ElementWithId[]
  allReplacingElements: { [key: string]: ElementWithId }
} {
  const currentElementReplacingElements = []
  const allReplacingElements: { [key: string]: ElementWithId } = {}
  for (const replacingElement of replacingElements) {
    if (!replacingElement.groupId) {
      allReplacingElements[replacingElement.id] = replacingElement
      currentElementReplacingElements.push(replacingElement)
      continue
    }

    const polylineId = replacingElement.groupId

    // we are replacing the subElement of a polyline - this polyline is the
    // "parentReplacedElement"; we need to substitute the old subElement
    // with the new one to get the new polyline state
    let polylineCopy: Ensure<FullyDefinedPolyline, 'id'>
    if (allReplacingElements[polylineId]) {
      polylineCopy = allReplacingElements[polylineId] as Ensure<FullyDefinedPolyline, 'id'>
    } else {
      polylineCopy = ElementManipulator.copyPolyline(
        parentReplacedElement as Ensure<FullyDefinedPolyline, 'basePoint'>,
        true,
        true
      ) as Ensure<FullyDefinedPolyline, 'id'>

      allReplacingElements[polylineId] = polylineCopy
    }
    
    polylineCopy.replaceElement(replacingElement as Ensure<SubElement, 'startPoint' | 'endPoint'>, replacedId)

    currentElementReplacingElements.push(polylineCopy)
  }

  return {
    currentElementReplacingElements,
    allReplacingElements,
  }
}

function executeOnSubElements(element: Element, callback: (subElement: SubElement) => void) {
  if (element instanceof Polyline) {
    for (const subElement of element.elements) {
      callback(subElement)
    }
  }
}
