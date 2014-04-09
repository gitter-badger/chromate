
var save_options = function(){
  var elem = document.getElementById('clusterlist');
  var value = elem.value;
  Settings.set(value.split('\n'), function(success) {
    if (success) {
      window.history.back();
    } else {
      elem.classList.add('error');
    }
  });
};

var restore_options = function(){
  Settings.get('clusterUrls', function(item){
    document.getElementById('clusterlist').value = item.join("\n");
  });
};

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
