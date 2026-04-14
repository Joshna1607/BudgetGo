import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FiUpload, FiX, FiDownload, FiUsers, FiShare2, FiTrash2 } from 'react-icons/fi'
import './PhotoGallery.css'

const PhotoGallery = () => {
  const { user } = useAuth()
  const [selectedImage, setSelectedImage] = useState(null)
  const [photos, setPhotos] = useState([])
  const [groupMembers] = useState(['You', 'John', 'Sarah', 'Mike'])

  // Load photos from localStorage on mount
  useEffect(() => {
    const storedPhotos = JSON.parse(localStorage.getItem('tripPhotos') || '[]')
    if (storedPhotos.length > 0) {
      setPhotos(storedPhotos)
    } else {
      // Default photos
      const defaultPhotos = [
        { id: 1, url: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Photo+1', title: 'Eiffel Tower', date: '2024-03-15', uploadedBy: 'You' },
        { id: 2, url: 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Photo+2', title: 'Louvre Museum', date: '2024-03-16', uploadedBy: 'John' },
        { id: 3, url: 'https://via.placeholder.com/400x300/28a745/ffffff?text=Photo+3', title: 'Seine River', date: '2024-03-16', uploadedBy: 'You' },
        { id: 4, url: 'https://via.placeholder.com/400x300/dc3545/ffffff?text=Photo+4', title: 'Notre-Dame', date: '2024-03-17', uploadedBy: 'Sarah' },
        { id: 5, url: 'https://via.placeholder.com/400x300/ffc107/ffffff?text=Photo+5', title: 'Champs-Élysées', date: '2024-03-17', uploadedBy: 'You' },
        { id: 6, url: 'https://via.placeholder.com/400x300/17a2b8/ffffff?text=Photo+6', title: 'Montmartre', date: '2024-03-18', uploadedBy: 'Mike' },
      ]
      setPhotos(defaultPhotos)
      localStorage.setItem('tripPhotos', JSON.stringify(defaultPhotos))
    }
  }, [])

  const handleImageClick = (photo) => {
    setSelectedImage(photo)
  }

  const handleCloseModal = () => {
    setSelectedImage(null)
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    // In real app, this would upload to server
    const newPhotos = []
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newPhoto = {
          id: Date.now() + index,
          url: event.target.result,
          title: file.name.replace(/\.[^/.]+$/, '') || `Photo ${photos.length + index + 1}`,
          date: new Date().toISOString().split('T')[0],
          uploadedBy: user?.name || 'You',
          sharedWith: groupMembers // Share with all group members
        }
        newPhotos.push(newPhoto)

        // Update state and localStorage when all files are processed
        if (newPhotos.length === files.length) {
          const updatedPhotos = [...photos, ...newPhotos]
          setPhotos(updatedPhotos)
          localStorage.setItem('tripPhotos', JSON.stringify(updatedPhotos))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSharePhoto = (photo) => {
    if (navigator.share) {
      navigator.share({
        title: `Trip Photo: ${photo.title}`,
        text: `Check out this photo from our trip!`,
        url: photo.url
      }).catch(err => console.log('Error sharing', err))
    } else {
      // Fallback: copy image URL
      navigator.clipboard.writeText(photo.url)
      alert('Photo link copied to clipboard!')
    }
  }

  const handleDeletePhoto = (photoId) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      const updatedPhotos = photos.filter(p => p.id !== photoId)
      setPhotos(updatedPhotos)
      localStorage.setItem('tripPhotos', JSON.stringify(updatedPhotos))
      setSelectedImage(null) // Close modal
    }
  }

  return (
    <div className="photo-gallery">
      <div className="page-header">
        <div>
          <h1>Group Photo Gallery</h1>
          <p>Capture and share trip memories with your group</p>
          <div style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#666'
          }}>
            <FiUsers /> {groupMembers.length} members can view and upload photos
          </div>
        </div>
        <label className="btn btn-primary">
          <FiUpload /> Upload Photos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="gallery-grid">
        {photos.map(photo => (
          <div
            key={photo.id}
            className="gallery-item"
            onClick={() => handleImageClick(photo)}
          >
            <div className="gallery-image">
              <img src={photo.url} alt={photo.title} />
              <div className="gallery-overlay">
                <div className="gallery-info">
                  <h3>{photo.title}</h3>
                  <p>{photo.date}</p>
                  {photo.uploadedBy && (
                    <p style={{ fontSize: '0.75rem', color: '#999' }}>
                      By {photo.uploadedBy}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              <FiX />
            </button>
            <img src={selectedImage.url} alt={selectedImage.title} />
            <div className="modal-info">
              <h2>{selectedImage.title}</h2>
              <p>{selectedImage.date}</p>
              {selectedImage.uploadedBy && (
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  Uploaded by {selectedImage.uploadedBy}
                </p>
              )}
              {selectedImage.sharedWith && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.5rem',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  <strong>Shared with:</strong> {selectedImage.sharedWith.join(', ')}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => {
                  const link = document.createElement('a')
                  link.href = selectedImage.url
                  link.download = selectedImage.title
                  link.click()
                }}>
                  <FiDownload /> Download
                </button>
                <button className="btn btn-primary" onClick={() => handleSharePhoto(selectedImage)}>
                  <FiShare2 /> Share
                </button>
                <button
                  className="btn"
                  style={{ backgroundColor: '#dc3545', color: 'white' }}
                  onClick={() => handleDeletePhoto(selectedImage.id)}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoGallery

