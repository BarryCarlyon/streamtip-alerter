function StreamtipAlerter() {
    this._defaults = {
        clientId: '',
        accessToken: '',
        topTipFormatting: '{{username}}: {{amount}}',
        recentTipFormatting: '{{username}}: {{amount}} - {{note}}',
        tipListFormatting: '{{count}}. {{username}}: {{amount}}, ',
        tipListAmount: 5,
        topTipSound: '',
        recentTipSound: '',
        minimumAmount: 0.5,
        dailyTipList: false,
        dailyRecentTip: true,
        dailyTopTip: false
    }
    this._version = 1.0;

    this._loggedIn = false;
    this._topTipSound = null;
    this._recentTipSound = null;

    this.settings = {};
    this.tips = {
        top: null,
        recent: null,
        list: []
    }

    this.files = null;
    this.timeline = null;

    var _self = this;
    $(document).ready(function() {
        _self.loadSettings();

        setTimeout(function() {
            _self.loadSounds();
            _self.login();
        }, 500);
    });

    this.setupWindow();
}

StreamtipAlerter.prototype.cleanTipInput = function(message) {
    return message.replace(/\{\{[a-z]+\}\}/g, '');
}

StreamtipAlerter.prototype.parseType = function(value) {
    if(value == null) {
        return null;
    } else if(value === "true") {
        return true;
    } else if(value === "false") {
        return false;
    } else if(value === "") {
        return "";
    } else if(/^[0-9]+$/.test(value)) {
        return parseInt(value);
    } else if(/^[0-9]+(?:.[0-9]+)?$/.test(value)) {
        return parseFloat(value);
    } else {
        return decodeURIComponent(value);
    }
}

StreamtipAlerter.prototype.saveSetting = function(name, value) {
    Ti.App.Properties.setString('st_'+name, encodeURIComponent((value+'').replace(/\\/g, '\\\\')));
    this.settings[name] = this.parseType(value);
}

StreamtipAlerter.prototype.getSetting = function(name) {
    try {
        return this.parseType(Ti.App.Properties.getString('st_'+name));
    } catch(e) {
        return this._defaults[name];
    }
}

StreamtipAlerter.prototype.loadSettings = function() {
    var _self = this;

    Object.keys(this._defaults).forEach(function(name) {
        var value = _self.getSetting(name);
        _self.settings[name] = value;
    });
}

StreamtipAlerter.prototype.saveSettings = function(settingsObj) {
    var _self = this;

    Object.keys(settingsObj).forEach(function(name) {
        _self.saveSetting(name, settingsObj[name].toString());
    });

    this.loadSounds();
    this.login();
}

StreamtipAlerter.prototype.setupWindow = function() {
    var _self = this;
    var menu = Ti.UI.createMenu();

    var settingsMenu = menu.addItem('Settings');

    settingsMenu.addItem('Configure', function() {
        Ti.UI.showDialog({
            url: "app://settings.html",
            width: 800,
            height: 360,
            onclose: function(data) {
                _self.saveSettings(data);
            },
            parameters: _self.settings
        });
    });

    Ti.UI.setMenu(menu);

    // Prompt on exit
    Ti.UI.getCurrentWindow().addEventListener(Ti.CLOSE, function(event) {
        var check = confirm("Are you sure you want to exit? Alerts will not happen if you close this application.");
        if (check !== true) {
            event.preventDefault();
            return false;
        }
    });
}

StreamtipAlerter.prototype.playSound = function(type) {
    console.log(type);
    console.log('_'+type+'TipSound');
    console.log(this['_'+type+'TipSound'])
    if(!this['_'+type+'TipSound']) return;

    this['_'+type+'TipSound'].stop();
    this['_'+type+'TipSound'].play();
}

StreamtipAlerter.prototype.loadSounds = function() {
    if(this.settings['recentTipSound'].length) {
        var file = Ti.Filesystem.getFile(this.settings['recentTipSound']);
        if(file.exists()) {
            var path = file.nativePath();
            this._recentTipSound = Ti.Media.createSound(path);
        }
    }

    if(this.settings['topTipSound'].length) {
        var file = Ti.Filesystem.getFile(this.settings['topTipSound']);
        if(file.exists()) {
            var path = file.nativePath();
            this._topTipSound = Ti.Media.createSound(path);
        }
    }
}

StreamtipAlerter.prototype.login = function() {
    if(this._loggedIn) return;

    var _self = this;
    $.getJSON('https://streamtip.com/api/tips?client_id='+encodeURIComponent(this.settings['clientId'])+'&access_token='+encodeURIComponent(this.settings['accessToken'])+'&limit=1').always(function() {
        _self.timeline = new Timeline();
        _self.files = new Files(_self);
    }).done(function(data) {
        _self.connectToSocketServer(_self.settings['clientId'], _self.settings['accessToken']);
    }).fail(function() {
        _self.timeline.configure();
    });
}

StreamtipAlerter.prototype.connectToSocketServer = function(id, token) {
    var _self = this;
    var client_id = id;       // Client id from the Account area
    var access_token = token; // Access token from the Account area

    var client = new Faye.Client('https://streamtip.com/faye', {
        timeout: 30,
        retry: 15
    });

    client.addExtension({
        incoming: function(message, callback) {
            if(message.ext && message.ext.hmac) {
                client.hmac_token = message.ext.hmac; // This hmac ensures it is you requesting
            }                                         // from the server throughout your session
            if(message.error && message.error === "401::Access Denied") {
                _self._loggedIn = false;
                _self.timeline.configure();
            }
            callback(message);
        },
        outgoing: function(message, callback) {
            message.ext = {
                client_id: client_id,
                access_token: access_token,
                hmac: client.hmac_token
            }
            callback(message);
        }
    });

    client.subscribe('/'+client_id, function(data) {
        if(data.note) data.note = _self.cleanTipInput(data.note);
        if(data.username) data.username = _self.cleanTipInput(data.username);

        _self.files.newTip(data)
        _self.timeline.addTip(data);

        console.log(data);
    }).then(function() {
        // We are logged in!
        _self._loggedIn = true;
        console.log('Logged into server');
    });
}

new StreamtipAlerter();