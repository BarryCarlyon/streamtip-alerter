$(document).ready(function() {

    // Setup Settings
    var settings = Ti.UI.getCurrentWindow()._dialogParameters || {};

    if(Object.keys(settings).length) {
        Object.keys(settings).forEach(function(key) {
            var setting = Ti.UI.getCurrentWindow()._dialogParameters[key];

            if(typeof setting === 'boolean') {
                $('#'+key).prop('checked', setting);
            } else {
                $('#'+key).val(setting);
            }
        });
    }

    // Handle window close (we need to submit the settings back to main)
    var canClose = true;
    Ti.UI.getCurrentWindow().addEventListener(Ti.CLOSE, function(event) {
        if(!canClose) return false;

        event.preventDefault();
        canClose = false;
        Ti.UI.getCurrentWindow().close(settings);
        return false;
    });

    // Login Verification / Saving
    $('#clientId, #accessToken').keyup($.debounce(250, function() {
        var clientId = $('#clientId').val().trim();
        var accessToken = $('#accessToken').val().trim();

        $.getJSON('https://streamtip.com/api/tips?client_id='+encodeURIComponent(clientId)+'&access_token='+encodeURIComponent(accessToken)+'&limit=1').done(function(data) {
            $('#clientId, #accessToken').parent().parent().addClass('has-success').removeClass('has-error');
            settings.clientId = clientId;
            settings.accessToken = accessToken;
        }).fail(function() {
            $('#clientId, #accessToken').parent().parent().addClass('has-error').removeClass('has-success');
        });
    }));

    // Tip Formatting
    $('#topTipFormatting, #recentTipFormatting, #tipListFormatting').keyup($.debounce(250, function() {
        $(this).parent().parent().addClass('has-success');
        settings.topTipFormatting = $('#topTipFormatting').val();
        settings.recentTipFormatting = $('#recentTipFormatting').val();
        settings.tipListFormatting = $('#tipListFormatting').val();
    }));
    $('#tipListAmount').keyup($.debounce(250, function() {
        var tipListAmount = $('#tipListAmount').val();
        if(/^[0-9]+$/.test(tipListAmount) && parseInt(tipListAmount) > 0 && parseInt(tipListAmount) < 26) {
            $('#tipListAmount').parent().parent().addClass('has-success').removeClass('has-error');
            settings.tipListAmount = tipListAmount;
        } else {
            $('#tipListAmount').parent().parent().addClass('has-error').removeClass('has-success');
        }
    }));

    // Song Verification / Saving
    $('#topTipSoundSet').click(function() {
        $(this).parent().parent().parent().parent().addClass('has-success');
        Ti.UI.openFileChooserDialog(function(path) {
            if(!path.length) return;
            $('#topTipSound').val(path[0]);
            settings.topTipSound = path[0];
        }, {
            multiple: false,
            title: "Select a Sound File",
            types: ['mp3', 'wav']
        });
    });
    $('#recentTipSoundSet').click(function() {
        $(this).parent().parent().parent().parent().addClass('has-success');
        Ti.UI.openFileChooserDialog(function(path) {
            if(!path.length) return;
            $('#recentTipSound').val(path[0]);
            settings.recentTipSound = path[0];
        }, {
            multiple: false,
            title: "Select a Sound File",
            types: ['mp3', 'wav']
        });
    });

    $('#topTipSoundClear').click(function() {
        $(this).parent().parent().parent().parent().addClass('has-success');
        $('#topTipSound').val('');
        settings.topTipSound = '';
    });
    $('#recentTipSoundClear').click(function() {
        $(this).parent().parent().parent().parent().addClass('has-success');
        $('#recentTipSound').val('');
        settings.recentTipSound = '';
    });

    // Misc
    $('#minimumAmount').keyup($.debounce(250, function() {
        var minimumAmount = $('#minimumAmount').val();
        if(/^[0-9]+(?:.[0-9]+)?$/.test(minimumAmount) && parseFloat(minimumAmount) > 0.4) {
            $('#minimumAmount').parent().parent().addClass('has-success').removeClass('has-error');
            settings.minimumAmount = minimumAmount;
        } else {
            $('#minimumAmount').parent().parent().addClass('has-error').removeClass('has-success');
        }
    }));

    $('#dailyTipList, #dailyRecentTip, #dailyTopTip').change(function() {
        $(this).parent().parent().parent().addClass('has-success');
        settings.dailyTipList = $('#dailyTipList').prop('checked');
        settings.dailyRecentTip = $('#dailyRecentTip').prop('checked');
        settings.dailyTopTip = $('#dailyTopTip').prop('checked');
    });
});