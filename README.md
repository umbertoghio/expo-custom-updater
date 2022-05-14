<h2 align="center">Expo Custom Updater</h2>

## Intro

Hi! this is a small project done to help myself on new Expo projects to better handle OTA updates done via Expo Publish.  

Expo OTA updates is a great system that automatically checks for new version on application startup if you set updates.checkAutomatically in app.json (i.e. to 30000 for 30 seconds).
  
The problem is that the users will only see your code (and your fixes) on the NEXT application startup.  
This makes it hard to predict when the new code will be actually available in the app, expecially with some users that never close their applications.  
  
Writing a manual update routine can be difficult as a bug in this process may cause your app to be stuck in an update cycle (speaking from experience 🤣) 

This library have two goals:
* Force an update on every app startup
* Force an update when the user go back to the application after some time (i.e. left the app open)

In this way your users will always run the up-to-date code published on Expo, either when opening the app for the fist time or when coming back to it!

## VERSION 2.0.0 BREAKING CHANGES
Changelog:
* Moved to Hooks, now it's much simpler to use and integrate
* Simplifyed the code and configuration

Please use version 1.1.3 if you want the older behavior / class

## Install
* `expo install expo-updates`
* `yarn add expo-custom-updater`

## Configue app.json

Add below config in Expo project's `app.json` to prevent Expo from automatically fetching the latest update every time your app is launched.

```
"updates": {
    "enabled": true,
    "checkAutomatically": "ON_ERROR_RECOVERY"
}
```

## Simple / Default use case

Import useCustomUpdater and add it to your root / main component, that's it.
It will:
* Check for an update on app startup, if present will download it and reload the app
* Check for an update if the user comes back to the app after 5 minutes, if present will download it and reload the app

```JavaScript
import { useCustomUpdater } from 'expo-custom-updater'
...
// Inside your functional component
useCustomUpdater()


```
## Customize the behavior and access debug information

```JavaScript
import { useCustomUpdater } from 'expo-custom-updater'
...
// Example setup with full customization
useCustomUpdater({
  updateOnStartup: false, // in case you want to run the startup check manually, see below
  minRefreshSeconds: 600, // in case you want a longer time
  showDebugInConsole: true, // what is the library doing?
  beforeCheckCallback: () => setShowSpinner(true), // When users comes back to the app after some time I want to show a spinner while checking for updates
  beforeDownloadCallback: () => setShowNewAppVersionPage(true), // There's a new update! show the user some info while he waits, app will be restarted
  afterCheckCallback: () => setShowSpinner(false), // No updates? hide the spinner
  throwUpdateErrors: true // in case you want to catch update errors yourself
})
```
* updateOnStartup (boolean, default true): Will check for updates on startup and reload the app if an update is available
* minRefreshSeconds (int, default 300): Wait at least 300 seconds before checking for app updates when the user comes back into the app (user left app open in background for a while)
* showDebugInConsole (boolean, default false) Show what the library is doing in the console
* beforeCheckCallback (function, default null): Used when user returns into the application, fired if minRefreshSeconds has passed before checking for updates. Useful to show a loading / spinner screen
* beforeDownloadCallback (function, default null): In case an update is available run this funciton. Useful to trigger a loading screen with a message about a new version being downloaded
* afterCheckCallback (function, default null): Fired in case there are no updates after checking. Useful to hide the loading screen (if an update is found the application is restarted).
* throwUpdateErrors (optional, default false) will trhow an exception in case of update errors. It's important to handle this exception properly as setting this to true and not catching the error could result in an infinite update / crash /restart loop

On most of my projects I just use 
```JavaScript
useCustomUpdater({
  beforeCheckCallback: () => setShowSpinner(true),
  beforeDownloadCallback: () => setShowUpdateIsDownlading(true),
  afterCheckCallback: () => setShowSpinner(false),
})
```

## Just force an update on startup

If you don't want to handle the case where the user keeps the app open you may just want to use this function to run an update.

```JavaScript
import { doUpdateIfAvailable } from 'expo-custom-updater'

await doUpdateIfAvailable()

```
doUpdateIfAvailable can accept additional parameters:

* force (boolean, default false): skip the result of Expo's Updates.checkForUpdateAsync() and always performs a download / install. Useful only in development.
* throwUpdateErrors (boolean, default false): will trhow an exception in case of update errors. It's important to handle this exception properly as setting this to true and not catching the error could result in an infinite update / crash /restart loop.
* beforeDownloadCallback (function, default null): In case an update is available run this funciton. Useful to trigger a loading screen with a message about a new version being downloaded

```JavaScript
doUpdateIfAvailable({
  force: true
  throwUpdateErrors: false,
  beforeDownloadCallback: () => setShowUpdateIsDownlading(true)
  })
```

## You must debug updates on a compiled app!
Expo does not support OTA updates from development or within the Expo App, so check for updates is skipped in __DEV__ mode.

To test your application update method properly it is useful to compile an APK and install it to a connected device with "adb install xxx.apk", then you can play with expo publish to verify the setup 
Since you can't access console logs there's another function you can use to get an array of strings and display it in a page.
getUpdateLog is not an hook, it get all the logs from the app start until when is called (i.e. use a setInterval)

```JavaScript
import { getUpdateLogs } from 'expo-custom-updater'

<View>
  {getUpdateLogs().map((log) => <Text>{log}</Text>)}
</View>

```


 ## Notes:
* 
* 

Have fun!
