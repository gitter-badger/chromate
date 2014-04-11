var save_options = function(){
  var elem = document.getElementById('clusterlist');
  var urls = elem.value ? elem.value.split('\n') : [];
  Settings.set(urls, function(success) {
    if (success) {
      var background = chrome.extension.getBackgroundPage();
      background.init(urls);
      if (urls.length){
        window.history.back();
      }
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
