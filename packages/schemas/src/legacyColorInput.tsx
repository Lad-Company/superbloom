import {ColorInput} from '@sanity/color-input'
import {set, type ObjectInputProps} from 'sanity'
import {useEffect, useMemo} from 'react'

type LegacyColor = {
  _type?: string
  hex?: string
  hsl?: unknown
  hsv?: unknown
  rgb?: unknown
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

const hue = (red: number, green: number, blue: number, maximum: number, delta: number) => {
  if (delta === 0) return 0
  if (maximum === red) return ((green - blue) / delta + 6) % 6
  if (maximum === green) return (blue - red) / delta + 2
  return (red - green) / delta + 4
}

const colorFromHex = (hex: string) => {
  const value = hex.replace('#', '')
  if (!/^[\da-f]{6}$/i.test(value)) return undefined

  const red = Number.parseInt(value.slice(0, 2), 16) / 255
  const green = Number.parseInt(value.slice(2, 4), 16) / 255
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const delta = maximum - minimum
  const lightness = (maximum + minimum) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  const hueValue = hue(red, green, blue, maximum, delta) * 60

  return {
    _type: 'color',
    hex: `#${value.toLowerCase()}`,
    alpha: 1,
    hsl: {_type: 'hslaColor', h: hueValue, s: clamp(saturation), l: clamp(lightness), a: 1},
    hsv: {
      _type: 'hsvaColor',
      h: hueValue,
      s: maximum === 0 ? 0 : clamp(delta / maximum),
      v: clamp(maximum),
      a: 1,
    },
    rgb: {
      _type: 'rgbaColor',
      r: Math.round(red * 255),
      g: Math.round(green * 255),
      b: Math.round(blue * 255),
      a: 1,
    },
  }
}

export function legacyColorInput(props: ObjectInputProps) {
  const value = props.value as LegacyColor | undefined
  const normalizedColor = useMemo(() => {
    if (!value?.hex || (value.hsl && value.hsv && value.rgb)) return undefined
    return colorFromHex(value.hex)
  }, [value])

  useEffect(() => {
    if (normalizedColor) props.onChange(set(normalizedColor))
  }, [normalizedColor, props.onChange])

  return <ColorInput {...props} />
}
