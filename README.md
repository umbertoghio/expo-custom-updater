<h2 align="center">Expo Custom Updater</h2>

## Intro

Hi! this is a small project done to help myself on new Expo App to better handle updates done via Expo Publish.
Default Expo App OTA updates automatically checks for new version on application startup, with a 30 seconds timeout configured in app.json updates.checkAutomatically, this is nice but have a big limitation: no checks will be done if user just keeps the app open in the background.

With this library you can force an update on app startup and perform update checks whenever the user go back to the App. Using the callback functionns you can properly show a loading screen while checks and updates are performed.

## Install

* `npm install expo-custom-updater` or
* `yarn add expo-custom-updater`

## Just force update App on Startup

```JavaScript
import ExpoCustomUpdater from 'expo-custom-updater'

const customUpdater = new ExpoCustomUpdater()

customUpdater.doUpdateIfAvailable()

```

doUpdateIfAvailable is an asyncronus Promise so you can await for it or place it in the Expo loadResourcesAsync

```JavaScript
async function loadResourcesAsync() {
  await Promise.all([
    customUpdater.doUpdateIfAvailable()
    Asset.loadAsync([
      require('....'),
      require('...'),
    ]),
    ....
```

## Full setup with App State Change listener

This allows to check for updates when user returns into the app after some time.
You can set the following options in the class constructor:
a custom interval (default is 5 minutes) by setting minRefreshSeconds in the cosntructor.
* minRefreshSeconds Do not check for updates before minRefreshSeconds from the last check (default 300)
* showDebugInConsole Show what the library is doing in the console (default false)
* beforeCheckCallback Callback functionn before the check, useful to show a loading screen
* afterCheckCallback Callback functionn after the check, useful to hide a loading screen if no updates are available.

Note:
You can read activity logs from customUpdater.updateLog (array of strings)
Expo does not support OTA updates from development.
It is useful to compile an APK and do final tests by loading it to device (adb install xxx.apk) and playing with expo publish

```JavaScript
export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = { showLoadingScreen: true }
    this.customUpdater = new ExpoCustomUpdater({
      minRefreshSeconds: 600,
      showDebugInConsole: true,
      beforeCheckCallback: () => this.setState({ showLoadingScreen: true }),
      afterCheckCallback: () => this.setState({ showLoadingScreen: false })
    })
  }
  componentDidMount () {
    this.customUpdater.registerUpdateOnAppStateChange()
  }

  componentWillUnmount () {
    this.customUpdater.removeAppStateChangeListener()
  }

```

Have fun!