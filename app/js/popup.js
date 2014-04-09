var createTableRow = function(cluster){
    var row = $('<tr id="cluster-'+cluster._id+'">' +
        '<td><button class="pause"></button></td>' +
        '<td><span class="name">--</span></td>' +
        '<td class="info">' +
        '<ul>' +
        '<li><a href="#" target="_blank">--</a></li>' +
        '<li>Load: <span class="load">--</span></li>' +
        '<li><span class="available">--</span> available</li>' +
        '<li><span class="replicated">--</span> replicated</li>' +
        '<li><span class="records">--</span> records</li>' +
        '</ul>' +
        '</td>' +
        '</tr>');
    $("#clusters").append(row);
};

document.addEventListener("DOMContentLoaded", function(){
    var background = chrome.extension.getBackgroundPage();
    for (var i=0; i<background.clusters.length; i++) {
        var cluster = background.clusters[i];
        createTableRow(cluster);
        getClusterInfo(cluster).done(function(info){
            cluster.info = info;
            var row = $("#cluster-"+cluster._id);
            $(".name", row).text(cluster.info.name).addClass(cluster.state.name);
            $("a", row).attr("href", cluster.url + "/admin").text(cluster.url);
            $(".load", row).text(cluster.info.load[0].toFixed(2));
            $(".available", row).text(cluster.tableInfo.available_data.toFixed(1)+"%");
            $(".replicated", row).text(cluster.tableInfo.replicated_data.toFixed(1)+"%");
            $(".records", row).text(cluster.tableInfo.records_total);
        });
    }
}, false);
