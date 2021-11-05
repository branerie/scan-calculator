import React, { 
    useState, 
    useContext, 
    createContext, 
    useCallback, 
    useLayoutEffect,
    useEffect, 
    useRef 
} from 'react'
import { MAX_NUM_ERROR, SELECT_DELTA } from '../utils/constants'

const VIEW_ZOOM_STEP_UP = 1.2
const VIEW_ZOOM_STEP_DOWN = 1 / 1.2
const VIEW_ZOOM_MAX_SCALE = VIEW_ZOOM_STEP_UP ** 15
const VIEW_ZOOM_MIN_SCALE = VIEW_ZOOM_STEP_DOWN ** 15

const ACCEPTED_TOOL_KEYS = {
    CTRL: 'ctrl',
    SHIFT: 'shift',
    Z: 'z',
    Y: 'y'
}

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
    const keysRef = useRef({})

    useEffect(() => {
        const setToolKeys = (keys) => {
            keysRef.current = {}

            keys.forEach(key => {
                keysRef.current[key] = true
            })
        }

        const handleToolKeyAdd = (event) => {
            const keysPressed = []
            if (event.metaKey || event.ctrlKey) {
                keysPressed.push(ACCEPTED_TOOL_KEYS.CTRL)
            }
    
            if (event.shiftKey) {
                keysPressed.push(ACCEPTED_TOOL_KEYS.SHIFT)
            }
    
            if (event.key) {
                if (event.key.toLowerCase() === 'z') {
                    keysPressed.push(ACCEPTED_TOOL_KEYS.Z)
                }
    
                if (event.key.toLowerCase() === 'y') {
                    keysPressed.push(ACCEPTED_TOOL_KEYS.Y)
                }
            }
    
            setToolKeys(keysPressed)
        }
    
        const handleToolKeyRemove = () => {
            setToolKeys([])
        }

        window.addEventListener('keydown', handleToolKeyAdd)
        window.addEventListener('keyup', handleToolKeyRemove)
        
        return () => {
            window.removeEventListener('keydown', handleToolKeyAdd)
            window.removeEventListener('keyup', handleToolKeyRemove)
        }
    }, [])

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

    const resetTool = useCallback(() => {
        setTool({ type: 'select', name: 'select' })
        keysRef.current = {}
    }, [])

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

        setTool(currTool => ({ ...currTool, clicks: newClicks }))
    }, [tool])

    const clearCurrentTool = useCallback(() => {
        setTool(currTool => ({ type: currTool.type, name: tool.name }))
    }, [tool.name])

    const getLastReferenceClick = useCallback(() => {
        if (!tool.clicks || (!tool.refClickIndex && tool.refClickIndex !== 0)) return null
        
        return tool.clicks[tool.refClickIndex]
    }, [tool])

    const removeLastToolClick = useCallback(() => {
        if (!tool.clicks) return

        setTool(currTool => {
            const newTool = { ...currTool }
            
            const newClicks = [...currTool.clicks]
            newClicks.pop()
            
            if (newClicks.length === 0) {
                delete newTool.clicks
                delete newTool.mousePosition
                return newTool
            }

            return { ...newTool, clicks: newClicks }
        })
    }, [tool.clicks])

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
            keysRef,
            setTool,
            resetTool,
            addToolClick,
            editLastToolClick,
            addToolProp,
            clearCurrentTool,
            getLastReferenceClick,
            removeLastToolClick,
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


