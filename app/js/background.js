var Cluster = function Cluster(url) {
    this.url = url;
    this.state = null;
    this.shardInfo = null;
    this.tableInfo = null;
};

var clusters = [new Cluster("https://demo.crate.io")];
var ms = 5000/clusters.length;
var counter = 0;
window.setInterval(function(){
    if (!clusters.length) return;
    getClusterHealth(clusters[counter%clusters.length]);    
    var code = 0;
    var unknown = false;
    for (idx in clusters) {
        var cluster = clusters[idx];
        if (cluster.state === null) {
            unknown = true;
        } else {
            code = Math.max(code, cluster.state.code)
        }
    }
    var state = new Status(code);
    var iconName = '../img/icon-' + state.name + (unknown ? 'unknown' : '') + '.png';
    chrome.browserAction.setIcon({'path':iconName});
    counter++;
}, ms);
