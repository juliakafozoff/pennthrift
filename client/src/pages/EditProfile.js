import Header from "../components/Header";
import { useState, useEffect } from "react";
import api from "../api/http";
import { editUserProfile, getUserProfile } from "../api/ProfileAPI";
import placeholder from '../assets/placeholder_user.png';
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Field, Input, Textarea, Button, Badge, PhotoUpload } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

// Helper function to normalize image URLs (same as Profile.js)
const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return null;
    }
    
    // If it's a relative path (starts with /api), prefix with API base URL
    if (url.startsWith('/api/')) {
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        return `${apiBaseUrl}${url}`;
    }
    
    // Backward compatibility: replace localhost URLs with production URL
    if (url.includes('localhost')) {
        const productionUrl = process.env.REACT_APP_API_URL || 'https://pennthrift.onrender.com';
        const urlMatch = url.match(/\/api\/file\/(.+)$/);
        if (urlMatch) {
            const filename = urlMatch[1];
            const encodedFilename = encodeURIComponent(filename);
            return `${productionUrl}/api/file/${encodedFilename}`;
        }
        return url.replace(/https?:\/\/[^\/]+/, productionUrl);
    }
    
    return url;
};

const EditProfile = props => {
    const auth = useAuth();
    const [bio, setBio] = useState('');
    const [user, setUser] = useState('');
    const [userInfo, setUserInfo] = useState('');
    const [image, setImage] = useState();
    const [imageDisplay, setImageDisplay] = useState('');
    const [year, setYear] = useState('');
    const [venmo, setVenmo] = useState('');
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const uClassList = [
        {val:'2022'},
        {val:'2023'},
        {val:'2024'},
        {val:'2025'}
    ];

    const interestsList = [
        {val:'Clothes'},
        {val:'Books/ notes'},
        {val:'Electronics'},
        {val:'Tickets'},
        {val:'Furniture'},
        {val:'Miscellaneous'}
    ];

    // BUGFIX C: Move getUserInfo into useEffect with proper dependencies
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                setInitialLoading(true);
                // Use auth context user instead of making separate /api/auth/me call
                const authUser = auth?.user;
                
                if (authUser && authUser.username) {
                    const currentUser = authUser.username;
                    console.log('[EDIT PROFILE] Current authenticated user:', currentUser, '(from auth context)');
                    setUser(currentUser);
                    
                    const profileInfo = await getUserProfile(currentUser);
                    console.log('[EDIT PROFILE] Profile info loaded for:', currentUser);
                    setUserInfo(profileInfo);
                    processUserInfo(profileInfo);
                } else if (!auth?.isLoading) {
                    // Only show error if auth context has finished loading
                    setError('Not authenticated. Please log in.');
                }
            } catch (err) {
                console.error('[EDIT PROFILE] Error loading user info:', err);
                setError('Failed to load profile. Please refresh the page.');
            } finally {
                setInitialLoading(false);
            }
        };
        
        // Only fetch if auth context has loaded (not loading)
        if (!auth?.isLoading) {
            fetchUserInfo();
        }
    }, [auth?.user?.username, auth?.isLoading]); // Re-run if auth user changes

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            // Clean up object URL if it exists and was created from a file
            if (image && imageDisplay && imageDisplay.startsWith('blob:')) {
                URL.revokeObjectURL(imageDisplay);
            }
        };
    }, [image, imageDisplay]);

    function processUserInfo(info){
        const {class_year, bio, interests, venmo, profile_pic } = info;
        // BUGFIX D: Default bio should be empty string or actual bio, not 'Edit description'
        setBio(bio || '');
        setYear(class_year || '');
        if(interests && Array.isArray(interests)) {
            setInterests(interests);
        } else {
            setInterests([]);
        }
        setVenmo(venmo || '');
        setImageDisplay(profile_pic || '');
    }

    const handleImageSelect = (file) => {
        // Validate file type
        const validTypes = ['image/png', 'image/gif', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload a PNG, GIF, or JPEG image.');
            return;
        }
        setError('');
        
        // Clean up previous object URL if it exists and was created from a file
        if (image && imageDisplay && imageDisplay.startsWith('blob:')) {
            URL.revokeObjectURL(imageDisplay);
        }
        
        setImage(file);
        setImageDisplay(URL.createObjectURL(file));
    };

    const handleImageRemove = () => {
        // Clean up object URL if it exists
        if (image && imageDisplay && imageDisplay.startsWith('blob:')) {
            URL.revokeObjectURL(imageDisplay);
        }
        setImage(null);
        setImageDisplay('');
    };

    const processInterests = (val) => {
        const intrs = [...interests];
        if(intrs.includes(val)){
            setInterests(intrs.filter(item => item !== val));
        } else {
            setInterests([...intrs, val]);
        }
    };

    // BUGFIX A & B: Simplified save flow with try/catch/finally, no duplicate profile_pic key
    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            let profilePicUrl = imageDisplay || '';

            // If a new image file is selected, upload it first
            if (image) {
                const formData = new FormData();
                formData.append("file", image);

                const uploadRes = await api.post('/api/file/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                // Backend now returns JSON: { path, url, filename }
                // ALWAYS prefer relative path for storage (works in both dev and prod)
                // Extract relative path, fallback to extracting from URL if path not available
                if (uploadRes.data?.path) {
                    profilePicUrl = uploadRes.data.path; // Relative path like /api/file/filename.png
                } else if (uploadRes.data?.url) {
                    // Extract relative path from full URL
                    const urlMatch = uploadRes.data.url.match(/\/api\/file\/[^?#]+/);
                    profilePicUrl = urlMatch ? urlMatch[0] : uploadRes.data.url;
                } else if (typeof uploadRes.data === 'string') {
                    // If it's already a string, check if it's a relative path
                    profilePicUrl = uploadRes.data.startsWith('/api/') ? uploadRes.data : uploadRes.data;
                } else {
                    profilePicUrl = uploadRes.data;
                }
            }

            // Build data object - BUGFIX A: Only ONE profile_pic field
            const data = {
                bio: bio || '',
                profile_pic: profilePicUrl,
                username: user,
                venmo: venmo || '',
                class_year: year || '',
                interests: Array.isArray(interests) ? interests : []
            };

            const result = await editUserProfile(user, data);
            
            if (result === 'Success! User updated.') {
                setSuccessMessage('Profile updated successfully!');
                // Brief delay to show success message, then redirect
                setTimeout(() => {
                    navigate('/profile', { replace: true });
                }, 1000);
            } else {
                setError('Failed to update profile. Please try again.');
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            if (err.response?.status === 413) {
                setError('File too large. Please choose a smaller image.');
            } else if (err.message?.includes('file')) {
                setError('Failed to upload image. Please try again.');
            } else {
                setError('Failed to save profile. Please try again.');
            }
        } finally {
            // BUGFIX B: Always clear loading state
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)]">
                <Header/>
                <div className="container py-8 max-w-6xl">
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <svg 
                                className="animate-spin h-8 w-8 text-[var(--color-primary)] mx-auto mb-4" 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-base text-[var(--color-muted)]">Loading profile...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return(
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Header/>
            <div className="container py-8 max-w-6xl">
                <PageHeader 
                    title="Edit Profile"
                    subtitle="Update your profile information"
                />

                {/* Success Message */}
                {successMessage && (
                    <Card className="mb-6 border-green-200 bg-green-50">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-base text-green-700">{successMessage}</p>
                        </div>
                    </Card>
                )}

                {/* Error Message */}
                {error && (
                    <Card className="mb-6 border-[var(--color-danger)] bg-red-50">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-[var(--color-danger)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-base text-[var(--color-danger)]">{error}</p>
                        </div>
                    </Card>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Photo Upload */}
                        <div>
                            <PhotoUpload
                                image={image}
                                imageDisplay={
                                    imageDisplay 
                                        ? (imageDisplay.startsWith('blob:') 
                                            ? imageDisplay 
                                            : normalizeImageUrl(imageDisplay))
                                        : placeholder
                                }
                                onImageSelect={handleImageSelect}
                                onImageRemove={handleImageRemove}
                            />
                        </div>

                        {/* Right Column - Form Fields */}
                        <div className="space-y-6">
                            <Card>
                                <div className="space-y-6">
                                    {/* Username - Read Only */}
                                    <Field label="Username" helperText="Your username cannot be changed">
                                        <Input
                                            value={user}
                                            disabled={true}
                                            className="bg-[var(--color-surface-2)] cursor-not-allowed"
                                            readOnly
                                        />
                                    </Field>

                                    {/* Bio */}
                                    <Field label="Bio" helperText="Tell others about yourself">
                                        <Textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Write a short bio about yourself..."
                                            rows={6}
                                        />
                                    </Field>

                                    {/* Class Year */}
                                    <Field label="Graduating Class" required>
                                        <div className="grid grid-cols-2 gap-3">
                                            {uClassList.map(uc => (
                                                <label
                                                    key={uc.val}
                                                    className="flex items-center cursor-pointer group min-h-[44px] px-3 py-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors border border-[var(--color-border)]"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="class_year"
                                                        value={uc.val}
                                                        checked={year === uc.val}
                                                        onChange={() => setYear(uc.val)}
                                                        className="w-4 h-4 mr-3 text-[var(--color-primary)] border-[var(--color-border)] focus:ring-[var(--color-primary)] focus:ring-2"
                                                    />
                                                    <span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                                                        {uc.val}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </Field>

                                    {/* Venmo */}
                                    <Field label="Venmo" helperText="Your Venmo username for payments">
                                        <Input
                                            type="text"
                                            value={venmo}
                                            onChange={(e) => setVenmo(e.target.value)}
                                            placeholder="@username"
                                        />
                                    </Field>

                                    {/* Interests */}
                                    <Field label="Interests" helperText="Select all that apply">
                                        <div className="grid grid-cols-2 gap-3">
                                            {interestsList.map(intr => (
                                                <label
                                                    key={intr.val}
                                                    className="flex items-center cursor-pointer group min-h-[44px] px-3 py-2 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={interests.includes(intr.val)}
                                                        onChange={() => processInterests(intr.val)}
                                                        className="w-4 h-4 mr-3 text-[var(--color-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)] focus:ring-2"
                                                    />
                                                    <span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                                                        {intr.val}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        {interests.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {interests.map(intr => (
                                                    <Badge key={intr} variant="primary">
                                                        {intr}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </Field>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/profile')}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            disabled={loading || !user}
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
