var Status = function Status(status){
  this.code = status;
  this.name = Status.NAMES[this.code];
};
Status.NAMES = ['good', 'warning', 'critical'];

Status.GOOD = 0;
Status.WARNING = 1;
Status.CRITICAL = 2;

var Health = function Health(clusterURL){};

var getClusterHealth = function(clusterURL) {

      var data = {};

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
          data.shardInfo = shardInfo;

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

          data.tableInfo = {
            'tables': tableInfo,
            'numActivePrimary': numActivePrimary,
            'numUnassigned': numUnassigned,
            'numConfigured': numConfigured,
            'numMissing': Math.max(numConfigured-numActivePrimary, 0)
          };

          if (numActivePrimary < numConfigured) {
            data.status = new Status(Status.CRITICAL);
          } else if (numUnassigned > 0) {
            data.status = new Status(Status.WARNING);
          } else {
            data.status = new Status(Status.GOOD);
          }

          console.log("success", data);

        }).fail(function(res){
          console.error("error", res);
        });

      }).fail(function(res){
          console.error("error", res);
      });
    };
