import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../booking/monthgrid.css'
import './book.css'
import BookPage from './BookPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookPage />
  </StrictMode>,
)
