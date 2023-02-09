import { useCallback } from 'react'
import { useToolsStore } from '../../stores/tools/index'
import { MousePosition } from '../../utils/types/index'

const useSelectCommand = () => {
  const addToolProp = useToolsStore(state => state.addToolProp)
  
  const handleSelectCmd = useCallback((mousePosition: MousePosition) => {
    addToolProp({ mousePosition })
  }, [addToolProp])

  return handleSelectCmd
}

export default useSelectCommand