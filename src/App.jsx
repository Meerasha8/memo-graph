import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Books from './pages/Books'
import BookEditor from './pages/BookEditor'
import Orders from './pages/Orders'
import HowItWorks from './pages/HowItWorks'

function Layout({ children, noNav = false }) {
  return (
    <>
      {!noNav && <Navbar />}
      {children}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/how-it-works" element={<Layout><HowItWorks /></Layout>} />
          <Route path="/books" element={<ProtectedRoute><Layout><Books /></Layout></ProtectedRoute>} />
          <Route path="/books/:id" element={<ProtectedRoute><BookEditor /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
