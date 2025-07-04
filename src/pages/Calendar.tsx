// import { useState, useEffect } from 'react';
// import { format } from 'date-fns';
// import { Calendar as CalendarIcon, X, Trash2, Edit2, AlertCircle, CheckCircle, Building2 } from 'lucide-react';

// const admin_BASE_URL = 'http://localhost:5000';
// // ✅ Correct
// // const admin_BASE_URL = 'https://plumeriaadminback-production.up.railway.app';


// interface Accommodation {
//   id: number;
//   name: string;
//   type: string;
// }

// const Calendar = () => {
//   const [selectedDays, setSelectedDays] = useState<Date[]>([]);
//   const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
//   const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
//   const [reason, setReason] = useState('');
//   const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
//   const [showForm, setShowForm] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [editingDate, setEditingDate] = useState<BlockedDate | null>(null);
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [adultPrice, setAdultPrice] = useState<number | ''>('');
//   const [childPrice, setChildPrice] = useState<number | ''>('');

//   // Fetch blocked dates from backend
//   const fetchBlockedDates = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(`${admin_BASE_URL}/admin/calendar/blocked-dates`);
//       const data = await response.json();

//       if (data.success) {
//         setBlockedDates(data.data);
//       } else {
//         setError('Failed to fetch blocked dates');
//       }
//     } catch (err) {
//       alert("Error from fetch BlockedDates");
//       setError('Error connecting to server');
//       console.error('Fetch error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch accommodations
//   const fetchAccommodations = async () => {
//     try {
//       const response = await fetch(`${admin_BASE_URL}/admin/properties/accommodations`);
//       if (response.ok) {
//         const data = await response.json();
//         setAccommodations(data);
//       }
//     } catch (err) {
//       console.error('Error fetching accommodations:', err);
//     }
//   };

//   useEffect(() => {
//     fetchBlockedDates();
//     fetchAccommodations();
//   }, []);

//   // Clear messages after 5 seconds
//   useEffect(() => {
//     if (error || success) {
//       const timer = setTimeout(() => {
//         setError('');
//         setSuccess('');
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [error, success]);

//   interface BlockedDate {
//     id: number;
//     blocked_date: string;
//     reason?: string;
//     accommodation_id?: number;
//     accommodation_name?: string;
//     adult_price?: number;
//     child_price?: number;
//   }

//   const handleDayClick = (day: Date) => {
//     const dayStr = format(day, 'yyyy-MM-dd');
//     const isBlocked = blockedDates.some((blocked: BlockedDate) => blocked.blocked_date === dayStr);

//     if (isBlocked) {
//       // If clicking on a blocked date, allow editing
//       const blockedDate = blockedDates.find((blocked: BlockedDate) => blocked.blocked_date === dayStr);
//       if (blockedDate) {
//         setEditingDate(blockedDate);
//         setReason(blockedDate.reason || '');
//         setSelectedAccommodationId(blockedDate.accommodation_id || null);
//         setShowForm(true);
//       }
//       return;
//     }

//     const isSelected = selectedDays.some(
//       (selectedDay: Date) => format(selectedDay, 'yyyy-MM-dd') === dayStr
//     );

//     if (isSelected) {
//       setSelectedDays(selectedDays.filter(
//         (selectedDay: Date) => format(selectedDay, 'yyyy-MM-dd') !== dayStr
//       ));
//     } else {
//       setSelectedDays([...selectedDays, day]);
//       setShowForm(true);
//     }
//   };

//   const handleSaveBlockedDates = async () => {
//     if (selectedDays.length === 0 && !editingDate) {
//       setError('Please select at least one date');
//       return;
//     }

//     try {
//       setLoading(true);

//       const dates = editingDate
//         ? [editingDate.blocked_date]
//         : selectedDays.map(day => format(day, 'yyyy-MM-dd'));

