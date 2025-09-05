import React, { useState, useEffect } from 'react';

const DirectoryForm = ({ fields, onSubmit }) => {
  const [formData, setFormData] = useState({});
  const [isSingleField, setIsSingleField] = useState(false);

  useEffect(() => {
    // Set the isSingleField state if there is only one field
    setIsSingleField(fields.length === 1);
  }, [fields]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDirectoryChange = (e, name) => {
    if (e.target.files && e.target.files.length > 0) {
      const firstFilePath = e.target.files[0].webkitRelativePath;
      const folderPath = firstFilePath.substring(0, firstFilePath.indexOf('/'));
      setFormData({
        ...formData,
        [name]: folderPath,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className={`dynamic-form ${isSingleField ? "single-field" : ""}`}>
        {fields.map((field) => (
          <div key={field.name} className="field">
            <label htmlFor={field.name}>{field.label}:</label>
            
              <input
                type={field.type}
                name={field.name}
                defaultValue={field.name !== 'canvas name' ? field.value : ''}
                onChange={handleChange}
                readOnly={field.isEditable ? "" : "readOnly"}
              />
         
          </div>
        ))}
        <div className='clear'></div>
        <button type="submit" className='form-submit'>Submit</button>
      </form>
    </div>
  );
};

export default DirectoryForm;
