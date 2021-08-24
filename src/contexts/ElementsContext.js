import React, { useState, useContext, createContext, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

import useElements from '../hooks/useElements'
import useSelectionPoints from '../hooks/useSelectionPoints'
import useSelection from '../hooks/useSelection'
import HashGrid from '../utils/hashGrid'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../utils/constants'
import HashGridElementContainer from '../utils/elementContainers/hashGrid'

const HASH_GRID_DIV_SIZE_X = 50
const HASH_GRID_DIV_SIZE_Y = 25


const hashGrid = new HashGrid(
    Math.ceil(CANVAS_WIDTH / HASH_GRID_DIV_SIZE_X),
    HASH_GRID_DIV_SIZE_X,
    Math.ceil(CANVAS_HEIGHT / HASH_GRID_DIV_SIZE_Y),
    HASH_GRID_DIV_SIZE_Y
)

const elementsContainer = new HashGridElementContainer(hashGrid)

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
        currentlyCopiedElements,
        currentlyReplacedElements,
        snappedPoint,
        addCurrentlyCreatedElement,
        removeCurrentlyCreatedElement,
        startEditingElements,
        changeEditingElements,
        stopEditingElements,
        isEditingElement,
        addElements: addElementsToState,
        completeEditingElements,
        getElementById,
        removeElements,
        changeElements,
        startCopyingElements,
        moveCopyingElements,
        continueCopyingElements,
        completeCopyingElements,
        startReplacingElements,
        clearReplacingElements,
        completeReplacingElements,
        continueReplacingElements,
        isReplacingElement,
        setSnappedPoint,
        clearSnappedPoint,
        getElementsContainingPoint,
        getElementsInContainer,
        getNextLineIntersection
    } = useElements(elementsContainer)

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

    const addElementsFromHistory = useCallback((elementsToAdd) => {
        let pointsToAdd = []
        for (const element of elementsToAdd) {
            pointsToAdd = pointsToAdd.concat(element.getSelectionPoints())
        }

        addSelectionPoints(pointsToAdd)
        addElementsToState(elementsToAdd)
    }, [addElementsToState, addSelectionPoints])

    const removeElementsFromHistory = useCallback((elementsToRemove) => {
        // remove selection points of deleted elements
        for (const removedElement of elementsToRemove) {
            const selectionPoints = removedElement.getSelectionPoints()
            removeSelectionPoints(selectionPoints)
        }

        removeElements(elementsToRemove)
        removeSelectedElements(elementsToRemove)
    }, [removeElements, removeSelectedElements, removeSelectionPoints])

    const addElements = useCallback((newElements) => {
        let newSelectionPoints = []
        newElements.forEach(newElement => {
            newElement.id = uuidv4()

            newSelectionPoints = newSelectionPoints.concat(newElement.getSelectionPoints())
        })

        addElementsToState(newElements)
        addSelectionPoints(newSelectionPoints)

        updateHistoryEvents({ action: 'add', elements: newElements })
    }, [addElementsToState, addSelectionPoints, updateHistoryEvents])

    const editElements = useCallback(() => {
        const elementPointsBeforeEdit = {}
        const elementsBeforeEdit = []
        currentlyEditedElements.forEach(cee => {
            const elementBeforeEdit = getElementById(cee.id)
            elementBeforeEdit.isShown = true
            elementsBeforeEdit.push(elementBeforeEdit)

            elementPointsBeforeEdit[cee.id] = elementBeforeEdit.getSelectionPoints()
        })

        // update selection points for edited elements
        const pointsToReplace = selectedPoints
            ? selectedPoints
            : currentlyEditedElements.reduce((acc, cee) => [...acc, ...cee.getSelectionPoints()], [])

        // TODO: Maybe add elementId to selection points to make finding the element easier?
        pointsToReplace.forEach(pointToReplace => {
            const elementOfPoint = currentlyEditedElements.find(cee => cee.getPointById(pointToReplace.pointId))
            if (!elementOfPoint) {
                throw new Error('Trying to change a point which does not belong to a currently edited element')
            }

            const selectionPointsAfterEdit = elementOfPoint.getSelectionPoints()
            const selectionPointsBeforeEdit = elementPointsBeforeEdit[elementOfPoint.id]

            replaceSelectionPoints(selectionPointsAfterEdit, selectionPointsBeforeEdit)
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

    const replaceElements = useCallback(() => {
        if (!currentlyReplacedElements) return

        if (!currentlyReplacedElements.completed) {
            clearReplacingElements()
            return
        }

        const { completed } = currentlyReplacedElements

        let removedSelectionPoints = []
        let newSelectionPoints = []
        for (const removedElement of completed.removedElements) {
            removedElement.isShown = true
    
            removedSelectionPoints = removedSelectionPoints.concat(removedElement.getSelectionPoints())
        }
        
        const replacingElements = Object.values(completed.replacingElements)
        for (const replacingElement of replacingElements) {
            newSelectionPoints = newSelectionPoints.concat(replacingElement.getSelectionPoints())
        }

        removeSelectionPoints(removedSelectionPoints)
        addSelectionPoints(newSelectionPoints)

        updateHistoryEvents({ 
            action: 'replace', 
            removedElements: completed.removedElements, 
            addedElements: replacingElements 
        })

        completeReplacingElements()
    }, [
        addSelectionPoints,
        completeReplacingElements,
        currentlyReplacedElements,
        removeSelectionPoints,
        updateHistoryEvents,
        clearReplacingElements
    ])

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
            addElementsFromHistory(lastHistoryEvent.elements)
            return
        }

        if (updateOperation === 'delete') {
            removeElementsFromHistory(lastHistoryEvent.elements)
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

        if (updateOperation === 'replace') {
            const { addedElements, removedElements } = lastHistoryEvent

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
    }, [
        actionHistory,
        addSelectedElements,
        changeElements,
        getElementById,
        hasSelectedElement,
        replaceSelectionPoints,
        addElementsFromHistory,
        removeElementsFromHistory
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
            // some names clash, such as elementsState.addElements with addElements here

            elements: {
                elements,
                currentlyCreatedElement,
                currentlyEditedElements,
                currentlyCopiedElements,
                currentlyReplacedElements,
                snappedPoint,
                getElementById,
                addCurrentlyCreatedElement,
                removeCurrentlyCreatedElement,
                startEditingElements,
                changeEditingElements,
                stopEditingElements,
                isEditingElement,
                startCopyingElements,
                moveCopyingElements,
                continueCopyingElements,
                completeCopyingElements,
                startReplacingElements,
                clearReplacingElements,
                continueReplacingElements,
                isReplacingElement,
                setSnappedPoint,
                clearSnappedPoint,
                findNearbyPoints,
                getElementsContainingPoint,
                getElementsInContainer,
                getNextLineIntersection
            },
            selection: {
                selectedElements,
                addSelectedElements,
                setSelectedElements,
                removeSelectedElements,
                hasSelectedElement,
                selectedPoints,
                setSelectedPoints,
                clearSelectedPoints,
                clearSelection,
            },
            history: {
                addElements,
                editElements,
                deleteElements,
                replaceElements,
                undo,
                redo,
            }
        }}>
            {children}
        </Context.Provider>
    )
}