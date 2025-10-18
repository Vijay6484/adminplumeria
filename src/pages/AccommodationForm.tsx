import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft, Building2, Plus, X, Save, Loader2, MapPin, Package } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const admin_BASE_URL = 'https://a.plumeriaretreat.com';

const PROPERTY_TYPES = ['Villa', 'Suite', 'Cottage', 'Bungalow', 'Glamping', 'Standard', 'Deluxe'];

// --- MODIFIED: Updated interface for new Villa fields ---
interface Accommodation {
  id?: number;
  name: string;
  description: string;
  type: string;
  capacity: number;
  rooms: number;
  price: number;
  features: string[];
  images: string[];
  available: boolean;
  ownerId?: number;
  cityId?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  amenityIds?: number[];
  packageName?: string;
  packageDescription?: string;
  packageImages?: string[];
  adultPrice?: number;
  childPrice?: number;
  maxGuests?: number;
  // Villa-specific fields from the first design
  maxPersonsVilla?: number;
  extraPersonRate?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface City {
  id: number;
  name: string;
  country: string;
}

interface Amenity {
  id: number;
  name: string;
  icon: string;
}

const AccommodationForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id !== undefined;

  // --- MODIFIED: Updated initial state for new Villa fields ---
  const [formData, setFormData] = useState<Accommodation>({
    name: '',
    description: '',
    type: '',
    capacity: 2,
    rooms: 1,
    price: 0,
    features: [],
    images: [],
    available: true,
    ownerId: undefined,
    cityId: undefined,
    address: '',
    latitude: undefined,
    longitude: undefined,
    amenityIds: [],
    packageName: '',
    packageDescription: '',
    packageImages: [],
    adultPrice: 0,
    childPrice: 0,
    maxGuests: 2,
    // Villa defaults
    maxPersonsVilla: 0,
    extraPersonRate: 0,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]); 
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]); 
  const [newFeature, setNewFeature] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]); 

  useEffect(() => {
    if (isEditing && id) {
      fetchAccommodation(id);
    }
    
    const fetchData = async () => {
      try {
        const [usersRes, citiesRes] = await Promise.all([
          axios.get(`${admin_BASE_URL}/admin/properties/users`),
          axios.get(`${admin_BASE_URL}/admin/properties/cities`),
        ]);
        
        setUsers(usersRes.data);
        setCities(citiesRes.data);
        
        // Using fallback amenities for now
        setAmenities([
            { id: 1, name: 'WiFi', icon: 'wifi' },
            { id: 2, name: 'Swimming Pool', icon: 'flame' },
            { id: 3, name: 'Music System', icon: 'music' },
            { id: 4, name: 'Dinner', icon: 'utensils' },
            { id: 5, name: 'Bonfire', icon: 'flame' },
            { id: 6, name: 'BBQ', icon: 'coffee' },
        ]);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load initial data');
      }
    };
    
    fetchData();
  }, [isEditing, id]);

  const fetchAccommodation = async (accommodationId: string) => {
    setFetching(true);
    try {
      const response = await axios.get(
        `${admin_BASE_URL}/admin/properties/accommodations/${accommodationId}`
      );
      
      const data = response.data;
      
      setExistingImages(data.basicInfo.images || []);
      // --- MODIFIED: Updated fetch logic to map new Villa fields ---
      setFormData({
        id: data.id,
        name: data.basicInfo.name || '',
        description: data.basicInfo.description || '',
        type: data.basicInfo.type || '',
        capacity: data.basicInfo.capacity || 2,
        rooms: data.basicInfo.rooms || 1,
        price: parseFloat(data.basicInfo.price) || 0,
        features: data.basicInfo.features || [],
        images: data.basicInfo.images || [],
        available: data.basicInfo.available !== undefined ? data.basicInfo.available : true,
        ownerId: data.location?.owner?.id,
        cityId: data.location?.city?.id,
        address: data.location?.address || '',
        latitude: data.location?.coordinates?.latitude || undefined,
        longitude: data.location?.coordinates?.longitude || undefined,
        amenityIds: data.amenities?.ids || [],
        packageName: data.packages?.name || '',
        packageDescription: data.packages?.description || '',
        packageImages: data.packages?.images || [],
        adultPrice: parseFloat(data.packages?.pricing?.adult || '0') || 0,
        childPrice: parseFloat(data.packages?.pricing?.child || '0') || 0,
        maxGuests: data.packages?.pricing?.maxGuests || 2,
        // Map Villa-specific fields from API (assuming these key names)
        maxPersonsVilla: data.basicInfo?.MaxPersonVilla || 0,
        extraPersonRate: data.basicInfo?.RatePersonVilla || 0,
      });
    } catch (error) {
      console.error('Error fetching accommodation:', error);
      setSubmitError('Failed to load accommodation data');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    // --- MODIFIED: Added new Villa fields to the number check ---
    } else if (['price', 'capacity', 'rooms', 'latitude', 'longitude', 'adultPrice', 'childPrice', 'maxGuests', 'maxPersonsVilla', 'extraPersonRate'].includes(name)) {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : Number(value),
      });
    } else if (name === 'ownerId' || name === 'cityId') {
      setFormData({
        ...formData,
        [name]: value === '' ? undefined : Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleAmenityChange = (amenityId: number) => {
    const amenity = amenities.find(a => a.id === amenityId);
    if (!amenity) return;

    const currentAmenities = formData.amenityIds || [];
    const currentFeatures = formData.features || [];

    if (currentAmenities.includes(amenityId)) {
      setFormData({
        ...formData,
        amenityIds: currentAmenities.filter(id => id !== amenityId),
        features: currentFeatures.filter(f => f !== amenity.name)
      });
    } else {
      setFormData({
        ...formData,
        amenityIds: [...currentAmenities, amenityId],
        features: [...currentFeatures, amenity.name]
      });
    }
  };

  const addFeature = () => {
    const trimmedFeature = newFeature.trim();
    if (trimmedFeature && !formData.features.includes(trimmedFeature)) {
      setFormData({
        ...formData,
        features: [...formData.features, trimmedFeature],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    const amenity = amenities.find(a => a.name === feature);
    if (amenity) {
      setFormData({
        ...formData,
        features: formData.features.filter(f => f !== feature),
        amenityIds: formData.amenityIds?.filter(id => id !== amenity.id) || []
      });
    } else {
      setFormData({
        ...formData,
        features: formData.features.filter(f => f !== feature),
      });
    }
  };

  const removeImage = (image: string) => {
    if (existingImages.includes(image)) {
      setFormData({
        ...formData,
        images: formData.images.filter(img => img !== image),
      });
    } else {
      const index = formData.images.indexOf(image);
      setFormData({
        ...formData,
        images: formData.images.filter(img => img !== image),
      });
      setNewImageFiles(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles.splice(index, 1);
        return newFiles;
      });
    }
  };

  // --- MODIFIED: Added Villa-specific validation ---
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.capacity <= 0) newErrors.capacity = 'Capacity must be greater than 0';
    if (formData.rooms <= 0) newErrors.rooms = 'Rooms must be greater than 0';
    if (formData.packageName && !formData.packageDescription) newErrors.packageDescription = 'Package description is required';

    // Villa-specific validation
    if (formData.type === 'Villa') {
      if (!formData.maxPersonsVilla || formData.maxPersonsVilla <= 0) {
        newErrors.maxPersonsVilla = 'Maximum persons must be greater than 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const uploadedImageUrls = await uploadNewImages();
      const allImages = [...formData.images.filter(img => existingImages.includes(img)), ...uploadedImageUrls];

      const url = isEditing
        ? `${admin_BASE_URL}/admin/properties/accommodations/${id}`
        : `${admin_BASE_URL}/admin/properties/accommodations`;

      // --- MODIFIED: Updated requestData to send new Villa fields ---
      const requestData = {
        id: formData.id,
        basicInfo: {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          capacity: formData.capacity,
          rooms: formData.rooms,
          price: formData.price,
          features: formData.features,
          images: allImages,
          available: formData.available,
          // Conditionally add Villa fields with correct API keys
          ...(formData.type === 'Villa' ? {
            MaxPersonVilla: formData.maxPersonsVilla,
            RatePersonVilla: formData.extraPersonRate
          } : {})
        },
        location: {
          address: formData.address,
          cityId: formData.cityId,
          coordinates: { latitude: formData.latitude, longitude: formData.longitude }
        },
        amenities: { ids: formData.amenityIds || [] },
        ownerId: formData.ownerId,
        // Simplified package pricing logic
        packages: {
          name: formData.packageName,
          description: formData.packageDescription,
          images: formData.packageImages || [],
          pricing: {
            adult: formData.adultPrice,
            // Child price is 0 for villas as the field is hidden
            child: formData.type === 'Villa' ? 0 : formData.childPrice,
            maxGuests: formData.maxGuests,
          },
        }
      };

      if (isEditing) {
        console.log('Updating accommodation with data:', requestData);
        await axios.put(url, requestData);
      } else {
        await axios.post(url, requestData);
      }

      toast.success(`Accommodation ${isEditing ? 'updated' : 'created'} successfully!`);
      navigate('/accommodations');
    } catch (error) {
      console.error('Error saving accommodation:', error);
      const errorMessage = 'Failed to save accommodation';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (newImageFiles.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of newImageFiles) {
        const formDataFile = new FormData();
        formDataFile.append('image', file);
        
        const res = await axios.post('https://plumeriaretreat.com/upload.php', formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data.success && res.data.url) {
          uploadedUrls.push(res.data.url);
        }
      }
      return uploadedUrls;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload some images');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    setNewImageFiles(prev => [...prev, ...newFiles]);
    
    const previewUrls = newFiles.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...previewUrls] }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
        <span className="text-lg text-gray-600">Loading accommodation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center">
            <button onClick={() => navigate('/accommodations')} className="mr-2 text-gray-400 hover:text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Property' : 'Add New Property'}</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">{isEditing ? 'Update property details' : 'Create a new property'}</p>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <hr className="mb-6 border-gray-200" />
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Property Name *</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`mt-1 shadow-sm block w-full sm:text-sm rounded-md ${errors.name ? 'border-red-300' : 'border-gray-300'}`}/>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type *</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange} className={`mt-1 shadow-sm block w-full sm:text-sm rounded-md ${errors.type ? 'border-red-300' : 'border-gray-300'}`}>
                    <option value="">Select Type</option>
                    {PROPERTY_TYPES.map(type => ( <option key={type} value={type}>{type}</option> ))}
                    {!PROPERTY_TYPES.includes(formData.type) && formData.type && ( <option value={formData.type}>{formData.type}</option> )}
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
              </div>

              {/* --- MODIFIED: Removed Villa BHK, Added Max Persons and Extra Rate --- */}
              {formData.type === 'Villa' && (
                <>
                  <div className="sm:col-span-2">
                    <label htmlFor="maxPersonsVilla" className="block text-sm font-medium text-gray-700">Maximum Persons (Allowed) *</label>
                    <input type="number" name="maxPersonsVilla" id="maxPersonsVilla" min="1" value={formData.maxPersonsVilla} onChange={handleChange} className={`mt-1 shadow-sm block w-full sm:text-sm rounded-md ${errors.maxPersonsVilla ? 'border-red-300' : 'border-gray-300'}`}/>
                    {errors.maxPersonsVilla && <p className="mt-1 text-sm text-red-600">{errors.maxPersonsVilla}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="extraPersonRate" className="block text-sm font-medium text-gray-700">Extra Person Rate (₹ per night)</label>
                    <input type="number" name="extraPersonRate" id="extraPersonRate" min="0" step="0.01" value={formData.extraPersonRate} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"/>
                  </div>
                </>
              )}

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} className={`mt-1 shadow-sm block w-full sm:text-sm rounded-md ${errors.description ? 'border-red-300' : 'border-gray-300'}`}/>
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">Select Owner</label>
                <select id="ownerId" name="ownerId" value={formData.ownerId || ''} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md">
                    <option value="">Select Owner</option>
                    {users.map(user => ( <option key={user.id} value={user.id}>{user.name} ({user.email})</option> ))}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity *</label>
                <input type="number" name="capacity" id="capacity" min="1" value={formData.capacity} onChange={handleChange} className={`mt-1 shadow-sm block w-full sm:text-sm rounded-md ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`}/>
                {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">Rooms *</label>
                <input type="number" name="rooms" id="rooms" min="1" value={formData.rooms} onChange={handleChange} className={`mt-1 shadow-sm block w-full sm:text-sm rounded-md ${errors.rooms ? 'border-red-300' : 'border-gray-300'}`}/>
                {errors.rooms && <p className="mt-1 text-sm text-red-600">{errors.rooms}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price per night (₹) *</label>
                <input type="number" name="price" id="price" min="0" step="0.01" value={formData.price} onChange={handleChange} className={`mt-1 shadow-sm block w-full sm:text-sm rounded-md ${errors.price ? 'border-red-300' : 'border-gray-300'}`}/>
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <input id="available" name="available" type="checkbox" checked={formData.available} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-700">Available for booking</label>
                </div>
              </div>
            </div>
        </div>

        {/* Location Section */}
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4"><MapPin className="h-5 w-5 text-blue-600 mr-2" /><h2 className="text-lg font-medium text-gray-900">Location</h2></div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                    <label htmlFor="cityId" className="block text-sm font-medium text-gray-700">City</label>
                    <select id="cityId" name="cityId" value={formData.cityId || ''} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md">
                        <option value="">Select City</option>
                        {cities.map(city => (<option key={city.id} value={city.id}>{city.name}, {city.country}</option>))}
                    </select>
                </div>
                <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea id="address" name="address" rows={2} value={formData.address} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md" placeholder="Enter full address"/>
                </div>
                <div className="sm:col-span-3">
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                    <input type="number" name="latitude" id="latitude" step="any" value={formData.latitude || ''} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md" placeholder="e.g., 18.5204"/>
                </div>
                <div className="sm:col-span-3">
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                    <input type="number" name="longitude" id="longitude" step="any" value={formData.longitude || ''} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md" placeholder="e.g., 73.8567"/>
                </div>
            </div>
        </div>

        {/* Features & Amenities Section */}
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Features & Amenities</h2>
            <div>
              <h3 className="text-md font-medium text-gray-700">Custom Features</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features.map((feature) => (
                  <div key={feature} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {feature}
                    <button type="button" onClick={() => removeFeature(feature)} className="ml-1.5 h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex mt-2">
                <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Add a custom feature" className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md rounded-r-none" onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); }}}/>
                <button type="button" onClick={addFeature} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-700">Amenities</h3>
              <select className="mt-2 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md" onChange={e => { const amenityId = Number(e.target.value); if (amenityId && !formData.amenityIds?.includes(amenityId)) { handleAmenityChange(amenityId); } e.target.value = ''; }} defaultValue="">
                <option value="" disabled>Add Amenity</option>
                {amenities.filter(a => !formData.amenityIds?.includes(a.id)).map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
                {amenities.filter(a => formData.amenityIds?.includes(a.id)).map(amenity => (
                  <div key={amenity.id} className="flex items-center">
                    <span className="mr-2">{amenity.name}</span>
                    <button type="button" onClick={() => handleAmenityChange(amenity.id)} className="ml-1.5 h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Package Details */}
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4"><Package className="h-5 w-5 text-blue-600 mr-2" /><h2 className="text-lg font-medium text-gray-900">Package Details</h2></div>
            {/* --- MODIFIED: Simplified package pricing UI --- */}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="packageName" className="block text-sm font-medium text-gray-700">Package Name</label>
                <input type="text" name="packageName" id="packageName" value={formData.packageName} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md" placeholder="e.g., Weekend Getaway"/>
              </div>

              <div className="sm:col-span-3"><label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">No. of Guests</label><input type="number" name="maxGuests" id="maxGuests" min="1" value={formData.maxGuests} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"/></div>
              <div className="sm:col-span-3"><label htmlFor="adultPrice" className="block text-sm font-medium text-gray-700">Adult Price (₹)</label><input type="number" name="adultPrice" id="adultPrice" min="0" step="0.01" value={formData.adultPrice} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"/></div>
              
              {/* Child Price is now hidden for Villas */}
              {formData.type !== 'Villa' && (
                  <div className="sm:col-span-3"><label htmlFor="childPrice" className="block text-sm font-medium text-gray-700">Child Price (₹)</label><input type="number" name="childPrice" id="childPrice" min="0" step="0.01" value={formData.childPrice} onChange={handleChange} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md"/></div>
              )}

              <div className="sm:col-span-6">
                <label htmlFor="packageDescription" className="block text-sm font-medium text-gray-700">Package Description</label>
                <div className="mt-1">
                  <ReactQuill theme="snow" value={formData.packageDescription || ''} onChange={(content) => { setFormData(prev => ({ ...prev, packageDescription: content })); if (errors.packageDescription) { setErrors(prev => ({ ...prev, packageDescription: '' })); }}} className="bg-white rounded-md" placeholder="Describe what's included..."/>
                  {errors.packageDescription && <p className="mt-1 text-sm text-red-600">{errors.packageDescription}</p>}
                </div>
              </div>
            </div>
        </div>

        {/* Property Images Section */}
        <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Property Images</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Upload Images</label>
              <input type="file" multiple accept="image/*" onChange={handleImageFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              {uploading && <div className="mt-2 flex items-center text-sm text-gray-500"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading images...</div>}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img src={image} alt={`Property ${index + 1}`} className="w-full h-32 object-cover rounded-lg"/>
                    <button type="button" onClick={() => removeImage(image)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Link to="/accommodations" className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={loading || uploading} className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading || uploading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isEditing ? 'Updating...' : 'Creating...'}</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />{isEditing ? 'Update Property' : 'Create Property'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccommodationForm;