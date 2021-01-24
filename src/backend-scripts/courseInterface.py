import json
from course import Course
import fetcherHelper
import re



def fetchCourses(numQuartersAgo):
  TERM_LIST_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/terms.json"
  TERM_INFO_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/terms/"
  COURSE_INFO_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/courses/"

  ucsc_term = getQuarter(TERM_LIST_URL, numQuartersAgo)
  term_id = ucsc_term["code"]
  quarter = ucsc_term["name"].split()[1] + " " + ucsc_term["name"].split()[0]

  term_data = fetcherHelper.sendGetRequest(TERM_INFO_URL+str(term_id)+".json")
  course_data = fetcherHelper.sendGetRequest(COURSE_INFO_URL+str(term_id)+".json")


  all_courses = {}
  OLD_PREFIXES = {"AMS", "CMPE", "CMPS", "EE", "TIM"}

  # Getting the data available from the term API (name, class time)
  for course_prefix in term_data:
    if course_prefix in OLD_PREFIXES:
      continue
    for course in term_data[course_prefix]:
      new_course = Course(id=course["num"], quarter=quarter)

      short_name = course_prefix + " " + course["c"]
      full_name = short_name + " - " + course["s"] + ": " + course["n"]
      new_course.name = full_name

      class_time = course["loct"][0]["t"]
      new_course.geCodes = course_data[str(new_course.id)]["ge"]
      prerequisites = course_data[str(new_course.id)]["re"]
      if prerequisites is not None:
        new_course.prerequisites = re.findall("[A-Z]{1,5} [0-9]{1,3}[A-Z]{0,2}", prerequisites)
        for prereq in new_course.prerequisites:
          if prereq.split(" ")[0] in OLD_PREFIXES:
            new_course.prerequisites.remove(prereq)

      if(class_time != None and class_time != False):
        try:
          new_course.time = (class_time["time"]["start"], class_time["time"]["end"])
          all_courses[short_name] = new_course
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

def getQuarter(api_url: str, numQuartersAgo) -> json:
    data = fetcherHelper.sendGetRequest(api_url)
    return data[numQuartersAgo]

def fillCourseJson(fileName):
  data = {}
  data["nodes"] = []
  data["links"] = []
  courses = []
  courseMap = fetchCourses(0)
  courseMap.update(fetchCourses(1))
  courseMap.update(fetchCourses(3))
  courses = [courseMap[key] for key in courseMap]
  addedDepartments = set()
  extraCourses = set()

  for course in courses:
    id = course.name.split(" - ")[0]
    department = id.split(" ")[0]

    if department not in addedDepartments:
        data["nodes"].append({
          "id": department,
          "group": abs(hash(department))
        })
        addedDepartments.add(department)

    data["nodes"].append({
      "id": id,
      "group": abs(hash(department))
    })

    data["links"].append({
      "source": id,
      "target": department,
      "value": 0
    })

    for prereq in course.prerequisites:
      if prereq not in courseMap and prereq not in extraCourses:
        data["nodes"].append({
          "id": prereq,
          "group": abs(hash(prereq.split(" ")[0]))
        })
        extraCourses.add(prereq)

      data["links"].append({
        "source": prereq,
        "target": id,
        "value": 1
      })
      


  with open(fileName, 'w') as outfile:
      json.dump(data, outfile)
  return

# def fillDatabase(engine):
#   courses = fetchCourses()
#   for course in courses:
#     kwargs = {
#       "id": course.id,
#       "name": course.name,
#       "quarter": course.quarter,
#       "geCodes": course.geCodes,
#       "prerequisites": course.prerequisites
#     }
#     time = course.time
#     if time is not None:
#       kwargs["startTime"] = time[0] + ":00"
#       kwargs["endTime"] = time[1] + ":00"
    
#     engine.insertCourse(**kwargs)

def getCourses():
  databaseEngine = DatabaseEngine()
  return databaseEngine.getCourses()

fillCourseJson('../frontend/data.json')