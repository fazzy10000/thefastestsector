import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import ArticlePage from './pages/ArticlePage'
import CategoryPage from './pages/CategoryPage'
import SearchPage from './pages/SearchPage'
import About from './pages/About'
import Contact from './pages/Contact'
import StandingsPage from './pages/StandingsPage'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import ArticleEditor from './pages/admin/ArticleEditor'
import AdminSettings from './pages/admin/AdminSettings'
import ImageToolsPage from './pages/admin/ImageToolsPage'
import AuthorManager from './pages/admin/AuthorManager'

export default function App() {
  return (
    <BrowserRouter basename="/thefastestsector">
      <ScrollToTop />
      <Routes>
        {/* Public pages */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Admin login (no layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin pages (protected) */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/new" element={<ArticleEditor />} />
          <Route path="/admin/edit/:id" element={<ArticleEditor />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/image-tools" element={<ImageToolsPage />} />
          <Route path="/admin/authors" element={<AuthorManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
