import { useEffect, useState } from "react";
import Header from "../components/Header";
import api from "../api/http";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Field, Input, Textarea, Button, Badge, PhotoUpload } from "../components/ui";


const NewItem = props => {
    const [itemName, setItemName]           = useState('');
    const [description, setDescription]     = useState('');
    const [condition, setCondition]         = useState('');
    const [category, setCategory]           = useState('');
    const [price, setPrice]                 = useState('');
    const [image, setImage]                 = useState();
    const [imageDisplay, setImageDisplay]   = useState('');
    const [userID, setUserID]               = useState('');
    const [user, setUser]                   = useState('');
    const [error, setError]                 = useState('');
    const [loading, setLoading]             = useState(false);
    const conditions = ['New', 'Like new', 'Lightly used', 'Used'];
    const categories  = ['For Fun', 'Vehicle', 'Apparel', 'Tickets', 
                            'Furniture', 'Electronics', 'Books/ notes', 'Miscellaneous'];
    const navigate = useNavigate();



    useEffect(() =>{
        if(!user && !userID){
            api.get('/api/auth/user').then( res => {
                setUser(res.data);
                api.get('/api/profile/' + res.data).then( res => {
                    setUserID(res.data._id)
                })
            })
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const priceValue = price === '' ? 0 : parseFloat(price);
        
        if(itemName && description && category && priceValue && user && userID && image){
            setLoading(true);
            setError('');
            var formData = new FormData();
            formData.append("file", image);
            api.post('/api/file/upload', formData,{
                headers: {
                'Content-Type': 'multipart/form-data'
                }
            }).then( res => {
                let imageUrl = res.data; 
                const data = {
                    name:itemName,
                    description:description,
                    category:category,
                    username:user,
                    price:priceValue,
                    owner:user,
                    to_sell:false,
                    to_trade:false,
                    image:imageUrl,
                }
    
                api.post('/api/profile/item/new', data).then(res => {
                    if(res.data == 'Item added succesfully'){
                        navigate('/profile', { replace:true })
                    }
                }).catch(err => {
                    setError('Failed to create listing. Please try again.');
                    setLoading(false);
                });
            }).catch(err => {
                setError('Failed to upload image. Please try again.');
                setLoading(false);
            });
        }else{
            setError('Please fill out all required fields')
        }
    };

    const handleImageSelect = (file) => {
        setImage(file);
        setImageDisplay(URL.createObjectURL(file));
    };

    const handleImageRemove = () => {
        setImage(null);
        setImageDisplay('');
    };

    const handlePriceChange = (e) => {
        const value = e.target.value;
        // Allow empty string or valid number
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setPrice(value);
        }
    };
    return(
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Header/>
            <div className="container py-8 max-w-6xl">
                <PageHeader 
                    title="Create listing"
                    subtitle="Add a new item to your marketplace"
                />
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Photo Upload */}
                        <div className="space-y-6">
                            <PhotoUpload
                                image={image}
                                imageDisplay={imageDisplay}
                                onImageSelect={handleImageSelect}
                                onImageRemove={handleImageRemove}
                            />
                        </div>

                        {/* Right Column - Form Details */}
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

                    {/* Form Actions */}
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
                                onClick={() => navigate('/profile')}
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
                                Create listing
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default NewItem;