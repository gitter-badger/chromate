var clusters = ["https://demo.crate.io"];
var ms = 5000/clusters.length;
var counter = 0;
window.setInterval(function(){
    if (!clusters.length) return;
    getClusterHealth(clusters[counter%clusters.length]);
    counter++;
}, ms);