//       // Allow saving if either reason or prices are set
//       if (!reason && !adultPrice && !childPrice) {
//         setError('Please provide a reason or set prices.');
//         setLoading(false);
//         return;
//       }
//       console.log("dates",dates)
//       console.log("reason",reason)
//       console.log("selectedAccommodationId",selectedAccommodationId)
//       console.log("adultPrice",adultPrice)
//       console.log("childPrice",childPrice)

//       // Send all fields, backend should handle what to do
//       const response = await fetch(
//         editingDate
//           ? `${admin_BASE_URL}/admin/calendar/blocked-dates/${editingDate.id}`
//           : `${admin_BASE_URL}/admin/calendar/blocked-dates`,
//         {
//           method: editingDate ? 'PUT' : 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             dates,
//             reason: reason || null,
//             accommodation_id: selectedAccommodationId,
//             adult_price: adultPrice || null,
//             child_price: childPrice || null,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (data.success) {
//         setSuccess('Saved successfully');
//         setSelectedDays([]);
//         await fetchBlockedDates();
//       } else {
//         setError(data.message || 'Failed to save');
//       }
//     } catch (err) {
//       alert("handleSaveBlockedDates Error Coming")
//       setError('Error connecting to server');
//       console.error('Save error:', err);
//     } finally {
//       setLoading(false);
//       setShowForm(false);
//       setEditingDate(null);
//       setReason('');
//       setSelectedAccommodationId(null);
//       setAdultPrice('');
//       setChildPrice('');
//     }
//   };

//   const handleRemoveBlockedDate = async (date: BlockedDate) => {
//     if (!confirm(`Are you sure you want to unblock ${format(new Date(date.blocked_date), 'MMMM d, yyyy')}?`)) {
//       return;
//     }

//     try {
//       setLoading(true);
//       const response = await fetch(`${admin_BASE_URL}/blocked-dates/${date.id}`, {
//         method: 'DELETE',
//       });

//       const data = await response.json();

//       if (data.success) {
//         setSuccess('Blocked date removed successfully');
//         await fetchBlockedDates();
//       } else {
//         setError(data.message || 'Failed to remove blocked date');
//       }
//     } catch (err) {
//       alert("Error from fetch BlockedDates")
//       setError('Error connecting to server');
//       console.error('Delete error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setShowForm(false);
//     setSelectedDays([]);
//     setReason('');
//     setSelectedAccommodationId(null);
//     setEditingDate(null);
//   };

//   const isDateBlocked = (date: Date) => {
//     const dateStr = format(date, 'yyyy-MM-dd');
//     return blockedDates.some(blocked => blocked.blocked_date === dateStr);
//   };

//   const isDateSelected = (date: Date) => {
//     return selectedDays.some(selected => format(selected, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
//   };

//   const getDayClassName = (date: Date) => {
//     const dateStr = format(date, 'yyyy-MM-dd');
//     const blocked = blockedDates.find(bd => bd.blocked_date === dateStr);

//     let className = 'calendar-day';

//     if (blocked) {
//       if (blocked.reason && blocked.reason.trim() !== '') {
//         className += ' blocked-date-red bg-red-500 text-white font-bold'; // Blocked (red)
//       } else if ((blocked.adult_price || blocked.child_price) && (!blocked.reason || blocked.reason.trim() === '')) {
//         className += ' price-date-green bg-green-500 text-white font-bold'; // Price-set only (green)
//       }
//     } else if (isDateSelected(date)) {
//       className += ' selected-date bg-blue-500 text-white font-bold';
//     }

//     return className;
//   };

//   const generateCalendarDays = () => {
//     const year = currentDate.getFullYear();
//     const month = currentDate.getMonth();
//     const firstDay = new Date(year, month, 1);
//     const lastDay = new Date(year, month + 1, 0);
//     const startDate = new Date(firstDay);
//     startDate.setDate(startDate.getDate() - firstDay.getDay());

//     const days = [];
//     const current = new Date(startDate);

//     for (let i = 0; i < 42; i++) {
//       days.push(new Date(current));
//       current.setDate(current.getDate() + 1);
//     }

//     return days;
//   };

