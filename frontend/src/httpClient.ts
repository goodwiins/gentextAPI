import axios from 'axios';

const httpClient = axios.create({
  baseURL: 'http://localhost:5000/api',

});
httpClient.interceptors.response.use(
  response => {
    // Do something with successful responses
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error here
      console.log('Unauthorized access. Please login.');
      // Redirect to login page, show a message, or take appropriate action
    }
    return Promise.reject(error);
  }
);

export default httpClient;