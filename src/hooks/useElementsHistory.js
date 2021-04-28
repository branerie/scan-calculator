import { useCallback, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { createTree } from '../utils/pointsSearchTree'

import { CANVAS_WIDTH } from '../utils/constants'
import { useMainContext } from '../contexts/MainContext'

const buildPointsTreeDataObject = (point, pointType) => {
    return {
        leafValue: point.x,
        y: point.y,
        pointId: point.pointId,
        pointType
    }
}

const useElementsHistory = (initialElements, initialGroups) => {
    // TODO: maybe change to object with id as keys?
    const [elements, setElements] = useState(initialElements || [])
    const [historyPointer, setHistoryPointer] = useState(null)
    const [actionHistory, setActionHistory] = useState([])
    const [currentlyCreatedElement, setCurrentlyCreatedElement] = useState(null)
    const [currentlyEditedElements, setCurrentlyEditedElements] = useState(null)
    const pointsTree = useRef(createTree(CANVAS_WIDTH))
    const { 
        selectedElements, 
        selectedPoints, 
        addSelectedElements, 
        removeSelectedElements, 
        hasSelectedElement,
        clearSelectedPoints 
    } = useMainContext() 

    const addElement = (newElement) => {
        newElement.id = uuidv4()
        // TODO: decide where to add id's to polyline elements:
        // on creation or after explode/trim?
        const elementPoints = newElement.getSelectionPoints()
        elementPoints.forEach(elementPoint => {
            pointsTree.current.insert(
                elementPoint.x,
                buildPointsTreeDataObject(elementPoint, elementPoint.pointType)
            )
        })

        setElements(oldElements => [...oldElements, newElement])
        updateHistoryEvents({ action: 'add', element: newElement })
    }

    const editElements = (editedElements, shouldAddToHistory = true) => {
        const editedElementIds = editedElements.map(ee => ee.id)
        const newHistoryEvents = []
        const elementPointsBeforeEdit = {}
        const newElements = elements.map(element => {
            if (!editedElementIds.includes(element.id)) {
                return element
            }

            element.isShown = true
            newHistoryEvents.push({ action: 'edit', element })
            elementPointsBeforeEdit[element.id] = element.getSelectionPoints()
            return editedElements.find(ee => ee.id === element.id)
        })

        selectedPoints.forEach(selectedPoint => {
            const elementOfPoint = currentlyEditedElements.find(cee => cee.getPointById(selectedPoint.pointId))
            if (!elementOfPoint) {
                throw new Error('Mismatch between selectedPoints and currentlyEditedElements.')
            }

            const snappingPoints = elementOfPoint.getSelectionPoints()
            snappingPoints.forEach(sp => {
                const points = elementPointsBeforeEdit[elementOfPoint.id]
                const pointBeforeEdit = points.find(p => p.pointId === sp.pointId)
                pointsTree.current.replace(
                    pointBeforeEdit.x,
                    { pointId: sp.pointId },
                    sp.x,
                    buildPointsTreeDataObject(sp, sp.pointType)
                )
            })
        })
        
        addSelectedElements(editedElements)
        newHistoryEvents.forEach(nhe => updateHistoryEvents(nhe))
        setElements(newElements)

        clearSelectedPoints()
        setCurrentlyEditedElements(null)
    }

    const deleteElement = (elementId) => {
        const elementIndex = elements.findIndex(e => e.id === elementId)
        if (elementIndex < 0) {
            throw new Error(`Element with id ${elementId} does not exist`)
        }

        const deletedElement = elements[elementIndex]
        const newElements = [...elements]
        newElements.splice(elementIndex, 1)

        const snappingPoints = deletedElement.getSelectionPoints()
        for (const snappingPoint of snappingPoints) {
            pointsTree.current.remove(
                snappingPoint.x, 
                { y: snappingPoint.y, pointId: snappingPoint.pointId },
                snappingPoint.pointType
            )
        }

        setElements(newElements)
        
        updateHistoryEvents({ action: 'delete', element: deletedElement })
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

    const findNearbyPoints = (mouseX, mouseY, delta) => {
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

        let newElements
        if (updateOperation === 'add') {
            newElements = [...elements, lastHistoryEvent.element]

            const elementPoints = lastHistoryEvent.element.getSelectionPoints()
            elementPoints.forEach(elementPoint => {
                pointsTree.current.insert(
                    elementPoint.x,
                    buildPointsTreeDataObject(elementPoint, elementPoint.pointType)
                )
            })
        } else if (updateOperation === 'edit') {
            // gets new state of elements after undo/redo operation
            // also, saves state of edited element in elementBeforeUndo in order to put it in history
            // to be able to get the element back to this state using redo/undo
            let elementBeforeUndo = null
            newElements = elements.map(element => {
                if (element.id === lastHistoryEvent.element.id) {
                    elementBeforeUndo = element
                    return lastHistoryEvent.element
                }

                return element
            })

            const pointsAfterUndo = lastHistoryEvent.element.getSelectionPoints()
            elementBeforeUndo.getSelectionPoints().forEach(pointBeforeUndo => {
                const pointAfterUndo = pointsAfterUndo.find(pau => pau.pointId === pointBeforeUndo.pointId)

                pointsTree.current.replace(
                    pointBeforeUndo.x,
                    { pointId: pointBeforeUndo.pointId },
                    pointAfterUndo.x,
                    buildPointsTreeDataObject(pointAfterUndo, pointBeforeUndo.pointType)
                )
            })

            if (hasSelectedElement(lastHistoryEvent.element)) {
                addSelectedElements(lastHistoryEvent.element)
            }

            // change actionHistory by adding elementBeforeUndo so it can be accessed using undo/redo
            const newActionHistory = [...actionHistory]
            newActionHistory[lastEventIndex].element = elementBeforeUndo
            setActionHistory(newActionHistory)
        } else if (updateOperation === 'delete') {
            newElements = elements.filter(e => {
                if (e.id === lastHistoryEvent.element.id) {
                    if (selectedElements) {
                        removeSelectedElements(lastHistoryEvent.element)
                    }
                    return false
                }

                return true
            })

            // remove selection points of deleted element
            const snappingPoints = lastHistoryEvent.element.getSelectionPoints()
            for (const snappingPoint of snappingPoints) {
                pointsTree.current.remove(
                    snappingPoint.x,
                    { y: snappingPoint.y, pointId: snappingPoint.pointId },
                    snappingPoint.pointType
                )
            }
        } else {
            throw new Error('Invalid event action')
        }

        setElements(newElements)
    }

    function updateHistoryEvents(newEvent) {
        let newActionHistory = actionHistory
        if (historyPointer !== null) {
            newActionHistory = actionHistory.slice(0, historyPointer + 1)
            setHistoryPointer(null)
        }

        setActionHistory([...newActionHistory, newEvent])
    }

    return {
        elements,
        setElements,
        currentlyCreatedElement,
        setCurrentlyCreatedElement,
        currentlyEditedElements,
        setCurrentlyEditedElements,
        addElement,
        editElements,
        deleteElement,
        findNearbyPoints,
        undo,
        redo,
    }
}

export default useElementsHistory