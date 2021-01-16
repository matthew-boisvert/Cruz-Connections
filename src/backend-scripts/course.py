class Course(object):
  def __init__(self, id=None, time=None, geCodes=[], name="", quarter="", prerequisites=[]):
    self.id = id
    self.name = name
    self.quarter = quarter
    self.time = time
    self.prerequisites = prerequisites
    self.geCodes = geCodes


  def __repr__(self):
    return (
      f'Course(\
              id={self.id}, \
              name={self.name}, \
              time={self.time}, \
              prerequisites={self.prerequisites}\
              geCodes={self.geCodes}\
          )'
    )