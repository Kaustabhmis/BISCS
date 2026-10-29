import { ArrowDown, ArrowUp, ChevronDown, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { norm } from '../../cms/model.mjs'
import type { ListItem, Model } from './api'
import { columnSpec, fieldProblem, settingSpec } from './checks'
import { Field } from './fields'
import { listTab, settingRows, type Block, type Column, type Section } from './sections'

function newItem(columns: Column[]): ListItem {
  const cells: Record<string, string> = {}
  for (const col of columns) {
    const c = col as Column & { options?: string[]; default?: string }
    if (c.type === 'bool') cells[norm(c.header)] = 'No'
    else if (c.default && c.options) cells[norm(c.header)] = c.options.find((o) => o.toLowerCase() === String(c.default).toLowerCase()) ?? ''
  }
  return { show: true, cells }
}

export function SectionEditor({ section, model, setModel, readOnly }: { section: Section; model: Model; setModel: (fn: (m: Model) => Model) => void; readOnly: boolean }) {
  return (
    <div className="space-y-6">
      {section.blocks.map((block, i) =>
        block.kind === 'settings' ? (
          <SettingsBlock key={i} block={block} model={model} setModel={setModel} readOnly={readOnly} />
        ) : (
          <ListBlock key={i} block={block} model={model} setModel={setModel} readOnly={readOnly} />
        ),
      )}
    </div>
  )
}

function Card({ title, description, children }: { title?: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
      {title && <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>}
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      <div className={title || description ? 'mt-5' : ''}>{children}</div>
    </section>
  )
}

function SettingsBlock({ block, model, setModel, readOnly }: { block: Extract<Block, { kind: 'settings' }>; model: Model; setModel: (fn: (m: Model) => Model) => void; readOnly: boolean }) {
  const rows = settingRows(block)
  return (
    <Card title={block.title}>
      <div className="grid gap-5">
        {rows.map((row) => (
          <Field
            key={row.key}
            spec={settingSpec(row)}
            value={model.settings[block.tab]?.[row.key] ?? ''}
            disabled={readOnly}
            onChange={(v) => setModel((m) => ({ ...m, settings: { ...m.settings, [block.tab]: { ...m.settings[block.tab], [row.key]: v } } }))}
          />
        ))}
      </div>
    </Card>
  )
}

function ListBlock({ block, model, setModel, readOnly }: { block: Extract<Block, { kind: 'list' }>; model: Model; setModel: (fn: (m: Model) => Model) => void; readOnly: boolean }) {
  const tab = listTab(block.tab)
  const items = model.lists[block.tab] ?? []
  const [open, setOpen] = useState<number | null>(items.length === 1 ? 0 : null)
  const singular = (block.title ?? block.tab).replace(/ies$/, 'y').replace(/s$/, '').toLowerCase()

  const update = (fn: (list: ListItem[]) => ListItem[]) => setModel((m) => ({ ...m, lists: { ...m.lists, [block.tab]: fn(m.lists[block.tab] ?? []) } }))
  const titleCol = (tab.columns.find((c) => (c as { required?: boolean }).required) ?? tab.columns[0]) as Column
  const subtitleCol = tab.columns.find((c) => c !== titleCol && c.type === 'text') as Column | undefined

  return (
    <Card title={block.title ?? undefined} description={block.title ? tab.description : undefined}>
      {items.length === 0 && <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">Nothing here yet.</p>}
      <ol className="space-y-3">
        {items.map((item, i) => {
          const title = item.cells[norm(titleCol.header)]?.trim() || '(untitled)'
          const subtitle = subtitleCol ? item.cells[norm(subtitleCol.header)]?.trim() : ''
          const isOpen = open === i
          const problems = item.show ? tab.columns.filter((c) => fieldProblem(columnSpec(c), item.cells[norm(c.header)] ?? '')).length : 0
          const placeholder = /^yes$/i.test(item.cells.placeholder ?? '')
          return (
            <li key={i} className={`overflow-hidden rounded-xl border transition ${isOpen ? 'border-amber-400 shadow-md shadow-amber-500/10' : 'border-zinc-200'} ${item.show ? 'bg-white' : 'bg-zinc-50'}`}>
              <div className="flex items-center gap-2 p-2 pl-4">
                <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">{i + 1}</span>
                  <span className="min-w-0">
                    <span className={`block truncate font-medium ${item.show ? 'text-zinc-900' : 'text-zinc-400 line-through'}`}>{title}</span>
                    {subtitle && <span className="block truncate text-sm text-zinc-500">{subtitle}</span>}
                  </span>
                  {placeholder && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[0.7rem] font-semibold text-amber-800">Placeholder</span>}
                  {!item.show && <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 text-[0.7rem] font-semibold text-zinc-600">Hidden</span>}
                  {problems > 0 && <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[0.7rem] font-semibold text-red-700">{problems} to fix</span>}
                  <ChevronDown aria-hidden="true" className={`ml-auto size-4 shrink-0 text-zinc-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="flex shrink-0 items-center">
                  <IconButton label={item.show ? 'Hide on website' : 'Show on website'} disabled={readOnly} onClick={() => update((l) => l.map((x, j) => (j === i ? { ...x, show: !x.show } : x)))}>
                    {item.show ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </IconButton>
                  <IconButton label="Move up" disabled={readOnly || i === 0} onClick={() => (update((l) => swap(l, i, i - 1)), setOpen(isOpen ? i - 1 : open))}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Move down" disabled={readOnly || i === items.length - 1} onClick={() => (update((l) => swap(l, i, i + 1)), setOpen(isOpen ? i + 1 : open))}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Delete"
                    danger
                    disabled={readOnly}
                    onClick={() => {
                      if (window.confirm(`Delete “${title}”? You can undo this by not saving.`)) {
                        update((l) => l.filter((_, j) => j !== i))
                        setOpen(null)
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </div>
              {isOpen && (
                <div className="grid gap-5 border-t border-zinc-100 p-5">
                  {tab.columns.map((col) => (
                    <Field
                      key={col.header}
                      spec={columnSpec(col)}
                      value={item.cells[norm(col.header)] ?? ''}
                      disabled={readOnly}
                      onChange={(v) => update((l) => l.map((x, j) => (j === i ? { ...x, cells: { ...x.cells, [norm(col.header)]: v } } : x)))}
                    />
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => {
          update((l) => [...l, newItem(tab.columns)])
          setOpen(items.length)
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-amber-500 hover:text-amber-700 disabled:opacity-50"
      >
        <Plus className="size-4" aria-hidden="true" /> Add {singular}
      </button>
    </Card>
  )
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

function IconButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-lg text-zinc-500 transition disabled:opacity-30 ${danger ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-zinc-100 hover:text-zinc-900'}`}
    >
      {children}
    </button>
  )
}
