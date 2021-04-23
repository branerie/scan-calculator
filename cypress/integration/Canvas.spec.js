import { click, matchSnapshot, pressEnter, pressEscape, selectDrawingTool } from '../utils/canvas'
import { visitPage } from '../utils/main'

/* eslint-disable no-undef */
describe('<Canvas />', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    const drawElements = () => {
        // draw line
        selectDrawingTool('line')
        click(50, 50)
        click(100, 100)

        // draw polyline
        selectDrawingTool('polyline')
        click(100, 150)
        click(80, 180)
        click(120, 180)
        click(120, 190)

        pressEnter()

        // draw arc
        selectDrawingTool('arc')
        click(300, 250)
        click(250, 250)
        click(200, 250)

        // draw circle
        selectDrawingTool('circle')
        click(350, 350)
        click(200, 350)

        // draw rectangle
        selectDrawingTool('rectangle')

        click(350, 300)
        click(600, 600)

        pressEscape()
    }    

    it('should select clicked elements', () => {
        drawElements()

        click(350, 500)
        click(80, 80)
    })
})