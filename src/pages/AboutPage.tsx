import { Seo } from '../components/Seo'
import { CtaBand } from '../components/ui/CtaBand'
import { PageHeader } from '../components/ui/PageHeader'
import { PlaceholderBadge } from '../components/ui/PlaceholderBadge'
import { Reveal } from '../components/ui/Reveal'
import { SectionLabel } from '../components/ui/SectionLabel'
import { site } from '../config/site'
import { visible } from '../lib/content'

export default function AboutPage() {
  const { about } = site
  const team = visible(about.team)
  const milestones = visible(about.milestones)
  const achievements = visible(about.achievements).filter((a) => a.verified)

  return (
    <>
      <Seo {...site.seo.pages.about} path="/about" />
      <PageHeader label={about.label} title={about.heading} emphasis="delivering growth." />

      {/* Story */}
      <section aria-label="Our story" className="bg-ink pb-24 text-paper md:pb-36">
        <div className="shell grid gap-10 lg:grid-cols-12">
          <Reveal className="space-y-8 lg:col-span-8 lg:col-start-5">
            {about.intro.map((p, i) => (
              <p key={i} className={i === 0 ? 't-statement' : 't-lead max-w-2xl text-paper/70'}>
                {p}
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Mission & vision */}
      <section aria-labelledby="mv-heading" className="on-paper bg-paper py-24 text-ink md:py-36">
        <div className="shell">
          <h2 id="mv-heading" className="sr-only">
            Mission and vision
          </h2>
          <div className="grid gap-px overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-2">
            {[
              { label: 'Mission', text: about.mission },
              { label: 'Vision', text: about.vision },
            ].map((b, i) => (
              <Reveal key={b.label} className="relative bg-paper p-8 md:p-14">
                <p className="t-label flex items-center gap-3 text-stone">
                  <span className="text-accent-ink">{String(i + 1).padStart(2, '0')}</span>
                  {b.label}
                </p>
                <p className="t-h3 mt-10 max-w-md md:mt-20">{b.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section aria-labelledby="values-heading" className="on-paper bg-paper pb-24 text-ink md:pb-36">
        <div className="shell grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionLabel index="03" className="text-stone">
              Values
            </SectionLabel>
            <h2 id="values-heading" className="t-h2 mt-6">
              What we <span className="serif-em text-accent-ink">stand for</span>
            </h2>
          </div>
          <ol className="lg:col-span-8">
            {about.values.map((v, i) => (
              <li key={v.title} className="group grid gap-4 border-t border-ink/15 py-8 md:grid-cols-[5rem_1fr_1.2fr] md:items-baseline md:py-10">
                <span className="t-label text-stone">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="t-h2 transition-colors duration-500 group-hover:text-accent-ink">{v.title}</h3>
                <p className="text-stone md:max-w-sm">{v.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Methodology */}
      <section aria-labelledby="method-heading" className="grain relative bg-ink py-24 text-paper md:py-36">
        <div className="shell">
          <SectionLabel index="04" className="text-paper/60">
            How we work
          </SectionLabel>
          <h2 id="method-heading" className="t-h2 mt-6 max-w-2xl">
            One connected process, from first call to <span className="serif-em text-gold pr-[0.04em]">growth</span>.
          </h2>
          <Reveal as="ol" className="relative mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {about.methodology.map((step, i) => (
              <li key={step.title} className="relative border-t border-paper/15 pt-8">
                <span aria-hidden="true" className="absolute -top-[5px] left-0 size-[9px] rounded-full bg-paper" />
                {i === about.methodology.length - 1 && (
                  <span aria-hidden="true" className="absolute -top-[7px] left-0 size-[13px] rounded-full bg-accent shadow-[0_0_20px_var(--brand-accent)]" />
                )}
                <span className="t-label text-accent">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="t-h3 mt-4">{step.title}</h3>
                <p className="mt-3 max-w-xs text-paper/65">{step.text}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section aria-labelledby="team-heading" className="on-paper bg-paper py-24 text-ink md:py-36">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <SectionLabel index="05" className="text-stone">
                  Team
                </SectionLabel>
                <h2 id="team-heading" className="t-h2 mt-6">
                  The people behind the work
                </h2>
              </div>
              {team.some((m) => m.placeholder) && <PlaceholderBadge label="Placeholder team" />}
            </div>
            <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((m, i) => (
                <li key={i}>
                  {m.portrait?.src ? (
                    <img src={m.portrait.src} alt={m.portrait.alt || m.name} loading="lazy" width={600} height={750} className="aspect-[4/5] w-full rounded-2xl object-cover" />
                  ) : (
                    <div aria-hidden="true" className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-ink">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--brand-accent)_35%,transparent),transparent_55%)]" />
                      <span className="font-display text-6xl text-paper/80">{m.name.charAt(0)}</span>
                    </div>
                  )}
                  <h3 className="mt-5 text-lg font-medium">{m.name}</h3>
                  <p className="text-stone">{m.role}</p>
                  {m.bio && <p className="mt-2 text-sm text-stone">{m.bio}</p>}
                  {m.links && m.links.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {m.links
                        .filter((l) => l.href)
                        .map((l) => (
                          <li key={l.href}>
                            <a href={l.href} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-ink underline-offset-4 hover:underline">
                              {l.label}
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <section aria-labelledby="milestones-heading" className="on-paper bg-paper pb-24 text-ink md:pb-36">
          <div className="shell grid gap-12 border-t border-ink/10 pt-24 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel index="06" className="text-stone">
                Milestones
              </SectionLabel>
              <h2 id="milestones-heading" className="t-h2 mt-6">
                Our journey
              </h2>
              {milestones.some((m) => m.placeholder) && <PlaceholderBadge className="mt-6" label="Placeholder milestones" />}
            </div>
            <ol className="relative border-l border-ink/15 lg:col-span-7 lg:col-start-6">
              {milestones.map((m, i) => (
                <li key={i} className="relative pb-12 pl-10 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[5px] top-2 size-[9px] rounded-full bg-accent-ink" />
                  <p className="t-label text-accent-ink">{m.year}</p>
                  <h3 className="mt-2 text-xl font-medium">{m.title}</h3>
                  <p className="mt-2 text-stone">{m.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Verified achievements only */}
      {achievements.length > 0 && (
        <section aria-labelledby="achievements-heading" className="on-paper bg-paper-deep py-24 text-ink">
          <div className="shell">
            <h2 id="achievements-heading" className="t-h2">
              Recognition
            </h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {achievements.map((a) => (
                <li key={a.title} className="border-t border-ink/15 pt-6">
                  <h3 className="font-medium">{a.title}</h3>
                  <p className="mt-2 text-stone">{a.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand />
    </>
  )
}
