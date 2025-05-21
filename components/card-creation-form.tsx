import React, { useState } from 'react';

export default function CardCreationForm() {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    twitterHandle: '',
    ethAddress: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // This would normally send data to backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Just simulate successful creation for demo purposes
    setIsSubmitting(false);
    alert('Card created successfully! This is a demo, so no actual card was created.');
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <div className="bf-panel p-6">
      <h3 className="text-2xl font-bold mb-6">Create New BCard</h3>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className={`w-full ${previewMode ? 'lg:w-1/2' : 'lg:w-full'}`}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  placeholder="Developer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  placeholder="BCard Foundation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Twitter/X Handle</label>
                <div className="flex">
                  <span className="bg-gray-700 rounded-l-md p-3 text-gray-400">@</span>
                  <input
                    type="text"
                    name="twitterHandle"
                    value={formData.twitterHandle}
                    onChange={handleChange}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-r-md focus:outline-none focus:border-white"
                    placeholder="username"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">ETH Address</label>
                <input
                  type="text"
                  name="ethAddress"
                  value={formData.ethAddress}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  placeholder="0x..."
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                type="button"
                onClick={togglePreview}
                className="bf-button"
              >
                {previewMode ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button 
                type="submit" 
                className="bf-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Card'}
              </button>
            </div>
          </form>
        </div>
        
        {previewMode && (
          <div className="w-full lg:w-1/2">
            <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
              <div className="mb-6 flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold">{formData.name || 'Your Name'}</h4>
                  <p className="text-gray-400">{formData.title || 'Job Title'}</p>
                  <p className="text-gray-400">{formData.company || 'Company'}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-xl">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '🏴'}
                </div>
              </div>
              
              <div className="space-y-3 border-t border-gray-700 pt-4">
                {formData.email && (
                  <p className="flex items-center">
                    <span className="w-8">📧</span> {formData.email}
                  </p>
                )}
                {formData.phone && (
                  <p className="flex items-center">
                    <span className="w-8">📞</span> {formData.phone}
                  </p>
                )}
                {formData.website && (
                  <p className="flex items-center">
                    <span className="w-8">🌐</span> {formData.website}
                  </p>
                )}
                {formData.twitterHandle && (
                  <p className="flex items-center">
                    <span className="w-8">🐦</span> @{formData.twitterHandle}
                  </p>
                )}
                {formData.ethAddress && (
                  <p className="flex items-center">
                    <span className="w-8">🔗</span> {formData.ethAddress.substring(0, 6)}...{formData.ethAddress.slice(-4)}
                  </p>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="bf-flag text-sm mr-1">🏴</span>
                  <span className="text-xs text-gray-400">BCard</span>
                </div>
                <div className="bg-gray-800 p-2 rounded-md">
                  <div className="w-8 h-8 flex items-center justify-center">
                    QR
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
