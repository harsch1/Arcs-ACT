import { h, ref, onMounted } from 'vue'

// Manage all the shapes
import s1A from '@/components/game/shapes/system-1a.svg'
import s1C from '@/components/game/shapes/system-1c.svg'
import s1H from '@/components/game/shapes/system-1h.svg'
import s1G from '@/components/game/shapes/system-1g.svg'
import s2A from '@/components/game/shapes/system-2a.svg'
import s2C from '@/components/game/shapes/system-2c.svg'
import s2H from '@/components/game/shapes/system-2h.svg'
import s2G from '@/components/game/shapes/system-2g.svg'
import s3A from '@/components/game/shapes/system-3a.svg'
import s3C from '@/components/game/shapes/system-3c.svg'
import s3H from '@/components/game/shapes/system-3h.svg'
import s3G from '@/components/game/shapes/system-3g.svg'
import s4A from '@/components/game/shapes/system-4a.svg'
import s4C from '@/components/game/shapes/system-4c.svg'
import s4H from '@/components/game/shapes/system-4h.svg'
import s4G from '@/components/game/shapes/system-4g.svg'
import s5A from '@/components/game/shapes/system-5a.svg'
import s5C from '@/components/game/shapes/system-5c.svg'
import s5H from '@/components/game/shapes/system-5h.svg'
import s5G from '@/components/game/shapes/system-5g.svg'
import s6A from '@/components/game/shapes/system-6a.svg'
import s6C from '@/components/game/shapes/system-6c.svg'
import s6H from '@/components/game/shapes/system-6h.svg'
import s6G from '@/components/game/shapes/system-6g.svg'

const shapes = {
  '1A': s1A,
  '1C': s1C,
  '1H': s1H,
  '1G': s1G,
  '2A': s2A,
  '2C': s2C,
  '2H': s2H,
  '2G': s2G,
  '3A': s3A,
  '3C': s3C,
  '3H': s3H,
  '3G': s3G,
  '4A': s4A,
  '4C': s4C,
  '4H': s4H,
  '4G': s4G,
  '5A': s5A,
  '5C': s5C,
  '5H': s5H,
  '5G': s5G,
  '6A': s6A,
  '6C': s6C,
  '6H': s6H,
  '6G': s6G
}

export default {
  props: {
    position: {
      type: Object,
      required: true,
      default(/*rawProps*/) {
        return { x: 0, y: 0 }
      }
    },
    systemConfig: {
      type: Object,
      required: true
    }
  },
  emits: ['click', 'mounted'],
  setup(props, { emit }) {
    const svgRendered = shapes[props.systemConfig.id]?.render()
    const el = ref() // Main wrapper
    const path = ref() // Actual shape

    const onClick = function (e: PointerEvent) {
      emit('click', props.systemConfig.id, e)
    }

    onMounted(() => {
      emit('mounted', {
        el: el.value,
        shape: path.value,
        bbox: path.value.getBoundingClientRect()
      })
    })

    return () =>
      h(
        svgRendered.type,
        {
          ...svgRendered.props,
          ref: el,
          style: {
            pointerEvents: 'none',
            scale: props.systemConfig.scale,
            left: `${props.systemConfig.position.x}px`,
            top: `${props.systemConfig.position.y}px`,
            transformOrigin: 'top left'
          },
          'data-system-id': props.systemConfig.id
        },
        svgRendered.children?.map((child) =>
          h(child.type, {
            ref: path,
            style: {
              pointerEvents: 'all'
            },
            onClick: (e: PointerEvent) => {
              onClick(e)
            },
            ...child.props
            // fill: '#fffA'
          })
        )
      )
  }
}
