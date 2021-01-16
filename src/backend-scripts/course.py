class Course(object):
  def __init__(self, id=None, schoolId=None, time=None, geCodes=[], name="", quarter="", prerequisites=[]):
    self.__id = id
    self._schoolId = schoolId
    self.name = name
    self.quarter = quarter
    self.time = time
    self.prerequisites = prerequisites
    self.geCodes = geCodes


  def __repr__(self):
    return (
      f'Course(\
              __id={self.__id}, \
              __schoolId={self._schoolId}, \
              name={self.name}, \
              time={self.time}, \
              prerequisites={self.prerequisites}\
              geCodes={self.geCodes}\
          )'
    )