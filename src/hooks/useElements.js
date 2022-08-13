import { useCallback, useReducer } from 'react'
import { createElement, createPoint } from '../utils/elementFactory'
import ElementIntersector from '../utils/elementIntersector'
import ElementManipulator from '../utils/elementManipulator'
import ElementReplacement from '../utils/elementReplacement'

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
                if (newElement.groupId) {
                    newGroupedElements[newElement.id] = newElement
                } else {
                    newStateElements[newElement.id] = newElement
    
                    if (newElement.baseType === 'polyline') {
                        newElement.elements.forEach(e => newGroupedElements[e.id] = e)
                    }
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
                if (removedElement.groupId) {
                    if (!newGroupedElements) {
                        newGroupedElements = { ...state.groupedElements }
                    }

                    delete newGroupedElements[elementId]
                } else {
                    delete newElements[elementId]
    
                    if (removedElement.baseType === 'polyline') {
                        if (!newGroupedElements) {
                            newGroupedElements = { ...state.groupedElements }
                        }
    
                        for (const element of removedElement.elements) {
                            delete newGroupedElements[element.id]
                        }
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
                                            ? ElementManipulator.copyElement(editedElement, { keepIds: true })
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
                const copyOfElement = ElementManipulator.copyElement(element, { assignId: true })
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
                const copyOfElement = ElementManipulator.copyElement(element, { assignId: true })
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

                // // if (currentReplacements[replacedId]) {
                //     //     for (const oldReplacingElement of currentReplacements[replacedId].replacingElements) {
                // //         delete newElements[oldReplacingElement.id]
                
                // //         if (oldReplacingElement.baseType === 'polyline') {
                // //             oldReplacingElement.elements.forEach(e => delete newGroupedElements[e.id])
                // //         }
                // //     }
                // // } else {

                // // add replacing elements to element collections so they can be visualized
                // for (const replacingElement of replacingElements) {
                //     newElements[replacingElement.id] = replacingElement

                //     if (replacingElement.baseType === 'polyline') {
                //         replacingElement.elements.forEach(e => newGroupedElements[e.id] = e)
                //     }
                // }

                // const currentElement = newElements[replacedId] || newGroupedElements[replacedId]
                // currentElement.isShown = false
                // // }
                
                currentReplacements[replacedId] = { replacingElements, removedSections }

                const replacedElement = newElements[replacedId] || newGroupedElements[replacedId]
                replacedElement.isShown = false
            }

            const completed = currentlyReplacedElements?.completed || null
                        
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

            const newElements = { ...state.elements }
            const newGroupedElements = { ...state.groupedElements }
            for (const replacedId of Object.keys(currentReplacements)) {
                (newElements[replacedId] || newGroupedElements[replacedId]).isShown = true

                const replacingElements = currentReplacements[replacedId].replacingElements
                for (const replacingElement of replacingElements) {
                    // if (newElements[replacingElement.id]) {
                        delete newElements[replacingElement.id]

                        if (replacingElement.type === 'polyline') {
                            replacingElement.elements.forEach(e => delete newGroupedElements[e.id])
                        }
                     // } else {
                    //     delete newGroupedElements[replacingElement.id]
                    // }
                }
            }

            return { 
                ...state, 
                elements: newElements,
                groupedElements: newGroupedElements,
                currentlyReplacedElements: completed ? { completed } : null 
            }
        }
        case 'continueReplacingElements': {
            if (!state.currentlyReplacedElements || !state.currentlyReplacedElements.currentReplacements) return state

            const { currentlyReplacedElements: { completed } } = state
            
            let newElements = { ...state.elements }
            let newGroupedElements = null
            const newCompleteAdded = {}
            const newCompleteRemoved = {}
            for (const [replacedId, { replacingElements, replacedElement }] of Object.entries(action.replacements)) {
                replacedElement.isShown = true

                newCompleteRemoved[replacedElement.id] = replacedElement
                delete newElements[replacedElement.id]
                if (replacedElement.type === 'polyline') {
                    newGroupedElements = newGroupedElements ?? { ...state.groupedElements }

                    if (newGroupedElements[replacedId]) {
                        // currently replacedId is that of a subElement when using the extend cmd
                        newGroupedElements[replacedId].isShown = true
                    }

                    for (const subElement of replacedElement.elements) {
                        subElement.isShown = true
                        delete newGroupedElements[subElement.id]
                    }

                    // delete newGroupedElements[replacedId]
                }

                for (const replacingElement of replacingElements) {
                    if (replacingElement.type === 'polyline') {
                        newGroupedElements = newGroupedElements ?? { ...state.groupedElements }
                        for (const subElement of replacingElement.elements) {
                            newGroupedElements[subElement.id] = subElement
                        }
                    }

                    newElements[replacingElement.id] = replacingElement
                    newCompleteAdded[replacingElement.id] = replacingElement
                }
            }

            const newCompleted = completed ? completed.clone() : new ElementReplacement()
            newCompleted.addStep({ removed: newCompleteRemoved, added: newCompleteAdded })            
            
            return { 
                ...state, 
                elements: newElements,
                ...(newGroupedElements && { groupedElements: newGroupedElements }),
                currentlyReplacedElements: { completed: newCompleted } 
            }            
        }
        case 'updateReplacementSteps': {
            if (!state.currentlyReplacedElements?.completed) return state

            const { completed } = state.currentlyReplacedElements

            const { elementsToAdd, elementsToRemove, undo } = action
            const newCompleted = completed.clone()

            const changeWasMade = undo ? newCompleted.undo() : newCompleted.redo()
            if (!changeWasMade) {
                // there was nothing to undo/redo
                return state
            }

            const newElements = { ...state.elements }
            let newGroupedElements = null
            for (const elementToRemove of Object.values(elementsToRemove)) {
                delete newElements[elementToRemove.id]

                if (elementToRemove.type === 'polyline') {
                    if (!newGroupedElements) {
                        newGroupedElements = { ...state.groupedElements }
                    }

                    for (const subElement of elementToRemove.elements) {
                        delete newGroupedElements[subElement.id] 
                    }
                }
            }
            
            for (const elementToAdd of Object.values(elementsToAdd)) {
                newElements[elementToAdd.id] = elementToAdd

                if (elementToAdd.type === 'polyline') {
                    if (!newGroupedElements) {
                        newGroupedElements = { ...state.groupedElements }
                    }

                    for (const subElement of elementToAdd.elements) {
                        newGroupedElements[subElement.id] = subElement
                    }
                }
            }
            
            return {
                ...state,
                elements: newElements,
                ...(newGroupedElements && { groupedElements: newGroupedElements }),
                currentlyReplacedElements: {
                    completed: newCompleted
                }
            }
        }
        case 'completeReplacingElements': {
            if (!state.currentlyReplacedElements) return state

            const { currentReplacements } = state.currentlyReplacedElements
            let newElements = null
            let newGroupedElements = null
            if (currentReplacements) {
                // active replacement was not completed, show hidden elements
                newElements = { ...state.elements }
                // newGroupedElements = { ...state.groupedElements }
                for (const replacedId of Object.keys(currentReplacements)) {
                    // (newElements[replacedId] || newGroupedElements[replacedId]).isShown = true
                    newElements[replacedId].isShown = true
                }
            }
  
            return {  
                ...state, 
                currentlyReplacedElements: null, 
                elements: newElements || state.elements,
                groupedElements: newGroupedElements || state.groupedElements
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

    const updateReplacementSteps = (undo) => {
        if (!elementsState.currentlyReplacedElements?.completed) return

        const { currentlyReplacedElements: { completed } } = elementsState

        let elementsToAdd,
            elementsToRemove
        if (undo) {
            if (!completed.current) return

            // for undo, must take current step and undo its changes
            // (i.e. need step BEFORE undo)
            const { added, removed } = completed.current

            elementsToRemove = added
            elementsToAdd = removed
        } else {
            // for redo, must take next step and redo its changes
            // (i.e. need step AFTER redo) 
            if (!completed.next) return

            const { added, removed } = completed.next

            elementsToRemove = removed
            elementsToAdd = added
        }

        elementsContainer.removeElements(Object.values(elementsToRemove))
        elementsContainer.addElements(Object.values(elementsToAdd))

        elementsDispatch({ type: 'updateReplacementSteps', undo, elementsToAdd, elementsToRemove })
    }

    const continueReplacingElements = () => {
        const { currentlyReplacedElements } = elementsState
        if (!currentlyReplacedElements?.currentReplacements) return

        const { currentReplacements } = currentlyReplacedElements
        // const replacingElements = Object.values(currentReplacements).reduce((acc, cr) => {
        //     acc.push(...cr.replacingElements)
        //     return acc
        // }, [])
        // const replacedIds = Object.keys(currentReplacements)
        const { elements, groupedElements } = elementsState
        const replacements = {}
        
        // needed since with extend we might be extending the same element twice in the same command
        const allReplacedElementsKvp = {} 
        const allReplacingElementsKvp = {}
        for (const [replacedId, { replacingElements }] of Object.entries(currentReplacements)) {
            const replacedElement = elements[replacedId] || groupedElements[replacedId]
            // always take the parent element at this stage, in case we are replacing a subElement of a polyline
            const parentReplacedElement = replacedElement.groupId 
                ? elements[replacedElement.groupId] 
                : replacedElement

            const currentElementReplacingElements = []
            for (const replacingElement of replacingElements) {
                if (replacingElement.groupId) {
                    const polylineId = replacingElement.groupId

                    // we are replacing the subElement of a polyline - this polyline is the 
                    // "parentReplacedElement"; we need to substitute the old subElement 
                    // with the new one to get the new polyline state
                    let polylineCopy
                    if (allReplacingElementsKvp[polylineId]) {
                        polylineCopy = allReplacingElementsKvp[polylineId]
                    } else {
                        polylineCopy = ElementManipulator.copyPolyline(parentReplacedElement, true, true)
                        allReplacingElementsKvp[polylineId] = polylineCopy
                    }
                    // TODO: need to make sure all subElements are replaced with copies, with new IDs
                    // or that somehow we keep information about which subElement was replaced
                    polylineCopy.replaceElement(replacingElement, replacedId)
                    
                    currentElementReplacingElements.push(polylineCopy)
                    continue
                }

                allReplacingElementsKvp[replacingElement.id] = replacingElement
                currentElementReplacingElements.push(replacingElement)
            }
            
            allReplacedElementsKvp[parentReplacedElement.id] = parentReplacedElement
            
            replacements[replacedId] = {
                replacedElement: parentReplacedElement,
                replacingElements: currentElementReplacingElements
            }
        }
        
        elementsContainer.addElements(Object.values(allReplacingElementsKvp))
        elementsContainer.removeElements(Object.values(allReplacedElementsKvp))
        elementsDispatch({ type: 'continueReplacingElements', replacements })
    }

    const isReplacingElement = (element) => {
        const { currentlyReplacedElements } = elementsState
        if (!currentlyReplacedElements) return false

        const { currentReplacements, completed } = currentlyReplacedElements

        // TODO: Change replacement logic to avoid nested looping
        const isInCurrentReplacements = currentReplacements &&
                Object.values(currentReplacements).some(cr => cr.replacingElements.some(re => re.id === element.id))

        if (isInCurrentReplacements) return true

        // TODO: What happens if replacing a polyline? (14.02.2022)
        return !!completed?.current?.removed && completed.current.removed[element.id]
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
        updateReplacementSteps,
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