import type { Color } from '@/Archive'

const config: Record<Exclude<Color, Color.free>, any> = {
  RED: {
    filter:
      'invert(26%) sepia(86%) saturate(2159%) hue-rotate(346deg) brightness(87%) contrast(89%) drop-shadow(0 0 8px black)'
  },
  BLUE: {
    filter:
      'invert(39%) sepia(43%) saturate(5577%) hue-rotate(164deg) brightness(94%) contrast(98%) drop-shadow(0 0 8px black)'
  },
  YELLOW: {
    filter:
      'invert(69%) sepia(82%) saturate(443%) hue-rotate(3deg) brightness(98%) contrast(98%) drop-shadow(0 0 8px black)'
  },
  WHITE: {
    filter:
      'invert(100%) sepia(0%) saturate(938%) hue-rotate(93deg) brightness(115%) contrast(100%) drop-shadow(0 0 8px black)'
  },
  EMPIRE: {
    filter:
      'invert(20%) sepia(98%) saturate(6993%) hue-rotate(269deg) brightness(94%) contrast(100%) drop-shadow(0 0 8px black)'
  }
}

export default config
