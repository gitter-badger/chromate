var State = function State(code){
  this.code = code;
  this.name = State.NAMES[this.code] || 'unknown';
};

State.NAMES = ['good', 'warning', 'critical'];
State.UNKNOWN = -1;
State.GOOD = 0;
State.WARNING = 1;
State.CRITICAL = 2;

var Health = function Health(clusterURL){};

var getClusterHealth = function(cluster, timeout) {
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

          console.log(clusterURL, cluster.state);
        }).fail(function(res){
          console.error("error", res);
          cluster.state = new State(State.UNKNOWN);
        });

      }).fail(function(res){
          console.error("error", res);
          cluster.state = new State(State.UNKNOWN);
      });
    };
