import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { PolicySection } from '../../lib/types'

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary'

interface PolicySectionsEditorProps {
  sections: PolicySection[]
  onChange: (sections: PolicySection[]) => void
}

function emptySection(): PolicySection {
  return { heading: '', paragraphs: [''], bullets: [] }
}

export default function PolicySectionsEditor({ sections, onChange }: PolicySectionsEditorProps) {
  const updateSection = (index: number, next: PolicySection) => {
    onChange(sections.map((section, i) => (i === index ? next : section)))
  }

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section heading</label>
              <input
                type="text"
                value={section.heading}
                onChange={(e) =>
                  updateSection(sectionIndex, { ...section, heading: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. Who we are"
              />
            </div>
            <div className="flex items-center gap-1 pt-7">
              <button
                type="button"
                onClick={() => moveSection(sectionIndex, -1)}
                disabled={sectionIndex === 0}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 disabled:opacity-40"
                aria-label="Move section up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveSection(sectionIndex, 1)}
                disabled={sectionIndex === sections.length - 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 disabled:opacity-40"
                aria-label="Move section down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(sections.filter((_, i) => i !== sectionIndex))}
                disabled={sections.length === 1}
                className="p-2 rounded-lg border border-gray-200 bg-white text-red-500 hover:bg-red-50 disabled:opacity-40"
                aria-label="Remove section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Paragraphs</label>
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <div key={paragraphIndex} className="flex gap-2">
                <textarea
                  value={paragraph}
                  onChange={(e) => {
                    const paragraphs = section.paragraphs.map((item, i) =>
                      i === paragraphIndex ? e.target.value : item,
                    )
                    updateSection(sectionIndex, { ...section, paragraphs })
                  }}
                  rows={3}
                  className={`${inputClass} resize-y bg-white`}
                  placeholder="Write a paragraph..."
                />
                <button
                  type="button"
                  onClick={() => {
                    const paragraphs = section.paragraphs.filter((_, i) => i !== paragraphIndex)
                    updateSection(sectionIndex, {
                      ...section,
                      paragraphs: paragraphs.length ? paragraphs : [''],
                    })
                  }}
                  className="self-start p-2 rounded-lg border border-gray-200 bg-white text-red-500 hover:bg-red-50"
                  aria-label="Remove paragraph"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateSection(sectionIndex, {
                  ...section,
                  paragraphs: [...section.paragraphs, ''],
                })
              }
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="w-4 h-4" /> Add paragraph
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Bullet points</label>
            {section.bullets.length === 0 && (
              <p className="text-xs text-gray-400">No bullet points in this section.</p>
            )}
            {section.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex gap-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => {
                    const bullets = section.bullets.map((item, i) =>
                      i === bulletIndex ? e.target.value : item,
                    )
                    updateSection(sectionIndex, { ...section, bullets })
                  }}
                  className={`${inputClass} bg-white`}
                  placeholder="Bullet point"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateSection(sectionIndex, {
                      ...section,
                      bullets: section.bullets.filter((_, i) => i !== bulletIndex),
                    })
                  }}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-red-500 hover:bg-red-50"
                  aria-label="Remove bullet point"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                updateSection(sectionIndex, {
                  ...section,
                  bullets: [...section.bullets, ''],
                })
              }
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Plus className="w-4 h-4" /> Add bullet point
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...sections, emptySection()])}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
      >
        <Plus className="w-4 h-4" /> Add section
      </button>
    </div>
  )
}
