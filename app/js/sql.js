var _object = function _object(headers, row) {
  if (headers.length != row.length) return {};
  var obj = {};
  for (var i=0; i<headers.length; i++) {
    obj[headers[i]] = row[i];
  }
  return obj;
};

var queryResultToObjects = function queryResultToObjects(sqlQuery, headers) {
  return sqlQuery.rows.map(function(obj, idx){
    return _object(headers, obj);
  });
};

var SQLQuery = function SQLQuery(stmt, response, failed) {
  this.stmt = stmt;
  this.rows = [];
  this.cols = [];
  this.rowCount = [];
  this.duration = 0;
  this.error = {'message':'', code:0};
  this.failed = failed;
  if (this.failed === true || !response || response.error) {
    this.error = response ? response.error : {'message': 'No base_uri specified.', 'code': 0};
  } else {
    this.rows = response.rows;
    this.cols = response.cols;
    this.rowCount = response.rowcount;
    this.duration = response.duration;
  }
}
SQLQuery.prototype.status = function() {
  var status_string = "";
  var stmt_parts = this.stmt.split(' ');
  var cmd = stmt_parts[0].toUpperCase();
  if (cmd in {'CREATE':'', 'DROP':''}) {
    cmd = cmd + " " + stmt_parts[1].toUpperCase();
  }
  if (this.failed == false) {
    status_string = cmd + " OK (" + (this.duration/1000).toFixed(3) + " sec)";
    console.info("Query status: " + status_string);
  } else {
    status_string = cmd + " ERROR (" + (this.duration/1000).toFixed(3) + " sec)";
    console.error("Query status: " + status_string);
  }
  return status_string;
};
SQLQuery.execute = function(clusterURL, stmt /*, args */) {
  var data = {
    'stmt': stmt,
    'args': arguments[2] || []
  };

  var deferred = $.Deferred();
  $.ajax({
      "type": "POST",
      "url": clusterURL+"/_sql",
      "data": JSON.stringify(data),
      "dataType": "json"
  }).success(function(response, status, xhr){
      deferred.resolve(new SQLQuery(stmt, response, false));
  }).error(function(xhr, status, message){
      console.error("Got ERROR response from query: " + stmt + " with status: " + status);
      if (status == 0) {
        data = {'error': {'message': 'Connection Error', 'code': status}};
      }
      deferred.reject(new SQLQuery(stmt, data, true));
  }).always(function(xhr){
      console.info(xhr);
  });
  return deferred;
};