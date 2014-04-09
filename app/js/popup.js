var createTableRow = function(cluster){
    var row = $('<tr id="cluster-'+cluster._id+'">' +
        '<td><button class=""></button></td>' +
        '<td><span class="name">--</span></td>' +
        '<td class="info">' +
        '<ul>' +
        '<li><a href="#" target="_blank">--</a></li>' +
        '<li>Load: <span class="load">--</span></li>' +
        '<li><span class="available">--</span> available</li>' +
        '<li><span class="replicated">--</span> replicated</li>' +
        '<li><span class="records">--</span> records</li>' +
        '</ul>' +
        '<p class="error" style="display:none;"><a href="#" target="_blank">--</a> not reachable!</p>' +
        '</td>' +
        '</tr>');
    $("#clusters").append(row);
    $("button", row).on("click", function(e){
        cluster._paused = !cluster._paused;
        if (cluster._paused) {
            row.addClass("paused");
        } else {
            row.removeClass("paused");
        }
    });
};

var updateTableRow = function updateTableRow(cluster) {
    var row = $("#cluster-"+cluster._id);
    getClusterInfo(cluster).done(function(info){
        cluster.info = info;
        $(".name", row).text(cluster.info.name).addClass(cluster.state.name);
        $(".load", row).text(cluster.info.load[0].toFixed(2));
        $(".available", row).text(cluster.tableInfo.available_data.toFixed(1)+"%");
        $(".replicated", row).text(cluster.tableInfo.replicated_data.toFixed(1)+"%");
        $(".records", row).text(cluster.tableInfo.records_total);
        $(".error", row).hide();
        $("ul", row).show();
    }).fail(function(){
        $(".error", row).show();
        $("ul", row).hide();
    }).always(function(){
        $("a", row).attr("href", cluster.url + "/admin").text(cluster.url);
    });
};

document.addEventListener("DOMContentLoaded", function(){
    var background = chrome.extension.getBackgroundPage();
    for (var i=0; i<background.clusters.length; i++) {
        var cluster = background.clusters[i];
        createTableRow(cluster);
        updateTableRow(cluster);
    }
}, false);
