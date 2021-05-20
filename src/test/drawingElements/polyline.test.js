import Line from '../../drawingElements/line'
import Point from '../../drawingElements/point'
import Polyline from '../../drawingElements/polyline'
import { SELECT_DELTA } from '../../utils/constants'

describe('polyline', () => {
    const buildPolyline = () => {
        const polyline = new Polyline(new Point(250, 250), { elements: [
            new Line(new Point(250, 250), { pointB: new Point(350, 350) }),
            new Line(new Point(350, 350), { pointB: new Point(250, 450) }),
            new Line(new Point(250, 450), { pointB: new Point(150, 350) }),
            new Line(new Point(150, 350), { pointB: new Point(300, 300) }),
        ]})

        return polyline
    }

    describe('isClosed', () => {
        it('should return true if polyline is closed', () => {
            const polyline = new Polyline(new Point(250, 250), { elements: [
                new Line(new Point(250, 250), { pointB: new Point(350, 350) }),
                new Line(new Point(350, 350), { pointB: new Point(250, 450) }),
                new Line(new Point(250, 450), { pointB: new Point(150, 350) }),
                new Line(new Point(150, 350), { pointB: new Point(250, 250) }),
            ]})

            expect(polyline.isClosed).toEqual(true)
        })

        it('should return false if polyline is not closed', () => {
            const polyline = new Polyline(new Point(50, 50), { elements: [
                new Line(new Point(250, 250), { pointB: new Point(350, 350) }),
                new Line(new Point(350, 350), { pointB: new Point(250, 450) }),
                new Line(new Point(250, 450), { pointB: new Point(150, 350) }),
                new Line(new Point(150, 350), { pointB: new Point(250, 200) }),
            ]})

            expect(polyline.isClosed).toEqual(false)
            
            const lastLine = polyline.elements[polyline.elements.length - 1]
            lastLine.setPointB(250, 250)
            
            expect(polyline.isClosed).toEqual(true)
            
            lastLine.setPointB(100, 100)
            expect(polyline.isClosed).toEqual(false)
        })
    })

    describe('checkIfPointOnElement', () => {
        it('should return true if point is on any of the elements', () => {
            const polyline = buildPolyline()

            const testElementEndPoint = polyline.elements[0].pointA
            expect(polyline.checkIfPointOnElement(testElementEndPoint, SELECT_DELTA)).toEqual(true)

            const lineToTest = polyline.elements[2]
            const testLine = new Line(new Point(lineToTest.pointA.x, lineToTest.pointA.y), { 
                pointB: new Point(lineToTest.pointB.x, lineToTest.pointB.y)
            })
            
            testLine.setLength(0.4 * lineToTest.length, true)
            expect(polyline.checkIfPointOnElement(testLine.pointA, SELECT_DELTA)).toEqual(true)
        })

        it('should return false if point is not on any of the elements', () => {
            const polyline = buildPolyline()

            expect(polyline.checkIfPointOnElement(new Point(600, 600), SELECT_DELTA)).toEqual(false)
            expect(polyline.checkIfPointOnElement(
                new Point(polyline.elements[1].pointA.x + 5, polyline.elements[1].pointA.y + 5),
                SELECT_DELTA)
            ).toEqual(false)
        })
    })

    describe('defineNextAttribute', () => {
        it('should not make polyline fully defined, but fully define last element', () => {
            const polyline = new Polyline(new Point(100, 100))

            expect(polyline.isFullyDefined).toEqual(false)
            expect(polyline.elements[0].isFullyDefined).toEqual(false)

            polyline.defineNextAttribute(new Point(200, 200))
            expect(polyline.isFullyDefined).toEqual(false)
            expect(polyline.elements[0].isFullyDefined).toEqual(true)
        })
    })

    describe('getSelectionPoints', () => {
        it('should return correct selection points for all contained elements', () => {
            const polyline = buildPolyline()

            const elementSelectionPoints = polyline.elements.reduce((acc, el) => {
                return [...acc, ...el.getSelectionPoints()]
            }, [])

            expect(polyline.getSelectionPoints()).toEqual(elementSelectionPoints)
        })
    })

    describe('setLastAttribute', () => {
        it('should complete definition of last element in polyline.elements', () => {
            const polyline = new Polyline(new Point(100, 100))

            expect(polyline.elements[polyline.elements.length - 1].isFullyDefined).toEqual(false)
            
            polyline.setLastAttribute(200, 200)
            expect(polyline.elements[polyline.elements.length - 1].isFullyDefined).toEqual(true)
        })
    })

    describe('setPointById', () => {
        it('should set correct point', () => {
            const firstPoint = new Point(100, 100)
            firstPoint.pointId = 1

            const secondPoint = new Point(200, 200)
            secondPoint.pointId = 2

            const thirdPoint = new Point(350, 350)
            thirdPoint.pointId = 3

            const polyline = new Polyline(new Point(100, 100), {
                elements: [
                    new Line(firstPoint, { pointB: secondPoint }),
                    new Line(new Point(250, 280), { pointB: new Point(400, 400) }),
                    new Line(new Point(330, 315), { pointB: thirdPoint })
                ]
            }) 

            expect(polyline.setPointById(1, 401, 401)).toEqual(true)
            expect(polyline.setPointById(2, 402, 402)).toEqual(true)
            expect(polyline.setPointById(3, 403, 403)).toEqual(true)

            expect(polyline.elements[0].pointA.x).toEqual(401)
            expect(polyline.elements[0].pointA.y).toEqual(401)
            expect(polyline.elements[0].pointB.x).toEqual(402)
            expect(polyline.elements[0].pointB.y).toEqual(402)
            expect(polyline.elements[2].pointB.x).toEqual(403)
            expect(polyline.elements[2].pointB.y).toEqual(403)
        })

        it('should return false if point does not exist', () => {
            const polyline = buildPolyline()

            expect(polyline.setPointById(5, 500, 500)).toEqual(false)
        })
    })

    describe('getPointById', () => {
        it('should get correct point', () => {
            const firstPoint = new Point(100, 120)
            firstPoint.pointId = 1

            const secondPoint = new Point(200, 190)
            secondPoint.pointId = 2

            const thirdPoint = new Point(350, 460)
            thirdPoint.pointId = 3
            
            const polyline = new Polyline(new Point(100, 100), {
                elements: [
                    new Line(firstPoint, { pointB: secondPoint }),
                    new Line(new Point(250, 280), { pointB: new Point(400, 400) }),
                    new Line(new Point(330, 315), { pointB: thirdPoint })
                ]
            })

            const firstPointToGet = polyline.getPointById(1)
            const secondPointToGet = polyline.getPointById(2)
            const thirdPointToGet = polyline.getPointById(3)

            expect(firstPointToGet.x).toEqual(100)
            expect(firstPointToGet.y).toEqual(120)
            expect(secondPointToGet.x).toEqual(200)
            expect(secondPointToGet.y).toEqual(190)
            expect(thirdPointToGet.x).toEqual(350)
            expect(thirdPointToGet.y).toEqual(460)
        })

        it('should return null if point does not exist', () => {
            const firstPoint = new Point(100, 120)
            firstPoint.pointId = 1

            const secondPoint = new Point(200, 190)
            secondPoint.pointId = 2
            
            const polyline = new Polyline(new Point(100, 100), {
                elements: [
                    new Line(firstPoint, { pointB: secondPoint }),
                    new Line(new Point(250, 280), { pointB: new Point(400, 400) }),
                    new Line(new Point(330, 315), { pointB: new Point(350, 460) })
                ]
            })

            expect(polyline.getPointById(1)).not.toEqual(null)
            expect(polyline.getPointById(2)).not.toEqual(null)
            expect(polyline.getPointById(5)).toEqual(null)
            expect(polyline.getPointById('321')).toEqual(null)
        })
    })

    describe('move', () => {
        it('should move all points of all elements', () => {
            const firstPoint = new Point(100, 120)
            const secondPoint = new Point(200, 190)
            
            const polyline = new Polyline(new Point(100, 120), {
                elements: [
                    new Line(firstPoint, { pointB: secondPoint }),
                    new Line(new Point(250, 280), { pointB: new Point(400, 400) }),
                    new Line(new Point(330, 315), { pointB: new Point(350, 460) })
                ]
            })

            const selectionPointsBefore = polyline.getSelectionPoints()

            polyline.move(50, 50)

            const selectionPointsAfter = polyline.getSelectionPoints()

            for (let index = 0; index < selectionPointsBefore.length; index++) {
                expect(selectionPointsAfter[index].x).toEqual(selectionPointsBefore[index].x + 50)
                expect(selectionPointsAfter[index].y).toEqual(selectionPointsBefore[index].y + 50)
            }

            polyline.move(-100, -100)
            const selectionPointsLast = polyline.getSelectionPoints()

            for (let index = 0; index < selectionPointsAfter.length; index++) {
                expect(selectionPointsLast[index].x).toEqual(selectionPointsAfter[index].x - 100)
                expect(selectionPointsLast[index].y).toEqual(selectionPointsAfter[index].y - 100)
            }
        })
    })

    describe('stretchByMidPoint', () => {
        it('should move correct points', () => {
            const firstPoint = new Point(100, 120)
            const secondPoint = new Point(200, 190)
            
            const polyline = new Polyline(new Point(100, 120), {
                elements: [
                    new Line(firstPoint, { pointB: secondPoint }),
                    new Line(new Point(200, 190), { pointB: new Point(400, 400) }),
                    new Line(new Point(400, 400), { pointB: new Point(350, 460) })
                ]
            })

            const firstMidPoint = polyline.elements[0].midPoint
            const secondMidPoint = polyline.elements[1].midPoint
            const thirdMidPoint = polyline.elements[2].midPoint

            expect(polyline.stretchByMidPoint(100, 200, firstMidPoint.pointId)).toEqual(true)

            expect(polyline.elements[0].pointA.x).toEqual(200)
            expect(polyline.elements[0].pointA.y).toEqual(320)
            expect(polyline.elements[0].pointB.x).toEqual(300)
            expect(polyline.elements[0].pointB.y).toEqual(390)
            expect(polyline.elements[1].pointA.x).toEqual(300)
            expect(polyline.elements[1].pointA.y).toEqual(390)

            expect(polyline.stretchByMidPoint(-50, -100, secondMidPoint.pointId)).toEqual(true)

            expect(polyline.elements[0].pointB.x).toEqual(250)
            expect(polyline.elements[0].pointB.y).toEqual(290)
            expect(polyline.elements[1].pointA.x).toEqual(250)
            expect(polyline.elements[1].pointA.y).toEqual(290)
            expect(polyline.elements[1].pointB.x).toEqual(350)
            expect(polyline.elements[1].pointB.y).toEqual(300)
            expect(polyline.elements[2].pointA.x).toEqual(350)
            expect(polyline.elements[2].pointA.y).toEqual(300)

            expect(polyline.stretchByMidPoint(300, 300, thirdMidPoint.pointId)).toEqual(true)

            expect(polyline.elements[1].pointB.x).toEqual(650)
            expect(polyline.elements[1].pointB.y).toEqual(600)
            expect(polyline.elements[2].pointA.x).toEqual(650)
            expect(polyline.elements[2].pointA.y).toEqual(600)
            expect(polyline.elements[2].pointB.x).toEqual(650)
            expect(polyline.elements[2].pointB.y).toEqual(760)

            expect(polyline.stretchByMidPoint(10, 10, 'fake id')).toEqual(false)
        })
    })
})