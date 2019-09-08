import { AppState } from 'react-native'
import { Updates } from 'expo'
import moment from 'moment'

const DEFAULT_MIN_REFRESH_INTERVAL = 30

export default class ExpoCustomUpdater {
  constructor ({
    minRefreshSeconds = DEFAULT_MIN_REFRESH_INTERVAL,
    showDebugInConsole = false,
    beforeCheckCallback = null,
    afterCheckCallback = null
  } = {}) {
    this.minRefreshSeconds = minRefreshSeconds
    this.showDebugInConsole = showDebugInConsole
    this.beforeCheckCallback = beforeCheckCallback
    this.afterCheckCallback = afterCheckCallback
    this.lastCheck = 0
    this.appState = AppState.currentState || 'error'
    this.updateLog = []
    this.appStateChangeHandler = this.appStateChangeHandler.bind(this)
  }

  log (message) {
    __DEV__ && this.showDebugInConsole && console.log(message)
    this.updateLog.push(message)
  }

  registerUpdateOnAppStateChange () {
    this.log('ExpoCustomUpdater: AppStateChange Handler Registered')
    AppState.addEventListener('change', this.appStateChangeHandler)
  }

  removeAppStateChangeListener () {
    this.log('ExpoCustomUpdater: AppStateChange Handler Removed')
    AppState.removeEventListener('change', this.appStateChangeHandler)
  }

  async appStateChangeHandler (nextAppState) {
    const needToCheck =
      !!this.appState.match(/inactive|background/) && nextAppState === 'active'
    this.log(`appStateChangeHandler: ${nextAppState} Update? ${needToCheck}`)
    this.appState = nextAppState
    if (!needToCheck) return false
    this.beforeCheckCallback && this.beforeCheckCallback()
    await this.doUpdateIfAvailable()
    this.afterCheckCallback && this.afterCheckCallback()
  }

  async doUpdateIfAvailable () {
    const isAvailable = await this.isAppUpdateAvailable()
    this.log(`doUpdateIfAvailable: ${isAvailable ? 'Doing' : 'No'} update`)
    isAvailable && this.doUpdateApp()
  }

  async isAppUpdateAvailable () {
    const { lastCheck, minRefreshSeconds } = this
    if (__DEV__) {
      this.log('isAppUpdateAvailable: Unable to check for update in DEV')
      return false
    }
    if (moment().unix() - lastCheck < minRefreshSeconds) {
      this.log('isAppUpdateAvailable: Skip check, within refresh time')
      return false
    }
    try {
      this.lastCheck = moment().unix()
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

      this.log('doUpdateApp: Fetching Update')
      await Updates.fetchUpdateAsync()

      this.log('doUpdateApp: Update fetched, reloading...')
      Updates.reloadFromCache()
    } catch (e) {
      this.log(`doUpdateApp: ERROR: ${e.message}`)
    }
  }
}
