import json
from course import Course
import fetcherHelper
import re



def fetch_ucsc_course_times(school_id: str) -> []:
  TERM_LIST_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/terms.json"
  TERM_INFO_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/terms/"
  COURSE_INFO_URL = "https://andromeda.miragespace.net/slugsurvival/data/fetch/courses/"

  ucsc_term = get_current_ucsc_term(TERM_LIST_URL)
  term_id = ucsc_term["code"]
  quarter = ucsc_term["name"].split()[1] + " " + ucsc_term["name"].split()[0]

  term_data = fetcherHelper.send_get_request(TERM_INFO_URL+str(term_id)+".json")
  course_data = fetcherHelper.send_get_request(COURSE_INFO_URL+str(term_id)+".json")


  all_courses = {}
  # Getting the data available from the term API (name, class time)
  for course_prefix in term_data:
    for course in term_data[course_prefix]:
      new_course = Course(schoolId=school_id, quarter=quarter)

      short_name = course_prefix + " " + course["c"]
      full_name = short_name + " - " + course["s"] + ": " + course["n"]
      new_course.name = full_name

      class_time = course["loct"][0]["t"]
      location = course["loct"][0]["loc"]
      new_course.geCodes = course_data[str(course["num"])]["ge"]
      prerequisites = course_data[str(course["num"])]["re"]
      if prerequisites is not None:
        new_course.prerequisites = re.findall("[A-Z]{1,5} [0-9A-Z]{1,3}", prerequisites)

      if (location == "Remote Instruction" or location == "Online") and class_time == None:
        new_course.time = None
        all_courses[course["num"]] = new_course
        continue

      if(class_time != None and class_time != False):
        try:
          new_course.time = (class_time["time"]["start"], class_time["time"]["end"])
          all_courses[course["num"]] = new_course
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

def get_current_ucsc_term(api_url: str) -> json:
    data = fetcherHelper.send_get_request(api_url)
    return data[0]



if __name__ == '__main__':
  courses = fetch_ucsc_course_times("oD7YLtMzKrLXfuO7B3dj")
  print(courses)
  #print("STUFF")


