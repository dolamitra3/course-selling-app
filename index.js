const express = require('express');
const { auth, requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET || 'baa071959f8bddd6daa7a9772418028a5e82cdf57af55447bb007277cf16d72c',
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  clientID: process.env.CLIENT_ID || 'bOC6K7rTqx3l5cffSRjxj6wxw6I6o5ib',
  issuerBaseURL: process.env.ISSUER_BASE_URL || 'https://dev-in2iu1kl3x43b1oq.us.auth0.com'
};

app.use(auth(config));

// Admin Authentication Middleware (Deprecated with SSO)
const adminAuthentication = (req, res, next) => {
  const { username, password } = req.headers;
  const admin = ADMINS.find(a => a.username === username && a.password === password);
  if (admin) {
    next();
  } else {
    res.status(403).json({ message: 'Admin authentication failed' });
  }
};

// User Authentication Middleware (Deprecated with SSO)
const userAuthentication = (req, res, next) => {
  const { username, password } = req.headers;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user) {
    req.user = user;
    next();
  } else {
    res.status(403).json({ message: 'User authentication failed' });
  }
};

app.post('/admin/signup', (req, res) => {
  const admin = req.body;
  const existingAdmin = ADMINS.find(a => a.username === admin.username);
  if (existingAdmin) {
    res.status(403).json({ message: 'Admin already exists' });
  } else {
    ADMINS.push(admin);
    res.json({ message: 'Admin created successfully' });
  }
});

app.post('/admin/login', adminAuthentication, (req, res) => {
  res.json({ message: 'Logged in successfully' });
});

app.post('/admin/courses', requiresAuth(), (req, res) => {
  const course = req.body;
  course.id = Date.now(); // use timestamp as course ID
  COURSES.push(course);
  res.json({ message: 'Course created successfully', courseId: course.id });
});

app.put('/admin/courses/:courseId', requiresAuth(), (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const course = COURSES.find(c => c.id === courseId);
  if (course) {
    Object.assign(course, req.body);
    res.json({ message: 'Course updated successfully' });
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/admin/courses', requiresAuth(), (req, res) => {
  res.json({ courses: COURSES });
});

app.post('/users/signup', (req, res) => {
  const user = {
    username: req.body.username,
    password: req.body.password,
    purchasedCourses: []
  }
  USERS.push(user);
  res.json({ message: 'User created successfully' });
});

app.post('/users/login', userAuthentication, (req, res) => {
  res.json({ message: 'Logged in successfully' });
});

app.get('/users/courses', requiresAuth(), (req, res) => {
  let filteredCourses = COURSES.filter(c => c.published);
  res.json({ courses: filteredCourses });
});

app.post('/users/courses/:courseId', requiresAuth(), (req, res) => {
  const courseId = Number(req.params.courseId);
  const course = COURSES.find(c => c.id === courseId && c.published);
  if (course) {
    req.user.purchasedCourses.push(courseId);
    res.json({ message: 'Course purchased successfully' });
  } else {
    res.status(404).json({ message: 'Course not found or not available' });
  }
});

app.get('/users/purchasedCourses', requiresAuth(), (req, res) => {
  const purchasedCourses = COURSES.filter(c => req.user.purchasedCourses.includes(c.id));
  res.json({ purchasedCourses });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
