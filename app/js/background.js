var refreshLoopTime = 10000;

var Cluster = function Cluster(url) {
    this._id = -1; // internal id for dom handling
    this._paused = false;
    this.url = url;
    this.state = new State(State.UNKNOWN);
    this.shardInfo = null;
    this.tableInfo = null;
};

var init = function(clusterUrls){
    clusters = [];
    for (var i=0; i<clusterUrls.length; i++) {
        var c = new Cluster(clusterUrls[i]);
        c._id = i;
        clusters.push(c);
    }
    var counter = 0;
    var fetch = function fetch(){
        if (!clusters.length) return;
        var cluster = clusters[counter%clusters.length];
        console.log("fetch info for cluster ", (counter%clusters.length));
        var updateClusterHealth = function(clusterinfo){
            console.log("howdy", clusterinfo, cluster);
            var code = -1;
            var unknown = 0;
            for (idx in clusters) {
                var _cluster = clusters[idx];
                if (_cluster._paused) continue;
                if (_cluster.state.code === State.UNKNOWN) {
                    unknown++;
                } else {
                    code = Math.max(code, _cluster.state.code)
                }
            }
            var state = new State(code);
            var iconName = "../img/icon.png";
            if (state.code > -1) {
                iconName = '../img/icon-' + state.name + '.png';
            }
            chrome.browserAction.setIcon({'path':iconName});
            if (unknown) {
                chrome.browserAction.setBadgeText({'text':String(unknown)});
                chrome.browserAction.setBadgeBackgroundColor({'color':[148,129,118,255]});
            } else {
                chrome.browserAction.setBadgeText({'text':''});
            }
            var views = chrome.extension.getViews({'type':'popup'});
            if (views.length && views[0].location.href.match(/popup.html/)) {
                views[0].updateTableRow(cluster);
            }
        };

        if (cluster._paused) {
            updateClusterHealth();
        } else {
            getClusterHealth(cluster).always(updateClusterHealth);
        }
        var timeout = refreshLoopTime/Math.max(clusters.length, 1);
        window.setTimeout(fetch, timeout);
        counter++;
    };
    fetch();
};

Settings.get('clusterUrls', init);
