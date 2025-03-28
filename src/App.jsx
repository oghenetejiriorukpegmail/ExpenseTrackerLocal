import React, { useState, useEffect } from 'react'; // Revert to named imports
import AddProjectForm from './components/AddProjectForm'; // Import the form component
import ExpenseForm from './components/ExpenseForm'; // Import the expense form

function App() {
  // Example state to hold projects
  const [projects, setProjects] = useState([]); // Revert to useState
  const [loading, setLoading] = useState(true); // Revert to useState
  const [error, setError] = useState(null); // Revert to useState

  // Example: Fetch projects when the component mounts
  useEffect(() => { // Revert to useEffect
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

  // Callback function to update projects list when a new one is added
  const handleProjectAdded = (newProject) => {
    if (newProject && newProject.id) {
      // Add the new project and sort the list alphabetically by name
      setProjects((prevProjects) =>
        [...prevProjects, newProject].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
  };

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

      <hr />
      <AddProjectForm onProjectAdded={handleProjectAdded} />
      <hr style={{ margin: '2rem 0' }}/>

      {/* Render Expense Form, passing projects list */}
      <ExpenseForm projects={projects} />
      {/* TODO: Add onExpenseAdded handler if needed */}

    </div>
  );
}

export default App;