import { useSettings } from '../hooks/useSettings'
import { displayAuthorName } from '../lib/formatAuthor'
import { useTeamPage } from '../hooks/useTeamPage'
import SEO from '../components/SEO'
import RacingLoader from '../components/RacingLoader'
import SocialIcons from '../components/SocialIcons'
import type { TeamPageMember } from '../lib/types'

function TeamCard({ member }: { member: TeamPageMember }) {
  const name = displayAuthorName(member.name)

  return (
    <article className="bg-surface-card dark:bg-white/5 rounded-xl border border-gray-200/80 dark:border-white/10 p-5 flex flex-col items-center text-center">
      <img
        src={member.avatar || '/tfs-logo.png'}
        alt={name}
        className="w-20 h-20 rounded-full object-cover mb-4 bg-gray-100 dark:bg-white/10"
      />
      <h3 className="text-base font-bold text-text-primary dark:text-white leading-snug mb-1">
        {name}
      </h3>
      {member.roleTitle ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">
          {member.roleTitle}
        </p>
      ) : null}
      {member.bio ? (
        <p className="text-sm text-text-secondary dark:text-white/60 line-clamp-3 mb-3">{member.bio}</p>
      ) : (
        <p className="text-sm text-text-secondary dark:text-white/40 mb-3">Motorsports Writer</p>
      )}
      <div className="flex items-center gap-3 mt-auto">
        {member.instagram && (
          <a
            href={member.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Instagram
          </a>
        )}
        {member.twitter && (
          <a
            href={member.twitter}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary hover:underline"
          >
            X
          </a>
        )}
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary hover:underline"
          >
            LinkedIn
          </a>
        )}
      </div>
    </article>
  )
}

export default function About() {
  const { settings } = useSettings()
  const { members, loading } = useTeamPage()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <SEO
        title="Meet the Team"
        description="Our story and the writers behind The Fastest Sector."
      />

      <div className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">About Us</p>
        <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">Meet the Team</h1>
        <div className="h-1 w-16 bg-primary mt-2 rounded-full" />
      </div>

      <section className="bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm mb-10">
        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Our Story</h2>
        <p className="text-text-secondary dark:text-white/70 leading-relaxed text-lg whitespace-pre-line">
          {settings.ourStory}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">The Team</h2>
        <p className="text-sm text-text-secondary dark:text-white/60 mb-6">
          The people bringing you motorsport coverage across every sector.
        </p>

        {loading ? (
          <RacingLoader message="Loading the team..." />
        ) : members.length === 0 ? (
          <p className="text-text-secondary dark:text-white/50 py-8">Team profiles coming soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {members.map((member) => (
              <TeamCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Connect With Us</h2>
        <SocialIcons
          links={settings.socialLinks}
          className="flex flex-wrap items-center gap-4"
          iconClassName="w-5 h-5"
          linkClassName="text-text-secondary dark:text-white/60 hover:text-primary transition-colors"
        />
      </section>
    </div>
  )
}
