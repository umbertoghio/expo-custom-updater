import { AppState } from 'react-native'
import * as Updates from 'expo-updates'

const DEFAULT_MIN_REFRESH_INTERVAL = 300
const getUnixEpoch = () => Math.floor(Date.now() / 1000)

export default class ExpoCustomUpdater {
  constructor ({
    minRefreshSeconds = DEFAULT_MIN_REFRESH_INTERVAL,
    showDebugInConsole = false,
    beforeCheckCallback = null,
    beforeDownloadCallback = null,
    afterCheckCallback = null
  } = {}) {
    this.minRefreshSeconds = minRefreshSeconds
    this.showDebugInConsole = showDebugInConsole
    this.beforeCheckCallback = beforeCheckCallback
    this.beforeDownloadCallback = beforeDownloadCallback
    this.afterCheckCallback = afterCheckCallback
    this.lastCheck = 0
    this.appState = AppState.currentState || 'error'
    this.updateLog = []
    this.appStateChangeHandler = this.appStateChangeHandler.bind(this)
    this.isAppUpdateAvailable = this.isAppUpdateAvailable.bind(this)
    this.doUpdateIfAvailable = this.doUpdateIfAvailable.bind(this)
  }

  log (message) {
    __DEV__ && this.showDebugInConsole && console.log(message)
    this.updateLog.push(message)
  }

  registerAppStateChangeListener () {
    this.log('ExpoCustomUpdater: AppStateChange Handler Registered')
    AppState.addEventListener('change', this.appStateChangeHandler)
  }

  removeAppStateChangeListener () {
    this.log('ExpoCustomUpdater: AppStateChange Handler Removed')
    AppState.removeEventListener('change', this.appStateChangeHandler)
  }

  async appStateChangeHandler (nextAppState) {
    const isBackToApp = !!this.appState.match(/inactive|background/) && nextAppState === 'active'
    const isTimeToCheck = (getUnixEpoch() - this.lastCheck) > this.minRefreshSeconds

    this.appState = nextAppState
    this.log(`appStateChangeHandler: AppState: ${this.appState}, NeedToCheckForUpdate? ${isBackToApp && isTimeToCheck}`)

    if (!isTimeToCheck || !isBackToApp) {
      isBackToApp && !isTimeToCheck && this.log('appStateChangeHandler: Skip check, within refresh time')
      return false
    }

    this.beforeCheckCallback && this.beforeCheckCallback()
    await this.doUpdateIfAvailable()
    this.afterCheckCallback && this.afterCheckCallback()
  }

  async doUpdateIfAvailable () {
    this.lastCheck = getUnixEpoch()
    const isAvailable = await this.isAppUpdateAvailable(true)
    this.log(`doUpdateIfAvailable: ${isAvailable ? 'Doing' : 'No'} update`)
    isAvailable && this.doUpdateApp()
  }

  async isAppUpdateAvailable (skipTimeCheck) {
    this.lastCheck = getUnixEpoch()
    if (__DEV__) {
      this.log('isAppUpdateAvailable: Unable to check for update in DEV')
      return false
    }
    try {
      const expoUpdates = await Updates.checkForUpdateAsync()
      const updateAvailable = expoUpdates && expoUpdates.isAvailable
      this.log(`isAppUpdateAvailable: ${updateAvailable}`)
      return updateAvailable
    } catch (e) {
      this.log(`isAppUpdateAvailable: ERROR: ${e.message}`)
      return false
    }
  }

  async doUpdateApp () {
    try {
      if (__DEV__) {
        this.log('doUpdateApp: Unable to update in DEV')
        return false
      }

      this.beforeDownloadCallback && this.beforeDownloadCallback()

      this.log('doUpdateApp: Fetching Update')
      await Updates.fetchUpdateAsync()

      this.log('doUpdateApp: Update fetched, reloading...')
      await Updates.reloadAsync()
    } catch (e) {
      this.log(`doUpdateApp: ERROR: ${e.message}`)
    }
  }
}