//   interface NavigateMonthProps {
//     direction: number;
//   }

//   const navigateMonth = (direction: number): void => {
//     const newDate = new Date(currentDate);
//     newDate.setMonth(newDate.getMonth() + direction);
//     setCurrentDate(newDate);
//   };

//   const calendarDays = generateCalendarDays();
//   const monthYear = format(currentDate, 'MMMM yyyy');

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Manage Calendar</h1>
//         <p className="mt-2 text-gray-600">Block dates when properties are unavailable</p>
//       </div>

//       {/* Alerts */}
//       {loading && (
//         <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
//           <div className="flex items-center">
//             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
//             <span className="text-blue-700">Loading...</span>
//           </div>
//         </div>
//       )}

//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-md p-4">
//           <div className="flex items-center">
//             <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
//             <span className="text-red-700">{error}</span>
//           </div>
//         </div>
//       )}

//       {success && (
//         <div className="bg-green-50 border border-green-200 rounded-md p-4">
//           <div className="flex items-center">
//             <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
//             <span className="text-green-700">{success}</span>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Calendar */}
//         <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-semibold text-gray-900 flex items-center">
//               <CalendarIcon className="h-6 w-6 text-blue-600 mr-2" />
//               Select Dates to Block
//             </h2>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => navigateMonth(-1)}
//                 className="p-2 hover:bg-gray-100 rounded-md"
//               >
//                 ←
//               </button>
//               <span className="text-lg font-medium min-w-[140px] text-center">
//                 {monthYear}
//               </span>
//               <button
//                 onClick={() => navigateMonth(1)}
//                 className="p-2 hover:bg-gray-100 rounded-md"
//               >
//                 →
//               </button>
//             </div>
//           </div>

//           {/* Calendar Grid */}
//           <div className="grid grid-cols-7 gap-1 mb-4">
//             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
//               <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
//                 {day}
//               </div>
//             ))}
//           </div>

//           <div className="grid grid-cols-7 gap-1">
//             {calendarDays.map((day, index) => {
//               const isCurrentMonth = day.getMonth() === currentDate.getMonth();
//               const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
//               const className = getDayClassName(day);

//               return (
//                 <button
//                   key={index}
//                   onClick={() => handleDayClick(day)}
//                   disabled={loading}
//                   className={`
//                     p-2 text-sm rounded-md transition-colors
//                     ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
//                     ${isToday ? 'ring-2 ring-blue-500' : ''}
//                     ${className.includes('blocked-date-red') ? 'bg-red-100 text-red-700 font-semibold' : ''}
//                     ${className.includes('price-date-green') ? 'bg-green-100 text-green-700 font-semibold' : ''}
//                     ${className.includes('selected-date') ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
//                     ${!className.includes('blocked-date-red') && !className.includes('price-date-green') && !className.includes('selected-date') ? 'hover:bg-gray-100' : ''}
//                     ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
//                   `}
//                 >
//                   {day.getDate()}
//                 </button>
//               );
//             })}
//           </div>

//           {/* Legend */}
//           <div className="mt-4 flex flex-wrap gap-4 text-sm">
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
//               <span>Blocked dates</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
//               <span>Price-set only</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
//               <span>Selected dates</span>
//             </div>
//           </div>
//         </div>

//         {/* Form and Blocked Dates List */}
//         <div className="space-y-6">
//           {/* Form */}
//           {showForm && (
//             <div className="bg-white rounded-lg shadow-sm border p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   {editingDate ? 'Edit Blocked Date' : 'Block Selected Dates'}
//                 </h3>
//                 <button
//                   onClick={resetForm}
//                   className="text-gray-400 hover:text-gray-500"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     {editingDate ? 'Selected Date' : 'Selected Dates'}
//                   </label>
//                   <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
//                     {editingDate
//                       ? format(new Date(editingDate.blocked_date), 'MMMM d, yyyy')
//                       : selectedDays.map(day => format(day, 'MMMM d, yyyy')).join(', ')
//                     }
//                   </div>
//                 </div>

