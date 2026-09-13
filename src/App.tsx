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
import QuizzesPage from './pages/QuizzesPage'
import QuizPage from './pages/QuizPage'
import SchedulePage from './pages/SchedulePage'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import ArticleEditor from './pages/admin/ArticleEditor'
import AdminSettings from './pages/admin/AdminSettings'
import MediaLibraryPage from './pages/admin/MediaLibraryPage'
import AuthorManager from './pages/admin/AuthorManager'
import TeamManager from './pages/admin/TeamManager'
import ImportPage from './pages/admin/ImportPage'
import QuizList from './pages/admin/QuizList'
import QuizEditor from './pages/admin/QuizEditor'
import SEODashboard from './pages/admin/SEODashboard'
import SitemapPage from './pages/admin/SitemapPage'
import StatsPage from './pages/admin/StatsPage'
import AdsPage from './pages/admin/AdsPage'
import NewsletterList from './pages/admin/NewsletterList'
import NewsletterEditor from './pages/admin/NewsletterEditor'
import InviteSignup from './pages/admin/InviteSignup'
import NotFound from './pages/NotFound'
import SectorSweep from './pages/SectorSweep'
import InteractivePage from './pages/InteractivePage'
import GamesPage from './pages/GamesPage'
import Join from './pages/Join'
import Privacy from './pages/Privacy'
import Policies from './pages/Policies'
import Terms from './pages/Terms'
import EditorialPolicy from './pages/EditorialPolicy'
import CorrectionsPolicy from './pages/CorrectionsPolicy'
import AuthorPage from './pages/AuthorPage'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public pages */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/author/:authorId" element={<AuthorPage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quiz/:slug" element={<QuizPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/join" element={<Join />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/editorial-policy" element={<EditorialPolicy />} />
          <Route path="/corrections-policy" element={<CorrectionsPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/sector-sweep" element={<SectorSweep />} />
          <Route path="/interactive" element={<InteractivePage />} />
          <Route path="/interactive/:section" element={<InteractivePage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/games/:gameId" element={<GamesPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin login & signup (no layout) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<InviteSignup />} />

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
          <Route path="/admin/media" element={<MediaLibraryPage />} />
          <Route path="/admin/image-tools" element={<MediaLibraryPage />} />
          <Route path="/admin/authors" element={<AuthorManager />} />
          <Route path="/admin/team" element={<TeamManager />} />
          <Route path="/admin/seo" element={<SEODashboard />} />
          <Route path="/admin/sitemap" element={<SitemapPage />} />
          <Route path="/admin/stats" element={<StatsPage />} />
          <Route path="/admin/ads" element={<AdsPage />} />
          <Route path="/admin/newsletter" element={<NewsletterList />} />
          <Route path="/admin/newsletter/new" element={<NewsletterEditor />} />
          <Route path="/admin/newsletter/edit/:id" element={<NewsletterEditor />} />
          <Route path="/admin/import" element={<ImportPage />} />
          <Route path="/admin/quizzes" element={<QuizList />} />
          <Route path="/admin/quiz/new" element={<QuizEditor />} />
          <Route path="/admin/quiz/edit/:id" element={<QuizEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
