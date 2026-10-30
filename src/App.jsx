import Achievements from './components/Achievements.jsx'
import Ascend from './components/Ascend.jsx'
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
          <Ascend state={state} onAscend={actions.ascend} />
        </div>
        <div className="column column--shop">
          <Shop denarii={state.denarii} owned={state.owned} perBuilding={stats.perBuilding} onBuy={actions.buyBuilding} />
        </div>
      </main>
      <footer className="footer muted">
        Icons by Lorc, Delapouite &amp; Skoll from <a href="https://game-icons.net">game-icons.net</a> (CC BY 3.0).
        <button
          onClick={() => {
            if (window.confirm('Erase all progress, including Glory and achievements?')) actions.reset()
          }}
        >
          Reset game
        </button>
      </footer>
      <Toasts toasts={toasts} onDismiss={dismissToast} />
      {welcomeBack && <WelcomeBack {...welcomeBack} onClose={dismissWelcome} />}
    </div>
  )
}
