import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vacationsApi, getImageUrl } from '../services/api';
import './VacationForm.css';

const VacationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    destination: '',
    description: '',
    startDate: '',
    endDate: '',
    price: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      fetchVacation();
    }
  }, [id]);

  const fetchVacation = async () => {
    try {
      const vacation = await vacationsApi.getById(id!);
      setFormData({
        destination: vacation.destination,
        description: vacation.description,
        startDate: vacation.startDate,
        endDate: vacation.endDate,
        price: vacation.price.toString(),
      });
      setCurrentImage(vacation.imageFileName);
    } catch (error) {
      console.error('Error fetching vacation:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, or WEBP)');
        e.target.value = ''; // Clear the input
        return;
      }

      // Validate file size (max 20MB for 4K photos)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxSize) {
        setError('Image size must be less than 20MB');
        e.target.value = ''; // Clear the input
        return;
      }

      setError(''); // Clear any previous errors
      setImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.destination || !formData.description || !formData.startDate || !formData.endDate || !formData.price) {
      setError('All fields are required');
      return;
    }

    const price = parseFloat(formData.price);
    if (price < 0 || price > 10000) {
      setError('Price must be between 0 and 10,000');
      return;
    }

    if (formData.endDate < formData.startDate) {
      setError('End date must be after start date');
      return;
    }

    if (!isEditMode) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.startDate < today) {
        setError('Start date cannot be in the past');
        return;
      }
    }

    if (!isEditMode && !imageFile) {
      setError('Please select an image');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('destination', formData.destination);
      data.append('description', formData.description);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('price', formData.price);

      if (imageFile) {
        data.append('image', imageFile);
      }

      if (isEditMode) {
        await vacationsApi.update(id!, data);
      } else {
        await vacationsApi.create(data);
      }

      navigate('/vacations');
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Operation failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1 className="form-title">{isEditMode ? 'Edit Vacation' : 'Add Vacation'}</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="destination">destination</label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">description</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">start on</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">end on</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="price">price</label>
            <input
              type="number"
              id="price"
              name="price"
              step="0.01"
              min="0"
              max="10000"
              value={formData.price}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">cover image</label>
            {isEditMode && !imageFile && (
              <div className="current-image-preview">
                <img
                  src={getImageUrl(currentImage)}
                  alt="Current vacation"
                  className="preview-image"
                  onError={(e) => {
                    e.currentTarget.src = '/uploads/default.jpg';
                  }}
                />
                <label htmlFor="image" className="change-image-btn">
                  Change Image
                </label>
              </div>
            )}
            <input
              type="file"
              id="image"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={loading}
              style={isEditMode && !imageFile ? { display: 'none' } : {}}
            />
            {imageFile && (
              <div className="new-image-label">New image selected: {imageFile.name}</div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Add Vacation'}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/vacations')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacationForm;