//                 <div>
//                   <label htmlFor="accommodationSelect" className="block text-sm font-medium text-gray-700 mb-1">
//                     Select Accommodation
//                   </label>
//                   <select
//                     id="accommodationSelect"
//                     value={selectedAccommodationId || ''}
//                     onChange={(e) => setSelectedAccommodationId(e.target.value ? Number(e.target.value) : null)}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                   >
//                     <option value="">All Properties</option>
//                     {accommodations.map(accommodation => (
//                       <option key={accommodation.id} value={accommodation.id}>
//                         {accommodation.name} ({accommodation.type})
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
//                     Reason for Blocking
//                   </label>
//                   <textarea
//                     id="reason"
//                     rows={3}
//                     value={reason}
//                     onChange={(e) => setReason(e.target.value)}
//                     className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="Enter reason for blocking these dates..."
//                   />
//                 </div>

//                 {/* Price Inputs */}
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label htmlFor="adultPrice" className="block text-sm font-medium text-gray-700 mb-1">
//                       Adult Price (₹)
//                     </label>
//                     <input
//                       type="number"
//                       id="adultPrice"
//                       min="0"
//                       value={adultPrice}
//                       onChange={e => setAdultPrice(e.target.value === '' ? '' : Number(e.target.value))}
//                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="e.g. 1500"
//                     />
//                   </div>
//                   <div>
//                     <label htmlFor="childPrice" className="block text-sm font-medium text-gray-700 mb-1">
//                       Child Price (₹)
//                     </label>
//                     <input
//                       type="number"
//                       id="childPrice"
//                       min="0"
//                       value={childPrice}
//                       onChange={e => setChildPrice(e.target.value === '' ? '' : Number(e.target.value))}
//                       className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       placeholder="e.g. 800"
//                     />
//                   </div>
//                 </div>

//                 <div className="flex space-x-3">
//                   <button
//                     type="button"
//                     onClick={resetForm}
//                     disabled={loading}
//                     className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       // Only block date (require reason)
//                       if (!reason) {
//                         setError('Please provide a reason to block the date.');
//                         return;
//                       }
//                       handleSaveBlockedDates();
//                     }}
//                     disabled={loading}
//                     className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
//                   >
//                     {loading ? 'Blocking...' : editingDate ? 'Update Block' : 'Block Date(s)'}
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       // Only set prices (require at least one price)
//                       if (!adultPrice && !childPrice) {
//                         setError('Please set at least one price.');
//                         return;
//                       }
//                       // Clear reason so only prices are set
//                       setReason('');
//                       handleSaveBlockedDates();
//                     }}
//                     disabled={loading}
//                     className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//                   >
//                     {loading ? 'Saving...' : editingDate ? 'Update Price' : 'Set Price(s)'}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Blocked Dates List */}
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               Currently Blocked Dates ({blockedDates.length})
//             </h3>

//             {blockedDates.length === 0 ? (
//               <p className="text-gray-500 text-sm">No dates are currently blocked.</p>
//             ) : (
//               <div className="space-y-2 max-h-96 overflow-y-auto">
//                 {blockedDates.map((date) => (
//                   <div
//                     key={date.id}
//                     className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
//                   >
//                     <div className="flex-1">
//                       <div className="font-medium text-sm text-gray-900">
//                         {format(new Date(date.blocked_date), 'MMMM d, yyyy')}
//                       </div>
//                       {date.accommodation_name && (
//                         <div className="text-xs text-blue-600 flex items-center mt-1">
//                           <Building2 className="h-3 w-3 mr-1" />
//                           {date.accommodation_name}
//                         </div>
//                       )}
//                       {date.reason && (
//                         <div className="text-xs text-gray-600 mt-1">
//                           {date.reason}
//                         </div>
//                       )}
//                     </div>
//                     <div className="flex space-x-1">
//                       <button
//                         onClick={() => {
//                           setEditingDate(date);
//                           setReason(date.reason || '');
//                           setSelectedAccommodationId(date.accommodation_id || null);
//                           setShowForm(true);
//                         }}
//                         disabled={loading}
//                         className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
//                         title="Edit"
//                       >
//                         <Edit2 className="h-4 w-4" />
//                       </button>
//                       <button
//                         onClick={() => handleRemoveBlockedDate(date)}
//                         disabled={loading}
//                         className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
//                         title="Remove"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//       <p className="text-xs text-gray-500 mb-2">
//         You can block a date, set prices, or both. Leave reason empty to only set prices.
//       </p>
//     </div>
//   );
// };

