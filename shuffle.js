const shuffle = array => {
  const shuffled = new Array(array.length)
  let i = 0
  while (array.length > 0) {
    const j = Math.floor(Math.random() * array.length)
    shuffled[i] = array[j]
    i++
    array.splice(j, 1)
  }
  return shuffled
}

export default shuffle
