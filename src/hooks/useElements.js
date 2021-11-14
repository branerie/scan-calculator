import { useCallback, useReducer } from 'react'
import { createElement, createPoint } from '../utils/elementFactory'
import ElementIntersector from '../utils/elementIntersector'
import ElementManipulator from '../utils/elementManipulator'

const RETURN_GROUP_OPTS = {
    INVIDIVUAL: 0,
    MEMBERS: 1,
    OWNER: 2
}

const elementsReducer = (state, action) => {
    switch (action.type) {
        case 'addElements': {
            // should receive whole polylines
            const newStateElements = { ...state.elements }
            const newGroupedElements = {}
            action.newElements.forEach(newElement => {
                newStateElements[newElement.id] = newElement

                if (newElement.baseType === 'polyline') {
                    newElement.elements.forEach(e => newGroupedElements[e.id] = e)
                }
            })

            return {
                ...state,
                elements: newStateElements,
                currentlyCreatedElement: null,
                ...(Object.keys(newGroupedElements).length && { groupedElements: { ...state.groupedElements, ...newGroupedElements } })
            }
        }
        case 'changeElements': {
            // should receive both individual polyline elements and whole polylines
            const newElements = { ...state.elements }
            let newGroupedElements = null
            action.elementsAfterChange.forEach(eac => {
                if (eac.groupId) {
                    if (!newGroupedElements) {
                        newGroupedElements = { ...state.groupedElements }
                    }

                    newGroupedElements[eac.id] = eac
                } else if (eac.baseType === 'polyline') {
                    if (!newGroupedElements) {
                        newGroupedElements = { ...state.groupedElements }
                    }

                    eac.elements.forEach(e => newGroupedElements[e.id] = e)
                }
                
                newElements[eac.id] = eac
            })

            return { 
                ...state, 
                elements: newElements,
                ...(newGroupedElements && { groupedElements: newGroupedElements }) 
            }
        }
        case 'removeElements': {
            // should receive whole polylines
            const { removedElements } = action
            const newElements = { ...state.elements }
            const { currentlyEditedElements } = state
            let newCurrentlyEditedElements = currentlyEditedElements
            let newGroupedElements = null
            for (const removedElement of removedElements) {
                const elementId = removedElement.id
                delete newElements[elementId]

                if (removedElement.baseType === 'polyline') {
                    if (!newGroupedElements) {
                        newGroupedElements = { ...state.groupedElements }
                    }

                    for (const element of removedElement.elements) {
                        delete newGroupedElements[element.id]
                    }
                }

                if (newCurrentlyEditedElements && elementId in newCurrentlyEditedElements) {
                    if (newCurrentlyEditedElements === currentlyEditedElements) {
                        newCurrentlyEditedElements = { ...newCurrentlyEditedElements }
                    }

                    delete newCurrentlyEditedElements[elementId]
                }
            }

            return { 
                ...state, 
                elements: newElements, 
                currentlyEditedElements: newCurrentlyEditedElements,
                ...(newGroupedElements && { groupedElements: newGroupedElements })
            }
        }
        case 'addCurrentlyCreated': {
            return { ...state, currentlyCreatedElement: action.value }
        }
        case 'removeCurrentlyCreated': {
            return { ...state, currentlyCreatedElement: null, snappedPoint: null }
        }
        case 'startEditingElements': {
            const { editedElements, shouldHideOriginal, shouldCopyElements } = action

            const newCurrentlyEditedElements = {}
            const newElements = { ...state.elements }

            for (const editedElement of editedElements) {
                const editedElementCopy = shouldCopyElements 
                                            ? ElementManipulator.copyElement(editedElement, true)
                                            : editedElement
    
                newCurrentlyEditedElements[editedElement.id] = editedElementCopy

                if (shouldHideOriginal) {
                    newElements[editedElement.id].isShown = false
                }
            }

            return { ...state, currentlyEditedElements: newCurrentlyEditedElements, elements: newElements }
        }
        case 'changeEditingElements': {
            const newCurrentlyEditedElements = state.currentlyEditedElements ? { ...state.currentlyEditedElements } : {}

            for (const newEditingElement of action.newEditingElements) {
                newCurrentlyEditedElements[newEditingElement.id] = newEditingElement
            }

            return { ...state, currentlyEditedElements: newCurrentlyEditedElements }
        }
        case 'stopEditingElements': {
            if (!state.currentlyEditedElements) {
                return state
            }

            const newElements = { ...state.elements }
            for (const elementId of Object.keys(state.currentlyEditedElements)) {
                newElements[elementId].isShown = true
            }

            return { ...state, elements: newElements, currentlyEditedElements: null, snappedPoint: null }
        }
        case 'completeEditingElements': {
            const { currentlyEditedElements } = state
            if (!currentlyEditedElements) {
                return state
            }

            const newElements = { ...state.elements }
            const newGroupedElements = { ...state.groupedElements }
            for (const elementId of Object.keys(currentlyEditedElements)) {
                const editedElement = currentlyEditedElements[elementId]
                newElements[elementId] = editedElement

                if (editedElement.baseType === 'polyline') {
                    editedElement.elements.forEach(editedSubElement => {
                        newGroupedElements[editedSubElement.id] = editedSubElement
                    })
                }
            }

            return { 
                ...state, 
                elements: newElements, 
                groupedElements: newGroupedElements,
                currentlyEditedElements: null, 
                snappedPoint: null 
            }
        }
        case 'startCopyingElements': {
            const { elementsToCopy } = action
            const newCopiedElements = []
            elementsToCopy.forEach(element => {
                const copyOfElement = ElementManipulator.copyElement(element, false)
                newCopiedElements.push(copyOfElement)
            })

            return {
                ...state,
                currentlyCopiedElements: {
                    original: elementsToCopy,
                    current: newCopiedElements,
                    positioned: []
                }
            }
        }
        case 'moveCopyingElements': {
            const { currentlyCopiedElements } = state
            if (!currentlyCopiedElements) {
                return state
            }

            const { newCurrentElements } = action

            return {
                ...state,
                currentlyCopiedElements: {
                    ...currentlyCopiedElements,
                    current: newCurrentElements
                }
            }
        }
        case 'continueCopyingElements': {
            if (!state.currentlyCopiedElements) {
                return state
            }

            const { original, current, positioned } = state.currentlyCopiedElements
            const newPositionedElements = [...positioned, ...current]

            const newCurrent = []
            current.forEach(element => {
                const copyOfElement = ElementManipulator.copyElement(element, false)
                newCurrent.push(copyOfElement)
            })

            return {
                ...state,
                currentlyCopiedElements: {
                    original,
                    current: newCurrent,
                    positioned: newPositionedElements
                }
            }
        }
        case 'completeCopyingElements': {
            return { ...state, currentlyCopiedElements: null }
        }
        case 'startReplacingElements': {
            const { currentlyReplacedElements } = state
            const currentReplacements = (currentlyReplacedElements && currentlyReplacedElements.currentReplacements)
                        ? { ...currentlyReplacedElements.currentReplacements }
                        : {}
            
            const newElements = { ...state.elements }
            const newGroupedElements = { ...state.groupedElements }
            for (const replacedId of Object.keys(action.replacements)) {
                const { replacingElements, removedSections } = action.replacements[replacedId]
                
                if (currentReplacements[replacedId]) {
                    for (const oldReplacingElement of currentReplacements[replacedId].replacingElements) {
                        if (newElements[oldReplacingElement.id]) {
                            delete newElements[oldReplacingElement.id]
                        } else {
                            delete newGroupedElements[oldReplacingElement.id]
                        }

                        if (oldReplacingElement.baseType === 'polyline') {
                            oldReplacingElement.elements.forEach(e => delete newGroupedElements[e.id])
                        }
                    }
                } else {
                    // const oldElement = (newElements[replacedId] || newElements[newGroupedElements[replacedId].groupId])
                    const oldElement = newElements[replacedId] || newGroupedElements[replacedId]
                    oldElement.isShown = false
                }
                
                for (const replacingElement of replacingElements) {
                    if (replacingElement.groupId) {
                        newGroupedElements[replacingElement.id] = replacingElement
                    } else {
                        newElements[replacingElement.id] = replacingElement
                    }

                    if (replacingElement.baseType === 'polyline') {
                        replacingElement.elements.forEach(e => newGroupedElements[e.id] = e)
                    }
                }
                
                currentReplacements[replacedId] = { replacingElements, removedSections }
            }
            
            const completed = state.currentlyReplacedElements ? state.currentlyReplacedElements.completed : null
            return {
                ...state,
                elements: newElements,
                groupedElements: newGroupedElements,
                currentlyReplacedElements: {
                    currentReplacements,
                    ...(!!(completed) && { completed })
                }
            }
        }
        case 'clearReplacingElements': {
            if (!state.currentlyReplacedElements || !state.currentlyReplacedElements.currentReplacements) return state

            const { currentlyReplacedElements: { currentReplacements, completed } } = state

            const { elementsToKeep } = action
            let replacementsToKeep = null
            let replacementsToRemove = currentReplacements
            if (elementsToKeep && currentReplacements) {
                replacementsToKeep = {}
                replacementsToRemove = { ...currentReplacements }

                for (const elementToKeep of elementsToKeep) {
                    if (!(elementToKeep.id in replacementsToRemove)) {
                        continue
                    }

                    replacementsToKeep[elementToKeep.id] = replacementsToRemove[elementToKeep.id]
                    delete replacementsToRemove[elementToKeep.id]
                }
            }

            const newElements = { ...state.elements }
            const newGroupedElements = { ...state.groupedElements }  
            for (const replacedId of Object.keys(replacementsToRemove)) {
                // const replacedParentElement = (
                //     newElements[replacedId] || 
                //     newElements[state.groupedElements[replacedId].groupId]
                // )

                // replacedParentElement.isShown = true
                const replacedElement = newElements[replacedId] || newGroupedElements[replacedId]
                replacedElement.isShown = true

                const replacingElements = replacementsToRemove[replacedId].replacingElements
                for (const replacingElement of replacingElements) {
                    if (newElements[replacingElement.id]) {
                        delete newElements[replacingElement.id]
                    } else {
                        delete newGroupedElements[replacingElements.id]
                    }
                }
            }

            return { 
                ...state, 
                elements: newElements,
                groupedElements: newGroupedElements,
                // currentlyReplacedElements: completed ? { completed } : null
                currentlyReplacedElements: completed || replacementsToKeep ? {
                    ...(!!(completed) && { completed }),
                    ...(!!(replacementsToKeep) && { currentReplacements: replacementsToKeep })
                } : null
            }
        }
        case 'continueReplacingElements': {
            if (!state.currentlyReplacedElements || !state.currentlyReplacedElements.currentReplacements) return state

            const { currentlyReplacedElements: { currentReplacements, completed } } = state

            const newCompleted = completed ? { 
                removedElements: [ ...completed.removedElements ], 
                replacingElements: { ...completed.replacingElements } 
            } : { 
                removedElements: [], 
                replacingElements: {} 
            }

            for (const [replacedId, { replacingElements }] of Object.entries(currentReplacements)) {
                if (newCompleted.replacingElements[replacedId]) {
                    // we are trimming an element which was formed by trimming another element in the current command
                    delete newCompleted.replacingElements[replacedId]

                } else {
                    let removedElement = state.elements[replacedId] || state.groupedElements[replacedId]
                    if (removedElement.groupId) {
                        removedElement = state.elements[removedElement.groupId]
                    }

                    newCompleted.removedElements.push(removedElement)
                }
                
                replacingElements.forEach(re => {
                    if (re.groupId) {
                        const parentElementCopy = ElementManipulator.copyPolyline(state.elements[re.groupId], false)
                        parentElementCopy.replaceElement(re, replacedId)

                        newCompleted.replacingElements[re.groupId] = parentElementCopy
                    } else {
                        newCompleted.replacingElements[re.id] = re
                    }
                })
            }

            return { ...state, currentlyReplacedElements: { completed: newCompleted } }            
        }
        case 'completeReplacingElements': {
            if (!state.currentlyReplacedElements) return state

            const { completed, currentReplacements } = state.currentlyReplacedElements
            let newElements = null
            let newGroupedElements = null
            if (currentReplacements) {
                newElements = { ...state.elements }
                newGroupedElements = { ...state.groupedElements }   
                for (const replacedId of Object.keys(currentReplacements)) {
                    const replacedElement = newElements[replacedId] || newGroupedElements[replacedId]
                    replacedElement.isShown = true
                }
            }

            if (!completed) {
                return {  
                    ...state, 
                    elements: newElements || state.elements,
                    groupedElements: newGroupedElements || state.groupedElements,
                    currentlyReplacedElements: null, 
                }
            }
            
            if (!newElements) {
                newElements = { ...state.elements }
                newGroupedElements = { ...state.groupedElements }  
            }

            for (const removedElement of completed.removedElements) {
                delete newElements[removedElement.id]

                if (removedElement.baseType === 'polyline') {
                    removedElement.elements.forEach(e => delete newGroupedElements[e.id])
                }
            }   
            
            return {
                ...state,
                elements: newElements,
                groupedElements: newGroupedElements,
                currentlyReplacedElements: null
            }
        }
        case 'setSnappedPoint': {
            return { ...state, snappedPoint: action.value }
        }
        case 'clearSnappedPoint': {
            return { ...state, snappedPoint: null }
        }
        default:
            return state
    }
}

