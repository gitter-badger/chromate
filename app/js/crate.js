var State = function State(code){
  this.code = code;
  this.name = State.NAMES[this.code] || 'unknown';
};

State.NAMES = ['good', 'warning', 'critical'];
State.UNKNOWN = -1;
State.GOOD = 0;
State.WARNING = 1;
State.CRITICAL = 2;


var TableInfo = function TableInfo(shards) {
  this.shards = shards;
  this.shards_configured = 0;
  this.primaryShards = function primaryShards() {
    return this.shards.filter(function (shard, idx) {
      return shard.primary;
    });
  };
  this.size = function size() {
    var primary = this.primaryShards();
    return primary.reduce(function(memo, shard, idx) {
      return memo + shard.size;
    }, 0);
  };
  this.totalRecords = function totalRecords() {
    var primary = this.primaryShards();
    return primary.reduce(function (memo, shard, idx) {
      return memo + shard.sum_docs;
    }, 0);
  };
  this.missingShards = function missingShards() {
      var activePrimaryShards = this.shards.filter(function(shard) {
          return shard.state in {'STARTED':'', 'RELOCATING':''} && shard.primary;
      });
      var numActivePrimaryShards = activePrimaryShards.reduce(function(memo, shard, idx) {
        return shard.count + memo;
      }, 0);
      return Math.max(this.shards_configured-numActivePrimaryShards, 0);
  };
  this.underreplicatedShards = function underreplicatedShards() {
      return this.unassignedShards() - this.missingShards();
  };
  this.unassignedShards = function unassignedShards() {
      var shards = this.shards.filter(function(shard, idx) {
          return shard.state == 'UNASSIGNED';
      });
      return shards.reduce(function(memo, shard, idx) { return shard.count + memo; }, 0);
  };
  this.startedShards = function startedShards() {
      var shards = this.shards.filter(function(shard, idx) {
          return shard.state == 'STARTED';
      });
      return shards.reduce(function(memo, shard, idx) {return shard.count + memo; }, 0);
  };
  this.underreplicatedRecords = function underreplicatedRecords() {
      var primary = this.primaryShards();
      return primary.length ? (primary[0].avg_docs * this.underreplicatedShards()) : 0;
  };
  this.unavailableRecords = function unavailableRecords() {
      var started = this.startedShards();
      return started.length ? (started[0].avg_docs * this.missingShards()) : 0;
  };
  this.health = function health() {
      if (this.primaryShards().length === 0) return 'critical';
      if (this.missingShards() > 0) return 'critical';
      if (this.unassignedShards() > 0) return 'warning';
      return 'good';
  };
};


var getClusterInfo = function(cluster){
  var deferred = $.Deferred();
  var clusterURL = cluster.url;
  var q = SQLQuery.execute(clusterURL,
      'select ' +
      '   sys.cluster.name, ' +
      '   sum(load[\'1\']), ' +
      '   sum(load[\'5\']), ' +
      '   sum(load[\'15\']), ' +
      '   count(*) ' +
      'from sys.nodes group by sys.cluster.name');
  q.done(function(sqlQuery) {
    var info = {};
    var row = sqlQuery.rows[0];
    info.name = row[0];
    info.load = row.slice(1,4);
    var numNodes = row[4];
    for (var i=0; i<info.load.length; i++) info.load[i] /= parseFloat(numNodes);
    deferred.resolve(info);
  }).fail(function(sqlQuery) {
    deferred.reject({});
  });
  return deferred;
};

