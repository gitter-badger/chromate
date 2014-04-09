var Cluster = function Cluster(url) {
    this._id = -1; // internal id for dom handling
    this.url = url;
    this.state = new State(State.UNKNOWN);
    this.shardInfo = null;
    this.tableInfo = null;
};

var refreshInterval = null;
var clusters = [];

var init = function(clusterUrls){
    if (refreshInterval) {
        window.clearInterval(refreshInterval);
        refreshInterval = null;
    }
    clusters = [];
    for (var i=0; i<clusterUrls.length; i++) {
        var c = new Cluster(clusterUrls[i]);
        c._id = i;
        clusters.push(c);
    }
    var interval = 5000/Math.max(clusters.length, 1);
    var counter = 0;
    var fetch = function fetch(){
        if (!clusters.length) return;
        var cluster = clusters[counter%clusters.length];
        getClusterHealth(cluster, interval);
        var code = -1;
        var unknown = false;
        for (idx in clusters) {
            var cluster = clusters[idx];
            if (cluster.state.code === State.UNKNOWN) {
                unknown = true;
            } else {
                code = Math.max(code, cluster.state.code)
            }
        }
        var state = new State(code);
        var iconName = "../img/icon.png";
        if (state.code > -1) {
            iconName = '../img/icon-' + state.name + (unknown ? '-unknown' : '') + '.png';
        }
        chrome.browserAction.setIcon({'path':iconName});
        var views = chrome.extension.getViews({'type':'popup'});
        if (views.length && views[0].location.href.match(/popup.html/)) {
            views[0].updateTableRow(cluster);
        }
        counter++;
    };
    refreshInterval = window.setInterval(fetch, interval);
    fetch();
};

Settings.get('clusterUrls', init);
