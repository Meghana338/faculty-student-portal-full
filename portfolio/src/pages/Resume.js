import React from "react";
import "./Resume.css";

function Resume() {
  return (
    <div className="resume">

      {/* LEFT SIDE */}
      <div className="left">

        <div className="profile">
          <div className="avatar"></div>
        </div>

        <h2>About Me</h2>
        <p>
          B.Tech student specializing in Artificial Intelligence Engineering with a strong interest in building practical, real-world solutions. 
          I enjoy applying AI, machine learning, and software development concepts beyond theory.
        </p>

        <h2>Skills</h2>
        <p>
          Python, Machine Learning, NLP, Computer Vision, Data Analysis, React, Flask, SQL, Git
        </p>

        <h2>Reward</h2>
        <p>
          Merit based scholarship 2023 <br/>
          Awarded for academic performance among top students
        </p>

        <h2>Languages</h2>
        <div className="languages">
          <span>Python</span>
          <span>MySQL</span>
          <span>JavaScript</span>
          <span>Java</span>
          <span>C</span>
          <span>HTML</span>
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="right">

        <h1>MEGHANA</h1>
        <p className="role">Software engineer intern</p>

        <div className="contact">
          <div>
            <b>Email</b>
            <p>dmeghanareddy@gmail.com</p>
          </div>
          <div>
            <b>Phone</b>
            <p>+91 8790911999</p>
          </div>
        </div>

        <h2>Experience / Projects</h2>

        <div className="item">
          <h4>Robotics Club – Robocon Competition</h4>
          <p>Developed computer vision algorithms using OpenCV.</p>
        </div>

        <div className="item">
          <h4>Marketing Head – E-Cell</h4>
          <p>Led campaigns using analytics and coordinated teams.</p>
        </div>

        <div className="item">
          <h4>Machine Learning Project</h4>
          <p>Built models for engine performance prediction.</p>
        </div>

        <div className="item">
          <h4>NLP Project</h4>
          <p>Created meeting summarizer using NLP techniques.</p>
        </div>

        <div className="item">
          <h4>Social Computing Project</h4>
          <p>Analyzed user patterns and similarity detection.</p>
        </div>

        <div className="item">
          <h4>OOP Quiz Taker</h4>
          <p>Developed quiz system using OOP principles.</p>
        </div>

        <div className="item">
          <h4>Sentiment Analysis</h4>
          <p>Classified text into positive, negative, neutral.</p>
        </div>

        <h2>Education</h2>
        <div className="education">
          <p><b>Bachelors in Artificial Intelligence</b></p>
          <p>Mahindra University, Hyderabad</p>
          <p>CGPA: 7.8/10</p>
        </div>

      </div>

    </div>
  );
}

export default Resume;
