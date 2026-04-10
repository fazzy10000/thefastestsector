import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('App crashed:', error)
  }

  handleReset = () => {
    localStorage.removeItem('tfs_articles')
    localStorage.removeItem('tfs_articles_v')
    localStorage.removeItem('tfs_demo_auth')
    localStorage.removeItem('tfs_dark_mode')
    localStorage.removeItem('tfs_settings')
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md text-center">
            <h1 className="text-6xl font-black text-red-600 mb-4">Oops</h1>
            <p className="text-gray-700 text-lg mb-2">Something went wrong.</p>
            <p className="text-gray-500 text-sm mb-6">
              This is usually caused by corrupted local data. Click below to
              reset and reload.
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Reset &amp; Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
