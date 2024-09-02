import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useGameStore } from './game'

export enum Screen {
  Settings,
  Players,
  Map,
  Deck,
  Misc,
  _TOTAL_
}

export const useUiStore = defineStore('ui', () => {
  const gameStore = useGameStore()

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

  return { mapScale, showNext, canNext, canBack, currentScreen, advance, go, validate }
})
