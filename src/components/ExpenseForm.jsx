import React, { useState, useEffect } from 'react';
import ImageCapture from './ImageCapture'; // Import the component we just created

// Assume projects are passed down as a prop for the dropdown
function ExpenseForm({ projects = [], onExpenseAdded }) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [receiptImageData, setReceiptImageData] = useState(null); // Base64 data or PDF indicator
  const [receiptImageType, setReceiptImageType] = useState(null); // e.g., 'image/jpeg', 'application/pdf'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset project selection if projects list changes (e.g., after adding a new project)
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      // Optionally default to the first project or leave blank
      // setSelectedProjectId(projects[0].id);
    } else if (projects.length === 0) {
      setSelectedProjectId(''); // Clear selection if no projects
    }
  }, [projects, selectedProjectId]);

  // Callback from ImageCapture component
  const handleImageCaptured = (dataUrl, fileType) => {
    setReceiptImageData(dataUrl);
    setReceiptImageType(fileType);
    setError(null); // Clear previous errors when new image is captured/selected
    console.log(`Image data received in ExpenseForm. Type: ${fileType}`);
    // TODO: Trigger OCR processing here if dataUrl is valid
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    // --- Basic Validation ---
    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }
    if (!receiptImageData) {
      setError('Please capture or select a receipt image/PDF.');
      return;
    }
    // --- End Basic Validation ---

    setIsSubmitting(true);

    try {
      // --- Step 1: Save the image via IPC ---
      let imagePath = null;
      if (window.electronAPI && typeof window.electronAPI.saveImage === 'function') {
         // Only try to save if it's actual image data (not just PDF indicator perhaps)
         // The saveImage handler expects base64 data:image/...
         if (receiptImageData.startsWith('data:image')) {
            imagePath = await window.electronAPI.saveImage(receiptImageData);
            console.log('Image saved to path:', imagePath);
         } else if (receiptImageData.startsWith('data:application/pdf')) {
            // TODO: Handle PDF saving - might need to pass the raw file or different data
            // For now, let's just log it. We might need a different IPC handler or pass file path.
            console.log('PDF selected - saving mechanism TBD.');
            // Placeholder - might need to save PDF differently or extract image first
            // For now, we can't proceed with OCR easily on the backend from base64 PDF
            // Let's treat this as an error for now until PDF handling is defined
             throw new Error('PDF processing/saving not yet implemented.');
             // imagePath = await window.electronAPI.savePdf(receiptImageData); // Hypothetical
         }
      } else {
        throw new Error('File saving API (saveImage) not available.');
      }

      // --- Step 2: Trigger OCR (if image was saved) ---
      if (imagePath) {
         console.log(`TODO: Trigger OCR for image path: ${imagePath}`);
         // const ocrResult = await window.electronAPI.processImageForOCR(imagePath);
         // setOcrData(ocrResult); // Update state to show OCR fields
      } else if (receiptImageType === 'application/pdf') {
          console.log('TODO: Trigger PDF OCR/Parsing');
          // This might happen client-side (pdf.js) or require backend changes
      }


      // --- Step 3: Save Expense Data (after OCR & review - TBD) ---
      console.log('TODO: Save expense data to DB after OCR and review');
      // const expenseData = { projectId: selectedProjectId, imagePath, ...ocrData };
      // const newExpense = await window.electronAPI.addExpense(expenseData);
      // if (onExpenseAdded) onExpenseAdded(newExpense);


      // Reset form for now (actual reset would happen after successful save)
      // setSelectedProjectId('');
      // setReceiptImageData(null);
      // setReceiptImageType(null);

    } catch (err) {
      console.error('Error processing expense:', err);
      setError(err.message || 'Failed to process expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #007bff', padding: '1rem', marginTop: '1rem' }}>
      <h2>Add New Expense</h2>

      {/* Project Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="projectSelect">Select Project:</label>
        <select
          id="projectSelect"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          disabled={isSubmitting || projects.length === 0}
          required
          style={{ marginLeft: '0.5rem' }}
        >
          <option value="" disabled>-- Select a Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {projects.length === 0 && <span style={{ marginLeft: '0.5rem', color: 'orange' }}>(No projects available. Please add one first.)</span>}
      </div>

      {/* Image Capture/Selection */}
      <ImageCapture onImageCaptured={handleImageCaptured} />

      {/* TODO: Display OCR results and allow editing here */}
      {/* <OcrReviewForm data={ocrData} onChange={handleOcrChange} /> */}


      {error && <p style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</p>}

      <button type="submit" disabled={isSubmitting || !selectedProjectId || !receiptImageData} style={{ marginTop: '1rem' }}>
        {isSubmitting ? 'Processing...' : 'Process Receipt'}
      </button>
       <p style={{fontSize: '0.8em', color: '#666', marginTop: '0.5rem'}}>Note: Full processing (OCR & Save) is not yet implemented.</p>
    </form>
  );
}

export default ExpenseForm;