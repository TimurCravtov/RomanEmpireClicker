import ClickArea from './components/ClickArea.jsx'
import Header from './components/Header.jsx'
import { useGame } from './hooks/useGame.js'
import './styles/base.css'
import './styles/layout.css'

export default function App() {
  const { state, stats, actions } = useGame()

  return (
    <div className="app">
      <Header lifetime={state.lifetime} />
      <main className="columns">
        <div className="column">
          <ClickArea denarii={state.denarii} perClick={stats.perClick} perSecond={stats.perSecond} onClick={actions.click} />
        </div>
      </main>
    </div>
  )
}
