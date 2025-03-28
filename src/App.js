import React, { useState, useEffect } from 'react';

function App() {
  // Example state to hold projects
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Example: Fetch projects when the component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use the API exposed in preload.js
        if (window.electronAPI && typeof window.electronAPI.getProjects === 'function') {
          const fetchedProjects = await window.electronAPI.getProjects();
          setProjects(fetchedProjects || []); // Ensure it's an array
        } else {
          throw new Error('Project API not available.');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message || 'Failed to fetch projects.');
        setProjects([]); // Clear projects on error
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="App">
      <h1>Expense Tracker (Local V1)</h1>
      <p>Welcome! This is the main application component.</p>

      {/* We will add components for project management and expense tracking here */}

      <h2>Projects</h2>
      {loading && <p>Loading projects...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && (
        <ul>
          {projects.length > 0 ? (
            projects.map((project) => (
              <li key={project.id}>{project.name} (ID: {project.id})</li>
            ))
          ) : (
            <li>No projects found. Add one!</li>
          )}
        </ul>
      )}

      {/* Placeholder for adding a project - we'll make this a component */}
      {/* <AddProjectForm onProjectAdded={handleProjectAdded} /> */}

    </div>
  );
}

export default App;