/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";
    // package-style naming to avoid collisions
    var COMMAND_ID = "mryakobo.timequota";
    var CommandManager = brackets.getModule("command/CommandManager");
    var Menus = brackets.getModule("command/Menus");
    var FileSystem = brackets.getModule("filesystem/FileSystem");
    var ProjectManager = brackets.getModule("project/ProjectManager");
    var FileUtils = brackets.getModule("file/FileUtils");
    var WorkspaceManager = brackets.getModule("view/WorkspaceManager");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var StatusBar = brackets.getModule("widgets/StatusBar");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var DocumentManager = brackets.getModule("document/DocumentManager");

    //Vars below are declared in "onProjectOpen"
    var url;
    var dir;
    var file;

    var panel;
    var panelHtml = require("text!panel.html");

    var intervals = [];
    //time holds the amount of seconds.
    var time = 0;
    var oldText = "";
    var idle = 0;

    StatusBar.addIndicator("mryakobo.timequota", $("<div style='cursor:pointer;'>Time Quota</div>"), true, "timequota", "Tooltip");

    function panelToggle() {
        if (panel.isVisible()) {
            panel.hide();
            CommandManager.get(COMMAND_ID).setChecked(false);
        } else {
            panel.show();
            CommandManager.get(COMMAND_ID).setChecked(true);
        }
    }

    function secondsToHms(d) {
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);
        var hDisplay = h > 0 ? (h == 1 ? " hour " : " hours") : "hours";
        var mDisplay = m > 0 ? (m == 1 ? " minute " : " minutes") : "minutes";
        var sDisplay = s > 0 ? (s == 1 ? " second" : " seconds") : "seconds";

        var retValue = {
            hours: {
                int: h,
                str: hDisplay
            },
            minutes: {
                int: m,
                str: mDisplay
            },
            seconds: {
                int: s,
                str: sDisplay
            }
        }
        return retValue;
    }

    function increment() {
        var paused = false;
        var lim = 60;
        oldText = text;
        //if reading from text failed, pause the increment for now.
        try {
            var text = DocumentManager.getCurrentDocument().getText();
        } catch (e) {
            paused = true;
            var text = "";
        }
        //If the document hasn't changed, the user might be thinking hard about a problem.
        //However, if the document hasn't changed in 1 minute, the user has probably gone away doing something else, hence don't count after that minute.
        //If the document is same, increment idle. Else, set it to zero.
        idle = text === oldText ? idle + 1 : 0;

        if (idle <= lim && !paused) {
            time++;
        } else {
            paused = true;
        }

        updateUI(paused, lim);
    }

    function updateUI(paused, lim) {
        var r = secondsToHms(time);
        var pausedStr = paused ? `(paused counting because of document being idle for more than ${lim} seconds)` : "";
        var a = $(WorkspaceManager.getPanelForID(COMMAND_ID).$panel[0]);

        a.find("#hour").html(r.hours.int);
        a.find("#hourLabel").html(r.hours.str);
        a.find("#minute").html(r.minutes.int);
        a.find("#minuteLabel").html(r.minutes.str);
        a.find("#second").html(r.seconds.int);
        a.find("#secondLabel").html(r.seconds.str);
        a.find("#tip").html(pausedStr);

        var str = r.hours.int + " " + r.hours.str + ", " + r.minutes.int + " " + r.minutes.str + ", " + r.seconds.int + " " + r.seconds.str + " " + pausedStr;

        StatusBar.updateIndicator("mryakobo.timequota", true, "timequota", str);
    }

    function startTimer() {
        increment();
        intervals.push(setInterval(increment, 1000));
    }

    function clearAllInterval() {
        intervals.forEach(function (o, i) {
            clearInterval(o);
        });
    }

    function startOrContinueTimer() {
        FileUtils.readAsText(file).done(function (text) {
            time = parseInt(text);
            startTimer();
        }).fail(function (errorCode) {
            //If the read failed, it means that the file doesn't exist
            FileUtils.writeText(file, "0");
            time = 0;
            startTimer();
        });
    }

    function save() {
        FileUtils.writeText(file, "" + time);
    }

    function projectOpen(){
        var _a = ProjectManager.getInitialProjectPath().split("/");
        var name = _a[_a.length - 2];
        url = ExtensionUtils.getModulePath(module) + "timers/" + name + ".txt";
        file = FileSystem.getFileForPath(url);
        clearAllInterval();
        startOrContinueTimer();
    }

    //Lots of event handlers below
    ProjectManager.on("beforeProjectClose", function (event, root) {
        save();
    });
    ProjectManager.on("projectClose", function (event, root) {
        save();
    });
    ProjectManager.on("beforeAppClose", function (event, root) {
        save();
    });
    ProjectManager.on("projectRefresh", function (event, root) {
        save();
    });
    ProjectManager.on("projectOpen", function (event, root) {
        projectOpen();
    });

    CommandManager.register("Time Quota", COMMAND_ID, panelToggle);
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(COMMAND_ID, "Ctrl-Alt-T");

    //PANEL:
    ExtensionUtils.loadStyleSheet(module, "panelStyle.css");
    panel = WorkspaceManager.createBottomPanel(COMMAND_ID, $(panelHtml), 200);
    //Adding event handlers the hardcore way:
    $(WorkspaceManager.getPanelForID(COMMAND_ID).$panel[0]).find("#close").click(function () {
        panelToggle();
    });
});