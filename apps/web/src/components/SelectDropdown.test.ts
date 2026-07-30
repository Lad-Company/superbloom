import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./SelectDropdown.astro', import.meta.url), 'utf8')

describe('SelectDropdown', () => {
  it('uses a details dropdown, not a native select or system dialogue', () => {
    expect(source).toContain('<details')
    expect(source).toContain('<summary')
    expect(source).not.toContain('<select')
  })

  it('shares the chevron, dismissal behavior, and menu styling with the browse dropdowns', () => {
    expect(source).toContain('DropdownChevron')
    expect(source).toContain('initDropdownDismiss')
    expect(source).toContain('data-dropdown')
    expect(source).toContain('underline-draw')
  })

  it('submits through a hidden text input so required validation still gates the form', () => {
    expect(source).toContain('type="text"')
    expect(source).toContain('data-select-dropdown-input')
    expect(source).toContain('required={required}')
    expect(source).not.toContain('type="hidden"')
  })

  it('exposes listbox semantics for assistive technology', () => {
    expect(source).toContain('role="listbox"')
    expect(source).toContain('role="option"')
    expect(source).toContain('aria-selected')
  })

  it('announces a bubbling change event when an option is chosen', () => {
    expect(source).toContain("new Event('change', {bubbles: true})")
  })

  it('keeps the visible label in sync when the surrounding form resets', () => {
    expect(source).toContain("addEventListener('reset'")
    expect(source).toContain('syncDisplay')
  })
})
