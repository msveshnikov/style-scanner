import { useState, useEffect } from 'react';

function Insights() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            return () => URL.revokeObjectURL(previewUrl);
        } else {
            setPreview(null);
        }
    }, [file]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select an image file.');
            return;
        }
        setError(null);
        const formData = new FormData();
        formData.append('image', file);
        setLoading(true);
        try {
            const response = await fetch('/api/insights', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error('Failed to fetch insights.');
            }
            const data = await response.json();
            setInsights(data);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div
            className="insights-container"
            style={{
                padding: '20px',
                maxWidth: '800px',
                margin: '0 auto'
            }}
        >
            <h1 style={{ textAlign: 'center' }}>Style Insights</h1>
            <form onSubmit={handleSubmit} style={{ marginBottom: '20px', textAlign: 'center' }}>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <div style={{ margin: '10px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ padding: '10px 20px', fontSize: '16px' }}
                    >
                        {loading ? 'Analyzing...' : 'Get Insights'}
                    </button>
                </div>
            </form>
            {error && (
                <div style={{ color: 'red', textAlign: 'center', marginBottom: '20px' }}>
                    {error}
                </div>
            )}
            {preview && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <img
                        src={preview}
                        alt="Preview"
                        style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                </div>
            )}
            {insights && (
                <div className="insights-results">
                    {Object.entries(insights).map(([model, result]) => (
                        <div
                            key={model}
                            style={{
                                marginBottom: '20px',
                                border: '1px solid #ccc',
                                padding: '10px',
                                borderRadius: '8px'
                            }}
                        >
                            <h3 style={{ textTransform: 'uppercase' }}>{model}</h3>
                            <p>{result}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Insights;
