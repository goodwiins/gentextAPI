import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react";

function App() {
  const [data, setdata] = useState({
    text:"",
    response: ""
});
useEffect(() => {
  // Using fetch to fetch the api from
  // flask server it will be redirected to proxy
  fetch("/data").then((res) =>
      res.json().then((data) => {
          // Setting a data from api
          setdata({
              text: data.text,
              response: data.response
          });
      })
  );
}, []);
return (
  <div className="App">
      <header className="App-header">
          <h1>React and flask</h1>
          {/* Calling a data from setdata for showing */}
          <p>{data.text}</p>
          <p>{data.response}</p>
         

      </header>
  </div>
);

}

export default App;