// export default Calendar;
import { useState, useEffect } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, X, Trash2, Edit2, AlertCircle, CheckCircle, Building2 } from 'lucide-react';

// API Configuration
const admin_BASE_URL = 'https://a.plumeriaretreat.com/admin/calendar';

// Types
interface Accommodation {
  id: number;
  name: string;
  type: string;
  rooms: number;
}

interface BlockedDate {
  id: number;
  blocked_date: string;
  reason?: string;
  accommodation_id?: number;
  accommodation_name?: string;
  rooms?: number | null; // null = all rooms, number = specific room
  adult_price?: number | null;
  child_price?: number | null;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

const Calendar = () => {
  // State
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [reason, setReason] = useState('');
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null); // null = all rooms
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingDate, setEditingDate] = useState<BlockedDate | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [adultPrice, setAdultPrice] = useState<number | ''>('');
  const [childPrice, setChildPrice] = useState<number | ''>('');

  // Fetch data
  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${admin_BASE_URL}/blocked-dates`);
      if (!response.ok) throw new Error('Failed to fetch blocked dates');

      const data: ApiResponse = await response.json();

      if (data.success) {
        setBlockedDates(data.data);
      } else {
        setError(data.message || 'Failed to fetch blocked dates');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccommodations = async () => {
    try {
      const response = await fetch(`https://a.plumeriaretreat.com/admin/properties/accommodations`);
      if (!response.ok) throw new Error('Failed to fetch accommodations');

      const data = await response.json();
      if (data.data.length > 0) {
        setAccommodations(data.data);
      }
    } catch (err) {
      console.error('Error fetching accommodations:', err);
      setError('Failed to load accommodations');
    }
  };

  useEffect(() => {
    fetchBlockedDates();
    fetchAccommodations();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Date handlers
  const handleDayClick = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');

    // Check if date is in the past
    if (isBefore(startOfDay(day), startOfDay(new Date()))) {
      setError('Cannot block or modify past dates');
      return;
    }

    const isBlocked = blockedDates.some(b => b.blocked_date === dayStr);

    if (isBlocked) {
      const blockedDate = blockedDates.find(b => b.blocked_date === dayStr);
      if (blockedDate) {
        setEditingDate(blockedDate);
        setReason(blockedDate.reason || '');
        setSelectedAccommodationId(blockedDate.accommodation_id || null);
        setSelectedRoom(blockedDate.rooms || null);
        setAdultPrice(blockedDate.adult_price || '');
        setChildPrice(blockedDate.child_price || '');
        setShowForm(true);
      }
      return;
    }

    const isSelected = selectedDays.some(d => format(d, 'yyyy-MM-dd') === dayStr);
    setSelectedDays(isSelected
      ? selectedDays.filter(d => format(d, 'yyyy-MM-dd') !== dayStr)
      : [...selectedDays, day]
    );
    setShowForm(true);
  };

  // Save handlers
  const validateForm = (): boolean => {
    if (!reason && (adultPrice === '' && childPrice === '')) {
      setError('Please provide a reason or set prices');
      return false;
    }

    if (adultPrice !== '' && adultPrice < 0) {
      setError('Adult price cannot be negative');
      return false;
    }

    if (childPrice !== '' && childPrice < 0) {
      setError('Child price cannot be negative');
      return false;
    }

    return true;
  };

  const handleSaveBlockedDates = async (actionType: 'block' | 'price' | 'both') => {
    if (!validateForm()) return;
    if (selectedDays.length === 0 && !editingDate) {
      setError('Please select at least one date');
      return;
    }

    try {
      setLoading(true);
      const dates = editingDate
        ? [editingDate.blocked_date]
        : selectedDays.map(day => format(day, 'yyyy-MM-dd'));

      const payload = {
        dates,
        reason: actionType === 'price' ? null : reason,
        accommodation_id: selectedAccommodationId,
        room_number: selectedRoom, // null = all rooms
        adult_price: adultPrice === '' ? null : adultPrice,
        child_price: childPrice === '' ? null : childPrice
      };

      const url = editingDate
        ? `${admin_BASE_URL}/blocked-dates/${editingDate.id}`
        : `${admin_BASE_URL}/blocked-dates`;

      const response = await fetch(url, {
        method: editingDate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Request failed');

      const data: ApiResponse = await response.json();

      if (data.success) {
        setSuccess(editingDate ? 'Updated successfully' : 'Saved successfully');
        resetForm();
        await fetchBlockedDates();
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBlockedDate = async (date: BlockedDate) => {
    if (!confirm(`Are you sure you want to unblock ${format(new Date(date.blocked_date), 'MMMM d, yyyy')}?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`${admin_BASE_URL}/blocked-dates/${date.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      const data: ApiResponse = await response.json();

      if (data.success) {
        setSuccess('Date unblocked successfully');
        await fetchBlockedDates();
      } else {
        setError(data.message || 'Failed to remove blocked date');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helpers
  const resetForm = () => {
    setShowForm(false);
    setSelectedDays([]);
    setReason('');
    setSelectedAccommodationId(null);
    setSelectedRoom(null);
    setEditingDate(null);
    setAdultPrice('');
    setChildPrice('');
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(b => b.blocked_date === format(date, 'yyyy-MM-dd'));
  };

  const getDayClassName = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const blocked = blockedDates.find(b => b.blocked_date === dateStr);

    let className = 'calendar-day';

    if (blocked) {
      if (blocked.reason) {
        className += ' blocked-date-red';
      } else if (blocked.adult_price || blocked.child_price) {
        className += ' price-date-green';
      }
    } else if (selectedDays.some(d => format(d, 'yyyy-MM-dd') === dateStr)) {
      className += ' selected-date';
    }

    return className;
  };

  // Calendar generation
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Get current accommodation
  const getCurrentAccommodation = () => {
    return accommodations.find(a => a.id === selectedAccommodationId);
  };

  // Render
  const calendarDays = generateCalendarDays();
  const monthYear = format(currentDate, 'MMMM yyyy');
  const currentAccommodation = getCurrentAccommodation();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Calendar</h1>
        <p className="mt-2 text-gray-600">Block dates when properties are unavailable</p>
      </div>

      {/* Alerts */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-700">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-6 w-6 text-blue-600 mr-2" />
              Select Dates to Block
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-md"
                disabled={loading}
              >
                ←
              </button>
              <span className="text-lg font-medium min-w-[140px] text-center">
                {monthYear}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-md"
                disabled={loading}
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const className = getDayClassName(day);

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  disabled={loading || isBefore(startOfDay(day), startOfDay(new Date()))}
                  className={`
                    p-2 text-sm rounded-md transition-colors
                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                    ${className.includes('blocked-date-red') ? 'bg-red-100 text-red-700 font-semibold' : ''}
                    ${className.includes('price-date-green') ? 'bg-green-100 text-green-700 font-semibold' : ''}
                    ${className.includes('selected-date') ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
                    ${!className.includes('blocked-date-red') &&
                      !className.includes('price-date-green') &&
                      !className.includes('selected-date') ? 'hover:bg-gray-100' : ''}
                    ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${isBefore(startOfDay(day), startOfDay(new Date())) ? 'opacity-50' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
              <span>Blocked dates</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span>Price-set only</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span>Selected dates</span>
            </div>
          </div>
        </div>

        {/* Form and Blocked Dates List */}
        <div className="space-y-6">
          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingDate ? 'Edit Date' : 'Block Selected Dates'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={loading}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingDate ? 'Selected Date' : 'Selected Dates'}
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {editingDate
                      ? format(new Date(editingDate.blocked_date), 'MMMM d, yyyy')
                      : selectedDays.map(day => format(day, 'MMMM d, yyyy')).join(', ')
                    }
                  </div>
                </div>

                <div>
                  <label htmlFor="accommodationSelect" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Accommodation
                  </label>
                  <select
                    id="accommodationSelect"
                    value={selectedAccommodationId || ''}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : null;
                      setSelectedAccommodationId(id);
                      setSelectedRoom(null); // Reset room selection
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="">All Properties</option>
                    {accommodations.map(accommodation => (
                      <option key={accommodation.id} value={accommodation.id}>
                        {accommodation.name} ({accommodation.type})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAccommodationId && currentAccommodation?.rooms && currentAccommodation.rooms > 1 && (
                  <div>
                    <label htmlFor="roomSelect" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Room
                    </label>
                    <select
                      id="roomSelect"
                      value={selectedRoom !== null ? selectedRoom : ''}
                      onChange={(e) => 
                        setSelectedRoom(e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="">All Rooms</option>
                      {Array.from({ length: currentAccommodation.rooms }, (_, i) => i + 1).map(roomNumber => (
                        <option key={roomNumber} value={roomNumber}>
                          {roomNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Blocking
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter reason for blocking these dates..."
                    disabled={loading}
                  />
                </div>

                {/* Price Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="adultPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Adult Price (₹)
                    </label>
                    <input
                      type="number"
                      id="adultPrice"
                      min="0"
                      value={adultPrice}
                      onChange={e => setAdultPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. 1500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label htmlFor="childPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Child Price (₹)
                    </label>
                    <input
                      type="number"
                      id="childPrice"
                      min="0"
                      value={childPrice}
                      onChange={e => setChildPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. 800"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBlockedDates('block')}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingDate ? 'Update Block' : 'Block Date(s)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveBlockedDates('price')}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingDate ? 'Update Price' : 'Set Price(s)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Blocked Dates List */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Currently Blocked Dates ({blockedDates.length})
            </h3>

            {blockedDates.length === 0 ? (
              <p className="text-gray-500 text-sm">No dates are currently blocked.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {blockedDates.map((date) => (
                  <div
                    key={date.id}
                    className={`flex items-center justify-between p-3 rounded-md ${date.reason ? 'bg-red-50' : 'bg-green-50'
                      }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        {format(new Date(date.blocked_date), 'MMMM d, yyyy')}
                      </div>
                      {date.accommodation_name && (
                        <div className="text-xs text-blue-600 flex items-center mt-1">
                          <Building2 className="h-3 w-3 mr-1" />
                          {date.accommodation_name}
                          {date.rooms === null ? ' - All Rooms' : ` - Room ${date.rooms}`}
                        </div>
                      )}
                      {date.reason && (
                        <div className="text-xs text-gray-600 mt-1">
                          {date.reason}
                        </div>
                      )}
                      {(date.adult_price || date.child_price) && (
                        <div className="text-xs text-gray-600 mt-1">
                          Prices: Adult ₹{date.adult_price || '0'}, Child ₹{date.child_price || '0'}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingDate(date);
                          setReason(date.reason || '');
                          setSelectedAccommodationId(date.accommodation_id || null);
                          setSelectedRoom(date.rooms || null);
                          setAdultPrice(date.adult_price || '');
                          setChildPrice(date.child_price || '');
                          setShowForm(true);
                        }}
                        disabled={loading || isDeleting}
                        className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveBlockedDate(date)}
                        disabled={loading || isDeleting}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                        title="Remove"
                      >
                        {isDeleting ? (
                          <span className="animate-spin inline-block h-4 w-4">↻</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        You can block a date, set prices, or both. Leave reason empty to only set prices.
      </p>
    </div>
  );
};

export default Calendar;