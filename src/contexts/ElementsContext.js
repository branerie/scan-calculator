import React, { useState, useContext, createContext, useCallback } from 'react'
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

    const {
        elements,
        currentlyCreatedElement,
        currentlyEditedElements,
        snappedPoint,
        addCurrentlyCreatedElement,
        removeCurrentlyCreatedElement,
        startEditingElements,
        stopEditingElements,
        addElement: addElementToState,
        completeEditingElements,
        getElementById,
        removeElements,
        changeElements,
        setSnappedPoint,
        clearSnappedPoint
    } = useElements()

    const {
        selectedElements,
        selectedPoints,
        addSelectedElements,
        setSelectedElements,
        hasSelectedElement,
        removeSelectedElements,
        clearSelection,
        setSelectedPoints,
        clearSelectedPoints
    } = useSelection()

    const {
        addSelectionPoints,
        removeSelectionPoints,
        replaceSelectionPoints,
        findNearbyPoints
    } = useSelectionPoints()

    const updateHistoryEvents = useCallback((newEvent) => {
        let newActionHistory = actionHistory
        if (historyPointer !== null) {
            newActionHistory = actionHistory.slice(0, historyPointer + 1)
            setHistoryPointer(null)
        }

        setActionHistory([...newActionHistory, newEvent])
    }, [actionHistory, historyPointer])

    const addElement = useCallback((newElement) => {
        newElement.id = uuidv4()

        const elementPoints = newElement.getSelectionPoints()
        addSelectionPoints(elementPoints)

        addElementToState(newElement)
        updateHistoryEvents({ action: 'add', elements: [newElement] })
    }, [addElementToState, addSelectionPoints, updateHistoryEvents])

    const editElements = useCallback(() => {
        const elementPointsBeforeEdit = {}
        currentlyEditedElements.forEach(cee => {
            const elementBeforeEdit = getElementById(cee.id)
            elementPointsBeforeEdit[cee.id] = elementBeforeEdit.getSelectionPoints()
        })

        // update selection points for edited elements
        selectedPoints.forEach(selectedPoint => {
            const elementOfPoint = currentlyEditedElements.find(cee => cee.getPointById(selectedPoint.pointId))
            if (!elementOfPoint) {
                throw new Error('Mismatch between selectedPoints and currentlyEditedElements.')
            }

            const selectionPointsAfterEdit = elementOfPoint.getSelectionPoints()
            const selectionPointsBeforeEdit = elementPointsBeforeEdit[elementOfPoint.id]

            replaceSelectionPoints(selectionPointsAfterEdit, selectionPointsBeforeEdit)
        })

        const elementsBeforeEdit = currentlyEditedElements.map(cee => {
            const elementBeforeEdit = getElementById(cee.id)
            elementBeforeEdit.isShown = true
            return elementBeforeEdit
        })

        updateHistoryEvents({ action: 'edit', elements: elementsBeforeEdit })

        const editedElements = completeEditingElements()
        addSelectedElements(editedElements)
        clearSelectedPoints()
    }, [
        addSelectedElements,
        clearSelectedPoints,
        completeEditingElements,
        currentlyEditedElements,
        getElementById,
        replaceSelectionPoints,
        selectedPoints,
        updateHistoryEvents
    ])

    const deleteElements = useCallback((deletedElements) => {
        // remove selection points of deleted elements
        for (const deletedElement of deletedElements) {
            const selectionPoints = deletedElement.getSelectionPoints()
            removeSelectionPoints(selectionPoints)
        }

        updateHistoryEvents({ action: 'delete', elements: deletedElements })
        removeElements(deletedElements)
    }, [removeElements, removeSelectionPoints, updateHistoryEvents])

    const updateElementsFromHistory = useCallback((lastEventIndex, isUndo) => {
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
            for (const element of lastHistoryEvent.elements) {
                const elementPoints = element.getSelectionPoints()
                addSelectionPoints(elementPoints)
                addElementToState(element)
            }
            
            return
        }

        if (updateOperation === 'edit') {
            // save state of edited elements in elementsBeforeUndo in order to put it in history
            // to be able to get the elements back to this state using redo/undo
            const elementsBeforeUndo = []
            const elementsAfterUndo = lastHistoryEvent.elements

            for (const elementAfterUndo of elementsAfterUndo) {
                const elementBeforeUndo = getElementById(elementAfterUndo.id)
                elementsBeforeUndo.push(elementBeforeUndo)

                const pointsAfterUndo = elementAfterUndo.getSelectionPoints()
                const pointsBeforeUndo = elementBeforeUndo.getSelectionPoints()
                replaceSelectionPoints(pointsAfterUndo, pointsBeforeUndo)
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
            newActionHistory[lastEventIndex].elements = elementsBeforeUndo
            setActionHistory(newActionHistory)

            changeElements(elementsAfterUndo)
            return
        }

        if (updateOperation === 'delete') {
            const elementsToRemove = lastHistoryEvent.elements

            // remove selection points of deleted elements
            for (const removedElement of elementsToRemove) {
                const selectionPoints = removedElement.getSelectionPoints()
                removeSelectionPoints(selectionPoints)
            }

            removeElements(elementsToRemove)
            removeSelectedElements(elementsToRemove)
            return
        }

        throw new Error('Invalid event action')
    }, [
        actionHistory,
        addElementToState,
        addSelectedElements,
        addSelectionPoints,
        changeElements,
        getElementById,
        hasSelectedElement,
        removeElements,
        removeSelectedElements,
        removeSelectionPoints,
        replaceSelectionPoints
    ])

    const undo = useCallback(() => {
        if (historyPointer === 0) {
            return
        }

        const newPointer = historyPointer === null ? actionHistory.length - 1 : historyPointer - 1

        setHistoryPointer(newPointer)
        updateElementsFromHistory(newPointer, true)
    }, [actionHistory.length, historyPointer, updateElementsFromHistory])

    const redo = useCallback(() => {
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
    }, [actionHistory.length, historyPointer, updateElementsFromHistory])

    return (
        <Context.Provider value={{
            // TODO: which of the methods of the two states below do we need further down?
            // some names clash, such as elementsState.addElement with addElement here

            // elements
            elements,
            currentlyCreatedElement,
            currentlyEditedElements,
            snappedPoint,
            addCurrentlyCreatedElement,
            removeCurrentlyCreatedElement,
            startEditingElements,
            stopEditingElements,
            setSnappedPoint,
            clearSnappedPoint,
            // selection
            selectedElements,
            addSelectedElements,
            setSelectedElements,
            hasSelectedElement,
            selectedPoints,
            setSelectedPoints,
            clearSelectedPoints,
            clearSelection,
            // history
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