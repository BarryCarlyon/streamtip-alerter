Files = function(main) {
    this.settings = main.settings;
    this.tips = main.tips;
    this.playSound = function(type) {
        main.playSound.call(main, type);
    }

    this.load();
}

Files.prototype.getTemplate = function(name) {
    return this.settings[name];
}

Files.prototype.grabTips = function(query, callback) {
    query.client_id = this.settings['clientId'];
    query.access_token = this.settings['accessToken'];

    var queryString = '?';
    Object.keys(query).forEach(function(name) {
        queryString += ((queryString === '?') ? '' : '&') + encodeURIComponent(name)+'='+encodeURIComponent(query[name]);
    });

    $.getJSON('https://streamtip.com/api/tips'+queryString).done(function(data) {
        callback(data);
    }).fail(function(data) {
        callback(data);
    });
}

Files.prototype.updateFile = function(type) {
    var tips = [];
    var template = '';

    switch(type) {
        case 'top':
            if(this.tips.top) tips.push(this.tips.top);
            template = this.getTemplate('topTipFormatting');
            break;
        case 'recent':
            if(this.tips.recent) tips.push(this.tips.recent);
            template = this.getTemplate('recentTipFormatting');
            break;
        case 'list':
            tips = this.tips.list;
            template = this.getTemplate('tipListFormatting');
            break;
    }

    var txt = '';
    tips.forEach(function(tip, count) {
        txt += template.replace(/\{\{amount\}\}/g, tip.currencySymbol+tip.amount)
                        .replace(/\{\{count\}\}/g, count+1)
                        .replace(/\{\{processor\}\}/g, tip.processor)
                        .replace(/\{\{username\}\}/g, tip.username)
                        .replace(/\{\{note\}\}/g, tip.note || 'No message');
    });
    
    this.save(type, txt);
}

Files.prototype.newTip = function(tipObj) {
    if(!this.tips.top || parseFloat(this.tips.top.amount) < parseFloat(tipObj.amount)) {
        this.tips.top = tipObj;
        this.updateFile('top');
        this.playSound('top');
    } else {
        this.playSound('recent');
    }

    this.tips.recent = tipObj;
    this.updateFile('recent');

    if(this.tips.list.length > this.settings.tipListAmount) this.tips.list.pop();
    this.tips.list.unshift(tipObj);
    this.updateFile('list');
}

Files.prototype.load = function() {
    var _self = this;

    // If we need to poll for today's top tip
    if(this.settings.dailyTopTip === false) {
        var date = new Date();
        var today = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        this.grabTips({
            sort_by: 'amount',
            date_from: today.toISOString(),
            limit: 1
        }, function(data) {
            if(data.status == 200 && data.tips.length) _self.tips.top = data.tips[0];
            _self.updateFile('top');
        });
    } else {
        _self.updateFile('top');
    }

    // If we need to poll for the recent tip
    if(this.settings.dailyRecentTip === false) {
        this.grabTips({
            limit: 1
        }, function(data) {
            if(data.status == 200 && data.tips.length) _self.tips.top = data.tips[0];
            _self.updateFile('recent');
        });
    } else {
        _self.updateFile('recent');
    }

    // If we need to poll for the recent tips list
    if(this.settings.dailyTipList === false) {
        this.grabTips({
            limit: this.settings.tipListAmount
        }, function(data) {
            if(data.status == 200 && data.tips.length) _self.tips.top = data.tips[0];
            _self.updateFile('list');
        });
    } else {
        _self.updateFile('list');
    }
}

Files.prototype.save = function(type, data) {
    var directory = Ti.Filesystem.getFile(Ti.Filesystem.getDocumentsDirectory(), 'Streamtip');
    if(!directory.exists()) {
        directory.createDirectory();
    }

    var file = Ti.Filesystem.getFile(directory, 'tip-'+type+'.txt');
    if(!file.exists()) {
        file.touch();
    }

    file.write(data);
}