const useElements = (elementsContainer) => {
    const [elementsState, elementsDispatch] = useReducer(elementsReducer, {
        elements: {},
        groupedElements: {},
        currentlyCreatedElement: null,
        currentlyEditedElements: null,
        currentlyCopiedElements: null,
        currentlyReplacedElements: null,
        snappedPoint: null,
    })

    const addElements = useCallback((newElements) => {
        elementsDispatch({ type: 'addElements', newElements })
        elementsContainer.addElements(newElements)
    }, [elementsContainer])

    const removeElements = useCallback((removedElements) => {
        elementsDispatch({ type: 'removeElements', removedElements })
        elementsContainer.removeElements(removedElements)
    }, [elementsContainer])

    const changeElements = useCallback((elementsAfterChange) => {
        elementsDispatch({ type: 'changeElements', elementsAfterChange })
        elementsContainer.changeElements(elementsAfterChange)
    }, [elementsContainer])

    const getElementById = useCallback((elementId) => {
        return elementsState.elements[elementId] || elementsState.groupedElements[elementId]
    }, [elementsState.elements, elementsState.groupedElements])

    const getElementsFromReturnGroupOptions = useCallback((originalElement, returnGroupOption) => {
        if (!originalElement.groupId || returnGroupOption === RETURN_GROUP_OPTS.INVIDIVUAL) {
            return [originalElement]
        }

        const groupOwner = getElementById(originalElement.groupId)
        if (returnGroupOption === RETURN_GROUP_OPTS.OWNER) {
            return [groupOwner]
        }
        
        if (returnGroupOption === RETURN_GROUP_OPTS.MEMBERS) {
            return groupOwner.elements
        } else {
            throw new Error('Invalid value for returnGroup parameter - ' + returnGroupOption)
        }
    }, [getElementById])

    const getElementsContainingPoint = useCallback((
            pointX, 
            pointY, 
            { maxPointsDiff, returnGroup = RETURN_GROUP_OPTS.OWNER } = {}
        ) => {
        /*
        returnGroup:
            0 - returns group members contained in point
            1 - returns all group members 
            2 - returns group owner (polyline)
        */
        const elementIdsInDivision = elementsContainer.getElementsNearPoint(pointX, pointY)
        if (!elementIdsInDivision) return null

        const point = createPoint(pointX, pointY)

        let elementsWithPoint = []
        for (const elementId of elementIdsInDivision) {
            const element = getElementById(elementId)

            if (!element.checkIfPointOnElement(point, maxPointsDiff)) continue

            const elementsToAdd = getElementsFromReturnGroupOptions(element, returnGroup)
            elementsWithPoint = elementsWithPoint.concat(elementsToAdd)
        }

        return elementsWithPoint.length > 0 ? elementsWithPoint : null
    }, [elementsContainer, getElementById, getElementsFromReturnGroupOptions])

    const getElementsInContainer = useCallback((
            boxStartPoint, 
            boxEndPoint, 
            { shouldSkipPartial = true, returnGroup = RETURN_GROUP_OPTS.OWNER } = {}
        ) => {
        /*
        returnGroup:
            0 - returns group members contained in point
            1 - returns all group members 
            2 - returns group owner (polyline)
        shouldSkipPartial: true if only elements completely contained within selection window should be returned
        */
        const startPoint = { x: Math.min(boxStartPoint.x, boxEndPoint.x), y: Math.min(boxStartPoint.y, boxEndPoint.y) }
        const endPoint = { x: Math.max(boxStartPoint.x, boxEndPoint.x), y: Math.max(boxStartPoint.y, boxEndPoint.y) }

        const elementIds = elementsContainer.getElementsInContainer(startPoint, endPoint)
        if (!elementIds) return null

        let elementsInContainer = []
        for (const elementId of elementIds) {
            const element = getElementById(elementId)

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

            if (shouldSkipPartial) continue

            const container = createElement('rectangle', startPoint.x, startPoint.y)
            container.setLastAttribute(endPoint.x, endPoint.y)
            const intersections = ElementIntersector.getIntersections(element, container)
            if (intersections) {
                const elementsToAdd = getElementsFromReturnGroupOptions(element, returnGroup)
                elementsInContainer = elementsInContainer.concat(elementsToAdd)
            }
        }

        return elementsInContainer.length > 0 ? elementsInContainer : null
    }, [elementsContainer, getElementById, getElementsFromReturnGroupOptions])

    const getElementsNearElement = useCallback((
        element, 
        { skipSiblings = true, returnGroup = RETURN_GROUP_OPTS.OWNER } = {}) => {
        const nearbyElementIds = elementsContainer.getElementIdsNearElement(element)

        let elements = []
        for (const elementId of nearbyElementIds) {
            const nearbyElement = elementsState.elements[elementId] || elementsState.groupedElements[elementId]
            if (
                skipSiblings && 
                nearbyElement.groupId && 
                nearbyElement.groupId === element.groupId
            ) {
                continue
            }

            const elementsToAdd = getElementsFromReturnGroupOptions(nearbyElement, returnGroup)

            elements = elements.concat(elementsToAdd)
        }

        return elements
    }, [elementsContainer, elementsState.elements, elementsState.groupedElements, getElementsFromReturnGroupOptions])

    const addCurrentlyCreatedElement = (createdElement) =>
            elementsDispatch({ type: 'addCurrentlyCreated', value: createdElement })
    const removeCurrentlyCreatedElement = () => elementsDispatch({ type: 'removeCurrentlyCreated' })
    const startEditingElements = (editedElements, shouldHideOriginal = true, shouldCopyElements = true) =>
            elementsDispatch({ type: 'startEditingElements', editedElements, shouldHideOriginal, shouldCopyElements })
    const changeEditingElements = (newEditingElements) =>
            elementsDispatch({ type: 'changeEditingElements', newEditingElements })
    const stopEditingElements = () => elementsDispatch({ type: 'stopEditingElements' })
    const isEditingElement = (element) => {
        const { currentlyEditedElements } = elementsState

        if (!currentlyEditedElements) return false

        return element.id in currentlyEditedElements
    }
    
    const startCopyingElements = (elementsToCopy) => elementsDispatch({ type: 'startCopyingElements', elementsToCopy })
    const moveCopyingElements = (dX, dY) => {
        const newCurrentElements = [...elementsState.currentlyCopiedElements.current]
        for (const currentElement of newCurrentElements) {
            currentElement.move(dX, dY)
        }

        elementsDispatch({ type: 'moveCopyingElements', newCurrentElements })
    }

    const continueCopyingElements = () => elementsDispatch({ type: 'continueCopyingElements' })
    const completeCopyingElements = () => {
        const positionedCopies = elementsState.currentlyCopiedElements
            ? elementsState.currentlyCopiedElements.positioned
            : []

        elementsDispatch({ type: 'completeCopyingElements' })
        return positionedCopies
    }

    const completeEditingElements = () => {
        const editedElements = Object.values(elementsState.currentlyEditedElements)

        elementsDispatch({ type: 'completeEditingElements' })
        elementsContainer.changeElements(editedElements)

        return editedElements
    }

    const startReplacingElements = (replacements) => 
                    elementsDispatch({ type: 'startReplacingElements', replacements })
    const pruneReplacingElements = (elementsToKeep) => 
                    elementsDispatch({ type: 'clearReplacingElements', elementsToKeep })
    const clearReplacingElements = () => {
        if (!elementsState.currentlyReplacedElements || !elementsState.currentlyReplacedElements.currentReplacements) return

        elementsDispatch({ type: 'clearReplacingElements' })
    }

    const completeReplacingElements = () => {
        const { currentlyReplacedElements } = elementsState
        if (!currentlyReplacedElements) return

        const { completed } = currentlyReplacedElements
        
        elementsDispatch({ type: 'completeReplacingElements' })

        return completed
    }

    const continueReplacingElements = () => {
        const { currentlyReplacedElements } = elementsState
        if (!currentlyReplacedElements || !currentlyReplacedElements.currentReplacements) return

        const { currentReplacements } = currentlyReplacedElements
        const replacingElements = Object.values(currentReplacements).reduce((acc, cr) => [...acc, ...cr.replacingElements], [])
        const replacedIds = Object.keys(currentReplacements)

        elementsDispatch({ type: 'continueReplacingElements' })
        elementsContainer.addElements(replacingElements)

        for (const replacedId of replacedIds) {
            // const element = elementsState.elements[replacedId] || elementsState.groupedElements[replacedId]  
            // if (element.baseType === 'polyline') {
            //     elementsContainer.removeElements(element.elements)
            //     continue
            // }

            elementsContainer.removeElementById(replacedId)
        }
    }

    const isReplacingElement = (element) => {
        const { currentlyReplacedElements } = elementsState
        if (!currentlyReplacedElements || !currentlyReplacedElements.currentReplacements) return false

        const { currentReplacements } = currentlyReplacedElements



        // TODO: Change replacement logic to avoid nested looping
        return Object.values(currentReplacements).some(cr => cr.replacingElements.some(re => re.id === element.id))
    }

    const setSnappedPoint = (snappedPoint) => elementsDispatch({ type: 'setSnappedPoint', value: snappedPoint })
    const clearSnappedPoint = () => elementsDispatch({ type: 'clearSnappedPoint' })

    return {
        elements: Object.values(elementsState.elements),
        currentlyCreatedElement: elementsState.currentlyCreatedElement,
        currentlyEditedElements: elementsState.currentlyEditedElements
            ? Object.values(elementsState.currentlyEditedElements)
            : null,
        currentlyCopiedElements: elementsState.currentlyCopiedElements
            ? elementsState.currentlyCopiedElements
                .current
                .concat(elementsState.currentlyCopiedElements.positioned)
            : null,
        currentlyReplacedElements: elementsState.currentlyReplacedElements,
        snappedPoint: elementsState.snappedPoint,
        addElements,
        removeElements,
        changeElements,
        getElementById,
        addCurrentlyCreatedElement,
        removeCurrentlyCreatedElement,
        startEditingElements,
        changeEditingElements,
        stopEditingElements,
        completeEditingElements,
        isEditingElement,
        startCopyingElements,
        moveCopyingElements,
        continueCopyingElements,
        completeCopyingElements,
        startReplacingElements,
        clearReplacingElements,
        pruneReplacingElements,
        completeReplacingElements,
        continueReplacingElements,
        isReplacingElement,
        setSnappedPoint,
        clearSnappedPoint,
        getElementsContainingPoint,
        getElementsInContainer,
        getElementsNearElement
    }
}

export default useElements