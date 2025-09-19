import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft, Building2, Plus, X, Save, Trash2, Loader2, MapPin, Users, Package } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';


const admin_BASE_URL = 'https://a.plumeriaretreat.com';

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
    maxGuests: 2
  });

  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]); // NEW: Store new image files
  const [amenities, setAmenities] = useState<Amenity[]>([
    { id: 1, name: 'WiFi', icon: 'wifi' },
    { id: 2, name: 'Swimming Pool', icon: 'flame' },
    { id: 3, name: 'Music System', icon: 'music' },
    { id: 4, name: 'Dinner', icon: 'utensils' },
    { id: 5, name: 'Bonfire', icon: 'flame' },
    { id: 6, name: 'BBQ', icon: 'coffee' },
  ]);
  const [newFeature, setNewFeature] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]); // NEW: Track existing images

  useEffect(() => {
    if (isEditing && id) {
      fetchAccommodation(id);
    }
    
    // Fetch users and cities on component mount
    const fetchData = async () => {
      try {
        const [usersRes, citiesRes] = await Promise.all([
          axios.get(`${admin_BASE_URL}/admin/properties/users`),
          axios.get(`${admin_BASE_URL}/admin/properties/cities`)
        ]);
        
        setUsers(usersRes.data);
        setCities(citiesRes.data);
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
      
      // NEW: Store existing images separately
      setExistingImages(data.basicInfo.images || []);
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
        maxGuests: data.packages?.pricing?.maxGuests || 2
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
    } else if (name === 'price' || name === 'capacity' || name === 'rooms' || 
               name === 'latitude' || name === 'longitude' || name === 'adultPrice' || 
               name === 'childPrice' || name === 'maxGuests') {
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

  // NEW: Function to handle image removal
  const removeImage = (image: string) => {
    // If it's an existing image, just remove from formData
    if (existingImages.includes(image)) {
      setFormData({
        ...formData,
        images: formData.images.filter(img => img !== image),
      });
    } 
    // If it's a new image (file), remove from both formData and newImageFiles
    else {
      // Find the index of the image in newImageFiles
      const index = formData.images.indexOf(image);
      
      setFormData({
        ...formData,
        images: formData.images.filter(img => img !== image),
      });
      
      // Remove the corresponding file
      setNewImageFiles(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles.splice(index, 1);
        return newFiles;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    if (formData.rooms <= 0) {
      newErrors.rooms = 'Rooms must be greater than 0';
    }
    if (formData.packageName && !formData.packageDescription) {
      newErrors.packageDescription = 'Package description is required';
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
      // Upload new images first
      const uploadedImageUrls = await uploadNewImages();

      // Combine existing images with new uploaded URLs
      const allImages = [
        ...formData.images.filter(img => existingImages.includes(img)), // Keep existing images that weren't removed
        ...uploadedImageUrls
      ];

      const url = isEditing
        ? `${admin_BASE_URL}/admin/properties/accommodations/${id}`
        : `${admin_BASE_URL}/admin/properties/accommodations`;

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
          images: allImages, // Use the combined image array
          available: formData.available
        },
        location: {
          address: formData.address,
          cityId: formData.cityId,
          coordinates: {
            latitude: formData.latitude,
            longitude: formData.longitude
          }
        },
        amenities: {
          ids: formData.amenityIds || []
        },
        ownerId: formData.ownerId,
        packages: {
          name: formData.name,
          description: formData.packageDescription,
          images: formData.packageImages || [],
          pricing: {
            adult: formData.adultPrice,
            child: formData.childPrice,
            maxGuests: formData.maxGuests
          }
        }
      };

      if (isEditing) {
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

  // NEW: Upload new image files and return their URLs
  const uploadNewImages = async (): Promise<string[]> => {
    if (newImageFiles.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of newImageFiles) {
        const formDataFile = new FormData();
        formDataFile.append('image', file);
        
        const res = await axios.post(
          'https://plumeriaretreat.com/upload.php',
          formDataFile,
          {
            headers: { 
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Upload response:', res.data);
        if (res.data.success && res.data.filename) {
          uploadedUrls.push(
            res.data.url
          );
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

  // NEW: Handle image file selection
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Store files for later upload
    const newFiles = Array.from(files);
    setNewImageFiles(prev => [...prev, ...newFiles]);
    
    // Create preview URLs
    const previewUrls = newFiles.map(file => URL.createObjectURL(file));
    
    // Add preview URLs to form data
    setFormData({
      ...formData,
      images: [...formData.images, ...previewUrls]
    });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
          <span className="text-lg text-gray-600">Loading accommodation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center">
            <button
              onClick={() => navigate('/accommodations')}
              className="mr-2 text-gray-400 hover:text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Property' : 'Add New Property'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing
              ? 'Update property details'
              : 'Create a new property for your resort'}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <hr className="mb-6 border-gray-200" />
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Property Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Type *
                </label>
                <div className="mt-1">
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md ${errors.type ? 'border-red-300' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select Type</option>
                    {!['Villa', 'Suite', 'Cottage', 'Bungalow', 'Glamping', 'Standard', 'Deluxe'].includes(formData.type) &&
                      formData.type && (
                        <option value={formData.type}>{formData.type}</option>
                      )}
                    <option value="Villa">Villa</option>
                    <option value="Suite">Suite</option>
                    <option value="Cottage">Cottage</option>
                    <option value="Bungalow">Bungalow</option>
                    <option value="Glamping">Glamping</option>
                    <option value="Standard">Standard Room</option>
                    <option value="Deluxe">Deluxe Room</option>
                  </select>
                  {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.description ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
                  Select Owner
                </label>
                <div className="mt-1">
                  <select
                    id="ownerId"
                    name="ownerId"
                    value={formData.ownerId || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select Owner</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacity *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="capacity"
                    id="capacity"
                    min="1"
                    value={formData.capacity}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.capacity ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">
                  Rooms *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="rooms"
                    id="rooms"
                    min="1"
                    value={formData.rooms}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.rooms ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.rooms && <p className="mt-1 text-sm text-red-600">{errors.rooms}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price per night per person (₹) *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-center">
                  <input
                    id="available"
                    name="available"
                    type="checkbox"
                    checked={formData.available}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
                    Available for booking
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Location</h2>
            </div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="cityId" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <div className="mt-1">
                  <select
                    id="cityId"
                    name="cityId"
                    value={formData.cityId || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1">
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter full address"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="latitude"
                    id="latitude"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 18.5204"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="longitude"
                    id="longitude"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., 73.8567"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features & Amenities */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Features & Amenities</h2>

            {/* Custom Features */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">Custom Features</h3>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature) => (
                  <div
                    key={feature}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="ml-1.5 h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a custom feature"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md rounded-r-none"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="inline-flex items-center px-4 py-2 border border-transparent border-l-0 shadow-sm text-sm font-medium rounded-none rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">Amenities</h3>
              <select
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md mb-2"
                onChange={e => {
                  const amenityId = Number(e.target.value);
                  if (amenityId && !formData.amenityIds?.includes(amenityId)) {
                    handleAmenityChange(amenityId);
                  }
                  e.target.value = '';
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Add Amenity
                </option>
                {amenities
                  .filter(a => !formData.amenityIds?.includes(a.id))
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenities
                  .filter(a => formData.amenityIds?.includes(a.id))
                  .map(amenity => (
                    <div key={amenity.id} className="flex items-center">
                      <span className="mr-2">{amenity.name}</span>
                      <button
                        type="button"
                        onClick={() => handleAmenityChange(amenity.id)}
                        className="ml-1.5 h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Package Details</h2>
            </div>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="packageName" className="block text-sm font-medium text-gray-700">
                  Package Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="packageName"
                    id="packageName"
                    value={formData.name}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="e.g., Weekend Getaway Package"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">
                  No. of Guests
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="maxGuests"
                    id="maxGuests"
                    min="1"
                    value={formData.maxGuests}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
  <label htmlFor="packageDescription" className="block text-sm font-medium text-gray-700">
    Package Description
  </label>
  <div className="mt-1">
    <ReactQuill
      theme="snow"
      value={formData.packageDescription || ''}
      onChange={(content) => {
        setFormData({
          ...formData,
          packageDescription: content,
        });
        if (errors.packageDescription) {
          setErrors({ ...errors, packageDescription: '' });
        }
      }}
      className="bg-white rounded-md"
      placeholder="Describe what's included in this package"
    />
    {errors.packageDescription && (
      <p className="mt-1 text-sm text-red-600">{errors.packageDescription}</p>
    )}
  </div>
</div>

              <div className="sm:col-span-3">
                <label htmlFor="adultPrice" className="block text-sm font-medium text-gray-700">
                  Adult Price (₹)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="adultPrice"
                    id="adultPrice"
                    min="0"
                    step="0.01"
                    value={formData.adultPrice}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="childPrice" className="block text-sm font-medium text-gray-700">
                  Child Price (₹)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="childPrice"
                    id="childPrice"
                    min="0"
                    step="0.01"
                    value={formData.childPrice}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Images */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Property Images</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Upload Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {uploading && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading images...
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Property ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/accommodations"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || uploading}
            className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Property' : 'Create Property'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccommodationForm;



// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { ArrowLeft, Building2, Plus, X, Save, Trash2, Loader2, MapPin, Users, Package } from 'lucide-react';

// const admin_BASE_URL = 'http://31.97.62.213:5000';

// interface Accommodation {
//   id?: number;
//   name: string;
//   description: string;
//   type: string;
//   capacity: number;
//   rooms: number;
//   price: number;
//   features: string[];
//   images: string[];
//   available: boolean;
//   ownerId?: number;
//   cityId?: number;
//   address?: string;
//   latitude?: number;
//   longitude?: number;
//   amenityIds?: number[];
//   packageName?: string;
//   packageDescription?: string;
//   packageImages?: string[];
//   adultPrice?: number;
//   childPrice?: number;
//   maxGuests?: number;
// }

// interface User {
//   id: number;
//   name: string;
//   email: string;
// }

// interface City {
//   id: number;
//   name: string;
//   country: string;
// }

// interface Amenity {
//   id: number;
//   name: string;
//   icon: string;
// }

// const AccommodationForm: React.FC = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const isEditing = id !== undefined;

//   const [formData, setFormData] = useState<Accommodation>({
//     name: '',
//     description: '',
//     type: '',
//     capacity: 2,
//     rooms: 1,
//     price: 0,
//     features: [],
//     images: [],
//     available: true,
//     ownerId: undefined,
//     cityId: undefined,
//     address: '',
//     latitude: undefined,
//     longitude: undefined,
//     amenityIds: [],
//     packageName: '',
//     packageDescription: '',
//     packageImages: [],
//     adultPrice: 0,
//     childPrice: 0,
//     maxGuests: 2
//   });

//   const [users, setUsers] = useState<User[]>([]);
//   const [cities, setCities] = useState<City[]>([]);
//   const [amenities, setAmenities] = useState<Amenity[]>([]);
//   const [newFeature, setNewFeature] = useState('');
//   const [newImageUrl, setNewImageUrl] = useState('');
//   const [newPackageImageUrl, setNewPackageImageUrl] = useState('');
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(false);
//   const [submitError, setSubmitError] = useState('');
//   const [uploading, setUploading] = useState(false);

//   useEffect(() => {
//     if (isEditing && id) {
//       fetchAccommodation(id);
//     }
//     fetchUsers();
//     fetchCities();
//     fetchAmenities();
//   }, [isEditing, id]);

//   const fetchAccommodation = async (accommodationId: string) => {
//     setFetching(true);
//     try {
//       const response = await fetch(`${admin_BASE_URL}/admin/properties/accommodations/${accommodationId}`);
//       if (!response.ok) {
//         if (response.status === 404) {
//           setSubmitError('Accommodation not found');
//           return;
//         }
//         throw new Error('Failed to fetch accommodation');
//       }

//       const data = await response.json();
      
//       // Process amenities and features
//       const amenityIds = Array.isArray(data.amenity_ids) ? data.amenity_ids : [];
//       const features = Array.isArray(data.features) ? data.features : [];
      
//       // If we have amenity IDs but no features, get the names from amenities
//       if (amenityIds.length > 0 && features.length === 0) {
//         const amenityNames = amenities
//           .filter(a => amenityIds.includes(a.id))
//           .map(a => a.name);
//         features.push(...amenityNames);
//       }

//       setFormData({
//         id: data.id,
//         name: data.basicInfo?.name || '',
//         description: data.basicInfo?.description || '',
//         type: data.basicInfo?.type || '',
//         capacity: data.basicInfo?.capacity || 2,
//         rooms: data.basicInfo?.rooms || data.bedrooms || 1,
//         price: data.basicInfo?.price || 0,
//         features: features,
//         images: Array.isArray(data.images) ? data.images : [],
//         available: data.basicInfo?.available !== undefined ? data.basicInfo.available : true,
//         ownerId: data.location?.owner?.id || data.ownerId || undefined,
//         cityId: data.location?.city?.id || data.cityId || undefined,
//         address: data.location?.address || '',
//         latitude: data.location?.coordinates?.latitude || undefined,
//         longitude: data.location?.coordinates?.longitude || undefined,
//         amenityIds: amenityIds,
//         packageName: data.basicInfo?.name || data.packageName || '',
//         packageDescription: data.packages?.description || data.packageDescription || '',
//         packageImages: Array.isArray(data.package_images) ? data.package_images : [],
//         adultPrice: data.packages?.pricing?.adult || data.adultPrice || 0,
//         childPrice: data.packages?.pricing?.child || data.childPrice || 0,
//         maxGuests: data.packages?.pricing?.maxGuests || data.maxGuests || 2
//       });
//     } catch (error) {
//       console.error('Error fetching accommodation:', error);
//       setSubmitError('Failed to load accommodation data');
//       toast.error('Failed to load accommodation data');
//     } finally {
//       setFetching(false);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       const response = await fetch(`${admin_BASE_URL}/admin/properties/users`);
//       if (response.ok) {
//         const data = await response.json();
//         setUsers(data);
//       }
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       toast.error('Failed to load users');
//     }
//   };

//   const fetchCities = async () => {
//     try {
//       const response = await fetch(`${admin_BASE_URL}/admin/properties/cities`);
//       if (response.ok) {
//         const data = await response.json();
//         setCities(data);
//       }
//     } catch (error) {
//       console.error('Error fetching cities:', error);
//       toast.error('Failed to load cities');
//     }
//   };

//   const fetchAmenities = async () => {
//     try {
//       const response = await fetch(`${admin_BASE_URL}/admin/amenities`);
//       if (response.ok) {
//         const data = await response.json();
//         setAmenities(data);
//       }
//     } catch (error) {
//       console.error('Error fetching amenities:', error);
//       toast.error('Failed to load amenities');
//     }
//   };

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;

//     if (type === 'checkbox') {
//       setFormData({
//         ...formData,
//         [name]: (e.target as HTMLInputElement).checked,
//       });
//     } else if (name === 'price' || name === 'capacity' || name === 'rooms' || 
//                name === 'latitude' || name === 'longitude' || name === 'adultPrice' || 
//                name === 'childPrice' || name === 'maxGuests') {
//       setFormData({
//         ...formData,
//         [name]: value === '' ? 0 : Number(value),
//       });
//     } else if (name === 'ownerId' || name === 'cityId') {
//       setFormData({
//         ...formData,
//         [name]: value === '' ? undefined : Number(value),
//       });
//     } else {
//       setFormData({
//         ...formData,
//         [name]: value,
//       });
//     }

//     if (errors[name]) {
//       setErrors({
//         ...errors,
//         [name]: ''
//       });
//     }
//   };

//   const handleAmenityChange = (amenityId: number, amenityName: string) => {
//     const currentAmenities = formData.amenityIds || [];
//     const currentFeatures = formData.features || [];
    
//     if (currentAmenities.includes(amenityId)) {
//       // Remove amenity
//       setFormData({
//         ...formData,
//         amenityIds: currentAmenities.filter(id => id !== amenityId),
//         features: currentFeatures.filter(f => f !== amenityName)
//       });
//     } else {
//       // Add amenity
//       setFormData({
//         ...formData,
//         amenityIds: [...currentAmenities, amenityId],
//         features: [...currentFeatures, amenityName]
//       });
//     }
//   };

//   const addFeature = () => {
//     if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
//       setFormData({
//         ...formData,
//         features: [...formData.features, newFeature.trim()],
//       });
//       setNewFeature('');
//     }
//   };

//   const removeFeature = (feature: string) => {
//     // Check if this feature is associated with an amenity
//     const amenity = amenities.find(a => a.name === feature);
//     if (amenity) {
//       // Remove both the feature and the amenity ID
//       setFormData({
//         ...formData,
//         features: formData.features.filter((f) => f !== feature),
//         amenityIds: formData.amenityIds?.filter(id => id !== amenity.id) || []
//       });
//     } else {
//       // Just remove the custom feature
//       setFormData({
//         ...formData,
//         features: formData.features.filter((f) => f !== feature),
//       });
//     }
//   };

//   const addImage = () => {
//     if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
//       setFormData({
//         ...formData,
//         images: [...formData.images, newImageUrl.trim()],
//       });
//       setNewImageUrl('');
//     }
//   };

//   const removeImage = (image: string) => {
//     setFormData({
//       ...formData,
//       images: formData.images.filter((img) => img !== image),
//     });
//   };

//   const addPackageImage = () => {
//     if (newPackageImageUrl.trim() && !formData.packageImages?.includes(newPackageImageUrl.trim())) {
//       setFormData({
//         ...formData,
//         packageImages: [...(formData.packageImages || []), newPackageImageUrl.trim()],
//       });
//       setNewPackageImageUrl('');
//     }
//   };

//   const removePackageImage = (image: string) => {
//     setFormData({
//       ...formData,
//       packageImages: formData.packageImages?.filter((img) => img !== image) || [],
//     });
//   };

//   const validate = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.name.trim()) {
//       newErrors.name = 'Name is required';
//     }
//     if (!formData.description.trim()) {
//       newErrors.description = 'Description is required';
//     }
//     if (!formData.type) {
//       newErrors.type = 'Type is required';
//     }
//     if (formData.price <= 0) {
//       newErrors.price = 'Price must be greater than 0';
//     }
//     if (formData.capacity <= 0) {
//       newErrors.capacity = 'Capacity must be greater than 0';
//     }
//     if (formData.rooms <= 0) {
//       newErrors.rooms = 'Rooms must be greater than 0';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitError('');

//     if (!validate()) {
//       return;
//     }

//     setLoading(true);

//     try {
//       const url = isEditing
//         ? `http://localhost:5000/admin/properties/accommodations/${id}`
//         : `${admin_BASE_URL}/admin/properties/accommodations`;

//       const method = isEditing ? 'PUT' : 'POST';

//       const requestData = {
//         ...formData,
//         features: formData.features || [],
//         images: formData.images || [],
//         amenityIds: formData.amenityIds || [],
//         packageImages: formData.packageImages || [],
//         ownerId: formData.ownerId ?? null,
//         cityId: formData.cityId ?? null,
//         latitude: formData.latitude ?? null,
//         longitude: formData.longitude ?? null
//       };

//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(requestData),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to save accommodation');
//       }

//       const savedAccommodation = await response.json();
//       toast.success(isEditing ? 'Accommodation updated successfully!' : 'Accommodation created successfully!');
//       navigate('/accommodations');
//     } catch (error) {
//       console.error('Error saving accommodation:', error);
//       setSubmitError(error instanceof Error ? error.message : 'Failed to save accommodation');
//       toast.error('Failed to save accommodation');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (fetching) {
//     return (
//       <div className="flex items-center justify-center min-h-64">
//         <div className="flex items-center">
//           <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
//           <span className="text-lg text-gray-600">Loading accommodation...</span>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 pb-16 md:pb-0">
//       <div className="sm:flex sm:items-center sm:justify-between">
//         <div>
//           <div className="flex items-center">
//             <button
//               onClick={() => navigate('/accommodations')}
//               className="mr-2 text-gray-400 hover:text-gray-500"
//             >
//               <ArrowLeft className="h-5 w-5" />
//             </button>
//             <h1 className="text-2xl font-bold text-gray-900">
//               {isEditing ? 'Edit Property' : 'Add New Property'}
//             </h1>
//           </div>
//           <p className="mt-1 text-sm text-gray-500">
//             {isEditing ? 'Update property details' : 'Create a new property for your resort'}
//           </p>
//         </div>
//       </div>

//       {submitError && (
//         <div className="bg-red-50 border border-red-200 rounded-md p-4">
//           <div className="flex">
//             <div className="ml-3">
//               <h3 className="text-sm font-medium text-red-800">Error</h3>
//               <div className="mt-2 text-sm text-red-700">
//                 <p>{submitError}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="space-y-8">
//         {/* Basic Information */}
//         <div className="bg-white shadow rounded-lg overflow-hidden">
//           <div className="p-6 space-y-6">
//             <div className="flex items-center mb-4">
//               <Building2 className="h-5 w-5 text-blue-600 mr-2" />
//               <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
//             </div>
//             <hr className="mb-6 border-gray-200" />
//             <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
//               <div className="sm:col-span-4">
//                 <label htmlFor="name" className="block text-sm font-medium text-gray-700">
//                   Property Name *
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="text"
//                     name="name"
//                     id="name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
//                   />
//                   {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
//                 </div>
//               </div>

//               <div className="sm:col-span-2">
//                 <label htmlFor="type" className="block text-sm font-medium text-gray-700">
//                   Type *
//                 </label>
//                 <div className="mt-1">
//                   <select
//                     id="type"
//                     name="type"
//                     value={formData.type}
//                     onChange={handleChange}
//                     className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md ${errors.type ? 'border-red-300' : 'border-gray-300'}`}
//                   >
//                     <option value="">Select Type</option>
//                     {!['Villa', 'Suite', 'Cottage', 'Bungalow', 'Glamping', 'Standard', 'Deluxe'].includes(formData.type) &&
//                       formData.type && (
//                         <option value={formData.type}>{formData.type}</option>
//                       )}
//                     <option value="Villa">Villa</option>
//                     <option value="Suite">Suite</option>
//                     <option value="Cottage">Cottage</option>
//                     <option value="Bungalow">Bungalow</option>
//                     <option value="Glamping">Glamping</option>
//                     <option value="Standard">Standard Room</option>
//                     <option value="Deluxe">Deluxe Room</option>
//                   </select>
//                   {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
//                 </div>
//               </div>

//               <div className="sm:col-span-6">
//                 <label htmlFor="description" className="block text-sm font-medium text-gray-700">
//                   Description *
//                 </label>
//                 <div className="mt-1">
//                   <textarea
//                     id="description"
//                     name="description"
//                     rows={3}
//                     value={formData.description}
//                     onChange={handleChange}
//                     className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
//                   />
//                   {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
//                 </div>
//               </div>

//               <div className="sm:col-span-3">
//                 <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
//                   Select Owner
//                 </label>
//                 <div className="mt-1">
//                   <select
//                     id="ownerId"
//                     name="ownerId"
//                     value={formData.ownerId || ''}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                   >
//                     <option value="">Select Owner</option>
//                     {users.map(user => (
//                       <option key={user.id} value={user.id}>
//                         {user.name} ({user.email})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="sm:col-span-1">
//                 <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
//                   Capacity *
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="number"
//                     name="capacity"
//                     id="capacity"
//                     min="1"
//                     value={formData.capacity}
//                     onChange={handleChange}
//                     className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.capacity ? 'border-red-300' : 'border-gray-300'}`}
//                   />
//                   {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
//                 </div>
//               </div>

//               <div className="sm:col-span-1">
//                 <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">
//                   Rooms *
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="number"
//                     name="rooms"
//                     id="rooms"
//                     min="1"
//                     value={formData.rooms}
//                     onChange={handleChange}
//                     className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.rooms ? 'border-red-300' : 'border-gray-300'}`}
//                   />
//                   {errors.rooms && <p className="mt-1 text-sm text-red-600">{errors.rooms}</p>}
//                 </div>
//               </div>

//               <div className="sm:col-span-2">
//                 <label htmlFor="price" className="block text-sm font-medium text-gray-700">
//                   Price per night per person (₹) *
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="number"
//                     name="price"
//                     id="price"
//                     min="0"
//                     step="0.01"
//                     value={formData.price}
//                     onChange={handleChange}
//                     className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${errors.price ? 'border-red-300' : 'border-gray-300'}`}
//                   />
//                   {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
//                 </div>
//               </div>

//               <div className="sm:col-span-6">
//                 <div className="flex items-center">
//                   <input
//                     id="available"
//                     name="available"
//                     type="checkbox"
//                     checked={formData.available}
//                     onChange={handleChange}
//                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                   />
//                   <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
//                     Available for booking
//                   </label>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Location */}
//         <div className="bg-white shadow rounded-lg overflow-hidden">
//           <div className="p-6 space-y-6">
//             <div className="flex items-center mb-4">
//               <MapPin className="h-5 w-5 text-blue-600 mr-2" />
//               <h2 className="text-lg font-medium text-gray-900">Location</h2>
//             </div>
//             <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
//               <div className="sm:col-span-3">
//                 <label htmlFor="cityId" className="block text-sm font-medium text-gray-700">
//                   City
//                 </label>
//                 <div className="mt-1">
//                   <select
//                     id="cityId"
//                     name="cityId"
//                     value={formData.cityId || ''}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                   >
//                     <option value="">Select City</option>
//                     {cities.map(city => (
//                       <option key={city.id} value={city.id}>
//                         {city.name}, {city.country}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className="sm:col-span-6">
//                 <label htmlFor="address" className="block text-sm font-medium text-gray-700">
//                   Address
//                 </label>
//                 <div className="mt-1">
//                   <textarea
//                     id="address"
//                     name="address"
//                     rows={2}
//                     value={formData.address}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                     placeholder="Enter full address"
//                   />
//                 </div>
//               </div>

//               <div className="sm:col-span-3">
//                 <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
//                   Latitude
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="number"
//                     name="latitude"
//                     id="latitude"
//                     step="any"
//                     value={formData.latitude || ''}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                     placeholder="e.g., 18.5204"
//                   />
//                 </div>
//               </div>

//               <div className="sm:col-span-3">
//                 <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
//                   Longitude
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="number"
//                     name="longitude"
//                     id="longitude"
//                     step="any"
//                     value={formData.longitude || ''}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                     placeholder="e.g., 73.8567"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Features & Amenities */}
//         <div className="bg-white shadow rounded-lg overflow-hidden">
//           <div className="p-6 space-y-6">
//             <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Features & Amenities</h2>

//             {/* Custom Features */}
//             <div className="space-y-4">
//               <h3 className="text-md font-medium text-gray-700">Custom Features</h3>
//               <div className="flex flex-wrap gap-2">
//                 {formData.features.map((feature) => (
//                   <div
//                     key={feature}
//                     className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
//                   >
//                     {feature}
//                     <button
//                       type="button"
//                       onClick={() => removeFeature(feature)}
//                       className="ml-1.5 h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
//                     >
//                       <X className="h-4 w-4" />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//               <div className="flex">
//                 <input
//                   type="text"
//                   value={newFeature}
//                   onChange={(e) => setNewFeature(e.target.value)}
//                   placeholder="Add a custom feature"
//                   className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md rounded-r-none"
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault();
//                       addFeature();
//                     }
//                   }}
//                 />
//                 <button
//                   type="button"
//                   onClick={addFeature}
//                   className="inline-flex items-center px-4 py-2 border border-transparent border-l-0 shadow-sm text-sm font-medium rounded-none rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                 >
//                   <Plus className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>

//             {/* Amenities */}
//             <div className="space-y-4">
//               <h3 className="text-md font-medium text-gray-700">Amenities</h3>
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                 {amenities.map(amenity => (
//                   <div key={amenity.id} className="flex items-center">
//                     <input
//                       id={`amenity-${amenity.id}`}
//                       name={`amenity-${amenity.id}`}
//                       type="checkbox"
//                       checked={formData.amenityIds?.includes(amenity.id) || false}
//                       onChange={() => handleAmenityChange(amenity.id, amenity.name)}
//                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                     />
//                     <label htmlFor={`amenity-${amenity.id}`} className="ml-2 block text-sm text-gray-700">
//                       {amenity.name}
//                     </label>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Package Details */}
//         <div className="bg-white shadow rounded-lg overflow-hidden">
//           <div className="p-6 space-y-6">
//             <div className="flex items-center mb-4">
//               <Package className="h-5 w-5 text-blue-600 mr-2" />
//               <h2 className="text-lg font-medium text-gray-900">Package Details</h2>
//             </div>
//             <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
//               <div className="sm:col-span-3">
//                 <label htmlFor="packageName" className="block text-sm font-medium text-gray-700">
//                   Package Name
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="text"
//                     name="packageName"
//                     id="packageName"
//                     value={formData.packageName}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                     placeholder="e.g., Weekend Getaway Package"
//                   />
//                 </div>
//               </div>

//               <div className="sm:col-span-3">
//                 <label htmlFor="maxGuests" className="block text-sm font-medium text-gray-700">
//                   No. of Guests
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="number"
//                     name="maxGuests"
//                     id="maxGuests"
//                     min="1"
//                     value={formData.maxGuests}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>

//               <div className="sm:col-span-6">
//                 <label htmlFor="packageDescription" className="block text-sm font-medium text-gray-700">
//                   Package Description
//                 </label>
//                 <div className="mt-1">
//                   <textarea
//                     id="packageDescription"
//                     name="packageDescription"
//                     rows={3}
//                     value={formData.packageDescription}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                     placeholder="Describe what's included in this package"
//                   />
//                 </div>
//               </div>

//               <div className="sm:col-span-3">
//                 <label htmlFor="adultPrice" className="block text-sm font-medium text-gray-700">
//                   Adult Price (₹)
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="number"
//                     name="adultPrice"
//                     id="adultPrice"
//                     min="0"
//                     step="0.01"
//                     value={formData.adultPrice}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>

//               <div className="sm:col-span-3">
//                 <label htmlFor="childPrice" className="block text-sm font-medium text-gray-700">
//                   Child Price (₹)
//                 </label>
//                 <div className="mt-1">
//                   <input
//                     type="number"
//                     name="childPrice"
//                     id="childPrice"
//                     min="0"
//                     step="0.01"
//                     value={formData.childPrice}
//                     onChange={handleChange}
//                     className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Property Images */}
//         <div className="bg-white shadow rounded-lg overflow-hidden">
//           <div className="p-6 space-y-6">
//             <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Property Images</h2>
//             <div className="space-y-4">
//               <label className="block text-sm font-medium text-gray-700">Upload Images</label>
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={async (e) => {
//                   const files = e.target.files;
//                   if (!files) return;
//                   setUploading(true);
//                   const uploadedUrls: string[] = [];
//                   for (const file of Array.from(files)) {
//                     const formDataFile = new FormData();
//                     formDataFile.append('image', file);
//                     try {
//                       const res = await fetch('https://plumeriaretreat.com/upload_gallery.php', {
//                         method: 'POST',
//                         body: formDataFile,
//                       });
//                       if (!res.ok) {
//                         throw new Error('Failed to upload image');
//                       }
//                       const data = await res.json();
//                       if (data.success && data.filename) {
//                         uploadedUrls.push(`https://plumeriaretreat.com/a5dbGH68rey3jg/gallery/${data.filename}`);
//                       }
//                     } catch (error) {
//                       console.error('Error uploading image:', error);
//                       toast.error('Failed to upload image');
//                     }
//                   }
//                   setFormData({
//                     ...formData,
//                     images: [...(formData.images || []), ...uploadedUrls],
//                   });
//                   setUploading(false);
//                 }}
//                 className="block w-full text-sm text-gray-500
//                   file:mr-4 file:py-2 file:px-4
//                   file:rounded-md file:border-0
//                   file:text-sm file:font-semibold
//                   file:bg-blue-50 file:text-blue-700
//                   hover:file:bg-blue-100"
//               />
//               {uploading && <p className="text-blue-600 text-sm">Uploading...</p>}
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
//                 {formData.images.map((image, index) => (
//                   <div key={index} className="relative group">
//                     <img
//                       src={image}
//                       alt={`Property ${index + 1}`}
//                       className="w-full h-32 object-cover rounded-lg"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removeImage(image)}
//                       className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
//                     >
//                       <X className="h-4 w-4" />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Form Actions */}
//         <div className="flex justify-end space-x-3">
//           <Link
//             to="/accommodations"
//             className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             Cancel
//           </Link>
//           <button
//             type="submit"
//             disabled={loading}
//             className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 {isEditing ? 'Updating...' : 'Creating...'}
//               </>
//             ) : (
//               <>
//                 <Save className="h-4 w-4 mr-2" />
//                 {isEditing ? 'Update Property' : 'Create Property'}
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default AccommodationForm;
