import { useState, useEffect } from 'react';

function Insights() {
    const [insights, setInsights] = useState(null);


    // useEffect(() => {
    //     if (file) {
    //         const previewUrl = URL.createObjectURL(file);
    //         setPreview(previewUrl);
    //         return () => URL.revokeObjectURL(previewUrl);
    //     } else {
    //         setPreview(null);
    //     }
    // }, [file]);

    return (
        <div
            className="insights-container"
            style={{
                padding: '20px',
                maxWidth: '800px',
                margin: '0 auto'
            }}
        >
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
