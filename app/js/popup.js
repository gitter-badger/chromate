    // <tr>
    //   <td><button class="">Pause</button></td>
    //   <td class="name">Crate</td>
    //   <td class="info">
    //     <ul>
    //       <li>http://demo.crate.io</li>
    //       <li>Load: 0.12</li>
    //       <li>100.0% available</li>
    //       <li>50.0% replicated</li>
    //       <li>25.28M records</li>
    //     </ul>
    //   </td>
    // </tr>


var createTableRow = function(cluster){
    var row = $('<tr id="cluster-'+cluster._id+'">' +
        '<td><button class="pause"></button></td>' +
        '<td class="name">--</td>' +
        '<td class="info">' +
        '<ul>' +
        '<li><a href="#">--</a></li>' +
        '<li>Load: <span class="load">--</span></li>' +
        '<li><span class="available">--</span> available</li>' +
        '<li><span class="replicated">--</span> replicated</li>' +
        '<li><span class="records">--</span> records</li>' +
        '</ul>' +
        '</td>' +
        '</tr>');
    $("#clusters").append(row);
};
var updateTableRow = function(cluster){
    // var row = $("#cluster-"+cluster._id);
    // $(".name", row).text(cluster.info.name);
    // $("a", row).attr("href", cluster.url+"/admin");
};

var fetchInfo = function fetchInfo(cluster) {
    getClusterInfo(cluster).done(function(info){
        cluster.info = info;
        updateTableRow(cluster);
    });
}

document.addEventListener("DOMContentLoaded", function(){
    var background = chrome.extension.getBackgroundPage();
    for (var i=0; i<background.clusters.length; i++) {
        var cluster = background.clusters[i];
        createTableRow(cluster);
        fetchInfo(cluster);
    }
}, false);
