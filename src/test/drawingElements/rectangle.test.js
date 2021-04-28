import Point from '../../drawingElements/point'
import Rectangle from '../../drawingElements/rectangle'

describe('rectangle', () => {
    describe('setLastAttribute', () => {
        it('should finish definition of first line and define the rest of lines in rectangle', () => {
            const rectangle = new Rectangle(new Point(50, 50))

            expect(rectangle.elements.length).toEqual(1)
            expect(rectangle.isFullyDefined).toEqual(false)

            rectangle.setLastAttribute(400, 400)
            expect(rectangle.elements.length).toEqual(4)
            expect(rectangle.isFullyDefined).toEqual(true)

            expect(rectangle.elements[0].pointA.x).toEqual(50)
            expect(rectangle.elements[0].pointA.y).toEqual(50)
            expect(rectangle.elements[0].pointB.x).toEqual(400)
            expect(rectangle.elements[0].pointB.y).toEqual(50)

            expect(rectangle.elements[1].pointA.x).toEqual(400)
            expect(rectangle.elements[1].pointA.y).toEqual(50)
            expect(rectangle.elements[1].pointB.x).toEqual(400)
            expect(rectangle.elements[1].pointB.y).toEqual(400)

            expect(rectangle.elements[2].pointA.x).toEqual(400)
            expect(rectangle.elements[2].pointA.y).toEqual(400)
            expect(rectangle.elements[2].pointB.x).toEqual(50)
            expect(rectangle.elements[2].pointB.y).toEqual(400)

            expect(rectangle.elements[3].pointA.x).toEqual(50)
            expect(rectangle.elements[3].pointA.y).toEqual(400)
            expect(rectangle.elements[3].pointB.x).toEqual(50)
            expect(rectangle.elements[3].pointB.y).toEqual(50)
        })
    })
})