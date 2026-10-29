import { listTabs, settingsTabs } from '../../scripts/sheet/schema.mjs'

/** A block of the editor: some settings from a settings tab, or a whole list tab. */
export type Block =
  | { kind: 'settings'; tab: string; title?: string; prefixes?: string[]; exclude?: string[] }
  | { kind: 'list'; tab: string; title?: string }

export interface Section {
  id: string
  label: string
  icon: string
  description?: string
  blocks: Block[]
}

/** Admin sidebar → sheet tabs. Every setting and list tab appears exactly once. */
export const sections: Section[] = [
  { id: 'testimonials', label: 'Testimonials', icon: 'quote', description: 'Customer feedback cards on the home page. Only publish genuine reviews the customer agreed to share.', blocks: [{ kind: 'list', tab: 'Testimonials' }] },
  { id: 'team', label: 'Team', icon: 'users', description: 'Team members on the About page.', blocks: [{ kind: 'list', tab: 'Team' }] },
  { id: 'clients', label: 'Clients & collaborators', icon: 'building', description: 'The logo strip on the home page. Only list brands you really work with.', blocks: [{ kind: 'list', tab: 'Clients' }] },
  { id: 'services', label: 'Services', icon: 'briefcase', description: 'Each service gets its own page, a contact-form option and a footer link.', blocks: [{ kind: 'list', tab: 'Services' }] },
  {
    id: 'home',
    label: 'Home page',
    icon: 'home',
    blocks: [
      { kind: 'settings', tab: 'Home', title: 'Hero (top of the page)', prefixes: ['hero.'] },
      { kind: 'settings', tab: 'Home', title: '“Who we are”', prefixes: ['intro.'] },
      { kind: 'list', tab: 'Highlights', title: 'What makes us different' },
      { kind: 'list', tab: 'Stats', title: 'Statistics' },
      { kind: 'settings', tab: 'Home', title: 'Section headings', prefixes: ['clients.', 'testimonials.'] },
      { kind: 'settings', tab: 'Home', title: 'Closing banner (end of every page)', prefixes: ['cta.'] },
    ],
  },
  {
    id: 'about',
    label: 'About page',
    icon: 'info',
    blocks: [
      { kind: 'settings', tab: 'Pages', title: 'Introduction, mission & vision', prefixes: ['about.'] },
      { kind: 'list', tab: 'Values' },
      { kind: 'list', tab: 'How We Work' },
      { kind: 'list', tab: 'Milestones' },
      { kind: 'list', tab: 'Achievements' },
    ],
  },
  {
    id: 'pages',
    label: 'Pages & forms',
    icon: 'file',
    blocks: [
      { kind: 'settings', tab: 'Pages', title: 'Services page', prefixes: ['services_page.'] },
      { kind: 'settings', tab: 'Pages', title: 'Contact page', prefixes: ['contact_page.'] },
      { kind: 'list', tab: 'Contact Steps', title: 'Contact page — what happens next' },
      { kind: 'settings', tab: 'Pages', title: 'Contact form', prefixes: ['contact_form.'] },
      { kind: 'settings', tab: 'Pages', title: 'Feedback page & form', prefixes: ['feedback_page.', 'feedback_form.'] },
      { kind: 'settings', tab: 'Pages', title: 'Legal pages', prefixes: ['privacy.', 'terms.'] },
    ],
  },
  {
    id: 'company',
    label: 'Company & contact',
    icon: 'phone',
    blocks: [
      { kind: 'settings', tab: 'Company', title: 'Company', prefixes: ['company.'] },
      { kind: 'settings', tab: 'Company', title: 'Contact details', prefixes: ['contact.'] },
      { kind: 'list', tab: 'Social Links', title: 'Social media' },
      { kind: 'settings', tab: 'Company', title: 'Footer & launch', prefixes: ['footer.', 'launch.'] },
    ],
  },
  { id: 'colours', label: 'Colours', icon: 'palette', description: 'Used across the whole site and the 3D scene. Keep enough contrast so text stays readable.', blocks: [{ kind: 'settings', tab: 'Colours' }] },
  { id: 'seo', label: 'SEO', icon: 'search', description: 'Titles under 60 characters and descriptions of 120–160 characters work best.', blocks: [{ kind: 'settings', tab: 'SEO' }] },
]

export type SettingRow = (typeof settingsTabs)[number]['rows'][number]
export type ListTab = (typeof listTabs)[number]
export type Column = ListTab['columns'][number]

export function settingRows(block: Extract<Block, { kind: 'settings' }>): SettingRow[] {
  const tab = settingsTabs.find((t) => t.tab === block.tab)
  const rows = (tab?.rows ?? []) as SettingRow[]
  return block.prefixes ? rows.filter((r) => block.prefixes!.some((p) => r.key.startsWith(p))) : rows
}

export function listTab(name: string): ListTab {
  return listTabs.find((t) => t.tab === name) as ListTab
}