var getClusterHealth = function(cluster, timeout) {
      var deferred = $.Deferred();
      SQLQuery.timeout = timeout;
      var clusterURL = cluster.url;

      var tableQuery = SQLQuery.execute(clusterURL, 
        'select table_name, sum(number_of_shards), number_of_replicas ' +
        'from information_schema.tables ' +
        'where schema_name in (\'doc\', \'blob\') ' +
        'group by table_name, number_of_replicas');

      tableQuery.done(function(sqlQuery){
        var tableInfo = queryResultToObjects(sqlQuery,
          ['name', 'number_of_shards', 'number_of_replicas']);

        var shardQuery = SQLQuery.execute(clusterURL, 
          'select table_name, count(*), "primary", state, sum(num_docs), avg(num_docs), sum(size) ' +
          'from sys.shards group by table_name, "primary", state');
        
        shardQuery.done(function(sqlQuery){
          var shardInfo = queryResultToObjects(sqlQuery, 
            ['name', 'count', 'primary', 'state', 'sum_docs', 'avg_docs', 'size']);
          cluster.shardInfo = shardInfo;

          var numActivePrimary = shardInfo.filter(function(obj){
            return (obj.state.toLowerCase() in {'started':'','relocating':''} && obj.primary === true);
          }).reduce(function(memo, obj, idx){
            return memo + obj.count;
          }, 0);

          var unassigned = shardInfo.filter(function(obj){
            return obj.state === "UNASSIGNED";
          });
          var numUnassigned = unassigned.reduce(function(memo, obj, idx) {
            return memo + obj.count;
          }, 0);

          var numConfigured = tableInfo.reduce(function(memo, obj, idx) {
            return memo + obj.number_of_shards;
          }, 0);

          cluster.tableInfo = {
            'tables': tableInfo,
            'numActivePrimary': numActivePrimary,
            'numUnassigned': numUnassigned,
            'numConfigured': numConfigured,
            'numMissing': Math.max(numConfigured-numActivePrimary, 0)
          };

          if (numActivePrimary < numConfigured) {
            cluster.state = new State(State.CRITICAL);
          } else if (numUnassigned > 0) {
            cluster.state = new State(State.WARNING);
          } else {
            cluster.state = new State(State.GOOD);
          }

          if (!cluster.tableInfo || !cluster.tableInfo.tables.length) {
            cluster.tableInfo.available_data = 100;
            cluster.tableInfo.records_unavailable = 0;
            cluster.tableInfo.replicated_data = 100;
            cluster.tableInfo.records_total = 0;
            cluster.tableInfo.records_underreplicated = 0;
            return;
          };
    
          var tables = [];
          for (var i=0; i<cluster.tableInfo.tables.length; i++) {
            var table = cluster.tableInfo.tables[i];
            var aggregatedTableInfo = new TableInfo(cluster.shardInfo.filter(function(shard, idx) { return table.name === shard.name; }));
            aggregatedTableInfo.shards_configured = table.number_of_shards;
            tables.push(aggregatedTableInfo);
          }
          cluster.tableInfo.records_underreplicated = tables.reduce(function(memo, tableInfo, idx) {
            return tableInfo.underreplicatedRecords() + memo;
          }, 0);
          cluster.tableInfo.records_unavailable = tables.reduce(function(memo, tableInfo, idx) {
            return tableInfo.unavailableRecords() + memo;
          }, 0);
          cluster.tableInfo.records_total = tables.reduce(function(memo, tableInfo, idx) {
            return tableInfo.totalRecords() + memo;
          }, 0);
    
          if (cluster.tableInfo.records_total) {
            cluster.tableInfo.replicated_data = (cluster.tableInfo.records_total-cluster.tableInfo.records_underreplicated) / cluster.tableInfo.records_total * 100.0;
            cluster.tableInfo.available_data = (cluster.tableInfo.records_total-cluster.tableInfo.records_unavailable) / cluster.tableInfo.records_total * 100.0;
          } else {
            cluster.tableInfo.replicated_data = 100.0;
            cluster.tableInfo.available_data = 100.0;
          }

          console.log(clusterURL, cluster);
          deferred.resolve();

        }).fail(function(res){
          cluster.state = new State(State.UNKNOWN);
          deferred.reject();
        });

      }).fail(function(res){
          cluster.state = new State(State.UNKNOWN);
          deferred.reject();
      });

      return deferred;
    };
