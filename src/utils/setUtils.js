class SetUtils {
    static union(setA, setB, ...sets) {
        let _union = new Set(setA)
        for (let element of setB) {
            _union.add(element)
        }

        if (sets) {
            sets.forEach(s => {
                s.forEach(e => {
                    _union.add(e)
                })
            })
        }

        return _union
    }
}

export default SetUtils