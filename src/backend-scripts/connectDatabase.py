from cassandra.cluster import Cluster
from cassandra.cqlengine.connection import register_connection, set_default_connection
from cassandra.auth import PlainTextAuthProvider
from cassandra.cqlengine import columns
from cassandra.cqlengine.models import Model
from cassandra.cqlengine.management import sync_table
import json

_session = None
_keyspace = "Courses"

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
                self.session.execute("USE {}".format(_keyspace))
                _session = self.session
                register_connection(str(_session), session=_session)
                set_default_connection(str(_session))

        def insertCourse(self, **kwargs):
            Courses.create(**kwargs)

        def getCourses(self):
                return [course for course in Courses.objects.all()]


class Courses(Model):
        __keyspace__ = 'courses'
        id = columns.Integer(primary_key=True)
        startTime = columns.Time()
        endTime = columns.Time()
        geCodes = columns.List(columns.Text())
        name = columns.Text()
        quarter = columns.Text()
        prerequisites = columns.List(columns.Text())
        session = _session