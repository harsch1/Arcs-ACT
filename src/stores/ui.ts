import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { useThrottleFn } from '@vueuse/core'
import { useGameStore } from '@/stores/game'

export enum Screen {
  Settings,
  Players,
  Map,
  Deck,
  Misc,
  _TOTAL_
}

export enum Menu {
  System,
  Piece
}

type CurrentMenu = {
  type?: Menu
  id?: string | number
  position: {
    x: number
    y: number
  }
}

export const useUiStore = defineStore('ui', () => {
  const gameStore = useGameStore()

  const currentMenu = reactive<CurrentMenu>({
    type: undefined,
    id: undefined,
    position: { x: -1, y: -1 }
  })
  const mapScale = ref(0.5)
  const currentScreen = ref(Screen.Settings)
  const showNext = computed(() => currentScreen.value < Screen._TOTAL_ - 1)
  // const showBack = computed(() => currentScreen.value < Screen._TOTAL_)
  const canNext = computed(() => {
    // If there are no validations allow advancing by
    return screenValidations[currentScreen.value]?.() ?? true
  })
  const canBack = computed(() => currentScreen.value > 0)

  function advance(delta: number = 1) {
    currentScreen.value += delta
  }

  function go(screen: Screen) {
    currentScreen.value = screen
  }

  // When `null` is returned, everything is fine
  function validate() {
    return screenValidations[currentScreen.value]?.() ?? null
  }

  /**
   * Object with the validations based on the screen to be checked.
   *
   * The validation is a function that returns an array of errors if present,
   * if there are no errors it returns `null`.
   */
  const screenValidations: { [screen in Screen]?: () => string[] | null } = {
    [Screen.Settings]: () => {
      const messages: string[] = []
      if (gameStore.players.length <= 0) {
        messages.push('validations.choose_players')
      }
      return messages.length > 0 ? messages : null
    },
    [Screen.Players]: () => {
      const messages: string[] = []
      // Every player must have their fates assigned
      if (!gameStore.players.every((player) => player.fateHistory.every((history) => history[0]))) {
        messages.push('validations.choose_fates')
      }
      return messages.length > 0 ? messages : null
    }
  }

  const updateMenu = useThrottleFn(
    ({ type, id, position, isOpen }: Partial<CurrentMenu> & { isOpen?: boolean }) => {
      if (currentMenu.type === type && currentMenu.id === id) {
        currentMenu.type = undefined
        currentMenu.id = undefined
        return
      }

      currentMenu.type = type
      currentMenu.id = id
      // Don't update the position when closing to avoid jumping
      if (isOpen !== false) {
        currentMenu.position = position ?? { x: -1, y: -1 }
      }
    },
    200
  )

  return {
    currentMenu,
    mapScale,
    showNext,
    canNext,
    canBack,
    currentScreen,
    advance,
    go,
    validate,
    updateMenu
  }
})
