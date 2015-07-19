# PolySonic
HTML5 Subsonic client

<img src="https://lh3.googleusercontent.com/mmNqprtIDiGfJF4HN7-q3MLS50ZaeP6jXWFBF119tOG1jARxeBZh00pfuCbSIX39oGGEYptQ9A4=s640-h400-e365-rw">

<a href="https://chrome.google.com/webstore/detail/polysonic/dmijgonnbeadbncajpphnlidgjkgmblf" target="_blank">
  <img src="https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png">
</a>


Changelog

0.2.5

- fix bug that caused app to display no albums if attempting to removing a folder filter to display all folders.

- timer for mini player on album wall to hide on paused music extended to 10 mins from 2 mins.

- repeat option on main player and also on playlist more options menu.

- album art more button goes directlly to the album details dialog (slider will no longer cover art)

- app is now resizable.

0.2.4

- now playing indicator has been removed and replaced with a mini player that slides in from bottom of page

- app now correctly hides options users do not have role for (podcast administration, downloads)

- license date now counts down days till expiration

- app now manages it's own downloads. no more launching a chrome window when downloading (uses xmlHttpRequest and chrome file system API)

- more secure authentication method in place for api version 1.13.0

- more animations

0.2.3

- redesigned search feature

- tooltips on buttons without labels

- other things (nothing exciting)

0.2.2

- UI enhancements

- bug fixes

- dynamic fab color now works for podcast. if art was downloaded before version 0.2.2 cache will have to be cleared. (in settings menu)

0.2.1.1

- hotfix for bug caused by bug fix

0.2.1

- bug fixes

0.2.0

- redesign list mode for album wall to better match material design standards

- performance tweaks

0.1.9.1

- fix for bug when playing album from details dialog fab would go off screen leaving player without play queue button

0.1.9

- Last FM scrobble support

- restyle system button bar to better match other material design apps 

- minor performance changes

- artist list now has a dropdown to jump to artist starting a letter 

0.1.8

- minor UI changes

- when loging in with a url ending with a forward slash the app will now trim the slash from end of string and connect as usual in place of throwing a error toast

- corrected error toast when app fails to connect to server at login

- fix error when clearing stored settings that caused bit rate not to default back to 320kbps 

- option to playback saved playlists as well as save current play queue to a playlist for playback at a later time

0.1.7

- minor performance enhancement for album-art / album-wall 

- configured with chrome.i18n api / localization support currently only US English configured

- fix issue with download button cause by 0.1.6

- changed close button on album details to a back button 

0.1.6

- UI updates

- search disabled

- album wall now pulls a set number of albums at a time

- color thief now always enabled

- performance fixes

0.1.5

- update UI for album details

- improved Color Thief mode / now play fab on album details matches art if mode is enabled

- removed a transition in a attempt to fix audio stutter when animating between player and album wall

- remove function that stored scroller position. it is not needed with updates artist details and removal of transition

0.1.4

- performance fix when using Color Thief mode / must clear cache in settings 

0.1.3.1

- typo fix

0.1.3
- add support for changing number of songs returned in shuffle mode

- add color thief support. used to dynamically style app based off dominant color of currently playing album art - **WORK IN PROGRESS not recommended and disabled by default** more info here http://lokeshdhakar.com/projects/color-thief/

- all album art now fetched no larger then 550px greatly reducing the size of metadata stored in local storage // recommend going to settings and clearing cache and reload app after. this will ensure that all old art is cleared and new grabbed from server

0.1.2
- Fix for musicFolderId filter not updating list when changed

- Fix bug making list display no results if musicFolderId was set to 0

- Change size of default query down to 20 from 40 in a attempt to help load art quicker / changeable in settings menu

- Enhancement to UI of play queue dialog

- Fix bug in lazy load that caused app not to get additional albums correctly

- Various wording & minor UI updates

- Enhancement to UI for search dialog

- Option to see amount of space taken up by metadata in settings menu

0.1.1

- support for musicFolderId filter

- autodetect api version
