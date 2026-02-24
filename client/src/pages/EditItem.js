import { useEffect, useState } from "react";
import api from "../api/http";
import { useNavigate, useParams } from "react-router-dom";
import { normalizeImageUrl } from "../utils/imageUtils";
import { PageHeader, Card, Field, Input, Textarea, Button, Badge, PhotoUpload } from "../components/ui";

const EditItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [itemName, setItemName]           = useState('');
    const [description, setDescription]     = useState('');
    const [condition, setCondition]         = useState('');
    const [category, setCategory]           = useState('');
    const [price, setPrice]                 = useState('');
    const [image, setImage]                 = useState(null);
    const [imageDisplay, setImageDisplay]   = useState('');
    const [existingImage, setExistingImage] = useState('');
    const [user, setUser]                   = useState('');
    const [error, setError]                 = useState('');
    const [loading, setLoading]             = useState(false);
    const [pageLoading, setPageLoading]     = useState(true);

    const conditions = ['New', 'Like new', 'Lightly used', 'Used'];
    const categories = ['Dorm & Home', 'Electronics', 'Books', 'Apparel', 'Tickets & Events', 'Other'];

    useEffect(() => {
        async function loadItem() {
            try {
                const authRes = await api.get('/api/auth/user');
                const currentUser = authRes.data;
                setUser(currentUser);

                const itemRes = await api.get(`/api/item/${id}`);
                const item = itemRes.data;

                if (!item || item.owner !== currentUser) {
                    navigate('/store', { replace: true });
                    return;
                }

                setItemName(item.name || '');
                setDescription(item.description || '');
                setCondition(item.condition || '');
                setCategory(item.category || '');
                setPrice(item.price != null ? String(item.price) : '');
                setExistingImage(item.image || '');
                setImageDisplay(item.image ? normalizeImageUrl(item.image) : '');
            } catch (err) {
                console.error('[EDIT ITEM] Failed to load item:', err);
                navigate('/store', { replace: true });
            } finally {
                setPageLoading(false);
            }
        }
        loadItem();
    }, [id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const priceValue = price === '' ? 0 : parseFloat(price);

        if (!itemName || !description || !category || !condition || !priceValue) {
            setError('Please fill out all required fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let imageUrl = existingImage;

            if (image) {
                const formData = new FormData();
                formData.append("file", image);
                const uploadRes = await api.post('/api/file/upload', formData);
                imageUrl = uploadRes.data?.url || uploadRes.data?.path || uploadRes.data;
            }

            const data = {
                name: itemName,
                description,
                category,
                condition,
                price: priceValue,
                image: imageUrl,
            };

            await api.put(`/api/item/edit/${id}`, data);
            navigate(`/store/item/${id}`, { replace: true });
        } catch (err) {
            console.error('[EDIT ITEM] Failed to update listing:', err.response?.data || err.message);
            setError('Failed to update listing. Please try again.');
            setLoading(false);
        }
    };

    const handleImageSelect = (file) => {
        setImage(file);
        setImageDisplay(URL.createObjectURL(file));
    };

    const handleImageRemove = () => {
        setImage(null);
        setImageDisplay(existingImage ? normalizeImageUrl(existingImage) : '');
    };

    const handlePriceChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setPrice(value);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)]">
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
                            <p className="text-base text-[var(--color-muted)]">Loading listing...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <div className="container py-8 max-w-6xl">
                <PageHeader
                    title="Edit listing"
                    subtitle="Update your item details"
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <PhotoUpload
                                image={image}
                                imageDisplay={imageDisplay}
                                onImageSelect={handleImageSelect}
                                onImageRemove={handleImageRemove}
                            />
                        </div>

                        <div className="space-y-6">
                            <Card>
                                <div className="space-y-6">
                                    <Field label="Item name" required error={error && !itemName ? 'Item name is required' : ''}>
                                        <Input
                                            value={itemName}
                                            onChange={(e) => setItemName(e.target.value)}
                                            placeholder="e.g., Vintage Penn Sweatshirt"
                                            error={error && !itemName}
                                        />
                                    </Field>

                                    <Field label="Description" required error={error && !description ? 'Description is required' : ''}>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe your item..."
                                            rows={6}
                                            error={error && !description}
                                        />
                                    </Field>

                                    <Field label="Price" required error={error && (!price || parseFloat(price) === 0) ? 'Price is required' : ''}>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">$</span>
                                            <Input
                                                type="text"
                                                value={price}
                                                onChange={handlePriceChange}
                                                placeholder="25"
                                                className="pl-8"
                                                error={error && (!price || parseFloat(price) === 0)}
                                            />
                                        </div>
                                    </Field>

                                    <Field label="Condition" required error={error && !condition ? 'Condition is required' : ''}>
                                        <div className="flex flex-wrap gap-3">
                                            {conditions.map(cond => (
                                                <label
                                                    key={cond}
                                                    className="flex items-center cursor-pointer group"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="condition"
                                                        value={cond}
                                                        checked={condition === cond}
                                                        onChange={() => setCondition(cond)}
                                                        className="sr-only"
                                                    />
                                                    <Badge
                                                        variant={condition === cond ? 'primary' : 'default'}
                                                        className="cursor-pointer transition-all group-hover:scale-105"
                                                    >
                                                        {cond}
                                                    </Badge>
                                                </label>
                                            ))}
                                        </div>
                                        {error && !condition && (
                                            <p className="text-sm text-[var(--color-danger)] mt-2" role="alert">
                                                Condition is required
                                            </p>
                                        )}
                                    </Field>

                                    <Field label="Category" required error={error && !category ? 'Category is required' : ''}>
                                        <div className="grid grid-cols-2 gap-3">
                                            {categories.map(cat => (
                                                <label
                                                    key={cat}
                                                    className="flex items-center cursor-pointer group"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={category === cat}
                                                        onChange={() => setCategory(category === cat ? '' : cat)}
                                                        className="w-4 h-4 mr-2 text-[var(--color-primary)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)] focus:ring-2"
                                                    />
                                                    <span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                                                        {cat}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        {error && !category && (
                                            <p className="text-sm text-[var(--color-danger)] mt-2" role="alert">
                                                Category is required
                                            </p>
                                        )}
                                    </Field>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                        {error && (
                            <div className="text-sm text-[var(--color-danger)]" role="alert">
                                {error}
                            </div>
                        )}
                        <div className="ml-auto flex gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate(`/store/item/${id}`)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                loading={loading}
                                disabled={loading}
                            >
                                Save changes
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditItem;
