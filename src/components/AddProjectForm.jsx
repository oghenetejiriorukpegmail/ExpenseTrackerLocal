import React, { useState } from 'react';

function AddProjectForm({ onProjectAdded }) {
  const [projectName, setProjectName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use the API exposed in preload.js
      if (window.electronAPI && typeof window.electronAPI.addProject === 'function') {
        const newProject = await window.electronAPI.addProject(projectName);
        console.log('Project added successfully:', newProject);
        setProjectName(''); // Clear the input field
        if (onProjectAdded && typeof onProjectAdded === 'function') {
          onProjectAdded(newProject); // Notify parent component
        }
      } else {
        throw new Error('Project API (addProject) not available.');
      }
    } catch (err) {
      console.error('Error adding project:', err);
      setError(err.message || 'Failed to add project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <h3>Add New Project</h3>
      <div>
        <label htmlFor="projectName">Project Name:</label>
        <input
          type="text"
          id="projectName"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          disabled={isSubmitting}
          required
          style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Project'}
        </button>
      </div>
      {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>Error: {error}</p>}
    </form>
  );
}

export default AddProjectForm;