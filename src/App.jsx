import Achievements from './components/Achievements.jsx'
import ClickArea from './components/ClickArea.jsx'
import Header from './components/Header.jsx'
import Shop from './components/Shop.jsx'
import Toasts from './components/Toasts.jsx'
import Upgrades from './components/Upgrades.jsx'
import WelcomeBack from './components/WelcomeBack.jsx'
import { useGame } from './hooks/useGame.js'
import './styles/base.css'
import './styles/layout.css'

export default function App() {
  const { state, stats, actions, toasts, dismissToast, welcomeBack, dismissWelcome } = useGame()

  return (
    <div className="app">
      <Header lifetime={state.lifetime} />
      <main className="columns">
        <div className="column">
          <ClickArea denarii={state.denarii} perClick={stats.perClick} perSecond={stats.perSecond} onClick={actions.click} />
          <Achievements unlocked={state.achievements} />
        </div>
        <div className="column">
          <Upgrades state={state} onBuy={actions.buyUpgrade} />
        </div>
        <div className="column column--shop">
          <Shop denarii={state.denarii} owned={state.owned} perBuilding={stats.perBuilding} onBuy={actions.buyBuilding} />
        </div>
      </main>
      <Toasts toasts={toasts} onDismiss={dismissToast} />
      {welcomeBack && <WelcomeBack {...welcomeBack} onClose={dismissWelcome} />}
    </div>
  )
}
