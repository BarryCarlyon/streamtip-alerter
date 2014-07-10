Timeline = function() {
    this.load();
}

Timeline.prototype.emptyTemplate = function() {
    return '<li class="timeline-empty"> \
                <div class="timeline-item"> \
                    <h3 class="timeline-header">Nothing here yet!</h3> \
                    <div class="timeline-body">When people send you money, it will appear here.</div> \
                </div> \
            </li>';
}

Timeline.prototype.configureTemplate = function() {
    return '<li class="timeline-empty"> \
                <div class="timeline-item"> \
                    <h3 class="timeline-header">Bad login!</h3> \
                    <div class="timeline-body">You need to configure your login credentials! Click the "Settings" menu item and select "Configure."</div> \
                </div> \
            </li>';
}

Timeline.prototype.template = function() {
    return '<li class="timeline-tip"> \
                <i class="fa bg-blue" style="background-image: url({{avatar}}); background-size: cover;"></i> \
                <div class="timeline-item"> \
                    <span class="time">{{date}}</span> \
                    <h3 class="timeline-header">{{amount}} from {{username}}</h3> \
                    <div class="timeline-body">{{note}}</div> \
                </div> \
            </li>';
}

Timeline.prototype.parseLinks = function(message) {
    var regex = /((\b|\B)\x02?((?:https?:\/\/|[\w\-\.\+]+@)?\x02?(?:[\w\-]+\x02?\.)+\x02?(?:com|au|org|tv|net|info|jp|uk|us|cn|fr|mobi|gov|co|ly|me|vg|eu|ca|fm|am|ws)\x02?(?:\:\d+)?\x02?(?:\/[\w\.\/@\?\&\%\#\(\)\,\-\+\=\;\:\x02?]+\x02?[\w\/@\?\&\%\#\(\)\=\;\x02?]|\x02?\w\x02?|\x02?)?\x02?)\x02?(\b|\B)|(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9]+-?)*[a-z0-9]+)(?:\.(?:[a-z0-9]+-?)*[a-z0-9]+)*(?:\.(?:[a-z]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?)/gi;
    return message.replace(regex, function(e) {
        if (/\x02/.test(e)) return e;
        if (e.indexOf("@") > -1 && (e.indexOf("/") === -1 || e.indexOf("@") < e.indexOf("/"))) return '<a href="mailto:' + e + '">' + e + "</a>";
        var link = e.replace(/^(?!(?:https?:\/\/|mailto:))/i, 'http://');
        return '<a href="' + link + '" target="_blank">' + e + '</a>';
    });
}

Timeline.prototype.escapeHTML = function(message) {
    return message.replace(/</g,'&lt;').replace(/>/g, '&gt;');
}

Timeline.prototype.parseNote = function(note) {
    var note = note || "No message";
    note = this.escapeHTML(note);
    note = this.parseLinks(note);
    return note;
}

Timeline.prototype.getAvatar = function(user, email, callback) {
    var email = email || user+'@users.twitch.tv';
    var avatar = "http://gravatar.com/avatar/"+MD5(email)+"?d=retro";

    $.getJSON('http://api.twitch.tv/kraken/users/'+encodeURIComponent(user)+'?on_site=1').done(function(data) {
        if(data.logo) {
            avatar = data.logo;
        }
        callback(avatar);
    }).fail(function() {
        callback(avatar);
    });
}

Timeline.prototype.load = function() {
    $('.timeline-tip').remove();

    if($('.timeline-empty').length) {
        $('.timeline-empty').replaceWith(this.emptyTemplate());
    } else {
        $('.time-label').after(this.emptyTemplate());
    }
}

Timeline.prototype.configure = function() {
    $('.timeline-tip').remove();

    if($('.timeline-empty').length) {
        $('.timeline-empty').replaceWith(this.configureTemplate());
    } else {
        $('.time-label').after(this.configureTemplate());
    }
}

Timeline.prototype.addTip = function(tipObj) {
    var _self = this;

    this.getAvatar(tipObj.username, tipObj.email, function(avatar) {
        var html = _self.template()
                    .replace('{{note}}', _self.parseNote(tipObj.note))
                    .replace('{{username}}', _self.escapeHTML(tipObj.username))
                    .replace('{{amount}}', tipObj.currencySymbol+tipObj.amount)
                    .replace('{{date}}', moment(tipObj.date).format('h:mm:ss a'))
                    .replace('{{avatar}}', avatar);

        $('.time-label').after(html);
        $('.timeline-empty').remove();
    });
}