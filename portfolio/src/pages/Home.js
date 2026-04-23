import React from 'react';

function Home() {
  return (
    <div className="container">

      <img 
        src="https://via.placeholder.com/150" 
        alt="profile"
        className="profile"
      />

      <h1>Meghana Reddy</h1>

      <h2>About Me</h2>
      <p>I am passionate about entrepreneurship, AI, and building impactful solutions.</p>

      <h2>Research Interests</h2>
      <ul>
        <li>Artificial Intelligence</li>
        <li>Machine Learning</li>
        <li>Startups</li>
      </ul>

      <h2>Personal Details</h2>
      <p>📞 9876543210</p>
      <p>📧 meghana@email.com</p>
      <p>📧 se23uari034@mahindrauniversity.edu</p>

      <h2>Skills</h2>
      <ul>
        <li>React</li>
        <li>Python</li>
        <li>C Programming</li>
      </ul>

    </div>
  );
}

export default Home;
