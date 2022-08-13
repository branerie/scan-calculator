import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'
import useCopyCommand from './useCopyCommand'
import useDeleteCommand from './useDeleteCommand'
import useDrawCommand from './useDrawCommand'
import useEscapeCommand from './useEscapeCommand'
import useTrimCommand from './useTrimCommand'
import useUndoRedoCommand from './useUndoRedoCommand'
import useExtendCommand from './useExtendCommand'
import { ENTER_KEY_CODE, ESCAPE_KEY_CODE, DELETE_KEY_CODE, SPACE_KEY_CODE } from '../../utils/constants'
import useKeyPress from '../../hooks/useKeyPress'


const useKeyPressCommands = () => {
    const commands = {
        undoRedo: useUndoRedoCommand(),
        delete: useDeleteCommand(),
        draw: useDrawCommand(),
        escape: useEscapeCommand(),
        copy: useCopyCommand(),
        trim: useTrimCommand(),
        extend: useExtendCommand()
    }

    const {
        tools: { 
            tool,
            isToolBeingUsed
        } 
    } = useAppContext()

    const {
        undoIsPressed,
        redoIsPressed
    } = useKeyPress()

    const executeKeyPressCommand = useCallback((event) => {
        if ((undoIsPressed(event) || redoIsPressed(event)) &&
            !isToolBeingUsed()
        ) {
            commands.undoRedo(event)
            return
        }

        if (tool.type === 'trim') {
            if (tool.name === 'trim') {
                commands.trim(event)
            } else {
                commands.extend(event)
            }

            return
        }

        const { keyCode } = event

        if (keyCode === ESCAPE_KEY_CODE) {
            commands.escape(event)
            return
        }
        
        if (keyCode === ENTER_KEY_CODE || keyCode === SPACE_KEY_CODE) {
            if (tool.type === 'draw') {
                commands.draw(event)
                return
            }

            if (tool.type === 'copy') {
                commands.copy(event)
                return
            }
        }
        
        if (keyCode === DELETE_KEY_CODE) {
            commands.delete()
            return
        }
    
        return null
    }, [undoIsPressed, redoIsPressed, isToolBeingUsed, tool.type, tool.name, commands])

    return executeKeyPressCommand
}

export default useKeyPressCommands