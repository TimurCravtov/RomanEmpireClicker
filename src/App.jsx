import Achievements from './components/Achievements.jsx'
import ActaDiurna from './components/ActaDiurna.jsx'
import Ascend from './components/Ascend.jsx'
import Chronicle from './components/Chronicle.jsx'
import CityView from './components/CityView.jsx'
import ClickArea from './components/ClickArea.jsx'
import Header from './components/Header.jsx'
import Omen from './components/Omen.jsx'
import Shop from './components/Shop.jsx'
import StoryModal from './components/StoryModal.jsx'
import Toasts from './components/Toasts.jsx'
import Upgrades from './components/Upgrades.jsx'
import WelcomeBack from './components/WelcomeBack.jsx'
import { useGame } from './hooks/useGame.js'
import './styles/base.css'
import './styles/layout.css'

export default function App() {
  const { state, stats, actions, toasts, dismissToast, welcomeBack, omen, claimOmen, story } = useGame()

  return (
    <div className="app">
      <Header lifetime={state.lifetime} ascensions={state.ascensions} />
      <ActaDiurna state={state} />
      <CityView owned={state.owned} chapters={state.chapters} />
      <main className="columns">
        <div className="column">
          <ClickArea
            denarii={state.denarii}
            perClick={stats.perClick}
            perSecond={stats.perSecond}
            clicks={state.clicks}
            buffs={state.buffs}
            onClick={actions.click}
          />
          <Achievements unlocked={state.achievements} />
        </div>
        <div className="column">
          <Chronicle state={state} onRead={actions.readChapter} />
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
      <Omen omen={omen} onClaim={claimOmen} />
      <Toasts toasts={toasts} onDismiss={dismissToast} />
      {story && (
        <StoryModal
          key={`${story.chapter.id}-${story.mode}`}
          chapter={story.chapter}
          mode={story.mode}
          chosen={state.choices[story.chapter.id]}
          onChoose={(choiceId) => actions.choose(story.chapter.id, choiceId)}
          onClose={() => (story.mode === 'new' ? actions.markSeen(story.chapter.id) : actions.closeReading())}
        />
      )}
      {welcomeBack && <WelcomeBack {...welcomeBack} onClose={actions.dismissWelcome} />}
    </div>
  )
}
