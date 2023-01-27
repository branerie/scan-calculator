import { 
  createContext, 
  useContext, 
  useState,
  useEffect,
  useLayoutEffect,
} from 'react'
import { useToolsStore } from '../stores/tools/index'

export const ACCEPTED_TOOL_KEYS = {
  CTRL: 'ctrl',
  SHIFT: 'shift',
  Z: 'z',
  Y: 'y'
}

const AppContext = createContext<{ canvasContext: CanvasRenderingContext2D | null }>({
  canvasContext: null
})

export function useAppContext() {
  return useContext(AppContext)
}

const AppContextProvider: React.FC<{ children: React.ReactNode }> = (
  { children }
) => {
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null)

  const toolsStore = useToolsStore() 
  const setToolKeys = toolsStore().setToolKeys

  useEffect(() => {
    const updateToolKeys = (keys: string[]) => {
      setToolKeys(new Set<string>(keys))
    }
  
    const handleToolKeyAdd = (event: KeyboardEvent) => {
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
  
      updateToolKeys(keysPressed)
    }
  
    const handleToolKeyRemove = () => {
      updateToolKeys([])
    }
  
    window.addEventListener('keydown', handleToolKeyAdd)
    window.addEventListener('keyup', handleToolKeyRemove)
    
    return () => {
      window.removeEventListener('keydown', handleToolKeyAdd)
      window.removeEventListener('keyup', handleToolKeyRemove)
    }
  }, [setToolKeys])
  
  useLayoutEffect(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement | null
    if (!canvas) {
      throw new Error('Cannot find canvas element')
    }
  
    const newContext = canvas.getContext('2d')
    newContext!.save()
    setContext(newContext)
  }, [])

  return (
    <AppContext.Provider value={{ canvasContext: context }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider