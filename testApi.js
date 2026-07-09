require('dotenv').config();
const axios = require('axios');

const PROJECT_NAME = 'JobCompass'; 

const options = {
  method: 'GET',
  url: 'https://jsearch.p.rapidapi.com/search',
  params: {
    query: 'developer',
    page: '1',
    num_pages: '1',
    location: 'india'
  },
  headers: {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
  }
};

axios.request(options)
  .then(response => {
    console.log(`✅ [${PROJECT_NAME}] Job Data:\n`, response.data);
  })
  .catch(error => {
    console.error(`❌ [${PROJECT_NAME}] API Error:\n`, error.response?.data || error.message);
  });
