export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">Contact Us</h1>
      <div className="h-1 w-16 bg-primary mt-2 mb-8 rounded-full" />

      <div className="bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm">
        <p className="text-text-secondary dark:text-white/70 mb-6">
          Want to get in touch? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">Message</label>
            <textarea
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Your message..."
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}
