var createTableRow = function(cluster){
    var row = $('<tr id="cluster-'+cluster._id+'">' +
        '<td><button><span></span></button></td>' +
        '<td><span class="name">--</span></td>' +
        '<td class="info">' +
        '<ul>' +
        '<li><a href="#" target="_blank">--</a></li>' +
        '<li>Load: <span class="load">--</span></li>' +
        '<li><span class="available">--</span> available</li>' +
        '<li><span class="replicated">--</span> replicated</li>' +
        '<li><span class="records">--</span> records</li>' +
        '</ul>' +
        '<p style="display:none;"><span class="critical"><a href="#" target="_blank">--</a><br />not reachable</span></p>' +
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
        $(".name", row).text(cluster.info.name)
        $(".name", row).attr("class","").addClass(cluster.state.name);
        $(".load", row).text(cluster.info.load[0].toFixed(2));
        if (cluster.tableInfo && cluster.tableInfo.available_data){
            $(".available", row).text(cluster.tableInfo.available_data.toFixed(1)+"%");
            $(".replicated", row).text(cluster.tableInfo.replicated_data.toFixed(1)+"%");
            $(".records", row).text(cluster.tableInfo.records_total);
        }
        $("p", row).hide();
        $("ul", row).show();
        row.removeClass("not-reachable");
    }).fail(function(){
        $("p", row).show();
        $("ul", row).hide();
        row.addClass("not-reachable");
    }).always(function(){
        $("a", row).attr("href", cluster.url + "/admin").text(cluster.url);
    });
};

document.addEventListener("DOMContentLoaded", function(){
    Settings.get('clusterUrls', function(urls){
        if (!urls.length){
            window.location.href="settings.html";
        }
    });
    var background = chrome.extension.getBackgroundPage();
    for (var i=0; i<background.clusters.length; i++) {
        var cluster = background.clusters[i];
        createTableRow(cluster);
        updateTableRow(cluster);
    }
}, false);
