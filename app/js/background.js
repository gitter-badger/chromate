var Cluster = function Cluster(url) {
    this.url = url;
    this.state = new State(State.UNKNOWN);
    this.shardInfo = null;
    this.tableInfo = null;
};

var refreshInterval = null;

var init = function(clusterUrls){
    if (refreshInterval) {
        window.clearInterval(refreshInterval);
        refreshInterval = null;
    }
    var clusters = [];
    for (var i=0; i<clusterUrls.length; i++) {
        var c = new Cluster(clusterUrls[i]);
        clusters.push(c);
    }
    var interval = 5000/Math.max(clusters.length, 1);
    var counter = 0;
    var fetch = function fetch(){
        if (!clusters.length) return;
        var cluster = clusters[counter%clusters.length];
        getClusterHealth(cluster, interval);
        var code = 0;
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
        var iconName = '../img/icon-' + state.name + (unknown ? '-unknown' : '') + '.png';
        chrome.browserAction.setIcon({'path':iconName});
        counter++;
    };
    refreshInterval = window.setInterval(fetch, interval);
    fetch();
};

Settings.get('clusterUrls', init);
