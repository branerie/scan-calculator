import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

import '@testing-library/jest-dom'
import Canvas from '../../components/Canvas'

describe('<Canvas />', () => {
    const renderCanvas = render(<Canvas />)

    describe('handleMouseMove', () => {
        afterEach(cleanup)

        it('')
    })
})
