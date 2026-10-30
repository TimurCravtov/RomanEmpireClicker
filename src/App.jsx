import Achievements from './components/Achievements.jsx'
import ActaDiurna from './components/ActaDiurna.jsx'
import Ascend from './components/Ascend.jsx'
import Chronicle from './components/Chronicle.jsx'
import CityView from './components/CityView.jsx'
import ClickArea from './components/ClickArea.jsx'
import Header from './components/Header.jsx'
import Omen from './components/Omen.jsx'
import SettingsButtons from './components/Settings.jsx'
import Shop from './components/Shop.jsx'
import StoryModal from './components/StoryModal.jsx'
import Toasts from './components/Toasts.jsx'
import Upgrades from './components/Upgrades.jsx'
import WelcomeBack from './components/WelcomeBack.jsx'
import { useGame } from './hooks/useGame.js'
import { useAudio } from './hooks/useAudio.js'
import { useI18n } from './i18n/index.jsx'
import './styles/base.css'
import './styles/layout.css'

export default function App() {
  const { state, stats, actions, toasts, dismissToast, welcomeBack, omen, claimOmen, story } = useGame()
  const { t } = useI18n()
  useAudio()

  return (
    <div className="app">
      {/* the world: Rome fills the screen, the interface floats above it */}
      <CityView owned={state.owned} chapters={state.chapters} />

      <div className="hud">
        <div className="hud__top">
          <Header lifetime={state.lifetime} ascensions={state.ascensions} />
          <ActaDiurna state={state} />
          <SettingsButtons />
        </div>

        <aside className="hud__column hud__column--left">
          <ClickArea
            denarii={state.denarii}
            perClick={stats.perClick}
            perSecond={stats.perSecond}
            clicks={state.clicks}
            buffs={state.buffs}
            onClick={actions.click}
          />
          <Chronicle state={state} onRead={actions.readChapter} />
          <Ascend state={state} onAscend={actions.ascend} />
          <Achievements unlocked={state.achievements} />
        </aside>

        <aside className="hud__column hud__column--right">
          <Shop denarii={state.denarii} owned={state.owned} perBuilding={stats.perBuilding} onBuy={actions.buyBuilding} />
          <Upgrades state={state} onBuy={actions.buyUpgrade} />
          <footer className="footer muted">
            {t('footer.credits')} <a href="https://game-icons.net">game-icons.net</a> (CC BY 3.0).
            <button
              onClick={() => {
                if (window.confirm(t('footer.resetConfirm'))) actions.reset()
              }}
            >
              {t('footer.reset')}
            </button>
          </footer>
        </aside>
      </div>

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
