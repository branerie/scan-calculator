class SetUtils {
  static union<T>(...sets: Set<T>[]) {
    let _union = new Set(sets[0])

    sets.slice(1).forEach(s => {
      s.forEach(e => {
        _union.add(e)
      })
    })

    return _union
  }
}

export default SetUtils