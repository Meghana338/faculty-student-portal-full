import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="nav">
      <h2>Meghna Portfolio</h2>

      <div>
        <NavLink to="/" className="link">Home</NavLink>
        <NavLink to="/projects" className="link">Projects</NavLink>
        <NavLink to="/resume" className="link">Resume</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
