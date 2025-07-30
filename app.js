if (!window.React || !window.React.useState || !window.ReactDOM || !window.transformersPipeline || !window.heic2any) {
    console.error('Required libraries not loaded:', {
        React: !!window.React,
        React_useState: !!window.React && !!window.React.useState,
        ReactDOM: !!window.ReactDOM,
        transformersPipeline: !!window.transformersPipeline,
        heic2any: !!window.heic2any
    });
    document.getElementById('root').innerHTML = `
        <div class="text-center text-red-500 p-4">
            <p>Error: Required libraries (React, ReactDOM, Transformers.js, or heic2any) failed to load.</p>
            <p>Please clear your browser cache, refresh the page, or check the console (F12) for details.</p>
        </div>`;
} else {
    console.log('All dependencies loaded, initializing App');
    function App() {
        const [images, setImages] = React.useState([]);
        const [resultImages, setResultImages] = React.useState([]);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState(null);
        const [model, setModel] = React.useState(null);
        const canvasRef = React.useRef(null);

        React.useEffect(() => {
            async function loadModel() {
                try {
                    setLoading(true);
                    console.log('Loading BRIA-RMBG-v1.4 model...');
                    const pipeline = await window.transformersPipeline(
                        'image-segmentation',
                        'briaai/RMBG-1.4',
                        { cache: 'force-cache', device: window.navigator.gpu ? 'webgpu' : 'wasm' }
                    );
                    setModel(pipeline);
                    console.log('Model loaded successfully.');
                } catch (err) {
                    console.error('Model loading error:', err);
                    setError(`Failed to load AI model: ${err.message}. Please ensure WebGPU/WebAssembly support and try again. Check the console (F12) for details.`);
                } finally {
                    setLoading(false);
                }
            }
            loadModel();
        }, []);

        const convertHeicToPng = async (file) => {
            if (['image/heic', 'image/heif'].includes(file.type)) {
                try {
                    const converted = await window.heic2any({ blob: file, toType: 'image/png' });
                    return new File([converted], file.name.replace(/\.(heic|heif)$/i, '.png'), { type: 'image/png' });
                } catch (err) {
                    console.error('HEIC conversion error:', err);
                    throw new Error(`Failed to convert ${file.name}: ${err.message}`);
                }
            }
            return file;
        };

        const handleImageUpload = async (event) => {
            setError(null);
            const files = Array.from(event.target.files);
            const validFiles = [];

            for (const file of files) {
                if (!['image/jpeg', 'image/png', 'image/heic', 'image/heif'].includes(file.type)) {
                    setError('Please upload valid image files (JPG, PNG, HEIC, HEIF).');
                    return;
                }
                try {
                    const convertedFile = await convertHeicToPng(file);
                    validFiles.push(convertedFile);
                } catch (err) {
                    setError(err.message);
                    return;
                }
            }

            setImages(validFiles);
            setResultImages([]);
            console.log('Uploaded files:', validFiles.map(f => f.name));
        };

        const removeBackground = async () => {
            if (!model) {
                setError('AI model not loaded. Please wait and try again.');
                return;
            }
            if (images.length === 0) {
                setError('Please upload at least one image.');
                return;
            }

            setLoading(true);
            setError(null);
            const results = [];
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            for (const image of images) {
                try {
                    console.log(`Processing ${image.name}...`);
                    const img = new Image();
                    img.src = URL.createObjectURL(image);
                    await new Promise(resolve => img.onload = resolve);

                    canvas.width = img.width;
                    canvas.height = img.height;

                    const mask = await model(img.src);
                    if (!mask || !mask.data) {
                        throw new Error('Invalid mask data from model.');
                    }

                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const maskData = mask.data;

                    for (let i = 0; i < imageData.data.length; i += 4) {
                        if (!maskData[i / 4]) {
                            imageData.data[i + 3] = 0; // Set alpha to 0 for background
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);

                    const blob = await new Promise(resolve =>
                        canvas.toBlob(resolve, 'image/png')
                    );
                    results.push({ url: URL.createObjectURL(blob), name: image.name });
                    console.log(`Processed ${image.name} successfully.`);
                } catch (err) {
                    console.error(`Error processing ${image.name}:`, err);
                    setError(`Error processing ${image.name}: ${err.message}`);
                }
            }

            setResultImages(results);
            setLoading(false);
        };

        const fineTune = (index, action, x, y, size) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const result = resultImages[index];
            const img = new Image();
            img.src = result.url;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = action === 'restore' ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 0)';
                ctx.fill();
                canvas.toBlob(blob => {
                    const newUrl = URL.createObjectURL(blob);
                    setResultImages(prev =>
                        prev.map((item, i) =>
                            i === index ? { ...item, url: newUrl } : item
                        )
                    );
                }, 'image/png');
            };
        };

        const downloadImages = () => {
            resultImages.forEach((result, index) => {
                const link = document.createElement('a');
                link.href = result.url;
                link.download = `bg-removed-${result.name}`;
                link.click();
            });
        };

        return React.createElement(
            'div',
            { className: 'container mx-auto p-4 max-w-3xl' },
            React.createElement(
                'h1',
                { className: 'text-3xl font-bold text-center mb-6 text-gray-800' },
                'Offline Image Background Remover'
            ),
            React.createElement(
                'div',
                { className: 'bg-white p-6 rounded-lg shadow-md' },
                React.createElement(
                    'div',
                    { className: 'mb-4' },
                    React.createElement(
                        'label',
                        { className: 'block text-gray-700 mb-2' },
                        'Upload Images (JPG, PNG, HEIC, HEIF)'
                    ),
                    React.createElement('input', {
                        type: 'file',
                        accept: 'image/jpeg,image/png,image/heic,image/heif',
                        multiple: true,
                        onChange: handleImageUpload,
                        className: 'w-full p-2 border border-gray-300 rounded'
                    })
                ),
                error && React.createElement('p', { className: 'text-red-500 mb-4' }, error),
                images.length > 0 && React.createElement(
                    'div',
                    { className: 'mb-4' },
                    React.createElement('p', { className: 'text-gray-700 mb-2' }, 'Preview:'),
                    React.createElement(
                        'div',
                        { className: 'grid grid-cols-2 gap-4' },
                        images.map((img, index) =>
                            React.createElement('img', {
                                key: index,
                                src: URL.createObjectURL(img),
                                alt: `Preview ${index}`,
                                className: 'max-w-full h-auto rounded'
                            })
                        )
                    )
                ),
                React.createElement(
                    'button',
                    {
                        onClick: removeBackground,
                        disabled: loading || !model,
                        className: `w-full py-2 px-4 rounded text-white font-semibold ${
                            loading || !model ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`
                    },
                    loading ? 'Processing...' : model ? 'Remove Background' : 'Loading AI Model...'
                ),
                resultImages.length > 0 && React.createElement(
                    'div',
                    { className: 'mt-4' },
                    React.createElement('p', { className: 'text-gray-700 mb-2' }, 'Results (Click to erase, Restore button to undo):'),
                    React.createElement(
                        'div',
                        { className: 'grid grid-cols-2 gap-4' },
                        resultImages.map((result, index) =>
                            React.createElement(
                                'div',
                                { key: index, className: 'relative' },
                                React.createElement('img', {
                                    src: result.url,
                                    alt: `Result ${index}`,
                                    className: 'max-w-full h-auto rounded',
                                    onClick: e => {
                                        const rect = e.target.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;
                                        fineTune(index, 'erase', x, y, 10);
                                    }
                                }),
                                React.createElement(
                                    'button',
                                    {
                                        onClick: e => {
                                            const rect = e.target.previousSibling.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const y = e.clientY - rect.top;
                                            fineTune(index, 'restore', x, y, 10);
                                        },
                                        className: 'absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded'
                                    },
                                    'Restore'
                                )
                            )
                        )
                    ),
                    React.createElement(
                        'button',
                        {
                            onClick: downloadImages,
                            className: 'w-full mt-4 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded font-semibold'
                        },
                        'Download All Transparent PNGs'
                    )
                )
            ),
            React.createElement('canvas', { ref: canvasRef, style: { display: 'none' } }),
            React.createElement(
                'p',
                { className: 'text-center text-gray-600 mt-4' },
                'Powered by ',
                React.createElement('a', { href: 'https://huggingface.co/briaai/RMBG-1.4', className: 'text-blue-600 hover:underline' }, 'BRIA-RMBG-v1.4'),
                ' and ',
                React.createElement('a', { href: 'https://huggingface.co/docs/transformers.js', className: 'text-blue-600 hover:underline' }, 'Transformers.js')
            )
        );
    }

    try {
        ReactDOM.render(App(), document.getElementById('root'));
    } catch (err) {
        console.error('ReactDOM render error:', err);
        document.getElementById('root').innerHTML = `
            <div class="text-center text-red-500 p-4">
                <p>Error initializing application: ${err.message}</p>
                <p>Check the console (F12) for details.</p>
            </div>`;
    }
}