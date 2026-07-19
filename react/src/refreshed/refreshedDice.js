// Player-screen dice: rolls inside the phone card (the #lab-dice-box layer
// rendered by RefreshedPlayer), so dice tumble only within the card.
import { createDiceRoller } from '../lib/diceRoller'

export const rollLabDice = createDiceRoller({
  selector: '#lab-dice-box',
  scale: 4, // smaller dice for the in-phone canvas
})
