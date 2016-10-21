# Time Quota
Extension for [Brackets](https://brackets.io). Measures how much time you've spent on the currently open project. Adds `View > Time Quota` as well as an indicator in the bottom right corner that, when hovered, displays the current quota.

## Important!
This plugin uses the current folder as an identifier for your project-timer.
i.e if you're working in the folder `somepath/Dropbox/myawesomeproject`, your timer is going to interfere with `somepath/myawesomeproject`. I've programmed this way to make sure I don't clutter up folders with a JSON-file, containing this ID. I might migrate this id to `.brackets.json` in a future release - but for now this method works fine and get's the job done.

##Tested on
- Windows 10 (Brackets 1.7)

##Not tested on
- Mac OSX
- Linux/BSD
- Lower Brackets versions
