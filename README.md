<h2 align="center">Expo Custom Updater</h2>

## Intro

Hi! this is a small project done to help myself on new Expo Apps to better handle OTA updates done via Expo Publish.  
Default Expo App OTA update system automatically checks for new version on application startup, 
then tries to download it within 30 seconds(if you set updates.checkAutomatically in app.json), finally uses the new version on the next application startup.  

This is a nice system, but considering that users rarely close apps that remain open in the background the side effect is that is hard ot predict when the new code will be actually available in the app.  

Writing a manual update can be hard and in case of bugs your app may be stuck in an update cycle (speaking from experience :-) 

This library have two goals:
* Force an update on every app startup
* Force an update when the user go back to the application after some time

In this way your users will always run the up-to-date code published on Expo

## Install

* `npm install expo-custom-updater` or
* `yarn add expo-custom-updater`

## Force an update on every app startup

```JavaScript
import ExpoCustomUpdater from 'expo-custom-updater'

const customUpdater = new ExpoCustomUpdater()

customUpdater.doUpdateIfAvailable()

```

doUpdateIfAvailable is an asyncronus Promise so you can await for it or better place it in the Expo loadResourcesAsync

```JavaScript
async function loadResourcesAsync() {
  await Promise.all([
    customUpdater.doUpdateIfAvailable(),
    Asset.loadAsync([
      require('....'),
      require('...'),
    ]),
    ....
```

## Full setup with App State Change listener 

This allows to check for updates when user returns into the app after some time.
You can set the following options in the class constructor:

* minRefreshSeconds Do not check for updates before minRefreshSeconds from the last check (default 300)
* showDebugInConsole Show what the library is doing in the console (default false)
* beforeCheckCallback Callback function before the check, useful to show a loading screen
* afterCheckCallback Callback function after the check, useful to hide a loading screen if no updates are available (if an update is found the application is restarted).

You can then enable the listener for AppState changes that will trigger an update check when user comes back to the App by running
customUpdater.registerAppStateChangeListener()

Before and when the check is completed the two callbacks will be run, useful to show a loading screen 


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
    this.customUpdater.registerAppStateChangeListener()
  }

  componentWillUnmount () {
    this.customUpdater.removeAppStateChangeListener()
  }

```

 ## Notes:
* You can read activity logs from customUpdater.updateLog (array of strings), useful for debugging
* Expo does not support OTA updates from development or within the Expo App.
* To test your application update method properly it is useful to compile an APK and uplaod it to a connected device with "adb install xxx.apk", then you can play with expo publish to verify the setup 

Have fun!