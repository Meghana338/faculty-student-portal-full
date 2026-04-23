import React from 'react';

function Projects() {
  return (
    <div className="container">

      <h1>My Projects</h1>

      <div className="project">
        <h3>AI Chatbot</h3>
        <p>NLP based chatbot</p>
        <a href="https://github.com/your-username/project1" target="_blank" rel="noreferrer">
          View Code
        </a>
      </div>

      <div className="project">
        <h3>Portfolio Website</h3>
        <p>React portfolio project</p>
        <a href="https://github.com/your-username/project2" target="_blank" rel="noreferrer">
          View Code
        </a>
      </div>

    </div>
  );
}

export default Projects;
