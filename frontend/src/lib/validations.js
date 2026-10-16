import * as yup from 'yup'
import { degreeOptions, splitList } from './resource-payloads.js'
const websiteRegex = /^(https?:\/\/)?(www\.)?[a-yup.-Z0-9-]+\.[a-zA-Z]{2,}(:[0-9]{1,5})?(\/[^\s]*)?$/
const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9._-]+\/?$/
const zipRegex = /^\d{5}(-\d{4})?$/
const phoneRegex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/
const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
export const validateCompaniesForm = yup.object().shape({
  // email, mission, industry,website,city, yup.pcode, street
  name: yup.string().min(3).required(),
  email: yup.string().required("email is required").matches(emailRegex, "Please enter a valid email address"),
  contactName: yup.string().min(3).required(),
  contactEmail: yup.string().required("email is required").matches(emailRegex, "Please enter a valid email address"),
  contactPosition: yup.string().min(3).required(),
  contactDepartment: yup.string().min(3).required(),
  contactPhone: yup.string().matches(phoneRegex, "invalid phone number"),
  mission: yup.string().max(500),
  industry: yup.string().required(),
  website: yup.string().matches(websiteRegex, "invalid website url"),
  city: yup.string().required(),
  state: yup.string().required(),
  street: yup.string().required(),
  zipcode: yup.string().required().matches(zipRegex, "invalid zip code")
})
export const validateMajorsForm = yup.object().shape({
  name: yup.string().trim().min(2, 'Major name must be at least 2 characters').required('Major name is required'),
  degree: yup.string().oneOf(degreeOptions.map(option => option.value), 'Choose a valid degree').required('Choose a degree'),
  track: yup.string().max(500, 'Tracks must be less than 500 characters'),
  department: yup.string().required('Choose a department'),
  description: yup.string().trim().max(2000, 'Description must be less than 2,000 characters')
})

export const validateDepartmentForm = yup.object().shape({
  name: yup.string().trim().min(3, 'Department name must be at least 3 characters').required('Department name is required'),
  roomNo: yup.string().trim().max(40, 'Room number must be less than 40 characters')
})


export const validateInternshipForm = yup.object().shape({
  // email, position, industry,website,city, yup.pcode, street
  name: yup.string().required(),
  position: yup.string().required(),
  salary: yup.string().trim().max(200).required('Compensation is required'),
  requirements: yup.string().required().test('nonempty-list', 'Enter at least one requirement', value => splitList(value).length > 0),
  responsibility: yup.string().required().max(500).test('nonempty-list', 'Enter at least one responsibility', value => splitList(value).length > 0),
  details: yup.string().required(),
  applicationDeadline: yup.string().required(),
  tags: yup.string().required().test('nonempty-list', 'Enter at least one skill or tag', value => splitList(value).length > 0)
})
export const validateRegisterationForm = yup.object().shape({
  name: yup.string().trim().min(3, "Name must be at least 3 characters").required("Full name is required"),
  email: yup.string().required("email is required").matches(emailRegex, "Please enter a valid email address"),
  password: yup.string().matches(passwordRegex, "Password must include a digit, a lowercase, an uppercase and a special character").min(8, "Password must be at least 8 characters").required(),
  confirmPassword:yup.string().required().oneOf([yup.ref('password')],'passwords must match'),
  id: yup.string().matches(/^\d{8}$/, "Employee or Student ID must be exactly 8 digits").required("Employee or Student ID is required"),
  role: yup.string().oneOf(['student', 'admin'], "Choose a valid role").required("Choose a role"),
})
export const validateLoginForm = yup.object().shape({
  email: yup.string().required("email is required").matches(emailRegex, "Please enter a valid email address"),
  password: yup.string().matches(passwordRegex, "Password must include a digit, a lowercase, an uppercase and a special character").min(8, "password should be longer than 8 characters").required(),
})


export const validateAppointmentForm = yup.object().shape({
  title: yup.string().required("Appointment title is required"),
  description: yup.string().max(500, "Description must be less than 500 characters"),
  date: yup.date().required("Appointment date is required").min(new Date(), "Date must be in the future"),
  startTime: yup.string().required("Appointment time is required"),
  endTime: yup.string().required("End time is required")
  .test('is-greater', 'End time must be later than start time', function(value) {
  const { startTime } = this.parent;
  return value > startTime;
  }),
  location: yup.string().required("Location is required"),
  // N/A or valid url
  link: yup.string().url("Invalid URL").nullable(),
  notes: yup.string().max(300, "Notes must be less than 300 characters"),
  staff: yup.string().required("Staff is required"),
  inviteSent: yup.boolean(),
  reminderSent: yup.boolean(),
  meetingType: yup.string().required("Meeting type is required"),
  status: yup.string().required("Status is required"),
  participant: yup.string().required("Attendees are required")

})


export const validateStudentForm = yup.object().shape({
  lastName: yup.string().min(2).required(),
  firstName: yup.string().min(2).required(),
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  phoneNumber: yup.string().matches(/^\d{10}$/, "Phone number must be 10 digits").required(),
  age: yup.number().min(18).max(100).required(),
  DOB: yup.date().required(),
  address: yup.string().required(),
  school: yup.string().required(),
  studentId: yup.string().required(),
  graduationYear: yup.number().min(new Date().getFullYear()).max(new Date().getFullYear() + 10).required(),
  resume: yup.mixed().required("Resume is required"),
  LinkedIn: yup.string().url("Invalid LinkedIn URL").optional(),
  GitHub: yup.string().url("Invalid GitHub URL").optional(),
  skills: yup.string().optional()
})


export const validateViewBoard = yup.object().shape({
  position: yup.string().required("Position is required"),
  company: yup.string().required("Company is required"),
  location: yup.string().required("Location is required"),
  salary: yup.string().required(),
  description: yup.string().required("Description is required").max(500, "Description must be less than 500 characters"),
  requirements: yup.string().required("Requirements are required"),
  applicationDeadline: yup.date().required("Application deadline is required").min(new Date(), "Deadline must be in the future")
})
export const validateAdminProfile = yup.object().shape({
  // Validation schema
  name: yup.string().min(1, "Full name is required"),
  email: yup.string().required("email is required").matches(emailRegex, "Please enter a valid email address"),
  phone: yup.string().min(7, "Phone number is too short"),
  linkedin: yup.string().required("Invalid Linkedin account").matches(linkedinRegex, "Please enter a valid email address"),
  department: yup.string().min(1, "Select a department"),
  position: yup.string().min(1, "Select a position"),
  profileImage: yup.string().optional(),
})
export const validateStudentProfile= yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  department: yup.string().required("Department is required"),
  position: yup.string().required("Position is required"),
  linkedin: yup.string().url("Invalid URL").nullable(),
  phone: yup.string().required("Phone is required"),
  profileImage: yup.string().nullable(),
  interests: yup.array().of(yup.string()),
  skills: yup.array().of(yup.string()),
  internshipsApplied: yup.number().min(0, "Must be positive").required(),
  responsesReceived: yup.number().min(0, "Must be positive").required(),
})


