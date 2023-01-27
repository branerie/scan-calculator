import { useCallback } from 'react'
import useCopyCommand from './useCopyCommand'
import useDeleteCommand from './useDeleteCommand'
import useDrawCommand from './useDrawCommand'
import useEscapeCommand from './useEscapeCommand'
import useTrimCommand from './useTrimCommand'
import useUndoRedoCommand from './useUndoRedoCommand'
import useExtendCommand from './useExtendCommand'
import { ENTER_KEY, ESCAPE_KEY, DELETE_KEY, SPACE_KEY } from '../../utils/constants'
import useKeyPress from '../../hooks/useKeyPress'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useKeyPressCommands = () => {
  const elementsStore = useElementsStore()
  const currentlyCreatedElement = elementsStore(state => state.currentlyCreatedElement)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const isToolBeingUsed = toolsStore(state => state.isToolBeingUsed)

  const { undoIsPressed, redoIsPressed } = useKeyPress()

  const undoRedo = useUndoRedoCommand()
  const deleteCmd = useDeleteCommand()
  const draw = useDrawCommand()
  const escape = useEscapeCommand()
  const copy = useCopyCommand()
  const trim = useTrimCommand()
  const extend = useExtendCommand()

  const executeKeyPressCommand = useCallback((event: KeyboardEvent) => {
    const isDrawingPolyline = 
      tool.type === 'draw' && 
      currentlyCreatedElement && 
      currentlyCreatedElement.type === 'polyline'

    if (
      (undoIsPressed(event) || redoIsPressed(event)) &&
      (!isToolBeingUsed() || isDrawingPolyline)
    ) {
      undoRedo(event)
      return
    }

    if (tool.type === 'trim') {
      if (tool.name === 'trim') {
        trim(event)
      } else {
        extend(event)
      }

      return
    }

    const { key } = event

    if (key === ESCAPE_KEY) {
      escape()
      return
    }

    if (key === ENTER_KEY || key === SPACE_KEY) {
      if (tool.type === 'draw') {
        draw()
        return
      }

      if (tool.type === 'copy') {
        copy()
        return
      }
    }

    if (key === DELETE_KEY) {
      deleteCmd()
      return
    }

    return null
  }, [
    tool.type, 
    tool.name, 
    currentlyCreatedElement, 
    undoIsPressed,
    redoIsPressed, 
    isToolBeingUsed, 
    undoRedo, 
    trim, 
    extend, 
    escape, 
    draw, 
    copy, 
    deleteCmd
  ])

  return executeKeyPressCommand
}

export default useKeyPressCommands
