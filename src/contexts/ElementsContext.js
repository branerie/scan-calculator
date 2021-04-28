import React, { useState, useContext, createContext } from 'react'
import { v4 as uuidv4 } from 'uuid'

import useElements from '../hooks/useElements'
import useSelectionPoints from '../hooks/useSelectionPoints'
import useSelection from '../hooks/useSelection'

const Context = createContext()

export function useElementsContext() {
    return useContext(Context)
}

export default function ElementsContextProvider({ children }) {
    const [historyPointer, setHistoryPointer] = useState(null)
    const [actionHistory, setActionHistory] = useState([])

    const elementsState = useElements()
    const selectionState = useSelection()
    const { addSelectionPoints, removeSelectionPoints, replaceSelectionPoints, findNearbyPoints } = useSelectionPoints()

    const addElement = (newElement) => {
        newElement.id = uuidv4()

        const elementPoints = newElement.getSelectionPoints()
        addSelectionPoints(elementPoints)

        elementsState.addElement(newElement)
        updateHistoryEvents({ action: 'add', elements: [newElement] })
    }

    const editElements = () => {
        const elementPointsBeforeEdit = {}

        elementsState.currentlyEditedElements.forEach(cee => {
            elementPointsBeforeEdit[cee.id] = cee.getSelectionPoints()
        })

        // update selection points for edited elements
        selectionState.selectedPoints.forEach(selectedPoint => {
            const elementOfPoint = elementsState.currentlyEditedElements.find(cee => cee.getPointById(selectedPoint.pointId))
            if (!elementOfPoint) {
                throw new Error('Mismatch between selectedPoints and currentlyEditedElements.')
            }

            const selectionPointsAfterEdit = elementOfPoint.getSelectionPointsAfterEdit()
            const selectionPointsBeforeEdit = elementPointsBeforeEdit[elementOfPoint.id]

            replaceSelectionPoints(selectionPointsAfterEdit, selectionPointsBeforeEdit)
        })

        const elementsBeforeEdit = elementsState.currentlyEditedElements.map(cee => elementsState.getElementById(cee.id))
        updateHistoryEvents({ action: 'edit', elements: elementsBeforeEdit })

        const editedElements = elementsState.completeEditingElements()
        selectionState.addSelectedElements(editedElements)
        selectionState.clearSelectedPoints()
    }

    const deleteElements = (deletedElements) => {
        // remove selection points of deleted elements
        for (const deletedElement of deletedElements) {
            const selectionPoints = deletedElement.getSelectionPoints()
            removeSelectionPoints(selectionPoints)
        }

        updateHistoryEvents({ action: 'delete', elements: deletedElements })
        elementsState.removeElements(deletedElements)
    }

    const undo = () => {
        if (historyPointer === 0) {
            return
        }

        const newPointer = historyPointer === null ? actionHistory.length - 1 : historyPointer - 1

        setHistoryPointer(newPointer)
        updateElementsFromHistory(newPointer, true)
    }

    const redo = () => {
        if (historyPointer === null) {
            return
        }

        updateElementsFromHistory(historyPointer, false)
        setHistoryPointer(pointer => {
            if (pointer === actionHistory.length - 1) {
                return null
            }

            return pointer + 1
        })
    }

    function updateElementsFromHistory(lastEventIndex, isUndo) {
        const lastHistoryEvent = actionHistory[lastEventIndex]
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
            // TODO: For now we can only add one element at a time. Could we ever need to add multiple at a time? 
            const element = lastHistoryEvent.elements[0]

            const elementPoints = element.getSelectionPoints()
            addSelectionPoints(elementPoints)

            elementsState.addElement(element)
            return
        }

        if (updateOperation === 'edit') {
            // save state of edited elements in elementsBeforeUndo in order to put it in history
            // to be able to get the elements back to this state using redo/undo
            const elementsBeforeUndo = []

            for (const elementAfterUndo of lastHistoryEvent.elements) {
                const elementBeforeUndo = elementsState.getElementById(elementAfterUndo.id)
                elementsBeforeUndo.push(elementBeforeUndo)

                const pointsAfterUndo = elementAfterUndo.getSelectionPoints()
                const pointsBeforeUndo = elementBeforeUndo.getSelectionPoints()
                replaceSelectionPoints(pointsAfterUndo, pointsBeforeUndo)
            }

            // if edited element is still selected, updates the selected element with the new element state
            // after undo/redo
            if (selectionState.hasSelectedElement(lastHistoryEvent.element)) {
                selectionState.addSelectedElements(lastHistoryEvent.element)
            }

            // change actionHistory by adding elementsBeforeUndo so it can be accessed using undo/redo
            const newActionHistory = [...actionHistory]
            newActionHistory[lastEventIndex].elements = elementsBeforeUndo
            setActionHistory(newActionHistory)

            elementsState.changeElements(lastHistoryEvent.elements)
            return
        }

        if (updateOperation === 'delete') {
            const elementsToRemove = lastHistoryEvent.elements

            // remove selection points of deleted elements
            for (const removedElement of elementsToRemove) {
                const selectionPoints = removedElement.getSelectionPoints()
                removeSelectionPoints(selectionPoints)
            }

            elementsState.removeElements(elementsToRemove)
            selectionState.removeSelectedElements(elementsToRemove)
            return
        }

        throw new Error('Invalid event action')
    }

    function updateHistoryEvents(newEvent) {
        let newActionHistory = actionHistory
        if (historyPointer !== null) {
            newActionHistory = actionHistory.slice(0, historyPointer + 1)
            setHistoryPointer(null)
        }

        setActionHistory([...newActionHistory, newEvent])
    }

    return (
        <Context.Provider value={{
            // TODO: which of the methods of the two states below do we need further down?
            // some names clash, such as elementsState.addElement with addElement here
            ...elementsState,
            ...selectionState,
            addElement,
            editElements,
            deleteElements,
            undo,
            redo,
            findNearbyPoints
        }}>
            {children}
        </Context.Provider>
    )
}