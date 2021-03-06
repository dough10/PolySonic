# PolySonic
HTML5 Subsonic client

<img src="https://lh3.googleusercontent.com/mmNqprtIDiGfJF4HN7-q3MLS50ZaeP6jXWFBF119tOG1jARxeBZh00pfuCbSIX39oGGEYptQ9A4=s640-h400-e365-rw">

<a href="https://chrome.google.com/webstore/detail/polysonic/dmijgonnbeadbncajpphnlidgjkgmblf" target="_blank">
  <img src="https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png">
</a>


Required software for development environment

- NPM

- Bower

- Grunt

Steps to install development environment

1. install NPM

2. install Bower 'npm install -g bower'

3. install Grunt 'npm install -g grunt-cli'

4. clone repo 'git clone https://github.com/dough10/PolySonic.git'

5. cd to project root dir 'cd PolySonic'

6. run 'npm install' this will install the rest of the build environment

7. cd to src folder 'cd src'

8. run 'bower install'

After making changes run 'grunt' from the project root directory

Changelog
0.2.9.2

- when finished playing playlist will not longer be automatically cleared

- previous track button will now restart the track if pressed while first song in a playlist is currently playing if not the first track will jump back 1 track

- fix multi disc sorting (tracks will now be displayed in the order they are intended to be played)

- fix for bookmark window not reopening after deleting a bookmark

- if downloaded artist header image is larger then 800 px will now be resized to 800 px width before saving

- if app is closed with files in the play queue user will get option to resume that queue

- minor bug fixes

0.2.9.1

- fix for issue where when changing servers folder dropdown might hide and not reappear

- fix for when changing configs and attempting to clear up album metadata. app would attempt to clear data for a server it has not yet connected to (this may be preventing users from loging in)

0.2.9

- change max # of albums returned by search to 200. up from 20

- if there is playing content the "mini player" will now shown at bottom of settings page aswell

- "mini player" now has link to volume dialog

- album details dialog now has the link "more by this artist"

- updates to artists page styling (larger artist image recentered using SmartCrop.js, not perfect but better then allowing to crop the center)

- flushing image cache no longer requires app restart

- option to browse Subsonic library by folder index as opposed to ID3 info (changeable from a dropdown on settings page, image cache cleard and content refreshed on change) ** currently assumes the folowing folder structure imported-folder/artist/album ** I see this needing more work in the near future as it will not work for everyone

- ability to use multiple configs (new config UIs, image cache will be cleared on change)

- option to import / export config files as base64 encoded string saved as .cfg file

- fix for issue where playback would start more then one time on some playlist build tasks

0.2.8.2

- fix for menu not showing for users on chrome dev channel

0.2.8.1

- fix for no albums displaying on first login or if settings cleared

0.2.8

- refactor code base / reduce line / more maintainable

- faster load of cached images by using HTML5 filesystem in place of indexeddb. 512MB quota setup on launch

- fixed a issue with media folder selecton

0.2.7.5

- add media key support

0.2.7.4

- fix for app not loading a second time if not using MD5 auth and api version higher then 1.13.0

0.2.7.3

- add option to disable md5 authentication

0.2.7.2

- fix issue keeping some users from loging in to server

- attempt to fix a issue that would cause audio to stop randomly if precache enabled and user has a podcast in playlist

- fix bug that would send password as plaing text when loging in on api version 1.13.0

0.2.7.1

- bug fix

0.2.7

- bitrate is now a install specific setting (not synced between sessions)

- fix endless loader if connecting to a subsonic server without content.

- app will now correctly check if md5 authentication method can be used  (using a method taken from a discussion here. http://stackoverflow.com/a/6832721)

- added option to precache the next song making playback near gapless (true gapless could take some time to implement)

- app will now only scrobble to lastFM if more then half the song has been played

- pressing enter while search box is focused will start the search query

- genre list in shuffle options dialog now sorted alphabetically

- after entering server address on first login when box loses focus app will attempt to connect to address given / valid response will set api version and help app determine if it should use md5 authentication (this method will help keep from sending account details insecurely)

- greatly reduce the number of dom nodes generated for album wall (that content will now be conditionally loaded)

0.2.6

- new icon (thanks William Kray)

- fix bug when adding podcast to queue (caused app to hang @ loading spinner)

- bookmark support (with a option in setting menu to enable autobookmarking of long files)

- option to shuffle current play queue (icon will only show if 3 or more items in play queue)

- when showing all albums by a artist (from artist list) page now contains a small bio and links to similar artist in your library

- fix a bug where app would get stuck if there was a error connecting to the server while on loading screen.

0.2.5

- fix bug that caused app to display no albums if attempting to remove a folder filter to display all folders.

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
