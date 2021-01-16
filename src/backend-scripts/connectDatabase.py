from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

cloud_config= {
        'secure_connect_bundle': './private/secure-connect-CoursesDB.zip'
}

cassandraPassword = open("./private/CassandraPassword", "r").read()

auth_provider = PlainTextAuthProvider('matt', cassandraPassword)
cluster = Cluster(cloud=cloud_config, auth_provider=auth_provider)
session = cluster.connect()

row = session.execute("select release_version from system.local").one()
if row:
    print(row[0])
else:
    print("An error occurred.")