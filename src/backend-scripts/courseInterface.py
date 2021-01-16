import json
from course import Course
import fetcherHelper
import re
from connectDatabase import DatabaseEngine



def fetchCourses() -> []:
  TERM_LIST_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/terms.json"
  TERM_INFO_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/terms/"
  COURSE_INFO_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/courses/"

  ucsc_term = getCurrentQuarter(TERM_LIST_URL)
  term_id = ucsc_term["code"]
  quarter = ucsc_term["name"].split()[1] + " " + ucsc_term["name"].split()[0]

  term_data = fetcherHelper.sendGetRequest(TERM_INFO_URL+str(term_id)+".json")
  course_data = fetcherHelper.sendGetRequest(COURSE_INFO_URL+str(term_id)+".json")


  all_courses = []
  # Getting the data available from the term API (name, class time)
  for course_prefix in term_data:
    for course in term_data[course_prefix]:
      new_course = Course(id=course["num"], quarter=quarter)

      short_name = course_prefix + " " + course["c"]
      full_name = short_name + " - " + course["s"] + ": " + course["n"]
      new_course.name = full_name

      class_time = course["loct"][0]["t"]
      location = course["loct"][0]["loc"]
      new_course.geCodes = course_data[str(new_course.id)]["ge"]
      prerequisites = course_data[str(new_course.id)]["re"]
      if prerequisites is not None:
        new_course.prerequisites = re.findall("[A-Z]{1,5} [0-9A-Z]{1,3}", prerequisites)

      if (location == "Remote Instruction" or location == "Online") and class_time == None:
        new_course.time = None
        all_courses.append(new_course)
        continue

      if(class_time != None and class_time != False):
        try:
          new_course.time = (class_time["time"]["start"], class_time["time"]["end"])
          all_courses.append(new_course)
        except Exception as e:
          pass

  return all_courses



"""
Returns JSON of the form:
{
  "code": "[term id]",
  "date": {
    "start": "[start date]",
    "end": "[end date]"
  },
  "name": "[year] [season] Quarter"
}
"""

def getCurrentQuarter(api_url: str) -> json:
    data = fetcherHelper.sendGetRequest(api_url)
    return data[0]

def fillCourseJson(fileName):
  data = {}
  data["nodes"] = []
  data["links"] = []
  courses = fetchCourses()

  for course in courses:
    id = course.name.split(" - ")[0]
    data["nodes"].append({
      "id": id,
      "group": abs(hash(course.name.split(" ")[0]) % 50)
    })
    for prereq in course.prerequisites:
      classesWithID = [item for item in data["nodes"] if item['id'] == prereq]
      if len(classesWithID) > 0:      
        data["links"].append({
          "source": id,
          "target": prereq,
          "value": 1
        })

  with open(fileName, 'w') as outfile:
      json.dump(data, outfile)
  return

def fillDatabase(engine):
  courses = fetchCourses()
  for course in courses:
    kwargs = {
      "id": course.id,
      "name": course.name,
      "quarter": course.quarter,
      "geCodes": course.geCodes,
      "prerequisites": course.prerequisites
    }
    time = course.time
    if time is not None:
      kwargs["startTime"] = time[0] + ":00"
      kwargs["endTime"] = time[1] + ":00"
    
    engine.insertCourse(**kwargs)

def getCourses():
  databaseEngine = DatabaseEngine()
  return databaseEngine.getCourses()

fillCourseJson('../frontend/test.json')