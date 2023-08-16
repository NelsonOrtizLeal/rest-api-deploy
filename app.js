const express = require('express') // Esto es CommonJS -> ES module
const movies = require('./movies.json')
const crypto = require('node:crypto')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.disable('x-powered-by')
const PORT = process.env.PORT ?? 1234

// Utilizando el middleWare para objeto Json en el body
app.use(express.json())

// Utilizando dependencia de CORS -> Instalar antes
// app.use(cors({
//   origin: (origin, callback) => {
//     const ACCEPTED_ORIGINS = [
//       'http://localhost:8080',
//       'http://localhost:1234',
//       'http://movies.com'
//     ]

//     if (ACCEPTED_ORIGINS.includes(origin)) {
//       return callback(null, true)
//     }

//     if (!origin) {
//       return callback(null, true)
//     }

//     return callback(new Error('Not Allowed by CORS'))
//   }
// }))

app.get('/', (req, res) => {
  res.json({ message: 'hola mundo' })
})

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://movies.com'
]

app.get('/movies', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) { // Cuando no tiene origin es del propio localhost
  // Agregando la cabecera para evitar el error CORS
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  // leer el query param de format
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regexp
  const { id } = req.params

  // Buscamos la pelicula en nuestro json
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  // Si no encuentra la pelicula, responder un error
  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies/', (req, res) => {
// Realizamos destructuración de los parametros de la Request
//   const {
//     title,
//     genre,
//     year,
//     director,
//     duration,
//     rate,
//     poster
//   } = req.body

  // Validar los parametros de la request
  const result = validateMovie(req.body)

  // Verificar el resultado de la validación
  if (result.error) {
    // 402 -> indica que el cliente a hecho un error en la request
    // 422 -> Ha entendido la request pero la petición no era del todo correcto
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // En base de datos -> Teniendo el objeto movie a guardar
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  // Esto no es REST, porque estamos guardando
  // el estado de la aplicacion en memoria
  movies.push(newMovie)

  // Regresar el codigo de creado
  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { id } = req.params

  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  }

  res.send(200)
})

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})
