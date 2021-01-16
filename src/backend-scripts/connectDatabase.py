from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
import json

class DatabaseEngine():
        def __init__(self):
                cloud_config= {
                        'secure_connect_bundle': './private/secure-connect-CoursesDB.zip'
                }

                user = None
                password = None

                with open('./private/CassandraPassword.json') as f:
                        data = json.load(f)
                        user = data['user']
                        password = data['password']

                auth_provider = PlainTextAuthProvider(user, password)
                cluster = Cluster(cloud=cloud_config, auth_provider=auth_provider)
                self.session = cluster.connect()

        def insert_into_db(self, keyspace, table, cols, vals):
                self.session.execute("use {0}".format(keyspace))
                self.session.execute("insert into {0} {1} values {2}".format(table, cols, vals))

        def select_from_db(self, keyspace, table, cols, condition=None):
                session.execute("use {0}".format(keyspace))
                rows = None
                if condition is None:
                        rows = session.execute("select {0} from {1}".format(cols, table))
                else:
                        rows = session.execute("select {0} from {1} where {2}".format(cols, table, condition))
                return [row for row in rows]
