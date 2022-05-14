import { useRef, useEffect } from 'react'
import { AppState } from 'react-native'
import * as Updates from 'expo-updates'

const updater = {
  logs: [],
  lastTimeCheck: 0,
  showDebugInConsole: false,
  default_min_refresh_interval: 300
}

const log = (message) => {
  updater.logs.push(message)
  updater.showDebugInConsole && console.log(message)
}

const getUnixEpoch = () => Math.floor(Date.now() / 1000)

export const getUpdateLogs = () => updater.logs

export const doUpdateIfAvailable = async ({ beforeDownloadCallback, throwUpdateErrors, force } = {}) => {
  updater.lastTimeCheck = getUnixEpoch()

  if (__DEV__) {
    log('doUpdateIfAvailable: Unable to update or check for updates in DEV')
    return false
  }

  try {
    log('doUpdateIfAvailable: Checking for updates...')
    const { isAvailable } = await Updates.checkForUpdateAsync()

    log(`doUpdateIfAvailable: Update available? ${isAvailable}`)
    if (!isAvailable && !force) return false

    log('doUpdateIfAvailable: Fetching Update')
    beforeDownloadCallback && beforeDownloadCallback()
    await Updates.fetchUpdateAsync()

    log('updateApp: Update fetched, reloading...')
    await Updates.reloadAsync()
  } catch (e) {
    log(`doUpdateIfAvailable: ERROR: ${e.message}`)
    if (throwUpdateErrors) throw e
    return false
  }
}

export const useCustomUpdater = ({
  updateOnStartup = true,
  minRefreshSeconds = updater.default_min_refresh_interval,
  showDebugInConsole = false,
  beforeCheckCallback = null,
  beforeDownloadCallback = null,
  afterCheckCallback = null,
  throwUpdateErrors = false
} = {}) => {
  const appState = useRef(AppState.currentState)

  updater.showDebugInConsole = showDebugInConsole

  useEffect(() => {
    // Check for updates on app startup, app will be restarted in case of success
    updateOnStartup && doUpdateIfAvailable({ beforeDownloadCallback, throwUpdateErrors })

    const subscription = AppState.addEventListener('change', _handleAppStateChange)
    return () => {
      subscription.remove()
    }
  }, [])

  const _handleAppStateChange = async (nextAppState) => {
    const isBackToApp = appState.current.match(/inactive|background/) && nextAppState === 'active'
    const isTimeToCheck = (getUnixEpoch() - updater.lastTimeCheck) > minRefreshSeconds

    appState.current = nextAppState
    log(`appStateChangeHandler: AppState: ${appState.current}, NeedToCheckForUpdate? ${isBackToApp && isTimeToCheck}`)

    if (!isTimeToCheck || !isBackToApp) {
      isBackToApp && !isTimeToCheck && log('appStateChangeHandler: Skip check, within refresh time')
      return false
    }

    beforeCheckCallback && beforeCheckCallback()
    await doUpdateIfAvailable({ beforeDownloadCallback, throwUpdateErrors })
    afterCheckCallback && afterCheckCallback()
  }
}
