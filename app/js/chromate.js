var Settings = {
  set: function(urls, callback) {
    for (var i=0; i<urls.length; i++) {
      var url = urls[i];
      if (url.match(/\/$/)){ url = urls[i] = url.substr(0, url.length-1); }
      var isValid = url.match(/^https?:\/\/[^\/]+/);
      if (!isValid) {
        return callback.call(window, false);
      }
    }
    var conf = {
      "clusterUrls": JSON.stringify(urls)
    };
    chrome.storage.sync.set(conf, function(){
        callback.call(window, true);
    });
  },
  get: function(key, callback) {
    chrome.storage.sync.get({
      "clusterUrls": '[]'
    }, function(items) {
      var item = JSON.parse(items[key]);
      callback.call(window, item);
    });
  }
};
