import { click, matchSnapshot, moveMouse, pressEscape, selectTool } from "../../utils/canvas"
import { visitPage } from "../../utils/main"

/* eslint-disable no-undef */
describe('Canvas.line', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should draw lines correctly', () => {
        selectTool('line')
        
        click(100, 100)
        click(200, 100)

        click(150, 200)
        click(180, 220)
    })

    it ('should edit line by clicking on endpoint', () => {
        selectTool('line')

        click(200, 50)
        click(200, 200)

        pressEscape()
        
        click(200, 170)

        // click on endpoint
        click(200, 200)
        // move endpoint
        click(300, 250)

        // click on other endpoint
        click(200, 50)
        // move other endpoint
        click(100, 20)
    })

    it('should move line by clicking on midpoint', () => {
        selectTool('line')

        click(200, 100)
        click(200, 200)

        pressEscape()

        // select line
        click(200, 120)
        // click midpoint
        click(200, 150)
        // move midpoint
        click(400, 400)

        // select midpoint to test selected point turning red
        click(400, 400)
    })

    it('should display endpoint snap correctly', () => {
        selectTool('line')

        click(100, 100)
        click(300, 300)

        moveMouse(304, 306)
    })

    it('should display midpoint snap correctly', () => {
        selectTool('line')

        click(100, 100)
        click(300, 300)

        moveMouse(203, 204)
    })
})