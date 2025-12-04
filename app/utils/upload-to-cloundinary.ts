// utils/uploadToCloudinary.ts

/**
 * Uploads a File object directly to Cloudinary using an unsigned upload preset.
 * @param file The File object (the receipt image).
 * @returns The secure URL of the uploaded image.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
    // Retrieve public variables
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary public configuration (CLOUD_NAME or UPLOAD_PRESET) is missing.");
    }

    // 1. Create FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    
    // 2. Upload the file to the generic Cloudinary API endpoint
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary Upload Error:', errorData);
        throw new Error(`Cloudinary upload failed: ${errorData.error.message || response.statusText}`);
    }

    // 3. Extract the secure URL
    const data = await response.json();
    return data.secure_url;
}