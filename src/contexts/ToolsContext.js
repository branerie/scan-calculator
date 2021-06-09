import React, { useState, useContext, createContext, useCallback, useLayoutEffect } from 'react'
import { MAX_NUM_ERROR, SELECT_DELTA } from '../utils/constants'

const VIEW_ZOOM_STEP_UP = 1.2
const VIEW_ZOOM_STEP_DOWN = 1 / 1.2
const VIEW_ZOOM_MAX_SCALE = VIEW_ZOOM_STEP_UP ** 15
const VIEW_ZOOM_MIN_SCALE = VIEW_ZOOM_STEP_DOWN ** 15

const Context = createContext()

export function useToolsContext() {
    return useContext(Context)
}

export default function ToolsContextProvider({ children }) {
    const [currentTranslate, setCurrentTranslate] = useState([0, 0])
    const [currentScale, setCurrentScale] = useState(1)
    const [tool, setTool] = useState({ type: 'select', name: 'select' })
    const [options, setOptions] = useState({ snap: true, ortho: false })
    const [context, setContext] = useState(null)
    const [mouseDrag, setMouseDrag] = useState(null)

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas')
        const newContext = canvas.getContext('2d')
        newContext.save()
        setContext(newContext)
    }, [])

    const panView = useCallback((startX, startY, endX, endY) => {
        const deltaX = endX - startX
        const deltaY = endY - startY
        // context.translate(deltaX, deltaY)

        const [currentTranslateX, currentTranslateY] = currentTranslate
        setCurrentTranslate([currentTranslateX + deltaX, currentTranslateY + deltaY])

        setMouseDrag([endX, endY])
    }, [currentTranslate, setCurrentTranslate])

    const zoomView = useCallback((centerX, centerY, isZoomOut) => {
        const scaleStep = isZoomOut ? VIEW_ZOOM_STEP_DOWN : VIEW_ZOOM_STEP_UP

        const newScale = Math.min(Math.max(currentScale * scaleStep, VIEW_ZOOM_MIN_SCALE), VIEW_ZOOM_MAX_SCALE)
        if (Math.abs(currentScale - newScale) < MAX_NUM_ERROR ) return

        const [currentTranslateX, currentTranslateY] = currentTranslate
        const newCenterX = centerX - currentTranslateX
        const newCenterY = centerY - currentTranslateY
        const dX = (1 - scaleStep) * newCenterX
        const dY = (1 - scaleStep) * newCenterY
        
        setCurrentScale(newScale)
        setCurrentTranslate([(currentTranslateX + dX), (currentTranslateY + dY)])
        return
    }, [currentScale, currentTranslate, setCurrentScale, setCurrentTranslate])

    const resetTool = useCallback(() => setTool({ type: 'select', name: 'select' }), [])

    const addToolClick = useCallback((clickedPoint, isReferenceClick = true) => {
        setTool(tool => { 
            const clicks = tool.clicks ? [ ...tool.clicks, clickedPoint ] : [clickedPoint]
            const newTool = { ...tool, clicks }

            if (isReferenceClick) {
                newTool.refClickIndex = clicks.length - 1
            }

            return newTool
        })
    }, [])

    const editLastToolClick = useCallback((newPoint) => {
        if (!tool.clicks) {
            throw new Error('Cannot edit clicks - tool does not contain any clicks.')
        }

        const newClicks = [...tool.clicks]
        newClicks.pop()
        newClicks.push(newPoint)

        setTool(tool => ({ ...tool, clicks: newClicks }))
    }, [tool])

    const clearCurrentTool = useCallback(() => {
        setTool(tool => ({ type: tool.type, name: tool.name }))
    }, [])

    const getLastReferenceClick = useCallback(() => {
        if (!tool.clicks || (!tool.refClickIndex && tool.refClickIndex !== 0)) return null
        
        return tool.clicks[tool.refClickIndex]
    }, [tool])

    const getRealMouseCoordinates = useCallback((clientX, clientY) => {
        const [translateX, translateY] = currentTranslate

        return [(clientX - translateX) / currentScale, (clientY - translateY) / currentScale]
    }, [currentScale, currentTranslate])

    const addToolProp = useCallback((propName, propValue) => {
        setTool(tool => ({ ...tool, [propName]: propValue }))
    }, [])

    return (
        <Context.Provider value={{
            currentTranslate,
            setCurrentTranslate,
            currentScale,
            setCurrentScale,
            selectDelta: SELECT_DELTA / currentScale,
            tool,
            setTool,
            resetTool,
            addToolClick,
            editLastToolClick,
            addToolProp,
            clearCurrentTool,
            getLastReferenceClick,
            getRealMouseCoordinates,
            panView,
            zoomView,
            canvasContext: context,
            mouseDrag,
            setMouseDrag,
            options,
            setOptions,
        }}>
            {children}
        </Context.Provider>
    )
}


